import { PlayerClass, Bill, GameEvent, Item } from '../types/schema';

// --- 基础计算 ---
export const calcSalary = (baseSalary: number, currentSan: number): number => {
  let efficiency = 1.0;
  if (currentSan >= 0 && currentSan <= 20) efficiency = 1.0; // 疯子 (麻木)
  else if (currentSan > 20 && currentSan <= 60) efficiency = 0.7; // 裂痕 (怀疑)
  else efficiency = 0.4; // 觉醒 (反抗)
  return Math.floor(baseSalary * efficiency);
};

export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// --- 逻辑 1: 阶级判定 (基于最新资产) ---
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
  const baseProb = 0.08; // 基础概率 8%
  const actualProb = isInDebt ? 0.16 : baseProb; // 负债翻倍

  if (Math.random() > actualProb) return null;

  const validBills = billPool.filter(bill => {
    // 过滤掉不符合条件的账单
    // 1. 触发条件字符串解析 (简单模拟，后续可扩展)
    if (bill.triggerCondition) {
      // 这里的 triggerCondition 在 JSON 里是对象，但在 TS 定义里可能是字符串，需注意类型兼容
      // 假设已经在 Store 层处理好，或者这里做简单的 any 转换
      const cond = bill.triggerCondition as any; 
      if (cond.minGold && gold < cond.minGold) return false;
      if (cond.requiredClass && !cond.requiredClass.includes(currentClass)) return false;
      if (cond.isDebtOnly && !isInDebt) return false;
    }
    return true;
  });

  if (validBills.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * validBills.length);
  return validBills[randomIndex];
};

// --- 逻辑 3: 事件抽取 ---
export const pickEvent = (
  currentClass: PlayerClass,
  san: number,
  eventPool: GameEvent[],
  inventory: string[] = []
): GameEvent | null => {
  // 基础触发率 40% (无账单时)
  if (Math.random() > 0.4) return null;

  const validEvents = eventPool.filter(evt => {
    if (!evt.conditions) return true;
    
    // 阶级检查
    if (evt.conditions.minClass || evt.conditions.maxClass) {
      // 简化处理：假设通过 requiredClass 数组匹配 (schema.ts定义)
      // 如果用 JSON 中的 requiredClass:
      if ((evt.conditions as any).requiredClass && !(evt.conditions as any).requiredClass.includes(currentClass)) return false;
    }

    // SAN 检查
    if (evt.conditions.minSan !== undefined && san < evt.conditions.minSan) return false;
    if (evt.conditions.maxSan !== undefined && san > evt.conditions.maxSan) return false;

    // 物品持有检查
    if (evt.conditions.requiredItem && !inventory.includes(evt.conditions.requiredItem)) return false;

    // 持枪特殊处理 (兼容 JSON 中的 hasItem 字段)
    if ((evt.conditions as any).hasItem && !inventory.includes((evt.conditions as any).hasItem)) return false;

    return true;
  });

  if (validEvents.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * validEvents.length);
  return validEvents[randomIndex];
};

// --- 逻辑 4: 人体拆解检测 (核心黑暗逻辑) ---
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
  // 被动触发: 流浪汉且欠债 >= 3天
  const passiveTrigger = !isShopAction && currentClass === PlayerClass.Homeless && debtDayCounter >= 3;
  
  // 主动触发: 在商店且欠债严重 (Gold < -2000)
  const activeTrigger = isShopAction && gold < -2000;

  if (passiveTrigger || activeTrigger) {
    return {
      triggered: true,
      type: activeTrigger ? 'ACTIVE' : 'PASSIVE',
      changes: { 
        goldSetTo: 0, // 债务清零
        maxHpMultiplier: 0.5, // 最大HP减半
        debtReset: true 
      }
    };
  }
  return null;
};