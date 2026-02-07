/**
 * 阶级判定系统
 * 规则：净资产 = Gold + 房产价值(不考虑负债)
 * 优先级：资本家 > 中产 > 工人 > 流浪汉
 */

import { PlayerClass, RegionID, GameState, Housing } from '@/types/schema';
import housingData from '@/assets/data/housing.json';

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
 * 规则：
 * 1. 必须有对应区域的房产(OWN)才能进入该阶级
 * 2. 净资产必须达到该阶级门槛
 * 3. 租房(RENT)只能进入工人阶级(且需满足资产门槛)
 * 4. 不满足任何条件则为流浪汉
 */
export function determineClass(state: GameState): { 
  newClass: PlayerClass; 
  netWorth: number;
  reason: string;
} {
  const netWorth = calculateNetWorth(state);
  const housing = state.activeHousing;
  
  // 无房产 = 流浪汉
  if (!housing) {
    return { 
      newClass: PlayerClass.Homeless, 
      netWorth, 
      reason: `无固定住所，净资产 $${netWorth.toLocaleString()}` 
    };
  }
  
  const isOwned = housing.type === 'OWN';
  const housingRegion = housing.region;
  
  // 1. 检查资本家 (DOWNTOWN 有房 + 净资产 > 2M)
  if (isOwned && housingRegion === RegionID.Downtown) {
    if (netWorth >= NET_WORTH_THRESHOLDS[PlayerClass.Capitalist]) {
      return { 
        newClass: PlayerClass.Capitalist, 
        netWorth, 
        reason: `DOWNTOWN房产 + 净资产 $${netWorth.toLocaleString()}` 
      };
    }
    // 有高档房产但资产不够，降级处理
    return { 
      newClass: PlayerClass.Middle, 
      netWorth, 
      reason: `虽有DOWNTOWN房产，但净资产 $${netWorth.toLocaleString()} 不足200万，降级中产` 
    };
  }
  
  // 2. 检查中产 (SUBURBS 有房 + 净资产 >= 100K)
  if (isOwned && housingRegion === RegionID.Suburbs) {
    if (netWorth >= NET_WORTH_THRESHOLDS[PlayerClass.Middle]) {
      return { 
        newClass: PlayerClass.Middle, 
        netWorth, 
        reason: `SUBURBS房产 + 净资产 $${netWorth.toLocaleString()}` 
      };
    }
    // 有中产房产但资产不够，降级工人
    return { 
      newClass: PlayerClass.Worker, 
      netWorth, 
      reason: `虽有SUBURBS房产，但净资产 $${netWorth.toLocaleString()} 不足10万，降级工人` 
    };
  }
  
  // 3. 检查工人 (RUST_BELT 有房/租房 + 净资产 >= 500)
  if (housingRegion === RegionID.RustBelt) {
    if (netWorth >= NET_WORTH_THRESHOLDS[PlayerClass.Worker]) {
      return { 
        newClass: PlayerClass.Worker, 
        netWorth, 
        reason: `RUST_BELT住所 + 净资产 $${netWorth.toLocaleString()}` 
      };
    }
    // 有住所但资产太少，降级流浪汉
    return { 
      newClass: PlayerClass.Homeless, 
      netWorth, 
      reason: `虽有RUST_BELT住所，但净资产 $${netWorth.toLocaleString()} 不足500，仍属流浪` 
    };
  }
  
  // 4. 贫民窟租房且资产<500 = 流浪汉
  if (housingRegion === RegionID.Slums && !isOwned && netWorth < NET_WORTH_THRESHOLDS[PlayerClass.Worker]) {
    return { 
      newClass: PlayerClass.Homeless, 
      netWorth, 
      reason: `贫民窟租房 + 净资产 $${netWorth.toLocaleString()} < 500` 
    };
  }
  
  // 兜底：按净资产判定
  if (isOwned) {
    if (netWorth >= NET_WORTH_THRESHOLDS[PlayerClass.Middle]) {
      return { newClass: PlayerClass.Middle, netWorth, reason: `按净资产判定为中产` };
    }
  }
  
  if (netWorth >= NET_WORTH_THRESHOLDS[PlayerClass.Worker]) {
    return { newClass: PlayerClass.Worker, netWorth, reason: `按净资产判定为工人` };
  }
  
  return { 
    newClass: PlayerClass.Homeless, 
    netWorth, 
    reason: `不满足任何阶级条件` 
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
 */
export function getClassChangeDesc(oldClass: PlayerClass, newClass: PlayerClass): string {
  const changes: Record<string, string> = {
    'HOMELESS->WORKER': '你终于有了固定住所，不再是流浪者了。',
    'WORKER->HOMELESS': '你失去了住所，重回街头。',
    'WORKER->MIDDLE': '恭喜进入中产，但房贷才刚刚开始。',
    'MIDDLE->WORKER': '资产缩水，中产梦碎。',
    'MIDDLE->CAPITALIST': '欢迎来到顶层，这里的空气都弥漫着金钱的味道。',
    'CAPITALIST->MIDDLE': '从云端跌落，但至少还有房子住。',
    'CAPITALIST->WORKER': '一夜回到解放前。',
    'CAPITALIST->HOMELESS': '真正的从零开始。'
  };
  
  const key = `${oldClass}->${newClass}`;
  return changes[key] || `阶级变化: ${oldClass} -> ${newClass}`;
}
