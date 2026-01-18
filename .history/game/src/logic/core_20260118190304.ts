// src/logic/core.ts
import { PlayerClass, Bill } from '../types/schema';

/**
 * 核心公式 A: 动态压力系数 (Pressure)
 * P = 1 + SAN^2 / 2000
 * SAN 越高，肉体对系统打击的耐受度越低
 */
export const calcPressure = (san: number): number => {
  return 1 + (Math.pow(san, 2) / 2000);
};

/**
 * 核心公式 B: 工资效率系数 (Efficiency)
 * SAN 越高，作为电池的效率越低
 */
export const calcSalaryEfficiency = (san: number): number => {
  if (san <= 30) return 1.1; // 工贼：110%
  if (san <= 70) return 1.0; // 装傻：100%
  if (san <= 90) return 0.6; // 排挤：60%
  return 0.1;                // 疯癫：10%
};

// 计算实际月薪
export const calcSalary = (baseSalary: number, currentSan: number): number => {
  const efficiency = calcSalaryEfficiency(currentSan);
  return Math.floor(baseSalary * efficiency);
};

export const checkClassUpdate = (gold: number): PlayerClass => {
  // v12.0 阶级门槛
  if (gold < 500) return PlayerClass.Homeless;
  if (gold >= 500 && gold < 25000) return PlayerClass.Worker; // Worker max adjusted
  if (gold >= 25000 && gold < 500000) return PlayerClass.Middle; // Middle max adjusted
  return PlayerClass.Capitalist;
};

// 辅助工具：数值钳制
export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// ... triggerBill 和 humanDismantlementCheck 可以保留或根据需要微调 ...
// 为了简化，这里暂时保留原有的 triggerBill 结构，但逻辑交给 Store 处理收割机制
export const triggerBill = (
    gold: number,
    currentClass: PlayerClass,
    billPool: Bill[]
  ): Bill | null => {
    // 简单随机逻辑，具体收割逻辑在 Store 实现
    if (Math.random() > 0.3) return null; // 30% 触发率
    
    // 过滤逻辑... (保持原有代码)
    const validBills = billPool.filter(bill => {
         if (bill.triggerCondition.isDebtOnly && gold >= 0) return false;
         if (bill.triggerCondition.requiredClass && !bill.triggerCondition.requiredClass.includes(currentClass)) return false;
         return true;
    });

    if (validBills.length === 0) return null;
    return validBills[Math.floor(Math.random() * validBills.length)];
};
export const triggerBill = (
  gold: number,
  currentClass: PlayerClass,
  billPool: Bill[]
): Bill | null => {
  // 1. 基础概率
  if (Math.random() > 0.3) return null;

  // 2. 过滤
  const validBills = billPool.filter(bill => {
    // 增加可选链 ?. 来避免 'possibly undefined' 错误
    const condition = bill.triggerCondition;
    if (!condition) return true; // 如果没有条件，默认符合

    if (condition.isDebtOnly && gold >= 0) return false;
    
    if (condition.requiredClass && !condition.requiredClass.includes(currentClass)) return false;
    
    if (condition.minGold !== undefined && gold < condition.minGold) return false;
    
    return true;
  });

  if (validBills.length === 0) return null;
  return validBills[Math.floor(Math.random() * validBills.length)];
};