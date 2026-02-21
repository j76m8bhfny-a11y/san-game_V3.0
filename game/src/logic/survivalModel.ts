/**
 * 存活概率计算模型 (Survival Probability Model)
 * 
 * 设计哲学: 确定性基线 + 随机扰动
 * - 基线概率: 基于当前状态的客观计算
 * - 随机扰动: 外部因素的不可预测性
 * 
 * 使用方法:
 * 1. 调整 MODEL_PARAMS 中的参数来平衡整体难度
 * 2. 通过 setTargetSurvivalRate() 设定期望存活率
 * 3. 系统自动计算参数建议值
 */

import { RegionID, PlayerClass, Disease } from '@/types/schema';
import type { StoreState } from '@/types/store';
import modelConfig from '@/assets/data/rules/survivalModel.json';

// ==========================================
// 1. 可配置参数 (数值设计师的主要调整区域)
// ==========================================

export interface SurvivalModelParams {
  // --- 资源权重 (决定各资源对存活的重要性) ---
  weights: {
    hp: number;           // HP 权重 (生命)
    insight: number;      // Insight 权重 (灵视)
    hunger: number;       // 饥饿度权重
    gold: number;         // 金钱权重
  };
  
  // --- 阈值参数 (定义危险/安全边界) ---
  thresholds: {
    hpCritical: number;   // HP 危险线 (%)
    hpSafe: number;       // HP 安全线 (%)
    insightCritical: number;  // Insight 危险线 (%)
    insightSafe: number;      // Insight 安全线 (%)
    hungerCritical: number; // 饥饿危险线 (%)
  };
  
  // --- 环境修正系数 ---
  regionModifiers: Record<RegionID, number>;
  classModifiers: Record<PlayerClass, number>;
  housingBonus: number;   // 有房产的保护系数
  homelessPenalty: number; // 无家可归惩罚
  
  // --- 负面状态惩罚 ---
  diseasePenalty: number;      // 每种疾病的惩罚
  acuteDiseasePenalty: number; // 急性病的额外惩罚
  addictionPenaltyRate: number; // 成瘾度惩罚系数
  
  // --- 随机扰动配置 ---
  variance: {
    baseRange: number;    // 基础浮动范围 (±)
    eventImpact: number;  // 事件影响权重
    diceRolls: number;    // 骰子次数 (大数定律)
  };
}

/**
 * 从 JSON 配置构建默认参数
 */
function buildDefaultParamsFromConfig(): SurvivalModelParams {
  const preset = (modelConfig.difficultyPresets as any)[modelConfig.currentPreset] || 
                 (modelConfig.difficultyPresets as any).normal;
  
  const regions: Record<string, RegionID> = {
    'SLUMS': RegionID.Slums,
    'RUST_BELT': RegionID.RustBelt,
    'SUBURBS': RegionID.Suburbs,
    'DOWNTOWN': RegionID.Downtown,
  };
  
  const classes: Record<string, PlayerClass> = {
    'HOMELESS': PlayerClass.Homeless,
    'WORKER': PlayerClass.Worker,
    'MIDDLE': PlayerClass.Middle,
    'CAPITALIST': PlayerClass.Capitalist,
  };
  
  // 从配置构建 regionModifiers
  const regionModifiers: Partial<Record<RegionID, number>> = {};
  Object.entries(modelConfig.regionModifiers).forEach(([key, value]: [string, any]) => {
    const region = regions[key];
    if (region) {
      regionModifiers[region] = value.modifier;
    }
  });
  
  // 从配置构建 classModifiers
  const classModifiers: Partial<Record<PlayerClass, number>> = {};
  Object.entries(modelConfig.classModifiers).forEach(([key, value]: [string, any]) => {
    const playerClass = classes[key];
    if (playerClass) {
      classModifiers[playerClass] = value.modifier;
    }
  });
  
  return {
    weights: preset.weights,
    thresholds: preset.thresholds,
    regionModifiers: regionModifiers as Record<RegionID, number>,
    classModifiers: classModifiers as Record<PlayerClass, number>,
    housingBonus: modelConfig.housing.bonus.value,
    homelessPenalty: modelConfig.housing.penalty.value,
    diseasePenalty: preset.diseasePenalty,
    acuteDiseasePenalty: preset.acuteDiseasePenalty,
    addictionPenaltyRate: 0.003, // 保持默认值
    variance: {
      baseRange: preset.variance.baseRange,
      eventImpact: preset.variance.eventImpact,
      diceRolls: 3, // 保持默认值
    },
  };
}

// 默认参数配置 - 从 JSON 文件加载
export const DEFAULT_MODEL_PARAMS: SurvivalModelParams = buildDefaultParamsFromConfig();

// 当前使用的参数（可被运行时覆盖）
let currentParams: SurvivalModelParams = { ...DEFAULT_MODEL_PARAMS };

// ==========================================
// 2. 确定性基线计算 (Deterministic Baseline)
// ==========================================

export interface BaselineInput {
  hp: number;
  maxHp: number;
  insight: number;
  maxInsight: number;
  hunger: number;
  maxHunger: number;
  gold: number;
  region: RegionID;
  playerClass: PlayerClass;
  hasHousing: boolean;
  activeDiseases: string[];
  addiction: number;
  allDiseases?: Disease[]; // 用于判断疾病类型
}

export interface BaselineResult {
  baseRate: number;        // 基础存活率 (0-1)
  resourceScore: number;   // 资源评分
  environmentMod: number;  // 环境修正
  statusPenalty: number;   // 状态惩罚
  breakdown: {             // 详细分解
    hp: number;
    insight: number;
    hunger: number;
    gold: number;
    region: number;
    class: number;
    housing: number;
    diseases: number;
    addiction: number;
  };
}

/**
 * 计算确定性基线存活概率
 * 
 * @param input 当前状态输入
 * @param params 模型参数
 * @returns 基线计算结果
 */
export function calculateBaseline(
  input: BaselineInput,
  params: SurvivalModelParams = currentParams
): BaselineResult {
  const { weights, thresholds } = params;
  
  // --- 1. 资源评分计算 (Sigmoid 函数平滑过渡) ---
  const hpRatio = input.hp / input.maxHp;
  const insightRatio = input.insight / input.maxInsight;
  const hungerRatio = 1 - (input.hunger / input.maxHunger); // 饥饿反转：越饱越高
  
  // 使用 Sigmoid 函数计算资源健康度
  // f(x) = 1 / (1 + e^(-k*(x - x0)))
  // 在危险阈值附近平滑过渡
  const sigmoid = (x: number, x0: number, k: number = 10) => 1 / (1 + Math.exp(-k * (x - x0)));
  
  const hpScore = sigmoid(hpRatio, thresholds.hpCritical);
  const insightScore = sigmoid(insightRatio, thresholds.insightCritical);
  const hungerScore = sigmoid(hungerRatio, thresholds.hungerCritical);
  
  // 金钱评分：对数缩放，避免后期金钱过多影响
  const goldScore = Math.min(1, Math.log10(input.gold + 10) / 4); // 10k金币约0.75分
  
  // --- 2. 环境修正 ---
  const regionMod = params.regionModifiers[input.region] || 1.0;
  const classMod = params.classModifiers[input.playerClass] || 1.0;
  const housingMod = input.hasHousing ? params.housingBonus : params.homelessPenalty;
  const environmentMod = regionMod * classMod * housingMod;
  
  // --- 3. 负面状态惩罚 ---
  let diseasePenalty = 0;
  
  for (const diseaseId of input.activeDiseases) {
    diseasePenalty += params.diseasePenalty;
    // 检查是否为急性病
    const diseaseDef = input.allDiseases?.find((d: Disease) => d.id === diseaseId);
    if (diseaseDef?.type === 'ACUTE' || diseaseId.includes('ACUTE')) {
      diseasePenalty += params.acuteDiseasePenalty;
    }
  }
  
  const addictionPenalty = input.addiction * params.addictionPenaltyRate;
  const statusPenalty = diseasePenalty + addictionPenalty;
  
  // --- 4. 加权汇总 ---
  const resourceScore = 
    weights.hp * hpScore +
    weights.insight * insightScore +
    weights.hunger * hungerScore +
    weights.gold * goldScore;
  
  // 最终基线 = 资源分 * 环境修正 - 状态惩罚
  let baseRate = resourceScore * environmentMod - statusPenalty;
  
  // 钳制到 [0, 1]
  baseRate = Math.max(0, Math.min(1, baseRate));
  
  return {
    baseRate,
    resourceScore,
    environmentMod,
    statusPenalty,
    breakdown: {
      hp: hpScore,
      insight: insightScore,
      hunger: hungerScore,
      gold: goldScore,
      region: regionMod,
      class: classMod,
      housing: housingMod,
      diseases: -diseasePenalty,
      addiction: -addictionPenalty,
    },
  };
}

// ==========================================
// 3. 随机扰动计算 (Stochastic Variance)
// ==========================================

export interface VarianceInput {
  recentEvents: number;      // 最近事件影响累积 (-1 ~ 1)
  playerChoices: number;     // 玩家决策修正 (-1 ~ 1)
  luckFactor?: number;       // 幸运值 (如果有)
}

export interface VarianceResult {
  variance: number;          // 总扰动值 (-1 ~ 1)
  diceRoll: number;          // 骰子结果
  eventMod: number;          // 事件修正
  finalRate: number;         // 扰动后的最终概率
}

/**
 * 计算随机扰动
 * 
 * @param baseline 基线概率
 * @param varianceInput 扰动输入
 * @param params 模型参数
 * @returns 扰动结果
 */
export function calculateVariance(
  baseline: number,
  varianceInput: VarianceInput,
  params: SurvivalModelParams = currentParams
): VarianceResult {
  const { variance } = params;
  
  // --- 1. 骰子投掷 (多次取平均，减少极端) ---
  let diceSum = 0;
  for (let i = 0; i < variance.diceRolls; i++) {
    // 生成 -1 ~ 1 的随机数
    diceSum += (Math.random() * 2 - 1);
  }
  const diceRoll = diceSum / variance.diceRolls; // 平均化
  
  // --- 2. 事件影响 ---
  const eventMod = varianceInput.recentEvents * variance.eventImpact;
  
  // --- 3. 玩家决策 ---
  const choiceMod = varianceInput.playerChoices * 0.05; // 决策影响较小
  
  // --- 4. 汇总扰动 ---
  let totalVariance = diceRoll * variance.baseRange + eventMod + choiceMod;
  
  // 扰动也做 Sigmoid 压缩，避免极端值
  totalVariance = Math.max(-0.3, Math.min(0.3, totalVariance)); // 最大 ±30%
  
  // --- 5. 应用扰动 ---
  // 扰动公式: 最终 = 基线 + 扰动 * (1 - 基线) * 基线
  // 这样在高/低概率时扰动影响变小，在中等概率时影响最大
  const dampening = baseline * (1 - baseline) * 4; // 在0.5时最大为1
  let finalRate = baseline + totalVariance * dampening;
  
  // 钳制
  finalRate = Math.max(0, Math.min(1, finalRate));
  
  return {
    variance: totalVariance,
    diceRoll,
    eventMod,
    finalRate,
  };
}

// ==========================================
// 4. 完整计算流程
// ==========================================

export interface SurvivalProbabilityResult {
  baseline: BaselineResult;
  variance: VarianceResult;
  finalProbability: number;
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
  recommendations: string[]; // 建议
}

/**
 * 计算完整存活概率
 * 
 * @param state 游戏状态
 * @param varianceInput 扰动输入
 * @param params 模型参数
 * @returns 完整结果
 */
export function calculateSurvivalProbability(
  state: StoreState,
  varianceInput: VarianceInput,
  params: SurvivalModelParams = currentParams
): SurvivalProbabilityResult {
  // 准备输入
  const baselineInput: BaselineInput = {
    hp: state.vitality.metrics.hp,
    maxHp: state.vitality.metrics.maxHp,
    insight: state.vitality.metrics.insight,
    maxSan: state.vitality.metrics.maxInsight,
    hunger: state.vitality.metrics.hunger,
    maxHunger: state.vitality.metrics.maxHunger,
    gold: state.vitality.metrics.gold,
    region: state.currentRegion,
    playerClass: state.vitality.identity.currentClass,
    hasHousing: state.activeHousing !== null,
    activeDiseases: state.vitality.activeDiseases,
    addiction: state.vitality.metrics.addiction,
    allDiseases: state.gameDataCache?.diseases || [],
  };
  
  // 计算基线
  const baseline = calculateBaseline(baselineInput, params);
  
  // 计算扰动
  const variance = calculateVariance(baseline.baseRate, varianceInput, params);
  
  // 风险等级
  let riskLevel: SurvivalProbabilityResult['riskLevel'];
  if (variance.finalRate >= 0.80) riskLevel = 'SAFE';
  else if (variance.finalRate >= 0.50) riskLevel = 'WARNING';
  else if (variance.finalRate >= 0.25) riskLevel = 'DANGER';
  else riskLevel = 'CRITICAL';
  
  // 生成建议
  const recommendations: string[] = [];
  if (baseline.breakdown.hp < 0.5) recommendations.push('优先恢复生命值');
  if (baseline.breakdown.insight < 0.4) recommendations.push('注意精神状态');
  if (baseline.breakdown.hunger < 0.5) recommendations.push('需要补充食物');
  if (baseline.breakdown.diseases < -0.1) recommendations.push('建议治疗疾病');
  if (!baselineInput.hasHousing) recommendations.push('寻找住所可提高生存率');
  
  return {
    baseline,
    variance,
    finalProbability: variance.finalRate,
    riskLevel,
    recommendations,
  };
}

// ==========================================
// 5. 参数调优工具
// ==========================================

/**
 * 设定目标存活率，自动调整参数
 * 
 * 这个函数可以帮助你快速找到合适的参数配置
 * 
 * @param targetRate 目标存活率 (0-1)
 * @param sampleState 样本状态
 * @returns 建议参数
 */
export function tuneParamsForTargetRate(
  targetRate: number,
  sampleState: StoreState
): Partial<SurvivalModelParams> {
  // 这里可以实现一个简单的梯度下降或网格搜索
  // 来找到能达到目标存活率的参数
  
  const testParams = { ...currentParams };
  const varianceInput: VarianceInput = { recentEvents: 0, playerChoices: 0 };
  
  // 二分查找合适的权重
  let low = 0.1, high = 2.0;
  for (let i = 0; i < 10; i++) {
    const mid = (low + high) / 2;
    testParams.weights = { ...currentParams.weights };
    // 统一缩放所有权重
    (Object.keys(testParams.weights) as Array<keyof typeof testParams.weights>).forEach(k => {
      testParams.weights[k] *= mid;
    });
    
    const result = calculateSurvivalProbability(sampleState, varianceInput, testParams);
    
    if (result.finalProbability < targetRate) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return {
    weights: testParams.weights,
  };
}

/**
 * 更新模型参数
 */
export function setModelParams(params: Partial<SurvivalModelParams>) {
  currentParams = { ...currentParams, ...params };
}

/**
 * 获取当前模型参数
 */
export function getModelParams(): SurvivalModelParams {
  return { ...currentParams };
}

/**
 * 重置为默认参数
 */
export function resetModelParams() {
  currentParams = { ...DEFAULT_MODEL_PARAMS };
}

// ==========================================
// 6. 快捷使用函数
// ==========================================

/**
 * 快速检查存活概率（不带扰动）
 * 适用于UI显示当前状态
 */
export function quickSurvivalCheck(state: StoreState): number {
  const baselineInput: BaselineInput = {
    hp: state.vitality.metrics.hp,
    maxHp: state.vitality.metrics.maxHp,
    insight: state.vitality.metrics.insight,
    maxSan: state.vitality.metrics.maxInsight,
    hunger: state.vitality.metrics.hunger,
    maxHunger: state.vitality.metrics.maxHunger,
    gold: state.vitality.metrics.gold,
    region: state.currentRegion,
    playerClass: state.vitality.identity.currentClass,
    hasHousing: state.activeHousing !== null,
    activeDiseases: state.vitality.activeDiseases,
    addiction: state.vitality.metrics.addiction,
  };
  
  return calculateBaseline(baselineInput).baseRate;
}

/**
 * 判定是否存活（带随机判定）
 * 适用于回合结束时的死亡判定
 */
export function rollForSurvival(
  state: StoreState,
  varianceInput: VarianceInput
): { survived: boolean; roll: number; threshold: number } {
  const result = calculateSurvivalProbability(state, varianceInput);
  const roll = Math.random();
  const survived = roll <= result.finalProbability;
  
  return {
    survived,
    roll,
    threshold: result.finalProbability,
  };
}
