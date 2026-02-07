/**
 * 阶级判定系统
 * 规则：净资产 = Gold + 房产价值(不考虑负债)
 * 优先级：资本家 > 中产 > 工人 > 流浪汉
 */

import { PlayerClass, RegionID, GameState, Housing } from '@/types/schema';
import housingData from '@/assets/data/housing.json';
import narrativeRules from '@/assets/data/rules/narrative_rules.json';

// 净资产阶级门槛
const NET_WORTH_THRESHOLDS = {
  [PlayerClass.Capitalist]: 2_000_000,
  [PlayerClass.Middle]: 100_000,
  [PlayerClass.Worker]: 500,
  [PlayerClass.Homeless]: -Infinity
};

/**
 * 计算净资产 = Gold + 房产价值(不考虑负债)
 */
export function calculateNetWorth(state: GameState): number {
  const gold = state.vitality.metrics.gold;
  
  // 计算房产价值
  let propertyValue = 0;
  const housing = state.activeHousing;
  
  if (housing) {
    // 查找房产配置获取价值
    const config = (housingData as unknown as Housing[]).find(h => h.id === housing.definitionId);
    if (config?.value) {
      propertyValue += config.value;
    } else if (config?.buyConfig?.price) {
      // fallback: 使用购买价格作为价值
      propertyValue += config.buyConfig.price;
    }
  }
  
  return gold + propertyValue;
}

/**
 * 判定当前阶级
 * 规则：纯净资产判定
 * - 净资产 >= 200万: 资本家
 * - 净资产 >= 10万: 中产
 * - 净资产 >= 500: 工人
 * - 净资产 < 500: 流浪汉
 * 
 * 注：自有房产计入净资产，租房不计入。
 *    玩家可以通过攒钱买房来跨越阶级，不受区域限制。
 */
export function determineClass(state: GameState): { 
  newClass: PlayerClass; 
  netWorth: number;
  reason: string;
} {
  const netWorth = calculateNetWorth(state);
  
  // 1. 检查资本家 (净资产 >= 200万)
  if (netWorth >= NET_WORTH_THRESHOLDS[PlayerClass.Capitalist]) {
    return { 
      newClass: PlayerClass.Capitalist, 
      netWorth, 
      reason: `净资产 $${netWorth.toLocaleString()}，达到资本家门槛` 
    };
  }
  
  // 2. 检查中产 (净资产 >= 10万)
  if (netWorth >= NET_WORTH_THRESHOLDS[PlayerClass.Middle]) {
    return { 
      newClass: PlayerClass.Middle, 
      netWorth, 
      reason: `净资产 $${netWorth.toLocaleString()}，达到中产门槛` 
    };
  }
  
  // 3. 检查工人 (净资产 >= 500)
  if (netWorth >= NET_WORTH_THRESHOLDS[PlayerClass.Worker]) {
    return { 
      newClass: PlayerClass.Worker, 
      netWorth, 
      reason: `净资产 $${netWorth.toLocaleString()}，达到工人门槛` 
    };
  }
  
  // 4. 流浪汉 (净资产 < 500)
  return { 
    newClass: PlayerClass.Homeless, 
    netWorth, 
    reason: `净资产 $${netWorth.toLocaleString()} < 500` 
  };
}

/**
 * 检查阶级是否发生变化
 */
export function hasClassChanged(state: GameState, newClass: PlayerClass): boolean {
  return state.vitality.identity.currentClass !== newClass;
}

/**
 * 获取阶级变化描述
 * 从 narrative_rules.json 读取文案配置
 */
export function getClassChangeDesc(oldClass: PlayerClass, newClass: PlayerClass): string {
  const key = `${oldClass}->${newClass}`;
  
  // 从配置文件读取文案
  const descriptions = (narrativeRules as any).classChange?.descriptions || {};
  const defaultTemplate = (narrativeRules as any).classChange?.defaultTemplate || '阶级变化: {oldClass} -> {newClass}';
  
  // 返回配置中的文案，或使用默认模板
  return descriptions[key] || defaultTemplate.replace('{oldClass}', oldClass).replace('{newClass}', newClass);
}
