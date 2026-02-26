/**
 * Steam Store - Zustand 状态管理
 * 
 * 管理所有 Steam 相关的状态和操作
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { invoke } from '@tauri-apps/api/core';
import type {
  SteamState,
  SteamInitResult,
  SteamPlayerInfo,
  Achievement,
  SaveFileInfo,
  SaveData,
  GameState,
  RichPresenceData,
} from '../../types/steam';

// ==================== 状态类型 ====================

interface SteamStoreState {
  // 基础状态
  steamState: SteamState;
  isInitialized: boolean;
  isConnected: boolean;
  playerInfo: SteamPlayerInfo | null;
  errorMessage: string | null;

  // 成就状态
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  pendingUnlocks: string[]; // 等待解锁的成就队列

  // 云存档状态
  cloudSaves: SaveFileInfo[];
  cloudQuota: { used: number; total: number } | null;
  isCloudEnabled: boolean;
  lastSyncTime: number | null;

  // Rich Presence 状态
  currentGameState: GameState;
}

interface SteamStoreActions {
  // 基础操作
  initialize: () => Promise<SteamInitResult>;
  refreshState: () => Promise<void>;
  shutdown: () => Promise<void>;

  // 成就操作
  loadAchievements: () => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  isAchievementUnlocked: (achievementId: string) => Promise<boolean>;
  checkAndUnlockAchievements: (gameState: CheckableGameState) => void;

  // 云存档操作
  loadCloudSaves: () => Promise<void>;
  saveToCloud: (data: SaveData) => Promise<void>;
  loadFromCloud: (slot: number) => Promise<SaveData>;
  deleteCloudSave: (slot: number) => Promise<void>;
  checkCloudExists: (slot: number) => Promise<boolean>;
  syncCloud: () => Promise<void>;

  // Rich Presence 操作
  updateRichPresence: (data: RichPresenceData) => Promise<void>;
  setGameState: (state: GameState, gameDay: number, socialClass: string) => Promise<void>;
  setEventState: (eventName: string, gameDay: number, socialClass: string) => Promise<void>;
  clearRichPresence: () => Promise<void>;

  // 本地状态更新
  setSteamState: (state: SteamState) => void;
  setConnected: (connected: boolean) => void;
  setPlayerInfo: (info: SteamPlayerInfo | null) => void;
  setError: (error: string | null) => void;
  markAchievementUnlocked: (achievementId: string, timestamp: number) => void;
  setCurrentGameState: (state: GameState) => void;
}

// 用于成就检查的游戏状态
export interface CheckableGameState {
  gameDay: number;
  socialClass: string;
  hasDied: boolean;
  triggeredEvents: string[];
  money: number;
  isInEvent: boolean;
  eventId?: string;
}

// ==================== Store 创建 ====================

export const useSteamStore = create<SteamStoreState & SteamStoreActions>()(
  immer((set, get) => ({
    // 初始状态
    steamState: 'Uninitialized',
    isInitialized: false,
    isConnected: false,
    playerInfo: null,
    errorMessage: null,

    achievements: [],
    unlockedAchievements: new Set(),
    pendingUnlocks: [],

    cloudSaves: [],
    cloudQuota: null,
    isCloudEnabled: false,
    lastSyncTime: null,

    currentGameState: 'MainMenu',

    // ==================== 基础操作 ====================

    initialize: async () => {
      try {
        set((state) => {
          state.steamState = 'Initializing';
          state.errorMessage = null;
        });

        const result: SteamInitResult = await invoke('steam_initialize');

        set((state) => {
          state.steamState = result.state;
          state.isConnected = result.success;
          state.isInitialized = true;
          state.errorMessage = result.error_message;

          if (result.success && result.steam_id && result.player_name) {
            state.playerInfo = {
              steamId: result.steam_id,
              playerName: result.player_name,
            };
          }
        });

        // 如果连接成功，加载成就和云存档信息
        if (result.success) {
          await get().loadAchievements();
          await get().loadCloudSaves();
        }

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        set((state) => {
          state.errorMessage = errorMsg;
          state.steamState = { Failed: { reason: errorMsg } };
          state.isInitialized = true;
        });
        throw error;
      }
    },

    refreshState: async () => {
      try {
        const isConnected: boolean = await invoke('steam_is_connected');
        set((state) => {
          state.isConnected = isConnected;
        });

        if (isConnected) {
          const playerInfo: [string, string] | null = await invoke('steam_get_player_info');
          if (playerInfo) {
            set((state) => {
              state.playerInfo = {
                steamId: playerInfo[0],
                playerName: playerInfo[1],
              };
            });
          }
        }
      } catch (error) {
        console.error('刷新 Steam 状态失败:', error);
      }
    },

    shutdown: async () => {
      try {
        await invoke('steam_shutdown');
        set((state) => {
          state.steamState = 'Uninitialized';
          state.isConnected = false;
          state.playerInfo = null;
        });
      } catch (error) {
        console.error('关闭 Steam 失败:', error);
      }
    },

    // ==================== 成就操作 ====================

    loadAchievements: async () => {
      try {
        const achievements: Achievement[] = await invoke('steam_get_achievements');
        const unlockedSet = new Set(
          achievements.filter((a) => a.unlocked).map((a) => a.id)
        );

        set((state) => {
          state.achievements = achievements;
          state.unlockedAchievements = unlockedSet;
        });
      } catch (error) {
        console.error('加载成就失败:', error);
      }
    },

    unlockAchievement: async (achievementId: string) => {
      // 如果已经解锁，跳过
      if (get().unlockedAchievements.has(achievementId)) {
        return;
      }

      try {
        await invoke('steam_unlock_achievement', { achievementId });

        // 更新本地状态
        const now = Math.floor(Date.now() / 1000);
        set((state) => {
          state.unlockedAchievements.add(achievementId);
          const achievement = state.achievements.find((a) => a.id === achievementId);
          if (achievement) {
            achievement.unlocked = true;
            achievement.unlock_time = now;
          }
        });

        console.log('成就解锁:', achievementId);
      } catch (error) {
        console.error('解锁成就失败:', achievementId, error);
      }
    },

    isAchievementUnlocked: async (achievementId: string) => {
      // 先检查本地缓存
      if (get().unlockedAchievements.has(achievementId)) {
        return true;
      }

      try {
        const unlocked: boolean = await invoke('steam_is_achievement_unlocked', {
          achievementId,
        });
        return unlocked;
      } catch (error) {
        console.error('检查成就状态失败:', achievementId, error);
        return false;
      }
    },

    checkAndUnlockAchievements: (gameState: CheckableGameState) => {
      const { unlockAchievement, unlockedAchievements } = get();
      const checks: { id: string; condition: boolean }[] = [
        // 第一课：第一次死亡
        { id: 'ACH_FIRST_BLOOD', condition: gameState.hasDied },
        // 一周战士：生存 7 天
        { id: 'ACH_SURVIVE_7D', condition: gameState.gameDay >= 7 },
        // 月度生存者：生存 30 天
        { id: 'ACH_SURVIVE_30D', condition: gameState.gameDay >= 30 },
        // 破茧成蝶：脱离 homeless
        {
          id: 'ACH_HOMELESS_ESCAPE',
          condition: gameState.socialClass !== 'homeless',
        },
        // 第一桶金：资产 100 万
        {
          id: 'ACH_CAPITALIST_FIRST_MILLION',
          condition: gameState.money >= 1_000_000,
        },
      ];

      checks.forEach(({ id, condition }) => {
        if (condition && !unlockedAchievements.has(id)) {
          unlockAchievement(id);
        }
      });
    },

    // ==================== 云存档操作 ====================

    loadCloudSaves: async () => {
      try {
        const results = await Promise.all([
          invoke<boolean>('steam_cloud_is_enabled'),
          invoke<SaveFileInfo[]>('steam_cloud_list_saves'),
          invoke<[number, number]>('steam_cloud_get_quota'),
        ]);

        const isEnabled = results[0];
        const saves = results[1];
        const quota = results[2];

        set((state) => {
          state.isCloudEnabled = isEnabled;
          state.cloudSaves = saves;
          state.cloudQuota = { used: quota[0], total: quota[1] };
        });
      } catch (error) {
        console.error('加载云存档信息失败:', error);
      }
    },

    saveToCloud: async (data: SaveData) => {
      try {
        await invoke('steam_cloud_save', { data });
        set((state) => {
          state.lastSyncTime = Date.now();
        });
        // 刷新存档列表
        await get().loadCloudSaves();
      } catch (error) {
        console.error('保存到云端失败:', error);
        throw error;
      }
    },

    loadFromCloud: async (slot: number) => {
      try {
        const data: SaveData = await invoke('steam_cloud_load', { slot });
        return data;
      } catch (error) {
        console.error('从云端加载失败:', error);
        throw error;
      }
    },

    deleteCloudSave: async (slot: number) => {
      try {
        await invoke('steam_cloud_delete', { slot });
        await get().loadCloudSaves();
      } catch (error) {
        console.error('删除云端存档失败:', error);
        throw error;
      }
    },

    checkCloudExists: async (slot: number) => {
      try {
        const exists: boolean = await invoke('steam_cloud_exists', { slot });
        return exists;
      } catch (error) {
        console.error('检查存档存在失败:', error);
        return false;
      }
    },

    syncCloud: async () => {
      try {
        await invoke('steam_cloud_force_sync');
        await get().loadCloudSaves();
        set((state) => {
          state.lastSyncTime = Date.now();
        });
      } catch (error) {
        console.error('同步云端存档失败:', error);
        throw error;
      }
    },

    // ==================== Rich Presence 操作 ====================

    updateRichPresence: async (data: RichPresenceData) => {
      try {
        await invoke('steam_rich_presence_update', { data });
        set((state) => {
          state.currentGameState = data.state;
        });
      } catch (error) {
        // Rich Presence 不是关键功能，错误不抛出
        console.error('更新 Rich Presence 失败:', error);
      }
    },

    setGameState: async (state: GameState, gameDay: number, socialClass: string) => {
      try {
        await invoke('steam_rich_presence_set_game', {
          state,
          gameDay,
          socialClass,
        });
        set((store) => {
          store.currentGameState = state;
        });
      } catch (error) {
        console.error('设置游戏状态失败:', error);
      }
    },

    setEventState: async (eventName: string, gameDay: number, socialClass: string) => {
      try {
        await invoke('steam_rich_presence_set_event', {
          eventName,
          gameDay,
          socialClass,
        });
        set((store) => {
          store.currentGameState = 'InEvent';
        });
      } catch (error) {
        console.error('设置事件状态失败:', error);
      }
    },

    clearRichPresence: async () => {
      try {
        await invoke('steam_rich_presence_clear');
      } catch (error) {
        console.error('清除 Rich Presence 失败:', error);
      }
    },

    // ==================== 本地状态更新 ====================

    setSteamState: (steamState: SteamState) => {
      set((state) => {
        state.steamState = steamState;
      });
    },

    setConnected: (connected: boolean) => {
      set((state) => {
        state.isConnected = connected;
      });
    },

    setPlayerInfo: (info: SteamPlayerInfo | null) => {
      set((state) => {
        state.playerInfo = info;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.errorMessage = error;
      });
    },

    markAchievementUnlocked: (achievementId: string, timestamp: number) => {
      set((state) => {
        state.unlockedAchievements.add(achievementId);
        const achievement = state.achievements.find((a) => a.id === achievementId);
        if (achievement) {
          achievement.unlocked = true;
          achievement.unlock_time = timestamp;
        }
      });
    },

    setCurrentGameState: (gameState: GameState) => {
      set((state) => {
        state.currentGameState = gameState;
      });
    },
  }))
);

// ==================== 选择器 Hooks ====================

export const useSteamConnected = () => useSteamStore((state) => state.isConnected);
export const useSteamPlayerInfo = () => useSteamStore((state) => state.playerInfo);
export const useSteamAchievements = () => useSteamStore((state) => state.achievements);
export const useSteamUnlockedCount = () =>
  useSteamStore((state) => state.unlockedAchievements.size);
export const useSteamCloudSaves = () => useSteamStore((state) => state.cloudSaves);
export const useSteamCloudEnabled = () => useSteamStore((state) => state.isCloudEnabled);
