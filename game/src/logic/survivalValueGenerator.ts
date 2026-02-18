/**
 * 生存数值生成器 (Survival Value Generator)
 * 
 * 核心功能：根据目标存活率，逆向计算各系统JSON应该配置的数值
 * 
 * 使用场景：
 * 1. 我要设计一个"中产舒适"状态，期望存活率80%，各项数值应该是多少？
 * 2. 我要设计一个"重病危机"事件，期望降低存活率20%，事件效果应该是多少？
 * 3. 我要设计一个物品，期望提升存活率5%，物品的effects应该是多少？
 */

import config from '@/assets/data/rules/survival_dimensions_simple.json';

// ==========================================
// 类型定义
// ==========================================

export interface TargetState {
  name: string;
  targetSurvivalRate: number;  // 0-1
  constraints?: {
    minGold?: number;
    maxGold?: number;
    requiredClass?: string;
    requiredRegion?: string;
    hasHousing?: boolean;
  };
}

export interface GeneratedValues {
  items: {
    foodHungerValue: number;      // items.json 中 effects.hunger
    medicalHpValue: number;       // items.json 中 effects.hp
  };
  housing: {
    defenseLevel: number;         // housing.json 中 defenseLevel
    regenHp: number;              // housing.json 中 regenHp
  };
  jobs: {
    baseSalary: number;           // jobs.json 中 baseSalary
  };
  events?: {
    hpImpact?: number;            // events.json 中 effects.hp
    goldImpact?: number;          // events.json 中 effects.gold
  };
  bills?: {
    amount: number;               // bills.json 中 amount
  };
}

export interface ValueBreakdown {
  dimension: string;
  requiredScore: number;        // 该维度需要多少分
  sources: {
    source: string;
    contribution: number;         // 该来源需要贡献多少分
    jsonValue: number | string;   // JSON中应该设置的值
  }[];
}

// ==========================================
// 核心算法：逆向计算
// ==========================================

/**
 * 根据目标存活率，逆向计算需要的综合分数
 * 
 * 公式反推：
 * survival = sigmoid(score) - diseasePenalty
 * => score = sigmoid_inverse(survival + diseasePenalty)
 */
function calculateRequiredScore(
  targetSurvivalRate: number,
  diseasePenalty: number = 0
): number {
  const calcConfig = config.calculation;
  const { steepness, midpoint } = calcConfig.sigmoid;
  
  // 考虑疾病惩罚后的有效存活率
  const effectiveSurvival = Math.min(0.99, targetSurvivalRate + diseasePenalty);
  
  // Sigmoid 反函数：x = -ln(1/y - 1) / k + midpoint
  const score = -Math.log(1 / effectiveSurvival - 1) / steepness + midpoint;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * 根据各维度权重，分配所需分数
 */
function distributeDimensionScores(
  totalScore: number,
  targetDistribution?: Partial<Record<string, number>>
): Record<string, number> {
  const weights = config.calculation.dimensionWeights;
  const scores: Record<string, number> = {};
  
  // 如果指定了分布，按分布来
  if (targetDistribution) {
    for (const [dim, ratio] of Object.entries(targetDistribution)) {
      scores[dim] = totalScore * (ratio as number);
    }
  } else {
    // 否则按权重分配
    for (const [dim, weight] of Object.entries(weights)) {
      scores[dim] = totalScore * (weight as number) * 1.2; // 1.2倍补偿系数
    }
  }
  
  return scores;
}

// ==========================================
// 各系统数值生成器
// ==========================================

/**
 * 生成物品数值
 */
function generateItemValues(
  nutritionScore: number,
  medicalScore: number,
  hasHousing: boolean
): GeneratedValues['items'] {
  const dimConfig = config.dimensions as any;
  
  // nutritionSupply 计算反推
  // nutritionScore = diet(50) * 0.5 + food * 0.4 + kitchen * 0.2
  // 假设 diet 平均 40分，kitchen 有则 30分
  const dietContribution = 40 * 0.5;
  const kitchenContribution = hasHousing ? 30 * 0.2 : 0;
  const remainingNutrition = Math.max(0, nutritionScore - dietContribution - kitchenContribution);
  const foodHungerValue = remainingNutrition / 0.4 / 1.5; // 1.5是 multiplier
  
  // medicalSupport 计算反推
  // medicalScore = insurance(60) * 0.4 + medicalItems * 0.3 + region(50) * 0.2
  const insuranceContribution = 60 * 0.4;
  const regionContribution = 50 * 0.2;
  const remainingMedical = Math.max(0, medicalScore - insuranceContribution - regionContribution);
  const medicalHpValue = remainingMedical / 0.3 / 2; // 2是 multiplier
  
  return {
    foodHungerValue: Math.round(foodHungerValue),
    medicalHpValue: Math.round(medicalHpValue),
  };
}

/**
 * 生成住所数值
 */
function generateHousingValues(
  physicalScore: number,
  mentalScore: number,
  playerClass: string
): GeneratedValues['housing'] {
  const classBase = (config.classBaseScores as any)[playerClass] || {};
  
  // physicalDefense = housing * 0.6 + classBase * 0.3
  // housing = defenseLevel * 5 + regenHp * 2
  const basePhysical = (classBase.physicalDefense || 10) * 0.3;
  const requiredHousingPhysical = Math.max(0, (physicalScore - basePhysical) / 0.6);
  
  // mentalStability = housing * 0.5 + classBase * 0.1
  const baseMental = (classBase.mentalStability || 15) * 0.1;
  const requiredHousingMental = Math.max(0, (mentalScore - baseMental) / 0.5);
  
  // 解方程组：
  // defenseLevel * 5 + regenHp * 2 = requiredHousingPhysical
  // regenHp * 3 = requiredHousingMental
  // => regenHp = requiredHousingMental / 3
  // => defenseLevel = (requiredHousingPhysical - regenHp * 2) / 5
  
  const regenHp = Math.round(requiredHousingMental / 3);
  const defenseLevel = Math.round((requiredHousingPhysical - regenHp * 2) / 5);
  
  return {
    defenseLevel: Math.max(1, defenseLevel),
    regenHp: Math.max(5, regenHp),
  };
}

/**
 * 生成工作数值
 */
function generateJobValues(
  economicScore: number,
  hasVehicle: boolean,
  hasLicense: boolean
): GeneratedValues['jobs'] {
  // economicSecurity = income * 0.6 + gold * 0.4
  // 假设 gold 贡献 30分
  const goldContribution = 30 * 0.4;
  const requiredIncomeScore = Math.max(0, (economicScore - goldContribution) / 0.6);
  
  // income = baseSalary * 0.05
  const baseSalary = Math.round(requiredIncomeScore / 0.05);
  
  // 区域修正
  let adjustedSalary = baseSalary;
  if (!hasVehicle) {
    // 无车只能做本地工作，收入上限降低
    adjustedSalary = Math.min(adjustedSalary, 600);
  }
  if (!hasLicense && hasVehicle) {
    // 有车无驾照，收入打折
    adjustedSalary = Math.round(adjustedSalary * 0.7);
  }
  
  return {
    baseSalary: adjustedSalary,
  };
}

/**
 * 生成事件数值（用于设计事件）
 */
export function generateEventImpact(
  targetSurvivalChange: number,  // 正数=提升，负数=降低
  currentState: {
    survivalRate: number;
    dimensions: Record<string, number>;
  }
): {
  hpEffect: number;
  goldEffect: number;
  sanEffect: number;
  expectedNewRate: number;
} {
  // 目标新存活率
  const targetRate = Math.max(0, Math.min(1, 
    currentState.survivalRate + targetSurvivalChange
  ));
  
  // 计算需要的分数变化
  const currentScore = calculateRequiredScore(currentState.survivalRate);
  const targetScore = calculateRequiredScore(targetRate);
  const scoreDelta = targetScore - currentScore;
  
  // 分配到各维度
  // 负面事件主要影响 physicalDefense（伤害）和 economicSecurity（财产损失）
  // 正面事件主要影响 mentalStability（精神）和 medicalSupport（治疗）
  
  let hpEffect = 0;
  let goldEffect = 0;
  let sanEffect = 0;
  
  if (targetSurvivalChange < 0) {
    // 负面事件
    // 60% 来自 physical (HP伤害)
    // 40% 来自 economic (金钱损失)
    const physicalImpact = scoreDelta * 0.6;
    const economicImpact = scoreDelta * 0.4;
    
    // HP 效果转换：physicalDefense 的 1分 ≈ 2 HP
    hpEffect = Math.round(physicalImpact / 0.3 * 2);
    
    // Gold 效果转换：economicSecurity 的 1分 ≈ $20
    goldEffect = Math.round(economicImpact / 0.1 * 20) * -1;
  } else {
    // 正面事件
    // 50% 来自 mental (SAN恢复)
    // 50% 来自 medical (HP恢复)
    const mentalImpact = scoreDelta * 0.5;
    const medicalImpact = scoreDelta * 0.5;
    
    sanEffect = Math.round(mentalImpact / 0.25 * 3);
    hpEffect = Math.round(medicalImpact / 0.15 * 2);
  }
  
  return {
    hpEffect,
    goldEffect,
    sanEffect,
    expectedNewRate: targetRate,
  };
}

// ==========================================
// 主生成函数
// ==========================================

/**
 * 根据目标状态，生成完整的数值配置
 * 
 * @example
 * const result = generateValuesForState({
 *   name: "中产舒适期",
 *   targetSurvivalRate: 0.80,
 *   constraints: { hasHousing: true, requiredClass: "MIDDLE" }
 * });
 */
export function generateValuesForState(
  target: TargetState
): {
  values: GeneratedValues;
  breakdown: ValueBreakdown[];
  validation: {
    expectedSurvivalRate: number;
    dimensionScores: Record<string, number>;
  };
} {
  // 1. 计算所需综合分数
  const requiredScore = calculateRequiredScore(target.targetSurvivalRate);
  
  // 2. 分配到各维度
  const dimScores = distributeDimensionScores(requiredScore);
  
  // 3. 生成各系统数值
  const hasHousing = target.constraints?.hasHousing ?? true;
  const playerClass = target.constraints?.requiredClass || 'WORKER';
  
  const itemValues = generateItemValues(
    dimScores.nutritionSupply,
    dimScores.medicalSupport,
    hasHousing
  );
  
  const housingValues = generateHousingValues(
    dimScores.physicalDefense,
    dimScores.mentalStability,
    playerClass
  );
  
  const jobValues = generateJobValues(
    dimScores.economicSecurity,
    true,  // 假设有车
    true   // 假设有驾照
  );
  
  // 4. 构建详细分解
  const breakdown: ValueBreakdown[] = [
    {
      dimension: 'physicalDefense',
      requiredScore: dimScores.physicalDefense,
      sources: [
        { source: 'housing.defenseLevel', contribution: housingValues.defenseLevel * 5, jsonValue: housingValues.defenseLevel },
        { source: 'housing.regenHp', contribution: housingValues.regenHp * 2, jsonValue: housingValues.regenHp },
        { source: 'classBase', contribution: (config.classBaseScores as any)[playerClass]?.physicalDefense * 0.3, jsonValue: 'auto' },
      ],
    },
    {
      dimension: 'mentalStability',
      requiredScore: dimScores.mentalStability,
      sources: [
        { source: 'housing.regenHp', contribution: housingValues.regenHp * 3, jsonValue: housingValues.regenHp },
        { source: 'classBase', contribution: (config.classBaseScores as any)[playerClass]?.mentalStability * 0.1, jsonValue: 'auto' },
      ],
    },
    {
      dimension: 'nutritionSupply',
      requiredScore: dimScores.nutritionSupply,
      sources: [
        { source: 'items.food.hunger', contribution: itemValues.foodHungerValue * 1.5, jsonValue: itemValues.foodHungerValue },
        { source: 'diet.base', contribution: 40 * 0.5, jsonValue: 'player behavior' },
        { source: 'housing.kitchen', contribution: hasHousing ? 30 * 0.2 : 0, jsonValue: hasHousing ? 'hasKitchen: true' : 'none' },
      ],
    },
    {
      dimension: 'medicalSupport',
      requiredScore: dimScores.medicalSupport,
      sources: [
        { source: 'items.medical.hp', contribution: itemValues.medicalHpValue * 2, jsonValue: itemValues.medicalHpValue },
        { source: 'insurance.base', contribution: 60 * 0.4, jsonValue: 'need insurance' },
        { source: 'region.hospital', contribution: 50 * 0.2, jsonValue: 'SUBURBS=70, DOWNTOWN=90' },
      ],
    },
    {
      dimension: 'economicSecurity',
      requiredScore: dimScores.economicSecurity,
      sources: [
        { source: 'jobs.salary', contribution: jobValues.baseSalary * 0.05, jsonValue: `$${jobValues.baseSalary}/week` },
        { source: 'gold.savings', contribution: 30 * 0.4, jsonValue: '~$1000 saved' },
      ],
    },
  ];
  
  // 5. 验证
  const validation = {
    expectedSurvivalRate: target.targetSurvivalRate,
    dimensionScores: dimScores,
  };
  
  return {
    values: {
      items: itemValues,
      housing: housingValues,
      jobs: jobValues,
    },
    breakdown,
    validation,
  };
}

// ==========================================
// 辅助工具函数
// ==========================================

/**
 * 生成物品配置 JSON
 */
export function generateItemJson(
  id: string,
  name: string,
  targetSurvivalBoost: number,
  type: 'FOOD' | 'MEDICAL' | 'COMFORT'
): object {
  const basePrice = type === 'FOOD' ? 10 : type === 'MEDICAL' ? 50 : 30;
  const priceMultiplier = 1 + targetSurvivalBoost * 10;
  
  let effects: any = {};
  let tags: string[] = [];
  
  switch (type) {
    case 'FOOD':
      effects = { hunger: Math.round(targetSurvivalBoost * 50) };
      tags = ['FOOD'];
      break;
    case 'MEDICAL':
      effects = { hp: Math.round(targetSurvivalBoost * 40) };
      tags = ['MEDICAL'];
      break;
    case 'COMFORT':
      effects = { san: Math.round(targetSurvivalBoost * 30) };
      tags = ['COMFORT'];
      break;
  }
  
  return {
    id,
    name,
    type: 'CONSUMABLE',
    price: Math.round(basePrice * priceMultiplier),
    effects,
    tags,
    flavorText: `期望提升存活率 ${(targetSurvivalBoost * 100).toFixed(0)}%`,
  };
}

/**
 * 生成事件配置 JSON
 */
export function generateEventJson(
  id: string,
  name: string,
  targetSurvivalChange: number,
  currentSurvivalRate: number
): object {
  const impact = generateEventImpact(targetSurvivalChange, {
    survivalRate: currentSurvivalRate,
    dimensions: {},
  });
  
  const isNegative = targetSurvivalChange < 0;
  
  return {
    id,
    title: name,
    text: isNegative ? '一件坏事发生了...' : '一件好事发生了...',
    options: {
      A: {
        label: isNegative ? '承受损失' : '接受好处',
        effects: {
          hp: impact.hpEffect,
          gold: impact.goldEffect,
          san: impact.sanEffect,
        },
      },
    },
    _meta: {
      expectedSurvivalChange: targetSurvivalChange,
      calculatedImpact: impact,
    },
  };
}

// ==========================================
// 导出报告
// ==========================================

/**
 * 生成可读的设计报告
 */
export function generateDesignReport(target: TargetState): string {
  const result = generateValuesForState(target);
  
  let report = `\n╔══════════════════════════════════════════════════════════╗\n`;
  report += `║  数值设计方案: ${target.name.padEnd(38)}║\n`;
  report += `╚══════════════════════════════════════════════════════════╝\n\n`;
  
  report += `🎯 目标存活率: ${(target.targetSurvivalRate * 100).toFixed(0)}%\n`;
  report += `📊 所需综合分数: ${calculateRequiredScore(target.targetSurvivalRate).toFixed(1)}/100\n\n`;
  
  report += `══════════════════════════════════════════════════════════\n`;
  report += `💎 推荐 JSON 配置\n`;
  report += `══════════════════════════════════════════════════════════\n\n`;
  
  // Items
  report += `【items.json】\n`;
  report += `  食物物品:\n`;
  report += `    "effects": { "hunger": ${result.values.items.foodHungerValue} }\n`;
  report += `    "tags": ["FOOD"]\n\n`;
  report += `  医疗物品:\n`;
  report += `    "effects": { "hp": ${result.values.items.medicalHpValue} }\n`;
  report += `    "tags": ["MEDICAL"]\n\n`;
  
  // Housing
  report += `【housing.json】\n`;
  report += `  "defenseLevel": ${result.values.housing.defenseLevel}\n`;
  report += `  "regenHp": ${result.values.housing.regenHp}\n\n`;
  
  // Jobs
  report += `【jobs.json】\n`;
  report += `  "baseSalary": ${result.values.jobs.baseSalary}\n`;
  report += `  (周收入 $${result.values.jobs.baseSalary} ≈ 经济安全 +${(result.values.jobs.baseSalary * 0.05).toFixed(0)}分)\n\n`;
  
  report += `══════════════════════════════════════════════════════════\n`;
  report += `📈 维度分解\n`;
  report += `══════════════════════════════════════════════════════════\n\n`;
  
  for (const dim of result.breakdown) {
    report += `${dim.dimension} (目标: ${dim.requiredScore.toFixed(0)}分)\n`;
    for (const source of dim.sources) {
      report += `  └─ ${source.source}: +${source.contribution.toFixed(1)}分 `;
      report += `(配置值: ${source.jsonValue})\n`;
    }
    report += `\n`;
  }
  
  return report;
}
