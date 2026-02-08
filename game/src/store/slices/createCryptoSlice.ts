import { StateCreator } from 'zustand';
import { CryptoPosition, NewsItem, GameState } from '@/types/schema';
// 引入抽离的算法逻辑
import { calculateNextPrice, calculatePnL, checkLiquidation } from '@/logic/market';
// 引入新闻数据
import newsData from '@/assets/data/news.json';
// ✅ 1. 引入配置文件 (Source of Truth)
import marketRules from '@/assets/data/rules/marketRules.json';

const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

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
    // ✅ 2. 使用配置的初始价格
    btcPrice: marketRules.crypto.initialPrice,
    // 初始化历史价格数组
    priceHistory: Array(7).fill(marketRules.crypto.initialPrice),
    positions: [],
    // 初始化预埋新闻，防止第一周盲赌
    weeklyNews: newsData.length > 0 
      ? (newsData as NewsItem[])[Math.floor(Math.random() * newsData.length)] 
      : null,
  },

  openCryptoAccount: () => {
    const state = get() as GameState & { addTransaction: Function; addNotification: Function };
    const { vitality } = state;

    // ✅ 3. 获取配置的开户费 (与 Sidebar UI 保持一致)
    const FEE = marketRules.crypto.accountFee;

    if (vitality.metrics.gold < FEE) {
      state.addNotification('资金不足，无法支付去中心化网络接入费', 'error');
      return;
    }
    
    // 支付开户费
    const txResult = state.addTransaction('BANK', -FEE, '开通加密货币账户');
    if (!txResult.success) {
      state.addNotification('资金不足以支付开户费', 'error');
      return;
    }

    set((s: any) => ({
      crypto: { ...s.crypto, isAccountOpen: true }
    }));
    
    state.addNotification('网络已连接。Welcome to the degenerate future.', 'success');
  },

  openPosition: (type, principal, leverage) => {
    const state = get() as GameState & { addTransaction: Function; addNotification: Function };
    const { crypto, vitality } = state;
    
    // 1. 检查资金
    if (vitality.metrics.gold < principal) {
      state.addNotification('可用资金不足以建立此仓位', 'error');
      return;
    }

    // 2. 原子扣款
    const txResult = state.addTransaction('BANK', -principal, `开仓: BTC ${type} x${leverage}`);
    if (!txResult.success) {
      state.addNotification('资金不足以建立仓位', 'error');
      return;
    }

    // 3. 记录仓位
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

    state.addNotification(`${type === 'LONG' ? '做多' : '做空'} BTC x${leverage} 成功`, 'success');
  },

  closePosition: (id) => {
    const state = get() as GameState & { addTransaction: Function; addNotification: Function };
    const { crypto } = state;
    
    const positionIndex = crypto.positions.findIndex(p => p.id === id);
    if (positionIndex === -1) return;

    const position = crypto.positions[positionIndex];
    
    // 1. 调用 logic/market.ts 计算盈亏 (纯函数，算法已在 market.ts 中统一)
    const { pnl, totalValue } = calculatePnL(position, crypto.btcPrice);
    
    // 2. 资金回笼 (本金 + 盈亏)
    // totalValue = principal + pnl，如果亏损超过本金，理论上可能为负
    // 但实际爆仓已在 processWeeklyMarket 中处理，此处做防御性保护
    const returnAmount = Math.max(0, totalValue);

    if (returnAmount > 0 || pnl < 0) {
        // 有资金回笼或亏损都需要记账
        const sign = pnl >= 0 ? '+' : '';
        state.addTransaction('INCOME', returnAmount, `平仓结算 (PnL: ${sign}$${pnl})`);
    }

    // 3. 移除仓位
    const newPositions = [...crypto.positions];
    newPositions.splice(positionIndex, 1);

    set((s: any) => ({
      crypto: { ...s.crypto, positions: newPositions }
    }));
    
    // 4. 根据盈亏显示不同颜色的通知
    const msgType = pnl >= 0 ? 'success' : (pnl > -position.principal ? 'warning' : 'error');
    state.addNotification(`平仓完成。净盈亏: $${pnl}`, msgType);
  },

  processWeeklyMarket: (allNews) => {
    const state = get() as GameState & { addTransaction: Function };
    const { btcPrice, weeklyNews, positions } = state.crypto;
    const logs: string[] = [];
    const notes: string[] = [];

    // 1. 计算下周价格 (使用本周新闻)
    // ⚠️ 注意: calculateNextPrice 内部现在已经读取 marketRules.json 的波动率配置了
    const newsEffect = weeklyNews ? weeklyNews.effect : 0;
    const { price: nextPrice, trend } = calculateNextPrice(btcPrice, newsEffect);

    // 2. 检查爆仓
    const remainingPositions: CryptoPosition[] = [];
    positions.forEach((pos: CryptoPosition) => {
      // ⚠️ 注意: checkLiquidation 内部也读取了 configuration 的阈值
      const isLiquidated = checkLiquidation(pos, nextPrice);
      
      if (isLiquidated) {
        logs.push(`BTC爆仓: 损失 $${pos.principal}`);
        notes.push(`[强平通知] 市场剧烈波动，你的 ${pos.leverage}x ${pos.type} 仓位已爆仓，本金归零。`);
        // 记录爆仓损失到账本
        state.addTransaction('MISC', -pos.principal, `爆仓强平: ${pos.type} x${pos.leverage} 仓位`);
      } else {
        remainingPositions.push(pos);
      }
    });

    // 3. 生成给下周看的新闻 (Forecast)
    const nextWeekNews = allNews.length > 0 
      ? allNews[Math.floor(Math.random() * allNews.length)] 
      : null;

    // 4. 更新状态（使用固定长度的环形缓冲区）
    set((s: any) => {
      const HISTORY_LENGTH = 7; // 固定保留7周历史
      const prevHistory = s.crypto.priceHistory || [];
      
      // 环形缓冲区：移除最旧的，添加最新的，确保长度始终为 HISTORY_LENGTH
      let newHistory: number[];
      if (prevHistory.length >= HISTORY_LENGTH) {
        newHistory = [...prevHistory.slice(1), nextPrice];
      } else {
        // 初始化阶段，填充到固定长度
        const padding = Array(HISTORY_LENGTH - prevHistory.length - 1).fill(btcPrice);
        newHistory = [...prevHistory, ...padding, nextPrice];
      }
      
      return {
        crypto: {
          ...s.crypto,
          btcPrice: nextPrice,
          priceHistory: newHistory,
          positions: remainingPositions,
          weeklyNews: nextWeekNews
        }
      };
    });

    // 5. 生成大盘日志
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