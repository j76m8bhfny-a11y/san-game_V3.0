# AI测试方案审查报告

**审查日期**: 2026-03-11  
**审查人**: AI Assistant  
**状态**: ⚠️ 需要修复后使用

---

## 一、发现的严重问题

### 🔴 问题1: 游戏循环逻辑错误

**位置**: `simulator.ts` 第78-120行

**问题描述**:
当前实现的事件处理逻辑与实际游戏流程不符：

```typescript
// 当前实现（有问题）
while (turn < config.maxTurns) {
  // ...
  if ((store as any).isEventOpen && decision.choice) {
    (store as any).resolveEventOption(decision.choice);
    (store as any).closeEvent?.();
  } else {
    await store.nextTurn();  // ← 问题：nextTurn触发事件后不会自动处理
  }
}
```

**实际问题**:
1. `nextTurn()` 触发事件后会设置 `isEventOpen=true` 并立即返回（第367行）
2. 但代码在调用 `nextTurn()` 后才检查 `isEventOpen`，此时需要重新循环处理事件
3. 当前逻辑会导致：触发事件→不做决策→直接下一回合（跳过事件处理）

**修复建议**:
```typescript
while (turn < config.maxTurns) {
  // 检查游戏结束...
  
  // 检查是否有待处理的事件
  if ((store as any).isEventOpen && (store as any).currentEvent) {
    // AI处理事件
    const context = { event: (store as any).currentEvent, ... };
    const decision = strategy.decide(context);
    decisions.push(decision);
    
    if (decision.choice) {
      (store as any).resolveEventOption(decision.choice);
    }
    (store as any).closeEvent();
    continue;  // 处理完事件后继续检查，不增加回合数
  }
  
  // 没有事件时推进回合
  turn++;
  config.onTurnStart?.(turn, createSnapshotFromStore(store));
  await store.nextTurn();  // 这可能触发新事件
  config.onTurnEnd?.(turn, createSnapshotFromStore(store));
}
```

---

### 🔴 问题2: `selectOption` 未在接口中暴露

**位置**: `createGameSlice.ts` 第120行

**问题描述**:
`resolveEventOption` 内部调用了 `(get() as any).selectOption(option)`，但：
1. `selectOption` 不是 `GameSlice` 接口的公开方法
2. 虽然它在对象字面量中定义，但可能无法通过 `get()` 访问

**代码片段**:
```typescript
// createGameSlice.ts
resolveEventOption: (optionId) => {
  // ...
  return (get() as any).selectOption(option);  // ← 可能返回 undefined
},
// ...
selectOption: (option) => {  // 这个方法在对象字面量中，但不在接口中
  // ...
},
```

**验证方法**:
```typescript
// 在浏览器控制台测试
const store = useGameStore.getState();
console.log(typeof store.selectOption);  // 如果输出 "undefined" 则有问题
```

**修复建议**:
在 `GameSlice` 接口中添加 `selectOption` 声明：
```typescript
export interface GameSlice {
  // ...
  selectOption: (option: EventOption) => { modifiers: string[] } | void;
  // ...
}
```

---

### 🟡 问题3: `initialState` 覆盖未实现

**位置**: `simulator.ts` 第71-74行

**问题描述**:
代码中有注释占位，但未实现自定义初始状态的应用：
```typescript
// 应用自定义初始状态（如果有）
// ... ← 未实现
```

**影响**: 
DOptionExplorationScenario 中设置的 `insight: 70` 不会生效。

**修复建议**:
```typescript
// 应用自定义初始状态
if (config.initialState) {
  const store = useGameStore.getState();
  if (config.initialState.vitality?.metrics) {
    Object.assign(store.vitality.metrics, config.initialState.vitality.metrics);
  }
  // 其他字段同理...
}
```

---

### 🟡 问题4: 缺少 `isMenuOpen` 检查

**位置**: `createGameSlice.ts` 第100-107行

**问题描述**:
`resolveEventOption` 会检查 `isMenuOpen`，如果菜单打开会返回空：
```typescript
resolveEventOption: (optionId) => {
  if (get().isMenuOpen) {
    return { modifiers: [] };  // 菜单打开时不处理
  }
  // ...
},
```

**影响**: 测试中如果菜单状态未重置，可能导致事件选择失败。

**修复建议**:
在 `runGameSimulation` 开始处确保菜单关闭：
```typescript
// 确保所有UI状态重置
(store as any).isMenuOpen && (store as any).toggleMenu?.();
(store as any).isShopOpen && (store as any).setShopOpen?.(false);
// ... 其他模态框
```

---

### 🟡 问题5: `modifyStats` 可能未定义

**位置**: `simulator.ts` 第46-47行

**问题描述**:
`applySnapshotToStore` 直接修改 `store.vitality`，但正确的方式应该是调用 slice 提供的方法。

**修复建议**:
删除 `applySnapshotToStore` 函数或改用正确的状态更新方式。

---

## 二、类型兼容性问题

### 问题6: StoreState 类型不完整

**位置**: `simulator.ts` 第20-36行

**问题描述**:
代码中使用 `(store as any).ending` 等类型断言，说明 `StoreState` 类型可能不包含这些字段。

**建议**:
1. 检查 `StoreState` 类型定义，添加缺失字段
2. 或创建扩展类型：
```typescript
interface ExtendedStoreState extends StoreState {
  ending?: Ending | null;
  isEventOpen: boolean;
  currentEvent: GameEvent | null;
  // ...
}
```

---

## 三、性能问题

### 问题7: 频繁创建快照

**位置**: `simulator.ts` 第90, 96, 116, 119行

**问题描述**:
每回合多次调用 `createSnapshotFromStore`，创建大量临时对象。

**优化建议**:
```typescript
// 缓存快照
let currentSnapshot = createSnapshotFromStore(store);

// 只在状态变化时更新
const updateSnapshot = () => {
  currentSnapshot = createSnapshotFromStore(store);
};

// 使用缓存的快照
config.onTurnStart?.(turn, currentSnapshot);
```

---

## 四、测试可靠性问题

### 问题8: 随机性导致测试不稳定

**位置**: `strategies.ts`

**问题描述**:
随机策略使用 `Math.random()`，可能导致测试结果不可复现。

**建议**:
添加种子随机数生成器：
```typescript
// 在 TestScenario 中添加 seed 字段
export interface TestScenario {
  // ...
  seed?: number;  // 随机种子
}

// 使用种子随机数
let seed = scenario.seed || Date.now();
const random = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};
```

---

## 五、修复后的完整代码

### simulator.ts 修复版

```typescript
export async function runGameSimulation(
  strategy: AIStrategy,
  config: SimulatorConfig & { initialState?: Partial<GameStateSnapshot> }
): Promise<GameResult> {
  const { useGameStore } = await import('@/store/useGameStore');
  const { analyzeDeath } = await import('@/logic/deathAnalysis');
  
  const store = useGameStore.getState() as ExtendedStoreState;
  const decisions: AIDecision[] = [];
  
  try {
    // 重置游戏
    store.restartGame();
    
    // 应用自定义初始状态
    if (config.initialState?.vitality?.metrics) {
      Object.assign(store.vitality.metrics, config.initialState.vitality.metrics);
    }
    
    // 确保UI状态 clean
    if (store.isMenuOpen) store.toggleMenu?.();
    
    let turn = 0;
    let consecutiveEvents = 0;  // 防止事件无限循环
    
    while (turn < config.maxTurns && consecutiveEvents < 10) {
      // 检查游戏结束
      if (store.ending) {
        return finalizeResult('ending', turn, decisions, store, analyzeDeath);
      }
      
      if (store.vitality.metrics.hp <= 0) {
        return finalizeResult('dead', turn, decisions, store, analyzeDeath);
      }
      
      // 检查是否有待处理的事件
      if (store.isEventOpen && store.currentEvent) {
        const context: DecisionContext = {
          event: store.currentEvent,
          state: createSnapshotFromStore(store),
          turn,
          history: decisions
        };
        
        const decision = strategy.decide(context);
        decisions.push(decision);
        config.onDecision?.(decision);
        
        if (decision.choice) {
          store.resolveEventOption(decision.choice);
        }
        
        store.closeEvent();
        consecutiveEvents++;
        continue;  // 处理完事件后继续检查，不推进回合
      }
      
      // 重置连续事件计数
      consecutiveEvents = 0;
      
      // 推进回合
      turn++;
      const snapshot = createSnapshotFromStore(store);
      config.onTurnStart?.(turn, snapshot);
      
      await store.nextTurn();
      
      config.onTurnEnd?.(turn, createSnapshotFromStore(store));
      strategy.onTurnEnd?.(snapshot, decisions[decisions.length - 1]);
    }
    
    return finalizeResult('timeout', turn, decisions, store, analyzeDeath);
    
  } catch (error) {
    return {
      success: false,
      outcome: 'error',
      turns: decisions.length,
      decisions,
      finalState: createSnapshotFromStore(store),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
  }
}
```

---

## 六、建议的测试策略

### 阶段1: 修复验证（1天）

1. 修复上述问题
2. 运行单局测试验证基本流程：
```typescript
it('单局游戏应能完成', async () => {
  const strategy = createStrategy('random');
  const result = await runGameSimulation(strategy, { maxTurns: 5 });
  
  console.log('结果:', result);
  expect(result.success).toBe(true);
  expect(result.turns).toBeGreaterThan(0);
});
```

### 阶段2: 小规模批量（1天）

```typescript
it('5局随机测试', async () => {
  const result = await runScenario({
    ...SurvivalChallengeScenario,
    runs: 5,
    maxTurns: 10
  });
  
  expect(result.completedRuns).toBe(5);
});
```

### 阶段3: 全量测试（稳定后）

再运行完整的 100 局测试。

---

## 七、结论

| 维度 | 评分 | 说明 |
|-----|------|------|
| 架构设计 | ✅ 良好 | 状态快照方案可行 |
| 代码实现 | ⚠️ 需修复 | 存在逻辑错误和未实现功能 |
| 类型安全 | ⚠️ 需改进 | 过多 `as any` 断言 |
| 测试覆盖 | ✅ 良好 | 7个场景覆盖核心功能 |
| 可维护性 | ✅ 良好 | 模块化设计清晰 |

**建议**: 先修复问题1和问题2，然后运行小规模测试验证，再投入大规模使用。
