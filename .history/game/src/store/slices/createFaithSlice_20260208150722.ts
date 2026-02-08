import { StateCreator } from 'zustand';
import { FaithID, FaithState, GameState, FaithDebuff } from '@/types/schema';
import { StoreState } from '@/types/store';
import faithsData from '@/assets/data/faiths.json';
import faithRules from '@/assets/data/rules/faithRules.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';
import { checkJoinCondition, calculateRiteOutcome } from '@/logic/faith';

export interface FaithSlice {
  faith: FaithState;
  
  joinFaith: (faithId: FaithID) => { success: boolean; message: string };
  /** 请求退出信仰，返回确认信息（不实际执行） */
  requestLeaveFaith: () => { canLeave: boolean; confirmation?: { title: string; message: string }; penalty?: unknown };
  /** 确认并执行退出信仰 */
  confirmLeaveFaith: () => { success: boolean; message: string };
  performFaithRite: () => { success: boolean; message: string };
  resetDailyFaith: () => void;
  /** 减少 debuff 持续时间（在 turn 结算时调用） */
  tickFaithDebuffs: () => void;
}

export const createFaithSlice: StateCreator<StoreState, [], [], FaithSlice> = (set, get) => ({
  faith: {
    id: FaithID.NONE,
    level: faithRules.defaults.initialLevel,
    hasPerformedRite: false,
    debuffs: [],
    bannedFaiths: []
  },

  joinFaith: (faithId) => {
    if (faithId === FaithID.NONE) return { success: false, message: "" };
    
    const state = get() as GameState & { addTransaction: Function; addNotification: Function };
    
    // 检查是否已经在该信仰中
    if (state.faith.id === faithId) {
      return { success: false, message: "你已经在此信仰中了。" };
    }
    
    const faithConfig = faithsData.find(f => f.id === faithId);
    
    if (!faithConfig) return { success: false, message: "配置缺失" };

    // 检查是否被封禁（防御性处理旧存档）
    const bannedFaiths = state.faith.bannedFaiths || [];
    if (bannedFaiths.includes(faithId)) {
      return { success: false, message: "你被此信仰永久放逐，无法再次加入。" };
    }

    // 逻辑检查
    const check = checkJoinCondition(faithConfig as any, state);
    
    if (check.success) {
      if (faithConfig.joinCost.gold && faithConfig.joinCost.gold > 0) {
         const category = faithRules.defaults.transactionCategories.join;
         const txResult = state.addTransaction(category, -faithConfig.joinCost.gold, `入教奉献: ${faithConfig.name}`);
         if (!txResult.success) {
           return { success: false, message: "资金不足以支付入教费用。" };
         }
      }

      set({ 
        faith: { 
          ...state.faith,
          id: faithId, 
          level: faithRules.defaults.initialLevel,
          hasPerformedRite: false,
          // 确保新字段存在（旧存档兼容）
          debuffs: state.faith.debuffs || [],
          bannedFaiths: state.faith.bannedFaiths || []
        } 
      });
      state.addNotification(faithRules.text.joinSuccess.replace('{name}', faithConfig.name), 'success');
    } else {
      state.addNotification(check.message, 'error');
    }

    return check;
  },

  requestLeaveFaith: () => {
    const state = get();
    const currentFaithId = state.faith.id;
    
    if (currentFaithId === FaithID.NONE) {
      return { canLeave: false };
    }

    const penaltyConfig = (faithRules.leavePenalties as any)[currentFaithId];
    if (!penaltyConfig) {
      // 没有配置惩罚的信仰，直接允许退出
      return { 
        canLeave: true, 
        confirmation: {
          title: faithRules.text.leaveConfirmTitle,
          message: "确定要退出当前信仰吗？"
        }
      };
    }

    return {
      canLeave: true,
      confirmation: {
        title: faithRules.text.leaveConfirmTitle,
        message: penaltyConfig.confirmMessage
      },
      penalty: penaltyConfig
    };
  },

  confirmLeaveFaith: () => {
    const state = get() as GameState & { 
      addNotification: Function;
      modifyStats: Function;
    };
    const currentFaithId = state.faith.id;
    
    if (currentFaithId === FaithID.NONE) {
      return { success: false, message: "当前没有信仰" };
    }

    const penaltyConfig = (faithRules.leavePenalties as any)[currentFaithId];
    const faithConfig = faithsData.find(f => f.id === currentFaithId);
    const faithName = faithConfig?.name || currentFaithId;

    // 应用惩罚
    if (penaltyConfig) {
      // 1. SAN 变化
      if (penaltyConfig.sanChange !== undefined) {
        const { minStat } = SYSTEM_RULES.caps;
        const currentSan = state.vitality.metrics.san;
        const newSan = Math.max(minStat, Math.min(state.vitality.metrics.maxSan, currentSan + penaltyConfig.sanChange));
        state.modifyStats({ san: newSan });
      }

      // 2. 最大 HP 减少（永久）
      if (penaltyConfig.maxHpChange !== undefined) {
        const currentMaxHp = state.vitality.metrics.maxHp;
        // 使用硬编码 1 而非 minStat：保证玩家退出信仰后至少保留 1 HP 上限，不会立即死亡
        const newMaxHp = Math.max(1, currentMaxHp + penaltyConfig.maxHpChange);
        const currentHp = state.vitality.metrics.hp;
        // 如果当前 HP 超过新的上限，需要同步调整
        const newHp = Math.min(currentHp, newMaxHp);
        state.modifyStats({ maxHp: newMaxHp, hp: newHp });
      }

      // 3. 添加 Debuff（避免重复，同名 debuff 只刷新持续时间）
      const currentDebuffs = state.faith.debuffs || [];
      let newDebuffs = [...currentDebuffs];
      if (penaltyConfig.debuff) {
        const existingIndex = newDebuffs.findIndex(d => d.id === penaltyConfig.debuff.id);
        const debuff: FaithDebuff = {
          id: penaltyConfig.debuff.id,
          name: penaltyConfig.debuff.name,
          duration: penaltyConfig.debuff.duration,
          remainingTurns: penaltyConfig.debuff.duration,
          effect: penaltyConfig.debuff.effect
        };
        
        if (existingIndex >= 0) {
          // 刷新已有 debuff 的持续时间
          newDebuffs = newDebuffs.map((d, i) => i === existingIndex ? debuff : d);
        } else {
          newDebuffs = [...newDebuffs, debuff];
        }
      }

      // 4. 永久封禁（使用 Set 去重）
      const currentBanned = state.faith.bannedFaiths || [];
      const newBannedFaiths = penaltyConfig.permanentBan
        ? [...new Set([...currentBanned, currentFaithId])]
        : [...currentBanned];

      // 执行退出
      set({
        faith: {
          id: FaithID.NONE,
          level: faithRules.defaults.initialLevel,
          hasPerformedRite: false,
          debuffs: newDebuffs,
          bannedFaiths: newBannedFaiths
        }
      });

      // 发送通知
      const description = penaltyConfig.description || faithRules.text.leaveSuccess;
      state.addNotification(`${faithName}: ${description}`, 'warning');
      
      return { 
        success: true, 
        message: `${faithRules.text.leaveSuccess} ${description}` 
      };
    }

    // 无惩罚配置，直接退出（保留 debuffs 和 bannedFaiths）
    set({
      faith: {
        ...state.faith,
        id: FaithID.NONE,
        level: faithRules.defaults.initialLevel,
        hasPerformedRite: false,
        debuffs: state.faith.debuffs || [],
        bannedFaiths: state.faith.bannedFaiths || []
      }
    });
    state.addNotification(faithRules.text.leaveSuccess, 'warning');
    
    return { success: true, message: faithRules.text.leaveSuccess };
  },

  performFaithRite: () => {
    const state = get() as GameState & { 
      addTransaction: Function; 
      modifyStats: Function; 
      addNotification: Function;
      updateIdentityPoints?: (points: { red?: number; wolf?: number; old?: number }) => void;
    };
    
    if (state.faith.hasPerformedRite) {
      state.addNotification(faithRules.text.riteDone, 'info');
      return { success: false, message: "今日已完成" };
    }

    const faithConfig = faithsData.find(f => f.id === state.faith.id);
    if (!faithConfig) return { success: false, message: faithRules.text.noFaith };

    const result = calculateRiteOutcome(faithConfig as any, state);

    if (result.success) {
       // ✅ 先处理金钱支出（如果是支出）
       if (typeof result.goldChange === 'number' && result.goldChange < 0) {
           const txResult = state.addTransaction(
               faithRules.defaults.transactionCategories.riteCost, 
               result.goldChange, 
               `信仰仪式: ${faithConfig.rite.name}`
           );
           if (!txResult.success) {
             return { success: false, message: "资金不足以支付仪式费用。" };
           }
       }
       
       // 再应用其他效果（HP/SAN等）
       if (result.updates?.vitality?.metrics && 
           Object.keys(result.updates.vitality.metrics).length > 0) {
           state.modifyStats(result.updates.vitality.metrics);
       }
       
       if (result.updates?.vitality?.identity?.points && state.updateIdentityPoints) {
           state.updateIdentityPoints(result.updates.vitality.identity.points);
       }

       // 处理金钱收入
       if (typeof result.goldChange === 'number' && result.goldChange > 0) {
           state.addTransaction(
               faithRules.defaults.transactionCategories.riteIncome, 
               result.goldChange, 
               `信仰仪式: ${faithConfig.rite.name}`
           );
       }

       set((prev: any) => ({
           faith: { 
             ...prev.faith, 
             hasPerformedRite: true,
             // 确保新字段存在（旧存档兼容）
             debuffs: prev.faith.debuffs || [],
             bannedFaiths: prev.faith.bannedFaiths || []
           }
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
          faith: { 
            ...state.faith, 
            hasPerformedRite: false,
            // 确保新字段存在（旧存档兼容）
            debuffs: state.faith.debuffs || [],
            bannedFaiths: state.faith.bannedFaiths || []
          }
      }));
  },

  tickFaithDebuffs: () => {
    set((state: any) => {
      const currentDebuffs = state.faith?.debuffs || [];
      const updatedDebuffs = currentDebuffs
        .map((debuff: FaithDebuff) => ({
          ...debuff,
          remainingTurns: debuff.remainingTurns - 1
        }))
        .filter((debuff: FaithDebuff) => debuff.remainingTurns > 0);

      return {
        faith: {
          ...state.faith,
          debuffs: updatedDebuffs,
          // 显式保留封禁列表
          bannedFaiths: state.faith?.bannedFaiths || []
        }
      };
    });
  }
});
