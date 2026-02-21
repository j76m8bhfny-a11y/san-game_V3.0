/**
 * 维度聚合存活模型 (Dimension Aggregation Survival Model)
 * 
 * 核心设计：
 * 1. JSON 中配置各类物品的基础数值
 * 2. 系统自动按维度聚合（加权平均/几何平均）
 * 3. 维度分数通过 Sigmoid 映射为存活概率
 * 
 * 数值调整流程：
 * 调整 items/*.json 数值 → 维度自动更新 → 存活概率变化
 */

import { RegionID, Disease, Item } from '@/types/schema';
import type { StoreState } from '@/types/store';
import dimensionConfig from '@/assets/data/rules/vitality_dimensions.json';

// ==========================================
// 1. 类型定义
// ==========================================

export type DimensionId = 'physicalDefense' | 'mentalStability' | 'nutritionSupply' | 'medicalSupport' | 'economicBuffer';

export interface DimensionScore {
  id: DimensionId;
  value: number;        // 原始聚合值 (0-100 或归一化后)
  normalized: number;   // 归一化值 (0-1)
  weight: number;       // 该维度对存活的权重
  breakdown: {          // 详细分解
    source: string;
    value: number;
    weight: number;
    contribution: number;
  }[];
}

export interface SurvivalCalculationResult {
  dimensions: Record<DimensionId, DimensionScore>;
  compositeScore: number;      // 综合分数 (0-1)
  survivalProbability: number; // 最终存活概率 (0-1)
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
  weakDimension?: DimensionId; // 最短板维度
  recommendations: string[];
}

export interface DimensionSourceValue {
  source: string;
  value: number;
  weight: number;
}

// ==========================================
// 2. 维度聚合器
// ==========================================

/**
 * 从游戏状态中提取维度的所有来源值
 */
function extractDimensionSources(
  dimensionId: DimensionId,
  state: StoreState
): DimensionSourceValue[] {
  const config = (dimensionConfig.dimensions as any)[dimensionId];
  if (!config) return [];
  
  const sources: DimensionSourceValue[] = [];
  const { metrics, identity } = state.vitality;
  
  for (const sourceDef of config.sources) {
    let value = 0;
    let found = false;
    
    switch (sourceDef.type) {
      case 'housing': {
        if (state.activeHousing) {
          value = extractHousingValue(state.activeHousing, sourceDef.attribute);
          found = true;
        }
        break;
      }
      
      case 'equipment': {
        // 从装备栏查找
        const equipment = findEquippedItems(state);
        value = equipment.reduce((sum, item) => sum + (getAttribute(item, sourceDef.attribute) || 0), 0);
        found = value > 0;
        break;
      }
      
      case 'consumable': {
        // 计算背包中相关物品的累计效果
        const items = findItemsByTag(state, sourceDef.tag);
        //  consumable 取平均值（代表日常消费水平）
        if (items.length > 0) {
          value = items.reduce((sum, item) => sum + (getAttribute(item, sourceDef.attribute) || 0), 0) / items.length;
          found = true;
        }
        break;
      }
      
      case 'buff': {
        // 从 activeBuffs 中查找
        value = state.activeBuffs.reduce((sum: number, buff: { effects?: Record<string, number> }) => {
          return sum + (buff.effects?.[sourceDef.attribute] || 0);
        }, 0);
        found = value > 0;
        break;
      }
      
      case 'base': {
        // 阶级基础值
        if (sourceDef.attribute === 'classBaseDefense') {
          const classBase = (dimensionConfig.classBaseValues as any)[identity.currentClass];
          value = classBase?.[dimensionId] || 0;
          found = true;
        }
        break;
      }
      
      case 'diet': {
        // 从 dietState 计算营养分
        if (sourceDef.attribute === 'nutritionScore') {
          value = calculateNutritionScore(state);
          found = true;
        }
        break;
      }
      
      case 'faith': {
        // 信仰提供的庇护
        if (state.faith.id !== 'NONE' && sourceDef.attribute === 'sanctuaryLevel') {
          value = state.faith.level * 15; // 每级信仰 +15
          found = true;
        }
        break;
      }
      
      case 'insurance': {
        // 保险覆盖度
        value = calculateInsuranceCoverage(state);
        found = value > 0;
        break;
      }
      
      case 'currency': {
        if (sourceDef.attribute === 'gold') {
          // 金钱对数缩放
          value = Math.log10(Math.max(1, metrics.gold)) * 20; // log10(1000)=3 -> 60分
          found = true;
        }
        break;
      }
      
      case 'income': {
        // 计算周净收入
        if (sourceDef.attribute === 'weeklyNet') {
          value = calculateWeeklyIncome(state);
          found = true;
        }
        break;
      }
      
      case 'region': {
        // 区域属性
        if (sourceDef.attribute === 'hospitalQuality') {
          const qualityMap: Record<RegionID, number> = {
            [RegionID.Slums]: 20,
            [RegionID.RustBelt]: 40,
            [RegionID.Suburbs]: 70,
            [RegionID.Downtown]: 90,
          };
          value = qualityMap[state.currentRegion] || 50;
          found = true;
        }
        break;
      }
    }
    
    if (found) {
      sources.push({
        source: `${sourceDef.type}.${sourceDef.attribute}`,
        value,
        weight: sourceDef.weight,
      });
    }
  }
  
  return sources;
}

/**
 * 聚合来源值为维度分数
 */
function aggregateDimension(
  _dimensionId: DimensionId,
  sources: DimensionSourceValue[],
  config: any
): { value: number; normalized: number; breakdown: any[] } {
  if (sources.length === 0) {
    return { value: 0, normalized: 0, breakdown: [] };
  }
  
  const formula = config.formula || 'weighted_average';
  let value = 0;
  
  switch (formula) {
    case 'weighted_average': {
      const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
      value = sources.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight;
      break;
    }
    
    case 'geometric_mean': {
      const product = sources.reduce((prod, s) => prod * Math.max(1, s.value), 1);
      value = Math.pow(product, 1 / sources.length);
      break;
    }
    
    case 'minimum': {
      value = Math.min(...sources.map(s => s.value));
      break;
    }
    
    default: {
      // 默认简单平均
      value = sources.reduce((sum, s) => sum + s.value, 0) / sources.length;
    }
  }
  
  // 归一化
  const { min, max, scale } = config.normalization || { min: 0, max: 100 };
  let normalized: number;
  
  if (scale === 'log') {
    normalized = Math.min(1, Math.log10(Math.max(1, value)) / Math.log10(max));
  } else {
    normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  }
  
  // 计算各来源的贡献
  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
  const breakdown = sources.map(s => ({
    source: s.source,
    value: s.value,
    weight: s.weight,
    contribution: (s.value * s.weight / totalWeight) / value * normalized,
  }));
  
  return { value, normalized, breakdown };
}

// ==========================================
// 3. 存活概率计算
// ==========================================

/**
 * 计算所有维度分数
 */
export function calculateDimensions(state: StoreState): Record<DimensionId, DimensionScore> {
  const dimensions = {} as Record<DimensionId, DimensionScore>;
  
  for (const dimId of Object.keys(dimensionConfig.dimensions)) {
    const dimConfig = (dimensionConfig.dimensions as any)[dimId];
    const sources = extractDimensionSources(dimId as DimensionId, state);
    const aggregated = aggregateDimension(dimId as DimensionId, sources, dimConfig);
    
    dimensions[dimId as DimensionId] = {
      id: dimId as DimensionId,
      value: aggregated.value,
      normalized: aggregated.normalized,
      weight: dimConfig.weight,
      breakdown: aggregated.breakdown,
    };
  }
  
  return dimensions;
}

/**
 * 计算综合存活概率
 */
export function calculateSurvivalChance(
  state: StoreState,
  options?: { includeVariance?: boolean; varianceSeed?: number }
): SurvivalCalculationResult {
  const dimensions = calculateDimensions(state);
  
  // 1. 计算加权综合分数
  let compositeScore = 0;
  let totalWeight = 0;
  
  for (const dim of Object.values(dimensions)) {
    compositeScore += dim.normalized * dim.weight;
    totalWeight += dim.weight;
  }
  
  compositeScore /= totalWeight;
  
  // 2. 应用疾病惩罚
  const calcConfig = dimensionConfig.calculation;
  let diseasePenalty = 0;
  
  for (const diseaseId of state.vitality.activeDiseases) {
    const diseaseDef = state.gameDataCache?.diseases?.find((d: Disease) => d.id === diseaseId);
    if (diseaseDef?.type === 'ACUTE') {
      diseasePenalty += calcConfig.diseasePenalty.perAcuteDisease;
    } else {
      diseasePenalty += calcConfig.diseasePenalty.perDisease;
    }
  }
  
  diseasePenalty += state.vitality.metrics.addiction * calcConfig.diseasePenalty.addictionMultiplier;
  
  // 3. Sigmoid 映射
  // P(survival) = 1 / (1 + e^(-k * (score - midpoint)))
  const { steepness, midpoint } = calcConfig.sigmoidParams;
  const adjustedScore = (compositeScore * 100 - midpoint) * steepness;
  let survivalProbability = 1 / (1 + Math.exp(-adjustedScore));
  
  // 4. 减去疾病惩罚
  survivalProbability = Math.max(0, survivalProbability - diseasePenalty);
  
  // 5. 随机扰动（可选）
  if (options?.includeVariance) {
    const variance = (Math.random() * 0.1) - 0.05; // ±5%
    survivalProbability = Math.max(0, Math.min(1, survivalProbability + variance));
  }
  
  // 6. 风险等级
  let riskLevel: SurvivalCalculationResult['riskLevel'];
  if (survivalProbability >= 0.80) riskLevel = 'SAFE';
  else if (survivalProbability >= 0.60) riskLevel = 'WARNING';
  else if (survivalProbability >= 0.40) riskLevel = 'DANGER';
  else riskLevel = 'CRITICAL';
  
  // 7. 找最短板
  const sortedDims = Object.values(dimensions).sort((a, b) => a.normalized - b.normalized);
  const weakDimension = sortedDims[0].normalized < 0.4 ? sortedDims[0].id : undefined;
  
  // 8. 生成建议
  const recommendations: string[] = [];
  if (weakDimension) {
    const dimNames: Record<DimensionId, string> = {
      physicalDefense: '提升物理防御（寻找更好住所或装备）',
      mentalStability: '恢复精神稳定（使用舒缓物品或进行信仰活动）',
      nutritionSupply: '改善营养供给（吃更好的食物）',
      medicalSupport: '增强医疗支持（购买保险或储备药品）',
      economicBuffer: '增加经济缓冲（赚取更多金钱）',
    };
    recommendations.push(dimNames[weakDimension]);
  }
  
  return {
    dimensions,
    compositeScore,
    survivalProbability,
    riskLevel,
    weakDimension,
    recommendations,
  };
}

// ==========================================
// 4. 快捷函数
// ==========================================

/**
 * 快速获取存活概率（不带详细分解）
 */
export function quickSurvivalChance(state: StoreState): number {
  return calculateSurvivalChance(state).survivalProbability;
}

/**
 * 判定本回合是否存活
 */
export function rollSurvival(state: StoreState): { survived: boolean; roll: number; chance: number } {
  const chance = calculateSurvivalChance(state, { includeVariance: false }).survivalProbability;
  const roll = Math.random();
  return { survived: roll <= chance, roll, chance };
}

// ==========================================
// 5. 辅助函数
// ==========================================

function extractHousingValue(housing: any, attribute: string): number {
  const valueMap: Record<string, number> = {
    defenseLevel: housing.defenseLevel || 0,
    comfortLevel: (housing.regenHp || 0) * 5, // 简单映射
    hasKitchen: housing.weeklyCosts?.some((c: any) => c.key === 'KITCHEN') ? 50 : 0,
  };
  return valueMap[attribute] || 0;
}

function findEquippedItems(state: StoreState): Item[] {
  // 从 inventory 中找装备类物品
  // 这里需要根据实际数据结构实现
  return state.gameDataCache?.items?.filter((item: Item) => 
    state.inventory.includes(item.id) && item.type === 'PASSIVE'
  ) || [];
}

function findItemsByTag(state: StoreState, tag?: string): Item[] {
  if (!tag) return [];
  return state.gameDataCache?.items?.filter((item: Item) => 
    state.inventory.includes(item.id) && item.tags?.includes(tag)
  ) || [];
}

function getAttribute(item: Item, attribute: string): number {
  const effects = item.effects as any;
  if (!effects) return 0;
  
  const value = effects[attribute];
  if (typeof value === 'number') return value;
  
  // 特殊处理
  if (attribute === 'defense' && effects.maxHp) return effects.maxHp * 0.2;
  if (attribute === 'hpRestore' && effects.hp) return effects.hp;
  if (attribute === 'insightRestore' && effects.insight) return effects.insight;
  if (attribute === 'hungerRestore' && effects.hunger) return effects.hunger;
  
  return 0;
}

function calculateNutritionScore(state: StoreState): number {
  const diet = state.dietState;
  if (!diet) return 50;
  
  // 基于饮食状态计算营养分
  let score = 50;
  score += (diet.healthyPoints || 0) * 0.5;
  score -= (diet.junkFoodPoints || 0) * 0.3;
  score -= (diet.sodiumIntake || 0) * 0.1;
  score -= (diet.sugarIntake || 0) * 0.1;
  
  return Math.max(0, Math.min(100, score));
}

function calculateInsuranceCoverage(state: StoreState): number {
  if (!state.activeInsurances?.length) return 0;
  
  // 计算保险覆盖度分数
  return state.activeInsurances.reduce((sum, ins) => {
    const coverage = ins.coverage;
    let score = 30; // 基础分
    if (coverage.emergencyCovered) score += 20;
    if (coverage.mentalCovered) score += 15;
    if (coverage.addictionCovered) score += 15;
    score += (1 - coverage.copayModifier) * 20; // 自付比例越低分越高
    return sum + score;
  }, 0) / state.activeInsurances.length;
}

function calculateWeeklyIncome(_state: StoreState): number {
  // 简化计算：基于工作收入
  // 实际需要根据 activeJobs 计算
  void _state; // 标记为已使用
  return 100; // 默认值
}

// ==========================================
// 6. 调试和导出
// ==========================================

/**
 * 导出维度分析（用于调试）
 */
export function exportDimensionAnalysis(state: StoreState): string {
  const result = calculateSurvivalChance(state);
  
  let output = '\n╔══════════════════════════════════════════════════════════╗\n';
  output += '║           维度聚合存活分析                                ║\n';
  output += '╚══════════════════════════════════════════════════════════╝\n\n';
  
  output += `📊 综合存活概率: ${(result.survivalProbability * 100).toFixed(1)}%\n`;
  output += `📈 综合评分: ${(result.compositeScore * 100).toFixed(1)}/100\n`;
  output += `🚨 风险等级: ${result.riskLevel}\n`;
  if (result.weakDimension) {
    output += `⚠️  最短板: ${result.weakDimension}\n`;
  }
  output += '\n';
  
  output += '维度详情:\n';
  output += '────────────────────────────────────────────────────────────\n';
  
  for (const dim of Object.values(result.dimensions)) {
    const name = dim.id.padEnd(18);
    const score = `${dim.normalized.toFixed(2)}`.padStart(5);
    const bar = '█'.repeat(Math.floor(dim.normalized * 20)) + '░'.repeat(20 - Math.floor(dim.normalized * 20));
    output += `${name} [${bar}] ${score}\n`;
    
    for (const b of dim.breakdown) {
      const sourceName = `  └─ ${b.source}`.padEnd(30);
      const val = `${b.value.toFixed(1)}`.padStart(6);
      const contr = `${(b.contribution * 100).toFixed(1)}%`.padStart(6);
      output += `${sourceName} =${val} (${contr})\n`;
    }
  }
  
  output += '────────────────────────────────────────────────────────────\n';
  
  if (result.recommendations.length > 0) {
    output += '\n💡 建议:\n';
    result.recommendations.forEach(r => output += `   • ${r}\n`);
  }
  
  return output;
}
