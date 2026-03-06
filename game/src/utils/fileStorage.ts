/**
 * Tauri 文件存储封装
 * 用于替代 localStorage，支持大容量存档
 */

import { invoke } from '@tauri-apps/api/core';

export interface SaveFileInfo {
  name: string;
  size: number;
  timestamp: number;
  exists_in_cloud: boolean;
}

export interface FileStorageAPI {
  /** 保存存档到指定槽位 */
  save: (slot: number, data: unknown) => Promise<void>;
  /** 从指定槽位加载存档 */
  load: <T>(slot: number) => Promise<T | null>;
  /** 删除指定槽位的存档 */
  delete: (slot: number) => Promise<void>;
  /** 获取所有存档列表 */
  list: () => Promise<SaveFileInfo[]>;
  /** 检查存档是否存在 */
  exists: (slot: number) => Promise<boolean>;
  /** 导出存档为文件（供玩家下载备份） */
  export: (slot: number, filename: string) => Promise<void>;
  /** 从文件导入存档 */
  import: (filepath: string) => Promise<unknown>;
  /** 备份存档 */
  backup: (slot: number, backupName: string) => Promise<void>;
}

/** 检测是否在 Tauri 环境 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
};

/** 文件存储 API 实现 */
export const fileStorage: FileStorageAPI = {
  async save(slot: number, data: unknown): Promise<void> {
    if (!isTauri()) {
      throw new Error('文件存储仅在 Tauri 环境中可用');
    }
    const jsonString = JSON.stringify(data, null, 2);
    await invoke('save_to_file', { slot, data: jsonString });
  },

  async load<T>(slot: number): Promise<T | null> {
    if (!isTauri()) {
      throw new Error('文件存储仅在 Tauri 环境中可用');
    }
    try {
      const jsonString = await invoke<string>('load_from_file', { slot });
      return JSON.parse(jsonString) as T;
    } catch (error: any) {
      if (error?.includes('存档不存在') || error?.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  async delete(slot: number): Promise<void> {
    if (!isTauri()) {
      throw new Error('文件存储仅在 Tauri 环境中可用');
    }
    await invoke('delete_save_file', { slot });
  },

  async list(): Promise<SaveFileInfo[]> {
    if (!isTauri()) {
      return [];
    }
    return await invoke('list_save_files');
  },

  async exists(slot: number): Promise<boolean> {
    try {
      await this.load(slot);
      return true;
    } catch {
      return false;
    }
  },

  async export(_slot: number, _filename: string): Promise<void> {
    // TODO: 使用 Tauri dialog API 实现导出
    console.warn('导出功能暂未实现');
  },

  async import(_filepath: string): Promise<unknown> {
    // TODO: 使用 Tauri dialog API 实现导入
    console.warn('导入功能暂未实现');
    return null;
  },

  /**
   * 备份存档
   * @param slot 存档槽位
   * @param backupName 备份名称
   */
  async backup(slot: number, backupName: string): Promise<void> {
    if (!isTauri()) {
      throw new Error('备份功能仅在 Tauri 环境中可用');
    }
    await invoke('backup_save', { slot, backupName });
  }
};

/** 迁移标记键名 */
const MIGRATION_FLAG_KEY = 'pixel-life-migrated-to-file';

/**
 * 检查是否已经迁移过
 */
function hasMigrated(): boolean {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

/**
 * 设置迁移标记
 */
function setMigratedFlag(): void {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

/**
 * 从 localStorage 迁移存档到文件存储
 * 优化版：在存储适配器初始化时执行，避免重复逻辑
 * @returns 迁移后的数据（如果有），否则返回 null
 */
export async function migrateFromLocalStorage(): Promise<unknown | null> {
  if (!isTauri()) return null;
  
  // 如果已经迁移过，直接返回 null
  if (hasMigrated()) return null;

  const localKey = 'pixel-life-storage';
  const localData = localStorage.getItem(localKey);
  
  if (!localData) {
    // 没有旧存档，标记为已迁移（避免将来检查）
    setMigratedFlag();
    return null;
  }

  try {
    // 检查文件存档是否已存在（不应该发生，除非玩家手动复制）
    const exists = await fileStorage.exists(0);
    if (exists) {
      console.log('文件存档已存在，跳过迁移');
      localStorage.removeItem(localKey);
      setMigratedFlag();
      return null;
    }

    // 解析旧存档
    console.log('正在从 localStorage 迁移存档到文件...');
    const parsed = JSON.parse(localData);
    
    // 保存到文件
    await fileStorage.save(0, parsed);
    
    // 设置迁移标记
    setMigratedFlag();
    
    // 清理 localStorage（保留标记）
    localStorage.removeItem(localKey);
    
    console.log('✅ 存档迁移完成');
    return parsed;
  } catch (error) {
    console.error('❌ 存档迁移失败:', error);
    // 迁移失败不设置标记，下次重试
    return null;
  }
}

/**
 * 强制重新迁移（用于调试）
 */
export async function forceRemigrate(): Promise<void> {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
  await migrateFromLocalStorage();
}

/** 缓存的迁移数据 */
let migratedData: unknown | null = null;
let migrationChecked = false;

/**
 * 获取存储适配器（用于 Zustand persist）
 * 自动检测环境并返回合适的存储实现
 * 
 * 优化点：
 * 1. Tauri 环境首次启动时自动从 localStorage 迁移
 * 2. 避免 onRehydrateStorage 中的重复迁移逻辑
 * 3. 使用迁移标记防止重复迁移
 */
export function getStorageAdapter() {
  if (isTauri()) {
    return {
      getItem: async (_name: string): Promise<string | null> => {
        // 首次调用时检查是否需要迁移
        if (!migrationChecked) {
          migrationChecked = true;
          migratedData = await migrateFromLocalStorage();
        }
        
        // 如果有迁移的数据，直接返回（避免再次从文件读取）
        if (migratedData) {
          const data = JSON.stringify(migratedData);
          migratedData = null; // 清除缓存
          return data;
        }
        
        // 正常从文件读取
        const data = await fileStorage.load(0);
        return data ? JSON.stringify(data) : null;
      },
      setItem: async (_name: string, value: string): Promise<void> => {
        await fileStorage.save(0, JSON.parse(value));
      },
      removeItem: async (_name: string): Promise<void> => {
        await fileStorage.delete(0);
      },
    };
  }

  // 浏览器环境回退到 localStorage
  return {
    getItem: (name: string): string | null => localStorage.getItem(name),
    setItem: (name: string, value: string): Promise<void> => {
      localStorage.setItem(name, value);
      return Promise.resolve();
    },
    removeItem: (name: string): Promise<void> => {
      localStorage.removeItem(name);
      return Promise.resolve();
    },
  };
}
