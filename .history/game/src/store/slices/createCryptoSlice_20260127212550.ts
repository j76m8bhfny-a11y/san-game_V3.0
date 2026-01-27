import { StateCreator } from 'zustand';
import { CryptoPosition, NewsItem } from '@/types/schema';

// 初始配置
const INITIAL_BTC_PRICE = 10000;
const ACCOUNT_FEE = 300;

export interface CryptoSlice {
  // --- State ---
  crypto: {
    isAccountOpen: boolean;
    btcPrice: number;
    priceHistory: number[];      // 存储最近 7 天的价格
    positions: CryptoPosition[];
    dailyNews: NewsItem | null;
  };

  // --- Actions ---
  openCryptoAccount: () => void;
  // 以下动作在 Phase 2 实现具体逻辑，先占位
  setDailyNews: (news: NewsItem) => void;
  updateBtcPrice: (newPrice: number) => void;
  openPosition: (type: 'LONG' | 'SHORT', principal: number, leverage: number) => void;
  closePosition: (id: string) => void;
}

export const createCryptoSlice: StateCreator<any, [], [], CryptoSlice> = (set, get) => ({
  // --- Initial State ---
  crypto: {
    isAccountOpen: false,
    btcPrice: INITIAL_BTC_PRICE,
    // 初始化 7 天的历史数据，都是 10000，画出来是一条直线
    priceHistory: Array(7).fill(INITIAL_BTC_PRICE), 
    positions: [],
    dailyNews: null,
  },

  // --- Actions ---
  
  // 1. 开户逻辑
  openCryptoAccount: () => {
    const { gold, addNotification, playSfx } = get(); // 假设从 AudioSlice 混入 playSfx
    
    if (gold < ACCOUNT_FEE) {
      if (get().addNotification) get().addNotification('资金不足，无法支付开户费', 'error');
      // 如果有音效：get().playSfx('sfx_deny');
      return;
    }

    set((state: any) => ({
      gold: state.gold - ACCOUNT_FEE,
      crypto: {
        ...state.crypto,
        isAccountOpen: true
      }
    }));
    
    if (get().addNotification) get().addNotification('账户已激活。欢迎来到去中心化世界。', 'success');
    // 如果有音效：get().playSfx('sfx_cash');
  },

  // 2. 设置今日新闻 (将在 nextDay 调用)
  setDailyNews: (news) => {
    set((state: any) => ({
      crypto: { ...state.crypto, dailyNews: news }
    }));
  },

  // 3. 更新价格 (将在 nextDay 调用)
  updateBtcPrice: (newPrice) => {
    set((state: any) => {
      const oldHistory = state.crypto.priceHistory;
      // 保持数组长度为 7，移除最早的，加入最新的
      const newHistory = [...oldHistory.slice(1), newPrice];
      
      return {
        crypto: { 
          ...state.crypto, 
          btcPrice: newPrice,
          priceHistory: newHistory
        }
      };
    });
  },

  // 4. 开仓 (占位，Phase 2 实现)
  openPosition: (type, principal, leverage) => {
    console.log("Open Position TODO", type, principal, leverage);
  },

  // 5. 平仓 (占位，Phase 2 实现)
  closePosition: (id) => {
    console.log("Close Position TODO", id);
  }
});