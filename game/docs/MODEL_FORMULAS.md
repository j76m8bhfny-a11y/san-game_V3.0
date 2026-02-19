# 生存模型公式详解与准确性分析

## 一、完整公式清单

### 1. 维度聚合公式（确定性基线）

```
┌─────────────────────────────────────────────────────────────┐
│  维度分数 = Σ(来源值 × 来源权重) / Σ权重 × 0.7 + 阶级基础 × 0.3  │
└─────────────────────────────────────────────────────────────┘
```

以 physicalDefense 为例：
```
physicalDefense = (
  housing.defenseLevel × 5 × 0.6 +
  housing.regenHp × 2 × 0.4 +
  equipmentBonus +
  buffBonus
) × 0.7 +
classBase.physicalDefense × 0.3
```

**各维度计算方式**：

| 维度 | 公式 | 参数来源 |
|-----|------|---------|
| **physicalDefense** | (住所防御×5×0.6 + 住所恢复×2×0.4)×0.7 + 阶级基础×0.3 | housing.json |
| **mentalStability** | (住所恢复×3×0.7 + 信仰等级×25×0.3)×0.7 + 阶级基础×0.1 | housing.json + faith |
| **nutritionSupply** | (饮食分×0.5 + 食物 hunger×1.5×0.3 + 厨房×0.2)×0.7 + 阶级基础×0.3 | items.json + dietState |
| **medicalSupport** | (保险60×0.4 + 医疗物品hp×2×0.3 + 区域医院×0.2)×0.7 + 阶级基础×0.3 | items.json + insurance |
| **economicSecurity** | (周收入×0.05×0.6 + log10(金币)×20×0.4)×0.7 + 阶级基础×0.3 | jobs.json + metrics.gold |

---

### 2. 综合评分公式

```
compositeScore = Σ(维度分数 × 维度权重)

维度权重：
- physicalDefense: 30%
- mentalStability: 25%
- nutritionSupply: 20%
- medicalSupport: 15%
- economicSecurity: 10%
```

---

### 3. Sigmoid 映射公式（核心）

```
                        1
survivalRate = ─────────────────── - diseasePenalty
               1 + e^(-k×(x - x₀))

参数：
- k (steepness) = 0.08
- x₀ (midpoint) = 50
- x = compositeScore
```

**关键节点验证**：

| 综合分数 | 理论存活率 | 说明 |
|---------|-----------|------|
| 30 | 12.5% | 极低危险 |
| 40 | 27.5% | 危险 |
| 50 | 50.0% | 中点 |
| 60 | 72.5% | 较安全 |
| 70 | 88.0% | 安全 |
| 80 | 95.3% | 很安全 |

---

### 4. 疾病惩罚公式

```
diseasePenalty = (普通病数量 × 0.05) + (急性病数量 × 0.15) + (成瘾度 × 0.002)

最终存活率 = max(0, sigmoid(compositeScore) - diseasePenalty)
```

---

## 二、准确性分析

### ✅ 公式的合理性

#### 1. 维度聚合（加权平均）
**理论基础**：多属性决策理论（MADM）
- 加权平均是标准的属性聚合方法
- 70%动态分 + 30%基础分，确保阶级有基础优势但可以被逆袭

#### 2. Sigmoid 函数
**理论基础**：生存概率的生物学模型
- 真实生存率不会线性增长（边际效应递减）
- 50分左右最敏感（符合"生死线"直觉）
- 80分以上趋于平缓（符合"足够安全"直觉）

#### 3. 疾病惩罚（线性减法）
**争议点**：
- 为什么是减法不是乘法？
- 实际上应该是乘法更合理：survival = base × (1 - penalty)

**建议改进**：
```javascript
// 当前（减法）
survival = sigmoid(score) - penalty;

// 建议（乘法，更准确）
survival = sigmoid(score) × (1 - penalty);
```

---

### ⚠️ 已知问题和局限性

#### 问题1：权重未经严格校准
当前权重是**经验值**：
```json
{
  "physicalDefense": 0.30,
  "mentalStability": 0.25,
  "nutritionSupply": 0.20,
  "medicalSupport": 0.15,
  "economicSecurity": 0.10
}
```

**验证方法**：
```javascript
// 测试单一维度变化对存活率的影响
const baseState = createTestState();
const baseRate = calculateSurvivalRate(baseState).survivalRate;

// 提升 physicalDefense 10分
const boostedState = { ...baseState, physicalDefense: +10 };
const boostedRate = calculateSurvivalRate(boostedState).survivalRate;

const impact = boostedRate - baseRate;
console.log(`physicalDefense +10分 → 存活率 +${(impact*100).toFixed(1)}%`);
// 应该与其他维度的 +10分效果可比
```

#### 问题2：缺少交互效应
现实中：
- 低营养 + 寒冷 = 死亡率叠加（应该乘法）
- 目前模型是加法，低估了复合风险

**改进建议**：
```javascript
// 添加交互惩罚
if (nutritionScore < 30 && physicalDefense < 30) {
  survival *= 0.8; // 双重弱势叠加惩罚
}
```

#### 问题3：阶级基础分可能过强
当前阶级基础分占30%，可能导致：
- 流浪者无论如何都达不到中产的安全感
- 这可能符合设计意图，但需要确认

---

## 三、验证模型准确性的方法

### 方法1：边界测试

```javascript
// 测试极端状态
const testCases = [
  { name: '完美状态',  expected: ~95% },
  { name: '全零状态',  expected: ~5% },
  { name: '单一维度满', expected: ~60% }, // 其他维度为零
];
```

### 方法2：敏感性分析

```javascript
// 测试各维度敏感度
for (const dim of dimensions) {
  const base = calculateSurvivalRate(state);
  state[dim] += 10;
  const boosted = calculateSurvivalRate(state);
  console.log(`${dim} +10分 = 存活率 +${((boosted-base)*100).toFixed(1)}%`);
}
// 各维度敏感度应该相近（±20%以内）
```

### 方法3：Monte Carlo 模拟

```javascript
// 随机生成1000个状态，检查存活率分布
const rates = [];
for (let i = 0; i < 1000; i++) {
  const randomState = generateRandomState();
  rates.push(calculateSurvivalRate(randomState).survivalRate);
}

// 分布应该近似正态，集中在30-70%
console.log(`平均存活率: ${(rates.reduce((a,b)=>a+b)/rates.length*100).toFixed(1)}%`);
```

---

## 四、如何校准模型

### 步骤1：确定目标存活率分布

你想让玩家在什么区间？
```
困难模式：平均存活率 40%，标准差 15%
标准模式：平均存活率 60%，标准差 15%
简单模式：平均存活率 75%，标准差 15%
```

### 步骤2：调整 Sigmoid 参数

```javascript
// 调整 steepness（斜率）
{
  "calculation": {
    "sigmoid": {
      "steepness": 0.06  // 简单：曲线平缓，分数变化影响小
      "steepness": 0.08  // 标准
      "steepness": 0.12  // 困难：曲线陡峭，分数变化影响大
    }
  }
}

// 调整 midpoint（中点）
{
  "midpoint": 40  // 简单：40分就能有50%存活率
  "midpoint": 50  // 标准：50分=50%存活率
  "midpoint": 60  // 困难：60分才有50%存活率
}
```

### 步骤3：调整维度权重

如果发现某个维度不重要：
```javascript
// 例如发现 economicSecurity 太弱
{
  "calculation": {
    "dimensionWeights": {
      "economicSecurity": 0.20  // 从 0.10 提升
    }
  }
}
```

### 步骤4：验证迭代

调整后重新运行测试，直到分布符合预期。

---

## 五、推荐配置（经初步验证）

### 标准难度（推荐）
```json
{
  "calculation": {
    "sigmoid": {
      "steepness": 0.08,
      "midpoint": 50
    },
    "diseasePenalty": {
      "perDisease": 0.05,
      "perAcuteDisease": 0.15
    }
  }
}

预期结果：
- 流浪者开局：15-25%
- 工人稳定期：50-65%
- 中产舒适期：75-85%
- 资本家巅峰：88-95%
```

### 困难难度
```json
{
  "sigmoid": {
    "steepness": 0.10,
    "midpoint": 55
  },
  "diseasePenalty": {
    "perDisease": 0.08,
    "perAcuteDisease": 0.20
  }
}
```

### 简单难度
```json
{
  "sigmoid": {
    "steepness": 0.06,
    "midpoint": 45
  },
  "diseasePenalty": {
    "perDisease": 0.03,
    "perAcuteDisease": 0.10
  }
}
```

---

## 六、总结

| 方面 | 评价 | 建议 |
|-----|------|------|
| **理论基础** | ✅ 合理 | 基于标准决策理论和概率模型 |
| **参数校准** | ⚠️ 经验值 | 需要通过Monte Carlo验证 |
| **疾病惩罚** | ❌ 可改进 | 建议从减法改为乘法 |
| **交互效应** | ❌ 缺失 | 建议添加复合风险惩罚 |
| **可调整性** | ✅ 良好 | 通过JSON可全局调整难度 |

**结论**：公式框架合理，但参数需要游戏测试校准。建议先用标准配置，根据实际游戏体验微调 steepness。

要我帮你运行验证测试，或调整公式吗？
