/**
 * 存活概率模型使用示例
 * 
 * 这个文件展示了如何在游戏中使用 survivalModel
 */

import {
  calculateSurvivalProbability,
  calculateBaseline,
  calculateVariance,
  rollForSurvival,
  quickSurvivalCheck,
  setModelParams,
  tuneParamsForTargetRate,
  SurvivalModelParams,
  BaselineInput,
  VarianceInput,
} from './survivalModel';
import { GameState, RegionID, PlayerClass } from '@/types/schema';

// ==========================================
// 示例 1: 基础使用
// ==========================================

export function example1_BasicUsage(state: GameState) {
  // 最简单的使用方式 - 计算当前存活概率
  const varianceInput: VarianceInput = {
    recentEvents: 0,    // 最近没有特殊事件
    playerChoices: 0,   // 玩家做了一般选择
  };
  
  const result = calculateSurvivalProbability(state, varianceInput);
  
  console.log('=== 存活概率报告 ===');
  console.log(`基线概率: ${(result.baseline.baseRate * 100).toFixed(1)}%`);
  console.log(`随机扰动: ${(result.variance.variance * 100).toFixed(1)}%`);
  console.log(`最终概率: ${(result.finalProbability * 100).toFixed(1)}%`);
  console.log(`风险等级: ${result.riskLevel}`);
  console.log(`建议: ${result.recommendations.join(', ')}`);
  
  return result;
}

// ==========================================
// 示例 2: 单独使用确定性基线
// ==========================================

export function example2_DeterministicOnly() {
  // 创建一个测试状态
  const baselineInput: BaselineInput = {
    hp: 60,
    maxHp: 100,
    san: 40,
    maxSan: 100,
    hunger: 30,
    maxHunger: 100,
    gold: 500,
    region: RegionID.Slums,
    playerClass: PlayerClass.Worker,
    hasHousing: false,
    activeDiseases: ['FLU'],
    addiction: 10,
  };
  
  const baseline = calculateBaseline(baselineInput);
  
  console.log('=== 确定性基线分析 ===');
  console.log(`基础存活率: ${(baseline.baseRate * 100).toFixed(1)}%`);
  console.log('各项评分:');
  console.log(`  HP: ${(baseline.breakdown.hp * 100).toFixed(0)}%`);
  console.log(`  INS: ${(baseline.breakdown.insight * 100).toFixed(0)}%`);
  console.log(`  饥饿: ${(baseline.breakdown.hunger * 100).toFixed(0)}%`);
  console.log(`  金钱: ${(baseline.breakdown.gold * 100).toFixed(0)}%`);
  console.log('环境修正:', baseline.breakdown);
  
  return baseline;
}

// ==========================================
// 示例 3: 单独使用随机扰动
// ==========================================

export function example3_VarianceOnly() {
  const baselineRate = 0.75; // 假设基线是 75%
  
  // 场景 A: 运气很好，最近都是好事
  const goodVariance: VarianceInput = {
    recentEvents: 0.8,    // 最近很多好事件
    playerChoices: 0.5,   // 玩家做了明智选择
  };
  const resultA = calculateVariance(baselineRate, goodVariance);
  
  // 场景 B: 运气很差，诸事不顺
  const badVariance: VarianceInput = {
    recentEvents: -0.8,   // 最近很多坏事
    playerChoices: -0.3,  // 玩家做了糟糕选择
  };
  const resultB = calculateVariance(baselineRate, badVariance);
  
  console.log('=== 随机扰动对比 ===');
  console.log(`基线概率: ${(baselineRate * 100).toFixed(0)}%`);
  console.log(`好运场景: ${(resultA.finalRate * 100).toFixed(0)}% (扰动: +${(resultA.variance * 100).toFixed(0)}%)`);
  console.log(`厄运场景: ${(resultB.finalRate * 100).toFixed(0)}% (扰动: ${(resultB.variance * 100).toFixed(0)}%)`);
}

// ==========================================
// 示例 4: 调整参数进行数值平衡
// ==========================================

export function example4_TuningParams() {
  // 自定义参数 - 让游戏更难
  const hardParams: Partial<SurvivalModelParams> = {
    weights: {
      hp: 0.50,      // HP更重要
      san: 0.30,
      hunger: 0.15,
      gold: 0.05,    // 金钱作用降低
    },
    thresholds: {
      hpCritical: 0.35,    // 更早进入危险
      hpSafe: 0.80,
      sanCritical: 0.30,
      sanSafe: 0.70,
      hungerCritical: 0.30,
    },
    diseasePenalty: 0.08,     // 疾病惩罚更重
    acuteDiseasePenalty: 0.25,
    variance: {
      baseRange: 0.15,      // 更大的随机性
      eventImpact: 0.20,
      diceRolls: 2,         // 更少的骰子 = 更不稳定
    },
  };
  
  // 应用参数
  setModelParams(hardParams);
  
  console.log('=== 参数已调整为困难模式 ===');
}

// ==========================================
// 示例 5: 回合结束时的死亡判定
// ==========================================

export function example5_DeathCheck(state: GameState) {
  // 计算最近事件的净影响
  const recentEvents = state.history.reduce((sum, event) => {
    if (event.includes('好运')) return sum + 0.3;
    if (event.includes('厄运')) return sum - 0.3;
    return sum;
  }, 0);
  
  const varianceInput: VarianceInput = {
    recentEvents,
    playerChoices: 0,
  };
  
  const result = rollForSurvival(state, varianceInput);
  
  console.log('=== 死亡判定 ===');
  console.log(`存活阈值: ${(result.threshold * 100).toFixed(1)}%`);
  console.log(`骰子点数: ${(result.roll * 100).toFixed(1)}%`);
  console.log(`结果: ${result.survived ? '存活' : '死亡'}`);
  
  if (!result.survived) {
    console.log('💀 你没能挺过这个回合...');
    // 触发死亡结局
  }
  
  return result;
}

// ==========================================
// 示例 6: UI 显示当前状态
// ==========================================

export function example6_UIIntegration(state: GameState) {
  const survivalRate = quickSurvivalCheck(state);
  
  // 根据概率返回不同的UI提示
  if (survivalRate >= 0.90) {
    return { color: '#4CAF50', text: '状态良好', icon: '✅' };
  } else if (survivalRate >= 0.70) {
    return { color: '#8BC34A', text: '基本安全', icon: '✓' };
  } else if (survivalRate >= 0.50) {
    return { color: '#FFC107', text: '需要注意', icon: '⚠️' };
  } else if (survivalRate >= 0.30) {
    return { color: '#FF9800', text: '危险区域', icon: '🔥' };
  } else {
    return { color: '#F44336', text: '生命垂危', icon: '💀' };
  }
}

// ==========================================
// 示例 7: 参数自动调优
// ==========================================

export function example7_AutoTuning(state: GameState) {
  // 假设你希望一个中等难度状态的存活率是 65%
  const targetRate = 0.65;
  
  const suggestedParams = tuneParamsForTargetRate(targetRate, state);
  
  console.log('=== 参数自动调优建议 ===');
  console.log(`目标存活率: ${(targetRate * 100).toFixed(0)}%`);
  console.log('建议权重调整:', suggestedParams.weights);
  
  // 应用建议参数
  if (suggestedParams.weights) {
    setModelParams({ weights: suggestedParams.weights });
  }
}

// ==========================================
// 示例 8: 完整回合流程
// ==========================================

export function example8_FullTurnFlow(state: GameState) {
  console.log('\n========== 回合开始 ==========');
  
  // 1. 回合开始时显示当前存活概率
  const startRate = quickSurvivalCheck(state);
  console.log(`回合开始存活率: ${(startRate * 100).toFixed(1)}%`);
  
  // 2. 玩家进行各种操作...
  // ...
  
  // 3. 回合结束时进行完整计算
  const varianceInput: VarianceInput = {
    recentEvents: 0,  // 本回合事件影响
    playerChoices: 0, // 玩家选择影响
  };
  
  const result = calculateSurvivalProbability(state, varianceInput);
  
  console.log(`回合结束存活率: ${(result.finalProbability * 100).toFixed(1)}%`);
  console.log(`风险等级: ${result.riskLevel}`);
  
  if (result.recommendations.length > 0) {
    console.log(`建议: ${result.recommendations.join(', ')}`);
  }
  
  // 4. 如果处于危险状态，给玩家警告
  if (result.riskLevel === 'DANGER' || result.riskLevel === 'CRITICAL') {
    console.log('⚠️ 警告：你的生存状况堪忧！');
  }
  
  // 5. 死亡判定 (如果需要)
  const deathRoll = rollForSurvival(state, varianceInput);
  if (!deathRoll.survived) {
    console.log('💀 你没能挺过这个夜晚...');
  }
  
  console.log('========== 回合结束 ==========\n');
}
