import { StateCreator } from 'zustand';
import { GameState, LedgerCategory, Ending } from '@/types/schema';
import { StoreState } from '@/types/store';
import { calculateDailyJailEffect } from '@/logic/prison';
import { runTurnSettlement } from '@/systems/SystemRegistry';
import { DailyEffect } from '@/types/prisonRules';
import { resolveEnding } from '@/logic/endings';
import endingsData from '@/assets/data/endings.json';

// ✅ 1. 引入数值配置文件
import prisonRules from '@/assets/data/rules/prison_rules.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// ✅ 引入全局定时器管理器
import { globalTimerManager } from '@/hooks/useGameTimer';
// ✅ 引入事务管理器
import { executeTransactionSync, createStep } from '@/utils/transaction';

// ==================== 辅助函数 ====================

// ==================== 辅助函数 ====================

/**
 * 获取配置中的消息，支持模板替换
 */
const getMessage = (key: keyof typeof prisonRules.messages, params?: Record<string, string | number>): string => {
  let msg = prisonRules.messages?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      msg = msg.replace(`{${k}}`, String(v));
    });
  }
  return msg;
};

/**
 * 统一错误处理
 * 记录错误日志并返回用户友好的错误消息
 */
const handlePrisonError = (error: unknown, context: string, defaultMessage?: string): string => {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error(`[PrisonSystem] ${context}:`, errorMsg, error);
  
  // 如果有默认消息，直接返回；否则返回通用错误消息
  return defaultMessage || getMessage('serveTimeError');
};

// ==================== 辅助函数 ====================

/**
 * 应用系统结算（房租、利息、账单等）- 异步
 */
const applySystemSettlement = async (state: GameState & { addNotification: Function }) => {
  return await runTurnSettlement(state);
};

/**
 * 应用监狱惩罚（HP/SAN）
 */
const applyJailPenalty = (
  state: GameState,
  effect: DailyEffect
): Partial<GameState> => {
  const { minStat } = SYSTEM_RULES.caps;
  
  if (!state.vitality?.metrics) {
    throw new Error("状态异常，无法服刑");
  }

  return {
    vitality: {
      ...state.vitality,
      metrics: {
        ...state.vitality.metrics,
        hp: Math.max(minStat, state.vitality.metrics.hp + effect.hpChange),
        insight: Math.max(minStat, state.vitality.metrics.insight + effect.insightChange)
      }
    }
  };
};

/**
 * 合并状态更新
 */
const mergeStateUpdates = (
  state: GameState,
  settlementResult: any,
  jailPenalty: Partial<GameState>
): GameState => {
  // 基础更新 (来自 SystemRegistry)
  let nextState: GameState = {
    ...state,
    ...settlementResult.updates,
    vitality: settlementResult.updates.vitality ? {
      ...state.vitality,
      ...settlementResult.updates.vitality,
      metrics: { ...state.vitality.metrics, ...(settlementResult.updates.vitality.metrics || {}) }
    } : state.vitality
  };

  // 叠加监狱惩罚
  if (jailPenalty.vitality) {
    nextState.vitality = {
      ...nextState.vitality,
      metrics: {
        ...nextState.vitality.metrics,
        ...jailPenalty.vitality.metrics
      }
    };
  }

  return nextState;
};

/**
 * 检查释放条件并更新监狱状态
 * 注意：出狱时保留重罪记录标记
 */
const updatePrisonStatus = (
  state: GameState,
  turnsServed: number,
  sentenceTurns: number
): Partial<GameState> => {
  const released = turnsServed >= sentenceTurns;
  
  if (released) {
    // 出狱时重置监狱状态，但保留重罪记录
    return {
      prison: INITIAL_PRISON
    };
  }
  
  return {
    prison: {
      ...state.prison,
      turnsServed
    }
  };
};

/**
 * 显示系统结算通知（限制最多显示3条，避免UI淹没）
 */
const showSettlementNotifications = (
  state: StoreState,
  logs: string[]
) => {
  const importantLogs = logs.filter(log => 
    log.includes('扣款') || log.includes('利息') || log.includes('租金')
  );
  
  // 最多显示3条，合并其余
  const displayLogs = importantLogs.slice(0, 3);
  if (importantLogs.length > 3) {
    displayLogs.push(`...还有 ${importantLogs.length - 3} 笔费用未显示`);
  }
  
  displayLogs.forEach(log => {
    state.addNotification(log, 'warning');
  });
};

/**
 * 检查死亡条件
 */
const checkDeathCondition = (state: GameState): boolean => {
  return (state.vitality.metrics.hp <= 0 || state.vitality.metrics.insight <= 0);
};

/**
 * 🔴 监狱疾病处理 - 毒药补丁1
 * 疾病在监狱中继续扣血，但无法去医院治疗
 */
const processPrisonDiseases = (
  state: GameState
): { hpChange: number; insightChange: number; logs: string[] } => {
  const { activeDiseases } = state.vitality;
  const logs: string[] = [];
  let totalHpChange = 0;
  let totalInsightChange = 0;
  
  if (!activeDiseases || activeDiseases.length === 0) {
    return { hpChange: 0, insightChange: 0, logs };
  }
  
  // 导入疾病数据（需要在函数外部导入，这里简化处理）
  // 实际疾病效果应该从 diseases.json 中读取
  // 这里使用简化逻辑：每种疾病每周扣5-15 HP
  
  for (const diseaseId of activeDiseases) {
    // 根据疾病ID判断严重程度
    let hpDrain = 5;
    if (diseaseId.includes('SEPSIS') || diseaseId.includes('ACUTE')) {
      hpDrain = 15;
    } else if (diseaseId.includes('CHRONIC') || diseaseId.includes('LUNG')) {
      hpDrain = 8;
    } else if (diseaseId.includes('MENTAL') || diseaseId.includes('PSYCHOSIS')) {
      hpDrain = 0;
      totalInsightChange += 5; // 精神疾病增加Insight
    }
    
    totalHpChange -= hpDrain;
    
    if (hpDrain > 0) {
      logs.push(`【狱中疾病】${diseaseId}: -${hpDrain} HP (无法就医，只能硬扛)`);
    }
  }
  
  return { hpChange: totalHpChange, insightChange: totalInsightChange, logs };
};

export interface PrisonSlice {
  prison: {
    inJail: boolean;
    crime: string;
    sentenceTurns: number;
    turnsServed: number;
    bailAmount: number;
    totalDebtAtConviction?: number;
  };

  // Actions
  imprison: (reason: string, turns: number, bail: number, totalDebt?: number) => void;
  serveTime: () => Promise<{ released: boolean; msg: string; died: boolean }>;
  payCashBail: () => { success: boolean; msg: string };
  signBailBond: () => { success: boolean; msg: string };
  buyBlackMarketMedicine: () => { success: boolean; msg: string; hpRestored?: number };
}

const INITIAL_PRISON = {
  inJail: false,
  crime: '',
  sentenceTurns: 0,
  turnsServed: 0,
  bailAmount: 0,
  totalDebtAtConviction: undefined
};

export const createPrisonSlice: StateCreator<StoreState, [], [], PrisonSlice> = (set, get) => ({
  prison: INITIAL_PRISON,

  imprison: (reason, turns, bail, totalDebt) => {
    set({
      prison: {
        inJail: true,
        crime: reason,
        sentenceTurns: turns,
        turnsServed: 0,
        bailAmount: bail,
        totalDebtAtConviction: totalDebt
      }
    });
  },

  // 🔴 逻辑说明: 坐牢期间触发系统结算
  serveTime: async () => {
    const state = get();
    const { vitality, prison } = state;

    // 边界检查：刑期异常
    if (prison.sentenceTurns <= 0) {
      return { released: true, msg: getMessage('invalidSentence'), died: false };
    }

    try {
      // 1. 执行系统结算（异步）
      const settlementResult = await applySystemSettlement(state);

      // 2. 计算坐牢的物理惩罚（阶级差异化）
      const jailEffect = calculateDailyJailEffect(vitality.identity.currentClass);
      
      // 2.5 🔴 毒药补丁1：监狱内疾病继续扣血
      const diseaseEffect = processPrisonDiseases(state);
      if (diseaseEffect.hpChange !== 0 || diseaseEffect.insightChange !== 0) {
        jailEffect.hpChange += diseaseEffect.hpChange;
        jailEffect.insightChange += diseaseEffect.insightChange;
        diseaseEffect.logs.forEach(log => settlementResult.logs.push(log));
      }
      
      const jailPenalty = applyJailPenalty(state, jailEffect);

      // 3. 合并状态更新
      let nextState = mergeStateUpdates(state, settlementResult, jailPenalty);

      // 4. 推进时间（修复：同时更新 totalTurns）
      const nextTurn = vitality.time.currentTurn + 1;
      const nextTotalTurns = vitality.time.totalTurns + 1;
      const turnsServed = prison.turnsServed + 1;
      const released = turnsServed >= prison.sentenceTurns;

      nextState.vitality.time = {
        ...state.vitality.time,
        currentTurn: nextTurn,
        totalTurns: nextTotalTurns
      };

      // 5. 更新监狱状态
      const prisonUpdate = updatePrisonStatus(state, turnsServed, prison.sentenceTurns);
      nextState = { ...nextState, ...prisonUpdate };

      // 6. 应用到 Store
      set(nextState);

      // 7. 显示结算通知
      showSettlementNotifications(state, settlementResult.logs);

      // 8. 检查死亡（强制钳制到0，避免显示负数）
      const died = checkDeathCondition(nextState);
      // 死亡时强制钳制HP/SAN为0，避免UI显示负数
      if (died) {
        nextState.vitality.metrics.hp = Math.max(0, nextState.vitality.metrics.hp);
        nextState.vitality.metrics.insight = Math.max(0, nextState.vitality.metrics.insight);
        // ✅ 修复：保存死亡状态
        set(nextState);
        // ✅ 修复：触发死亡结局 - 使用 resolveEnding 进行完整判定
        globalTimerManager.setTimeout(() => {
          const store = get();
          if (store.triggerEnding) {
            const state = get() as GameState;
            const endingId = resolveEnding(state, endingsData as unknown as Ending[], 52, 'PRISON_DEATH');
            store.triggerEnding(endingId);
          }
        }, 0);
      }

      // ✅ 新增：出狱时自动发送通知（带重罪记录提示）
      if (released && !died) {
        const hasFelony = nextState.vitality.flags.hasFelonyRecord;
        if (hasFelony) {
          state.addNotification(getMessage('releasedWithFelony') || '【重罪记录】你带着犯罪记录出狱。中产阶级的门永远对你关闭了。', 'error');
        } else {
          state.addNotification(getMessage('released'), 'success');
        }
      }

      return {
        released,
        msg: released ? getMessage('released') : jailEffect.log,
        died
      };
    } catch (error) {
      const errorMsg = handlePrisonError(error, 'serveTime');
      return {
        released: false,
        msg: errorMsg,
        died: false
      };
    }
  },

  payCashBail: () => {
    try {
      const state = get();
      const { metrics } = state.vitality;
      const cost = state.prison.bailAmount;

      // 边界检查：保释金异常
      if (cost <= 0) return { success: false, msg: getMessage('invalidBailAmount') };
      if (metrics.gold < cost) return { success: false, msg: getMessage('insufficientFunds') };

      // 扣款记账
      const txResult = state.addTransaction('MISC' as LedgerCategory, -cost, '支付保释金');
      if (!txResult.success) {
        return { success: false, msg: getMessage('insufficientFundsForBail') };
      }

      // 检查是否有重罪记录（用于消息提示）
      const hasFelony = state.vitality.flags.hasFelonyRecord;

      set(() => ({
        prison: INITIAL_PRISON
      }));
      
      return { 
        success: true, 
        msg: hasFelony 
          ? (getMessage('releasedWithFelony') || '【重罪记录】你带着犯罪记录出狱。中产阶级的门永远对你关闭了。')
          : getMessage('cashBailSuccess')
      };
    } catch (error) {
      const errorMsg = handlePrisonError(error, 'payCashBail');
      return { success: false, msg: errorMsg };
    }
  },

  // 🔴 新增：黑市医疗（监狱内购药）
  buyBlackMarketMedicine: () => {
    try {
      const state = get();
      const prisonMedical = prisonRules?.prisonMedical;
      
      if (!prisonMedical?.enableBlackMarketMedicine) {
        return { success: false, msg: '当前监狱不提供黑市医疗服务' };
      }

      const cost = prisonMedical.blackMarketPainkillerCost;
      const effect = prisonMedical.blackMarketPainkillerEffect;
      
      // 检查资金
      if (state.vitality.metrics.gold < cost) {
        return { success: false, msg: `资金不足，需要 $${cost} 购买黑市止痛药` };
      }

      // 扣除费用
      const txResult = state.addTransaction('MEDICAL' as LedgerCategory, -cost, '黑市止痛药');
      if (!txResult.success) {
        return { success: false, msg: '资金不足' };
      }

      // 恢复HP
      const { maxStat } = SYSTEM_RULES.caps;
      const currentHp = state.vitality.metrics.hp;
      const newHp = Math.min(maxStat, currentHp + effect.hpRestore);
      
      set((prev) => ({
        vitality: {
          ...prev.vitality,
          metrics: {
            ...prev.vitality.metrics,
            hp: newHp
          }
        }
      }));

      return { 
        success: true, 
        msg: getMessage('blackMarketMedicine', { cost }) || `你花了 $${cost} 从狱警那里买了黑市止痛药，恢复了 ${effect.hpRestore} HP。`,
        hpRestored: effect.hpRestore
      };
    } catch (error) {
      const errorMsg = handlePrisonError(error, 'buyBlackMarketMedicine');
      return { success: false, msg: errorMsg };
    }
  },

  // 🔴 逻辑说明: 关联保释贷款 (使用统一事务管理器)
  signBailBond: () => {
    try {
      const state = get();
      const { metrics } = state.vitality;
      const totalBail = state.prison.bailAmount;
      
      // ✅ 重构：从配置读取首付比例和产品ID（带防御性默认值）
      const rate = prisonRules?.bail?.bondDownPaymentRate ?? 0.1;
      const loanProductId = prisonRules?.bail?.linkedLoanProductId ?? 'LOAN_BAIL_BOND';

      // 配置验证
      if (rate < 0 || rate > 1) return { success: false, msg: getMessage('invalidRate') };
      if (!loanProductId) return { success: false, msg: getMessage('missingLoanProductId') };

      const downPayment = Math.floor(totalBail * rate);
      const loanAmount = totalBail - downPayment; // 剩余金额走贷款

      // 边界检查：首付异常
      if (downPayment <= 0) return { success: false, msg: getMessage('invalidDownPayment') };
      // 检查首付
      if (metrics.gold < downPayment) {
        return { success: false, msg: getMessage('downPaymentFailed', { rate: (rate * 100).toFixed(0), amount: downPayment }) };
      }

      // ✅ 使用统一事务管理器
      const hasFelony = state.vitality.flags.hasFelonyRecord;

      const result = executeTransactionSync([
        createStep(
          '扣除保释金首付',
          () => {
            const txResult = state.addTransaction('MISC' as LedgerCategory, -downPayment, '保释金首付');
            return txResult.success;
          },
          () => {
            // 回滚：退还首付
            state.addTransaction('MISC' as LedgerCategory, downPayment, '保释金首付退款');
          }
        ),
        createStep(
          '发放保释贷款',
          () => {
            const loanResult = state.takeLoan(loanProductId, loanAmount);
            return loanResult.success;
          },
          () => {
            // 回滚：takeLoan 内部有自己的回滚逻辑，这里不需要额外操作
            // 但如果需要，可以在这里调用清除贷款的方法
          }
        ),
        createStep(
          '释放玩家',
          () => {
            set(() => ({ prison: INITIAL_PRISON }));
            return true;
          },
          () => {
            // 回滚：理论上不应该回滚释放，因为钱已经花了
            // 但如果需要，可以重新设置监狱状态
          }
        )
      ], 'signBailBond');

      if (result.success) {
        return { 
          success: true, 
          msg: hasFelony
            ? (getMessage('releasedWithFelony') || '【重罪记录】你带着犯罪记录出狱。中产阶级的门永远对你关闭了。')
            : getMessage('bondSuccess')
        };
      } else {
        return { success: false, msg: getMessage('loanRejected', { message: result.error || '未知错误' }) };
      }
    } catch (error) {
      const errorMsg = handlePrisonError(error, 'signBailBond');
      return { success: false, msg: errorMsg };
    }
  }
});