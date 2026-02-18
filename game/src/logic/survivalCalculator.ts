/**
 * 简化版存活计算器 - 直接使用现有JSON数据结构
 * 
 * 使用方法:
 * 1. 不需要修改现有 items.json, housing.json 等文件
 * 2. 在需要计算存活率的地方调用 calculateSurvivalRate(state)
 * 3. 调整 survival_dimensions_simple.json 来改变难度
 */

import { Item, Housing, Job, Disease } from '@/types/schema';
import type { StoreState } from '@/types/store';
import config from '@/assets/data/rules/survival_dimensions_simple.json';

// ==========================================
// 类型定义
// ==========================================

export type DimensionId = 'physicalDefense' | 'mentalStability' | 'nutritionSupply' | 'medicalSupport' | 'economicSecurity';

export interface DimensionResult {
  id: DimensionId;
  score: number;        // 0-100
  normalized: number;   // 0-1
  weight: number;
  sources: { name: string; value: number; contribution: number }[];
}

export interface SurvivalResult {
  dimensions: Record<DimensionId, DimensionResult>;
  compositeScore: number;
  survivalRate: number;
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
  weakDimension?: DimensionId;
  suggestions: string[];
}

// ==========================================
// 核心计算函数
// ==========================================

/**
 * 计算单个维度的分数
 */
function calculateDimension(
  dimensionId: DimensionId,
  state: StoreState,
  allItems: Item[],
  allHousing: Housing[],
  allJobs: Job[]
): DimensionResult {
  const dimConfig = (config.dimensions as any)[dimensionId];
  const calcConfig = config.calculation;
  
  const sources: { name: string; value: number; weight: number }[] = [];
  
  // 1. 计算各来源的值
  for (const source of dimConfig.sources) {
    let value = 0;
    let name = source.type;
    
    switch (source.type) {
      case 'housing': {
        if (state.activeHousing) {
          const housingDef = allHousing.find(h => h.id === state.activeHousing!.definitionId);
          if (housingDef) {
            if (source.attribute === 'defenseLevel') {
              value = (housingDef.defenseLevel || 0) * (source.multiplier || 1);
            } else if (source.attribute === 'regenHp') {
              value = (housingDef.regenHp || 0) * (source.multiplier || 1);
            }
          }
        }
        name = `住所(${source.attribute})`;
        break;
      }
      
      case 'faith': {
        if (state.faith.id !== 'NONE') {
          value = state.faith.level * (source.multiplier || 1);
        }
        name = '信仰等级';
        break;
      }
      
      case 'diet': {
        const diet = state.dietState;
        if (diet) {
          // 计算饮食健康分
          value = 50;
          value += (diet.healthyPoints || 0) * 0.5;
          value -= (diet.junkFoodPoints || 0) * 0.3;
          value -= (diet.sodiumIntake || 0) * 0.1;
          value -= (diet.sugarIntake || 0) * 0.1;
          value = Math.max(0, Math.min(100, value));
        }
        name = '饮食健康度';
        break;
      }
      
      case 'inventory': {
        // 查找背包中符合条件的物品
        const items = state.inventory
          .map(id => allItems.find(item => item.id === id))
          .filter((item): item is Item => !!item);
        
        if (source.tag) {
          const taggedItems = items.filter(item => item.tags?.includes(source.tag));
          if (taggedItems.length > 0) {
            const attrValue = taggedItems.reduce((sum, item) => {
              const effect = (item.effects as any)?.[source.attribute];
              return sum + (effect || 0);
            }, 0);
            value = attrValue * (source.multiplier || 1);
          }
        }
        name = `背包(${source.tag})`;
        break;
      }
      
      case 'insurance': {
        const hasMedical = state.activeInsurances?.some(ins => 
          ins.type === 'MEDICAL' || (ins as any).coverage?.emergencyCovered
        );
        if (hasMedical) {
          value = source.value || 50;
        }
        name = '医疗保险';
        break;
      }
      
      case 'region': {
        const regionKey = state.currentRegion as string;
        value = (config.regionHospitalTiers as any)[regionKey] || 50;
        name = '区域医疗';
        break;
      }
      
      case 'income': {
        // 计算周净收入
        const activeJobs = state.vitality.activeJobs || [];
        let weeklyIncome = 0;
        for (const jobId of activeJobs) {
          const job = allJobs.find(j => j.id === jobId);
          if (job) {
            weeklyIncome += job.baseSalary || 0;
          }
        }
        value = weeklyIncome * (source.multiplier || 0.05);
        name = '周收入';
        break;
      }
      
      case 'currency': {
        const gold = state.vitality.metrics.gold;
        if (source.scale === 'log') {
          value = Math.log10(Math.max(1, gold)) * 20; // log10(10000)=4 -> 80分
        } else {
          value = gold * (source.multiplier || 0.01);
        }
        name = '现金';
        break;
      }
    }
    
    sources.push({ name, value, weight: source.weight });
  }
  
  // 2. 加权平均
  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
  let score = totalWeight > 0 
    ? sources.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight 
    : 0;
  
  // 3. 加入阶级基础分
  const classBase = (config.classBaseScores as any)[state.vitality.identity.currentClass]?.[dimensionId] || 0;
  score = score * 0.7 + classBase * 0.3; // 70%动态分 + 30%基础分
  
  // 4. 无家可归惩罚
  if (!state.activeHousing) {
    const homelessPenalty = (calcConfig.homelessPenalty as any)?.[dimensionId];
    if (homelessPenalty) {
      score = Math.max(0, score + homelessPenalty);
    }
  }
  
  // 5. 归一化
  const normalized = Math.max(0, Math.min(1, score / 100));
  
  // 6. 计算各来源贡献度
  const breakdown = sources.map(s => ({
    name: s.name,
    value: s.value,
    contribution: totalWeight > 0 ? (s.value * s.weight / totalWeight) / score : 0,
  }));
  
  return {
    id: dimensionId,
    score,
    normalized,
    weight: dimConfig.weight,
    sources: breakdown,
  };
}

/**
 * 计算综合存活率
 */
export function calculateSurvivalRate(
  state: StoreState,
  options?: { includeVariance?: boolean }
): SurvivalResult {
  const gameDataCache = state.gameDataCache;
  const allItems = gameDataCache?.items || [];
  const allHousing = gameDataCache?.housing || [];
  const allJobs = gameDataCache?.jobs || [];
  
  const calcConfig = config.calculation;
  
  // 1. 计算所有维度
  const dimensions = {} as Record<DimensionId, DimensionResult>;
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const dimId of Object.keys(config.dimensions) as DimensionId[]) {
    const dim = calculateDimension(dimId, state, allItems, allHousing, allJobs);
    dimensions[dimId] = dim;
    totalScore += dim.normalized * dim.weight;
    totalWeight += dim.weight;
  }
  
  // 2. 计算综合分数
  const compositeScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  
  // 3. Sigmoid 映射
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-calcConfig.sigmoid.steepness * (x - calcConfig.sigmoid.midpoint)));
  let survivalRate = sigmoid(compositeScore);
  
  // 4. 应用疾病惩罚
  const diseases = state.vitality.activeDiseases;
  const diseaseDefs = gameDataCache?.diseases || [];
  let diseasePenalty = 0;
  
  for (const diseaseId of diseases) {
    const diseaseDef = diseaseDefs.find((d: Disease) => d.id === diseaseId);
    if (diseaseDef?.type === 'ACUTE') {
      diseasePenalty += calcConfig.diseasePenalty.perAcuteDisease;
    } else {
      diseasePenalty += calcConfig.diseasePenalty.perDisease;
    }
  }
  
  // 成瘾惩罚
  diseasePenalty += state.vitality.metrics.addiction * calcConfig.diseasePenalty.addictionMultiplier;
  
  survivalRate = Math.max(0, survivalRate - diseasePenalty);
  
  // 5. 随机扰动
  if (options?.includeVariance) {
    const variance = (Math.random() - 0.5) * 0.1; // ±5%
    survivalRate = Math.max(0, Math.min(1, survivalRate + variance));
  }
  
  // 6. 风险等级
  let riskLevel: SurvivalResult['riskLevel'];
  if (survivalRate >= 0.80) riskLevel = 'SAFE';
  else if (survivalRate >= 0.60) riskLevel = 'WARNING';
  else if (survivalRate >= 0.40) riskLevel = 'DANGER';
  else riskLevel = 'CRITICAL';
  
  // 7. 找最短板
  const sortedDims = Object.values(dimensions).sort((a, b) => a.normalized - b.normalized);
  const weakDimension = sortedDims[0].normalized < 0.4 ? sortedDims[0].id : undefined;
  
  // 8. 生成建议
  const suggestions: string[] = [];
  const dimNames: Record<DimensionId, string> = {
    physicalDefense: '提升住所安全等级',
    mentalStability: '寻找更好的住所或加入信仰',
    nutritionSupply: '改善饮食质量',
    medicalSupport: '购买医疗保险',
    economicSecurity: '增加收入来源',
  };
  
  if (weakDimension) {
    suggestions.push(dimNames[weakDimension]);
  }
  if (diseases.length > 0) {
    suggestions.push('治疗疾病');
  }
  if (!state.activeHousing) {
    suggestions.push('尽快寻找住所');
  }
  
  return {
    dimensions,
    compositeScore,
    survivalRate,
    riskLevel,
    weakDimension,
    suggestions,
  };
}

/**
 * 快速获取存活率（不带详细分解）
 */
export function getSurvivalRateQuick(state: StoreState): number {
  return calculateSurvivalRate(state).survivalRate;
}

/**
 * 回合结束判定
 */
export function checkSurvival(state: StoreState): { survived: boolean; roll: number; rate: number } {
  const result = calculateSurvivalRate(state, { includeVariance: true });
  const roll = Math.random();
  return {
    survived: roll <= result.survivalRate,
    roll,
    rate: result.survivalRate,
  };
}

// ==========================================
// 调试工具
// ==========================================

/**
 * 打印存活率分析
 */
export function printSurvivalAnalysis(state: StoreState): string {
  const result = calculateSurvivalRate(state);
  
  let output = '\n╔══════════════════════════════════════════════════════════╗\n';
  output += '║           存活概率分析                                    ║\n';
  output += '╚══════════════════════════════════════════════════════════╝\n\n';
  
  output += `📊 综合存活率: ${(result.survivalRate * 100).toFixed(1)}%\n`;
  output += `📈 综合评分: ${result.compositeScore.toFixed(1)}/100\n`;
  output += `🚨 风险等级: ${result.riskLevel}\n`;
  if (result.weakDimension) {
    output += `⚠️  最短板: ${result.weakDimension}\n`;
  }
  output += '\n';
  
  output += '维度详情:\n';
  output += '────────────────────────────────────────────────────────────\n';
  
  const dimLabels: Record<DimensionId, string> = {
    physicalDefense: '物理防御',
    mentalStability: '精神稳定',
    nutritionSupply: '营养供给',
    medicalSupport: '医疗支持',
    economicSecurity: '经济安全',
  };
  
  for (const dim of Object.values(result.dimensions)) {
    const name = dimLabels[dim.id].padEnd(12);
    const score = `${dim.score.toFixed(0)}`.padStart(4);
    const bar = '█'.repeat(Math.floor(dim.normalized * 20)) + '░'.repeat(20 - Math.floor(dim.normalized * 20));
    output += `${name} [${bar}] ${score}\n`;
    
    for (const src of dim.sources.slice(0, 2)) {
      output += `  └─ ${src.name}: ${src.value.toFixed(1)}\n`;
    }
  }
  
  output += '────────────────────────────────────────────────────────────\n';
  
  if (result.suggestions.length > 0) {
    output += '\n💡 建议:\n';
    result.suggestions.forEach(s => output += `   • ${s}\n`);
  }
  
  return output;
}

/**
 * 模拟不同场景的存活率
 */
export function simulateScenarios(
  createState: (config: Record<string, unknown>) => StoreState
): { scenario: string; rate: number; risk: string }[] {
  const scenarios = [
    {
      name: '流浪者开局',
      config: {
        class: 'HOMELESS',
        region: 'SLUMS',
        housing: null,
        gold: 50,
        inventory: ['FOOD_INSTANT_RAMEN'],
        diseases: [],
      },
    },
    {
      name: '工人中期',
      config: {
        class: 'WORKER',
        region: 'RUST_BELT',
        housing: 'APT_RUST_01',
        gold: 500,
        inventory: ['FOOD_DOLLAR_MENU', 'FOOD_CORNER_STORE_BREAD'],
        diseases: [],
      },
    },
    {
      name: '中产舒适',
      config: {
        class: 'MIDDLE',
        region: 'SUBURBS',
        housing: 'HOUSE_SUBURB_01',
        gold: 3000,
        inventory: ['FOOD_FARMERS_MARKET_VEGGIES'],
        diseases: [],
      },
    },
    {
      name: '重病危机',
      config: {
        class: 'WORKER',
        region: 'SLUMS',
        housing: 'APT_SLUMS_01',
        gold: 100,
        inventory: [],
        diseases: ['FLU', 'ACUTE_INFECTION'],
        hp: 30,
      },
    },
  ];
  
  return scenarios.map(s => {
    const state = createState(s.config);
    const result = calculateSurvivalRate(state);
    return {
      scenario: s.name,
      rate: result.survivalRate,
      risk: result.riskLevel,
    };
  });
}
