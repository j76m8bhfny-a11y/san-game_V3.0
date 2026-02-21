# 事件与档案系统架构审查报告

**日期**: 2026-01-15  
**审查范围**: 事件系统v3、档案系统、System Gaze的代码耦合

---

## 📊 耦合分析总结

### 整体架构健康度: ⭐⭐⭐⭐ (良好)

| 维度 | 评分 | 说明 |
|------|------|------|
| 模块分离度 | ⭐⭐⭐⭐ | 逻辑层与UI层分离良好 |
| 依赖管理 | ⭐⭐⭐ | 存在部分循环依赖风险 |
| 类型安全 | ⭐⭐⭐⭐ | TypeScript类型覆盖良好 |
| 可测试性 | ⭐⭐⭐⭐ | 纯函数易于单元测试 |
| 可维护性 | ⭐⭐⭐⭐ | 文件职责清晰 |

---

## 🔗 耦合关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ SystemGazeOverlay│  │ArchiveMilestone  │  │ MessageWindow  │  │
│  │    .tsx         │  │   Modal.tsx      │  │   .tsx         │  │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬────────┘  │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          STORE LAYER                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  useGameStore   │◄─┤createGlobalProgress│  │  EventSystem   │  │
│  │   (Zustand)     │  │    Slice.ts      │  │   .processTurn │  │
│  └────────┬────────┘  └──────────────────┘  └───────┬────────┘  │
│           │                                         │           │
│           │    ┌────────────────────────────────┐   │           │
│           └───►│      createGameSlice.ts        │◄──┘           │
│                │  - selectOption()              │               │
│                │  - resolveEventOption()        │               │
│                └────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          LOGIC LAYER                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  eventResolver  │  │gazeEventSystem   │  │actionExecutor  │  │
│  │    .ts          │  │    .ts           │  │  Adapter.ts    │  │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬────────┘  │
│           │                    │                    │           │
│           │    ┌────────────────────────────────┐   │           │
│           └───►│      archiveModifier.ts        │◄──┘           │
│                │  - D选项惩罚减免计算           │               │
│                └────────────────────────────────┘               │
│                              │                                  │
│                              ▼                                  │
│                ┌────────────────────────────────┐               │
│                │       systemGaze.ts            │               │
│                │  - 强度计算                    │               │
│                │  - GAZE_EFFECTS常量            │               │
│                └────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  events/index   │  │  loadAllEvents   │  │   *.json       │  │
│  │    .ts          │  │   (动态导入)     │  │  (事件文件)    │  │
│  └─────────────────┘  └──────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ 发现的问题

### 1. 类型不一致问题 (中等)

**问题**: `actionExecutorAdapter.ts` 使用了旧版Redux的 `StoreState` 类型，但实际已迁移到Zustand。

```typescript
// actionExecutorAdapter.ts 第10行
import { StoreState } from '@/store/store';  // ❌ 旧路径

// 实际应该是
import { StoreState } from '@/types/store';  // ✅ 新路径
```

**影响**: 可能导致类型检查失败或运行时错误。

**解决**: 统一使用 `@/types/store` 中的类型定义。

---

### 2. 重复计算问题 (低)

**问题**: `calculateGazeIntensity` 在多处被重复调用。

```typescript
// gazeEventSystem.ts 第35行
const intensity = calculateGazeIntensity(totalArchives);

// eventResolver.ts 也会调用
// createGameSlice.ts 也会调用
```

**影响**: 轻微性能损耗，但计算简单可忽略。

**解决**: 可考虑在store中缓存计算结果。

---

### 3. 紧密耦合: GameSlice与GazeEventSystem (中等)

**问题**: `createGameSlice.ts` 直接导入 `getCurrentGazeEffects` 并调用。

```typescript
// createGameSlice.ts 第4行
import { getCurrentGazeEffects } from '@/logic/gazeEventSystem';
```

**风险**: 如果gazeEventSystem接口变更，会影响GameSlice。

**建议**: 通过适配器模式或依赖注入解耦。

---

### 4. 潜在的循环依赖风险 (低)

**问题**: `eventResolver.ts` → `gazeEventSystem.ts` → `events/index.ts` → 可能回到resolver。

```
eventResolver.ts
  └─► gazeEventSystem.ts
        └─► events/index.ts
              └─► (动态加载的事件可能引用 resolver?)
```

**当前状态**: 暂未出现实际问题。

**监控**: 需要关注构建时的循环依赖警告。

---

### 5. any类型使用 (中等)

**问题**: 多处使用 `as any` 逃避类型检查。

```typescript
// createGameSlice.ts 第99行
const { intensity, effects: gazeEffects } = getCurrentGazeEffects({ 
  unlockedArchives: state.unlockedArchives || [],
  vitality: state.vitality 
} as any);  // ❌ 应该正确定义类型
```

**影响**: 失去类型保护，可能导致运行时错误。

**解决**: 定义正确的GameState类型或使用类型守卫。

---

## ✅ 优秀实践

### 1. 纯函数设计

`archiveModifier.ts` 和 `systemGaze.ts` 都是纯函数，易于测试和复用。

```typescript
// ✅ 纯函数 - 无副作用
export function calculateDOptionPenaltyReduction(totalArchives: number): number {
  return Math.min(0.67, 1 - 1 / (1 + totalArchives / 20));
}
```

### 2. 单一职责

- `systemGaze.ts`: 只负责gaze相关计算
- `archiveModifier.ts`: 只负责档案奖励计算
- `gazeEventSystem.ts`: 只负责gaze事件逻辑

### 3. 配置驱动

事件权重、效果数值都通过配置而非硬编码。

```typescript
const leverageMap: Record<string, number> = {
  'HOMELESS': 0.15,
  'WORKER': 0.5,
  'MIDDLE': 1.0,
  'CAPITALIST': 2.0
};
```

---

## 📋 推荐的最新逻辑架构

### 核心数据流

```
用户选择选项
    │
    ▼
┌─────────────────┐
│ resolveOption   │ ◄── 统一入口
│ (eventResolver) │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────────┐
│效果计算 │ │ 档案解锁   │
│(adapter)│ │ (unlock)   │
└────┬───┘ └──────┬─────┘
     │            │
     ▼            ▼
┌──────────────────────┐
│   Zustand Store      │
│   (状态更新)         │
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│   UI 响应            │
│   (重新渲染)         │
└──────────────────────┘
```

### 文件职责表

| 文件 | 职责 | 不做什么 |
|------|------|----------|
| `systemGaze.ts` | 计算gaze强度、提供效果常量 | 不修改状态、不触发动画 |
| `archiveModifier.ts` | 计算档案奖励 | 不解锁档案、不更新UI |
| `gazeEventSystem.ts` | 判断gaze事件触发、获取可用事件 | 不直接修改store |
| `eventResolver.ts` | 解析事件选项、应用效果 | 不计算gaze/档案奖励 |
| `actionExecutorAdapter.ts` | 整合所有效果计算 | 不直接操作DOM |
| `createGlobalProgressSlice.ts` | 管理跨运行进度 | 不计算效果数值 |
| `createGameSlice.ts` | 游戏状态管理 | 不直接计算gaze效果 |
| `SystemGazeOverlay.tsx` | 视觉效果渲染 | 不计算强度、不修改状态 |

---

## 🔧 优化建议

### 短期 (立即)

1. **修复类型导入**
   ```typescript
   // actionExecutorAdapter.ts
   - import { StoreState } from '@/store/store';
   + import { StoreState } from '@/types/store';
   ```

2. **减少any类型**
   ```typescript
   // 定义GameStatePartial类型
   interface GameStatePartial {
     unlockedArchives: string[];
     vitality: { identity: { currentClass: string } };
   }
   ```

### 中期 (本周)

1. **创建效果计算Hook**
   ```typescript
   // hooks/useEffectCalculator.ts
   export function useEffectCalculator() {
     const state = useGameStore();
     return {
       calculate: (effect, optionType) => calculateEventEffect(state, effect, optionType)
     };
   }
   ```

2. **添加单元测试**
   - `systemGaze.test.ts`
   - `archiveModifier.test.ts`
   - `eventResolver.test.ts`

### 长期 (本月)

1. **考虑使用Redux Toolkit Query**缓存事件加载
2. **性能优化**: 使用reselect缓存gaze强度计算
3. **代码分割**: 按职业懒加载事件文件

---

## 📊 依赖关系矩阵

| 文件 | 被依赖次数 | 依赖其他次数 | 风险等级 |
|------|-----------|-------------|----------|
| systemGaze.ts | 4 | 0 | 🟢 低 |
| archiveModifier.ts | 3 | 1 | 🟢 低 |
| eventResolver.ts | 2 | 2 | 🟡 中 |
| gazeEventSystem.ts | 2 | 3 | 🟡 中 |
| actionExecutorAdapter.ts | 1 | 3 | 🟢 低 |
| createGameSlice.ts | 0 | 5 | 🔴 高 |
| EventSystem.ts | 0 | 4 | 🟡 中 |

**说明**: `createGameSlice.ts` 风险最高，因为它依赖最多其他模块，修改时需要格外小心。

---

## ✅ 结论

整体架构**健康良好**，模块职责清晰。主要问题是：

1. 部分类型导入需要更新
2. 少量 `any` 类型需要替换
3. `createGameSlice.ts` 需要监控依赖增长

建议按优先级逐步修复，不影响当前功能。
