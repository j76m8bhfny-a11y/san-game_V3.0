
# 📝 TODO.md: American Insight 开发任务清单 (Optimized v2)

> **⚠️ Vibe Coding 指南**
> * **核心原则**: **集成胜于重写 (Integration over Implementation)**。核心数值逻辑已存在于 `src/logic/` 中，请优先通过 import 调用，严禁让 AI 重新生成数学公式。
> * **资源路径**: 音频文件一律放入 `public/audio/`，代码中使用绝对路径 `/audio/xxx.mp3` 引用。
> 
> 

## 🚀 Phase 1: 基础设施与数据管道 (Infrastructure & Data)

> **目标**：建立坚固的类型系统和数据校验机制，防止 AI 幻觉导致的数值错误。

* [ ] **Task 1.1: 工程初始化与依赖锁定**
* **目标**: 确保 Tauri + React + TypeScript 环境就绪，安装架构书规定的核心库。
* **行动**:
* 初始化 Tauri 2.0 项目。
* 安装 `zustand` (状态管理), `zod` (校验), `clsx` & `tailwind-merge` (样式), `framer-motion` (动画), `howler` (音频)。
* 配置 `tailwind.config.js` (导入提供的颜色、字体和动画配置)。


* **验证**: `npm run tauri dev` 成功启动，且 Tailwind 自定义颜色（如 `bg-neutral-900`）生效。


* [ ] **Task 1.2: Zod Schema 定义与数据校验**
* **目标**: 将 JSON 文件转化为强类型数据。
* **行动**:
* 在 `src/types/schema.ts` 中完善 `ItemSchema`, `EventSchema`, `BillSchema`, `EndingSchema`。
* **关键**: 确保 `EventOptionSchema` 中包含 `items` (物品变更) 字段。


* **验证**: 创建一个测试脚本，能够无报错地 import 所有 `src/assets/data/*.json` 文件并通过 Zod Parse。


* [ ] **Task 1.3: 全局字体与资源配置**
* **目标**: 加载 Google Fonts (Creepster) 和本地资源。
* **行动**:
* 在 `index.html` 或 CSS 中引入 Creepster, Inter, Space Mono 字体。
* 确保 `src/assets/data` 目录结构正确。


* **验证**: 页面能正确显示中文字符，且 SAN 值高时能渲染 Creepster 字体。



## 🧠 Phase 2: 核心状态机与逻辑 (Core Logic & State)

> **目标**：实现“不可更改骨架” (The Locked Loop)，**直接复用 `src/logic/` 下的现有代码**。

* [x] **Task 2.1: Zustand Store 核心构建 (Skeleton Ready)**
    * **状态**: ✅ 已手动创建 `src/store/useGameStore.ts` 骨架。
    * **目标**: 填充 `nextDay`, `buyItem`, `chooseOption` 的具体业务逻辑。
    * **行动**:
        * 导入 `src/assets/data/*.json` 数据。
        * 在 `nextDay` 中调用 `src/logic/core.ts` 的计算函数。
        * 确保 `shopItems` getter 能根据 `gold` 和 `hp` 返回正确的商品列表。


* **验证**: 刷新页面后，Console 输出 `Hydration finished`，且 Gold/HP 数值保持刷新前状态。


* [ ] **Task 2.2: 回合流转系统 (Turn System)**
* **目标**: 实现 Day Start -> Event -> Settlement -> Day End 闭环。
* **行动**:
* 实现 `nextDay()` Action。
* **集成**: Import `checkClassUpdate` (from `src/logic/core.ts`) 更新阶级。
* **集成**: Import `calcSalary` (from `src/logic/core.ts`) 计算薪资。
* **集成 (Passive Dismantlement)**: 在 Day End 阶段调用 `humanDismantlementCheck(..., type='PASSIVE')`。若返回触发，强制执行：债清、HP上限减半。


* **验证**:
1. 调用 `nextDay()`，天数+1，金币扣除维护费。
2. **死锁测试**: 将状态设为 `Homeless` + `DebtDay=3`，调用 `nextDay()`，验证 HP 上限是否减半且债务清零。




* [ ] **Task 2.3: 事件与交互引擎 (Event Engine)**
* **目标**: 实现事件抽取与选项执行。
* **行动**:
* 实现 `triggerEvent()`：根据 SAN 值和 Class 筛选 `events.json`。
* 实现 `chooseOption(optionId)`：执行 HP/SAN/Gold 变更，写入历史记录。
* **关键**: 处理 `D选项` 的锁 (SAN Lock) 和乱码逻辑。


* **验证**: 模拟 SAN=80，触发事件时能看到 D 选项；模拟 SAN=20，D 选项隐藏或不可点。


* [ ] **Task 2.4: 账单与商店系统 (Economy System)**
* **目标**: 实现经济模型，**复用核心计算函数**。
* **行动**:
* **集成**: Import `triggerBill` (from `src/logic/core.ts`) 在 Settlement 阶段判断是否弹出账单。
* 实现 `buyItem()`：检查金币，应用 Effect，更新 Inventory。
* **集成 (Active Dismantlement)**: 在 `buyItem` 中监听特殊 Item ID (或独立 Action)，调用 `humanDismantlementCheck(..., type='ACTIVE')`。


* **验证**:
1. 多次结算验证账单触发概率 (负债时约 16%)。
2. 金币设为 -2500，验证是否能触发主动拆解逻辑。





## 🎨 Phase 3: 界面组装 (UI Composition - Ver 7.0)

> **目标**：实现“数字考古”风格的 Material UI。

* [ ] **Task 3.1: 视差场景与主控台 (The Stage)**
    * **目标**: 实现 L0 (Canvas) 和 L1 (HUD)。
    * **行动**:
        * 实现 `LayeredScene`: 支持背景/事件/玩家三层视差及 Glitch 效果。
        * 实现 `MiniHUD`: 顶部悬浮的液晶屏样式数值显示。
        * 实现 `MessageWindow`: 底部打字机效果终端，集成选项交互。
    * **资产**: 若无图片，使用 CSS 纯色块占位，确保逻辑跑通。

* [ ] **Task 3.2: 功能介质窗口 (The Mediums)**
    * **目标**: 实现 L2 (Windows) 的差异化风格。
    * **行动**:
        * 开发 `ShopModal`: **Win98 风格**，包含蓝色标题栏和复古按钮。
        * 开发 `BlackBox`: **微缩胶片风格**，高噪点、黑白反差。
    * **验证**: 打开商店应有弹窗感，背景变暗但可见。

* [ ] **Task 3.3: 物理材质层 (The Overlay)**
    * **目标**: 实现 L3 (Bill) 的热敏纸质感。
    * **行动**:
        * 开发 `BillOverlay`: 使用 `clip-path` 实现锯齿边缘，应用 `animate-bill-entry` 进场动画。
        * **集成**: 确保点击 "Pay" 按钮能正确回调支付逻辑。

* [ ] **Task 3.4: 全局氛围与反馈 (Atmosphere)**
    * **目标**: 实现 L4 (Feedback) & L5 (CRT)。
    * **行动**:
        * 更新 `GlobalAtmosphere`: 加入 SVG 噪点和暗角。
        * 实现 `TooltipLayer`: 跟随鼠标的 Debug 风格提示。



## 🔊 Phase 4: 感官层 (Sensory Layer)

> **目标**：实现 **Public 目录直读** 的音频方案，降低构建复杂度。

* [ ] **Task 4.1: 音频系统 (Audio Engine)**
* **目标**: 集中管理 SFX 和 BGM，绕过 Vite Import。
* **行动**:
* **资源策略**: 建立 `public/audio/` 目录，放入测试音频文件。
* 创建 `useAudioStore`，封装 Howler.js。
* **实现**: `play` 方法直接引用绝对路径，例如 `new Howl({ src: ['/audio/sfx_cash.mp3'] })`。
* 在 `buyItem`, `triggerBill` 等关键节点埋点调用。


* **验证**: 运行 `npm run tauri dev`，购买物品时能清晰听到音效，且浏览器控制台无 404 错误。


* [ ] **Task 4.2: 震动反馈 (Haptics)**
* **目标**: 移动端物理反馈。
* **行动**:
* 集成 `@tauri-apps/plugin-haptics`。
* 编写 `HapticService`，根据伤害量级触发不同震动 (Light/Heavy)。


* **验证**: (需真机或模拟器) 扣血时触发震动。



## 🧪 Phase 5: 交付与构建 (Delivery)

* [ ] **Task 5.1: 完整性测试 (Playtest)**
* **行动**: 跑通 40 天流程，尝试触发至少 3 种不同结局 (Worker存活, 死亡, 觉醒)。


* [ ] **Task 5.2: 构建打包**
* **行动**: 运行 `npm run tauri build`。
