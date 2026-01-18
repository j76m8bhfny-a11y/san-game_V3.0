import { PlayerClass, Bill } from '../types/schema';

// 核心公式: 计算薪资
export const calcSalary = (baseSalary: number, currentSan: number): number => {
  let efficiency = 1.0;
  if (currentSan >= 0 && currentSan <= 20) efficiency = 1.0;
  else if (currentSan > 20 && currentSan <= 60) efficiency = 0.7;
  else efficiency = 0.4;
  return Math.floor(baseSalary * efficiency);
};

// 核心逻辑: 触发账单
export const triggerBill = (
  gold: number,
  currentClass: PlayerClass,
  billPool: Bill[]
): Bill | null => {
  // 1. 确定触发概率
  const isInDebt = gold < 0;
  const baseProb = 0.08;
  const actualProb = isInDebt ? 0.16 : baseProb;

  // 2. 掷骰子
  if (Math.random() > actualProb) return null;

  // 3. 基于条件过滤账单池
  const validBills = billPool.filter(bill => {
    // 检查是否仅限债务期间触发
    if (bill.triggerCondition.isDebtOnly && !isInDebt) return false;
    // 检查职业要求
    if (bill.triggerCondition.requiredClass && !bill.triggerCondition.requiredClass.includes(currentClass)) return false;
    // 检查最低金钱要求
    if (bill.triggerCondition.minGold !== undefined && gold < bill.triggerCondition.minGold) return false;
    return true;
  });

  // 4. 兜底逻辑：如果命中概率但没有匹配的账单，强制派发通用小额账单
  if (validBills.length === 0) {
    return {
      id: 'BILL_FALLBACK_01',
      name: '不明开支',
      amount: -10,
      type: 'JUMP_SCARE',
      triggerCondition: {},
      flavorText: '你的口袋漏了一个洞，或者你只是记错了。反正少了 10 块钱。'
    };
  }

  // 5. 抽取
  const randomIndex = Math.floor(Math.random() * validBills.length);
  return validBills[randomIndex];
};

export const checkClassUpdate = (gold: number): PlayerClass => {
  if (gold < 500) return PlayerClass.Homeless;
  if (gold >= 500 && gold < 5000) return PlayerClass.Worker;
  if (gold >= 5000 && gold < 50000) return PlayerClass.Middle;
  return PlayerClass.Capitalist;
};

// 辅助函数
export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// 核心逻辑: 人体拆解检查
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