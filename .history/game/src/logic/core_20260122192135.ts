import { PlayerClass, Bill, ScalingMode, GlobalSettings } from '../types/schema';

// ------------------------------------------------------------------
// 核心公式 1: 动态压力系数
// ------------------------------------------------------------------
export const calcPressure = (san: number, divisor: number): number => {
  return 1 + (Math.pow(san, 2) / divisor);
};

// ------------------------------------------------------------------
// 核心公式 2: 薪资效率系数
// ------------------------------------------------------------------
export const calcSalary = (baseSalary: number, currentSan: number, config: GlobalSettings['salaryConfig']): number => {
  // 找到第一个满足 maxSan >= currentSan 的配置段
  // 假设 config 已经按 maxSan 排序
  const match = config.find(c => currentSan <= c.maxSan);
  const efficiency = match ? match.efficiency : 0.1;
  return Math.floor(baseSalary * efficiency);
};

// ------------------------------------------------------------------
// 核心逻辑: 动态金币计算 (阶级杠杆)
// ------------------------------------------------------------------
export const calcDynamicGold = (
  baseAmount: number,
  mode: ScalingMode | undefined,
  currentClass: PlayerClass,
  classSettings: any // 传入 loaded classes data (object map)
): number => {
  if (mode === ScalingMode.FIXED) {
    return baseAmount;
  }

  const settings = classSettings[currentClass]; // 直接从传入的 Map/Object 获取
  if (!settings) return baseAmount;

  if (mode === ScalingMode.CLASS_LEVERAGE) {
    return Math.floor(baseAmount * settings.leverage);
  }

  if (mode === ScalingMode.INCOME_RATIO) {
    return Math.floor(baseAmount * settings.baseSalary);
  }

  return baseAmount;
};

// ------------------------------------------------------------------
// 核心逻辑: 账单触发
// ------------------------------------------------------------------
export const triggerBill = (
  gold: number,
  san: number,
  currentClass: PlayerClass,
  billPool: Bill[],
  config: GlobalSettings['billConfig']
): Bill | null => {
  // 1. 使用配置的概率
  const actualProb = gold < 0 ? config.debtProb : config.baseProb;

  // 2. 掷骰子
  if (Math.random() > actualProb) return null;

  // 3. 过滤可用账单
  const validBills = billPool.filter(bill => {
    if (!bill.triggerCondition) return true;
    const { isDebtOnly, requiredClass, minGold, minSan, maxGold } = bill.triggerCondition;

    if (isDebtOnly && gold >= 0) return false;
    if (requiredClass && !requiredClass.includes(currentClass)) return false;
    if (minGold !== undefined && gold < minGold) return false;
    if (maxGold !== undefined && gold > maxGold) return false;
    if (minSan !== undefined && san < minSan) return false;

    return true;
  });

  if (validBills.length === 0) return null;
  
  const totalWeight = validBills.reduce((sum, bill) => sum + (bill.weight || 10), 0);
  let randomVal = Math.random() * totalWeight;
  
  for (const bill of validBills) {
    const w = bill.weight || 10;
    if (randomVal < w) return bill;
    randomVal -= w;
  }

  return validBills[0];
};

// ------------------------------------------------------------------
// 阶级更新检查 (完全依赖 JSON 数据)
// ------------------------------------------------------------------
export const checkClassUpdate = (gold: number, classDefinitions: any[]): PlayerClass => {
  // classDefinitions 是 classes.json 的数组内容
  const matched = classDefinitions.find((cls: any) => 
    gold >= cls.thresholdMin && gold <= cls.thresholdMax
  );
  return matched ? (matched.id as PlayerClass) : PlayerClass.Homeless;
};

export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// 人体拆解检查 (依然保留逻辑，但数值可以后续考虑参数化)
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