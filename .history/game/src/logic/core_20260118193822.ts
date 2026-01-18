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
// 核心公式 2: 薪资计算
// ------------------------------------------------------------------
export const calcSalary = (baseSalary: number, currentSan: number): number => {
  let efficiency = 1.0;
  if (currentSan >= 0 && currentSan <= 30) efficiency = 1.1; // 工贼
  else if (currentSan > 30 && currentSan <= 70) efficiency = 1.0; // 普通
  else if (currentSan > 70 && currentSan <= 90) efficiency = 0.6; // 摸鱼
  else efficiency = 0.1; // 疯癫
  
  return Math.floor(baseSalary * efficiency);
};

// ------------------------------------------------------------------
// 核心逻辑: 账单触发
// ------------------------------------------------------------------
export const triggerBill = (
  gold: number,
  currentClass: PlayerClass,
  billPool: Bill[]
): Bill | null => {
  // 1. 确定触发概率
  const isInDebt = gold < 0;
  const baseProb = 0.3; 
  const actualProb = isInDebt ? 0.5 : baseProb;

  // 2. 掷骰子
  if (Math.random() > actualProb) return null;

  // 3. 基于条件过滤
  const validBills = billPool.filter(bill => {
    if (!bill.triggerCondition) return true;
    const { isDebtOnly, requiredClass, minGold } = bill.triggerCondition;

    if (isDebtOnly && !isInDebt) return false;
    if (requiredClass && !requiredClass.includes(currentClass)) return false;
    if (minGold !== undefined && gold < minGold) return false;
    
    return true;
  });

  // 4. 兜底逻辑
  if (validBills.length === 0) {
    return {
      id: 'BILL_FALLBACK_01',
      name: '不明开支',
      amount: -50,
      type: 'JUMP_SCARE',
      triggerCondition: {},
      flavorText: '你的口袋漏了一个洞，或者你只是记错了。反正少了 50 块钱。'
    };
  }

  // 5. 抽取
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