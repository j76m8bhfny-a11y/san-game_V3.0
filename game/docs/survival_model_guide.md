# 存活概率数值设计指南

## 核心设计理念

```
┌─────────────────────────────────────────────────────────────┐
│                    数值设计流程                              │
├─────────────────────────────────────────────────────────────┤
│  Step 1: 在 JSON 中配置物品数值                              │
│     ↓                                                       │
│  Step 2: 系统自动聚合为 5 个生存维度                         │
│     ↓                                                       │
│  Step 3: 维度通过 Sigmoid 函数映射为存活概率                 │
│     ↓                                                       │
│  Step 4: 根据概率进行随机判定                                │
└─────────────────────────────────────────────────────────────┘
```

## 5 大生存维度

每个维度对应一类游戏机制，由相关物品/状态自动聚合而成。

### 1. 物理防御 (physicalDefense)

**作用**: 抵抗伤害和疾病的能力

**聚合来源**:
| 来源类型 | 权重 | 示例 |
|---------|------|------|
| 住所 | 40% | 贫民窟棚屋 +20, 郊区公寓 +60 |
| 装备 | 30% | 睡袋 +10, 防盗门 +40 |
| Buff | 20% | 临时防御加成 |
| 阶级基础 | 10% | 流浪者 10, 资本家 55 |

**设计建议**:
- 住所是最大来源，应该提供 20-90 的防御值
- 装备作为补充，提供 5-40 的额外防御
- 阶级差距应该明显（流浪者 vs 资本家差距 5 倍）

---

### 2. 精神稳定 (mentalStability)

**作用**: 抵抗理智流失的能力

**聚合来源**:
| 来源类型 | 权重 | 示例 |
|---------|------|------|
| 住所舒适度 | 35% | 有住所 vs 无家可归 |
| 舒缓物品 | 25% | 热水壶 +15, 圣经 +25 |
| 信仰庇护 | 25% | 每级信仰 +15 |
| Buff | 15% | 临时 SAN 加成 |

**设计建议**:
- 无家可归应该严重惩罚（-30 分左右）
- 奢侈物品提供心理安慰，但性价比低
- 信仰是平民的精神支柱

---

### 3. 营养供给 (nutritionSupply)

**作用**: 维持饥饿和恢复的能力

**聚合来源**:
| 来源类型 | 权重 | 示例 |
|---------|------|------|
| 饮食状态 | 50% | 基于连续健康饮食天数 |
| 食物储备 | 30% | 罐头 +20, 蔬菜 +40, 牛排 +60 |
| 住所厨房 | 20% | 有厨房才能吃新鲜蔬菜 |

**设计建议**:
- 垃圾食品应该分值很低（5-10）
- 健康饮食与住所绑定（需要厨房）
- 连续健康饮食有额外加成

---

### 4. 医疗支持 (medicalSupport)

**作用**: 治疗和恢复生命的能力

**聚合来源**:
| 来源类型 | 权重 | 示例 |
|---------|------|------|
| 保险覆盖 | 40% | 基础医保 +30, 高端医保 +75 |
| 医疗储备 | 30% | 急救包 +35, 抗生素 +50 |
| 区域医疗 | 20% | 贫民窟 20, 市中心 90 |
| Buff | 10% | 恢复速度加成 |

**设计建议**:
- 保险是最重要的医疗来源
- 贫民窟医疗资源匮乏
- 药品分急救（+HP）和治愈（去疾病）

---

### 5. 经济缓冲 (economicBuffer)

**作用**: 应对突发支出的能力

**聚合来源**:
| 来源类型 | 权重 | 示例 |
|---------|------|------|
| 现金 | 50% | 对数缩放，$1000≈60分 |
| 周净收入 | 30% | 稳定收入更重要 |
| 流动资产 | 20% | 可快速变现的资产 |

**设计建议**:
- 使用对数缩放避免后期金币膨胀
- 稳定收入比现金储备更重要
- 中产和资本家的主要差距在这里

---

## 数值配置指南

### 物品数值设计原则

#### 1. 分值范围
```
0-20:   极差 - 生存受到严重威胁
20-40:  较差 - 需要尽快改善
40-60:  一般 - 勉强维持
60-80:  良好 - 比较安全
80-100: 优秀 - 几乎无忧
```

#### 2. 价格与效果比例

物品性价比应该递减，体现边际效应：

```
泡面 ($8)     → +5 营养    (性价比 0.625)
罐头 ($15)    → +20 营养   (性价比 1.33)
蔬菜 ($45)    → +40 营养   (性价比 0.89)
牛排 ($200)   → +60 营养   (性价比 0.30)
```

**原则**: 廉价物品性价比高（为了生存），奢侈物品性价比低（为了享受）。

#### 3. 负面效果平衡

强力物品应该有负面效果来平衡：

```json
{
  "id": "painkillers",
  "name": "止痛药",
  "effects": {
    "hp": 10,
    "san": 5,
    "addiction": 3  // 成瘾是长期代价
  },
  "dimensionImpact": {
    "medicalSupport": { "value": 20 },
    "mentalStability": { "value": 10 }
  }
}
```

成瘾会逐渐降低 `mentalStability`，最终抵消药品的好处。

---

## 配置示例

### 场景 1: 流浪者初期

```json
{
  "inventory": ["instant_noodles", "sleeping_bag"],
  "housing": null,
  "gold": 50
}
```

预期维度分数:
```
physicalDefense:  10 (睡袋 10 + 阶级基础 10)
mentalStability:  15 (阶级基础 15)
nutritionSupply:   5 (泡面 5)
medicalSupport:    5 (阶级基础 5)
economicBuffer:   10 ($50 很少)
─────────────────────────────────
存活概率: 15-25%
```

### 场景 2: 工人稳定期

```json
{
  "inventory": ["canned_food", "kettle", "med_kit", "sleeping_bag"],
  "housing": "slum_shack",
  "gold": 500
}
```

预期维度分数:
```
physicalDefense:  35 (棚屋 20 + 睡袋 10 + 阶级 25*0.1)
mentalStability:  40 (棚屋舒适 10 + 水壶 15 + 阶级 30*0.1)
nutritionSupply:  35 (罐头 20 + 饮食 15)
medicalSupport:   35 (急救包 35 + 阶级 20*0.1)
economicBuffer:   35 ($500 对数≈35分)
─────────────────────────────────
存活概率: 55-70%
```

### 场景 3: 中产舒适期

```json
{
  "inventory": ["fresh_vegetables", "security_door", "medical_insurance_basic"],
  "housing": "suburb_apartment",
  "gold": 3000
}
```

预期维度分数:
```
physicalDefense:  70 (公寓 60 + 防盗门 40*0.3 + 阶级 40*0.1)
mentalStability:  65 (公寓舒适 50 + 阶级 45*0.1)
nutritionSupply:  60 (蔬菜 40 + 厨房 30*0.2 + 饮食 30)
medicalSupport:   60 (保险 30 + 区域医疗 70*0.2 + 阶级 35*0.1)
economicBuffer:   60 ($3000 对数≈60分)
─────────────────────────────────
存活概率: 75-85%
```

---

## Sigmoid 映射

维度分数通过 Sigmoid 函数映射为存活概率：

```
P(survival) = 1 / (1 + e^(-0.08 * (score - 50)))
```

关键节点:
```
分数 30 → 20% 存活率
分数 40 → 35% 存活率
分数 50 → 50% 存活率  (中点)
分数 60 → 65% 存活率
分数 70 → 80% 存活率
分数 80 → 90% 存活率
```

调整 `steepness` 可以改变曲线陡峭程度:
- 值大 → 分数变化对存活率影响大（更敏感）
- 值小 → 分数变化影响小（更平缓）

---

## 快速调整指南

### 想要增加整体难度？

1. **降低所有物品效果数值** (推荐)
   - 修改 `items_*.json` 中的数值

2. **增加疾病惩罚**
   - 修改 `vitality_dimensions.json` 中 `diseasePenalty`

3. **调陡 Sigmoid 曲线**
   - 增大 `steepness` 从 0.08 到 0.10

### 想要某个维度更重要？

修改 `vitality_dimensions.json`:

```json
"calculation": {
  "dimensionWeights": {
    "physicalDefense": 0.40,  // 从 0.30 增加
    "mentalStability": 0.20,  // 相应减少
    // ...
  }
}
```

### 想要强化住所的重要性？

1. **增加住所权重**
   ```json
   "physicalDefense": {
     "sources": [
       { "type": "housing", "weight": 0.60 },  // 从 0.40 增加
       { "type": "equipment", "weight": 0.15 }, // 相应减少
       // ...
     ]
   }
   ```

2. **或增加住所数值**
   ```json
   "slum_shack": {
     "defenseLevel": 30  // 从 20 增加
   }
   ```

---

## 调试工具

### 查看维度分解

```typescript
import { calculateDimensions } from '@/logic/dimensionModel';

const dims = calculateDimensions(gameState);
console.log(dims.physicalDefense);
// {
//   value: 45.5,
//   normalized: 0.455,
//   breakdown: [
//     { source: "housing.defenseLevel", value: 30, contribution: 0.26 },
//     { source: "equipment.defense", value: 15, contribution: 0.10 },
//     { ... }
//   ]
// }
```

### 生成调试报告

```typescript
import { exportDimensionAnalysis } from '@/logic/dimensionModel';

console.log(exportDimensionAnalysis(gameState));
// 输出完整的维度分析和建议
```

---

## 文件结构

```
game/src/
├── logic/
│   ├── dimensionModel.ts          # 核心模型
│   ├── dimensionModel.example.ts  # 使用示例
│   └── survivalModel.ts           # 旧模型(可选保留)
├── assets/data/rules/
│   ├── vitality_dimensions.json   # 维度聚合配置
│   └── survivalModel.json         # 旧配置(可选保留)
└── docs/
    └── survival_model_guide.md    # 本指南
```

---

## 常见问题

**Q: 修改物品数值后，系统会自动更新吗？**
A: 是的，每次调用 `calculateSurvivalChance()` 都会重新计算所有维度。

**Q: 如何平衡不同阶级的差距？**
A: 通过 `classBaseValues` 配置阶级基础分，差距应该在 2-5 倍之间。

**Q: 随机性在哪里控制？**
A: 调用 `calculateSurvivalChance(state, { includeVariance: true })` 会添加 ±5% 的随机扰动。

**Q: 维度分数有上限吗？**
A: 有，默认归一化到 0-100 分，但通过 Sigmoid 映射后，90 分以上存活率提升很小。

**Q: 可以添加新的维度吗？**
A: 可以，在 `vitality_dimensions.json` 中添加新维度定义，模型会自动识别。
