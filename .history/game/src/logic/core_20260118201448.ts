import { PlayerClass, Bill } from '../types/schema';

// ------------------------------------------------------------------
// 核心公式 1: 动态压力系数 (P)
// P = 1 + SAN^2 / 2000
// 💡 [修复] 补全了缺失的 calcPressure 函数
// ------------------------------------------------------------------
export const calcPressure = (san: number): number => {
  return 1 + (Math.pow(san, 2) / 2000);
};

// ------------------------------------------------------------------
// 核心公式 B: 工资效率系数 (E) (v12.0 修正版)
// ------------------------------------------------------------------
export const calcSalary = (baseSalary: number, currentSan: number): number => {
  let efficiency = 1.0;
  // 工贼 (0-30): 110%
  if (currentSan <= 30) efficiency = 1.1;
  // 装傻 (31-70): 100%
  else if (currentSan <= 70) efficiency = 1.0;
  // 排挤 (71-90): 60%
  else if (currentSan <= 90) efficiency = 0.6;
  // 疯癫 (91+): 10%
  else efficiency = 0.1;
  
  return Math.floor(baseSalary * efficiency);
};
// ------------------------------------------------------------------
// 随机事件与收割 (The Filter)
// ------------------------------------------------------------------
export const triggerBill = (
  gold: number,
  currentClass: PlayerClass,
  billPool: Bill[]
): Bill | null => {
  // 基础触发率 30%
  if (Math.random() > 0.3) return null;

  const validBills = billPool.filter(bill => {
    if (!bill.triggerCondition) return true;
    const { isDebtOnly, requiredClass, minGold } = bill.triggerCondition;

    if (isDebtOnly && gold >= 0) return false;
    if (requiredClass && !requiredClass.includes(currentClass)) return false;
    if (minGold !== undefined && gold < minGold) return false;
    
    return true;
  });

  if (validBills.length === 0) return null;
  return validBills[Math.floor(Math.random() * validBills.length)];
};


export const checkClassUpdate = (gold: number): PlayerClass => {
  if (gold < 500) return PlayerClass.Homeless;
  if (gold >= 500 && gold < 25000) return PlayerClass.Worker;
  if (gold >= 25000 && gold < 500000) return PlayerClass.Middle;
  return PlayerClass.Capitalist;
};

export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// ------------------------------------------------------------------
// 核心逻辑: 人体拆解检查
// ------------------------------------------------------------------
interface DismantleResult {
  triggered: boolean;
  type: 'PASSIVE' | 'ACTIVE';
  changes: { goldSetTo: number; maxHpMultiplier: number; debtReset: boolean; };
}

export const humanDismantlementCheck = (
  currentClass: PlayerClass,
  debtDayCounter: number,
  gold: number,
  isShopAction: boolean = false
): DismantleResult | null => {
  const passiveTrigger = currentClass === PlayerClass.Homeless && debtDayCounter >= 3;
  const activeTrigger = isShopAction && gold < -2000;

  if (passiveTrigger || activeTrigger) {
    return {
      triggered: true,
      type: activeTrigger ? 'ACTIVE' : 'PASSIVE',
      changes: { goldSetTo: 0, maxHpMultiplier: 0.5, debtReset: true }
    };
  }
  return null;
};