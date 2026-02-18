# 数值生成器使用指南

## 核心思想

```
传统方式：凭感觉填数值 → 测试 → 不对再调 → 重复
生成器方式：输入目标存活率 → 系统计算 → 直接给出JSON配置
```

## 快速开始

### 1. 设计一个新物品

**场景**：我要设计一个"神户和牛"，期望它能让玩家存活率提升 5%

```typescript
import { generateItemJson } from '@/logic/survivalValueGenerator';

const item = generateItemJson(
  'FOOD_WAGYU_BEEF',    // id
  '神户和牛',            // 名称
  0.05,                  // 期望提升 5% 存活率
  'FOOD'                 // 类型
);

console.log(item);
// 输出:
// {
//   "id": "FOOD_WAGYU_BEEF",
//   "name": "神户和牛",
//   "effects": { "hunger": 25 },  // 系统算出需要 25 hunger
//   "price": 150,                  // 系统自动定价
//   "tags": ["FOOD"]
// }
```

**复制到 items.json 即可！**

---

### 2. 设计一个事件

**场景**：我要设计一个"车祸"事件，期望降低玩家 15% 存活率

```typescript
import { generateEventJson } from '@/logic/survivalValueGenerator';

const event = generateEventJson(
  'EVENT_CAR_CRASH',
  '车祸',
  -0.15,        // 降低 15%
  0.70          // 玩家当前存活率 70%
);

console.log(event);
// 输出:
// {
//   "effects": {
//     "hp": -25,       // 系统算出需要 -25 HP
//     "gold": -300     // 系统算出需要 -$300
//   }
// }
```

**解释**：
- 玩家受 -25 HP 伤害 → physicalDefense 维度下降
- 损失 $300 → economicSecurity 维度下降
- 综合效果：存活率从 70% 降至 55%

---

### 3. 设计一个完整状态（批量生成）

**场景**：我要设计"中产舒适期"状态，期望存活率 80%

```typescript
import { generateDesignReport } from '@/logic/survivalValueGenerator';

const report = generateDesignReport({
  name: '中产舒适期',
  targetSurvivalRate: 0.80,
  constraints: {
    hasHousing: true,
    requiredClass: 'MIDDLE',
    minGold: 2000,
  },
});

console.log(report);
```

**输出**：
```
╔══════════════════════════════════════════════════════════╗
║  数值设计方案: 中产舒适期                                   ║
╚══════════════════════════════════════════════════════════╝

🎯 目标存活率: 80%
📊 所需综合分数: 68.5/100

══════════════════════════════════════════════════════════
💎 推荐 JSON 配置
══════════════════════════════════════════════════════════

【items.json】
  食物物品:
    "effects": { "hunger": 28 }
    "tags": ["FOOD"]

  医疗物品:
    "effects": { "hp": 15 }
    "tags": ["MEDICAL"]

【housing.json】
  "defenseLevel": 8
  "regenHp": 25

【jobs.json】
  "baseSalary": 2200
  (周收入 $2200 ≈ 经济安全 +110分)

══════════════════════════════════════════════════════════
📈 维度分解
══════════════════════════════════════════════════════════

physicalDefense (目标: 41分)
  └─ housing.defenseLevel: +40分 (配置值: 8)
  └─ housing.regenHp: +50分 (配置值: 25)
  └─ classBase: +12分 (配置值: auto)

mentalStability (目标: 34分)
  └─ housing.regenHp: +75分 (配置值: 25)
  └─ classBase: +4.5分 (配置值: auto)
...
```

**直接复制数值到你的 JSON 文件！**

---

## 完整工作流

### Step 1: 规划游戏阶段

确定你要几个阶段，每个阶段的期望存活率：

| 阶段 | 目标存活率 | 描述 |
|-----|-----------|------|
| 开局 | 20% | 九死一生 |
| 稳定 | 55% | 勉强生存 |
| 小康 | 80% | 比较安全 |
| 富裕 | 92% | 高枕无忧 |

### Step 2: 批量生成配置

```typescript
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
  
  // 保存报告，按阶段配置你的 JSON
  console.log(report);
}
```

### Step 3: 设计事件池

为每个阶段设计合适的事件：

```typescript
// 开局事件：危险但有机会
const startEvent = generateEventJson('EVENT_START', '开局', -0.05, 0.20);

// 中期事件：小额损失
const midEvent = generateEventJson('EVENT_MID', '中期', -0.10, 0.55);

// 后期事件：几乎无影响
const lateEvent = generateEventJson('EVENT_LATE', '后期', -0.03, 0.80);
```

### Step 4: 验证平衡性

```typescript
// 检查物品性价比是否合理
const items = [
  { name: '泡面', hunger: 10, price: 5 },   // 性价比 2.0
  { name: '罐头', hunger: 20, price: 15 },  // 性价比 1.33
  { name: '牛排', hunger: 35, price: 150 }, // 性价比 0.23
];

// 确保：便宜 > 中等 > 昂贵（性价比递减）
```

---

## 常见设计问题速查

### Q: 我想让某个物品提升 3% 存活率，应该给多少 hunger？

```typescript
import { generateItemJson } from '@/logic/survivalValueGenerator';

const item = generateItemJson('MY_ITEM', '测试物品', 0.03, 'FOOD');
console.log(item.effects.hunger);  // 系统告诉你需要多少
```

### Q: 我想设计一个严重事件，降低 25% 存活率，应该扣多少 HP？

```typescript
const event = generateEventJson('EVENT_SEVERE', '严重事件', -0.25, 0.60);
console.log(event.effects);  // { hp: -42, gold: -500 }
```

### Q: 现有配置下玩家存活率 70%，我想降到 50%，需要加多少难度？

```typescript
// 方法1：增加疾病
// 需要惩罚 = 70% - 50% = 20%
// 加 4 个普通疾病（每个 -5%）或 1 个急性病（-15%）+ 1 个普通（-5%）

// 方法2：调陡 Sigmoid
// 修改 survival_dimensions_simple.json
// "sigmoid": { "steepness": 0.10 }  // 从 0.08 增加
```

### Q: 如何设计阶级之间的差距？

```typescript
// 调整 classBaseScores
{
  "HOMELESS": { "physicalDefense": 5 },   // 基础 5分
  "CAPITALIST": { "physicalDefense": 50 }  // 基础 50分
}
// 差距 10 倍，配合其他因素，最终存活率差距约 40-50%
```

---

## 高级技巧

### 技巧1：设计边缘状态

```typescript
// 设计一个"看起来安全实际危险"的状态
const tricky = generateValuesForState({
  name: '表面小康',
  targetSurvivalRate: 0.45,  // 实际危险
  constraints: {
    hasHousing: true,          // 有好房子
    minGold: 5000,             // 有钱
    // 但缺少医疗和食物...
  },
});

// 这会告诉你：即使有钱有房，缺少医疗也会很危险
```

### 技巧2：设计多路径

```typescript
// 达到 70% 存活率的两种不同方式

// 路径A：高防御低经济
const pathA = generateValuesForState({
  name: '防御流',
  targetSurvivalRate: 0.70,
  constraints: { /* 配置... */ },
});

// 路径B：高经济低防御
const pathB = generateValuesForState({
  name: '财富流',
  targetSurvivalRate: 0.70,
  constraints: { /* 不同配置... */ },
});

// 比较两种路径的 JSON 配置差异
```

### 技巧3：平衡性测试

```typescript
// 测试不同配置的等效性
const configs = [
  { housing: 8, food: 20, job: 1000 },
  { housing: 5, food: 30, job: 1500 },
  { housing: 10, food: 15, job: 800 },
];

// 哪些配置能达到相同的存活率？
// 让玩家有多种方式生存
```

---

## 文件清单

| 文件 | 用途 | 修改频率 |
|-----|------|---------|
| `survivalValueGenerator.ts` | 核心算法 | ❌ 不改 |
| `survival_dimensions_simple.json` | 全局难度 | ⚠️ 偶尔 |
| `items.json` | 物品数值 | ✅ 经常 |
| `housing.json` | 住所数值 | ✅ 经常 |
| `jobs.json` | 工作数值 | ✅ 经常 |
| `events.json` | 事件数值 | ✅ 经常 |
| `diseases.json` | 疾病惩罚 | ⚠️ 偶尔 |

---

## 一句话总结

> **用 `generateDesignReport()` 输入目标存活率，系统输出 JSON 配置。用 `generateEventJson()` 设计事件影响。调 `sigmoid.steepness` 控制整体难度。**

要我帮你设计某个具体场景吗？比如"贫民窟的冬天"应该配置成什么样？
