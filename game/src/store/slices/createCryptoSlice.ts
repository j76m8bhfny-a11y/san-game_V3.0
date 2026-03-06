import { StateCreator } from 'zustand';
import { CryptoPosition, NewsItem, GameState } from '@/types/schema';
import { StoreState } from '@/types/store';
// 引入抽离的算法逻辑
import { calculateNextPrice, calculatePnL, checkLiquidation } from '@/logic/market';
// 引入新闻数据
import newsData from '@/assets/data/news.json';
// ✅ 1. 引入配置文件 (Source of Truth)
import marketRules from '@/assets/data/rules/market_rules.json';

const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

export interface CryptoSlice {
  crypto: {
    isAccountOpen: boolean;
    btcPrice: number;
    priceHistory: number[];
    positions: CryptoPosition[];
    weeklyNews: NewsItem | null;
    weeklyTradesCount: number;  // 🔴 新增：本周交易次数
    lastTradeTurn: number;      // 🔴 新增：上次交易回合
  };

  openCryptoAccount: () => void;
  openPosition: (type: 'LONG' | 'SHORT', principal: number, leverage: number) => void;
  closePosition: (id: string) => void;
  processWeeklyMarket: (allNews: NewsItem[]) => { logs: string[]; notes: string[] };
  resetWeeklyTradeCount: () => void;  // 🔴 新增：每周重置
  canTradeThisTurn: () => boolean;    // 🔴 新增：检查能否交易
  
  // 🔴 新增：立即检查并处理爆仓
  checkAndLiquidatePositions: (currentPrice: number) => { liquidated: number; totalLoss: number };
}

export const createCryptoSlice: StateCreator<StoreState, [], [], CryptoSlice> = (set, get) => ({
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
    // 🔴 初始化交易限制
    weeklyTradesCount: 0,
    lastTradeTurn: -1,
  },

  // 🔴 调整点1: KYC验证 - 需要驾照
  openCryptoAccount: () => {
    const state = get() as GameState & { addTransaction: Function; addNotification: Function };
    const { vitality, inventory } = state;

    // ✅ 3. 获取配置的开户费 (与 Sidebar UI 保持一致)
    const FEE = marketRules.crypto.accountFee;

    // 🔴 检查是否有驾照 (KYC验证)
    const hasLicense = inventory.some((id: string) => 
      marketRules.crypto.kyc.acceptedLicenses.includes(id)
    );
    
    if (!hasLicense) {
      state.addNotification('KYC验证失败：需要有效驾照', 'error');
      return;
    }

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

  // 🔴 调整点2 & 6: 网络费 + 每周限一次交易
  openPosition: (type, principal, leverage) => {
    const state = get() as GameState & { addTransaction: Function; addNotification: Function };
    const { crypto, vitality } = state;
    const { currentTurn } = vitality.time;
    
    // 🔴 检查本周交易次数
    if (crypto.weeklyTradesCount >= marketRules.trading.maxTradesPerTurn) {
      state.addNotification('本周交易次数已用完，请等待下周', 'error');
      return;
    }

    // 🔴 高杠杆风险免责声明检查 (50x及以上)
    if (leverage >= 50) {
      state.addNotification(`⚠️ 警告: ${leverage}x杠杆极易遭遇插针(Flash Crash)爆仓，历史概率60%`, 'warning');
    }

    // 🔴 扣除网络费 (动态计算: 基础费$50 + 交易额2%)
    const networkFeeBase = marketRules.trading.networkFeeBase ?? 50;
    const networkFeeRate = marketRules.trading.networkFeeRate ?? 0.02;
    const networkFee = Math.floor(networkFeeBase + principal * networkFeeRate);
    const totalCost = principal + networkFee;

    // 1. 检查资金 (包含网络费)
    if (vitality.metrics.gold < totalCost) {
      state.addNotification(`资金不足（需要本金$${principal} + 网络费$${networkFee}）`, 'error');
      return;
    }

    // 2. 原子扣款 (本金 + 网络费)
    const txResult = state.addTransaction('BANK', -totalCost, `开仓: BTC ${type} x${leverage} (网络费$${networkFee})`);
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
        positions: [newPosition, ...s.crypto.positions],
        weeklyTradesCount: s.crypto.weeklyTradesCount + 1,  // 🔴 增加交易次数
        lastTradeTurn: currentTurn
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

  // 🔴 新增：检查能否交易
  canTradeThisTurn: () => {
    const { crypto } = get();
    return crypto.weeklyTradesCount < marketRules.trading.maxTradesPerTurn;
  },

  // 🔴 新增：立即检查并处理爆仓（价格剧烈波动时调用）
  checkAndLiquidatePositions: (currentPrice: number) => {
    const state = get() as GameState & { 
      addTransaction: Function; 
      modifyStats: Function; 
      addNotification: Function;
    };
    const { crypto } = state;
    
    const remainingPositions: CryptoPosition[] = [];
    let liquidatedCount = 0;
    let totalLoss = 0;
    let totalInsightChange = 0;
    const liquidationNotes: string[] = [];
    
    crypto.positions.forEach((pos: CryptoPosition) => {
      const isLiquidated = checkLiquidation(pos, currentPrice);
      
      if (isLiquidated) {
        liquidatedCount++;
        totalLoss += pos.principal;
        
        // 记录爆仓损失到账本
        state.addTransaction(
          'MISC', 
          -pos.principal, 
          `[爆仓] ${pos.type} x${pos.leverage} @ $${pos.entryPrice.toFixed(0)}`
        );
        
        // 爆仓灵视暴击
        const liquidationInsightSpike = marketRules.insight?.liquidationSpike ?? 30;
        totalInsightChange += liquidationInsightSpike;
        
        liquidationNotes.push(
          `💥 仓位爆仓! ${pos.type} ${pos.leverage}x杠杆, 损失 $${pos.principal}`
        );
        
        console.warn(`[爆仓] ${pos.type} x${pos.leverage} 仓位被强制平仓`);
      } else {
        remainingPositions.push(pos);
      }
    });
    
    // 如果有爆仓，更新状态
    if (liquidatedCount > 0) {
      // 更新仓位列表
      set((s: any) => ({
        crypto: { ...s.crypto, positions: remainingPositions }
      }));
      
      // 应用灵视变更
      if (totalInsightChange !== 0) {
        state.modifyStats({ 
          insight: state.vitality.metrics.insight + totalInsightChange 
        });
      }
      
      // 发送通知
      state.addNotification(
        `⚠️ ${liquidatedCount} 个仓位爆仓! 损失 $${totalLoss}`,
        'error'
      );
      
      // 如果损失严重，额外警告
      if (totalLoss > 10000) {
        state.addNotification(
          '💀 巨额爆仓损失... 你的存在主义危机加深了',
          'warning'
        );
      }
    }
    
    return { liquidated: liquidatedCount, totalLoss };
  },

  // 🔴 新增：每周重置交易次数
  resetWeeklyTradeCount: () => {
    set((s: any) => ({
      crypto: {
        ...s.crypto,
        weeklyTradesCount: 0
      }
    }));
  },

  processWeeklyMarket: (allNews) => {
    const state = get() as GameState & { addTransaction: Function; modifyStats: Function; addNotification: Function };
    const { btcPrice, weeklyNews, positions } = state.crypto;
    const logs: string[] = [];
    const notes: string[] = [];
    let totalInsightChange = 0;

    // 0. 持仓盯盘精神内耗：每周持有仓位+5灵视
    if (positions.length > 0) {
      const holdingInsightCost = marketRules.insight?.holdingPositionPerTurn ?? 5;
      totalInsightChange += holdingInsightCost * positions.length;
      notes.push(`[盯盘焦虑] 持有${positions.length}个加密仓位，精神内耗灵视+${holdingInsightCost * positions.length}`);
    }

    // 1. 计算下周价格 (使用本周新闻)
    // ⚠️ 注意: calculateNextPrice 内部现在已经读取 marketRules.json 的波动率配置了
    const newsEffect = weeklyNews ? weeklyNews.effect : 0;
    const { price: nextPrice, trend } = calculateNextPrice(btcPrice, newsEffect);

    // 2. 检查爆仓（使用统一的爆仓检查函数）
    const { checkAndLiquidatePositions } = get();
    const liquidationResult = checkAndLiquidatePositions(nextPrice);
    
    if (liquidationResult.liquidated > 0) {
      logs.push(`BTC爆仓: 损失 $${liquidationResult.totalLoss}`);
      notes.push(`[强平通知] 市场剧烈波动，${liquidationResult.liquidated} 个仓位已爆仓，损失 $${liquidationResult.totalLoss}`);
      
      // 🔴 爆仓灵视暴击
      const liquidationInsightSpike = (marketRules.insight?.liquidationSpike ?? 30) * liquidationResult.liquidated;
      totalInsightChange += liquidationInsightSpike;
      notes.push(`[存在主义危机] 看着归零的账户，你瞬间看透了去中心化金融的本质。灵视+${liquidationInsightSpike}！`);
    }

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
          // positions 已由 checkAndLiquidatePositions 更新
          weeklyNews: nextWeekNews,
          weeklyTradesCount: 0  // 🔴 每周重置交易次数
        }
      };
    });

    // 5. 应用灵视变更（持仓焦虑等）
    if (totalInsightChange !== 0) {
      state.modifyStats({ 
        insight: state.vitality.metrics.insight + totalInsightChange 
      });
    }

    // 6. 生成大盘日志
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
