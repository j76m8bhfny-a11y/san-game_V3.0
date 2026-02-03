import { StateCreator } from 'zustand';
import { GameState } from '@/types/schema';
import { calculateDailyJailEffect } from '@/logic/prison';
import { BankSlice } from './createBankSlice';

export interface PrisonSlice {
  prison: {
    inJail: boolean;
    crime: string;
    sentenceTurns: number; // ✅ Days -> Turns
    turnsServed: number;   // ✅ Days -> Turns
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

  // 入狱接口 (供 Event调用)
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

  // 熬刑期 (改为 Turn)
  serveTime: () => {
    const state = get() as GameState;
    // ✅ 路径修复：从 vitality 获取核心指标
    const { metrics, identity, time } = state.vitality;
    const { prison } = state;
    
    // 1. 计算当日损耗 (传入重构后的 identity.currentClass)
    const effect = calculateDailyJailEffect(identity.currentClass);
    const newHp = metrics.hp + effect.hp;
    const newSan = metrics.san + effect.san;
    
    // 2. 检查是否死亡
    if (newHp <= 0) {
      set((s: any) => ({
        vitality: {
          ...s.vitality,
          metrics: { ...s.vitality.metrics, hp: 0 }
        }
      }));
      return { released: false, msg: "你在狱中斗殴身亡。", died: true };
    }

    // 3. 更新状态
    const newServed = prison.turnsServed + 1;
    const released = newServed >= prison.sentenceTurns;

    set((s: any) => ({
      vitality: {
        ...s.vitality,
        metrics: {
          ...s.vitality.metrics,
          hp: Math.min(metrics.maxHp, newHp),
          san: Math.min(metrics.maxSan, newSan),
        },
        time: {
          ...s.vitality.time,
          currentTurn: time.currentTurn + 1 // ✅ 强制推移 Turn
        }
      },
      prison: released ? INITIAL_PRISON : { ...prison, turnsServed: newServed }
    }));

    return { 
      released, 
      msg: released ? "刑满释放。你自由了...暂时。" : effect.log,
      died: false
    };
  },

  // 全额保释
  payCashBail: () => {
    const state = get() as GameState;
    const { metrics } = state.vitality;
    const cost = state.prison.bailAmount;

    if (metrics.gold < cost) return { success: false, msg: "资金不足。" };

    set((s: any) => ({
      vitality: {
        ...s.vitality,
        metrics: { ...s.vitality.metrics, gold: metrics.gold - cost }
      },
      prison: INITIAL_PRISON
    }));
    return { success: true, msg: "你支付了保释金。有钱真好。" };
  },

  // 保释债券 (穷人陷阱)
  signBailBond: () => {
    const state = get() as GameState & BankSlice;
    const { metrics } = state.vitality;
    const totalBail = state.prison.bailAmount;
    
    // 首付 10%
    const downPayment = Math.floor(totalBail * 0.1);
    const loanAmount = Math.floor(totalBail * 0.9);

    if (metrics.gold < downPayment) {
      return { success: false, msg: `甚至付不起 10% 的首付 ($${downPayment})。` };
    }

    // 1. 扣首付
    set((s: any) => ({
      vitality: {
        ...s.vitality,
        metrics: { ...s.vitality.metrics, gold: metrics.gold - downPayment }
      }
    }));

    // 2. 自动借贷 (调用 BankSlice)
    const loanResult = state.takeLoan('BAIL_BOND', loanAmount);

    if (loanResult.success) {
      set({ prison: INITIAL_PRISON });
      return { success: true, msg: `你签了卖身契。自由了，但背负了 $${loanAmount} 的高利贷。` };
    } else {
      return { success: false, msg: "保释公司拒绝了你的申请。" };
    }
  }
});