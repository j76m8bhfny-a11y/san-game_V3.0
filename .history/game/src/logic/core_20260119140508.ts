import { PlayerClass, Bill, ScalingMode } from '../types/schema';
// ------------------------------------------------------------------
// 核心公式 1: 动态压力系数 (P)
// P = 1 + SAN^2 / 2000
// ------------------------------------------------------------------
export const calcPressure = (san: number): number => {
  return 1 + (Math.pow(san, 2) / 2000);
};

// ------------------------------------------------------------------
// 核心公式 2: 薪资效率系数 (E)
// SAN 值越高，工作效率越低（被系统排斥）
// ------------------------------------------------------------------
export const calcSalary = (baseSalary: number, currentSan: number): number => {
  let efficiency = 1.0;
  if (currentSan <= 30) efficiency = 1.1;      // 0-30: 工贼 (110%)
  else if (currentSan <= 70) efficiency = 1.0; // 31-70: 装傻 (100%)
  else if (currentSan <= 90) efficiency = 0.6; // 71-90: 排挤 (60%)
  else efficiency = 0.1;                       // 91+: 疯癫 (10%)
  
  return Math.floor(baseSalary * efficiency);
};
export const calcDynamicGold = (
  baseAmount: number,
  mode: ScalingMode | undefined, // 允许未定义，默认为 FIXED 或根据 OptionID 判断
  currentClass: PlayerClass,
  classSettings: any // 传入 CLASS_SETTINGS
): number => {
  // 1. FIXED 模式：所见即所得 (你的需求)
  if (mode === ScalingMode.FIXED) {
    return baseAmount;
  }

  // 获取当前阶级数据
  const settings = classSettings[currentClass];
  if (!settings) return baseAmount;

  // 2. LEVERAGE 模式：乘阶级杠杆 (A选项)
  // 公式: Base * Leverage
  if (mode === ScalingMode.CLASS_LEVERAGE) {
    return Math.floor(baseAmount * settings.leverage);
  }

  // 3. INCOME 模式：乘基准月薪比例 (C/D选项)
  // 公式: Base (此时通常是小数, 如 -0.2) * BaseSalary
  if (mode === ScalingMode.INCOME_RATIO) {
    return Math.floor(baseAmount * settings.baseSalary);
  }

  // 默认兜底：直接返回
  return baseAmount;
};
// ------------------------------------------------------------------
// 核心逻辑: 账单触发 (The Filter)
// ------------------------------------------------------------------
export const triggerBill = (
  gold: number,
  san: number, // <--- 新增
  currentClass: PlayerClass,
  billPool: Bill[]
): Bill | null => {
  // 1. 确定触发概率 (v12.0: 30%)
  const baseProb = 0.3;
  // 负债时概率更高 (0.5)，形成贫穷陷阱
  const actualProb = gold < 0 ? 0.5 : baseProb;

  // 2. 掷骰子
  if (Math.random() > actualProb) return null;

  // 3. 过滤可用账单
  const validBills = billPool.filter(bill => {
    if (!bill.triggerCondition) return true;
    const { isDebtOnly, requiredClass, minGold } = bill.triggerCondition;

    if (isDebtOnly && gold >= 0) return false;
    if (requiredClass && !requiredClass.includes(currentClass)) return false;
    if (minGold !== undefined && gold < minGold) return false;
    if (bill.triggerCondition.minSan !== undefined && san < bill.triggerCondition.minSan) return false;

    return true;
  });

  // 4. 兜底账单
  if (validBills.length === 0) {
    return null;
  }
  const totalWeight = validBills.reduce((sum, bill) => sum + (bill.weight || 10), 0);
  
  // B. 在 0 到 总权重 之间随机取一个值
  let randomVal = Math.random() * totalWeight;
  
  // C. 遍历列表，看随机值落在哪个区间
  for (const bill of validBills) {
    const w = bill.weight || 10; // 默认权重兜底
    if (randomVal < w) {
      return bill; // 🎯 选中了这个账单
    }
    randomVal -= w;
  }

  // 理论上不会走到这里，兜底返回第一个
  return validBills[0];
};

export const checkClassUpdate = (gold: number): PlayerClass => {
  if (gold < 500) return PlayerClass.Homeless;
  if (gold >= 500 && gold < 25000) return PlayerClass.Worker;
  if (gold >= 25000 && gold < 500000) return PlayerClass.Middle;
  return PlayerClass.Capitalist;
};

export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// 人体拆解检查 (保持不变，配合 D05 使用)
export const humanDismantlementCheck = (
  currentClass: PlayerClass,
  debtDayCounter: number,
  gold: number
) => {
  const passiveTrigger = currentClass === PlayerClass.Homeless && debtDayCounter >= 3;
  if (passiveTrigger) {
    return {
      triggered: true,
      type: 'PASSIVE' as const,
      changes: { goldSetTo: 0, maxHpMultiplier: 0.5, debtReset: true }
    };
  }
  return null;
};