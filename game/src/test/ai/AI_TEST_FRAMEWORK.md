# AI模拟玩家测试框架 V1.0

> **修正版本**: 与现有Zustand单例架构完全兼容  
> **测试引擎**: Vitest + jsdom  
> **状态管理**: 不可变状态快照  
> **事件系统**: 异步适配器

---

## 一、架构设计

### 1.1 核心原则

```
┌─────────────────────────────────────────────────────────────────┐
                     核心设计决策                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ 不做: 多并发AI独立进程                                       │
│     - 与Zustand单例模式冲突                                      │
│     - localStorage持久化互相覆盖                                 │
│     - 需要复杂的进程间通信                                        │
│                                                                 │
│  ✅ 改为: 状态快照 + 顺序执行                                    │
│     - 基于不可变状态快照模拟                                      │
│     - AI决策作为纯函数                                            │
│     - 单线程顺序运行100局而非并发                                  │
│                                                                 │
│  ❌ 不做: 直接操作React组件                                      │
│     - 渲染开销大                                                  │
│     - 异步事件处理复杂                                            │
│                                                                 │
│  ✅ 改为: 直接调用核心逻辑                                        │
│     - 绕过React，直接操作store action                            │
│     - 使用runTurnSettlement等核心函数                            │
│     - 速度提升10-100倍                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI测试框架架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   测试场景定义    │───▶│   AI策略引擎     │───▶│ 状态模拟器   │ │
│  │  (Scenario)     │    │  (Strategy)     │    │(Simulator)  │ │
│  └─────────────────┘    └─────────────────┘    └──────┬──────┘ │
│           │                                           │        │
│           ▼                                           ▼        │
│  ┌─────────────────┐                         ┌─────────────┐  │
│  │   Vitest Runner │◀────────────────────────│  游戏状态快照 │  │
│  │                 │    断言验证              │ (Snapshot)  │  │
│  └─────────────────┘                         └─────────────┘  │
│           │                                           ▲        │
│           ▼                                           │        │
│  ┌─────────────────┐    ┌─────────────────┐           │        │
│  │  BoundaryChecker│◀───│   结果分析器     │───────────┘        │
│  │   (复用现有)     │    │  (Analyzer)     │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、核心类型定义

### 2.1 文件结构

```
game/src/test/ai/
├── types.ts              # 核心类型定义
├── strategies.ts         # AI策略实现
├── simulator.ts          # 游戏状态模拟器
├── scenarios.ts          # 测试场景定义
├── runner.ts             # 测试运行器
├── assertions.ts         # 自定义断言
├── index.ts              # 框架入口
├── integration.test.ts   # 与BoundaryChecker集成测试
└── scenarios/            # 具体场景测试
    ├── survival.test.ts
    ├── exploration.test.ts
    └── chaos.test.ts
```

### 2.2 类型定义 (types.ts)

```typescript
import type { 
  GameState, 
  GameEvent, 
  EventOption,
  VitalityState,
  BankState,
  FaithState,
  CryptoState,
  PrisonState,
  Ending 
} from '@/types/schema';

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
```

---

## 三、AI策略实现 (strategies.ts)

```typescript
import type { AIStrategy, DecisionContext, AIDecision, AIStrategyType } from './types';
import type { EventOption } from '@/types/schema';

// ==========================================
// 基类 - 提供通用工具方法
// ==========================================

abstract class BaseStrategy implements AIStrategy {
  abstract readonly type: AIStrategyType;
  abstract readonly name: string;
  
  /** 获取状态数值辅助方法 */
  protected getStats(ctx: DecisionContext) {
    const m = ctx.state.vitality.metrics;
    return {
      hp: m.hp,
      maxHp: m.maxHp,
      hpPercent: m.hp / m.maxHp,
      hunger: m.hunger,
      hungerPercent: m.hunger / 100,
      insight: m.insight,
      gold: m.gold,
      turn: ctx.state.currentTurn
    };
  }
  
  /** 选项风险评估 */
  protected assessRisk(option: EventOption): number {
    const effects = option.effects;
    let risk = 0;
    
    if (effects.hp && effects.hp < 0) risk += Math.abs(effects.hp) * 2;
    if (effects.gold && effects.gold < 0) risk += Math.abs(effects.gold) * 0.1;
    if (effects.hunger && effects.hunger > 0) risk += effects.hunger;
    
    // D选项额外风险权重
    const isDOption = (option as any).id === 'D' || option.label?.includes('⚠️');
    if (isDOption) risk += 10;
    
    return risk;
  }
  
  /** 选项收益评估 */
  protected assessBenefit(option: EventOption): number {
    const effects = option.effects;
    let benefit = 0;
    
    if (effects.hp && effects.hp > 0) benefit += effects.hp;
    if (effects.gold && effects.gold > 0) benefit += effects.gold * 0.1;
    if (effects.hunger && effects.hunger < 0) benefit += Math.abs(effects.hunger);
    if (effects.insight && effects.insight > 0) benefit += effects.insight * 0.5;
    
    return benefit;
  }
  
  abstract decide(ctx: DecisionContext): AIDecision;
}

// ==========================================
// 1. 随机漫步者
// ==========================================

export class RandomStrategy extends BaseStrategy {
  readonly type = 'random' as const;
  readonly name = '随机漫步者';
  
  decide(ctx: DecisionContext): AIDecision {
    const { event } = ctx;
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件，推进回合',
        timestamp: Date.now()
      };
    }
    
    // 随机选择可用选项
    const options = ['A', 'B', 'C', 'D'] as const;
    const availableOptions = options.filter(opt => {
      const optionData = event.options[opt];
      if (!optionData) return false;
      // 检查D选项是否可见
      if (opt === 'D') {
        return ctx.state.vitality.metrics.insight >= 70;
      }
      return true;
    });
    
    const choice = availableOptions[Math.floor(Math.random() * availableOptions.length)];
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice,
      reasoning: `随机选择: ${choice}`,
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 2. 生存优先者
// ==========================================

export class SurvivalStrategy extends BaseStrategy {
  readonly type = 'survival' as const;
  readonly name = '生存优先者';
  
  decide(ctx: DecisionContext): AIDecision {
    const { event, state } = ctx;
    const stats = this.getStats(ctx);
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件',
        timestamp: Date.now()
      };
    }
    
    // 危急状态处理
    const isCritical = stats.hpPercent < 0.25 || stats.hungerPercent > 0.8;
    
    const options = Object.entries(event.options)
      .filter(([key, opt]) => opt && (key !== 'D' || stats.insight >= 70))
      .map(([key, opt]) => ({ key: key as 'A' | 'B' | 'C' | 'D', option: opt! }));
    
    if (options.length === 0) {
      return {
        turn: ctx.turn,
        eventId: event.id,
        choice: 'A',
        reasoning: '无可用选项，默认选A',
        timestamp: Date.now()
      };
    }
    
    let choice: 'A' | 'B' | 'C' | 'D';
    
    if (isCritical) {
      // 危急状态：选择风险最低的
      const safest = options.sort((a, b) => {
        return this.assessRisk(a.option) - this.assessRisk(b.option);
      })[0];
      choice = safest.key;
    } else {
      // 正常状态：选择收益/风险比最高的
      const best = options.sort((a, b) => {
        const scoreA = this.assessBenefit(a.option) - this.assessRisk(a.option) * 0.5;
        const scoreB = this.assessBenefit(b.option) - this.assessRisk(b.option) * 0.5;
        return scoreB - scoreA;
      })[0];
      choice = best.key;
    }
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice,
      reasoning: isCritical ? '危急状态，选择最安全选项' : '选择最优收益风险比',
      timestamp: Date.now()
    };
  }
  
  onTurnEnd(state: GameStateSnapshot, decision: AIDecision): void {
    // 生存策略回合结束后的处理（如购买食物逻辑）
    const stats = state.vitality.metrics;
    
    // 如果饥饿度高，尝试去商店买食物
    if (stats.hunger > 70 && stats.gold > 20) {
      // 这里可以记录意图，实际购买在商店界面处理
      // 简化版：直接扣除金币恢复饥饿
      // 实际实现中会通过store action
    }
  }
}

// ==========================================
// 3. 探索型玩家
// ==========================================

export class ExplorerStrategy extends BaseStrategy {
  readonly type = 'explorer' as const;
  readonly name = '探索型玩家';
  
  private dOptionCount = 0;
  
  decide(ctx: DecisionContext): AIDecision {
    const { event, state } = ctx;
    const stats = this.getStats(ctx);
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件',
        timestamp: Date.now()
      };
    }
    
    // 优先选择D选项（如果可见且不会太危险）
    const dOption = event.options.D;
    if (dOption && stats.insight >= 70 && stats.hpPercent > 0.3) {
      this.dOptionCount++;
      return {
        turn: ctx.turn,
        eventId: event.id,
        choice: 'D',
        reasoning: `探索D选项（已累计${this.dOptionCount}次）`,
        timestamp: Date.now()
      };
    }
    
    // 其次选择能增加灵视的选项
    const options = Object.entries(event.options)
      .filter(([key, opt]) => opt && key !== 'D')
      .map(([key, opt]) => ({ key: key as 'A' | 'B' | 'C', option: opt! }));
    
    const bestInsight = options.sort((a, b) => {
      const insightA = a.option.effects.insight || 0;
      const insightB = b.option.effects.insight || 0;
      return insightB - insightA;
    })[0];
    
    const choice = bestInsight?.key || 'A';
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice,
      reasoning: '优先增加灵视',
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 4. 极限挑战者
// ==========================================

export class ChaosStrategy extends BaseStrategy {
  readonly type = 'chaos' as const;
  readonly name = '极限挑战者';
  
  decide(ctx: DecisionContext): AIDecision {
    const { event } = ctx;
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件',
        timestamp: Date.now()
      };
    }
    
    // 故意选择风险最高的选项
    const options = Object.entries(event.options)
      .filter(([key, opt]) => opt)
      .map(([key, opt]) => ({ key: key as 'A' | 'B' | 'C' | 'D', option: opt! }));
    
    if (options.length === 0) {
      return {
        turn: ctx.turn,
        eventId: event.id,
        choice: 'A',
        timestamp: Date.now()
      };
    }
    
    // 按风险排序，选最高的
    const riskiest = options.sort((a, b) => {
      return this.assessRisk(b.option) - this.assessRisk(a.option);
    })[0];
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice: riskiest.key,
      reasoning: '故意选择高风险选项',
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 5. 新手模拟器
// ==========================================

export class NewbieStrategy extends BaseStrategy {
  readonly type = 'newbie' as const;
  readonly name = '新手模拟器';
  
  // 模拟新手的随机延迟和误操作
  private hesitationChance = 0.2;  // 20%概率犹豫（选错）
  private skipChance = 0.1;        // 10%概率跳过引导
  
  decide(ctx: DecisionContext): AIDecision {
    const { event, state, turn } = ctx;
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件',
        timestamp: Date.now()
      };
    }
    
    // 新手倾向于选A（通常是最安全的）
    let choice: 'A' | 'B' | 'C' | 'D' = 'A';
    
    // 但有概率随机选（没看明白选项）
    if (Math.random() < this.hesitationChance) {
      const options = ['A', 'B', 'C'] as const;
      choice = options[Math.floor(Math.random() * options.length)];
    }
    
    // 偶尔误触D（不知道怎么就点到了）
    if (event.options.D && state.vitality.metrics.insight >= 70 && Math.random() < 0.05) {
      choice = 'D';
    }
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice,
      reasoning: '新手随机选择',
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 策略工厂
// ==========================================

export function createStrategy(type: AIStrategyType): AIStrategy {
  switch (type) {
    case 'random':
      return new RandomStrategy();
    case 'survival':
      return new SurvivalStrategy();
    case 'explorer':
      return new ExplorerStrategy();
    case 'chaos':
      return new ChaosStrategy();
    case 'newbie':
      return new NewbieStrategy();
    default:
      return new RandomStrategy();
  }
}

export const ALL_STRATEGIES: AIStrategyType[] = [
  'random', 'survival', 'explorer', 'chaos', 'newbie'
];
```

---

## 四、执行计划

### 阶段1: 基础框架 (Week 1)

| 天数 | 任务 | 输出文件 |
|-----|------|---------|
| Day 1 | 创建类型定义 | `types.ts` |
| Day 2 | 实现AI策略 | `strategies.ts` |
| Day 3 | 实现状态模拟器 | `simulator.ts` |
| Day 4 | 实现测试运行器 | `runner.ts` |
| Day 5 | 编写基础测试用例 | `ai.test.ts` |

### 阶段2: 场景实现 (Week 2)

| 天数 | 任务 | 输出 |
|-----|------|------|
| Day 1 | SC-001~SC-003 | 生存/D选项测试 |
| Day 2 | SC-004~SC-006 | 债务/死亡/新手测试 |
| Day 3 | BoundaryChecker集成 | `integration.test.ts` |
| Day 4 | 覆盖率分析 | `analyzer.ts` |
| Day 5 | 报告生成器 | `reporter.ts` |

### 阶段3: CI/CD (Week 3)

- GitHub Actions配置
- 自动化报告
- 性能优化

---

## 五、运行命令

```bash
# 运行AI测试套件
npm test -- ai/ai.test.ts

# 运行单个场景
npm test -- ai/ai.test.ts -t "生存策略"

# 带覆盖率报告
npm test -- --coverage ai/

# 调试模式（详细日志）
DEBUG=ai npm test -- ai/ai.test.ts
```

---

**此方案已完全适配现有架构，可立即开始实现。**
