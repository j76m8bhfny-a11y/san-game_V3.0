import { StateCreator } from 'zustand';
import { GameState } from '@/types/schema';
import { calculateDailyJailEffect } from '@/logic/prison';
import { BankSlice } from './createBankSlice';
import { runTurnSettlement } from '@/systems/SystemRegistry'; // ✅ 引入结算核心

// ✅ 1. 引入数值配置文件
import prisonRules from '@/assets/data/rules/prisonRules.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

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

    // 1. 执行系统结算 (房租、利息、账单等，但 JobSystem 已被屏蔽)
    const result = runTurnSettlement(state);

    // 2. 计算坐牢的物理惩罚 (注意：calculateDailyJailEffect 内部也应重构为读取配置)
    const effect = calculateDailyJailEffect(vitality.identity.currentClass);
    
    // 3. 合并所有更新
    // 注意：我们需要小心合并 vitality，因为 runTurnSettlement 和 jailEffect 都改了它
    const nextTurn = vitality.time.currentTurn + 1;
    const turnsServed = prison.turnsServed + 1;
    const released = turnsServed >= prison.sentenceTurns;

    // 基础更新 (来自 SystemRegistry)
    let nextState = {
        ...state,
        ...result.updates,
        vitality: result.updates.vitality ? {
            ...state.vitality, // 基础
            ...result.updates.vitality, // 覆盖
            metrics: { ...state.vitality.metrics, ...(result.updates.vitality.metrics || {}) }
        } : state.vitality
    };

    // 叠加监狱惩罚 (HP/SAN)
    const { minStat } = SYSTEM_RULES.caps;
    if (nextState.vitality && nextState.vitality.metrics) {
        nextState.vitality.metrics.hp = Math.max(minStat, nextState.vitality.metrics.hp + effect.hp);
        nextState.vitality.metrics.san = Math.max(minStat, nextState.vitality.metrics.san + effect.san);
    }

    // 推进时间与刑期
    nextState.vitality.time = {
        ...state.vitality.time,
        currentTurn: nextTurn
    };
    
    // 如果释放，重置监狱状态；否则更新刑期
    if (released) {
        nextState.prison = INITIAL_PRISON;
    } else {
        nextState.prison = {
            ...state.prison,
            turnsServed
        };
    }

    // 4. 应用到 Store
    set(nextState);

    // 5. 反馈
    // 将系统结算的关键信息展示给玩家，让他们感到痛
    result.logs.forEach(log => {
        if (log.includes('扣款') || log.includes('利息') || log.includes('租金')) {
            state.addNotification(log, 'warning');
        }
    });

    // 检查死亡
    const died = (nextState.vitality.metrics.hp <= 0 || nextState.vitality.metrics.san <= 0);

    return { 
      released, 
      msg: released ? "刑满释放。你自由了...暂时。" : effect.log,
      died
    };
  },

  payCashBail: () => {
    const state = get() as GameState;
    const { metrics } = state.vitality;
    const cost = state.prison.bailAmount;

    if (metrics.gold < cost) return { success: false, msg: "资金不足。" };

    // 扣款记账
    (state as any).addTransaction('MISC', -cost, '支付保释金');

    set((s: any) => ({
      prison: INITIAL_PRISON
    }));
    return { success: true, msg: "你支付了保释金。有钱真好。" };
  },

  // 🔴 逻辑说明: 关联保释贷款 (已重构数值)
  signBailBond: () => {
    const state = get() as GameState & BankSlice & { addTransaction: Function };
    const { metrics } = state.vitality;
    const totalBail = state.prison.bailAmount;
    
    // ✅ 重构：从配置读取首付比例和产品ID
    const rate = prisonRules.bail.bondDownPaymentRate;
    const loanProductId = prisonRules.bail.linkedLoanProductId;

    const downPayment = Math.floor(totalBail * rate);
    const loanAmount = totalBail - downPayment; // 剩余金额走贷款

    // 检查首付
    if (metrics.gold < downPayment) {
      // 这里的 100 也可以考虑抽离，或者直接用 rate * 100
      return { success: false, msg: `甚至付不起 ${(rate * 100)}% 的首付 ($${downPayment})。` };
    }

    // 1. 尝试借贷 (贷款产品 ID 从配置读取)
    const loanResult = state.takeLoan(loanProductId, loanAmount);
    
    if (!loanResult.success) {
        // 如果贷款失败 (比如配置缺失)，给一个兜底提示
        return { success: false, msg: `保释行拒绝了你的申请: ${loanResult.message}` };
    }

    // 2. 扣除首付
    state.addTransaction('MISC', -downPayment, '保释金首付');

    // 3. 释放
    set((s: any) => ({
      prison: INITIAL_PRISON
    }));

    return { success: true, msg: "你签下了高利贷保释单。记得按时还款。" };
  }
});