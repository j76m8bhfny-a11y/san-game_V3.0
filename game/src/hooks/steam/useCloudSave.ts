/**
 * useCloudSave Hook
 * 
 * 处理云存档的自动保存和加载
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { useSteamStore } from '../../store/steam/useSteamStore';
import type { SaveData } from '../../types/steam';

interface UseCloudSaveOptions {
  /** 自动保存间隔（毫秒），默认 5 分钟 */
  autoSaveInterval?: number;
  /** 是否启用自动保存 */
  enableAutoSave?: boolean;
  /** 冲突解决策略：'local' | 'cloud' | 'newest'，默认 'local' */
  conflictStrategy?: 'local' | 'cloud' | 'newest';
}

interface UseCloudSaveReturn {
  /** 是否正在保存 */
  isSaving: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 上次同步时间 */
  lastSyncTime: number | null;
  /** 云端存储使用量 */
  storageUsage: { used: number; total: number } | null;
  /** 保存到云端 */
  save: (slot: number, gameState: Omit<SaveData, 'slot' | 'version' | 'created_at' | 'modified_at'>) => Promise<void>;
  /** 从云端加载（带冲突解决） */
  load: (slot: number) => Promise<SaveData | null>;
  /** 删除云端存档 */
  deleteSave: (slot: number) => Promise<void>;
  /** 检查存档是否存在 */
  exists: (slot: number) => Promise<boolean>;
  /** 强制同步 */
  sync: () => Promise<void>;
  /** 解决存档冲突 */
  resolveConflict: (slot: number, localSave: SaveData, cloudSave: SaveData) => Promise<SaveData>;
}

export function useCloudSave(options: UseCloudSaveOptions = {}): UseCloudSaveReturn {
  const { 
    autoSaveInterval = 5 * 60 * 1000, 
    enableAutoSave = true,
    conflictStrategy = 'local' // 默认本地优先
  } = options;
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const isConnected = useSteamStore((state) => state.isConnected);
  const isCloudEnabled = useSteamStore((state) => state.isCloudEnabled);
  const cloudQuota = useSteamStore((state) => state.cloudQuota);
  const lastSyncTime = useSteamStore((state) => state.lastSyncTime);
  
  const storeSaveToCloud = useSteamStore((state) => state.saveToCloud);
  const storeLoadFromCloud = useSteamStore((state) => state.loadFromCloud);
  const storeDeleteCloudSave = useSteamStore((state) => state.deleteCloudSave);
  const storeCheckCloudExists = useSteamStore((state) => state.checkCloudExists);
  const storeSyncCloud = useSteamStore((state) => state.syncCloud);
  const storeLoadCloudSaves = useSteamStore((state) => state.loadCloudSaves);

  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSaveRef = useRef<SaveData | null>(null);

  // 加载云存档信息
  useEffect(() => {
    if (isConnected && isCloudEnabled) {
      storeLoadCloudSaves();
    }
  }, [isConnected, isCloudEnabled, storeLoadCloudSaves]);

  const save = useCallback(async (
    slot: number,
    gameState: Omit<SaveData, 'slot' | 'version' | 'created_at' | 'modified_at'>
  ): Promise<void> => {
    if (!isConnected || !isCloudEnabled) {
      console.warn('Steam 云存档未启用，无法保存');
      return;
    }

    setIsSaving(true);

    try {
      const saveData: SaveData = {
        ...gameState as any,
        slot,
        version: '1.0.0',
        saveTime: Date.now(),
        modifiedAt: Date.now(),
      };

      await storeSaveToCloud(saveData);
      console.log('已保存到云端:', slot);
    } catch (error) {
      console.error('保存到云端失败:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isConnected, isCloudEnabled, storeSaveToCloud]);

  /**
   * 解决存档冲突
   * 根据策略选择使用本地还是云端存档
   */
  const resolveConflict = useCallback(async (
    slot: number, 
    localSave: SaveData, 
    cloudSave: SaveData
  ): Promise<SaveData> => {
    const localTime = localSave.saveTime || localSave.modifiedAt || 0;
    const cloudTime = cloudSave.saveTime || cloudSave.modifiedAt || 0;
    
    console.log(`☁️ 存档冲突 [槽位 ${slot}]:`, {
      local: new Date(localTime).toLocaleString(),
      cloud: new Date(cloudTime).toLocaleString(),
      strategy: conflictStrategy
    });
    
    let resolved: SaveData;
    
    switch (conflictStrategy) {
      case 'cloud':
        // 云端优先：使用云端存档
        resolved = cloudSave;
        console.log('✅ 已选择云端存档');
        break;
        
      case 'newest':
        // 最新优先：比较时间戳
        resolved = localTime > cloudTime ? localSave : cloudSave;
        console.log(`✅ 已选择${localTime > cloudTime ? '本地' : '云端'}存档（最新）`);
        break;
        
      case 'local':
      default:
        // 本地优先（默认）：使用本地存档，并上传到云端覆盖
        resolved = localSave;
        console.log('✅ 已选择本地存档，将上传到云端');
        // 上传本地存档覆盖云端
        await storeSaveToCloud(localSave);
        break;
    }
    
    return resolved;
  }, [conflictStrategy, storeSaveToCloud]);

  /**
   * 从云端加载（带冲突检测和解决）
   */
  const load = useCallback(async (slot: number): Promise<SaveData | null> => {
    if (!isConnected || !isCloudEnabled) {
      console.warn('Steam 云存档未启用，无法加载');
      return null;
    }

    setIsLoading(true);

    try {
      // 获取云端存档
      const cloudSave = await storeLoadFromCloud(slot);
      
      if (!cloudSave) {
        console.log('云端存档不存在:', slot);
        return null;
      }
      
      // 检查本地存档
      const localStorageKey = 'pixel-life-storage';
      const localRaw = localStorage.getItem(localStorageKey);
      
      if (localRaw) {
        const localSave = JSON.parse(localRaw) as SaveData;
        const localTime = localSave.saveTime || localSave.modifiedAt || 0;
        const cloudTime = cloudSave.saveTime || cloudSave.modifiedAt || 0;
        
        // 如果时间戳不同，存在冲突
        if (Math.abs(localTime - cloudTime) > 5000) { // 5秒容差
          console.warn(`☁️ 检测到存档冲突 [槽位 ${slot}]`);
          const resolved = await resolveConflict(slot, localSave, cloudSave);
          return resolved;
        }
      }
      
      console.log('已从云端加载:', slot);
      return cloudSave;
    } catch (error) {
      console.error('从云端加载失败:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isCloudEnabled, storeLoadFromCloud, resolveConflict]);

  const deleteSave = useCallback(async (slot: number): Promise<void> => {
    if (!isConnected || !isCloudEnabled) {
      console.warn('Steam 云存档未启用，无法删除');
      return;
    }

    try {
      await storeDeleteCloudSave(slot);
      console.log('已删除云端存档:', slot);
    } catch (error) {
      console.error('删除云端存档失败:', error);
      throw error;
    }
  }, [isConnected, isCloudEnabled, storeDeleteCloudSave]);

  const exists = useCallback(async (slot: number): Promise<boolean> => {
    if (!isConnected || !isCloudEnabled) {
      return false;
    }

    return storeCheckCloudExists(slot);
  }, [isConnected, isCloudEnabled, storeCheckCloudExists]);

  const sync = useCallback(async (): Promise<void> => {
    if (!isConnected || !isCloudEnabled) {
      console.warn('Steam 云存档未启用，无法同步');
      return;
    }

    try {
      await storeSyncCloud();
      console.log('云端同步完成');
    } catch (error) {
      console.error('云端同步失败:', error);
      throw error;
    }
  }, [isConnected, isCloudEnabled, storeSyncCloud]);

  // 自动保存（预留，需要外部提供游戏状态）
  useEffect(() => {
    if (!enableAutoSave || !isConnected || !isCloudEnabled) return;

    autoSaveRef.current = setInterval(() => {
      if (pendingSaveRef.current) {
        storeSaveToCloud(pendingSaveRef.current);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [enableAutoSave, isConnected, isCloudEnabled, autoSaveInterval, storeSaveToCloud]);

  return {
    isSaving,
    isLoading,
    lastSyncTime,
    storageUsage: cloudQuota,
    save,
    load,
    deleteSave,
    exists,
    sync,
    resolveConflict,
  };
}
