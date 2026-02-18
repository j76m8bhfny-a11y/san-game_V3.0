# 存活计算模型使用指南

## 快速开始（3步）

### 第1步：在 Store 中集成计算

找到你的 `createVitalitySlice.ts` 或类似文件，添加存活计算：

```typescript
import { calculateSurvivalRate, checkSurvival, SurvivalResult } from '@/logic/survivalCalculator';

// 在 slice 中添加
export interface VitalitySlice {
  // ... 现有代码 ...
  
  // 新增：存活计算
  getSurvivalRate: () => SurvivalResult;
  checkDeath: () => { survived: boolean; roll: number; rate: number };
}

export const createVitalitySlice: StateCreator<StoreState, [], [], VitalitySlice> = (set, get) => ({
  // ... 现有代码 ...
  
  // 新增方法
  getSurvivalRate: () => {
    const state = get();
    return calculateSurvivalRate(state);
  },
  
  checkDeath: () => {
    const state = get();
    return checkSurvival(state);
  },
});
```

---

### 第2步：在回合结束时调用

在你的 `advanceTurn` 或类似方法中添加死亡判定：

```typescript
advanceTurn: () => {
  const state = get();
  
  // ... 现有回合逻辑 ...
  
  // 新增：存活判定
  const deathCheck = get().checkDeath();
  
  if (!deathCheck.survived) {
    // 触发死亡结局
    console.log(`💀 死亡判定: 骰子 ${(deathCheck.roll * 100).toFixed(1)}% > 存活率 ${(deathCheck.rate * 100).toFixed(1)}%`);
    
    // 触发结局
    get().triggerEnding('DEATH_GENERIC');
    return;
  }
  
  // 如果存活但危险，给玩家警告
  const survival = get().getSurvivalRate();
  if (survival.riskLevel === 'CRITICAL') {
    get().addNotification('⚠️ 警告：你的生命垂危！', 'error');
  } else if (survival.riskLevel === 'DANGER') {
    get().addNotification('🔥 警告：你的状况很危险', 'warning');
  }
}
```

---

### 第3步：在 UI 显示存活率

在你的主界面或状态面板显示当前存活率：

```typescript
import { useGameStore } from '@/store/useGameStore';

function SurvivalIndicator() {
  const survivalRate = useGameStore(state => state.getSurvivalRate());
  
  const getColor = (rate: number) => {
    if (rate >= 0.80) return '#4CAF50'; // 绿
    if (rate >= 0.60) return '#FFC107'; // 黄
    if (rate >= 0.40) return '#FF9800'; // 橙
    return '#F44336'; // 红
  };
  
  return (
    <div style={{ color: getColor(survivalRate.survivalRate) }}>
      <div>存活率: {(survivalRate.survivalRate * 100).toFixed(0)}%</div>
      <div>风险等级: {survivalRate.riskLevel}</div>
      {survivalRate.suggestions.length > 0 && (
        <div>建议: {survivalRate.suggestions[0]}</div>
      )}
    </div>
  );
}
```

---

## 配置数值（调整难度）

### 方法1：调整维度权重

打开 `game/src/assets/data/rules/survival_dimensions_simple.json`：

```json
{
  "calculation": {
    "dimensionWeights": {
      "physicalDefense": 0.40,   // 增加住所重要性
      "mentalStability": 0.20,   // 降低精神重要性
      "nutritionSupply": 0.20,
      "medicalSupport": 0.15,
      "economicSecurity": 0.05   // 降低金钱重要性
    }
  }
}
```

### 方法2：调整阶级差距

```json
{
  "classBaseScores": {
    "HOMELESS": {
      "physicalDefense": 5,    // 降低流浪者基础分
      "mentalStability": 5,
      "nutritionSupply": 5,
      "medicalSupport": 5,
      "economicSecurity": 5
    },
    "CAPITALIST": {
      "physicalDefense": 60,   // 增加资本家优势
      "mentalStability": 55,
      "nutritionSupply": 50,
      "medicalSupport": 60,
      "economicSecurity": 80
    }
  }
}
```

### 方法3：调整 Sigmoid 曲线

```json
{
  "calculation": {
    "sigmoid": {
      "steepness": 0.10,   // 增加：分数变化更敏感
      "midpoint": 45       // 降低：更容易达到高存活率
    }
  }
}
```

---

## 调试和测试

### 在控制台查看详细分析

```typescript
import { printSurvivalAnalysis } from '@/logic/survivalCalculator';

// 在任意地方调用
const state = useGameStore.getState();
console.log(printSurvivalAnalysis(state));
```

输出示例：
```
╔══════════════════════════════════════════════════════════╗
║           存活概率分析                                    ║
╚══════════════════════════════════════════════════════════╝

📊 综合存活率: 62.5%
📈 综合评分: 58.3/100
🚨 风险等级: WARNING
⚠️  最短板: nutritionSupply

维度详情:
────────────────────────────────────────────────────────────
物理防御     [████████████░░░░░░░░] 45
  └─ 住所(defenseLevel): 30.0
  └─ 住所(regenHp): 20.0
精神稳定     [██████████████░░░░░░] 55
  └─ 住所(regenHp): 30.0
  └─ 信仰等级: 25.0
营养供给     [███████░░░░░░░░░░░░░] 35  ⚠️
  └─ 饮食健康度: 40.0
  └─ 背包(FOOD): 15.0
...

💡 建议:
   • 改善饮食质量
   • 治疗疾病
```

### 模拟不同场景

```typescript
import { simulateScenarios } from '@/logic/survivalCalculator';

// 创建模拟状态函数
const createMockState = (config) => {
  // 返回一个符合 GameState 格式的对象
  return { ... };
};

const results = simulateScenarios(createMockState);
console.table(results);
// 输出:
// ┌─────────────┬──────────┬──────────┐
// │  scenario   │   rate   │   risk   │
// ├─────────────┼──────────┼──────────┤
// │ 流浪者开局  │  0.185   │ CRITICAL │
// │ 工人中期    │  0.623   │ WARNING  │
// │ 中产舒适    │  0.812   │   SAFE   │
// │ 重病危机    │  0.245   │  DANGER  │
// └─────────────┴──────────┴──────────┘
```

---

## 各系统JSON配置对照表

### 物品 (items.json)

系统会自动读取以下字段：

| 维度 | 读取的字段 | 影响方式 |
|-----|----------|---------|
| nutritionSupply | `effects.hunger` | 背包中有 FOOD 标签的物品 |
| medicalSupport | `effects.hp` | 背包中有 MEDICAL 标签的物品 |

**不需要修改 items.json**，系统会自动识别现有的 `tags` 和 `effects`。

### 住所 (housing.json)

系统会读取：

| 维度 | 读取的字段 | 计算方式 |
|-----|----------|---------|
| physicalDefense | `defenseLevel` | defenseLevel × 5 |
| physicalDefense | `regenHp` | regenHp × 2 |
| mentalStability | `regenHp` | regenHp × 3 |

**示例调整**：
```json
{
  "id": "APT_SLUMS_01",
  "name": "漏风集装箱",
  "defenseLevel": 1,    // 物理防御: 1×5 = 5分
  "regenHp": 5,         // 精神稳定: 5×3 = 15分
  ...
}
```

### 工作 (jobs.json)

系统会读取：

| 维度 | 读取的字段 | 计算方式 |
|-----|----------|---------|
| economicSecurity | `baseSalary` | baseSalary × 0.05 |

**示例**：
```json
{
  "id": "JOB_FACTORY_WORKER",
  "baseSalary": 800,    // 经济安全: 800×0.05 = 40分
  ...
}
```

### 保险 (insurance.json)

系统会检测是否有医疗保险：

| 维度 | 判断条件 | 分值 |
|-----|---------|-----|
| medicalSupport | 有 activeInsurance 且 type === 'MEDICAL' | 60分 |

---

## 常见问题

### Q: 我不想显示存活率给玩家，只想后台计算死亡
A: 没问题，只调用 `checkDeath()` 即可，不需要显示任何 UI。

### Q: 我想让某些事件直接判定死亡，不走存活率
A: 在事件处理中直接调用：
```typescript
if (event.id === 'CAR_CRASH') {
  get().triggerEnding('DEATH_CAR_CRASH');
  return; // 跳过存活判定
}
```

### Q: 存活率计算太复杂，我只想简单点
A: 可以只用 `physicalDefense` 一个维度：
```json
{
  "calculation": {
    "dimensionWeights": {
      "physicalDefense": 1.0,
      "mentalStability": 0,
      "nutritionSupply": 0,
      "medicalSupport": 0,
      "economicSecurity": 0
    }
  }
}
```

### Q: 怎么测试不同难度的数值
A: 修改 `sigmoid.steepness`：
- 0.06 = 简单模式
- 0.08 = 标准模式  
- 0.10 = 困难模式
- 0.12 = 噩梦模式

---

## 文件清单

| 文件 | 用途 | 是否需要修改 |
|-----|------|------------|
| `survival_dimensions_simple.json` | 配置中心 | ✅ 调整数值 |
| `survivalCalculator.ts` | 核心计算 | ❌ 一般不改 |
| `items.json` | 物品数据 | ❌ 自动读取 |
| `housing.json` | 住所数据 | ❌ 自动读取 |
| `jobs.json` | 工作数据 | ❌ 自动读取 |
