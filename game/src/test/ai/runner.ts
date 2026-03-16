/**
 * 测试运行器
 * 批量执行测试场景并生成报告
 */

import type { 
  TestScenario, 
  BatchTestResult, 
  GameResult, 
  RunnerOptions 
} from './types';
import { createStrategy } from './strategies';
import { runGameSimulation } from './simulator';

// ==========================================
// 批量测试运行器
// ==========================================

/**
 * 运行单个场景的批量测试
 */
export async function runScenario(
  scenario: TestScenario,
  options: RunnerOptions = {}
): Promise<BatchTestResult> {
  const {
    runBoundaryCheck = true,
    verbose = false,
    progressInterval = 10,
    continueOnError = true
  } = options;
  
  // 1. 前置边界检查
  if (runBoundaryCheck) {
    console.log('🧪 运行边界检查...');
    const { BoundaryChecker } = await import('@/test/boundary');
    const boundaryResult = await BoundaryChecker.runAll();
    
    if (boundaryResult.critical > 0) {
      return {
        scenario,
        totalRuns: 0,
        completedRuns: 0,
        survivalStats: { avgTurns: 0, maxTurns: 0, minTurns: 0, medianTurns: 0 },
        outcomeDistribution: {},
        deathCauses: {},
        errors: [{
          message: `边界检查失败: ${boundaryResult.critical}个严重问题`,
          count: boundaryResult.critical
        }],
        passed: false,
        failureReasons: ['边界检查未通过'],
        runs: []
      };
    }
  }
  
  // 2. 执行before钩子
  await scenario.hooks?.beforeRun?.();
  
  // 3. 创建AI策略
  const strategy = createStrategy(scenario.strategy);
  console.log(`🤖 开始运行场景: ${scenario.name} (${scenario.runs}局)`);
  console.log(`   策略: ${strategy.name}`);
  console.log(`   最大回合: ${scenario.maxTurns}`);
  
  // 4. 批量运行
  const runs: GameResult[] = [];
  const errors: Map<string, { count: number; sample: GameResult }> = new Map();
  
  for (let i = 0; i < scenario.runs; i++) {
    try {
      if (verbose && (i + 1) % progressInterval === 0) {
        console.log(`   进度: ${i + 1}/${scenario.runs}`);
      }
      
      const result = await runGameSimulation(strategy, {
        maxTurns: scenario.maxTurns
      });
      
      runs.push(result);
      
      // 统计错误
      if (!result.success && result.error) {
        const existing = errors.get(result.error);
        if (existing) {
          existing.count++;
        } else {
          errors.set(result.error, { 
            count: 1, 
            sample: result 
          });
        }
      }
      
      // 执行after钩子
      await scenario.hooks?.afterRun?.(result);
      
    } catch (error) {
      console.error(`   第${i + 1}局异常:`, error);
      
      runs.push({
        success: false,
        outcome: 'error',
        turns: 0,
        decisions: [],
        finalState: {} as any,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (!continueOnError) {
        break;
      }
    }
  }
  
  // 5. 分析结果
  const result = analyzeResults(scenario, runs, errors);
  
  // 6. 打印摘要
  printSummary(result);
  
  return result;
}

/** 分析批量结果 */
function analyzeResults(
  scenario: TestScenario,
  runs: GameResult[],
  errorMap: Map<string, { count: number; sample: GameResult }>
): BatchTestResult {
  const completedRuns = runs.filter(r => r.success).length;
  const turns = runs.map(r => r.turns).sort((a, b) => a - b);
  
  // 结局分布
  const outcomeDistribution: Record<string, number> = {};
  runs.forEach(r => {
    outcomeDistribution[r.outcome] = (outcomeDistribution[r.outcome] || 0) + 1;
  });
  
  // 死因统计
  const deathCauses: Record<string, number> = {};
  runs.filter(r => r.outcome === 'dead').forEach(r => {
    const cause = r.deathAnalysis?.cause || '未知';
    deathCauses[cause] = (deathCauses[cause] || 0) + 1;
  });
  
  // 验证成功标准
  const failureReasons: string[] = [];
  
  if (scenario.successCriteria.minSurvivalTurns) {
    const avgTurns = turns.reduce((a, b) => a + b, 0) / turns.length || 0;
    if (avgTurns < scenario.successCriteria.minSurvivalTurns) {
      failureReasons.push(
        `平均存活回合(${avgTurns.toFixed(1)})低于要求(${scenario.successCriteria.minSurvivalTurns})`
      );
    }
  }
  
  if (scenario.successCriteria.maxCrashRate !== undefined) {
    const crashRate = (runs.length - completedRuns) / runs.length;
    if (crashRate > scenario.successCriteria.maxCrashRate) {
      failureReasons.push(
        `崩溃率(${(crashRate * 100).toFixed(1)}%)高于要求(${(scenario.successCriteria.maxCrashRate * 100).toFixed(1)}%)`
      );
    }
  }
  
  if (scenario.successCriteria.custom) {
    if (!scenario.successCriteria.custom(runs)) {
      failureReasons.push('自定义验证失败');
    }
  }
  
  return {
    scenario,
    totalRuns: runs.length,
    completedRuns,
    survivalStats: {
      avgTurns: turns.reduce((a, b) => a + b, 0) / turns.length || 0,
      maxTurns: turns[turns.length - 1] || 0,
      minTurns: turns[0] || 0,
      medianTurns: turns[Math.floor(turns.length / 2)] || 0
    },
    outcomeDistribution,
    deathCauses,
    errors: Array.from(errorMap.entries()).map(([message, data]) => ({
      message,
      count: data.count,
      sampleStack: data.sample.stack
    })),
    passed: failureReasons.length === 0,
    failureReasons,
    runs
  };
}

/** 打印结果摘要 */
function printSummary(result: BatchTestResult): void {
  console.log('\n' + '='.repeat(50));
  console.log(`📊 场景结果: ${result.scenario.name}`);
  console.log('='.repeat(50));
  console.log(`总运行: ${result.totalRuns} | 完成: ${result.completedRuns} | 成功: ${result.passed ? '✅' : '❌'}`);
  console.log(`平均存活: ${result.survivalStats.avgTurns.toFixed(1)}回合`);
  console.log(`存活范围: ${result.survivalStats.minTurns}-${result.survivalStats.maxTurns}回合`);
  
  console.log('\n结局分布:');
  Object.entries(result.outcomeDistribution).forEach(([outcome, count]) => {
    const percent = ((count / result.totalRuns) * 100).toFixed(1);
    console.log(`  ${outcome}: ${count} (${percent}%)`);
  });
  
  if (Object.keys(result.deathCauses).length > 0) {
    console.log('\n死因统计:');
    Object.entries(result.deathCauses).forEach(([cause, count]) => {
      console.log(`  ${cause}: ${count}`);
    });
  }
  
  if (result.errors.length > 0) {
    console.log('\n错误统计:');
    result.errors.forEach(e => {
      console.log(`  [${e.count}次] ${e.message.substring(0, 100)}`);
    });
  }
  
  if (!result.passed) {
    console.log('\n❌ 失败原因:');
    result.failureReasons.forEach(r => console.log(`  - ${r}`));
  }
  
  console.log('='.repeat(50) + '\n');
}

// ==========================================
// 全量测试套件
// ==========================================

/**
 * 运行所有场景
 */
export async function runAllScenarios(
  options?: RunnerOptions
): Promise<Map<string, BatchTestResult>> {
  const { ALL_SCENARIOS } = await import('./scenarios');
  const results = new Map<string, BatchTestResult>();
  
  console.log('🚀 开始运行全部AI测试场景\n');
  
  for (const scenario of ALL_SCENARIOS) {
    const result = await runScenario(scenario, options);
    results.set(scenario.id, result);
    
    // 场景间短暂停顿，避免资源占用
    await new Promise(r => setTimeout(r, 100));
  }
  
  // 打印总览
  console.log('\n' + '='.repeat(60));
  console.log('📋 全量测试结果总览');
  console.log('='.repeat(60));
  
  let passed = 0, failed = 0;
  results.forEach((result, id) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} [${id}] ${result.scenario.name}`);
    if (result.passed) passed++;
    else failed++;
  });
  
  console.log(`\n总计: ${passed + failed} | 通过: ${passed} | 失败: ${failed}`);
  console.log('='.repeat(60));
  
  return results;
}

// ==========================================
// 便捷函数
// ==========================================

/**
 * 快速测试单个策略
 */
export async function quickTest(
  strategyType: string,
  runs: number = 10,
  maxTurns: number = 30
): Promise<BatchTestResult> {
  const scenario: TestScenario = {
    id: 'quick-test',
    name: '快速测试',
    description: '快速验证策略',
    strategy: strategyType as any,
    runs,
    maxTurns,
    successCriteria: {
      maxCrashRate: 0
    }
  };
  
  return runScenario(scenario, {
    verbose: false,
    runBoundaryCheck: false
  });
}
