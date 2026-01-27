import { CryptoPosition } from '@/types/schema';

// 基础波动范围 (-5% 到 +5%)
const BASE_VOLATILITY = 0.05; 

/**
 * 计算下一日 BTC 价格
 * @param currentPrice 当前价格
 * @param newsEffect 新闻影响系数 (例如 0.15 或 -0.2)
 */
export const calculateNextPrice = (currentPrice: number, newsEffect: number): number => {
  // 1. 生成基础随机波动: (Math.random() * 0.1) - 0.05 -> -0.05 ~ +0.05
  const randomFluctuation = (Math.random() * (BASE_VOLATILITY * 2)) - BASE_VOLATILITY;
  
  // 2. 叠加新闻影响
  // 逻辑：新闻并不保证 100% 准确，它只是给予一个强烈的 bias
  const totalChangePercent = randomFluctuation + newsEffect;
  
  // 3. 计算新价格 (向下取整)
  let nextPrice = Math.floor(currentPrice * (1 + totalChangePercent));
  
  // 保底逻辑：比特币不会归零，最低 $100
  if (nextPrice < 100) nextPrice = 100;

  return nextPrice;
};

/**
 * 计算持仓盈亏 (PnL)
 * @param position 持仓对象
 * @param currentPrice 当前市场价格
 * @returns { pnl: 盈亏金额, roi: 回报率小数 }
 */
export const calculatePnL = (position: CryptoPosition, currentPrice: number) => {
  const { entryPrice, leverage, principal, type } = position;
  
  // 价格变化比例
  // LONG: current / entry - 1
  // SHORT: 1 - current / entry
  const priceRatio = currentPrice / entryPrice;
  const rawChange = type === 'LONG' ? (priceRatio - 1) : (1 - priceRatio);
  
  // 杠杆放大
  const roi = rawChange * leverage;
  
  // 盈亏金额
  const pnl = Math.floor(principal * roi);
  
  return { pnl, roi };
};

/**
 * 检查是否爆仓
 * @param position 持仓
 * @param currentPrice 当前价格
 * @returns boolean
 */
export const checkLiquidation = (position: CryptoPosition, currentPrice: number): boolean => {
  const { roi } = calculatePnL(position, currentPrice);
  
  // 如果亏损超过或等于本金 (ROI <= -100%)，则爆仓
  // 为了游戏体验，设定为 -90% 就强平，防止穿仓导致负债
  return roi <= -0.9;
};