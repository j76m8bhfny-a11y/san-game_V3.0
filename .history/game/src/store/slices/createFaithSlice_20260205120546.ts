import { StateCreator } from 'zustand';
import { FaithID, FaithState, GameState } from '@/types/schema';
import faithsData from '@/assets/data/faiths.json';
// ✅ 新增：导入规则配置
import faithRules from '@/assets/data/rules/faithRules.json';
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
    // ✅ 清洗：初始等级从配置读取 (原为 1)
    level: faithRules.defaults.initialLevel,
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
      // ✅ 修复 Bug 1 & 清洗：使用配置定义的交易分类扣款
      if (faithConfig.joinCost.gold && faithConfig.joinCost.gold > 0) {
         // 使用断言或确保类型匹配
         const category = faithRules.defaults.transactionCategories.join;
         state.addTransaction(category, -faithConfig.joinCost.gold, `入教奉献: ${faithConfig.name}`);
      }

      set({ 
        faith: { 
          id: faithId, 
          level: faithRules.defaults.initialLevel, // ✅ 保持一致
          hasPerformedRite: false 
        } 
      });
      state.addNotification(faithRules.text.joinSuccess.replace('{name}', faithConfig.name), 'success');
    } else {
      state.addNotification(check.message, 'error');
    }

    return check;
  },

  leaveFaith: () => {
    const state = get();
    set({ 
      faith: { 
        id: FaithID.NONE, 
        level: faithRules.defaults.initialLevel, 
        hasPerformedRite: false 
      } 
    });
    state.addNotification(faithRules.text.leaveSuccess, 'warning');
  },

  performFaithRite: () => {
    const state = get() as GameState & { addTransaction: Function; modifyStats: Function; addNotification: Function };
    
    if (state.faith.hasPerformedRite) {
      state.addNotification(faithRules.text.riteDone, 'info');
      return { success: false, message: "今日已完成" };
    }

    const faithConfig = faithsData.find(f => f.id === state.faith.id);
    if (!faithConfig) return { success: false, message: faithRules.text.noFaith };

    // 计算结果
    const result = calculateRiteOutcome(faithConfig as any, state);

    if (result.success) {
       // 1. 应用普通属性更新 (HP/SAN)
       if (result.updates && result.updates.vitality) {
           // 使用深度合并逻辑 (这里简化为 modifyStats 调用，如果结构复杂可能需要手动 set)
           // logic/faith.ts 返回的是最终值 (target value)。
           // 为了兼容，我们直接 set vitality
           set((prev: any) => ({
               vitality: {
                   ...prev.vitality,
                   metrics: { ...prev.vitality.metrics, ...result.updates.vitality.metrics }
               }
           }));
           
           // TODO: 如果有 identity.points 更新 (如业力)，也应在此处处理
           if (result.updates.vitality.identity) {
              set((prev: any) => ({
                 vitality: {
                     ...prev.vitality,
                     identity: { ...prev.vitality.identity, ...result.updates.vitality.identity }
                 }
              }));
           }
       }

       // ✅ 修复 Bug 2 & 清洗：处理金钱变动并记账
       if (result.goldChange !== 0) {
           // 根据正负值自动选择配置中的交易类型
           const type = result.goldChange > 0 
              ? faithRules.defaults.transactionCategories.riteIncome 
              : faithRules.defaults.transactionCategories.riteCost;
              
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