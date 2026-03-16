/**
 * AI模拟玩家测试框架 - 入口文件
 * 
 * 使用示例:
 * ```typescript
 * import { runScenario, createStrategy } from './test/ai';
 * 
 * // 运行单场景
 * const result = await runScenario(SurvivalChallengeScenario);
 * 
 * // 使用特定策略
 * const strategy = createStrategy('survival');
 * ```
 */

// 类型
export type {
  AIStrategyType,
  AIStrategy,
  DecisionContext,
  AIDecision,
  GameStateSnapshot,
  GameResult,
  TestScenario,
  SuccessCriteria,
  BatchTestResult,
  CoverageReport,
  SimulatorConfig,
  RunnerOptions
} from './types';

// 策略
export {
  createStrategy,
  ALL_STRATEGIES,
  RandomStrategy,
  SurvivalStrategy,
  ExplorerStrategy,
  ChaosStrategy,
  NewbieStrategy
} from './strategies';

// 场景
export {
  ALL_SCENARIOS,
  SurvivalChallengeScenario,
  ExtremePovertyScenario,
  DOptionExplorationScenario,
  DebtHellScenario,
  QuickDeathScenario,
  NewbieTutorialScenario,
  RandomStressScenario,
  getScenarioById,
  analyzeCoverage
} from './scenarios';

// 模拟器
export {
  runGameSimulation,
  fastSimulate,
  createSnapshotFromStore,
  applySnapshotToStore
} from './simulator';

// 运行器
export {
  runScenario,
  runAllScenarios,
  quickTest
} from './runner';
