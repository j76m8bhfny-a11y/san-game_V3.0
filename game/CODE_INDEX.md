# 🎮 游戏项目代码目录索引

> 本文档用于素材整合阶段和UI调整阶段的快速AI索引，减少Token消耗

---

## 📁 目录结构概览

```
game/
├── src/                    # 核心源代码
│   ├── components/         # React组件
│   ├── store/              # 状态管理
│   ├── logic/              # 业务逻辑
│   ├── systems/            # 核心系统
│   ├── types/              # 类型定义
│   ├── hooks/              # 自定义Hooks
│   ├── utils/              # 工具函数
│   ├── config/             # 配置文件
│   ├── i18n/               # 国际化
│   └── assets/data/        # 游戏数据
├── public/assets/          # 静态资源
├── docs/                   # 设计文档
├── scripts/                # 脚本工具
└── src-tauri/              # Tauri桌面端
```

---

## 🧩 核心组件 (`src/components/`)

### 游戏场景组件 (`game/`)
| 路径 | 说明 |
|------|------|
| `scenes/` | 场景管理 |
| `scenes/BaseScene.tsx` | 场景基类 |
| `scenes/SceneManager.tsx` | 场景管理器 |
| `scenes/SlumsScene.tsx` | 贫民窟场景 |
| `scenes/DowntownScene.tsx` | 市中心场景 |
| `scenes/SuburbsScene.tsx` | 郊区场景 |
| `scenes/RustBeltScene.tsx` | 铁锈带场景 |

### UI系统组件 (`ui/`)
| 路径 | 说明 |
|------|------|
| `AtmosphereOverlay.tsx` | 氛围遮罩 |
| `DangerHints.tsx` | 危险提示 |
| `FeedbackLayer.tsx` | 反馈层 |
| `GlobalAtmosphere.tsx` | 全局氛围 |
| `GuardianHints.tsx` | 守护提示 |
| `InsightMilestones.tsx` | 洞察里程碑 |
| `ModalQueueManager.tsx` | 弹窗队列管理 |
| `ProgressiveUnlock.tsx` | 渐进解锁 |
| `ResourceHint.tsx` | 资源提示 |
| `SanityText.tsx` | 理智文本效果 |
| `TooltipLayer.tsx` | 提示层 |

### 功能模块组件
| 路径 | 说明 |
|------|------|
| `game/TitleScreen.tsx` | 标题界面 |
| `game/MapDashboard.tsx` | 地图仪表盘 |
| `game/MapPin.tsx` | 地图标记 |
| `game/MessageWindow.tsx` | 消息窗口 |
| `game/MiniHUD.tsx` | 迷你HUD |
| `game/PlayerStatsPanel.tsx` | 玩家状态面板 |
| `game/WeeklySettlement.tsx` | 周结算 |
| `game/DeathSummary.tsx` | 死亡总结 |
| `game/GameEnding.tsx` | 游戏结局 |
| `game/PauseMenu.tsx` | 暂停菜单 |
| `game/SettingsModal.tsx` | 设置弹窗 |
| `game/DebugPanel.tsx` | 调试面板 |

### 银行系统 (`game/bank/`)
| 路径 | 说明 |
|------|------|
| `bank/` | 银行系统根目录 |
| `bank/SlumsBank.tsx` | 贫民窟银行 |
| `bank/DowntownBank.tsx` | 市中心银行 |
| `bank/SuburbsBank.tsx` | 郊区银行 |
| `bank/RustBeltBank.tsx` | 铁锈带银行 |
| `bank/components/` | 银行子组件 |

### 医疗系统 (`game/medical/`)
| 路径 | 说明 |
|------|------|
| `medical/` | 医疗系统根目录 |
| `medical/SlumsMedical.tsx` | 贫民窟医疗 |
| `medical/DowntownMedical.tsx` | 市中心医疗 |
| `medical/SuburbsMedical.tsx` | 郊区医疗 |
| `medical/RustBeltMedical.tsx` | 铁锈带医疗 |
| `medical/components/` | 医疗子组件 |

### 住房系统 (`game/housing/`)
| 路径 | 说明 |
|------|------|
| `housing/` | 住房系统根目录 |
| `housing/SlumsHousing.tsx` | 贫民窟住房 |
| `housing/DowntownHousing.tsx` | 市中心住房 |
| `housing/SuburbsHousing.tsx` | 郊区住房 |
| `housing/RustBeltHousing.tsx` | 铁锈带住房 |
| `housing/components/` | 住房子组件 |

### 信仰系统 (`game/faith/`)
| 路径 | 说明 |
|------|------|
| `faith/` | 信仰系统根目录 |
| `faith/SlumsFaith.tsx` | 贫民窟信仰 |
| `faith/DowntownFaith.tsx` | 市中心信仰 |
| `faith/SuburbsFaith.tsx` | 郊区信仰 |
| `faith/RustBeltFaith.tsx` | 铁锈带信仰 |
| `faith/components/` | 信仰子组件 |

### 商店系统 (`game/shops/`)
| 路径 | 说明 |
|------|------|
| `shops/` | 商店系统根目录 |
| `shops/SlumsShop.tsx` | 贫民窟商店 |
| `shops/DowntownShop.tsx` | 市中心商店 |
| `shops/SuburbsShop.tsx` | 郊区商店 |
| `shops/RustBeltShop.tsx` | 铁锈带商店 |
| `shops/components/` | 商店子组件 |

### 载具系统 (`game/vehicle/`)
| 路径 | 说明 |
|------|------|
| `vehicle/VehicleShopModal.tsx` | 载具商店弹窗 |
| `vehicle/config/` | 载具配置 |
| `vehicle/hooks/` | 载具Hooks |
| `vehicle/panels/` | 载具面板 |
| `vehicle/sections/` | 载具区块 |

### Steam集成 (`steam/`)
| 路径 | 说明 |
|------|------|
| `steam/SteamInitializer.tsx` | Steam初始化 |
| `steam/AchievementPanel.tsx` | 成就面板 |
| `steam/AchievementNotification.tsx` | 成就通知 |
| `steam/CloudSavePanel.tsx` | 云存档面板 |
| `steam/SteamStatusIndicator.tsx` | Steam状态指示器 |

### 特效组件 (`fx/`)
| 路径 | 说明 |
|------|------|
| `fx/GlitchText.tsx` | 故障文字效果 |
| `fx/GlitchUI.tsx` | 故障UI效果 |

---

## 🏪 状态管理 (`src/store/`)

### Store切片 (`slices/`)
| 路径 | 说明 |
|------|------|
| `createGameSlice.ts` | 游戏核心状态 |
| `createPlayerSlice.ts` | 玩家状态 |
| `createSurvivalSlice.ts` | 生存状态 |
| `createVitalitySlice.ts` | 活力状态 |
| `createHousingSlice.ts` | 住房状态 |
| `createJobSlice.ts` | 工作状态 |
| `createBankSlice.ts` | 银行状态 |
| `createFaithSlice.ts` | 信仰状态 |
| `createInsuranceSlice.ts` | 保险状态 |
| `createShopSlice.ts` | 商店状态 |
| `createCryptoSlice.ts` | 加密状态 |
| `createPrisonSlice.ts` | 监狱状态 |
| `createVehicleSlice.ts` | 载具状态 |
| `createUISlice.ts` | UI状态 |
| `createGlobalProgressSlice.ts` | 全局进度 |
| `createSystemSlice.ts` | 系统状态 |

### Steam Store
| 路径 | 说明 |
|------|------|
| `steam/useSteamStore.ts` | Steam状态管理 |

### 主Store
| 路径 | 说明 |
|------|------|
| `useGameStore.ts` | 主游戏Store |
| `useAudioStore.ts` | 音频Store |
| `useTooltipStore.ts` | 提示Store |

---

## 🧠 业务逻辑 (`src/logic/`)

| 路径 | 说明 |
|------|------|
| `core.ts` | 核心逻辑 |
| `ActionExecutor.ts` | 动作执行器 |
| `ActionExecutorEnhanced.ts` | 增强动作执行器 |
| `eventResolver.ts` | 事件解析器 |
| `eventLoader.ts` | 事件加载器 |
| `eventMigrator.ts` | 事件迁移器 |
| `survivalModel.ts` | 生存模型 |
| `survivalCalculator.ts` | 生存计算器 |
| `dimensionModel.ts` | 维度模型 |
| `systemGaze.ts` | 系统凝视 |
| `gazeEventSystem.ts` | 凝视事件系统 |
| `class.ts` | 阶级系统 |
| `health.ts` | 健康系统 |
| `faith.ts` | 信仰系统 |
| `bank.ts` | 银行逻辑 |
| `medical.ts` | 医疗逻辑 |
| `prison.ts` | 监狱逻辑 |
| `market.ts` | 市场逻辑 |
| `endings.ts` | 结局逻辑 |
| `deathAnalysis.ts` | 死亡分析 |

---

## ⚙️ 核心系统 (`src/systems/`)

| 路径 | 说明 |
|------|------|
| `SystemRegistry.ts` | 系统注册表 |
| `core/BankSystem.ts` | 银行系统 |
| `core/BillSystem.ts` | 账单系统 |
| `core/DietSystem.ts` | 饮食系统 |
| `core/EmploymentSystem.ts` | 就业系统 |
| `core/EventSystem.ts` | 事件系统 |
| `core/FaithSystem.ts` | 信仰系统 |
| `core/HousingSystem.ts` | 住房系统 |
| `core/JobSystem.ts` | 工作系统 |
| `core/StatRuleSystem.ts` | 状态规则系统 |
| `core/VehicleSystem.ts` | 载具系统 |

---

## 📝 类型定义 (`src/types/`)

| 路径 | 说明 |
|------|------|
| `schema.ts` | 数据Schema |
| `store.ts` | Store类型 |
| `narrative.ts` | 叙事类型 |
| `faithRules.ts` | 信仰规则类型 |
| `prisonRules.ts` | 监狱规则类型 |
| `steam/index.ts` | Steam类型 |

---

## 🎣 自定义Hooks (`src/hooks/`)

| 路径 | 说明 |
|------|------|
| `useHeartbeat.ts` | 心跳Hook |
| `useVisualFilter.ts` | 视觉滤镜Hook |
| `useBurningConfig.ts` | 燃烧配置Hook |
| `steam/useSteamInit.ts` | Steam初始化Hook |
| `steam/useCloudSave.ts` | 云存档Hook |
| `steam/useAchievementUnlock.ts` | 成就解锁Hook |
| `steam/useRichPresence.ts` | 状态显示Hook |

---

## 🛠️ 工具函数 (`src/utils/`)

| 路径 | 说明 |
|------|------|
| `dataLoader.ts` | 数据加载器 |
| `random.ts` | 随机工具 |

---

## ⚙️ 配置文件 (`src/config/`)

| 路径 | 说明 |
|------|------|
| `index.ts` | 配置导出 |
| `mapConfig.ts` | 地图配置 |
| `zIndex.ts` | 层级配置 |
| `insuranceUIConfig.ts` | 保险UI配置 |
| `jobUIConfig.ts` | 工作UI配置 |

---

## 🌍 国际化 (`src/i18n/`)

| 路径 | 说明 |
|------|------|
| `index.ts` | i18n配置 |
| `locales/zh-CN.json` | 中文翻译 |
| `locales/en-US.json` | 英文翻译 |

---

## 🎨 静态资源 (`public/assets/`)

### 图片资源
| 路径 | 说明 |
|------|------|
| `scenes/` | 场景图片 |
| `scenes/slums/` | 贫民窟场景 |
| `scenes/downtown/` | 市中心场景 |
| `scenes/suburbs/` | 郊区场景 |
| `scenes/rust/` | 铁锈带场景 |
| `scenes/bank/` | 银行场景 |
| `scenes/housing/` | 住房场景 |
| `scenes/medical/` | 医疗场景 |
| `scenes/faith/` | 信仰场景 |
| `scenes/job/` | 工作场景 |
| `scenes/map/` | 地图场景 |
| `scenes/prison/` | 监狱场景 |
| `events/` | 事件图片 |
| `items/` | 物品图片 |
| `icons/` | 图标资源 |
| `textures/` | 纹理资源 |
| `ui/` | UI资源 |

### 音频资源
| 路径 | 说明 |
|------|------|
| `audio/` | 音频文件 |

### 字体资源
| 路径 | 说明 |
|------|------|
| `fonts/` | 字体文件 |

---

## 📊 游戏数据 (`src/assets/data/`)

### 核心数据
| 路径 | 说明 |
|------|------|
| `global.json` | 全局配置 |
| `classes.json` | 阶级数据 |
| `jobs.json` | 工作数据 |
| `items.json` | 物品数据 |
| `housing.json` | 住房数据 |
| `vehicles.json` | 载具数据 |
| `diseases.json` | 疾病数据 |
| `bills.json` | 账单数据 |
| `endings.json` | 结局数据 |
| `news.json` | 新闻数据 |
| `faiths.json` | 信仰数据 |
| `loans.json` | 贷款数据 |
| `insurance.json` | 保险数据 |
| `archives.json` | 档案数据 |
| `licenses.json` | 执照数据 |

### 事件数据 (`events/`)
| 路径 | 说明 |
|------|------|
| `index.ts` | 事件导出 |
| `common/` | 通用事件 (20个) |
| `homeless/` | 无产者事件 (60+) |
| `worker/` | 工人事件 (55个) |
| `middle/` | 中产事件 (50+) |
| `capitalist/` | 资本家事件 (54个) |

### 规则数据 (`rules/`)
| 路径 | 说明 |
|------|------|
| `shop_rules.json` | 商店规则 |
| `housing_rules.json` | 住房规则 |
| `job_rules.json` | 工作规则 |
| `bank_rules.json` | 银行规则 |
| `medical_rules.json` | 医疗规则 |
| `faith_rules.json` | 信仰规则 |
| `vehicle_rules.json` | 载具规则 |
| `prison_rules.json` | 监狱规则 |
| `bill_rules.json` | 账单规则 |
| `ending_rules.json` | 结局规则 |
| `food_rules.json` | 食物规则 |
| `market_rules.json` | 市场规则 |
| `narrative_rules.json` | 叙事规则 |
| `survival_model.json` | 生存模型 |
| `vitality_rules.json` | 活力规则 |

### 配置数据 (`config/`)
| 路径 | 说明 |
|------|------|
| `initial_state.json` | 初始状态 |
| `system_rules.json` | 系统规则 |

---

## 📚 设计文档 (`docs/`)

| 文档 | 说明 |
|------|------|
| `ASSETS_IMAGE_GUIDE.md` | 图片素材规范 |
| `ASSETS_IMAGE_GUIDE_PC98.md` | PC98图片规范 |
| `ASSETS_EVENTS_PC98.md` | PC98事件素材 |
| `ASSETS_MAP_SCENES_PC98.md` | PC98地图场景 |
| `ASSETS_SHOP_ITEMS_PC98.md` | PC98商店物品 |
| `ASSETS_AUDIO_GUIDE.md` | 音频素材规范 |
| `ASSETS_QUICK_REFERENCE.md` | 素材快速参考 |
| `COMPLETE_SYSTEM_OVERVIEW.md` | 系统总览 |
| `IMPLEMENTATION_PLAN.md` | 实现计划 |
| `PRISON_SYSTEM_DESIGN.md` | 监狱系统设计 |
| `MEDICAL_INSURANCE_DESIGN.md` | 医疗保险设计 |
| `BILL_SYSTEM_SPEC.md` | 账单系统规范 |
| `MODEL_FORMULAS.md` | 模型公式 |
| `VALUE_GENERATOR_GUIDE.md` | 数值生成指南 |
| `NEWS_JSON_SPEC.md` | 新闻JSON规范 |
| `NUMERIC_DESIGN_BRIEF.md` | 数值设计简报 |

---

## 🔧 脚本工具 (`scripts/`)

| 脚本 | 说明 |
|------|------|
| `batchMigrate.js` | 批量迁移 |
| `convertEvents.js` | 事件转换 |
| `validateEvents.ts` | 事件验证 |

### 根目录脚本
| 脚本 | 说明 |
|------|------|
| `batch_update_prompts.py` | 批量更新提示词 |
| `batch_update_all_prompts.py` | 批量更新所有提示词 |
| `update_events_prompts_final.py` | 更新事件提示词 |
| `check_missing_images.py` | 检查缺失图片 |
| `generate_missing_prompts.py` | 生成缺失提示词 |
| `fix_image_guide.py` | 修复图片指南 |

---

## 🖥️ Tauri桌面端 (`src-tauri/`)

| 路径 | 说明 |
|------|------|
| `Cargo.toml` | Rust配置 |
| `tauri.conf.json` | Tauri配置 |
| `capabilities/default.json` | 权限配置 |
| `src/main.rs` | 主入口 |
| `src/lib.rs` | 库文件 |
| `src/steam/` | Steam集成 |

---

## 🔍 常用查询索引

### UI调整相关
- 主题/样式: `src/index.css`, `tailwind.config.js`
- 组件样式: 各组件文件内的Tailwind类
- 视觉滤镜: `src/hooks/useVisualFilter.ts`
- 氛围效果: `src/components/ui/GlobalAtmosphere.tsx`

### 素材整合相关
- 图片资源: `public/assets/scenes/`, `public/assets/events/`
- 事件素材规范: `docs/ASSETS_EVENTS_PC98.md`
- 图片规范: `docs/ASSETS_IMAGE_GUIDE_PC98.md`
- 缺失检查: `check_missing_images.py`

### 场景相关
- 场景基类: `src/components/game/scenes/BaseScene.tsx`
- 场景配置: `src/config/mapConfig.ts`
- 场景图片: `public/assets/scenes/{区域}/`

### 事件相关
- 事件数据: `src/assets/data/events/`
- 事件加载: `src/logic/eventLoader.ts`
- 事件解析: `src/logic/eventResolver.ts`

---

## 📌 使用建议

1. **UI调整**: 先查看 `src/components/ui/` 和 `src/index.css`
2. **场景调整**: 查看 `src/components/game/scenes/` 和 `public/assets/scenes/`
3. **事件素材**: 参考 `docs/ASSETS_EVENTS_PC98*.md` 规范
4. **数据修改**: 编辑 `src/assets/data/` 下的JSON文件
5. **新增功能**: 在 `src/systems/core/` 添加系统，在 `src/store/slices/` 添加状态

---

*生成时间: 2026-02-27*
*适用阶段: 素材整合 & UI调整*
