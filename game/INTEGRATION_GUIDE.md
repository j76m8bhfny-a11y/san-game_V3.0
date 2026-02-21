# 档案系统与System Gaze集成指南

## 概述

本文档说明如何将新的档案系统、System Gaze系统和标准化事件格式集成到现有游戏中。

## 已完成的工作

### 1. 核心系统文件

| 文件 | 功能 |
|------|------|
| `src/logic/eventValueStandard.ts` | 标准化事件数值体系 |
| `src/logic/archiveModifier.ts` | 档案奖励中间件（装饰器模式） |
| `src/logic/systemGaze.ts` | 系统凝视动态难度 |
| `src/logic/eventLoader.ts` | 事件动态加载器 |
| `src/logic/actionExecutorAdapter.ts` | ActionExecutor集成适配器 |

### 2. 状态管理

| 文件 | 功能 |
|------|------|
| `src/store/globalProgressSlice.ts` | 跨运行全局进度存储 |

### 3. UI组件

| 文件 | 功能 |
|------|------|
| `src/components/SystemGazeOverlay.tsx` | 系统凝视视觉效果覆盖层 |
| `src/components/ArchiveMilestoneModal.tsx` | 档案里程碑解锁弹窗 |

### 4. 已迁移事件

15个HOMELESS事件已迁移到新格式（`EVT_H01` ~ `EVT_H15`）。

## 集成步骤

### Step 1: 更新Store配置

在 `src/store/store.ts` 中添加 `globalProgress` reducer：

```typescript
import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import globalProgressReducer from './globalProgressSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    globalProgress: globalProgressReducer, // 添加这一行
  },
});
```

### Step 2: 应用初始化时加载全局进度

在 `App.tsx` 或游戏初始化逻辑中：

```typescript
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { hydrateGlobalProgress } from '@/store/globalProgressSlice';

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // 加载跨运行进度
    dispatch(hydrateGlobalProgress());
  }, [dispatch]);
  
  // ...
}
```

### Step 3: 包裹游戏内容以显示System Gaze效果

```tsx
import { SystemGazeOverlay } from '@/components/SystemGazeOverlay';

function GameContainer() {
  return (
    <SystemGazeOverlay>
      {/* 游戏主内容 */}
      <GameMain />
    </SystemGazeOverlay>
  );
}
```

### Step 4: 添加档案里程碑弹窗

在顶层组件中添加：

```tsx
import { ArchiveMilestoneModal } from '@/components/ArchiveMilestoneModal';

function App() {
  return (
    <>
      <GameContainer />
      <ArchiveMilestoneModal />
    </>
  );
}
```

### Step 5: 修改ActionExecutor

在现有的 `ActionExecutor.ts` 中，修改效果计算逻辑：

```typescript
import { 
  applyArchiveAndGazeModifiers,
  processArchiveUnlock 
} from '@/logic/actionExecutorAdapter';
import { unlockArchive } from '@/store/globalProgressSlice';

class ActionExecutor {
  executeEffect(effect, optionType, eventData) {
    const state = store.getState();
    
    // 使用适配器计算最终效果（应用档案奖励和System Gaze）
    const finalEffect = applyArchiveAndGazeModifiers(
      effect,
      state,
      optionType,
      eventData
    );
    
    // 应用效果到游戏状态
    this.applyToGameState(finalEffect);
    
    // 处理档案解锁（如果是D选项且有archiveId）
    if (optionType === 'D' && eventData.archiveId) {
      const unlockResult = processArchiveUnlock(state, eventData.archiveId);
      if (unlockResult.success && unlockResult.isNew) {
        store.dispatch(unlockArchive({ archiveId: eventData.archiveId }));
      }
    }
    
    return finalEffect;
  }
}
```

### Step 6: 事件加载器切换

将事件加载从旧文件切换到新的事件索引：

```typescript
import { loadEvent, loadEventsByCategory } from '@/assets/data/events';

// 旧方式：从events.json导入
// import events from '@/assets/data/events.json';

// 新方式：动态加载
async function loadGameEvents() {
  // 加载所有已迁移的HOMELESS事件
  const homelessEvents = await loadEventsByCategory('HOMELESS');
  return homelessEvents;
}
```

## 数值变化说明

### 标准化前后对比

| 选项 | 旧数值 | 新数值 | 变化说明 |
|------|--------|--------|----------|
| A (LEVERAGE) | gold:300, hp:-3, insightGain:4 | gold:150, hp:-12, insightGain:8(5) | 降低金币，增加HP消耗 |
| B (FIXED) | gold:50, hp:2, insightGain:2 | gold:25, hp:-3, insightGain:1 | HP改为消耗 |
| C (INCOME) | gold:-0.2, hp:8, insightClear:2 | gold:-0.15, hp:8, insight:-10 | insightClear → insight(负值) |
| D (TRUTH) | gold:-0.4, hp:-8, insightClear:10 | gold:-100, hp:-18, insight:-10 | 固定值比例，增加惩罚 |

### 档案奖励

- **每3个档案**：D选项惩罚减少约5%
- **最大减免**：67%（约80个档案时达到）

### System Gaze效果

| 档案数 | 凝视强度 | 效果 |
|--------|----------|------|
| 0-20 | 0% | 无效果 |
| 40 | 33% | 轻微惩罚 |
| 60 | 67% | 中等惩罚 |
| 80+ | 100% | 最大惩罚 |

## 测试检查清单

- [ ] 全局进度正确保存到LocalStorage/Steam Cloud
- [ ] 游戏重启后档案解锁状态保留
- [ ] 选择D选项后档案正确解锁
- [ ] 里程碑弹窗在达到阈值时显示
- [ ] System Gaze视觉效果随档案数增加而变化
- [ ] 数值计算正确应用档案奖励
- [ ] 事件加载器能正确加载新格式事件

## 已知问题与限制

1. **事件数量**：目前只迁移了15个HOMELESS事件，剩余需要继续迁移
2. **WORKER/MIDDLE/CAPITALIST事件**：尚未创建，需要在达到里程碑阈值后解锁
3. **System Gaze专属事件**：需要创建8个特殊事件

## 后续工作

1. 继续迁移剩余的HOMELESS事件（EVT_16 ~ EVT_67）
2. 创建WORKER阶级60个事件
3. 创建MIDDLE阶级60个事件  
4. 创建CAPITALIST阶级60个事件
5. 创建COMMON通用30个事件
6. 创建System Gaze专属8个事件
7. 测试完整游戏循环
