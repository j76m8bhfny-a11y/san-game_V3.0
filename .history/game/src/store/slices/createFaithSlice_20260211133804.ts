import { StateCreator } from 'zustand';
import { 
  FaithID, 
  FaithState, 
  GameState, 
  FaithDebuff, 
  FaithData, 
  NoviceActionType, 
  RegionID 
} from '@/types/schema';
import { StoreState } from '@/types/store';

// 引入数据配置
import faithsDataUntyped from '@/assets/data/faiths.json';
import faithRulesUntyped from '@/assets/data/rules/faithRules.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// 引入逻辑计算
import { calculateRiteOutcome } from '@/logic/faith';
import type { FaithRules, LeavePenalty } from '@/types/faithRules';

// 类型断言与转换
const faithsData = faithsDataUntyped as FaithData[];
const faithRules = faithRulesUntyped as any; // 暂时使用 any，等待 types/faithRules.ts 完善

export interface FaithSlice {
  faith: FaithState;
  
  // === 新手期核心逻辑 ===
  /** 执行新手行为 (奉献/互助/献祭/拒绝) */
  performNoviceAction: (actionType: NoviceActionType) => { success: boolean; message: string; unlockedFaith?: FaithID };
  
  // === 辅助逻辑 ===
  /** 根据当前区域判断 UI 模式：新手(NOVICE)、主场(NATIVE)、客场(GUEST) */
  getFaithMode: (region: RegionID) => 'NOVICE' | 'NATIVE' | 'GUEST';

  // === 信徒核心逻辑 ===
  /** 强制加入特定信仰 (调试或特殊剧情用) */
  joinFaith: (faithId: FaithID) => { success: boolean; message: string }; 
  /** 请求退出信仰，返回确认信息与惩罚预览 */
  requestLeaveFaith: () => { canLeave: boolean; confirmation?: { title: string; message: string }; penalty?: unknown };
  /** 确认并执行退出信仰 */
  confirmLeaveFaith: () => { success: boolean; message: string };
  /** 执行教徒专属仪式 (高级行为) */
  performFaithRite: () => { success: boolean; message: string };
  
  // === 系统维护 ===
  resetDailyFaith: () => void;
  tickFaithDebuffs: () => void;
}

export const createFaithSlice: StateCreator<StoreState, [], [], FaithSlice> = (set, get) => ({
  faith: {
    id: FaithID.NONE,
    level: 1,
    hasPerformedRite: false,
    debuffs: [],
    bannedFaiths: [],
    behaviorState: {
      lastAction: null,
      currentStreak: 0,
      hasReceivedInvitation: false
    }
  },

  getFaithMode: (region: RegionID) => {
    const { faith } = get();
    
    // 1. 无信仰 -> 新手模式
    if (faith.id === FaithID.NONE) return 'NOVICE';
    
    // 2. 有信仰，判断是否为主场
    const currentFaithConfig = faithsData.find(f => f.id === faith.id);
    
    // 如果当前区域是该信仰的大本营 (baseRegion)，或者是兄弟会在 RustBelt/Downtown 的特殊据点
    if (currentFaithConfig?.baseRegion === region) return 'NATIVE';
    
    // 特殊处理：兄弟会可能在 RustBelt 和 Downtown 都有据点
    if (faith.id === FaithID.BROTHERHOOD && (region === RegionID.RustBelt || region === RegionID.Downtown)) {
        return 'NATIVE';
    }

    // 3. 其他情况 -> 客场模式
    return 'GUEST';
  },

  performNoviceAction: (actionType) => {
    // 获取完整的 Store 上下文以访问 addTransaction 等方法
    const state = get() as GameState & { 
        addTransaction: Function; 
        modifyStats: Function; 
        addNotification: Function;
        inventory: string[];
    };
    
    const config = faithRules.noviceMechanics?.[actionType];
    if (!config) return { success: false, message: "未知行为配置" };

    // === 1. 资源检查与扣除 ===
    const { cost } = config;
    
    // 1.1 检查物品 (例如 REJECT 需要宣言)
    if (config.requiredItemId && !state.inventory.includes(config.requiredItemId)) {
        const msg = "缺少必要物品，无法进行此操作。";
        state.addNotification(msg, 'warning');
        return { success: false, message: msg };
    }

    // 1.2 扣钱 (通过 addTransaction 处理，自带余额检查)
    if (cost.gold && cost.gold > 0) {
        // 从 regionFlavor 获取当前区域的文案，如果找不到则用默认
        const flavor = config.regionFlavor?.[state.currentRegion] || config.regionFlavor?.['DEFAULT'];
        const actionLabel = flavor?.label || actionType;

        const tx = state.addTransaction(
            faithRules.defaults.transactionCategories.noviceCost || 'MISC',
            -cost.gold,
            `行为: ${actionLabel}`
        );
        if (!tx.success) return { success: false, message: "资金不足" };
    }

    // 1.3 扣 HP/San (预检查，防止扣死)
    if (cost.hp && state.vitality.metrics.hp <= cost.hp) {
        const msg = "体力不足，无法支撑此行为。";
        state.addNotification(msg, 'warning');
        return { success: false, message: msg };
    }

    // === 2. 执行属性变更 (消耗 + 奖励) ===
    let hpChange = -(cost.hp || 0);
    let sanChange = -(cost.san || 0);
    let goldReward = 0;

    // 叠加奖励
    if (config.reward) {
        if (config.reward.hp) hpChange += config.reward.hp;
        if (config.reward.san) sanChange += config.reward.san;
        if (config.reward.gold) goldReward += config.reward.gold;
    }

    // 应用数值更新
    const metricsUpdates: any = {};
    if (hpChange !== 0) metricsUpdates.hp = state.vitality.metrics.hp + hpChange;
    if (sanChange !== 0) metricsUpdates.san = state.vitality.metrics.san + sanChange;
    
    if (Object.keys(metricsUpdates).length > 0) {
        state.modifyStats(metricsUpdates);
    }

    if (goldReward > 0) {
        const flavor = config.regionFlavor?.[state.currentRegion] || config.regionFlavor?.['DEFAULT'];
        state.addTransaction(
            faithRules.defaults.transactionCategories.noviceIncome || 'INCOME',
            goldReward,
            `回馈: ${flavor?.label || actionType}`
        );
    }

    // === 3. 处理连击 (Streak) 逻辑 ===
    const { behaviorState } = state.faith;
    let newStreak = 1;
    let msg = "你试探性地迈出了一步。";

    if (behaviorState.lastAction === actionType) {
        // 动作相同，连击 +1
        newStreak = behaviorState.currentStreak + 1;
        msg = `你的信念在增强 (${newStreak}/${config.unlockStreak})`;
    } else {
        // 动作打断，重置为 1
        if (behaviorState.currentStreak > 1) {
            state.addNotification(faithRules.text.streakBreak || "你的意志动摇了，之前的积累已消散。", 'warning');
        }
        msg = "你改变了行为方式，重新开始积累。";
    }

    // 更新 Store 状态
    set((prev: any) => ({
        faith: {
            ...prev.faith,
            behaviorState: {
                ...prev.faith.behaviorState,
                lastAction: actionType,
                currentStreak: newStreak
            }
        }
    }));

    state.addNotification(msg, 'info');

    // === 4. 检查解锁 (Unlock Check) ===
    // 如果连击达到阈值，且之前没有收到过邀请
    if (newStreak >= config.unlockStreak && !state.faith.behaviorState.hasReceivedInvitation) {
        const targetFaithId = config.targetFaithId;
        const targetFaith = faithsData.find(f => f.id === targetFaithId);
        
        if (targetFaith) {
            // 检查是否被封禁
            if (state.faith.bannedFaiths.includes(targetFaithId)) {
                state.addNotification(`该教派拒绝了你的加入 (已封禁)。`, "error");
                return { success: true, message: msg }; // 行为成功，但入教失败
            }

            const promptMsg = faithRules.text.unlockPrompt?.replace('{name}', targetFaith.name) || `你的行为引起了 ${targetFaith.name} 的注意...`;
            state.addNotification(promptMsg, 'success');
            
            // 自动入教逻辑
            set((prev: any) => ({
                faith: {
                    ...prev.faith,
                    id: targetFaithId,
                    level: 1,
                    hasPerformedRite: false,
                    behaviorState: {
                        ...prev.faith.behaviorState,
                        hasReceivedInvitation: true,
                        currentStreak: 0 // 重置连击，避免重复触发
                    }
                }
            }));
            
            // 可以在此处弹出一个特殊的 Modal 或剧情对话
            return { success: true, message: "信仰觉醒", unlockedFaith: targetFaithId };
        }
    }

    return { success: true, message: msg };
  },

  joinFaith: (faithId) => {
      // 这是一个调试用或强制入教的接口
      const faithConfig = faithsData.find(f => f.id === faithId);
      if (!faithConfig) return { success: false, message: "配置缺失" };
      
      set((state: any) => ({
          faith: {
              ...state.faith,
              id: faithId,
              level: 1,
              hasPerformedRite: false,
              // 确保新字段初始化
              behaviorState: {
                  lastAction: null,
                  currentStreak: 0,
                  hasReceivedInvitation: true 
              }
          }
      }));
      return { success: true, message: `已强制加入 ${faithConfig.name}` };
  },

  requestLeaveFaith: () => {
    const state = get();
    const currentFaithId = state.faith.id;
    if (currentFaithId === FaithID.NONE) return { canLeave: false };

    const penaltyConfig: LeavePenalty | undefined = faithRules.leavePenalties?.[currentFaithId];
    
    // 如果没有配惩罚，直接允许
    if (!penaltyConfig) {
      return { 
        canLeave: true, 
        confirmation: { 
            title: faithRules.text.leaveConfirmTitle || "确认退出", 
            message: "确定要退出当前信仰吗？" 
        }
      };
    }
    
    return {
      canLeave: true,
      confirmation: {
        title: faithRules.text.leaveConfirmTitle || "确认退出",
        message: penaltyConfig.confirmMessage ?? "确定要退出当前信仰吗？此操作可能带来严重后果。"
      },
      penalty: penaltyConfig
    };
  },

  confirmLeaveFaith: () => {
    const state = get() as any;
    const currentFaithId = state.faith.id;
    
    if (currentFaithId === FaithID.NONE) return { success: false, message: "无信仰" };

    const penaltyConfig = faithRules.leavePenalties?.[currentFaithId];
    const faithConfig = faithsData.find(f => f.id === currentFaithId);
    const faithName = faithConfig?.name || currentFaithId;

    // === 应用惩罚 ===
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
        const newMaxHp = Math.max(1, currentMaxHp + penaltyConfig.maxHpChange);
        const currentHp = state.vitality.metrics.hp;
        const newHp = Math.min(currentHp, newMaxHp);
        state.modifyStats({ maxHp: newMaxHp, hp: newHp });
      }

      // 3. 添加 Debuff
      if (penaltyConfig.debuff) {
        const currentDebuffs = state.faith.debuffs || [];
        const debuffConfig = penaltyConfig.debuff;
        const debuff: FaithDebuff = {
          id: debuffConfig.id,
          name: debuffConfig.name,
          duration: debuffConfig.duration,
          remainingTurns: debuffConfig.duration,
          effect: debuffConfig.effect
        };
        // 简单的去重/刷新逻辑
        const otherDebuffs = currentDebuffs.filter((d: FaithDebuff) => d.id !== debuff.id);
        state.faith.debuffs = [...otherDebuffs, debuff];
      }

      // 4. 永久封禁
      if (penaltyConfig.permanentBan) {
          const currentBanned = state.faith.bannedFaiths || [];
          if (!currentBanned.includes(currentFaithId)) {
              state.faith.bannedFaiths = [...currentBanned, currentFaithId];
          }
      }

      const description = penaltyConfig.description || "你背弃了誓言。";
      state.addNotification(`${faithName}: ${description}`, 'warning');
    }

    // === 执行退出 ===
    set((prev: any) => ({
        faith: {
            ...prev.faith, // 保留 debuffs 和 bannedFaiths
            id: FaithID.NONE,
            level: 1,
            hasPerformedRite: false,
            behaviorState: {
                lastAction: null,
                currentStreak: 0,
                hasReceivedInvitation: false
            }
        }
    }));
    
    state.addNotification(faithRules.text.leaveSuccess || "你已退出信仰。", 'warning');
    return { success: true, message: "已退出" };
  },

  performFaithRite: () => {
    // 获取完整的 Store 上下文
    const state = get() as any;
    
    if (state.faith.id === FaithID.NONE) {
        return { success: false, message: faithRules.text.noFaith || "无信仰" };
    }
    
    // 获取当前信仰配置
    const faithConfig = faithsData.find(f => f.id === state.faith.id);
    if (!faithConfig) return { success: false, message: "配置错误" };
    
    // 检查每日限制
    if (state.faith.hasPerformedRite) {
        state.addNotification(faithRules.text.riteDone || "今日已完成仪式。", 'info');
        return { success: false, message: "今日已完成" };
    }

    // 计算仪式结果 (logic/faith.ts)
    const result = calculateRiteOutcome(faithConfig, state);

    if (result.success) {
        // 1. 处理金钱支出 (如果有)
        if (typeof result.goldChange === 'number' && result.goldChange < 0) {
            const txResult = state.addTransaction(
                faithRules.defaults.transactionCategories.riteCost || 'TAX', 
                result.goldChange, 
                `信仰仪式: ${faithConfig.rite.name}`
            );
            if (!txResult.success) {
              return { success: false, message: faithRules.text.insufficientResource || "资金不足以支付仪式费用。" };
            }
        }
        
        // 2. 应用其他属性效果 (HP/SAN)
        if (result.updates?.vitality?.metrics && 
            Object.keys(result.updates.vitality.metrics).length > 0) {
            state.modifyStats(result.updates.vitality.metrics);
        }
        
        // 3. 应用阵营点数
        if (result.updates?.vitality?.identity?.points && state.updateIdentityPoints) {
            state.updateIdentityPoints(result.updates.vitality.identity.points);
        }

        // 4. 处理金钱收入 (如果有)
        if (typeof result.goldChange === 'number' && result.goldChange > 0) {
            state.addTransaction(
                faithRules.defaults.transactionCategories.riteIncome || 'INCOME', 
                result.goldChange, 
                `信仰仪式: ${faithConfig.rite.name}`
            );
        }

        // 5. 更新状态
        set((prev: any) => ({
            faith: { 
              ...prev.faith, 
              hasPerformedRite: true
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
            hasPerformedRite: false
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
            debuffs: updatedDebuffs
          }
        };
      });
  }
});