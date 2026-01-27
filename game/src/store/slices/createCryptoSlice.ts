import { StateCreator } from 'zustand';
import { CryptoPosition, NewsItem } from '@/types/schema';
import { calculateNextPrice, calculatePnL, checkLiquidation } from '@/logic/market';

const INITIAL_BTC_PRICE = 10000;
const ACCOUNT_FEE = 300;

export interface CryptoSlice {
  crypto: {
    isAccountOpen: boolean;
    btcPrice: number;
    priceHistory: number[];
    positions: CryptoPosition[];
    dailyNews: NewsItem | null;
  };

  openCryptoAccount: () => void;
  openPosition: (type: 'LONG' | 'SHORT', principal: number, leverage: number) => void;
  closePosition: (id: string) => void;
  
  // ✨ 新增: 处理夜间市场变动 (结算、爆仓、生成新新闻)
  processNightlyMarket: (allNews: NewsItem[]) => { logs: string[]; notes: string[] };
}

export const createCryptoSlice: StateCreator<any, [], [], CryptoSlice> = (set, get) => ({
  crypto: {
    isAccountOpen: false,
    btcPrice: INITIAL_BTC_PRICE,
    priceHistory: Array(7).fill(INITIAL_BTC_PRICE),
    positions: [],
    dailyNews: null,
  },

  openCryptoAccount: () => {
    const { gold } = get();
    if (gold < ACCOUNT_FEE) {
      get().addNotification('资金不足，无法支付开户费', 'error');
      if (get().playSfx) get().playSfx('sfx_deny');
      return;
    }
    set((state: any) => ({
      gold: state.gold - ACCOUNT_FEE,
      crypto: { ...state.crypto, isAccountOpen: true }
    }));
    get().addNotification('账户已激活', 'success');
    if (get().playSfx) get().playSfx('sfx_cash');
  },

  openPosition: (type, principal, leverage) => {
    const { gold, day } = get();
    
    // 1. 检查资金
    if (gold < principal) {
      get().addNotification('可用资金不足', 'error');
      return;
    }

    // 2. 扣款并建仓
    const newPosition: CryptoPosition = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      entryPrice: get().crypto.btcPrice,
      leverage,
      principal,
      day
    };

    set((state: any) => ({
      gold: state.gold - principal,
      crypto: {
        ...state.crypto,
        positions: [...state.crypto.positions, newPosition]
      }
    }));

    if (get().playSfx) get().playSfx('sfx_cash');
    get().addNotification(`${type === 'LONG' ? '做多' : '做空'} BTC x${leverage} 成功`, 'success');
  },

  closePosition: (id) => {
    const state = get();
    const position = state.crypto.positions.find((p: CryptoPosition) => p.id === id);
    if (!position) return;

    // 1. 计算结算金额
    const { pnl } = calculatePnL(position, state.crypto.btcPrice);
    const returnAmount = Math.floor(position.principal + pnl);

    // 2. 返还资金 (如果是负数，已经在爆仓逻辑处理了，这里通常是手动平仓，不会小于0太多)
    // 但为了安全，Math.max(0, returnAmount)
    const finalReturn = Math.max(0, returnAmount);

    set((s: any) => ({
      gold: s.gold + finalReturn,
      crypto: {
        ...s.crypto,
        positions: s.crypto.positions.filter((p: CryptoPosition) => p.id !== id)
      }
    }));

    if (get().playSfx) get().playSfx('sfx_cash');
    get().addNotification(`平仓完成。净盈亏: ${pnl >= 0 ? '+' : ''}$${pnl}`, pnl >= 0 ? 'success' : 'warning');
  },

  // 🌙 核心：夜间市场结算
  processNightlyMarket: (allNews) => {
    const state = get();
    const { btcPrice, dailyNews, positions } = state.crypto;
    const logs: string[] = [];
    const notes: string[] = [];

    // 1. 计算新价格
    // 使用“昨天”的新闻效果来计算“今天早上”的价格
    // 如果没有新闻 (第一天)，效果为 0
    const newsEffect = dailyNews ? dailyNews.effect : 0;
    const nextPrice = calculateNextPrice(btcPrice, newsEffect);

    // 2. 检查爆仓
    const remainingPositions: CryptoPosition[] = [];
    positions.forEach((pos: CryptoPosition) => {
      const isLiquidated = checkLiquidation(pos, nextPrice);
      
      if (isLiquidated) {
        // 💥 爆仓！本金归零，移除仓位
        logs.push(`BTC爆仓: 损失 $${pos.principal}`);
        notes.push(`[强平通知] 你的 ${pos.leverage}x ${pos.type} 仓位已爆仓，本金全损。`);
      } else {
        remainingPositions.push(pos);
      }
    });

    // 3. 抽取明日新闻
    // 从 allNews 中随机选一条，作为“今天白天”滚动播放的新闻，影响“明晚”的结算
    const randomNews = allNews.length > 0 
      ? allNews[Math.floor(Math.random() * allNews.length)] 
      : null;

    // 4. 更新状态
    set((s: any) => ({
      crypto: {
        ...s.crypto,
        btcPrice: nextPrice,
        priceHistory: [...s.crypto.priceHistory.slice(1), nextPrice],
        positions: remainingPositions,
        dailyNews: randomNews
      }
    }));

    if (nextPrice !== btcPrice) {
      const change = ((nextPrice - btcPrice) / btcPrice * 100).toFixed(2);
      logs.push(`BTC ${nextPrice} (${change}%)`);
    }

    return { logs, notes };
  }
});