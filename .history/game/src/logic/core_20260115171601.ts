import { PlayerClass, Bill, GameEvent } from '../types/schema';

// --- 基础计算 ---
export const calcSalary = (baseSalary: number, currentSan: number): number => {
  let efficiency = 1.0;
  if (currentSan >= 0 && currentSan <= 20) efficiency = 1.0; // 疯子效率高
  else if (currentSan > 20 && currentSan <= 60) efficiency = 0.7; // 抑郁效率低
  else efficiency = 0.4; // 正常人不想上班
  return Math.floor(baseSalary * efficiency);
};

export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// --- 逻辑 1: 阶级判定 ---
export const checkClassUpdate = (gold: number): PlayerClass => {
  if (gold < 500) return PlayerClass.Homeless;
  if (gold >= 500 && gold < 5000) return PlayerClass.Worker;
  if (gold >= 5000 && gold < 50000) return PlayerClass.Middle;
  return PlayerClass.Capitalist;
};

// --- 逻辑 2: 账单触发系统 ---
export const triggerBill = (
  gold: number,
  currentClass: PlayerClass,
  billPool: Bill[]
): Bill | null => {
  const isInDebt = gold < 0;
  const baseProb = 0.10; // 基础概率 10%
  const actualProb = isInDebt ? 0.20 : baseProb; // 负债时概率翻倍

  if (Math.random() > actualProb) return null;

  const validBills = billPool.filter(bill => {
    if (bill.triggerCondition.isDebtOnly && !isInDebt) return false;
    if (bill.triggerCondition.requiredClass && !bill.triggerCondition.requiredClass.includes(currentClass)) return false;
    if (bill.triggerCondition.minGold !== undefined && gold < bill.triggerCondition.minGold) return false;
    return true;
  });

  if (validBills.length === 0) {
    // 兜底账单
    return {
      id: 'BILL_FALLBACK',
      name: '不明开支',
      amount: -15,
      type: 'JUMP_SCARE',
      triggerCondition: {},
      flavorText: '你的口袋漏了一个洞，或者你只是记错了。反正少了 15 块钱。'
    };
  }

  const randomIndex = Math.floor(Math.random() * validBills.length);
  return validBills[randomIndex];
};

// --- 逻辑 3: 随机剧情事件筛选 (✅ New) ---
export const pickEvent = (
  currentClass: PlayerClass,
  san: number,
  eventPool: GameEvent[],
  inventory: string[] = []
): GameEvent | null => {
  // 基础触发率 40% (如果没有账单)
  if (Math.random() > 0.4) return null;

  const validEvents = eventPool.filter(evt => {
    // 1. 阶级检查
    if (evt.conditions.requiredClass && !evt.conditions.requiredClass.includes(currentClass)) return false;

    // 2. SAN值区间检查
    if (evt.conditions.minSan !== undefined && san < evt.conditions.minSan) return false;
    if (evt.conditions.maxSan !== undefined && san > evt.conditions.maxSan) return false;

    // 3. 物品持有检查 (如: 只有持枪才能触发特定事件)
    if (evt.conditions.hasItem && !inventory.includes(evt.conditions.hasItem)) return false;

    return true;
  });

  if (validEvents.length === 0) return null;
  
  // 随机抽取
  const randomIndex = Math.floor(Math.random() * validEvents.length);
  return validEvents[randomIndex];
};

// --- 逻辑 4: 人体拆解检测 (✅ New) ---
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
  // 被动触发: 流浪汉且欠债超过3天
  const passiveTrigger = currentClass === PlayerClass.Homeless && debtDayCounter >= 3;
  // 主动触发: 在商店购买 (此处仅做校验逻辑，具体调用在 Store)
  const activeTrigger = isShopAction && gold < -2000;

  if (passiveTrigger || activeTrigger) {
    return {
      triggered: true,
      type: activeTrigger ? 'ACTIVE' : 'PASSIVE',
      changes: { 
        goldSetTo: 0, // 债务清零
        maxHpMultiplier: 0.5, // 最大生命值减半
        debtReset: true 
      }
    };
  }
  return null;
};