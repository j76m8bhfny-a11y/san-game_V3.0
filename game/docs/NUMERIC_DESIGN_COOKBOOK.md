# 数值设计 cookbook

## 目标导向的配置

### 🎯 场景1：我想让食物系统更重要

**方法A**：增加 nutritionSupply 维度权重

```json
// survival_dimensions_simple.json
{
  "calculation": {
    "dimensionWeights": {
      "physicalDefense": 0.20,     // 从 0.30 降低
      "mentalStability": 0.20,
      "nutritionSupply": 0.35,     // 从 0.20 增加 ⬆️
      "medicalSupport": 0.15,
      "economicSecurity": 0.10
    }
  }
}
```

**方法B**：增加食物效果的乘数

```json
{
  "dimensions": {
    "nutritionSupply": {
      "sources": [
        { "type": "inventory", "tag": "FOOD", "attribute": "hunger", 
          "weight": 0.40, "multiplier": 2.5 }  // 从 1.5 增加 ⬆️
      ]
    }
  }
}
```

**效果**：吃食物对存活率的提升更明显

---

### 🎯 场景2：我想让住所更重要

**修改 housing 效果的乘数**：

```json
{
  "dimensions": {
    "physicalDefense": {
      "sources": [
        { "type": "housing", "attribute": "defenseLevel", 
          "weight": 0.70, "multiplier": 8 },   // 权重从 0.60→0.70, 乘数从 5→8
        { "type": "housing", "attribute": "regenHp", 
          "weight": 0.30, "multiplier": 4 }    // 乘数从 2→4
      ]
    },
    "mentalStability": {
      "sources": [
        { "type": "housing", "attribute": "regenHp", 
          "weight": 0.80, "multiplier": 5 }    // 权重从 0.70→0.80
      ]
    }
  }
}
```

**效果**：有无住所的存活率差距从 15% 扩大到 30%

---

### 🎯 场景3：我想让游戏更难

**方法1**：降低所有阶级的基础分

```json
{
  "classBaseScores": {
    "HOMELESS": { "physicalDefense": 2, "mentalStability": 3, ... },  // 全部减半
    "WORKER": { "physicalDefense": 8, "mentalStability": 10, ... },
    "MIDDLE": { "physicalDefense": 15, "mentalStability": 18, ... },
    "CAPITALIST": { "physicalDefense": 25, "mentalStability": 23, ... }
  }
}
```

**方法2**：增加疾病惩罚

```json
{
  "calculation": {
    "diseasePenalty": {
      "perDisease": 0.08,        // 从 0.05 增加
      "perAcuteDisease": 0.25,   // 从 0.15 增加
      "addictionMultiplier": 0.005  // 从 0.002 增加
    }
  }
}
```

**方法3**：调整 Sigmoid 曲线

```json
{
  "calculation": {
    "sigmoid": {
      "steepness": 0.12,   // 增加敏感度
      "midpoint": 55       // 需要更高分才能达到 50% 存活率
    }
  }
}
```

**效果**：整体存活率下降 15-25%

---

### 🎯 场景4：我想让金钱不那么重要

```json
{
  "calculation": {
    "dimensionWeights": {
      "economicSecurity": 0.05   // 从 0.10 降低
    }
  },
  "dimensions": {
    "economicSecurity": {
      "sources": [
        { "type": "currency", "attribute": "gold", 
          "weight": 0.40, "scale": "log", "logBase": 1000 },  // 从 100 增加，对数更平缓
        { "type": "income", "attribute": "weeklyNet", 
          "weight": 0.60, "multiplier": 0.03 }  // 从 0.05 降低
      ]
    }
  }
}
```

**效果**：$10,000 和 $100,000 的存活率差距从 20% 缩小到 5%

---

### 🎯 场景5：我想让贫民窟更危险

**方法1**：降低区域医疗等级

```json
{
  "regionHospitalTiers": {
    "SLUMS": 10,      // 从 20 降低
    "RUST_BELT": 30,  // 从 40 降低
    "SUBURBS": 70,
    "DOWNTOWN": 90
  }
}
```

**方法2**：增加无家可归惩罚

```json
{
  "calculation": {
    "homelessPenalty": {
      "physicalDefense": -20,   // 从 -10 增加
      "mentalStability": -30    // 从 -20 增加
    }
  }
}
```

**效果**：贫民窟流浪者的存活率降低到 10% 以下

---

### 🎯 场景6：我想让保险更有价值

```json
{
  "dimensions": {
    "medicalSupport": {
      "sources": [
        { "type": "insurance", "attribute": "hasMedical", 
          "weight": 0.60, "value": 80 },   // 权重 0.50→0.60, 分值 60→80
        { "type": "inventory", "tag": "MEDICAL", "attribute": "hp", 
          "weight": 0.20, "multiplier": 2 },  // 权重降低
        { "type": "region", "attribute": "hospitalTier", 
          "weight": 0.20 }  // 权重降低
      ]
    }
  }
}
```

**效果**：有保险 vs 没保险的存活率差距从 10% 扩大到 25%

---

### 🎯 场景7：我想让信仰成为平民的救命稻草

```json
{
  "dimensions": {
    "mentalStability": {
      "sources": [
        { "type": "housing", "attribute": "regenHp", 
          "weight": 0.50, "multiplier": 3 },  // 降低住所权重
        { "type": "faith", "attribute": "level", 
          "weight": 0.40, "multiplier": 35 },  // 增加信仰权重 0.30→0.40, 乘数 25→35
        { "type": "buff", "attribute": "sanBonus", 
          "weight": 0.10 }
      ]
    }
  }
}
```

**效果**：信仰等级5的流浪者 vs 无信仰的工人，精神维度可能反超

---

### 🎯 场景8：我想让中期游戏更有挑战

**问题**：玩家度过初期后，存活率一直 >80%，没有紧张感

**解决方案**：添加动态难度

```typescript
// 在 advanceTurn 中根据回合数调整
advanceTurn: () => {
  const state = get();
  const turn = state.vitality.time.currentTurn;
  
  // 回合越多，疾病惩罚越重（模拟身体衰老/环境恶化）
  const agingPenalty = Math.min(0.2, turn * 0.001);  // 每回合 +0.1%，最高 20%
  
  const survival = calculateSurvivalRate(state);
  const adjustedRate = survival.survivalRate - agingPenalty;
  
  // 使用调整后的率进行判定
  const roll = Math.random();
  if (roll > adjustedRate) {
    // 死亡...
  }
}
```

或者在 JSON 中配置回合惩罚：

```json
{
  "calculation": {
    "turnPenalty": {
      "enabled": true,
      "perTurn": 0.001,
      "maxPenalty": 0.15
    }
  }
}
```

---

## 各系统数值对照表

### 物品数值 (items.json)

| 物品类型 | effects 字段 | 影响维度 | 推荐数值范围 |
|---------|-------------|---------|------------|
| 食物 | `hunger: 20` | nutritionSupply | 10-40 |
| 医疗 | `hp: 30` | medicalSupport | 20-50 |
| 装备 | `maxHp: 10` | physicalDefense | 5-20 |
| 舒适 | `san: 15` | mentalStability | 10-30 |

**提示**：不需要添加新字段，系统会读取现有的 `tags` 和 `effects`！

### 住所数值 (housing.json)

| 字段 | 影响维度 | 贫民窟 | 工人 | 中产 | 资本家 |
|-----|---------|-------|------|------|--------|
| `defenseLevel` | physicalDefense | 1-3 | 3-6 | 6-10 | 10-15 |
| `regenHp` | physicalDefense + mentalStability | 5-10 | 10-20 | 20-35 | 35-50 |

**计算公式**：
- 物理防御 = defenseLevel × 5 + regenHp × 2
- 精神稳定 = regenHp × 3

### 工作数值 (jobs.json)

| 字段 | 影响维度 | 计算公式 |
|-----|---------|---------|
| `baseSalary` | economicSecurity | baseSalary × 0.05 |

**推荐数值**：
- 零工：$100-400 → 经济安全 5-20分
- 全职：$800-2500 → 经济安全 40-125分

### 保险数值 (insurance.json)

系统只检测是否有保险，不看具体数值。如果需要分级：

```json
// 可以添加 coverageScore 字段
{
  "id": "INSURANCE_BASIC",
  "type": "MEDICAL",
  "coverageScore": 40  // 影响 medicalSupport
}
```

然后在 `survivalCalculator.ts` 中修改：
```typescript
case 'insurance': {
  const medicalInsurance = state.activeInsurances?.find(ins => ins.type === 'MEDICAL');
  if (medicalInsurance) {
    value = (medicalInsurance as any).coverageScore || source.value || 60;
  }
  break;
}
```

---

## 快速测试脚本

在浏览器控制台运行：

```javascript
// 测试不同配置的存活率
function testConfig(configModifier) {
  const baseState = useGameStore.getState();
  
  // 应用配置修改
  configModifier();
  
  // 测试各种场景
  const scenarios = [
    { name: '流浪者', housing: null, gold: 50 },
    { name: '工人', housing: 'APT_RUST_01', gold: 500 },
    { name: '中产', housing: 'HOUSE_SUBURB_01', gold: 3000 },
  ];
  
  scenarios.forEach(s => {
    // 修改状态
    const testState = { ...baseState, ...s };
    const result = calculateSurvivalRate(testState);
    console.log(`${s.name}: ${(result.survivalRate * 100).toFixed(1)}%`);
  });
}

// 示例：测试更难的模式
testConfig(() => {
  config.calculation.sigmoid.steepness = 0.12;
  config.calculation.diseasePenalty.perDisease = 0.08;
});
```

---

## 常见问题速查

| 我想要... | 修改文件 | 修改位置 |
|----------|---------|---------|
| 增加整体难度 | `survival_dimensions_simple.json` | `calculation.sigmoid.steepness` |
| 让食物更重要 | `survival_dimensions_simple.json` | `dimensionWeights.nutritionSupply` |
| 让住所更重要 | `survival_dimensions_simple.json` | `dimensions.physicalDefense.sources[0].weight` |
| 调整阶级差距 | `survival_dimensions_simple.json` | `classBaseScores` |
| 让贫民窟更危险 | `survival_dimensions_simple.json` | `regionHospitalTiers.SLUMS` |
| 让保险更有用 | `survival_dimensions_simple.json` | `dimensions.medicalSupport.sources[0]` |
| 添加新维度 | `survival_dimensions_simple.json` | `dimensions` 对象 |
| 改变计算公式 | `survival_dimensions_simple.json` | `dimensions.xxx.formula` |

**注意**：所有数值配置都在 `survival_dimensions_simple.json` 中，**不需要修改** `items.json`, `housing.json` 等现有文件！
