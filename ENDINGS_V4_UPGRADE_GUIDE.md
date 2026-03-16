# 结局系统 V4 升级指南

## 主要变更

### 1. 所有结局新增 `roast` 字段
每个结局都包含一句系统吐槽语，在结局展示时延迟显示，增加黑色幽默效果。

### 2. 新增 `category` 字段
- `CLASSIC` - 经典结局（原有的22个）
- `TRUE_ENDING` - 真结局（ED-22）
- `IRONIC_DEATH` - 讽刺性死亡结局（新增的40个）

### 3. 全新 UI 组件 `GameEndingV2`
- 类型标识卡片（带图标和描述）
- 延迟显示的吐槽语区域
- 游戏统计展示（存活周数、资产、档案、工作）
- 类型特定的视觉效果

---

## 使用方式

### 步骤 1：合并结局数据

将原有的 `endings.json` 替换为 `endings_complete_v4.json`：

```typescript
// 在 dataLoader.ts 或相应文件中
import endingsData from '@/assets/data/endings_complete_v4.json';
```

### 步骤 2：替换 UI 组件

在父组件中使用新的 `GameEndingV2`：

```tsx
import { GameEndingV2 } from '@/components/game/GameEndingV2';

// 在渲染结局时
<GameEndingV2
  endingId={endingId}
  endingData={endingData}  // 包含 roast 字段的完整结局数据
  onRestart={handleRestart}
  onViewDeathSummary={handleViewSummary}
  stats={{
    turns: gameState.vitality.time.currentTurn,
    gold: gameState.vitality.metrics.gold,
    archives: gameState.unlockedArchives.length,
    jobs: gameState.vitality.activeJobs.length
  }}
/>
```

### 步骤 3：确保结局数据包含 roast 字段

对于原有的22个结局，已经添加了roast字段。对于新增的讽刺性结局，需要从 `endings_ironic_v3.json` 导入。

---

## 结局数据格式

```typescript
interface EndingData {
  id: string;           // 结局ID
  title: string;        // 结局标题
  description: string;  // 结局描述（叙事文本）
  roast: string;        // 💀 系统吐槽语（新增）
  priority: number;     // 优先级（1-5）
  type: EndingType;     // DEATH/SURVIVAL/ALIENATION/STANCE/UR
  category: string;     // CLASSIC/TRUE_ENDING/IRONIC_DEATH
  conditions?: {...};   // 触发条件
}
```

---

## UI 特性说明

### 1. 类型标识卡片
顶部显示结局类型，包含：
- 类型图标（💀🐀🌀⚡👑）
- 类型标签（死亡/苟活/异化/立场/超稀有）
- 类型描述

### 2. 吐槽语展示
- 延迟 2 秒后显示
- 带有 "SYSTEM COMMENT" 标签
- 斜体灰色文本，左侧边框装饰

### 3. 统计面板
显示玩家本次游戏的：
- 存活周数
- 最终资产（红色=负债，绿色=盈余）
- 收集档案数
- 工作次数

### 4. 视觉特效
- **死亡结局**：红色渐变背景脉冲
- **UR结局**：金色径向渐变+光点
- **真结局**：金色光芒+20个动态光点

---

## 结局类型颜色配置

| 类型 | 主色 | 背景 | 边框 | 图标 |
|------|------|------|------|------|
| DEATH | 红色 | red-950/30 | red-800 | 💀 |
| SURVIVAL | 灰色 | gray-900/50 | gray-700 | 🐀 |
| ALIENATION | 紫色 | purple-950/30 | purple-800 | 🌀 |
| STANCE | 青色 | cyan-950/30 | cyan-800 | ⚡ |
| UR | 金色 | amber-950/30 | amber-700 | 👑 |

---

## 迁移检查清单

- [ ] 替换 `endings.json` 为包含 roast 字段的版本
- [ ] 安装/更新 `GameEndingV2.tsx` 组件
- [ ] 更新调用组件的父组件代码
- [ ] 确保 `stats` 数据正确传递
- [ ] 测试所有结局类型的显示效果
- [ ] 验证吐槽语的延迟显示功能

---

## 示例截图描述

### 死亡结局（ED-01 冷冻披萨的温度）
```
┌─────────────────────────────────────┐
│  💀 死亡结局 · 系统淘汰了不合格的单位  │
├─────────────────────────────────────┤
│         ENDPOINT: ED-01             │
│                                     │
│     冷冻披萨的温度                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 验尸官说你是低体温症...       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💬 SYSTEM COMMENT            │   │
│  │ "在这个国家，连冻死都是一种   │   │
│  │  奢侈——至少你不用再担心账单了"│   │
│  └─────────────────────────────┘   │
│                                     │
│  [📜 查看死亡结算]                   │
│  [💀 开始新的轮回]                   │
└─────────────────────────────────────┘
```

### 真结局（ED-22 觉醒者）
```
┌─────────────────────────────────────┐
│  ⚡ 立场结局 · 你选择了站队           │
├─────────────────────────────────────┤
│     TRUE END // SYSTEM RESET        │
│                                     │
│  ✨ 觉醒者：系统重置 ✨               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 你带着上百次轮回的记忆...     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💬 SYSTEM COMMENT            │   │
│  │ "他花了35条命学习系统..."    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [🔁 进入新的轮回 // 带着记忆]        │
└─────────────────────────────────────┘
```
