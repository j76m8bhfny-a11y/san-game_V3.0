import { StateCreator } from 'zustand';
import { CryptoPosition, NewsItem, GameState } from '@/types/schema';
import { calculateNextPrice, calculatePnL, checkLiquidation } from '@/logic/market';
import newsData from '@/assets/data/news.json'; // ✅ 1. 引入新闻数据源

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
    // ✅ 修复 1: 初始化时预埋一条新闻，避免第一周“盲赌”
    weeklyNews: newsData.length > 0 
      ? (newsData as NewsItem[])[Math.floor(Math.random() * newsData.length)] 
      : null,
  },

  openCryptoAccount: () => {
    const state = get() as GameState & { addTransaction: Function };
    const { vitality } = state;

    if (vitality.metrics.gold < ACCOUNT_FEE) {
      // 理论上 UI 层会拦截，这里做双重保险
      return;
    }

    // 扣除开户费
    state.addTransaction('BANK', -ACCOUNT_FEE, '开通加密货币账户');

    set((s: any) => ({
      crypto: { ...s.crypto, isAccountOpen: true }
    }));
  },

  // ✅ 修复 2: 完整的开仓逻辑，包含原子扣款
  openPosition: (type, principal, leverage) => {
    const state = get() as GameState & { addTransaction: Function };
    const { crypto, vitality } = state;

    // A. 余额检查
    if (vitality.metrics.gold < principal) {
        // UI 应该处理反馈，这里只做逻辑阻断
        return;
    }

    // B. ✅ 核心修复：原子性扣款 (防止免费开仓)
    // 投资属于 BANK 或 MISC 类别，这里用 BANK 比较合适
    state.addTransaction('BANK', -principal, `建立仓位: BTC ${type} x${leverage}`);

    // C. 创建仓位记录
    const newPosition: CryptoPosition = {
      id: generateId(),
      type,
      entryPrice: crypto.btcPrice,
      leverage,
      principal,
      turn: vitality.time.currentTurn
    };

    // D. 更新状态
    set((s: any) => ({
      crypto: {
        ...s.crypto,
        positions: [newPosition, ...s.crypto.positions] // 新仓位排在前面
      }
    }));
  },

  // ✅ 补充: 平仓逻辑
  closePosition: (id) => {
    const state = get() as GameState & { addTransaction: Function };
    const { crypto } = state;
    
    const positionIndex = crypto.positions.findIndex(p => p.id === id);
    if (positionIndex === -1) return;

    const position = crypto.positions[positionIndex];
    
    // 1. 计算最终价值 (PnL)
    // PnL 返回的是纯利润/亏损额，我们需要加上本金才是退回的钱？
    // calculatePnL 通常返回的是 "盈亏金额" (例如 +50 或 -50)
    // 所以最终退回金额 = 本金 + PnL
    const pnl = calculatePnL(position, crypto.btcPrice);
    const returnAmount = Math.max(0, position.principal + pnl); // 只有没爆仓的才能手动平仓，理论上不会小于0

    // 2. 资金回账
    if (returnAmount > 0) {
        state.addTransaction('INCOME', returnAmount, `平仓: BTC ${position.type} (PnL: ${pnl > 0 ? '+' : ''}${pnl})`);
    }

    // 3. 移除仓位
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

    // 1. 计算下周价格
    // 使用当前已知的 weeklyNews 来驱动价格变化
    const newsEffect = weeklyNews ? weeklyNews.effect : 0;
    const { price: nextPrice, trend } = calculateNextPrice(btcPrice, newsEffect);

    // 2. 检查爆仓
    const remainingPositions: CryptoPosition[] = [];
    
    positions.forEach((pos: CryptoPosition) => {
      const isLiquidated = checkLiquidation(pos, nextPrice);
      
      if (isLiquidated) {
        // 💥 爆仓！本金归零，不产生 Transaction 回款
        logs.push(`BTC爆仓: 损失 $${pos.principal}`);
        notes.push(`[强平通知] 市场剧烈波动，你的 ${pos.leverage}x ${pos.type} 仓位已爆仓，本金归零。`);
      } else {
        remainingPositions.push(pos);
      }
    });

    // 3. 抽取“下周”新闻 (Forecast)
    // 玩家在下一周看到的将是这条新闻，用于预测下下周的价格
    const nextWeekNews = allNews.length > 0 
      ? allNews[Math.floor(Math.random() * allNews.length)] 
      : null;

    // 4. 更新状态
    set((s: any) => ({
      crypto: {
        ...s.crypto,
        btcPrice: nextPrice,
        priceHistory: [...s.crypto.priceHistory.slice(1), nextPrice],
        positions: remainingPositions,
        weeklyNews: nextWeekNews
      }
    }));
    
    // 记录市场大盘日志
    let trendLog = `BTC 收盘价: $${nextPrice}`;
    if (trend === 'MOON') trendLog += " 🚀 (To The Moon!)";
    if (trend === 'DOOM') trendLog += " 📉 (Rekt!)";
    logs.push(trendLog);

    return { logs, notes };
  }
});