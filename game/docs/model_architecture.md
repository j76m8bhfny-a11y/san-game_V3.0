# 维度聚合模型架构

## 数据流图

```
┌──────────────────────────────────────────────────────────────────────┐
│                        数据来源层 (JSON 配置)                         │
├──────────────────────────────────────────────────────────────────────┤
│  items/*.json    housing.json    class.json    region.json           │
│  ├─ canned_food  ├─ slum_shack  ├─ HOMELESS  ├─ SLUMS               │
│  ├─ med_kit      ├─ apartment   ├─ WORKER    ├─ RUST_BELT           │
│  ├─ insurance    └─ penthouse   ├─ MIDDLE    ├─ SUBURBS             │
│  └─ ...                         └─ CAPITALIST └─ DOWNTOWN            │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        维度聚合层 (自动计算)                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   physicalDefense  = 加权平均(住所×0.4, 装备×0.3, Buff×0.2, 阶级×0.1)  │
│   mentalStability  = 加权平均(住所×0.35, 物品×0.25, 信仰×0.25, Buff×0.15)│
│   nutritionSupply  = 加权平均(饮食×0.5, 食物×0.3, 厨房×0.2)           │
│   medicalSupport   = 加权平均(保险×0.4, 药品×0.3, 区域×0.2, Buff×0.1)  │
│   economicBuffer   = 加权平均(现金×0.5, 收入×0.3, 资产×0.2)           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        概率计算层 (Sigmoid映射)                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   compositeScore = Σ(维度分数 × 维度权重) / Σ权重                     │
│                                                                      │
│                      1                                               │
│   P(survival) = ───────────  - 疾病惩罚                              │
│                 1 + e^(-k×(score-50))                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        判定输出层                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   if random() <= P(survival):  survived = true                       │
│   else:                       survived = false  → 触发死亡/结局        │
│                                                                      │
│   同时输出:                                                          │
│   - 风险等级 (SAFE/WARNING/DANGER/CRITICAL)                          │
│   - 最短板维度                                                       │
│   - 改进建议                                                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 核心公式

### 1. 维度聚合公式

```
dimensionScore = Σ(sourceValue_i × sourceWeight_i) / ΣsourceWeight_i
```

### 2. 综合评分公式

```
compositeScore = Σ(dimensionScore_i × dimensionWeight_i) / ΣdimensionWeight_i
```

### 3. Sigmoid 映射公式

```
survivalProbability = 1 / (1 + exp(-steepness × (compositeScore - midpoint))) - diseasePenalty
```

### 4. 疾病惩罚公式

```
diseasePenalty = (normalDiseaseCount × 0.05) + (acuteDiseaseCount × 0.15) + (addiction × 0.003)
```

## 配置关联图

```
vitality_dimensions.json
│
├─ dimensions
│  ├─ physicalDefense
│  │  ├─ sources
│  │  │  ├─ housing.defenseLevel ────────► housing.json
│  │  │  ├─ equipment.defense ───────────► items.json (type: PASSIVE)
│  │  │  ├─ buff.defenseBonus ───────────► buff effects
│  │  │  └─ base.classBaseDefense ───────► classBaseValues (本文件)
│  │  ├─ weight: 0.30 ───────────────────► calculation.dimensionWeights
│  │  └─ formula: "weighted_average"
│  │
│  ├─ mentalStability
│  │  ├─ sources
│  │  │  ├─ housing.comfortLevel ────────► housing.json
│  │  │  ├─ consumable.sanRestore ───────► items.json (tag: comfort)
│  │  │  ├─ faith.sanctuaryLevel ────────► faith.json
│  │  │  └─ buff.sanBonus ───────────────► buff effects
│  │  └─ weight: 0.25
│  │
│  ├─ nutritionSupply
│  │  ├─ sources
│  │  │  ├─ diet.nutritionScore ─────────► dietState
│  │  │  ├─ consumable.hungerRestore ────► items.json (tag: food)
│  │  │  └─ housing.hasKitchen ──────────► housing.json
│  │  └─ weight: 0.20
│  │
│  ├─ medicalSupport
│  │  ├─ sources
│  │  │  ├─ insurance.coverageScore ─────► insurance.json
│  │  │  ├─ consumable.hpRestore ────────► items.json (tag: medical)
│  │  │  ├─ region.hospitalQuality ──────► region config
│  │  │  └─ buff.regenBonus ─────────────► buff effects
│  │  └─ weight: 0.15
│  │
│  └─ economicBuffer
│     ├─ sources
│     │  ├─ currency.gold ───────────────► vitality.metrics.gold
│     │  ├─ income.weeklyNet ────────────► activeJobs
│     │  └─ asset.liquidAssetValue ──────► inventory value
│     └─ weight: 0.10
│
├─ classBaseValues ──────────────────────► 为每个阶级提供基础分
├─ aggregationRules ─────────────────────► 定义聚合公式
└─ calculation ──────────────────────────► Sigmoid 参数和维度权重
```

## 数值调整映射表

| 你想改变 | 修改文件 | 修改位置 | 影响效果 |
|---------|---------|---------|---------|
| 某个物品的强度 | items_*.json | item.effects / dimensionImpact | 影响对应维度 |
| 住所的重要性 | vitality_dimensions.json | dimensions.xxx.sources[0].weight | 改变住所权重 |
| 阶级的差距 | vitality_dimensions.json | classBaseValues | 改变阶级基础分 |
| 整体存活率 | vitality_dimensions.json | calculation.sigmoidParams | 改变映射曲线 |
| 疾病威胁度 | vitality_dimensions.json | calculation.diseasePenalty | 改变疾病惩罚 |
| 某个维度重要性 | vitality_dimensions.json | calculation.dimensionWeights | 改变维度权重 |

## 典型数值场景

```
场景: 流浪者开局 (目标存活率 20%)
────────────────────────────────────────────────────────
物品: 泡面(5) + 睡袋(10)
阶级: HOMELESS (physicalDefense: 10, mentalStability: 15)
住所: 无
────────────────────────────────────────────────────────
维度分数:
  physicalDefense:  10×0.6 + 10×0.1 = 7
  mentalStability:  15×0.1 = 1.5
  nutritionSupply:  5
  medicalSupport:   5×0.1 = 0.5
  economicBuffer:   log10(50)×20 = 34
────────────────────────────────────────────────────────
综合: (7×0.3 + 1.5×0.25 + 5×0.2 + 0.5×0.15 + 34×0.1) / 1 = 8.5
存活率: sigmoid(8.5) ≈ 20%


场景: 工人中期 (目标存活率 60%)
────────────────────────────────────────────────────────
物品: 罐头(20) + 水壶(15) + 急救包(35) + 睡袋(10)
阶级: WORKER (physicalDefense: 25, mentalStability: 30)
住所: 棚屋 (defense: 20, comfort: 10)
────────────────────────────────────────────────────────
维度分数:
  physicalDefense:  20×0.4 + 10×0.3 + 25×0.1 = 13.5
  mentalStability:  10×0.35 + 15×0.25 + 30×0.1 = 9
  nutritionSupply:  20×0.3 + 10 = 16
  medicalSupport:   35×0.3 + 20×0.1 = 12.5
  economicBuffer:   log10(500)×20 = 54
────────────────────────────────────────────────────────
综合: (13.5×0.3 + 9×0.25 + 16×0.2 + 12.5×0.15 + 54×0.1) = 16.5
存活率: sigmoid(16.5) ≈ 60%


场景: 中产舒适 (目标存活率 80%)
────────────────────────────────────────────────────────
物品: 蔬菜(40) + 防盗门(40) + 基础保险(30)
阶级: MIDDLE (physicalDefense: 40, mentalStability: 45)
住所: 公寓 (defense: 60, comfort: 50, kitchen: yes)
────────────────────────────────────────────────────────
维度分数:
  physicalDefense:  60×0.4 + 40×0.3 + 40×0.1 = 40
  mentalStability:  50×0.35 + 45×0.1 = 22
  nutritionSupply:  40×0.3 + 50×0.2 = 22
  medicalSupport:   30×0.4 + 70×0.2 + 35×0.1 = 26.5
  economicBuffer:   log10(3000)×20 = 70
────────────────────────────────────────────────────────
综合: (40×0.3 + 22×0.25 + 22×0.2 + 26.5×0.15 + 70×0.1) = 29
存活率: sigmoid(29) ≈ 80%
```

## 调试输出示例

```
╔══════════════════════════════════════════════════════════╗
║           维度聚合存活分析                                ║
╚══════════════════════════════════════════════════════════╝

📊 综合存活概率: 62.5%
📈 综合评分: 58.3/100
🚨 风险等级: WARNING
⚠️  最短板: nutritionSupply

维度详情:
────────────────────────────────────────────────────────────
physicalDefense    [████████████░░░░░░░░] 0.58
  └─ housing.defenseLevel: 30.0 (贡献 35.0%)
  └─ equipment.defense: 15.0 (贡献 15.0%)
  └─ base.classBaseDefense: 25.0 (贡献 8.0%)
  
mentalStability    [██████████████░░░░░░] 0.72
  └─ housing.comfortLevel: 50.0 (贡献 55.0%)
  └─ consumable.sanRestore: 15.0 (贡献 15.0%)
  └─ faith.sanctuaryLevel: 15.0 (贡献 15.0%)
  
nutritionSupply    [███████░░░░░░░░░░░░░] 0.35 ⚠️
  └─ diet.nutritionScore: 15.0 (贡献 45.0%)
  └─ consumable.hungerRestore: 20.0 (贡献 30.0%)
  └─ housing.hasKitchen: 0.0 (贡献 0.0%)
  
medicalSupport     [█████████████░░░░░░░] 0.65
  └─ insurance.coverageScore: 30.0 (贡献 50.0%)
  └─ consumable.hpRestore: 35.0 (贡献 35.0%)
  └─ region.hospitalQuality: 40.0 (贡献 15.0%)
  
economicBuffer     [████████████░░░░░░░░] 0.60
  └─ currency.gold: 45.0 (贡献 60.0%)
  └─ income.weeklyNet: 35.0 (贡献 30.0%)
────────────────────────────────────────────────────────────

💡 建议:
   • 改善营养供给（吃更好的食物）
   • 寻找带厨房的住所
```
