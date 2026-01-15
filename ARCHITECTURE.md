

# 📑 美式灵视：技术架构与选型规格书

# American Insight: Technical Architecture & Stack Specification

**版本**: Ver 5.0 (Diamond Master)
**日期**: 2024-2025
**适用范围**: Windows (Steam), macOS, iOS
**开发模式**: Vibe Coding (AI-Native)

---

## 1. 核心设计哲学 (Core Philosophy)

1. **AI 亲和性优先 (AI-First)**: 所有技术选型必须是 LLM (Claude 3.5/GLM-4.7) 训练数据最丰富、理解最深刻的栈。代码结构必须遵循“组件化 + 强类型”原则，以减少 AI 幻觉。
2. **表现与数据分离 (Decoupled Data)**: 游戏数值（Excel/MD）与游戏逻辑（React）严格物理分离。通过 Python 胶水脚本进行编译。
3. **原生级性能 (Native Performance)**: 尽管使用 Web 技术，但在 IO、存储和移动端适配上必须调用原生 API (Rust/Swift)，严禁使用 unstable 的 Web Hack 手段。

---

## 2. 技术选型矩阵 (Technology Matrix)

| 模块 | 选型 | 版本要求 | 核心理由 (Why Locked?) |
| --- | --- | --- | --- |
| **应用外壳** | **Tauri** | **2.0+** | Rust 后端保证 Steam/OS 文件操作权限；支持构建 iOS/Android；内存占用远低于 Electron。 |
| **UI 核心** | **React** | **18+** | AI 生成代码准确率最高；组件复用性强。 |
| **构建工具** | **Vite** | Latest | 极速热更新 (HMR)，提升 Vibe Coding 体验。 |
| **语言** | **TypeScript** | 5.0+ | **强制**。利用类型系统防止 AI 生成错误的数值计算逻辑。 |
| **状态管理** | **Zustand** | Latest | 极简 Flux 模式。配合 **Immer** 中间件处理复杂的嵌套状态（如历史记录）。 |
| **样式系统** | **Tailwind CSS** | 3.0+ | 原子化 CSS。配合 `clsx` 实现“蓝药丸/故障风”滤镜的毫秒级切换。 |
| **UI 组件库** | **Shadcn/UI** | Latest | 基于 Radix UI。代码可控性高，AI 能够完美生成和修改组件样式。 |
| **动效引擎** | **Framer Motion** | Latest | 负责卡牌抽取、账单拍脸、转场动画。 |
| **数据管道** | **JSON (Direct)** |   | **SSoT**. 利用 TypeScript 接口 + Zod 直接在前端运行时校验数据，移除所有 Python 依赖。 |
| **存储适配** | **@tauri-apps/plugin-fs** | 2.0+ | **严禁使用 localStorage**。必须写入物理文件以支持 Steam Cloud。 |

---

## 3. 系统架构图 (System Architecture) - [Revised]
graph TD
    subgraph "🧱 Data Layer (Static JSON)"
        JSON_Assets[src/assets/data/*.json] -->|Import| TS_Types[TypeScript/Zod Schema]
        TS_Types -->|Validation| Store[Zustand Store]
    end

---

## 4. 核心模块详细设计 (Module Specifications)

### 4.1. 存储与防闪烁系统 (Storage & Hydration)

* **问题**: 异步读取文件会导致 UI 先显示初始值再跳变。
* **方案**:
1. Store 中维护 `_hasHydrated: boolean`。
2. `onRehydrateStorage` 回调中将标记设为 true。
3. `RootLayout` 拦截渲染：若 `!_hasHydrated`，显示纯黑 Loading 屏。


* **路径**: Windows (`%AppData%/Local/AmericanInsight/saves/`), iOS (`App Documents`).

### 4.2. 视觉滤镜系统 (Visual Filter System)

利用 Tailwind 的父级类名控制全局 CSS 变量与 Filter。

* **蓝药丸 (SAN 0-30)**: `filter: sepia(0.3) contrast(0.9);`
* **裂痕 (SAN 31-70)**: `filter: contrast(1.2) hue-rotate(-5deg);`
* **古神 (SAN 71-100)**: `filter: invert(0.9) grayscale(0.5); font-family: 'Creepster';`

### 4.3. 移动端适配标准 (Mobile Standards)

所有 UI 组件必须通过 CSS 解决以下原生冲突：

* **安全区域**: `padding: env(safe-area-inset-top) ...`
* **手势冲突**: `touch-action: manipulation` (禁用双击缩放)。
* **长按禁用**: `user-select: none` (防止长按弹出复制菜单)。

### 4.4. 权限访问控制 (Tauri ACL)

在 `src-tauri/capabilities/default.json` 中必须显式开启：

```json
{
  "permissions": [
    "fs:default",
    { "identifier": "fs:allow-app-local-data-recursive", "allow": [{ "path": "$APP_LOCAL_DATA/**" }] }
  ]
}

```

---

## 5. 项目目录结构 (Directory Structure)

```text
AmericanInsight/
├── public/                 # 静态资源 (Audio, Fonts)
├── src-tauri/              # Rust 后端 (Tauri 2.0)
│   ├── capabilities/       # 权限配置 (ACL)
│   └── tauri.conf.json     # 核心配置
├── src/                    # 前端源码 (React)
│   ├── assets/
│   │   └── data/           # [生成的] 游戏静态数据 (items.json, bills.json)
│   ├── components/
│   │   ├── layout/         # RootLayout, ThemeWrapper
│   │   ├── ui/             # Shadcn 基础组件
│   │   └── game/           # 业务组件 (Dashboard, Card, History)
│   ├── hooks/              # 逻辑 Hooks (useTurnSystem)
│   ├── store/              # Zustand Stores
│   │   └── useGameStore.ts # 全局状态 + 持久化逻辑
│   ├── types/              # TS 类型定义 + Zod Schemas
│   ├── utils/              # 工具库
│   │   └── storage.ts      # Tauri FS 适配器
│   ├── App.tsx             # 路由入口
│   └── index.css           # 全局样式 (Tailwind + Mobile Fixes)
└── package.json

```

---

## 6. 开发工作流 (Development Workflow)

### 阶段一：数据维护 (Data Maintenance)
1. **SSoT**: 直接编辑 `src/assets/data/*.json`。
2. **Validation**: 编辑后，TypeScript/Zod 会自动在运行时校验数据结构。

### 阶段二：AI 辅助编程 (Vibe Coding)

在使用 Cursor / VSCode 生成代码时，必须在 Prompt 中包含以下约束：

> "你是一个 Tauri + React 专家。请遵循以下规则：
> 1. **状态管理**：使用 `useGameStore`，并通过 selectors 读取数据（如 `useGameStore(s => s.gold)`）以优化性能。
> 2. **类型安全**：所有数据输入必须经过 `Zod` Schema 校验。
> 3. **移动端优先**：生成的 CSS 必须包含 `touch-action: manipulation` 和 `user-select: none`。
> 4. **样式**：使用 Tailwind CSS，不要写行内样式。"
> 
> 

### 阶段三：构建与发布 (Build)

* **Web 预览**: `npm run tauri dev` (使用模拟存储)。
* **Steam 构建**: `npm run tauri build --target x86_64-pc-windows-msvc`。
* **iOS 构建**: `npm run tauri ios build` (需 macOS 环境)。

---

## 7. 风险控制检查表 (Risk Checklist)

* [ ] **ACL**: 确认 `tauri.conf.json` 已加载 `fs:allow-app-local-data-recursive` 权限。
* [ ] **Zod**: 确认 `src/assets/data/*.json` (SSoT) 能通过 `src/types/schema.ts` 的校验。 
* [ ] **Hydration**: 确认 `RootLayout` 在 `_hasHydrated` 为 false 时阻断了 UI 渲染。
* [ ] **Performance**: 确认历史记录列表使用了 `<Virtuoso />` (虚拟滚动)。
