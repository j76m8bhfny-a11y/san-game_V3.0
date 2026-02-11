import { StateCreator } from 'zustand';
import { 
  FaithID, 
  FaithState, 
  GameState, 
  FaithDebuff, 
  FaithData,
  NoviceActionType 
} from '@/types/schema';
import { StoreState } from '@/types/store';
import { VitalitySlice } from './createVitalitySlice';

// 引入数据与规则
import faithsDataUntyped from '@/assets/data/faiths.json';
import faithRulesUntyped from '@/assets/data/rules/faithRules.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// 引入逻辑辅助函数
import { calculateRiteOutcome } from '@/logic/faith';
import type { FaithRules, LeavePenalty } from '@/types/faithRules';

// 类型断言
const faithsData = faithsDataUntyped as FaithData[];
const faithRules = faithRulesUntyped as any; // 使用 any 以适配新的 noviceMechanics 结构

export interface FaithSlice {
  faith: FaithState;
  
  // ✅ 新核心方法：执行新手/无信仰行为
  performNoviceAction: (actionType: NoviceActionType) => { 
    success: boolean; 
    message: string; 
    unlocked?: boolean; 
    unlockedFaithId?: string 
  };

  // 现有方法
  joinFaith: (faithId: FaithID) => { success: boolean; message: string };
  requestLeaveFaith: () => { canLeave: boolean; confirmation?: { title: string; message: string }; penalty?: unknown };
  confirmLeaveFaith: () => { success: boolean; message: string };
  performFaithRite: () => { success: boolean; message: string };
  resetDailyFaith: () => void;
  tickFaithDebuffs: () => void;
}

export const createFaithSlice: StateCreator<StoreState, [], [], FaithSlice> = (set, get) => ({
  faith: {
    id: FaithID.NONE,
    level: faithRules.defaults?.initialLevel || 1,
    hasPerformedRite: false,
    debuffs: [],
    bannedFaiths: [],
    // ✅ 新增：行为追踪状态
    behaviorState: {
      lastAction: null,
      currentStreak: 0,
      hasReceivedInvitation: false
    }
  },

  /**
   * 执行新手行为 (奉献/互助/献祭/拒绝)
   * 完全由 faithRules.json 驱动逻辑
   */
  performNoviceAction: (actionType: NoviceActionType) => {
    const state = get() as GameState & VitalitySlice & FaithSlice;
    const { vitality, faith } = state;

    // 1. 获取配置 (拒绝硬编码)
    const mechanics = faithRules.noviceMechanics;
    const config = mechanics?.[actionType];

    if (!config) {
      console.error(`[Faith] 未知的动作类型: ${actionType}`);
      return { success: false, message: "未知的行为" };
    }

    // 2. 资源检查 (Cost Check)
    // 2.1 金钱检查
    const goldCost = config.cost?.gold || 0;
    if (goldCost > 0 && vitality.metrics.gold < goldCost) {
      return { success: false, message: "资金不足以进行此行为" };
    }

    // 2.2 HP 检查 (确保不会自杀，或根据设计允许自杀但这里做个低保)
    const hpCost = config.cost?.hp || 0;
    if (hpCost > 0 && vitality.metrics.hp <= hpCost) {
      return { success: false, message: "你的身体状况过于虚弱，无法支撑此行为" };
    }

    // 2.3 物品检查 (如：拒绝需要宣言)
    if (config.requiredItemId) {
      const hasItem = state.inventory.includes(config.requiredItemId);
      if (!hasItem) {
        return { success: false, message: "缺少必要的物品，无法进行此行为" };
      }
    }

    // 3. 执行消耗与奖励 (Apply Effects)
    
    // 扣除金钱
    if (goldCost > 0) {
      // 动态获取当前区域的文案作为账单描述
      const regionFlavor = config.regionFlavor?.[state.currentRegion] || config.regionFlavor?.["DEFAULT"];
      const desc = regionFlavor?.label ? `行为: ${regionFlavor.label}` : `信仰行为: ${actionType}`;
      
      const tx = state.addTransaction('MISC', -goldCost, desc);
      if (!tx.success) return { success: false, message: "交易失败" };
    }

    // 计算 HP/SAN/Gold 净值变动
    // 备注：rewards 里的数值是增量
    const hpChange = -(config.cost?.hp || 0) + (config.reward?.hp || 0);
    const sanChange = -(config.cost?.san || 0) + (config.reward?.san || 0);
    const goldReward = config.reward?.gold || 0;

    const updates: any = {};
    if (hpChange !== 0) updates.hp = vitality.metrics.hp + hpChange;
    if (sanChange !== 0) updates.san = vitality.metrics.san + sanChange;

    // 应用属性变更
    if (Object.keys(updates).length > 0) {
      state.modifyStats(updates);
    }

    // 发放金钱奖励
    if (goldReward > 0) {
      state.addTransaction('INCOME', goldReward, `行为回馈`);
    }

    // 4. 处理连击逻辑 (Streak Logic)
    const { behaviorState } = faith;
    let newStreak = 1;
    let isInterrupted = false;

    if (behaviorState.lastAction === actionType) {
      // 动作相同，连击 +1
      newStreak = behaviorState.currentStreak + 1;
    } else {
      // 动作不同，打断！
      if (behaviorState.currentStreak > 0) {
        isInterrupted = true;
      }
      newStreak = 1; // 重置为 1
    }

    // 更新行为状态
    set((prev: StoreState) => ({
      faith: {
        ...prev.faith,
        behaviorState: {
          ...prev.faith.behaviorState,
          lastAction: actionType,
          currentStreak: newStreak
        }
      }
    }));

    if (isInterrupted && state.addNotification) {
      state.addNotification("你的意志动摇了，之前的精神积累已消散。", "warning");
    }

    // 5. 检查解锁 (Check Unlock)
    // 只有在当前无信仰时才触发
    if (
      config.targetFaithId && 
      newStreak >= config.unlockStreak && 
      faith.id === FaithID.NONE
    ) {
      const targetFaith = faithsData.find(f => f.id === config.targetFaithId);
      const faithName = targetFaith?.name || config.targetFaithId;

      // 🎉 触发解锁：直接入教
      set((prev: StoreState) => ({
        faith: {
          ...prev.faith,
          id: config.targetFaithId,
          level: 1,
          hasPerformedRite: false,
          // 入教后重置行为状态，避免立即重复触发
          behaviorState: {
            lastAction: null,
            currentStreak: 0,
            hasReceivedInvitation: true
          },
          // 确保字段存在
          debuffs: prev.faith.debuffs || [],
          bannedFaiths: prev.faith.bannedFaiths || []
        }
      }));

      // 发送强通知
      if (state.addNotification) {
        state.addNotification(`灵魂觉醒！你已解锁并加入: ${faithName}`, 'success');
      }

      return { 
        success: true, 
        message: `你的虔诚得到了回应。`, 
        unlocked: true, 
        unlockedFaithId: config.targetFaithId 
      };
    }

    return { success: true, message: "行为已完成" };
  },

  // --- 以下为原有逻辑的适配 ---

  joinFaith: (faithId) => {
    // ⚠️ 注意：此方法现在主要用于调试或特殊剧情直接入教
    // 新手引导主要通过 performNoviceAction 触发
    if (faithId === FaithID.NONE) return { success: false, message: "" };
    
    const state = get() as GameState & VitalitySlice;
    if (state.faith.id === faithId) return { success: false, message: "已在教中" };

    const faithConfig = faithsData.find(f => f.id === faithId);
    if (!faithConfig) return { success: false, message: "配置缺失" };

    // 封禁检查
    if (state.faith.bannedFaiths?.includes(faithId)) {
      return { success: false, message: "你已被此教派放逐。" };
    }

    // 直接设置状态
    set((prev: StoreState) => ({
      faith: {
        ...prev.faith,
        id: faithId,
        level: 1,
        hasPerformedRite: false,
        behaviorState: { lastAction: null, currentStreak: 0, hasReceivedInvitation: true }
      }
    }));

    return { success: true, message: `已加入 ${faithConfig.name}` };
  },

  requestLeaveFaith: () => {
    const state = get();
    const currentFaithId = state.faith.id;
    
    if (currentFaithId === FaithID.NONE) return { canLeave: false };

    const penaltyConfig: LeavePenalty | undefined = faithRules.leavePenalties?.[currentFaithId];
    
    return {
      canLeave: true,
      confirmation: {
        title: faithRules.text?.leaveConfirmTitle || "确认退出",
        message: penaltyConfig?.confirmMessage || "确定要退出当前信仰吗？"
      },
      penalty: penaltyConfig
    };
  },

  confirmLeaveFaith: () => {
    const state = get() as GameState & VitalitySlice;
    const currentFaithId = state.faith.id;
    
    if (currentFaithId === FaithID.NONE) return { success: false, message: "无信仰" };

    const penaltyConfig: LeavePenalty | undefined = faithRules.leavePenalties?.[currentFaithId];
    const faithConfig = faithsData.find(f => f.id === currentFaithId);

    // 应用惩罚逻辑 (与原逻辑保持一致)
    if (penaltyConfig) {
      const { minStat } = SYSTEM_RULES.caps;
      const { metrics } = state.vitality;

      if (penaltyConfig.sanChange) {
        state.modifyStats({ san: metrics.san + penaltyConfig.sanChange });
      }

      if (penaltyConfig.maxHpChange) {
        const newMaxHp = Math.max(1, metrics.maxHp + penaltyConfig.maxHpChange);
        state.modifyStats({ maxHp: newMaxHp, hp: Math.min(metrics.hp, newMaxHp) });
      }

      // 添加 Debuff
      if (penaltyConfig.debuff) {
        const currentDebuffs = state.faith.debuffs || [];
        // 简单追加，实际项目中可加去重逻辑
        const newDebuffs = [...currentDebuffs, {
           ...penaltyConfig.debuff,
           remainingTurns: penaltyConfig.debuff.duration
        }];
        set((prev: StoreState) => ({ faith: { ...prev.faith, debuffs: newDebuffs } }));
      }

      // 永久封禁
      if (penaltyConfig.permanentBan) {
        set((prev: StoreState) => ({ 
          faith: { ...prev.faith, bannedFaiths: [...prev.faith.bannedFaiths, currentFaithId] } 
        }));
      }
    }

    // 重置为无信仰，并清空行为记录
    set((prev: StoreState) => ({
      faith: {
        ...prev.faith,
        id: FaithID.NONE,
        level: 1,
        hasPerformedRite: false,
        behaviorState: {
          lastAction: null,
          currentStreak: 0,
          hasReceivedInvitation: false // 允许重新开始积累
        }
      }
    }));

    if (state.addNotification) {
      state.addNotification(faithRules.text?.leaveSuccess || "已退出信仰", 'warning');
    }

    return { success: true, message: "已退出" };
  },

  performFaithRite: () => {
    const state = get() as GameState & VitalitySlice & FaithSlice;
    
    if (state.faith.hasPerformedRite) {
      if (state.addNotification) state.addNotification(faithRules.text?.riteDone || "今日已完成", 'info');
      return { success: false, message: "今日已完成" };
    }

    const faithConfig = faithsData.find(f => f.id === state.faith.id);
    if (!faithConfig) return { success: false, message: "无信仰配置" };

    const result = calculateRiteOutcome(faithConfig, state);

    if (result.success) {
       // 处理金钱消耗
       if (result.goldChange < 0) {
           const tx = state.addTransaction(
               'TAX', // 使用默认分类或从配置读取
               result.goldChange, 
               `仪式: ${faithConfig.rite.name}`
           );
           if (!tx.success) return { success: false, message: "资金不足" };
       }

       // 应用 stats 变更
       if (result.updates?.vitality?.metrics) {
           state.modifyStats(result.updates.vitality.metrics);
       }
       
       // 应用 identity 变更
       if (result.updates?.vitality?.identity?.points && state.updateIdentityPoints) {
           state.updateIdentityPoints(result.updates.vitality.identity.points);
       }

       // 处理金钱奖励
       if (result.goldChange > 0) {
           state.addTransaction('INCOME', result.goldChange, `仪式收益`);
       }

       set((prev: StoreState) => ({
           faith: { ...prev.faith, hasPerformedRite: true }
       }));

       if (state.addNotification) state.addNotification(result.message, 'success');
       return { success: true, message: result.message };
    } else {
       if (state.addNotification) state.addNotification(result.message, 'error');
       return { success: false, message: result.message };
    }
  },

  resetDailyFaith: () => {
    set((state: StoreState) => ({
      faith: { 
        ...state.faith, 
        hasPerformedRite: false
      }
    }));
  },

  tickFaithDebuffs: () => {
    set((state: StoreState) => {
      const currentDebuffs = state.faith.debuffs || [];
      const updatedDebuffs = currentDebuffs
        .map(d => ({ ...d, remainingTurns: d.remainingTurns - 1 }))
        .filter(d => d.remainingTurns > 0);

      return {
        faith: { ...state.faith, debuffs: updatedDebuffs }
      };
    });
  }
});