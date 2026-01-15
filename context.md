
# Project Context: American Insight (美式灵视)

> **⚠️ SYSTEM PROMPT INSTRUCTION**
> This document serves as the **Single Source of Truth** for the "American Insight" project.
> **CRITICAL UPDATE**: This version (Omega Patched) supersedes all previous architecture docs.
> **Core Changes**:
> 1. **NO Python ETL**: JSON files in `src/assets/data/` are now the **primary** source of truth.
> 2. **Strict Hydration Gate**: UI rendering MUST be blocked until storage is fully loaded.
> 3. **Sensory Layer Added**: Centralized Audio & Haptics architecture is now mandatory.
> 
> 

## 1. Project Overview

**American Insight (美式灵视)** 是一款现实主义恐怖与资源管理结合的 AVG 游戏。

* **Slogan**：“如果生活欺骗了你，那是因为你没看用户协议。”
* **核心体验**：在 **40 个回合**内，玩家需要在 **HP (生存)** 与 **Gold (阶级)** 的双重压力下，平衡 **SAN (认知/灵视)**，通过收集档案达成结局。
* **核心冲突**：
* **贫穷陷阱**：阶级壁垒指数级上升，底层容错率为零。
* **觉醒代价**：SAN 值越高（越清醒），薪资越低，看到的恐怖真相越多。



## 2. Tech Stack (Locked & Optimized)

| 模块 | 选型 | 关键说明 |
| --- | --- | --- |
| **App Shell** | **Tauri 2.0+** | Rust 后端保证文件系统权限与低内存占用。 |
| **UI Framework** | **React 18+** | Functional Components + Hooks。 |
| **Language** | **TypeScript 5.0+** | **强制强类型**。所有 JSON 数据必须拥有对应的 Zod Schema。 |
| **State Mgmt** | **Zustand** | 全局状态。**必须使用 `persist` 中间件 + `onRehydrateStorage` 回调。** |
| **Data Source** | **JSON (Direct)** | **SSoT (Single Source of Truth)**. 直接编辑 `src/assets/data/*.json`。禁止外部 ETL 脚本。 |
| **Audio Engine** | **Howler.js** | 通过 `useAudioStore` 统一管理 SFX/BGM，严禁组件内直接 `new Audio()`。 |
| **Haptics** | **Tauri Plugin** | 使用 `@tauri-apps/plugin-haptics` (iOS) 或模拟震动 (PC)。 |
| **Styling** | **Tailwind CSS** | 配合 `clsx` 处理动态类名。 |

## 3. Project Structure

```text
AmericanInsight/
├── public/
        └── audio/            # [New] 音效与背景音乐
├── _design_docs/             # [Reference Only] 仅作灵感参考，不再作为数据源
├── src-tauri/                # [Rust] Tauri 后端配置
│   ├── capabilities/         # ACL 权限配置 (fs:allow-app-local-data-recursive)
│   └── tauri.conf.json       # 核心配置
├── src/                      # [Frontend] React 源码
│   ├── assets/
│   │   ├── data/             # [SSoT] 核心数据源 (items.json, events.json) - AI 直接维护此目录
│   ├── components/
│   │   ├── layout/           # RootLayout (含 Hydration Gate)
│   │   ├── ui/               # 基础 UI (含 FeedbackLayer, TooltipLayer)
│   │   └── game/             # 业务组件
│   ├── hooks/                # 逻辑 Hooks
│   ├── logic/                # [Core] 纯 TS 游戏核心逻辑 (endings.ts, core.ts)
│   ├── store/                # Zustand Stores
│   │   ├── useGameStore.ts   # 核心状态 (Flags, Inventory)
│   │   └── useAudioStore.ts  # [New] 音频状态 (Volume, Mute, Playlist)
│   ├── services/             # [New] 单例服务
│   │   └── HapticService.ts  # [New] 震动反馈适配器
│   ├── types/                # TypeScript 类型定义
│   │   └── schema.ts         # Zod Schemas (JSON 数据的类型守门员)
│   ├── App.tsx               # 路由入口
│   └── index.css             # 全局样式
└── package.json

```

## 4. Key Logic & Axioms

### 4.1. The 4 Development Axioms (核心公理)

1. **JSON 为王 (JSON Supremacy)**：任何数值平衡修改（如物品价格、薪资系数），必须直接修改 JSON 文件，而不是修改代码常量。
2. **结局逻辑覆盖权**：`src/logic/endings.ts` 拥有最高优先级。
3. **死锁保护**：
* 平局优先级：Old > Red > Wolf。
* 阶级跌落瞬间，债务计数器重置。


4. **人体拆解逻辑**：
* 主动：Gold < -2000 可见。
* 被动：Homeless + 债务 >= 3天 强制触发。
* 结果：债清，MaxHP * 0.5。



### 4.2. Critical Flows (关键流)

**A. 启动与防水闸 (Startup & Hydration Gate)**

* App 启动 -> `useGameStore` 开始初始化。
* **RootLayout 拦截**：检查 `_hasHydrated` 标记。
* `false`: 渲染纯黑/Loading 界面。**禁止渲染任何游戏组件 (App.tsx 内容)**。
* `true`: 此时 Zustand 已从磁盘读完数据，渲染 `Dashboard`。


* *目的*：防止 SAN 值从 default(50) 瞬间跳变到存档值(90)，导致滤镜闪烁。

**B. 核心循环 (Core Loop)**

1. **Day Start**: 渲染滤镜 -> 强制划定阶级。
2. **Event**: 抽取事件 -> 计算薪资 (Awakening Penalty)。
3. **Choice**: 玩家决策。
4. **Settlement**: 更新数值 -> **触发 Audio/Haptic 反馈**。
5. **Bill Check**: 每日 8% (负债 16%) 概率。
6. **Next Day**: 自动保存。

## 5. Development Rules

### 5.1. AI-First Workflow (Vibe Coding)

* **Modify Data**: 当需要调整数值时，告诉 AI "Update items.json"，而不是修改代码。
* **Schemas**: 在修改 JSON 结构前，**必须先更新 `src/types/schema.ts**` 中的 Zod Schema。

### 5.2. Sensory Implementation (Audio & Haptics)

* **Centralized Audio**: 所有声音播放必须调用 `useAudioStore.getState().play(sfxId)`。
* **Haptic Triggers**:
* HP 扣除 > 10: `Heavy Impact`
* SAN 变化 > 5: `Light Tingle`
* 结局达成: `Notification Success/Error`


* **Mute Support**: 必须在 `useAudioStore` 中支持全局静音，且持久化保存设置。

### 5.3. Visual & UI

* **Hydration**: 必须实现 `onRehydrateStorage` 回调来翻转 `_hasHydrated` 状态。
* **Tailwind**: 严禁行内样式。移动端适配需加 `touch-action: manipulation`。

### 5.4. Error Handling

* **Graceful Degrade**: 音频文件加载失败不应导致游戏崩溃（Catch Promise errors）。
* **Zod Parse**: JSON 加载时若校验失败，应 Fallback 到默认值并 Log 错误，而不是白屏。
