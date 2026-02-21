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

// 引入逻辑计算 (纯函数)
import { calculateRiteOutcome, calculateNoviceActionOutcome } from '@/logic/faith';
import type { LeavePenalty } from '@/types/faithRules';

// 类型断言与转换
const faithsData = faithsDataUntyped as FaithData[];
const faithRules = faithRulesUntyped as any; // 暂时使用 any 以适配 JSON 结构

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
    
    // 如果当前区域是该信仰的大本营 (baseRegion)
    if (currentFaithConfig?.baseRegion === region) return 'NATIVE';
    
    // 特殊处理：兄弟会可能在 RustBelt 和 Downtown 都有据点
    if (faith.id === FaithID.BROTHERHOOD && (region === RegionID.RustBelt || region === RegionID.Downtown)) {
        return 'NATIVE';
    }

    // 3. 其他情况 -> 客场模式
    return 'GUEST';
  },

  performNoviceAction: (actionType) => {
    // 获取完整的 Store 上下文
    const state = get() as GameState & { 
        addTransaction: Function; 
        modifyStats: Function; 
        updateIdentityPoints: Function;
        addNotification: Function;
        inventory: string[];
    };
    
    const config = faithRules.noviceMechanics?.[actionType];
    if (!config) return { success: false, message: "未知行为配置" };

    // === 1. 调用纯函数计算结果 (Resources & Requirements) ===
    const outcome = calculateNoviceActionOutcome(actionType, state);

    if (!outcome.success) {
        state.addNotification(outcome.message, 'warning');
        return { success: false, message: outcome.message };
    }

    // === 2. 执行状态更新 (Apply Changes) ===
    
    // 2.1 处理金钱流水 (Transaction)
    // 根据 goldChange 的正负决定分类
    if (outcome.goldChange !== 0) {
        // 获取当前区域的 Flavor Text 用于账单描述
        const flavor = config.regionFlavor?.[state.currentRegion] || config.regionFlavor?.['DEFAULT'];
        const label = flavor?.label || actionType;

        const category = outcome.goldChange > 0 
            ? (faithRules.defaults.transactionCategories.noviceIncome || 'INCOME')
            : (faithRules.defaults.transactionCategories.noviceCost || 'MISC');
        
        const txDesc = outcome.goldChange > 0 
            ? `回馈: ${label}` 
            : `行为: ${label}`;

        // addTransaction 会处理余额不足的边缘情况(虽然 calculate 已经检查过)
        const tx = state.addTransaction(category, outcome.goldChange, txDesc);
        if (!tx.success) {
            return { success: false, message: "交易失败: 资金变动异常" };
        }
    }

    // 2.2 应用属性变更 (HP, SAN)
    if (outcome.updates?.vitality?.metrics && Object.keys(outcome.updates.vitality.metrics).length > 0) {
        state.modifyStats(outcome.updates.vitality.metrics);
    }

    // 2.3 应用身份点数变更 (Red/Wolf/Old)
    if (outcome.updates?.vitality?.identity?.points && Object.keys(outcome.updates.vitality.identity.points).length > 0) {
        state.updateIdentityPoints(outcome.updates.vitality.identity.points);
    }

    // === 3. 处理连击 (Streak) 逻辑 ===
    // 这部分属于 Store 的状态管理，不在纯函数中
    const { behaviorState } = state.faith;
    let newStreak = 1;
    let msg = outcome.message || "行为已完成。";

    if (behaviorState.lastAction === actionType) {
        // 动作相同，连击 +1
        newStreak = behaviorState.currentStreak + 1;
        // 只有在连击增加时才提示进度，避免刷屏
        if (newStreak > 1 && newStreak < config.unlockStreak) {
             msg = `${msg} (信念: ${newStreak}/${config.unlockStreak})`;
        }
    } else {
        // 动作打断，重置为 1
        if (behaviorState.currentStreak > 1) {
            state.addNotification(faithRules.text.streakBroken || "你的意志动摇了，之前的积累已消散。", 'warning');
        }
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
                return { success: true, message: msg }; 
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
                        currentStreak: 0 // 重置连击
                    }
                }
            }));
            
            return { success: true, message: "信仰觉醒", unlockedFaith: targetFaithId };
        }
    }

    return { success: true, message: msg };
  },

  joinFaith: (faithId) => {
      const faithConfig = faithsData.find(f => f.id === faithId);
      if (!faithConfig) return { success: false, message: "配置缺失" };
      
      set((state: any) => ({
          faith: {
              ...state.faith,
              id: faithId,
              level: 1,
              hasPerformedRite: false,
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
      if (penaltyConfig.insightChange !== undefined) {
        const { minStat } = SYSTEM_RULES.caps;
        const currentInsight = state.vitality.metrics.insight;
        const newInsight = Math.max(minStat, Math.min(state.vitality.metrics.maxInsight, currentInsight + penaltyConfig.insightChange));
        state.modifyStats({ insight: newInsight });
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
            ...prev.faith, 
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
    const state = get() as any;
    
    if (state.faith.id === FaithID.NONE) {
        return { success: false, message: faithRules.text.noFaith || "无信仰" };
    }
    
    const faithConfig = faithsData.find(f => f.id === state.faith.id);
    if (!faithConfig) return { success: false, message: "配置错误" };
    
    if (state.faith.hasPerformedRite) {
        state.addNotification(faithRules.text.riteDone || "今日已完成仪式。", 'info');
        return { success: false, message: "今日已完成" };
    }

    // 调用纯函数计算仪式结果
    const result = calculateRiteOutcome(faithConfig, state);

    if (result.success) {
        // 1. 处理支出 (Gold < 0)
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
        
        // 2. 应用属性效果 (HP/SAN)
        if (result.updates?.vitality?.metrics && Object.keys(result.updates.vitality.metrics).length > 0) {
            state.modifyStats(result.updates.vitality.metrics);
        }
        
        // 3. 应用阵营点数
        if (result.updates?.vitality?.identity?.points && state.updateIdentityPoints) {
            state.updateIdentityPoints(result.updates.vitality.identity.points);
        }

        // 4. 处理收入 (Gold > 0)
        if (typeof result.goldChange === 'number' && result.goldChange > 0) {
            state.addTransaction(
                faithRules.defaults.transactionCategories.riteIncome || 'INCOME', 
                result.goldChange, 
                `信仰仪式: ${faithConfig.rite.name}`
            );
        }

        // 5. 更新状态 (完成仪式)
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