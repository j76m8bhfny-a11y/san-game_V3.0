import { StateCreator } from 'zustand';
import { FaithID, FaithState, GameState } from '@/types/schema';
import faithsData from '@/assets/data/faiths.json';
import { checkJoinCondition, calculateRiteOutcome } from '@/logic/faith';

export interface FaithSlice {
  faith: FaithState;
  
  joinFaith: (faithId: FaithID) => { success: boolean; message: string };
  leaveFaith: () => void;
  performFaithRite: () => { success: boolean; message: string };
  resetDailyFaith: () => void;
}

export const createFaithSlice: StateCreator<any, [], [], FaithSlice> = (set, get) => ({
  faith: {
    id: FaithID.NONE,
    level: 1,
    hasPerformedRite: false
  },

  joinFaith: (faithId) => {
    if (faithId === FaithID.NONE) return { success: false, message: "" };
    
    // 获取全量 Store 以访问 addTransaction
    const state = get() as GameState & { addTransaction: Function; addNotification: Function };
    const faithConfig = faithsData.find(f => f.id === faithId);
    
    if (!faithConfig) return { success: false, message: "配置缺失" };

    // 逻辑检查
    const check = checkJoinCondition(faithConfig as any, state);
    
    if (check.success) {
      // ✅ 修复 Bug 1: 使用 addTransaction 扣款
      if (faithConfig.joinCost.gold && faithConfig.joinCost.gold > 0) {
         state.addTransaction('MISC', -faithConfig.joinCost.gold, `入教奉献: ${faithConfig.name}`);
      }

      set({ faith: { id: faithId, level: 1, hasPerformedRite: false } });
      state.addNotification(`已加入: ${faithConfig.name}`, 'success');
    } else {
      state.addNotification(check.message, 'error');
    }

    return check;
  },

  leaveFaith: () => {
    const state = get();
    set({ faith: { id: FaithID.NONE, level: 1, hasPerformedRite: false } });
    state.addNotification("你背弃了信仰。", 'warning');
  },

  performFaithRite: () => {
    const state = get() as GameState & { addTransaction: Function; modifyStats: Function; addNotification: Function };
    
    if (state.faith.hasPerformedRite) {
      state.addNotification("今日已完成仪式，请明日再来。", 'info');
      return { success: false, message: "今日已完成" };
    }

    const faithConfig = faithsData.find(f => f.id === state.faith.id);
    if (!faithConfig) return { success: false, message: "无信仰" };

    // 计算结果
    const result = calculateRiteOutcome(faithConfig as any, state);

    if (result.success) {
       // 1. 应用普通属性更新 (HP/SAN)
       if (result.updates && result.updates.vitality) {
           // 使用深度合并逻辑 (这里简化为 modifyStats 调用，如果结构复杂可能需要手动 set)
           // 假设 result.updates.vitality.metrics 包含最终值，我们需要计算差值吗？
           // logic/faith.ts 返回的是最终值 (target value)。
           // 为了兼容，我们直接 set vitality
           set((prev: any) => ({
               vitality: {
                   ...prev.vitality,
                   metrics: { ...prev.vitality.metrics, ...result.updates.vitality.metrics }
               }
           }));
       }

       // ✅ 修复 Bug 2: 处理金钱变动并记账
       if (result.goldChange !== 0) {
           const type = result.goldChange > 0 ? 'INCOME' : 'MISC';
           state.addTransaction(type, result.goldChange, `信仰仪式: ${faithConfig.rite.name}`);
       }

       // 3. 标记为已完成
       set((prev: any) => ({
           faith: { ...prev.faith, hasPerformedRite: true }
       }));

       state.addNotification(result.message, 'success');
       return { success: true, message: result.message };
    } else {
       state.addNotification(result.message, 'error');
       return { success: false, message: result.message };
    }
  },

  resetDailyFaith: () => {
      set((state: any) => ({
          faith: { ...state.faith, hasPerformedRite: false }
      }));
  }
});