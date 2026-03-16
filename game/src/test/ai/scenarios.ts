/**
 * 测试场景定义
 * 预定义核心测试场景配置
 */

import type { TestScenario, BatchTestResult, CoverageReport } from './types';

// ==========================================
// 核心测试场景
// ==========================================

/** SC-001: 百轮生存挑战 */
export const SurvivalChallengeScenario: TestScenario = {
  id: 'SC-001',
  name: '百轮生存挑战',
  description: '验证生存优先策略能长期存活',
  strategy: 'survival',
  runs: 100,
  maxTurns: 100,
  successCriteria: {
    minSurvivalTurns: 20,
    maxCrashRate: 0,
    custom: (results) => {
      const survivalRate = results.filter(r => 
        r.outcome === 'alive' || r.outcome === 'ending'
      ).length / results.length;
      return survivalRate >= 0.8;  // 80%存活率
    }
  }
};

/** SC-002: 极限贫困开局 */
export const ExtremePovertyScenario: TestScenario = {
  id: 'SC-002',
  name: '极限贫困开局',
  description: '0资金开局，验证有翻身路径',
  strategy: 'survival',
  runs: 50,
  maxTurns: 50,
  successCriteria: {
    minSurvivalTurns: 5,
    maxCrashRate: 0
  }
};

/** SC-003: D选项探索 */
export const DOptionExplorationScenario: TestScenario = {
  id: 'SC-003',
  name: 'D选项探索',
  description: '探索型玩家主动触发D选项',
  strategy: 'explorer',
  runs: 50,
  maxTurns: 52,
  initialState: {
    vitality: {
      metrics: { insight: 70 }  // 初始高灵视
    } as any
  },
  successCriteria: {
    minSurvivalTurns: 10,
    custom: (results) => {
      // 至少触发5次D选项
      const totalDOptions = results.reduce((sum, r) => 
        sum + r.decisions.filter(d => d.choice === 'D').length, 0
      );
      return totalDOptions >= 5;
    }
  }
};

/** SC-004: 债务地狱 */
export const DebtHellScenario: TestScenario = {
  id: 'SC-004',
  name: '债务地狱',
  description: '故意欠高额债务，验证翻身机制',
  strategy: 'chaos',
  runs: 30,
  maxTurns: 100,
  successCriteria: {
    maxCrashRate: 0,
    custom: (results) => {
      // 所有玩家最终都能还清或正常死亡（而非卡死）
      return results.every(r => r.outcome !== 'error');
    }
  }
};

/** SC-005: 快速死亡测试 */
export const QuickDeathScenario: TestScenario = {
  id: 'SC-005',
  name: '快速死亡测试',
  description: '验证各种死因都能正确触发',
  strategy: 'chaos',
  runs: 50,
  maxTurns: 20,
  successCriteria: {
    custom: (results) => {
      // 收集死因分布
      const deathCauses = new Set(
        results
          .filter(r => r.outcome === 'dead')
          .map(r => r.deathAnalysis?.cause)
          .filter(Boolean)
      );
      console.log('发现的死因:', Array.from(deathCauses));
      return deathCauses.size >= 2;  // 至少发现2种不同死因
    }
  }
};

/** SC-006: 新手引导流程 */
export const NewbieTutorialScenario: TestScenario = {
  id: 'SC-006',
  name: '新手引导流程',
  description: '模拟新手误操作，验证引导不阻塞',
  strategy: 'newbie',
  runs: 20,
  maxTurns: 30,
  successCriteria: {
    minSurvivalTurns: 3,
    maxCrashRate: 0
  }
};

/** SC-007: 随机压力测试 */
export const RandomStressScenario: TestScenario = {
  id: 'SC-007',
  name: '随机压力测试',
  description: '运行大量随机游戏以验证稳定性',
  strategy: 'random',
  runs: 200,
  maxTurns: 52,
  successCriteria: {
    maxCrashRate: 0.01,  // 允许1%崩溃率
    minSurvivalTurns: 1
  }
};

// ==========================================
// 场景注册表
// ==========================================

export const ALL_SCENARIOS: TestScenario[] = [
  SurvivalChallengeScenario,
  ExtremePovertyScenario,
  DOptionExplorationScenario,
  DebtHellScenario,
  QuickDeathScenario,
  NewbieTutorialScenario,
  RandomStressScenario
];

export function getScenarioById(id: string): TestScenario | undefined {
  return ALL_SCENARIOS.find(s => s.id === id);
}

// ==========================================
// 覆盖率分析
// ==========================================

export function analyzeCoverage(results: BatchTestResult): CoverageReport {
  const allDecisions = results.runs.flatMap(r => r.decisions);
  const triggeredEvents = new Set(allDecisions.map(d => d.eventId).filter(Boolean));
  const achievedEndings = new Set(
    results.runs.map(r => r.finalState.ending?.id).filter(Boolean)
  );
  const unlockedArchives = new Set(
    results.runs.flatMap(r => r.finalState.unlockedArchives)
  );
  
  // 这里应该从配置中读取总数
  // 简化版使用实际触发的数量
  return {
    events: {
      total: 100,  // 假设总数
      triggered: triggeredEvents.size,
      coverage: triggeredEvents.size / 100,
      missing: []  // 需要对比配置计算
    },
    endings: {
      total: 20,   // 假设总数
      achieved: achievedEndings.size,
      coverage: achievedEndings.size / 20,
      missing: []
    },
    archives: {
      total: 200,  // 假设总数
      unlocked: unlockedArchives.size,
      coverage: unlockedArchives.size / 200
    }
  };
}
