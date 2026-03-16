/**
 * AI模拟玩家测试框架 - 核心类型定义
 * 与现有Zustand架构完全兼容
 */

import type { 
  GameState, 
  GameEvent,
  VitalityState,
  BankState,
  FaithState,
  PrisonState,
  Ending
} from '@/types/schema';

// Crypto 状态类型（从 GameState 中提取）
type CryptoState = GameState['crypto'];

// ==========================================
// AI玩家相关类型
// ==========================================

/** AI策略类型 */
export type AIStrategyType = 
  | 'random'      // 随机漫步者
  | 'survival'    // 生存优先者
  | 'explorer'    // 探索型玩家
  | 'chaos'       // 极限挑战者
  | 'newbie';     // 新手模拟器

/** 决策上下文 */
export interface DecisionContext {
  event: GameEvent | null;
  state: GameStateSnapshot;
  turn: number;
  history: AIDecision[];
}

/** AI决策结果 */
export interface AIDecision {
  turn: number;
  eventId?: string;
  choice: 'A' | 'B' | 'C' | 'D' | null;  // null表示关闭/跳过
  reasoning?: string;
  timestamp: number;
}

/** AI策略接口 */
export interface AIStrategy {
  readonly type: AIStrategyType;
  readonly name: string;
  
  /** 做决策 */
  decide(context: DecisionContext): AIDecision;
  
  /** 回合结算后的回调 */
  onTurnEnd?(state: GameStateSnapshot, decision: AIDecision): void;
  
  /** 游戏结束回调 */
  onGameEnd?(result: GameResult): void;
}

// ==========================================
// 游戏状态快照
// ==========================================

/** 精简的游戏状态快照 - 不可变 */
export interface GameStateSnapshot {
  // 核心生存数据
  vitality: VitalityState;
  
  // 子系统状态
  bank: BankState;
  faith: FaithState;
  crypto: CryptoState;
  prison: PrisonState;
  
  // 游戏进度
  currentTurn: number;
  currentRegion: string;
  ending: Ending | null;
  
  // 统计
  unlockedArchives: string[];
  achievedEndings: string[];
  totalDeaths: number;
  
  // 运行状态
  isEventOpen: boolean;
  currentEvent: GameEvent | null;
}

/** 游戏结果 */
export interface GameResult {
  success: boolean;
  outcome: 'alive' | 'dead' | 'ending' | 'timeout' | 'error';
  turns: number;
  decisions: AIDecision[];
  finalState: GameStateSnapshot;
  
  // 死因分析
  deathAnalysis?: {
    cause: string;
    mistakes: string[];
    suggestions: string[];
  };
  
  // 错误信息
  error?: string;
  stack?: string;
}

// ==========================================
// 测试场景相关
// ==========================================

/** 测试场景配置 */
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  
  // AI配置
  strategy: AIStrategyType;
  
  // 运行配置
  runs: number;           // 运行次数
  maxTurns: number;       // 最大回合数
  
  // 初始状态覆盖
  initialState?: Partial<GameStateSnapshot>;
  
  // 成功标准
  successCriteria: SuccessCriteria;
  
  // 钩子函数
  hooks?: {
    beforeRun?: () => Promise<void> | void;
    afterRun?: (result: GameResult) => Promise<void> | void;
    onError?: (error: Error, state: GameStateSnapshot) => void;
  };
}

/** 成功标准 */
export interface SuccessCriteria {
  /** 最小存活回合数 */
  minSurvivalTurns?: number;
  
  /** 最大崩溃率 (0-1) */
  maxCrashRate?: number;
  
  /** 必须触发的结局 */
  requiredEnding?: string;
  
  /** 必须解锁的档案 */
  requiredArchives?: string[];
  
  /** 自定义验证函数 */
  custom?: (results: GameResult[]) => boolean;
}

// ==========================================
// 测试结果
// ==========================================

/** 批量测试结果 */
export interface BatchTestResult {
  scenario: TestScenario;
  totalRuns: number;
  completedRuns: number;
  
  // 存活统计
  survivalStats: {
    avgTurns: number;
    maxTurns: number;
    minTurns: number;
    medianTurns: number;
  };
  
  // 结局分布
  outcomeDistribution: Record<string, number>;
  
  // 死因分析
  deathCauses: Record<string, number>;
  
  // 错误统计
  errors: Array<{
    message: string;
    count: number;
    sampleStack?: string;
  }>;
  
  // 是否通过
  passed: boolean;
  failureReasons: string[];
  
  // 详细数据
  runs: GameResult[];
}

/** 覆盖率报告 */
export interface CoverageReport {
  events: {
    total: number;
    triggered: number;
    coverage: number;
    missing: string[];
  };
  endings: {
    total: number;
    achieved: number;
    coverage: number;
    missing: string[];
  };
  archives: {
    total: number;
    unlocked: number;
    coverage: number;
  };
}

// ==========================================
// 模拟器配置
// ==========================================

export interface SimulatorConfig {
  maxTurns: number;
  onTurnStart?: (turn: number, state: GameStateSnapshot) => void;
  onDecision?: (decision: AIDecision) => void;
  onTurnEnd?: (turn: number, state: GameStateSnapshot) => void;
}

// ==========================================
// 运行器选项
// ==========================================

export interface RunnerOptions {
  /** 是否先运行边界检查 */
  runBoundaryCheck?: boolean;
  /** 是否打印详细日志 */
  verbose?: boolean;
  /** 每多少轮打印进度 */
  progressInterval?: number;
  /** 失败时是否继续 */
  continueOnError?: boolean;
}
