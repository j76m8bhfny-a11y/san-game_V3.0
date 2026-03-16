# 代码文件大小审计报告

> 审计时间: 2026-03-16  
> 审计规则: 基于提供的代码行数标准

---

## 执行摘要

| 类别 | 总文件数 | 舒适区内 | 需关注 | 必须拆分 |
|------|---------|---------|--------|----------|
| 前端页面组件 (tsx) | 19 | 17 | 1 | 0 |
| 自定义 Hooks | 12 | 10 | 2 | 0 |
| Store/State 管理 | 13 | 4 | 2 | 7 |
| 工具函数 | 7 | 7 | 0 | 0 |
| 类型定义 | 6 | 6 | 0 | 0 |
| 逻辑/核心算法 | 26 | 20 | 2 | 4 |
| 样式文件 | 1 | 0 | 1 | 0 |
| 配置文件 | 3 | 3 | 0 | 0 |

### 风险等级分布
- 🔴 **严重 (必须拆分)**: 11 个文件
- 🟡 **警告 (超过可接受上限)**: 8 个文件  
- 🟢 **舒适区内**: 63 个文件

---

## 🔴 严重问题：必须拆分 (> 硬上限)

### 1. Store/State 管理文件 (API路由/控制器标准: 硬上限 800)

| 文件路径 | 行数 | 硬上限 | 超标率 | 建议 |
|---------|------|--------|--------|------|
| `src/store/slices/createGameSlice.ts` | 707 | 800 | -12% | 接近上限，建议拆分游戏逻辑 |
| `src/store/slices/createPrisonSlice.ts` | 514 | 800 | -36% | 可暂时保持，但建议拆分监狱系统 |
| `src/store/slices/createShopSlice.ts` | 563 | 800 | -30% | 可暂时保持 |
| `src/store/slices/createVehicleSlice.ts` | 596 | 800 | -26% | 可暂时保持 |
| `src/store/slices/createVitalitySlice.ts` | 607 | 800 | -24% | ✅ **正在重构中** |
| `src/store/slices/vitality/medical.ts` | 545 | 800 | -32% | 子模块，可接受 |
| `src/store/steam/useSteamStore.ts` | 468 | 500 | -6% | 接近可接受上限 |

**注**: Store 文件按 API 路由/控制器标准评估（硬上限 800）。目前虽然都低于 800 行，但多个文件已超过 500 行的可接受上限，建议提前规划拆分。

### 2. 逻辑/核心算法文件 (工具函数集标准: 硬上限 800)

| 文件路径 | 行数 | 硬上限 | 超标率 | 建议 |
|---------|------|--------|--------|------|
| `src/logic/survivalValueGenerator.ts` | 529 | 800 | -34% | 建议拆分为数据生成器 + 验证器 |
| `src/logic/survivalCalculator.ts` | 521 | 800 | -36% | 建议拆分为计算器 + 状态检查器 |
| `src/logic/dimensionModel.ts` | 509 | 800 | -37% | 建议按维度类型拆分 |
| `src/logic/survivalModel.ts` | 496 | 500 | -1% | 接近可接受上限，建议拆分 |

---

## 🟡 警告问题：超过可接受上限

### 1. 前端页面组件 (标准: 可接受上限 1200)

| 文件路径 | 行数 | 舒适区 | 状态 | 建议 |
|---------|------|--------|------|------|
| `src/components/game/MessageWindow.tsx` | 1110 | 200-600 | ⚠️ 接近硬上限 | 建议拆分为子组件：Header/Body/Footer/Options |

**MessageWindow.tsx 分析**:
- 当前 1110 行，距离 1500 硬上限还有 390 行余量
- 但已超过舒适区 600 行约 85%
- 建议拆分为：消息头部、消息主体、选项区域、动画效果等子组件

### 2. 自定义 Hooks (标准: 可接受上限 400)

| 文件路径 | 行数 | 舒适区 | 状态 | 建议 |
|---------|------|--------|------|------|
| `src/hooks/steam/useCloudSave.ts` | 265 | 50-200 | ⚠️ 超出舒适区 | 可接受，但建议分离 Steam API 调用逻辑 |
| `src/hooks/useGlobalKeyboard.ts` | 215 | 50-200 | ⚠️ 超出舒适区 | 可接受，但建议按键逻辑模块化 |

### 3. Store/State 管理 (标准: 可接受上限 500)

| 文件路径 | 行数 | 状态 | 建议 |
|---------|------|------|------|
| `src/store/slices/createFaithSlice.ts` | 434 | ⚠️ 接近上限 | 信仰系统复杂，建议拆分为 faithCore + faithRituals |
| `src/store/slices/createCryptoSlice.ts` | 358 | ✅ 可接受 | 暂时安全 |
| `src/store/slices/createGlobalProgressSlice.ts` | 366 | ✅ 可接受 | 暂时安全 |

### 4. 样式文件 (标准: 可接受上限 800)

| 文件路径 | 行数 | 状态 | 建议 |
|---------|------|------|------|
| `src/index.css` | 559 | ⚠️ 超出舒适区 | 建议按功能域拆分：animations.css, theme.css, utilities.css |

---

## 🟢 舒适区内：良好实践

### 优秀的模块化文件

| 文件路径 | 行数 | 评价 |
|---------|------|------|
| `src/store/slices/vitality/buffs.ts` | 302 | 拆分后舒适区内 |
| `src/store/slices/vitality/types.ts` | 67 | 类型定义清晰 |
| `src/store/slices/vitality/utils.ts` | 36 | 工具函数精简 |
| `src/store/slices/createBankSlice.ts` | 316 | 适中 |
| `src/utils/transaction.ts` | 177 | 适中 |
| `src/logic/class.ts` | 116 | 精简 |
| `src/logic/health.ts` | 113 | 精简 |

---

## 重构优先级建议

### P0 (立即处理)
1. **继续完成 VitalitySlice 重构** - 已拆分出 medical.ts 和 buffs.ts，主文件从 1445→607 行

### P1 (本周处理)
2. **MessageWindow.tsx 组件拆分** (1110行)
   - 拆分为 MessageHeader, MessageBody, MessageOptions, MessageAnimations
   
3. **逻辑文件拆分**
   - `survivalValueGenerator.ts` → 生成器 + 验证器
   - `survivalCalculator.ts` → 计算器 + 检查器

### P2 (下周处理)
4. **Store 文件逐步拆分**
   - `createGameSlice.ts` → 游戏核心 + 事件处理 + 存档管理
   - `createFaithSlice.ts` → 信仰核心 + 仪式系统

### P3 (月内处理)
5. **样式文件拆分**
   - `index.css` → 动画/主题/工具类分离
6. **Hooks 优化**
   - 分离 UI 逻辑与业务逻辑

---

## 规则对照表参考

| 文件类型 | 舒适区 | 可接受上限 | 硬上限 | 本项目状况 |
|---------|--------|-----------|--------|-----------|
| 前端页面组件 | 200-600 | 800-1200 | 1500 | 1个警告 |
| 基础 UI 组件 | 50-150 | 300 | 500 | 全部良好 |
| 工具函数集 | 100-300 | 500 | 800 | 全部良好 |
| Store/State | 100-300 | 500 | 800 | 7个需关注 |
| 自定义 Hooks | 50-200 | 400 | 600 | 2个警告 |
| 类型定义 | 无限制 | 无限制 | 2000+ | 全部良好 |
| 样式文件 | 200-500 | 800 | 1200 | 1个警告 |
| 配置文件 | 100-300 | 500 | 800 | 全部良好 |

---

## 附录：完整文件统计

```
=== 前端组件 (top 10) ===
1110 src/components/game/MessageWindow.tsx
 507 src/App.tsx
 413 src/components/game/DeathSummary.tsx
 412 src/components/ui/ClassChangeModal.tsx
 402 src/components/intro/IntroComic.tsx
 398 src/components/game/Crypto/CryptoSidebar.tsx
 381 src/components/game/IntroExperience.tsx
 362 src/components/game/SettingsModal.tsx
 360 src/components/game/PlayerStatsPanel.tsx
 350 src/components/transition/TurnTransition.tsx

=== Store 文件 ===
707 src/store/slices/createGameSlice.ts
607 src/store/slices/createVitalitySlice.ts
596 src/store/slices/createVehicleSlice.ts
563 src/store/slices/createShopSlice.ts
545 src/store/slices/vitality/medical.ts
514 src/store/slices/createPrisonSlice.ts
468 src/store/steam/useSteamStore.ts
434 src/store/slices/createFaithSlice.ts
429 src/store/useGameStore.ts
366 src/store/slices/createGlobalProgressSlice.ts
358 src/store/slices/createCryptoSlice.ts
316 src/store/slices/createBankSlice.ts
302 src/store/slices/vitality/buffs.ts

=== 逻辑文件 (top 10) ===
529 src/logic/survivalValueGenerator.ts
521 src/logic/survivalCalculator.ts
509 src/logic/dimensionModel.ts
496 src/logic/survivalModel.ts
468 src/logic/actionExecutorAdapter.ts
451 src/logic/archiveModifier.ts
426 src/logic/eventLoader.ts
393 src/logic/dimensionModel.example.ts
359 src/logic/systemGaze.ts
357 src/logic/deathAnalysis.ts
```

---

*报告结束*
