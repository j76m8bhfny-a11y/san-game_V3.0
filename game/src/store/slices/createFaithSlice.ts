import { StateCreator } from 'zustand';
import { FaithID, FaithState, GameState } from '@/types/schema';
import faithsData from '@/assets/data/faiths.json'; // 导入 JSON
import { checkJoinCondition, calculateRiteOutcome } from '@/logic/faith';

export interface FaithSlice {
  faith: FaithState;
  
  joinFaith: (faithId: FaithID) => { success: boolean; message: string };
  leaveFaith: () => void;
  performFaithRite: () => { success: boolean; message: string };
  resetDailyFaith: () => void;
}

export const createFaithSlice: StateCreator<any, [], [], FaithSlice> = (set, get) => ({
  // 初始状态
  faith: {
    id: FaithID.NONE,
    level: 1,
    hasPerformedRite: false
  },

  joinFaith: (faithId) => {
    if (faithId === FaithID.NONE) return { success: false, message: "" };
    
    // 从 JSON 找数据
    const faithConfig = faithsData.find(f => f.id === faithId);
    if (!faithConfig) return { success: false, message: "配置缺失" };

    // 调用逻辑层检查
    const check = checkJoinCondition(faithConfig as any, get() as GameState);
    
    if (check.success) {
      // 扣除入教费 (如果是金币)
      if (faithConfig.joinCost.gold) {
         set((state: any) => ({ gold: state.gold - faithConfig.joinCost.gold! }));
      }
      // 更新信仰状态
      set({ faith: { id: faithId, level: 1, hasPerformedRite: false } });
    }

    return check;
  },

  leaveFaith: () => {
    set({ faith: { id: FaithID.NONE, level: 1, hasPerformedRite: false } });
  },

  performFaithRite: () => {
    const state = get() as GameState;
    if (state.faith.hasPerformedRite) {
      return { success: false, message: "今日已完成仪式。" };
    }

    const faithConfig = faithsData.find(f => f.id === state.faith.id);
    if (!faithConfig) return { success: false, message: "无信仰" };

    // 调用逻辑层计算结果
    const result = calculateRiteOutcome(faithConfig as any, state);

    if (result.success || result.updates) {
       // 合并更新 (updates 可能包含 gold, hp, san, points)
       set((prev: any) => ({
         ...prev,
         ...result.updates,
         faith: { ...prev.faith, hasPerformedRite: true }
       }));
    }

    return { success: result.success, message: result.message };
  },

  resetDailyFaith: () => {
    set((state: any) => ({
      faith: { ...state.faith, hasPerformedRite: false }
    }));
  }
});