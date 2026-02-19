# B. 参数配置表（基于现有代码）

> 本文档提取自 `survival_dimensions_simple.json` 和 `survivalCalculator.ts`
> 所有数值均为当前代码中的真实配置

---

## 一、全局计算参数

### 1.1 Sigmoid 映射参数

文件路径：`survival_dimensions_simple.json` → `calculation.sigmoid`

| 参数名 | 代码中的值 | 含义 | 影响 |
|-------|-----------|------|------|
| `steepness` | 0.08 | 曲线陡峭度 | 越大=分数变化对存活率影响越敏感 |
| `midpoint` | 50 | 中点位置 | 50分对应50%存活率 |

**Sigmoid 公式**：
```
存活率 = 1 / (1 + e^(-steepness × (综合评分 - midpoint)))
```

**验证计算**（可自行代入）：
- 评分30分 → 存活率 ≈ 12%
- 评分50分 → 存活率 = 50%
- 评分70分 → 存活率 ≈ 88%

---

### 1.2 维度权重参数

文件路径：`survival_dimensions_simple.json` → `calculation.dimensionWeights`

| 维度ID | 代码中的权重 | 影响说明 |
|-------|------------|---------|
| `physicalDefense` | 0.30 | 物理防御占30% |
| `mentalStability` | 0.25 | 精神稳定占25% |
| `nutritionSupply` | 0.20 | 营养供给占20% |
| `medicalSupport` | 0.15 | 医疗支持占15% |
| `economicSecurity` | 0.10 | 经济安全占10% |

**综合评分公式**：
```
综合评分 = Σ(维度分数 × 维度权重)
```

---

### 1.3 疾病惩罚参数

文件路径：`survival_dimensions_simple.json` → `calculation.diseasePenalty`

| 参数名 | 代码中的值 | 含义 |
|-------|-----------|------|
| `perDisease` | 0.05 | 每种普通病 -5% 存活率 |
| `perAcuteDisease` | 0.15 | 每种急性病 -15% 存活率 |
| `addictionMultiplier` | 0.002 | 每点成瘾 -0.2% 存活率 |

**惩罚公式**：
```
疾病惩罚 = (普通病数 × 0.05) + (急性病数 × 0.15) + (成瘾度 × 0.002)
```

**注意**：惩罚是**减法**（从Sigmoid结果直接减），不是乘法。

---

### 1.4 无家可归惩罚参数

文件路径：`survival_dimensions_simple.json` → `calculation.homelessPenalty`

| 维度 | 代码中的惩罚值 | 说明 |
|-----|--------------|------|
| `physicalDefense` | -10 | 无住所时物理防御 -10分 |
| `mentalStability` | -20 | 无住所时精神稳定 -20分 |

---

## 二、维度计算参数

### 2.1 physicalDefense（物理防御）

文件路径：`survival_dimensions_simple.json` → `dimensions.physicalDefense`

| 参数 | 代码中的值 | 说明 |
|-----|-----------|------|
| 维度权重 | 0.30 | 见1.2节 |
| 动态分占比 | 0.70 | 70%来自动态计算 |
| 基础分占比 | 0.30 | 30%来自阶级基础 |

**来源配置**：
| 来源类型 | 属性字段 | 权重 | 乘数 |
|---------|---------|------|------|
| housing | defenseLevel | 0.60 | 5 |
| housing | regenHp | 0.40 | 2 |

**计算公式**：
```
physicalDefense = 0.7 × (housing.defenseLevel×5×0.6 + housing.regenHp×2×0.4) + 0.3×阶级基础
                  + 无家可归惩罚(-10)
```

---

### 2.2 mentalStability（精神稳定）

文件路径：`survival_dimensions_simple.json` → `dimensions.mentalStability`

| 参数 | 代码中的值 | 说明 |
|-----|-----------|------|
| 维度权重 | 0.25 | 见1.2节 |
| 动态分占比 | 0.70 | 70%来自动态计算 |
| 基础分占比 | 0.30 | 30%来自阶级基础 |

**来源配置**：
| 来源类型 | 属性字段 | 权重 | 乘数 |
|---------|---------|------|------|
| housing | regenHp | 0.70 | 3 |
| faith | level | 0.30 | 25 |

**计算公式**：
```
mentalStability = 0.7 × (housing.regenHp×3×0.7 + faith.level×25×0.3) + 0.3×阶级基础
                  + 无家可归惩罚(-20)
```

---

### 2.3 nutritionSupply（营养供给）

文件路径：`survival_dimensions_simple.json` → `dimensions.nutritionSupply`

| 参数 | 代码中的值 | 说明 |
|-----|-----------|------|
| 维度权重 | 0.20 | 见1.2节 |
| 动态分占比 | 0.70 | 70%来自动态计算 |
| 基础分占比 | 0.30 | 30%来自阶级基础 |

**来源配置**：
| 来源类型 | 属性字段 | 权重 | 乘数 | 备注 |
|---------|---------|------|------|------|
| diet | healthScore | 0.60 | 无 | 饮食追踪系统计算 |
| inventory | hunger | 0.40 | 1.5 | 背包中FOOD标签物品 |

**diet healthScore计算**（代码硬编码）：
```
healthScore = 50 
              + diet.healthyPoints × 0.5 
              - diet.junkFoodPoints × 0.3 
              - diet.sodiumIntake × 0.1 
              - diet.sugarIntake × 0.1
（钳制在0-100之间）
```

**inventory计算**：
```
背包食物平均分 = 背包中所有FOOD标签物品的 hunger 值平均值
nutritionItemScore = 平均分 × 1.5
```

**完整公式**：
```
nutritionSupply = 0.7 × (diet.healthScore×0.6 + 平均分×1.5×0.4) + 0.3×阶级基础
```

---

### 2.4 medicalSupport（医疗支持）

文件路径：`survival_dimensions_simple.json` → `dimensions.medicalSupport`

| 参数 | 代码中的值 | 说明 |
|-----|-----------|------|
| 维度权重 | 0.15 | 见1.2节 |
| 动态分占比 | 0.70 | 70%来自动态计算 |
| 基础分占比 | 0.30 | 30%来自阶级基础 |

**来源配置**：
| 来源类型 | 属性字段 | 权重 | 乘数/值 | 备注 |
|---------|---------|------|--------|------|
| insurance | hasMedical | 0.50 | 60 | 有保险=60分，无=0分 |
| inventory | hp | 0.30 | 2 | 背包中MEDICAL标签物品 |
| region | hospitalTier | 0.20 | - | 区域配置见下表 |

**区域医院等级表**（代码硬编码）：
| 区域 | hospitalTier值 |
|-----|---------------|
| SLUMS | 20 |
| RUST_BELT | 40 |
| SUBURBS | 70 |
| DOWNTOWN | 90 |

**inventory计算**：
```
背包医疗平均分 = 背包中所有MEDICAL标签物品的 hp 值平均值
medicalItemScore = 平均分 × 2
```

**完整公式**：
```
medicalSupport = 0.7 × (保险分×0.5 + 平均分×2×0.3 + 区域分×0.2) + 0.3×阶级基础
```

---

### 2.5 economicSecurity（经济安全）

文件路径：`survival_dimensions_simple.json` → `dimensions.economicSecurity`

| 参数 | 代码中的值 | 说明 |
|-----|-----------|------|
| 维度权重 | 0.10 | 见1.2节 |
| 动态分占比 | 0.70 | 70%来自动态计算 |
| 基础分占比 | 0.30 | 30%来自阶级基础 |

**来源配置**：
| 来源类型 | 属性字段 | 权重 | 乘数 | 备注 |
|---------|---------|------|------|------|
| income | weeklyNet | 0.60 | 0.05 | 周收入总和 × 0.05 |
| currency | gold | 0.40 | log | log10(gold+1) × 20 |

**income计算**：
```
weeklyNet = 所有活跃工作的 baseSalary 总和
incomeScore = weeklyNet × 0.05
```

**currency计算**：
```
currencyScore = log10(gold + 1) × 20
// 例如：gold=1000 → log10(1001)×20 ≈ 60分
//       gold=10000 → log10(10001)×20 ≈ 80分
```

**完整公式**：
```
economicSecurity = 0.7 × (weeklyNet×0.05×0.6 + log10(gold+1)×20×0.4) + 0.3×阶级基础
```

---

## 三、阶级基础分参数

文件路径：`survival_dimensions_simple.json` → `classBaseScores`

| 阶级 | physicalDefense | mentalStability | nutritionSupply | medicalSupport | economicSecurity |
|-----|-----------------|-----------------|-----------------|----------------|------------------|
| HOMELESS | 5 | 10 | 5 | 5 | 5 |
| WORKER | 15 | 20 | 15 | 15 | 20 |
| MIDDLE | 30 | 35 | 30 | 35 | 40 |
| CAPITALIST | 50 | 45 | 45 | 50 | 70 |

**说明**：
- 这些值直接加在对应维度上（占30%权重）
- 体现阶级的先天差距
- 动态计算（70%）可以逆袭或拉大差距

---

## 四、随机扰动参数

文件路径：`survivalCalculator.ts` 第258-261行

| 参数 | 代码中的值 | 说明 |
|-----|-----------|------|
| 随机范围 | ±0.05 | ±5% 存活率浮动 |
| 分布 | 均匀分布 | Math.random() - 0.5 |
| 应用时机 | 回合判定 | checkSurvival() 时 |

**代码逻辑**：
```typescript
const variance = (Math.random() - 0.5) * 0.1; // ±5%
survivalRate = Math.max(0, Math.min(1, survivalRate + variance));
```

---

## 五、参数汇总表（供设计参考）

### 所有可调参数及其位置

| 参数 | 当前值 | 位置 | 影响 |
|-----|-------|------|------|
| steepness | 0.08 | survival_dimensions_simple.json | 全局难度曲线 |
| midpoint | 50 | survival_dimensions_simple.json | 全局难度中点 |
| dimensionWeights | 见1.2 | survival_dimensions_simple.json | 各维度重要性 |
| perDisease | 0.05 | survival_dimensions_simple.json | 疾病威胁 |
| perAcuteDisease | 0.15 | survival_dimensions_simple.json | 急性病威胁 |
| addictionMultiplier | 0.002 | survival_dimensions_simple.json | 成瘾威胁 |
| homelessPenalty | -10/-20 | survival_dimensions_simple.json | 无家可归惩罚 |
| classBaseScores | 见上表 | survival_dimensions_simple.json | 阶级差距 |
| housing multipliers | 5, 2, 3, 25 | survival_dimensions_simple.json | 住所效果 |
| diet coefficients | 0.5, 0.3, 0.1, 0.1 | 代码硬编码 | 饮食计算 |
| regionHospitalTiers | 20,40,70,90 | survival_dimensions_simple.json | 区域医疗 |
| income multiplier | 0.05 | survival_dimensions_simple.json | 收入效果 |
| currency log factor | 20 | survival_dimensions_simple.json | 金钱效果 |
| random variance | ±0.05 | 代码硬编码 | 随机性 |

---

## 六、验证用参考值

基于当前参数，纯数学计算（无随机）：

| 状态描述 | 假设输入 | 预期维度分 | 预期综合分 | 预期存活率(无惩罚) |
|---------|---------|-----------|-----------|------------------|
| 全维度50分 | 所有维度=50 | 50 | 50 | 50% |
| 全维度70分 | 所有维度=70 | 70 | 70 | 88% |
| 全维度30分 | 所有维度=30 | 30 | 30 | 12% |
| 单一维度100其他0 | 物理=100,其他=0 | 物理100,其他0 | 30 | 12% |

**说明**：这些值用于验证参数调整后的数学正确性。

---

## 七、设计师注意事项

1. **所有权重和为1**：
   - dimensionWeights 总和必须为1
   - 每个维度内的 source 权重总和建议为1

2. **分数钳制**：
   - 各维度分数被钳制在 0-100 之间
   - 最终存活率被钳制在 0-1 之间

3. **对数压缩**：
   - 经济安全使用 log10 压缩金钱增长
   - 后期金币对存活率影响递减

4. **零值处理**：
   - 无住所时部分来源值为0
   - 无保险时保险来源值为0
   - 背包无物品时平均分为0
