// src/logic/market.ts
import { CryptoPosition } from '@/types/schema';
// ✅ 1. 引入数值配置 (Source of Truth)
import marketRules from '@/assets/data/rules/market_rules.json';

/**
 * 计算下一周 BTC 价格 (Juicy Version)
 * 全数据驱动逻辑，核心参数由 marketRules.json 控制
 * * @param currentPrice 当前价格
 * @param newsEffect 新闻影响系数 (-0.5 ~ +0.5)
 */
export const calculateNextPrice = (currentPrice: number, newsEffect: number): { price: number, trend: 'MOON' | 'DOOM' | 'NORMAL' } => {
  // 提取配置，让代码更简洁
  const { market } = marketRules;

  // 1. 市场情绪随机 (Market Sentiment)
  // Math.random() - 0.5 -> -0.5 ~ 0.5
  // * 2 -> -1.0 ~ 1.0 (归一化)
  // * baseVolatility -> 应用基础波动率配置
  const volatilityNoise = (Math.random() - 0.5) * 2 * market.baseVolatility;
  
  // 2. 叠加新闻影响 (新闻是主要驱动力)
  let totalChangePercent = volatilityNoise + newsEffect;

  // 3. Vibe Check: 暴击检测 (Juiciness)
  // 判定是否触发黑天鹅事件 (Moon 或 Doom)
  let trend: 'MOON' | 'DOOM' | 'NORMAL' = 'NORMAL';
  const blackSwan = Math.random(); // 0.0 ~ 1.0
  
  // ✅ 逻辑重构：概率判断读取 JSON 配置
  if (blackSwan < market.events.moonChance) { 
    // MOON 事件: 基础倍率 + 随机波动
    totalChangePercent += market.events.moonMultiplierBase + Math.random(); 
    trend = 'MOON';
  } else if (blackSwan > (1 - market.events.doomChance)) { 
    // DOOM 事件: 基础跌幅 + 随机波动
    totalChangePercent -= market.events.doomMultiplierBase + Math.random() * 0.3;
    trend = 'DOOM';
  }

  // 4. 计算新价格
  let nextPrice = Math.floor(currentPrice * (1 + totalChangePercent));
  
  // ✅ 逻辑重构：保底价格读取 JSON 配置
  if (nextPrice < market.price.min) nextPrice = market.price.min;

  return { price: nextPrice, trend };
};

/**
 * 计算持仓盈亏 (PnL)
 * 纯数学逻辑，保持不变
 * * @param position 持仓对象
 * @param currentPrice 当前市场价格
 */
export const calculatePnL = (position: CryptoPosition, currentPrice: number) => {
  const { entryPrice, leverage, principal, type } = position;
  
  const priceRatio = currentPrice / entryPrice;
  // LONG: 涨了赚钱 (ratio > 1); SHORT: 跌了赚钱 (ratio < 1)
  const rawChange = type === 'LONG' ? (priceRatio - 1) : (1 - priceRatio);
  
  // 杠杆放大 ROI (Return on Investment)
  const roi = rawChange * leverage;
  
  // 盈亏金额
  const pnl = Math.floor(principal * roi);
  
  // 总返还 = 本金 + 盈亏
  const totalValue = principal + pnl;
  
  return { pnl, roi, totalValue };
};

/**
 * 检查是否爆仓
 * * @param position 持仓对象
 * @param currentPrice 当前市场价格
 */
export const checkLiquidation = (position: CryptoPosition, currentPrice: number): boolean => {
  const { roi } = calculatePnL(position, currentPrice);
  
  // ✅ 逻辑重构：爆仓线读取 JSON 配置
  // 默认是 -1.0 (即亏损 100% 本金时爆仓)
  return roi <= marketRules.trading.liquidationThreshold; 
};