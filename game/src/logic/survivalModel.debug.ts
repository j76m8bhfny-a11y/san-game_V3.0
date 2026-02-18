/**
 * 存活概率模型调试工具
 * 
 * 用于数值平衡和参数调整的辅助工具
 */

import {
  calculateBaseline,
  calculateVariance,
  SurvivalModelParams,
  BaselineInput,
  VarianceInput,
  DEFAULT_MODEL_PARAMS,
} from './survivalModel';
import { RegionID, PlayerClass } from '@/types/schema';

// ==========================================
// 1. 参数效果模拟器
// ==========================================

export interface ScenarioResult {
  name: string;
  input: BaselineInput;
  baselineRate: number;
  withGoodLuck: number;
  withBadLuck: number;
  averageRate: number;
}

/**
 * 创建标准测试场景
 */
export function createTestScenarios(): BaselineInput[] {
  return [
    {
      name: '新手(健康)',
      hp: 80, maxHp: 100,
      san: 70, maxSan: 100,
      hunger: 20, maxHunger: 100,
      gold: 200,
      region: RegionID.Slums,
      playerClass: PlayerClass.Homeless,
      hasHousing: false,
      activeDiseases: [],
      addiction: 0,
    },
    {
      name: '中期(受伤)',
      hp: 45, maxHp: 100,
      san: 60, maxSan: 100,
      hunger: 50, maxHunger: 100,
      gold: 800,
      region: RegionID.RustBelt,
      playerClass: PlayerClass.Worker,
      hasHousing: true,
      activeDiseases: ['FLU'],
      addiction: 5,
    },
    {
      name: '危险(重病)',
      hp: 25, maxHp: 100,
      san: 30, maxSan: 100,
      hunger: 70, maxHunger: 100,
      gold: 100,
      region: RegionID.Slums,
      playerClass: PlayerClass.Homeless,
      hasHousing: false,
      activeDiseases: ['FLU', 'ACUTE_INFECTION'],
      addiction: 15,
    },
    {
      name: '富裕(安全)',
      hp: 90, maxHp: 100,
      san: 80, maxSan: 100,
      hunger: 10, maxHunger: 100,
      gold: 5000,
      region: RegionID.Downtown,
      playerClass: PlayerClass.Capitalist,
      hasHousing: true,
      activeDiseases: [],
      addiction: 0,
    },
  ] as any[];
}

/**
 * 运行完整模拟
 */
export function runSimulation(
  params: SurvivalModelParams = DEFAULT_MODEL_PARAMS,
  iterations: number = 1000
): ScenarioResult[] {
  const scenarios = createTestScenarios();
  const results: ScenarioResult[] = [];
  
  for (const scenario of scenarios) {
    const baseline = calculateBaseline(scenario, params);
    
    // 模拟多次随机扰动
    let goodLuckSum = 0;
    let badLuckSum = 0;
    let totalSum = 0;
    
    for (let i = 0; i < iterations; i++) {
      // 好运场景
      const goodVar = calculateVariance(baseline.baseRate, {
        recentEvents: 0.8,
        playerChoices: 0.5,
      }, params);
      goodLuckSum += goodVar.finalRate;
      
      // 厄运场景
      const badVar = calculateVariance(baseline.baseRate, {
        recentEvents: -0.8,
        playerChoices: -0.3,
      }, params);
      badLuckSum += badVar.finalRate;
      
      // 普通场景
      const normalVar = calculateVariance(baseline.baseRate, {
        recentEvents: 0,
        playerChoices: 0,
      }, params);
      totalSum += normalVar.finalRate;
    }
    
    results.push({
      name: (scenario as any).name,
      input: scenario,
      baselineRate: baseline.baseRate,
      withGoodLuck: goodLuckSum / iterations,
      withBadLuck: badLuckSum / iterations,
      averageRate: totalSum / iterations,
    });
  }
  
  return results;
}

// ==========================================
// 2. 参数敏感性分析
// ==========================================

export interface SensitivityResult {
  parameter: string;
  baseValue: number;
  minRate: number;
  maxRate: number;
  sensitivity: number;
}

/**
 * 分析各参数对存活率的影响敏感度
 */
export function analyzeSensitivity(
  testState: BaselineInput,
  params: SurvivalModelParams = DEFAULT_MODEL_PARAMS
): SensitivityResult[] {
  const baseline = calculateBaseline(testState, params);
  const baseRate = baseline.baseRate;
  
  const results: SensitivityResult[] = [];
  
  // 测试各权重参数
  const weightParams = ['hp', 'san', 'hunger', 'gold'] as const;
  
  for (const param of weightParams) {
    // -50%
    const lowParams = { ...params };
    lowParams.weights = { ...params.weights };
    lowParams.weights[param] *= 0.5;
    const lowRate = calculateBaseline(testState, lowParams).baseRate;
    
    // +50%
    const highParams = { ...params };
    highParams.weights = { ...params.weights };
    highParams.weights[param] *= 1.5;
    const highRate = calculateBaseline(testState, highParams).baseRate;
    
    results.push({
      parameter: `weight.${param}`,
      baseValue: params.weights[param],
      minRate: lowRate,
      maxRate: highRate,
      sensitivity: Math.abs(highRate - lowRate) / baseRate,
    });
  }
  
  // 测试阈值参数
  const thresholdParams = ['hpCritical', 'sanCritical', 'hungerCritical'] as const;
  
  for (const param of thresholdParams) {
    const lowParams = { ...params };
    lowParams.thresholds = { ...params.thresholds };
    (lowParams.thresholds as any)[param] *= 0.8;
    const lowRate = calculateBaseline(testState, lowParams).baseRate;
    
    const highParams = { ...params };
    highParams.thresholds = { ...params.thresholds };
    (highParams.thresholds as any)[param] *= 1.2;
    const highRate = calculateBaseline(testState, highParams).baseRate;
    
    results.push({
      parameter: `threshold.${param}`,
      baseValue: (params.thresholds as any)[param],
      minRate: lowRate,
      maxRate: highRate,
      sensitivity: Math.abs(highRate - lowRate) / baseRate,
    });
  }
  
  // 按敏感度排序
  results.sort((a, b) => b.sensitivity - a.sensitivity);
  
  return results;
}

// ==========================================
// 3. 调试输出工具
// ==========================================

export function printDebugReport(
  results: ScenarioResult[],
  params?: SurvivalModelParams
) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           存活概率模型调试报告                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  if (params) {
    console.log('📊 当前参数配置:');
    console.log(`   难度权重: HP=${params.weights.hp.toFixed(2)}, SAN=${params.weights.san.toFixed(2)}, Hunger=${params.weights.hunger.toFixed(2)}, Gold=${params.weights.gold.toFixed(2)}`);
    console.log(`   疾病惩罚: 普通-${(params.diseasePenalty * 100).toFixed(0)}%, 急性-${(params.acuteDiseasePenalty * 100).toFixed(0)}%`);
    console.log(`   随机浮动: ±${(params.variance.baseRange * 100).toFixed(0)}%`);
    console.log('');
  }
  
  console.log('🎮 场景模拟结果:');
  console.log('───────────────────────────────────────────────────────────');
  console.log('场景名称        基线    好运    厄运    平均    波动范围');
  console.log('───────────────────────────────────────────────────────────');
  
  for (const r of results) {
    const name = r.name.padEnd(12);
    const base = `${(r.baselineRate * 100).toFixed(1)}%`.padStart(6);
    const good = `${(r.withGoodLuck * 100).toFixed(1)}%`.padStart(6);
    const bad = `${(r.withBadLuck * 100).toFixed(1)}%`.padStart(6);
    const avg = `${(r.averageRate * 100).toFixed(1)}%`.padStart(6);
    const range = `${((r.withGoodLuck - r.withBadLuck) * 100).toFixed(1)}%`.padStart(8);
    
    console.log(`${name}  ${base}  ${good}  ${bad}  ${avg}  ${range}`);
  }
  
  console.log('───────────────────────────────────────────────────────────\n');
  
  // 难度评估
  const avgRate = results.reduce((sum, r) => sum + r.averageRate, 0) / results.length;
  let difficulty = '';
  if (avgRate > 0.80) difficulty = '🟢 简单 (Easy)';
  else if (avgRate > 0.65) difficulty = '🟡 适中 (Normal)';
  else if (avgRate > 0.50) difficulty = '🟠 困难 (Hard)';
  else difficulty = '🔴 极难 (Nightmare)';
  
  console.log(`📈 综合难度评估: ${difficulty}`);
  console.log(`   平均存活率: ${(avgRate * 100).toFixed(1)}%`);
  console.log('\n');
}

export function printSensitivityReport(results: SensitivityResult[]) {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           参数敏感性分析                                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log('参数名                    当前值   最小率   最大率   敏感度');
  console.log('───────────────────────────────────────────────────────────');
  
  for (const r of results) {
    const name = r.parameter.padEnd(24);
    const base = `${r.baseValue.toFixed(2)}`.padStart(8);
    const min = `${(r.minRate * 100).toFixed(1)}%`.padStart(8);
    const max = `${(r.maxRate * 100).toFixed(1)}%`.padStart(8);
    const sens = `${(r.sensitivity * 100).toFixed(1)}%`.padStart(8);
    
    const bar = '█'.repeat(Math.min(10, Math.floor(r.sensitivity * 20)));
    
    console.log(`${name} ${base} ${min} ${max} ${sens} ${bar}`);
  }
  
  console.log('───────────────────────────────────────────────────────────\n');
  console.log('💡 敏感度越高，调整该参数对游戏难度影响越大\n');
}

// ==========================================
// 4. 一键调试函数
// ==========================================

export function runFullDebug() {
  console.log('\n🏃 开始完整调试流程...\n');
  
  // 1. 运行模拟
  const simulationResults = runSimulation(DEFAULT_MODEL_PARAMS, 500);
  printDebugReport(simulationResults, DEFAULT_MODEL_PARAMS);
  
  // 2. 敏感性分析
  const testState = createTestScenarios()[1]; // 使用"中期"场景
  const sensitivityResults = analyzeSensitivity(testState);
  printSensitivityReport(sensitivityResults);
  
  // 3. 给出建议
  console.log('💡 数值平衡建议:');
  
  const avgRate = simulationResults.reduce((sum, r) => sum + r.averageRate, 0) / simulationResults.length;
  if (avgRate > 0.85) {
    console.log('   • 当前难度偏低，建议增加疾病惩罚或降低资源权重');
  } else if (avgRate < 0.50) {
    console.log('   • 当前难度偏高，建议降低疾病惩罚或提高资源权重');
  } else {
    console.log('   • 当前难度适中，可根据目标玩家群体微调');
  }
  
  const mostSensitive = sensitivityResults[0];
  console.log(`   • 最敏感参数是 ${mostSensitive.parameter}，调整时需特别小心`);
  
  const dangerScenario = simulationResults.find(r => r.name.includes('危险'));
  if (dangerScenario && dangerScenario.averageRate > 0.40) {
    console.log('   • 危险状态的存活率偏高，建议增加急性病惩罚');
  }
  
  console.log('\n');
}

// 如果直接运行此文件
if (typeof window === 'undefined' && require.main === module) {
  runFullDebug();
}
