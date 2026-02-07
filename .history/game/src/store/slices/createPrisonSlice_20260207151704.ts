import { StateCreator } from 'zustand';
import { GameState } from '@/types/schema';
import { calculateDailyJailEffect } from '@/logic/prison';
import { BankSlice } from './createBankSlice';
import { runTurnSettlement } from '@/systems/SystemRegistry';
import { DailyEffect } from '@/types/prisonRules';

// ✅ 1. 引入数值配置文件
import prisonRules from '@/assets/data/rules/prisonRules.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

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

// ==================== 辅助函数 ====================

/**
 * 应用系统结算（房租、利息、账单等）
 */
const applySystemSettlement = (state: GameState & { addNotification: Function }) => {
  return runTurnSettlement(state);
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
        san: Math.max(minStat, state.vitality.metrics.san + effect.sanChange)
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
 */
const updatePrisonStatus = (
  state: GameState,
  turnsServed: number,
  sentenceTurns: number
): Partial<GameState> => {
  const released = turnsServed >= sentenceTurns;
  
  return {
    prison: released ? INITIAL_PRISON : {
      ...state.prison,
      turnsServed
    }
  };
};

/**
 * 显示系统结算通知
 */
const showSettlementNotifications = (
  state: GameState & { addNotification: Function },
  logs: string[]
) => {
  logs.forEach(log => {
    if (log.includes('扣款') || log.includes('利息') || log.includes('租金')) {
      state.addNotification(log, 'warning');
    }
  });
};

/**
 * 检查死亡条件
 */
const checkDeathCondition = (state: GameState): boolean => {
  return (state.vitality.metrics.hp <= 0 || state.vitality.metrics.san <= 0);
};

export interface PrisonSlice {
  prison: {
    inJail: boolean;
    crime: string;
    sentenceTurns: number;
    turnsServed: number;
    bailAmount: number;
  };

  // Actions
  imprison: (reason: string, turns: number, bail: number) => void;
  serveTime: () => { released: boolean; msg: string; died: boolean };
  payCashBail: () => { success: boolean; msg: string };
  signBailBond: () => { success: boolean; msg: string };
}

const INITIAL_PRISON = {
  inJail: false,
  crime: '',
  sentenceTurns: 0,
  turnsServed: 0,
  bailAmount: 0
};

export const createPrisonSlice: StateCreator<any, [], [], PrisonSlice> = (set, get) => ({
  prison: INITIAL_PRISON,

  imprison: (reason, turns, bail) => {
    set({
      prison: {
        inJail: true,
        crime: reason,
        sentenceTurns: turns,
        turnsServed: 0,
        bailAmount: bail
      }
    });
  },

  // 🔴 逻辑说明: 坐牢期间触发系统结算
  serveTime: () => {
    const state = get() as GameState & { addNotification: Function };
    const { vitality, prison } = state;

    // 边界检查：刑期异常
    if (prison.sentenceTurns <= 0) {
      return { released: true, msg: getMessage('invalidSentence'), died: false };
    }

    try {
      // 1. 执行系统结算
      const settlementResult = applySystemSettlement(state);

      // 2. 计算坐牢的物理惩罚
      const jailEffect = calculateDailyJailEffect(vitality.identity.currentClass);
      const jailPenalty = applyJailPenalty(state, jailEffect);

      // 3. 合并状态更新
      let nextState = mergeStateUpdates(state, settlementResult, jailPenalty);

      // 4. 推进时间
      const nextTurn = vitality.time.currentTurn + 1;
      const turnsServed = prison.turnsServed + 1;
      const released = turnsServed >= prison.sentenceTurns;

      nextState.vitality.time = {
        ...state.vitality.time,
        currentTurn: nextTurn
      };

      // 5. 更新监狱状态
      const prisonUpdate = updatePrisonStatus(state, turnsServed, prison.sentenceTurns);
      nextState = { ...nextState, ...prisonUpdate };

      // 6. 应用到 Store
      set(nextState);

      // 7. 显示结算通知
      showSettlementNotifications(state, settlementResult.logs);

      // 8. 检查死亡
      const died = checkDeathCondition(nextState);

      return {
        released,
        msg: released ? getMessage('released') : jailEffect.log,
        died
      };
    } catch (error) {
      console.error('[PrisonSystem] serveTime error:', error);
      return {
        released: false,
        msg: getMessage('serveTimeError'),
        died: false
      };
    }
  },

  payCashBail: () => {
    const state = get() as GameState;
    const { metrics } = state.vitality;
    const cost = state.prison.bailAmount;

    // 边界检查：保释金异常
    if (cost <= 0) return { success: false, msg: getMessage('invalidBailAmount') };
    if (metrics.gold < cost) return { success: false, msg: getMessage('insufficientFunds') };

    // 扣款记账
    const txResult = (state as any).addTransaction('MISC', -cost, '支付保释金');
    if (!txResult.success) {
      return { success: false, msg: getMessage('insufficientFundsForBail') };
    }

    set((s: any) => ({
      prison: INITIAL_PRISON
    }));
    return { success: true, msg: getMessage('cashBailSuccess') };
  },

  // 🔴 逻辑说明: 关联保释贷款 (已重构数值)
  signBailBond: () => {
    const state = get() as GameState & BankSlice & { addTransaction: Function };
    const { metrics } = state.vitality;
    const totalBail = state.prison.bailAmount;
    
    // ✅ 重构：从配置读取首付比例和产品ID
    const rate = prisonRules.bail.bondDownPaymentRate;
    const loanProductId = prisonRules.bail.linkedLoanProductId;

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

    // 1. 尝试借贷 (贷款产品 ID 从配置读取)
    const loanResult = state.takeLoan(loanProductId, loanAmount);
    
    if (!loanResult.success) {
        // 如果贷款失败 (比如配置缺失)，给一个兜底提示
        return { success: false, msg: getMessage('loanRejected', { message: loanResult.message }) };
    }

    // 2. 扣除首付
    const txResult = state.addTransaction('MISC', -downPayment, '保释金首付');
    if (!txResult.success) {
      return { success: false, msg: getMessage('downPaymentTransactionFailed') };
    }

    // 3. 释放
    set((s: any) => ({
      prison: INITIAL_PRISON
    }));

    return { success: true, msg: getMessage('bondSuccess') };
  }
});