# 完整使用流程 - 从目标到JSON

## 流程概览

```
确定设计目标 → 使用生成器计算 → 填入JSON文件 → 游戏内验证 → 微调
     ↑___________________________________________________________↓
```

---

## Step 1: 确定设计目标（5分钟）

### 1.1 选择设计对象

你要设计什么？
- [ ] 一个新物品（食物/医疗/装备）
- [ ] 一个新事件（正面/负面）
- [ ] 一个住所（贫民窟/中产/豪宅）
- [ ] 一个完整游戏阶段（开局/中期/后期）

### 1.2 确定目标存活率

基于玩家当前状态，确定期望效果：

| 场景 | 当前存活率 | 目标存活率 | 变化 |
|-----|-----------|-----------|------|
| 流浪者吃到食物 | 15% | 22% | +7% |
| 中产住豪宅 | 65% | 85% | +20% |
| 遭遇车祸事件 | 70% | 55% | -15% |
| 患上重病 | 60% | 40% | -20% |

**记录你的目标**：
```
设计对象: 神户和牛（奢侈品食物）
目标效果: 让当前存活率 60% 的玩家提升到 65%（+5%）
```

---

## Step 2: 使用生成器计算（2分钟）

### 情况A：设计物品

**在浏览器控制台输入**：
```javascript
import { generateItemJson } from '@/logic/survivalValueGenerator';

const item = generateItemJson(
  'FOOD_WAGYU_BEEF',    // 你的物品ID
  '神户和牛',            // 物品名称
  0.05,                  // 期望提升 5% 存活率
  'FOOD'                 // 类型: FOOD/MEDICAL/COMFORT
);

console.log(JSON.stringify(item, null, 2));
```

**输出**：
```json
{
  "id": "FOOD_WAGYU_BEEF",
  "name": "神户和牛",
  "type": "CONSUMABLE",
  "price": 150,
  "effects": {
    "hunger": 25          // 系统告诉你填这个值
  },
  "tags": ["FOOD"],
  "flavorText": "期望提升存活率 5%"
}
```

### 情况B：设计事件

**在浏览器控制台输入**：
```javascript
import { generateEventJson } from '@/logic/survivalValueGenerator';

const event = generateEventJson(
  'EVENT_CAR_CRASH',     // 事件ID
  '车祸',                 // 事件名称
  -0.15,                  // 期望降低 15% 存活率（负数）
  0.70                    // 玩家当前存活率 70%
);

console.log(JSON.stringify(event, null, 2));
```

**输出**：
```json
{
  "id": "EVENT_CAR_CRASH",
  "title": "车祸",
  "text": "一件坏事发生了...",
  "options": {
    "A": {
      "label": "承受损失",
      "effects": {
        "hp": -25,         // 系统算出需要扣25HP
        "gold": -300       // 系统算出需要扣$300
      }
    }
  }
}
```

### 情况C：设计完整阶段

**在浏览器控制台输入**：
```javascript
import { generateDesignReport } from '@/logic/survivalValueGenerator';

const report = generateDesignReport({
  name: '中产舒适期',
  targetSurvivalRate: 0.80,        // 期望 80% 存活率
  constraints: {
    hasHousing: true,                // 有住所
    requiredClass: 'MIDDLE',         // 中产阶级
    requiredRegion: 'SUBURBS',       // 在郊区
    minGold: 2000                    // 有$2000存款
  }
});

console.log(report);
```

---

## Step 3: 填入JSON文件（3分钟）

### 3.1 打开对应JSON文件

根据生成器输出，打开文件：
- 物品 → `game/src/assets/data/items.json`
- 住所 → `game/src/assets/data/housing.json`
- 事件 → `game/src/assets/data/events.json`
- 工作 → `game/src/assets/data/jobs.json`

### 3.2 复制数值

**示例**：添加新食物到 items.json

```json
[
  {
    "id": "FOOD_WAGYU_BEEF",
    "name": "神户和牛",
    "type": "CONSUMABLE",
    "price": 150,
    "regions": ["DOWNTOWN", "SUBURBS"],
    "effects": {
      "hunger": 25
    },
    "tags": ["FOOD", "LUXURY"],
    "flavorText": "入口即化的顶级牛肉，这是资本主义的恩赐。"
  }
]
```

### 3.3 保存文件

保存JSON，确保格式正确。

---

## Step 4: 游戏内验证（5分钟）

### 4.1 刷新游戏

保存JSON后，刷新浏览器（F5）加载新配置。

### 4.2 查看存活率

**控制台查看**：
```javascript
import { printSurvivalAnalysis } from '@/logic/survivalCalculator';
console.log(printSurvivalAnalysis(useGameStore.getState()));
```

**输出**：
```
╔══════════════════════════════════════════════════════════╗
║           存活概率分析                                    ║
╚══════════════════════════════════════════════════════════╝

📊 综合存活率: 78.3%          ← 看这里！接近目标的80%吗？
📈 综合评分: 66.2/100
🚨 风险等级: WARNING
```

### 4.3 对比目标

| 目标存活率 | 实际存活率 | 差异 | 结论 |
|-----------|-----------|------|------|
| 80% | 78.3% | -1.7% | 可接受 |
| 80% | 65% | -15% | 需要调整 |
| 80% | 90% | +10% | 需要调整 |

---

## Step 5: 微调（如果需要）

### 情况A：实际存活率偏低

**方案1**：提升该物品的数值
```json
"effects": { "hunger": 32 }   // 增加7点
```

**方案2**：降低整体难度
```json
// survival_dimensions_simple.json
{
  "calculation": {
    "sigmoid": {
      "steepness": 0.07    // 从 0.08 降低
    }
  }
}
```

### 情况B：实际存活率偏高

**方案1**：降低该物品的数值
```json
"effects": { "hunger": 18 }
```

**方案2**：增加整体难度
```json
"steepness": 0.10
```

---

## 完整示例：设计事件

### 目标
设计"车祸"事件，让存活率从 70% 降至 55%（-15%）

### Step 1-2: 使用生成器
```javascript
const event = generateEventJson('EVENT_CRASH', '车祸', -0.15, 0.70);
```

输出：`hp: -25, gold: -300`

### Step 3: 填入 events.json
```json
{
  "id": "EVENT_CRASH",
  "title": "车祸",
  "text": "你撞上了一辆停在路边的豪车...",
  "options": {
    "A": {
      "label": "赔钱私了",
      "effects": {
        "hp": -25,
        "gold": -300
      }
    }
  }
}
```

### Step 4: 验证
事件触发前后对比存活率，确认降低了约15%。

---

## 批量设计

设计整个游戏内容：

```javascript
const stages = [
  { name: '流浪者开局', rate: 0.20, class: 'HOMELESS' },
  { name: '工人稳定期', rate: 0.55, class: 'WORKER' },
  { name: '中产舒适期', rate: 0.80, class: 'MIDDLE' },
  { name: '资本家巅峰', rate: 0.92, class: 'CAPITALIST' },
];

for (const stage of stages) {
  const report = generateDesignReport({
    name: stage.name,
    targetSurvivalRate: stage.rate,
    constraints: { requiredClass: stage.class },
  });
  console.log(report);
}
```

---

## 总结

| 步骤 | 时间 | 产出 |
|-----|------|------|
| 1. 确定目标 | 5分钟 | 目标存活率 |
| 2. 生成器计算 | 2分钟 | 推荐数值 |
| 3. 填入JSON | 3分钟 | 配置文件 |
| 4. 游戏验证 | 5分钟 | 实际存活率 |
| 5. 微调 | 5分钟 | 最终配置 |

**总计：20分钟完成一个设计**

现在你可以开始了！要我帮你设计第一个物品吗？
