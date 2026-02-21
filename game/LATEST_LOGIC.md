# 最新逻辑文档 - 事件与档案系统 v3

**版本**: 3.0  
**更新日期**: 2026-01-15  

---

## 🎯 核心概念

### 1. 档案系统 (Archive System)

**是什么**: 跨游戏运行的永久进度系统。

**核心机制**:
```typescript
// 解锁条件
选择D选项 + 洞察值 ≥ 40 + 愿意承受高代价

// 奖励公式
D选项惩罚减免 = min(67%, 1 - 1/(1 + 档案数/20))
每3个档案 ≈ 5%减免

// 里程碑
10档案 → 解锁Worker职业
25档案 → 解锁Middle职业  
40档案 → 解锁Capitalist职业 + System Gaze专属事件池
```

### 2. System Gaze (系统凝视)

**是什么**: 随着档案解锁增加而提升的动态难度系统。

**核心机制**:
```typescript
// 强度计算
强度 = max(0, min(1, (档案数 - 20) / 60))

// 触发专属事件的阈值
强度 ≥ 0.3 (约24个档案)

// 阶级特定效果
HOMELESS: 保险拒赔几率增加
WORKER: Gig pay下限降低
MIDDLE: 生活成本增加
CAPITALIST: IRS审计几率增加
```

### 3. 数值标准化

| 选项 | 类型 | 基础金币 | 基础HP | 阶级倍数 | 洞察 |
|------|------|---------|--------|----------|------|
| A | LEVERAGE | 150 | -12 | 0.15~2.0x | +8 |
| B | FIXED | 25 | -3 | 1x | +1 |
| C | INCOME | -15% | +8 | - | -10 |
| D | TRUTH | -100 | -18 | - | -10 |

**阶级倍数**:
- HOMELESS: 0.15x (高风险低收益)
- WORKER: 0.5x
- MIDDLE: 1.0x
- CAPITALIST: 2.0x (高收益)

---

## 📡 API 参考

### systemGaze.ts

```typescript
// 计算gaze强度
export function calculateGazeIntensity(totalArchives: number): number;
// 返回: 0.0 ~ 1.0

// 获取叙事文本
export function getGazeNarrative(intensity: number): string;
// 返回: "你感觉有什么东西在注视着你..." 等
```

### archiveModifier.ts

```typescript
// D选项惩罚减免
export function calculateDOptionPenaltyReduction(totalArchives: number): number;
// 返回: 0.0 ~ 0.67

// 档案分类统计
export function getArchiveCounts(archives: string[]): ArchiveCounts;
// 返回: { homeless, worker, middle, capitalist, total }
```

### gazeEventSystem.ts

```typescript
// 是否应该触发gaze专属事件
export function shouldTriggerGazeEvent(state: GameState): boolean;

// 获取当前gaze效果
export function getCurrentGazeEffects(state: GameState): {
  intensity: number;
  effects: {
    irsAuditChance: number;
    gigPayLowerBound: number;
    insuranceRejectionChance: number;
    lifeCostIncrease: number;
    evasionDetectionBonus: number;
    creditRatingImpact: number;
  };
  unlocks: {
    workerClass: boolean;
    middleClass: boolean;
    capitalistClass: boolean;
    gazeEvents: boolean;
  };
};
```

### eventResolver.ts

```typescript
// 解析事件选项（核心函数）
export function resolveOption(
  state: GameState, 
  option: EventOption,
  event?: GameEvent
): { 
  updates: any; 
  logs: string[]; 
  modifiers?: string[];
  archiveUnlocked?: { archiveId: string; isNew: boolean; milestoneTriggered: boolean };
};
```

### createGlobalProgressSlice (Zustand)

```typescript
// State
unlockedArchives: string[];
systemGaze: { currentIntensity: number; };
showMilestoneModal: boolean;
pendingMilestone: ArchiveMilestone | null;

// Actions
unlockArchive: (archiveId: string) => void;
dismissMilestone: () => void;
resetProgress: () => void;

// Selectors (可作为 hook 使用)
getTotalArchives: () => number;
getGazeIntensity: () => number;
getDOptionPenaltyReduction: () => number;
hasUnlockedClass: (className: string) => boolean;
```

---

## 🔄 数据流示例

### 场景: 玩家选择D选项

```
1. UI层
   MessageWindow.tsx
   └─► 用户点击D选项
       │
       ▼
2. Store层  
   createGameSlice.selectOption()
   ├─► 检查资金/条件
   ├─► 调用 resolveOption()
   │   │
   │   ▼
3. Logic层
   eventResolver.ts
   ├─► 计算基础效果
   ├─► 检查档案解锁条件
   ├─► 调用 calculateDOptionPenaltyReduction()
   │   │
   │   ▼
4. Modifier层
   archiveModifier.ts
   └─► 返回减免比例
       │
       ▼
5. 回到 Logic层
   eventResolver.ts
   ├─► 应用减免到HP消耗
   ├─► 如果是新档案，调用 unlockArchive()
   │   │
   │   ▼
6. Store层
   createGlobalProgressSlice
   ├─► 更新 unlockedArchives
   ├─► 重新计算 systemGaze.currentIntensity
   ├─► 检查里程碑
   └─► 如果触发里程碑: showMilestoneModal = true
       │
       ▼
7. UI层响应
   ├─► SystemGazeOverlay: 根据新intensity更新视觉效果
   ├─► ArchiveMilestoneModal: 显示解锁弹窗
   └─► MessageWindow: 显示"档案减免 15%"等modifier
```

---

## 💻 使用示例

### 在组件中使用

```tsx
// 组件中获取gaze状态
import { useGameStore } from '@/store/useGameStore';
import { getCurrentGazeEffects } from '@/logic/gazeEventSystem';

function MyComponent() {
  const { unlockedArchives, vitality } = useGameStore();
  
  // 计算当前gaze效果
  const gazeEffects = getCurrentGazeEffects({
    unlockedArchives,
    vitality
  });
  
  return (
    <div>
      <p>系统凝视强度: {Math.round(gazeEffects.intensity * 100)}%</p>
      {gazeEffects.unlocks.gazeEvents && (
        <p>⚠️ 已解锁凝视专属事件</p>
      )}
    </div>
  );
}
```

### 在系统逻辑中使用

```typescript
// EventSystem.ts
import { shouldTriggerGazeEvent, getAvailableGazeEvents } from '@/logic/gazeEventSystem';

async function getNextEvent(state: GameState) {
  // 优先检查是否应该触发gaze专属事件
  if (shouldTriggerGazeEvent(state)) {
    const gazeEvents = await getAvailableGazeEvents(state);
    if (gazeEvents.length > 0) {
      return gazeEvents[Math.floor(Math.random() * gazeEvents.length)];
    }
  }
  
  // 否则返回普通事件
  return getRandomNormalEvent(state);
}
```

### 添加自定义gaze效果

```typescript
// 在需要应用gaze效果的地方
import { getCurrentGazeEffects } from '@/logic/gazeEventSystem';

function applyCustomEffect(baseValue: number, state: GameState) {
  const { intensity, effects } = getCurrentGazeEffects(state);
  
  // 自定义效果: 高gaze时增加消耗
  if (intensity > 0.5) {
    return baseValue * (1 + intensity * 0.2);
  }
  
  return baseValue;
}
```

---

## 🔧 配置项

### 可调整参数

```typescript
// systemGaze.ts
const GAZE_TRIGGER_THRESHOLD = 0.3;  // 触发专属事件的最低强度

// archiveModifier.ts  
const MAX_PENALTY_REDUCTION = 0.67;   // 最大D选项减免
const ARCHIVE_SCALE_FACTOR = 20;      // 减免曲线平滑度

// eventValueStandard.ts
const LEVERAGE_MULTIPLIERS = {
  HOMELESS: 0.15,
  WORKER: 0.5,
  MIDDLE: 1.0,
  CAPITALIST: 2.0
};
```

### 里程碑配置

```typescript
// createGlobalProgressSlice.ts
const MILESTONES = {
  WORKER_UNLOCK: 10,
  MIDDLE_UNLOCK: 25,
  CAPITALIST_UNLOCK: 40,
  LINEAR_BONUS_EVERY: 3  // 每3个档案触发一次线性奖励
};
```

---

## 🧪 调试技巧

### 在控制台测试

```javascript
// 获取当前store
const store = window.__STORE__ || useGameStore.getState();

// 测试gaze强度计算
import { calculateGazeIntensity } from '@/logic/systemGaze';
console.log(calculateGazeIntensity(store.unlockedArchives.length));

// 测试D选项减免
import { calculateDOptionPenaltyReduction } from '@/logic/archiveModifier';
console.log(calculateDOptionPenaltyReduction(store.unlockedArchives.length));

// 解锁测试档案
store.unlockArchive('TEST_ARCHIVE_01');
```

### 常见调试场景

**场景1: gaze效果不生效**
- 检查 `unlockedArchives.length` 是否≥24
- 检查 `systemGaze.currentIntensity` 是否>0

**场景2: D选项减免不生效**
- 确认选择的是D选项
- 检查 `unlockedArchives.length` 是否>0
- 查看 `modifiers` 是否包含"档案减免"

**场景3: 里程碑弹窗不显示**
- 检查 `showMilestoneModal` 是否为true
- 检查 `pendingMilestone` 是否有值
- 确认是否调用了 `dismissMilestone()`

---

## 📚 相关文件

| 文件路径 | 用途 |
|----------|------|
| `src/logic/systemGaze.ts` | gaze强度计算、效果常量 |
| `src/logic/archiveModifier.ts` | 档案奖励计算 |
| `src/logic/gazeEventSystem.ts` | gaze事件触发逻辑 |
| `src/logic/eventResolver.ts` | 事件选项解析 |
| `src/store/slices/createGlobalProgressSlice.ts` | 跨运行进度状态 |
| `src/components/SystemGazeOverlay.tsx` | 视觉效果组件 |
| `src/components/ArchiveMilestoneModal.tsx` | 里程碑弹窗组件 |

---

## ⚡ 性能注意事项

1. **gaze强度计算**: 简单数学运算，无需缓存
2. **事件加载**: 使用Vite动态导入，已做缓存
3. **视觉效果**: 使用CSS动画，不阻塞主线程
4. **状态更新**: 批量处理，避免频繁重渲染

---

**最后更新**: 2026-01-15  
**维护者**: Dark Web Echoes Team
