import { StateCreator } from 'zustand';
import { CryptoPosition, NewsItem, GameState } from '@/types/schema';
import { calculateNextPrice, calculatePnL, checkLiquidation } from '@/logic/market';
import newsData from '@/assets/data/news.json';

const INITIAL_BTC_PRICE = 15000; 
const ACCOUNT_FEE = 500; 
const generateId = () => Math.random().toString(36).substring(2, 9);

export interface CryptoSlice {
  crypto: {
    isAccountOpen: boolean;
    btcPrice: number;
    priceHistory: number[];
    positions: CryptoPosition[];
    weeklyNews: NewsItem | null; 
  };

  openCryptoAccount: () => void;
  openPosition: (type: 'LONG' | 'SHORT', principal: number, leverage: number) => void;
  closePosition: (id: string) => void;
  processWeeklyMarket: (allNews: NewsItem[]) => { logs: string[]; notes: string[] };
}

export const createCryptoSlice: StateCreator<any, [], [], CryptoSlice> = (set, get) => ({
  crypto: {
    isAccountOpen: false,
    btcPrice: INITIAL_BTC_PRICE,
    priceHistory: Array(7).fill(INITIAL_BTC_PRICE),
    positions: [],
    weeklyNews: newsData.length > 0 
      ? (newsData as NewsItem[])[Math.floor(Math.random() * newsData.length)] 
      : null,
  },

  openCryptoAccount: () => {
    const state = get() as GameState & { addTransaction: Function };
    const { vitality } = state;

    if (vitality.metrics.gold < ACCOUNT_FEE) return;

    state.addTransaction('BANK', -ACCOUNT_FEE, '开通加密货币账户');

    set((s: any) => ({
      crypto: { ...s.crypto, isAccountOpen: true }
    }));
  },

  openPosition: (type, principal, leverage) => {
    const state = get() as GameState & { addTransaction: Function };
    const { crypto, vitality } = state;

    if (vitality.metrics.gold < principal) return;

    // 原子扣款
    state.addTransaction('BANK', -principal, `建立仓位: BTC ${type} x${leverage}`);

    const newPosition: CryptoPosition = {
      id: generateId(),
      type,
      entryPrice: crypto.btcPrice,
      leverage,
      principal,
      turn: vitality.time.currentTurn
    };

    set((s: any) => ({
      crypto: {
        ...s.crypto,
        positions: [newPosition, ...s.crypto.positions]
      }
    }));
  },

  closePosition: (id) => {
    const state = get() as GameState & { addTransaction: Function };
    const { crypto } = state;
    
    const positionIndex = crypto.positions.findIndex(p => p.id === id);
    if (positionIndex === -1) return;

    const position = crypto.positions[positionIndex];
    
    // ✅ 修复：解构获取 pnl 对象
    // calculatePnL 返回的是 { pnl: number, roi: number, totalValue: number }
    const { pnl } = calculatePnL(position, crypto.btcPrice);
    
    // 计算退回金额：本金 + 盈亏 (注意 pnl 可能是负数)
    // 例如：本金 100，亏损 -20，退回 80
    const returnAmount = Math.max(0, position.principal + pnl); 

    // 资金回账
    if (returnAmount > 0) {
        state.addTransaction('INCOME', returnAmount, `平仓: BTC ${position.type} (PnL: ${pnl > 0 ? '+' : ''}${pnl})`);
    }

    // 移除仓位
    const newPositions = [...crypto.positions];
    newPositions.splice(positionIndex, 1);

    set((s: any) => ({
      crypto: { ...s.crypto, positions: newPositions }
    }));
  },

  processWeeklyMarket: (allNews) => {
    const state = get();
    const { btcPrice, positions, weeklyNews } = state.crypto;
    const logs: string[] = [];
    const notes: string[] = [];

    const newsEffect = weeklyNews ? weeklyNews.effect : 0;
    const { price: nextPrice, trend } = calculateNextPrice(btcPrice, newsEffect);

    const remainingPositions: CryptoPosition[] = [];
    
    positions.forEach((pos: CryptoPosition) => {
      const isLiquidated = checkLiquidation(pos, nextPrice);
      
      if (isLiquidated) {
        logs.push(`BTC爆仓: 损失 $${pos.principal}`);
        notes.push(`[强平通知] 市场剧烈波动，你的 ${pos.leverage}x ${pos.type} 仓位已爆仓，本金归零。`);
      } else {
        remainingPositions.push(pos);
      }
    });

    const nextWeekNews = allNews.length > 0 
      ? allNews[Math.floor(Math.random() * allNews.length)] 
      : null;

    set((s: any) => ({
      crypto: {
        ...s.crypto,
        btcPrice: nextPrice,
        priceHistory: [...s.crypto.priceHistory.slice(1), nextPrice],
        positions: remainingPositions,
        weeklyNews: nextWeekNews
      }
    }));
    
    let trendLog = `BTC 收盘价: $${nextPrice}`;
    if (trend === 'MOON') trendLog += " 🚀 (To The Moon!)";
    if (trend === 'DOOM') trendLog += " 📉 (Rekt!)";
    logs.push(trendLog);

    return { logs, notes };
  }
});