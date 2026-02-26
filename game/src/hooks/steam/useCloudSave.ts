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
  /** 从云端加载 */
  load: (slot: number) => Promise<SaveData | null>;
  /** 删除云端存档 */
  deleteSave: (slot: number) => Promise<void>;
  /** 检查存档是否存在 */
  exists: (slot: number) => Promise<boolean>;
  /** 强制同步 */
  sync: () => Promise<void>;
}

export function useCloudSave(options: UseCloudSaveOptions = {}): UseCloudSaveReturn {
  const { autoSaveInterval = 5 * 60 * 1000, enableAutoSave = true } = options;
  
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

  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
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
        ...gameState,
        slot,
        version: '1.0.0',
        created_at: Date.now() / 1000,
        modified_at: Date.now() / 1000,
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

  const load = useCallback(async (slot: number): Promise<SaveData | null> => {
    if (!isConnected || !isCloudEnabled) {
      console.warn('Steam 云存档未启用，无法加载');
      return null;
    }

    setIsLoading(true);

    try {
      const data = await storeLoadFromCloud(slot);
      console.log('已从云端加载:', slot);
      return data;
    } catch (error) {
      console.error('从云端加载失败:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isCloudEnabled, storeLoadFromCloud]);

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
  };
}
