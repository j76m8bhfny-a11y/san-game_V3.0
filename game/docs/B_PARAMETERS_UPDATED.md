# B. 参数配置表（修正版 v2.0）

> 基于审查结果更新后的参数配置
> 包含ClassResistance、Vitality Decay、StatusEffect等新参数

---

## 一、全局计算参数

### 1.1 Sigmoid 映射参数

文件路径：`survival_dimensions_simple.json` → `calculation.sigmoid`

| 参数名 | 代码中的值 | 含义 | 可调范围 | 调整效果 |
|-------|-----------|------|---------|---------|
| `steepness` | 0.08 | 曲线陡峭度 | 0.06-0.12 | 越大=分数变化对$S$影响越敏感 |
| `midpoint` | 50 | 中点位置 | 40-60 | 越低=越容易达到高$S$值 |

**Sigmoid 公式**：
```
S = 1 / (1 + e^(-steepness × (综合评分 - midpoint)))
```

### 1.2 维度权重参数

文件路径：`survival_dimensions_simple.json` → `calculation.dimensionWeights`

| 维度ID | 权重 | 影响说明 |
|-------|------|---------|
| `physicalDefense` | 0.30 | 物理防御占30% |
| `mentalStability` | 0.25 | 精神稳定占25% |
| `nutritionSupply` | 0.20 | 营养供给占20% |
| `medicalSupport` | 0.15 | 医疗支持占15% |
| `economicSecurity` | 0.10 | 经济安全占10% |

**约束**：总和必须 = 1.0

---

## 二、新增核心参数（审查后加入）

### 2.1 Vitality Decay Rate 参数（新增）

文件路径：`survival_dimensions_simple.json` → `calculation.vitalityDecay`

**$S$ 到 Decay 的映射表**：

| $S$ 范围 | 等级 | hpDecay | sanDecay | 代码阈值 |
|---------|------|---------|----------|---------|
| $S \geq 0.8$ | EXCELLENT | +1 | +1 | 0.8 |
| $0.6 \leq S < 0.8$ | GOOD | 0 | 0 | 0.6 |
| $0.4 \leq S < 0.6$ | WARNING | -1 | 0 | 0.4 |
| $0.2 \leq S < 0.4$ | DANGER | -2 | -1 | 0.2 |
| $S < 0.2$ | CRITICAL | -5 | -3 | 0.0 |

**配置示例**：
```json
{
  "calculation": {
    "vitalityDecay": {
      "thresholds": [0.2, 0.4, 0.6, 0.8],
      "hpDecay": [-5, -2, -1, 0, 1],
      "sanDecay": [-3, -1, 0, 0, 1]
    }
  }
}
```

### 2.2 ClassResistance 阶级抗性参数（新增）

文件路径：`survival_dimensions_simple.json` → `calculation.classResistance`

| 阶级 | resistance | 说明 |
|-----|------------|------|
| HOMELESS | 0.3 | 抗性差，风险惩罚×3.33 |
| WORKER | 0.6 | 中等抗性，风险惩罚×1.67 |
| MIDDLE | 1.0 | 标准抗性，风险惩罚×1（基准）|
| CAPITALIST | 2.0 | 抗性强，风险惩罚×0.5 |

**风险惩罚计算公式**：
```
realPenalty = basePenalty / classResistance
```

**配置示例**：
```json
{
  "calculation": {
    "classResistance": {
      "HOMELESS": 0.3,
      "WORKER": 0.6,
      "MIDDLE": 1.0,
      "CAPITALIST": 2.0
    }
  }
}
```

### 2.3 StatusEffect Buff参数（新增）

文件路径：`survival_dimensions_simple.json` → `statusEffects`

**Buff配置模板**：
```json
{
  "statusEffects": {
    "eventImpact": {
      "durationBase": 5,
      "decayMode": "LINEAR",
      "perTurn": {
        "hp": -2,
        "san": -1
      },
      "onExpire": {
        "san": 5
      }
    }
  }
}
```

**参数说明**：
| 参数 | 类型 | 说明 |
|-----|------|------|
| `durationBase` | int | 基础持续回合数 |
| `decayMode` | string | "LINEAR"线性 / "NONE"恒定 |
| `perTurn` | object | 每回合效果 |
| `onExpire` | object | 结束时的补偿效果 |

---

## 三、原有参数（保持不变）

### 3.1 疾病惩罚参数

| 参数 | 值 | 说明 |
|-----|-----|------|
| `perDisease` | 0.05 | 普通病基础惩罚-5% |
| `perAcuteDisease` | 0.15 | 急性病基础惩罚-15% |
| `addictionMultiplier` | 0.002 | 成瘾每点-0.2% |

**注意**：这些惩罚先除以ClassResistance再应用

### 3.2 无家可归惩罚参数

| 维度 | 惩罚值 |
|-----|--------|
| `physicalDefense` | -10 |
| `mentalStability` | -20 |

### 3.3 维度计算参数（详细）

#### physicalDefense
| 来源 | 属性 | 权重 | 乘数 |
|-----|------|------|------|
| housing | defenseLevel | 0.60 | 5 |
| housing | regenHp | 0.40 | 2 |

#### mentalStability
| 来源 | 属性 | 权重 | 乘数 |
|-----|------|------|------|
| housing | regenHp | 0.70 | 3 |
| faith | level | 0.30 | 25 |

#### nutritionSupply
| 来源 | 属性 | 权重 | 乘数 |
|-----|------|------|------|
| diet | healthScore | 0.60 | - |
| inventory | hunger | 0.40 | 1.5 |

**diet.healthScore计算**：
```
healthScore = 50 + healthyPoints×0.5 - junkFoodPoints×0.3 - sodium×0.1 - sugar×0.1
（钳制在0-100）
```

#### medicalSupport
| 来源 | 属性 | 权重 | 值/乘数 |
|-----|------|------|--------|
| insurance | hasMedical | 0.50 | 60（固定） |
| inventory | hp | 0.30 | 2 |
| region | hospitalTier | 0.20 | 区域值 |

**区域医院等级**：
| 区域 | 值 |
|-----|-----|
| SLUMS | 20 |
| RUST_BELT | 40 |
| SUBURBS | 70 |
| DOWNTOWN | 90 |

#### economicSecurity
| 来源 | 属性 | 权重 | 乘数 |
|-----|------|------|------|
| income | weeklyNet | 0.60 | 0.05 |
| currency | gold | 0.40 | log10(gold+1)×20 |

### 3.4 阶级基础分参数

| 阶级 | physicalDefense | mentalStability | nutritionSupply | medicalSupport | economicSecurity |
|-----|-----------------|-----------------|-----------------|----------------|------------------|
| HOMELESS | 5 | 10 | 5 | 5 | 5 |
| WORKER | 15 | 20 | 15 | 15 | 20 |
| MIDDLE | 30 | 35 | 30 | 35 | 40 |
| CAPITALIST | 50 | 45 | 45 | 50 | 70 |

---

## 四、随机扰动参数

| 参数 | 值 | 说明 |
|-----|-----|------|
| `varianceRange` | ±0.05 | ±5% 随机浮动 |
| `distribution` | 均匀分布 | (Math.random() - 0.5) × 0.1 |

---

## 五、完整配置示例（JSON）

```json
{
  "calculation": {
    "sigmoid": {
      "steepness": 0.08,
      "midpoint": 50
    },
    "dimensionWeights": {
      "physicalDefense": 0.30,
      "mentalStability": 0.25,
      "nutritionSupply": 0.20,
      "medicalSupport": 0.15,
      "economicSecurity": 0.10
    },
    "vitalityDecay": {
      "thresholds": [0.2, 0.4, 0.6, 0.8],
      "hpDecay": [-5, -2, -1, 0, 1],
      "sanDecay": [-3, -1, 0, 0, 1]
    },
    "classResistance": {
      "HOMELESS": 0.3,
      "WORKER": 0.6,
      "MIDDLE": 1.0,
      "CAPITALIST": 2.0
    },
    "diseasePenalty": {
      "perDisease": 0.05,
      "perAcuteDisease": 0.15,
      "addictionMultiplier": 0.002
    },
    "homelessPenalty": {
      "physicalDefense": -10,
      "mentalStability": -20
    },
    "randomVariance": 0.05
  }
}
```

---

## 六、参数调整指南

### 调整整体难度

| 目标 | 调整参数 | 方向 |
|-----|---------|------|
| 让游戏更简单 | `steepness` | 降低（0.06） |
| 让游戏更难 | `steepness` | 提高（0.10） |
| 提高阶级差距 | `classResistance` | 拉开差距（0.2, 0.5, 1.0, 3.0）|
| 加快死亡速度 | `vitalityDecay.hpDecay` | 更负（-8代替-5）|
| 延长缓冲时间 | `statusEffects.durationBase` | 增加（7代替5）|

### 调整特定系统重要性

| 目标 | 调整参数 |
|-----|---------|
| 让住所更重要 | `dimensionWeights.physicalDefense` +0.05 |
| 让食物更重要 | `dimensionWeights.nutritionSupply` +0.05 |
| 让金钱更重要 | `dimensionWeights.economicSecurity` +0.05 |

---

## 七、版本对比

| 参数类别 | v1.0（旧） | v2.0（新） | 变化 |
|---------|-----------|-----------|------|
| Sigmoid参数 | ✅ 有 | ✅ 有 | 不变 |
| 维度权重 | ✅ 有 | ✅ 有 | 不变 |
| 疾病惩罚 | ✅ 有 | ✅ 有 | 不变 |
| **Vitality Decay** | ❌ 无 | ✅ **新增** | 核心机制 |
| **ClassResistance** | ❌ 无 | ✅ **新增** | 阶级差异化 |
| **StatusEffect** | ❌ 无 | ✅ **新增** | 替代历史回溯 |

---

**文档版本**：v2.0（修正版）  
**更新日期**：2026-02-18  
**基于审查**：数值专家审查意见
