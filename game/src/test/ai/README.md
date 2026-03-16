# AI模拟玩家测试框架

## 快速开始

### 1. 运行测试

```bash
# 运行全部AI测试
npm test -- src/test/ai/ai.test.ts

# 运行特定测试组
npm test -- src/test/ai/ai.test.ts -t "核心稳定性"

# 带覆盖率报告
npm test -- --coverage src/test/ai/
```

### 2. 使用框架API

```typescript
import { 
  runScenario, 
  createStrategy,
  SurvivalChallengeScenario 
} from './test/ai';

// 运行预定义场景
const result = await runScenario(SurvivalChallengeScenario);

// 使用自定义策略
const strategy = createStrategy('survival');
```

## 架构说明

### 核心设计

- **状态快照**: 基于不可变状态而非多实例
- **顺序执行**: 单线程顺序运行而非并发
- **直接调用**: 绕过React直接操作store action

### 文件结构

```
ai/
├── types.ts          # 类型定义
├── strategies.ts     # AI策略实现
├── simulator.ts      # 状态模拟器
├── scenarios.ts      # 测试场景
├── runner.ts         # 测试运行器
├── ai.test.ts        # 主测试套件
└── integration.test.ts # 集成测试
```

## 测试场景

| 场景ID | 名称 | 策略 | 用途 |
|-------|------|------|------|
| SC-001 | 百轮生存挑战 | survival | 验证长期存活能力 |
| SC-002 | 极限贫困开局 | survival | 验证翻身机制 |
| SC-003 | D选项探索 | explorer | 验证高灵视路线 |
| SC-004 | 债务地狱 | chaos | 验证债务系统 |
| SC-005 | 快速死亡测试 | chaos | 验证死亡结算 |
| SC-006 | 新手引导流程 | newbie | 验证引导鲁棒性 |

## AI策略

| 策略 | 说明 | 用途 |
|------|------|------|
| random | 完全随机选择 | 压力测试 |
| survival | 优先保证生存 | 平衡性验证 |
| explorer | 优先D选项和灵视 | 探索隐藏内容 |
| chaos | 选择高风险选项 | 边界测试 |
| newbie | 模拟新手误操作 | 引导测试 |

## 扩展框架

### 自定义策略

```typescript
import { BaseStrategy, DecisionContext, AIDecision } from './test/ai';

class MyStrategy extends BaseStrategy {
  readonly type = 'my_strategy' as const;
  readonly name = '我的策略';
  
  decide(ctx: DecisionContext): AIDecision {
    // 实现决策逻辑
    return {
      turn: ctx.turn,
      choice: 'A',
      reasoning: '我的理由',
      timestamp: Date.now()
    };
  }
}
```

### 自定义场景

```typescript
import { TestScenario } from './test/ai';

const MyScenario: TestScenario = {
  id: 'MY-001',
  name: '我的场景',
  description: '测试描述',
  strategy: 'random',
  runs: 50,
  maxTurns: 30,
  successCriteria: {
    minSurvivalTurns: 10,
    maxCrashRate: 0
  }
};
```
