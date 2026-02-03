import { CryptoPosition } from '@/types/schema';

// 基础波动范围升级: 一周的波动应该在 15% 左右
const BASE_VOLATILITY = 0.15; 
// 极值保护
const MIN_PRICE = 500;

/**
 * 计算下一周 BTC 价格 (Juicy Version)
 * @param currentPrice 当前价格
 * @param newsEffect 新闻影响系数 (-0.5 ~ +0.5)
 */
export const calculateNextPrice = (currentPrice: number, newsEffect: number): { price: number, trend: 'MOON' | 'DOOM' | 'NORMAL' } => {
  // 1. 市场情绪随机 (Market Sentiment)
  // 引入一个 "市场噪音"，模拟非理性的市场波动
  // Math.random() - 0.5 -> -0.5 ~ 0.5
  // * BASE_VOLATILITY * 2 -> 扩大波动区间
  const volatilityNoise = (Math.random() - 0.5) * 2 * BASE_VOLATILITY;
  
  // 2. 叠加新闻影响 (新闻是主要驱动力)
  // newsEffect 比如是 0.2 (利好)，totalChange 倾向于涨
  let totalChangePercent = volatilityNoise + newsEffect;

  // 3. Vibe Check: 暴击检测 (Juiciness)
  // 5% 的概率发生 "黑天鹅" 事件，无视新闻直接暴涨或暴跌
  let trend: 'MOON' | 'DOOM' | 'NORMAL' = 'NORMAL';
  const blackSwan = Math.random();
  
  if (blackSwan < 0.02) { // 2% 概率 To The Moon (翻倍)
    totalChangePercent += 0.5 + Math.random(); 
    trend = 'MOON';
  } else if (blackSwan > 0.98) { // 2% 概率 Rekt (腰斩)
    totalChangePercent -= 0.4 + Math.random() * 0.3;
    trend = 'DOOM';
  }

  // 4. 计算新价格
  let nextPrice = Math.floor(currentPrice * (1 + totalChangePercent));
  
  // 保底逻辑
  if (nextPrice < MIN_PRICE) nextPrice = MIN_PRICE;

  return { price: nextPrice, trend };
};

/**
 * 计算持仓盈亏 (PnL)
 * @param position 持仓对象
 * @param currentPrice 当前市场价格
 */
export const calculatePnL = (position: CryptoPosition, currentPrice: number) => {
  const { entryPrice, leverage, principal, type } = position;
  
  const priceRatio = currentPrice / entryPrice;
  // LONG: 涨了赚钱; SHORT: 跌了赚钱
  const rawChange = type === 'LONG' ? (priceRatio - 1) : (1 - priceRatio);
  
  // 杠杆放大 ROI
  const roi = rawChange * leverage;
  
  // 盈亏金额
  const pnl = Math.floor(principal * roi);
  
  // 总返还 = 本金 + 盈亏
  const totalValue = principal + pnl;
  
  return { pnl, roi, totalValue };
};

/**
 * 检查是否爆仓
 * 爆仓线调整: -80% 即强平 (给玩家留一点点渣，或者完全归零取决于设定)
 * 这里设定为 ROI <= -100% 也就是本金亏完时爆仓
 */
export const checkLiquidation = (position: CryptoPosition, currentPrice: number): boolean => {
  const { roi } = calculatePnL(position, currentPrice);
  return roi <= -1.0; 
};