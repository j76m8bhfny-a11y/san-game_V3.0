import { StateCreator } from 'zustand';
import { GameState, PlayerClass } from '@/types/schema';
import { calculateDailyJailEffect } from '@/logic/prison';
import { BankSlice } from './createBankSlice';

export interface PrisonSlice {
  prison: {
    inJail: boolean;
    crime: string;
    sentenceDays: number;
    daysServed: number;
    bailAmount: number;
  };

  // Actions
  imprison: (reason: string, days: number, bail: number) => void;
  serveTime: () => { released: boolean; msg: string; died: boolean };
  payCashBail: () => { success: boolean; msg: string };
  signBailBond: () => { success: boolean; msg: string };
}

const INITIAL_PRISON = {
  inJail: false,
  crime: '',
  sentenceDays: 0,
  daysServed: 0,
  bailAmount: 0
};

export const createPrisonSlice: StateCreator<any, [], [], PrisonSlice> = (set, get) => ({
  prison: INITIAL_PRISON,

  // 入狱接口 (供 Event调用)
  imprison: (reason, days, bail) => {
    set({
      prison: {
        inJail: true,
        crime: reason,
        sentenceDays: days,
        daysServed: 0,
        bailAmount: bail
      }
    });
  },

  // 熬刑期
  serveTime: () => {
    const state = get() as GameState;
    const { prison, currentClass, hp, san } = state;
    
    // 1. 计算当日损耗
    const effect = calculateDailyJailEffect(currentClass);
    const newHp = hp + effect.hp;
    const newSan = san + effect.san;
    
    // 2. 检查是否死亡
    if (newHp <= 0) {
      set({ hp: 0 }); // 触发死亡逻辑
      return { released: false, msg: "你在狱中斗殴身亡。", died: true };
    }

    // 3. 更新状态
    const newServed = prison.daysServed + 1;
    const released = newServed >= prison.sentenceDays;

    set({
      hp: Math.min(state.maxHp, newHp),
      san: Math.min(100, newSan),
      prison: released ? INITIAL_PRISON : { ...prison, daysServed: newServed },
      // 强制推移时间
      day: state.day + 1
      // 这里不触发 DailySettlement UI，直接过天
    });

    return { 
      released, 
      msg: released ? "刑满释放。你自由了...暂时。" : effect.log,
      died: false
    };
  },

  // 全额保释
  payCashBail: () => {
    const state = get() as GameState;
    const cost = state.prison.bailAmount;

    if (state.gold < cost) return { success: false, msg: "资金不足。" };

    set({
      gold: state.gold - cost,
      prison: INITIAL_PRISON
    });
    return { success: true, msg: "你支付了保释金。有钱真好。" };
  },

  // 保释债券 (穷人陷阱)
  signBailBond: () => {
    const state = get() as GameState & BankSlice;
    const totalBail = state.prison.bailAmount;
    
    // 首付 10%
    const downPayment = Math.floor(totalBail * 0.1);
    // 剩下 90% 变成高利贷
    const loanAmount = Math.floor(totalBail * 0.9);

    if (state.gold < downPayment) {
      return { success: false, msg: `甚至付不起 10% 的首付 ($${downPayment})。` };
    }

    // 1. 扣首付
    set({ gold: state.gold - downPayment });

    // 2. 自动借贷 (调用 BankSlice)
    // 注意：这里需要确保 BankSlice 的 takeLoan 可以被调用。
    // 由于我们在同一个 Store，可以直接调用
    const loanResult = state.takeLoan('BAIL_BOND', loanAmount);

    if (loanResult.success) {
      set({ prison: INITIAL_PRISON });
      return { success: true, msg: `你签了卖身契。自由了，但背负了 $${loanAmount} 的高利贷。` };
    } else {
      // 如果因为信用分太低连保释债券都借不到 (虽然我们在 JSON 里设置 minScore:0)
      return { success: false, msg: "保释公司拒绝了你的申请。" };
    }
  }
});