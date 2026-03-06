import { StateCreator } from 'zustand';
import {
  PlayerClass,
  RegionID,
  ActiveHousing,
  DMVQueueState,
  ActiveLease
} from '@/types/schema';
import { StoreState } from '@/types/store';
import { Config } from '@/config';

export const CLASS_INITIAL_STATS = Config.vitality.classes as Record<PlayerClass, any>;

// 数组长度限制常量
const MAX_HISTORY_LENGTH = 100;  // 历史记录最大条数

// 2. 初始状态
const INITIAL_PLAYER_STATE = {
  currentRegion: RegionID.Slums,
  // 注意: activeJobs 和 activeInsurances 已在 vitality 内部管理，不在此处存储
  activeHousing: null as ActiveHousing | null,  // 单一房产，初始为 null
  dmvQueue: null as DMVQueueState | null, // [NEW] DMV排队状态
  activeLease: null as ActiveLease | null, // [NEW] 租赁状态

  inventory: [] as string[],
  history: [] as string[],
  unlockedArchives: [] as string[],
  achievedEndings: [] as string[],
  ending: null as string | null,
};

/**
 * 限制数组长度，保留最新的N条
 */
function limitArrayLength<T>(arr: T[], maxLength: number): T[] {
  if (arr.length <= maxLength) return arr;
  return arr.slice(arr.length - maxLength);
}

export interface PlayerSlice {
  // --- State ---
  currentRegion: RegionID;
  // 注意: activeJobs 和 activeInsurances 在 vitality 中管理
  activeHousing: ActiveHousing | null;  // 单一房产，可为 null
  dmvQueue: DMVQueueState | null; // [NEW] DMV排队状态
  activeLease: ActiveLease | null; // [NEW] 租赁状态

  inventory: string[];
  history: string[];
  unlockedArchives: string[];
  achievedEndings: string[];
  ending: string | null;

  // --- Actions ---
  /**
   * 更新玩家状态（浅合并）
   * ⚠️ 注意：此方法只合并第一层属性，嵌套对象会被完全覆盖
   * 如需更新深层属性（如 vitality.metrics），请使用专门的 Slice 方法
   */
  updatePlayerStats: (updates: Partial<PlayerSlice>) => void;
  triggerEnding: (endingId: string) => void;
  resetPlayerState: () => void;
  
  setRegion: (region: RegionID) => void;
}

export const createPlayerSlice: StateCreator<StoreState, [], [], PlayerSlice> = (set, get) => ({
  ...INITIAL_PLAYER_STATE,

  /**
   * 安全更新 PlayerSlice 的状态字段
   * ⚠️ 只允许更新 PlayerSlice 定义的字段，禁止传入 vitality、bank 等其他 Slice 的字段
   */
  updatePlayerStats: (updates) => set((state: any) => {
    // 数组长度限制检查
    if (updates.history && updates.history.length > MAX_HISTORY_LENGTH) {
      updates.history = limitArrayLength(updates.history, MAX_HISTORY_LENGTH);
      console.warn(`[PlayerSlice] history超过限制，已截断至${MAX_HISTORY_LENGTH}条`);
    }
    // 定义 PlayerSlice 允许的字段白名单
    // 注意: activeInsurances 已从 PlayerSlice 移除，统一使用 vitality.activeInsurances
    const allowedKeys = [
      'currentRegion', 'activeHousing', 
      'dmvQueue', 'activeLease', // [NEW]
      'inventory', 'history', 'unlockedArchives', 'achievedEndings', 'ending'
    ];
    
    const merged = { ...state };
    for (const key in updates) {
      // 安全检查：只允许更新 PlayerSlice 的字段
      if (!allowedKeys.includes(key)) {
        console.warn(`[PlayerSlice] 禁止通过 updatePlayerStats 更新 '${key}'，请使用对应的 Slice 方法`);
        continue;
      }
      
      let value = (updates as any)[key];
      
      // 对history数组进行长度限制
      if (key === 'history' && Array.isArray(value) && value.length > MAX_HISTORY_LENGTH) {
        value = limitArrayLength(value, MAX_HISTORY_LENGTH);
      }
      
      // 如果是对象且不是数组，则浅合并
      if (value && typeof value === 'object' && !Array.isArray(value) &&
          merged[key] && typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
    return merged;
  }),

  triggerEnding: (endingId) => {
    const { achievedEndings } = get();
    const newAchieved = achievedEndings.includes(endingId) 
      ? achievedEndings 
      : [...achievedEndings, endingId];
      
    set({ 
      ending: endingId,
      achievedEndings: newAchieved
    });
  },

  resetPlayerState: () => {
    const savedEndings = get().achievedEndings;
    set({
      ...INITIAL_PLAYER_STATE,
      achievedEndings: savedEndings
    });
  },

  setRegion: (region) => {
    const state = get();
    
    // 检查车辆区域限制
    const hasJunkVehicle = state.inventory.includes('CAR_JUNK');
    if (hasJunkVehicle && (region === RegionID.Suburbs || region === RegionID.Downtown)) {
      // 车辆限制：破车无法进入中产或资本家区域
      if (state.addNotification) {
        state.addNotification('你的破车无法进入此区域，请先出售或更换车辆', 'warning');
      }
      return;
    }
    
    set({ currentRegion: region });
  },
});
