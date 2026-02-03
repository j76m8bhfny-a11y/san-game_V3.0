import { StateCreator } from 'zustand';
import { CryptoPosition, NewsItem } from '@/types/schema';
import { calculateNextPrice, calculatePnL, checkLiquidation } from '@/logic/market';

const INITIAL_BTC_PRICE = 15000; // 初始价格稍微调高一点符合现代背景
const ACCOUNT_FEE = 500; // 开户费

export interface CryptoSlice {
  crypto: {
    isAccountOpen: boolean;
    btcPrice: number;
    priceHistory: number[];
    positions: CryptoPosition[];
    weeklyNews: NewsItem | null; // 改名：这周的新闻
  };

  openCryptoAccount: () => void;
  openPosition: (type: 'LONG' | 'SHORT', principal: number, leverage: number) => void;
  closePosition: (id: string) => void;
  
  // ✨ 重构: 处理周结算 (结算、爆仓、生成下周新闻)
  processWeeklyMarket: (allNews: NewsItem[]) => { logs: string[]; notes: string[] };
}

export const createCryptoSlice: StateCreator<any, [], [], CryptoSlice> = (set, get) => ({
  crypto: {
    isAccountOpen: false,
    btcPrice: INITIAL_BTC_PRICE,
    priceHistory: Array(7).fill(INITIAL_BTC_PRICE),
    positions: [],
    weeklyNews: null,
  },

  openCryptoAccount: () => {
    const { gold, vitality } = get();
    // 检查资金 (依然检查 vitality.gold)
    if (vitality.metrics.gold < ACCOUNT_FEE) {
      get().addNotification('资金不足，无法支付去中心化网络接入费', 'error');
      if (get().playSfx) get().playSfx('sfx_deny');
      return;
    }
    
    // 💸 交易: 支付开户费
    get().addTransaction('MISC', -ACCOUNT_FEE, '开通加密货币账户');

    set((state: any) => ({
      crypto: { ...state.crypto, isAccountOpen: true }
    }));
    
    get().addNotification('网络已连接。Welcome to the degenerate future.', 'success');
    if (get().playSfx) get().playSfx('sfx_cash');
  },

  openPosition: (type, principal, leverage) => {
    const { vitality } = get();
    const currentGold = vitality.metrics.gold;
    const currentTurn = vitality.time.currentTurn;
    
    // 1. 检查资金
    if (currentGold < principal) {
      get().addNotification('可用资金不足', 'error');
      return;
    }

    // 2. 💸 交易: 投入本金 (计入 INVESTMENT 类别，或者 MISC)
    // 建议使用 INVESTMENT 类别，如果没有定义，暂时归类到 MISC 或 BILL
    // 这里为了账单清晰，我们记录为负数支出
    get().addTransaction('MISC', -principal, `开仓: ${type} BTC x${leverage}`);

    // 3. 建仓
    const newPosition: CryptoPosition = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      entryPrice: get().crypto.btcPrice,
      leverage,
      principal,
      turn: currentTurn // ✅ Day -> Turn
    };

    set((state: any) => ({
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
    const { pnl, totalValue } = calculatePnL(position, state.crypto.btcPrice);
    
    // 2. 安全过滤 (防止负数导致扣钱，爆仓逻辑单独处理)
    const returnAmount = Math.max(0, totalValue);

    // 3. 💸 交易: 资金回笼
    // 只有当有钱回来时才记账
    if (returnAmount > 0) {
        const sign = pnl >= 0 ? '+' : '';
        get().addTransaction('INCOME', returnAmount, `平仓结算 (PnL: ${sign}$${pnl})`);
    }

    // 4. 移除仓位
    set((s: any) => ({
      crypto: {
        ...s.crypto,
        positions: s.crypto.positions.filter((p: CryptoPosition) => p.id !== id)
      }
    }));

    if (get().playSfx) get().playSfx('sfx_cash');
    const msgType = pnl >= 0 ? 'success' : (pnl > -position.principal ? 'warning' : 'error');
    get().addNotification(`平仓完成。净盈亏: ${pnl}`, msgType);
  },

  // 🌙 核心：周结算 (Process Weekly Market)
  processWeeklyMarket: (allNews) => {
    const state = get();
    const { btcPrice, weeklyNews, positions } = state.crypto;
    const logs: string[] = [];
    const notes: string[] = [];

    // 1. 计算新价格
    // 使用“本周”的新闻效果结算
    const newsEffect = weeklyNews ? weeklyNews.effect : 0;
    const { price: nextPrice, trend } = calculateNextPrice(btcPrice, newsEffect);

    // 2. 检查爆仓
    const remainingPositions: CryptoPosition[] = [];
    positions.forEach((pos: CryptoPosition) => {
      const isLiquidated = checkLiquidation(pos, nextPrice);
      
      if (isLiquidated) {
        // 💥 爆仓！
        // 不产生 Transaction (钱已经亏光了，不需要退回 0 元)
        // 但需要记录日志
        logs.push(`BTC爆仓: 损失 $${pos.principal}`);
        notes.push(`[强平通知] 市场剧烈波动，你的 ${pos.leverage}x ${pos.type} 仓位已爆仓，本金归零。`);
      } else {
        remainingPositions.push(pos);
      }
    });

    // 3. 抽取下周新闻 (Forecast)
    // 这里的逻辑是：这周结束了，生成的新闻是给“下周”看的
    // 玩家在下周的操作将基于这条新闻
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

    // 5. 日志生成
    if (nextPrice !== btcPrice) {
      const changePercent = ((nextPrice - btcPrice) / btcPrice * 100).toFixed(2);
      const trendEmoji = parseFloat(changePercent) > 0 ? '📈' : '📉';
      logs.push(`BTC ${trendEmoji} ${nextPrice} (${changePercent}%)`);
      
      if (trend === 'MOON') notes.push(`🚀 市场疯狂！比特币直冲云霄！`);
      if (trend === 'DOOM') notes.push(`🩸 血洗！加密货币市场崩盘！`);
    }

    return { logs, notes };
  }
});