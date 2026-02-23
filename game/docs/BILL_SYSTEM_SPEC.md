# Bill 系统数据编写规范

> **版本**: v1.0  
> **适用文件**: `game/src/assets/data/bills.json`  
> **最后更新**: 2026-02-22

---

## 📋 目录

1. [快速开始](#快速开始)
2. [完整字段定义](#完整字段定义)
3. [触发条件详解](#触发条件详解)
4. [账单类型说明](#账单类型说明)
5. [效果字段参考](#效果字段参考)
6. [金额计算机制](#金额计算机制)
7. [示例模板](#示例模板)
8. [最佳实践](#最佳实践)
9. [系统耦合关系](#系统耦合关系)

---

## 快速开始

### 最小可用账单

```json
{
  "id": "B_UNIQUE_ID",
  "name": "账单显示名称",
  "amount": -100,
  "type": "JUMP_SCARE",
  "weight": 10,
  "triggerCondition": {
    "requiredClass": ["WORKER"]
  },
  "flavorText": "这是账单事件的描述文本，会显示在弹窗中。"
}
```

### 完整复杂账单

```json
{
  "id": "B_EXAMPLE_COMPLEX",
  "name": "复杂账单示例",
  "amount": -500,
  "type": "LEGAL",
  "weight": 15,
  "triggerCondition": {
    "requiredClass": ["MIDDLE", "CAPITALIST"],
    "minGold": 1000,
    "maxGold": 10000,
    "minInsight": 30,
    "hasHousing": true,
    "hasItemTag": "VEHICLE",
    "noInsuranceType": "AUTO"
  },
  "image": "/assets/bills/example.png",
  "flavorText": "事件描述文本，支持多行。",
  "news": {
    "source": "New York Times",
    "content": "相关新闻剪报内容"
  },
  "roast": "一句话吐槽，显示在账单底部",
  "effects": {
    "hp": -20,
    "insight": 10,
    "insightGain": 5,
    "insightClear": 10
  }
}
```

---

## 完整字段定义

### 核心字段（必需）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 唯一标识符，格式 `B_前缀_名称` |
| `name` | `string` | ✅ | 账单显示名称，建议 2-8 个汉字 |
| `amount` | `number` | ✅ | 金额（负数=扣款，正数=奖励） |
| `type` | `string` | ✅ | 账单类型，见[账单类型说明](#账单类型说明) |
| `weight` | `number` | ✅ | 触发权重，默认 10，越高越容易被选中 |
| `triggerCondition` | `object` | ✅ | 触发条件，见[触发条件详解](#触发条件详解) |
| `flavorText` | `string` | ✅ | 事件描述文本，50-200 字为宜 |

### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `image` | `string` | 图片路径，如 `/assets/bills/xxx.png` |
| `news` | `object` | 新闻剪报，包含 `source` 和 `content` |
| `roast` | `string` | 一句话吐槽，黑色幽默风格 |
| `effects` | `object` | 效果，见[效果字段参考](#效果字段参考) |

---

## 触发条件详解

### 基础条件

```json
{
  "triggerCondition": {
    "requiredClass": ["HOMELESS", "WORKER", "MIDDLE", "CAPITALIST"],
    "minGold": 0,
    "maxGold": 10000,
    "minInsight": 0,
    "maxInsight": 100,
    "isDebtOnly": true
  }
}
```

| 条件 | 类型 | 说明 |
|------|------|------|
| `requiredClass` | `string[]` | 适用阶级，可多个 |
| `minGold` | `number` | 最低金币要求 |
| `maxGold` | `number` | 最高金币限制 |
| `minInsight` | `number` | 最低灵视值 |
| `maxInsight` | `number` | 最高灵视值 |
| `isDebtOnly` | `boolean` | 仅负债时触发（gold < 0） |

### 资产条件

```json
{
  "triggerCondition": {
    "hasHousing": true,
    "hasVehicle": "CAR_SEDAN",
    "hasItem": "LICENSE_FAKE",
    "hasItemTag": "VEHICLE",
    "noItem": "LICENSE_VALID",
    "noItemTag": "LICENSE"
  }
}
```

| 条件 | 类型 | 说明 |
|------|------|------|
| `hasHousing` | `boolean` | 是否有房产 |
| `hasVehicle` | `string` | 拥有特定车辆ID |
| `hasItem` | `string` | 拥有特定物品ID |
| `hasItemTag` | `string` | 拥有某类标签物品（VEHICLE/LICENSE） |
| `noItem` | `string` | 不拥有特定物品 |
| `noItemTag` | `string` | 不拥有某类标签物品 |

### 保险条件

```json
{
  "triggerCondition": {
    "noInsuranceType": "AUTO",
    "noInsuranceType": "MEDICAL"
  }
}
```

| 条件 | 类型 | 说明 |
|------|------|------|
| `noInsuranceType` | `string` | 无某类保险时触发（AUTO/MEDICAL） |

### 贷款条件

```json
{
  "triggerCondition": {
    "hasOverdueLoan": "LOAN_CAR_SUBPRIME",
    "overdueWeeks": 2
  }
}
```

| 条件 | 类型 | 说明 |
|------|------|------|
| `hasOverdueLoan` | `string` | 有特定逾期贷款 |
| `overdueWeeks` | `number` | 逾期周数要求 |

### 信仰条件（新增）

```json
{
  "triggerCondition": {
    "hasFaith": "CHURCH",
    "noFaith": true
  }
}
```

| 条件 | 类型 | 说明 |
|------|------|------|
| `hasFaith` | `string` | 拥有特定信仰（CHURCH/BROTHERHOOD/CULT/REVOLUTION） |
| `noFaith` | `boolean` | 无信仰时触发 |

### 加密货币条件（新增）

```json
{
  "triggerCondition": {
    "hasCrypto": true,
    "hasCryptoPosition": true,
    "minLeverage": 5
  }
}
```

| 条件 | 类型 | 说明 |
|------|------|------|
| `hasCrypto` | `boolean` | 是否开通加密账户 |
| `hasCryptoPosition` | `boolean` | 是否有持仓 |
| `minLeverage` | `number` | 最低杠杆倍数 |

---

## 账单类型说明

### 类型与金额计算

| 类型 | 说明 | 阶级系数 | 典型场景 |
|------|------|----------|----------|
| `JUMP_SCARE` | 突发事件 | ✅ 应用 | 意外损失/奖励 |
| `SURPRISE` | 意外惊喜 | ✅ 应用 | 意外之财 |
| `DISASTER` | 灾难事件 | ✅ 应用 | 车祸、自然灾害 |
| `LEGAL` | 法律相关 | ❌ 无视（绝对金额） | 罚单、诉讼 |
| `VEHICLE` | 车辆相关 | ❌ 无视（绝对金额） | 修车、拖车 |
| `MEDICAL` | 医疗账单 | ✅ 应用 | 可保险减免 |

### 金额计算公式

```
实际金额 = 基础金额 × 系数 × 随机波动(0.8-1.2)

其中系数：
- LEGAL/VEHICLE 类型: 固定 1.0（绝对剥削）
- 其他类型: 根据阶级变化
  - HOMELESS: 0.5
  - WORKER: 1.0
  - MIDDLE: 1.5
  - CAPITALIST: 3.0
```

---

## 效果字段参考

### 生命值与灵视

```json
{
  "effects": {
    "hp": -20,
    "insight": 10,
    "insightGain": 15,
    "insightClear": 10
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `hp` | `number` | HP 变化（负值=伤害，正值=恢复） |
| `insight` | `number` | 直接修改灵视值 |
| `insightGain` | `number` | 增加灵视（觉醒） |
| `insightClear` | `number` | 减少灵视（沉沦/遗忘） |

### 使用建议

- **伤害账单**: 使用 `hp` 负值，配合 `insightGain`（痛苦使人清醒）
- **智商税**: `insightClear` 让玩家暂时脱离高灵视的焦虑
- **偏执税**: `insightClear` 让玩家花钱买心安

---

## 金额计算机制

### 绝对剥削 vs 资产税

```typescript
// 绝对剥削类型：无视阶级，固定 1.0 倍率
const isAbsolute = ['LEGAL', 'VEHICLE'].includes(bill.type);
const multiplier = isAbsolute ? 1.0 : classMultipliers[currentClass];

// 示例：违停罚单 $250
// HOMELESS: $250 × 1.0 = $250 (占收入 167%)
// CAPITALIST: $250 × 1.0 = $250 (占收入 1.6%)
```

### Archive 档案减免

```typescript
// LEGAL 账单：中产档案减免 20%
if (bill.type === 'LEGAL' && archiveCounts.middle >= 5) {
  reduction += 0.2;
}

// VEHICLE 账单：工人档案减免 30%
if (bill.type === 'VEHICLE' && archiveCounts.worker >= 10) {
  reduction += 0.3;
}

// 最高减免 90%，总得付点钱
finalAmount = Math.floor(amount * Math.max(0.1, 1 - reduction));
```

---

## 示例模板

### 模板 1: 阶级专属账单

```json
{
  "id": "B_WORKER_EXAMPLE",
  "name": "工人阶级账单示例",
  "amount": -300,
  "type": "JUMP_SCARE",
  "weight": 15,
  "triggerCondition": {
    "requiredClass": ["WORKER"],
    "minGold": 100
  },
  "image": "/assets/bills/worker_example.png",
  "flavorText": "这是工人阶级才会遇到的特定问题。",
  "news": {
    "source": "ProPublica",
    "content": "相关新闻报道内容"
  },
  "roast": "这就是蓝领的生活，欢迎来到美国梦。",
  "effects": {
    "hp": -10,
    "insightGain": 5
  }
}
```

### 模板 2: 灵视触发账单

```json
{
  "id": "B_INSIGHT_EXAMPLE",
  "name": "灵视触发账单",
  "amount": -150,
  "type": "JUMP_SCARE",
  "weight": 20,
  "triggerCondition": {
    "minInsight": 60
  },
  "flavorText": "高灵视者才能看到的真相，带来特殊的代价。",
  "roast": "看得太清楚也是一种病。",
  "effects": {
    "insightClear": 10
  }
}
```

### 模板 3: 负债逃生舱账单

```json
{
  "id": "B_ESCAPE_EXAMPLE",
  "name": "债务逃生舱",
  "amount": 1000,
  "type": "SURPRISE",
  "weight": 50,
  "triggerCondition": {
    "isDebtOnly": true
  },
  "flavorText": "绝境中的一线生机，但代价惨重。",
  "roast": "活下去，哪怕只剩半条命。",
  "effects": {
    "hp": -30,
    "insightGain": 20
  }
}
```

### 模板 4: 信仰账单

```json
{
  "id": "B_FAITH_EXAMPLE",
  "name": "信仰税",
  "amount": -100,
  "type": "LEGAL",
  "weight": 25,
  "triggerCondition": {
    "hasFaith": "CHURCH"
  },
  "flavorText": "组织需要资金来维持运转。",
  "roast": "信仰是免费的，但教会不是。"
}
```

### 模板 5: 加密货币账单

```json
{
  "id": "B_CRYPTO_EXAMPLE",
  "name": "加密灾难",
  "amount": -5000,
  "type": "DISASTER",
  "weight": 15,
  "triggerCondition": {
    "hasCrypto": true,
    "minLeverage": 10
  },
  "flavorText": "高杠杆带来高风险。",
  "roast": "这不是投资，这是赌博。",
  "effects": {
    "hp": -10,
    "insightGain": 25
  }
}
```

---

## 最佳实践

### 1. ID 命名规范

- 格式: `B_前缀_描述`
- 前缀对应阶级或类型:
  - `B_HOMELESS_`: 流浪汉
  - `B_WORKER_`: 工人
  - `B_MIDDLE_`: 中产
  - `B_CAPITALIST_`: 资本家
  - `B_GENERAL_`: 通用
  - `B_FAITH_`: 信仰相关
  - `B_CRYPTO_`: 加密货币
  - `B_ESCAPE_`: 逃生舱

### 2. 金额设计原则

| 阶级 | 小额惩罚 | 中等惩罚 | 致命惩罚 | 意外奖励 |
|------|----------|----------|----------|----------|
| HOMELESS | $20-50 | $50-150 | $150+ | $50-200 |
| WORKER | $100-300 | $300-800 | $800+ | $200-1000 |
| MIDDLE | $500-2000 | $2000-8000 | $8000+ | $1000-10000 |
| CAPITALIST | $5000-20000 | $20000-100000 | $100000+ | $10000-500000 |

### 3. 权重分配建议

- **常见事件**: weight 15-25（每周都有概率触发）
- **稀有事件**: weight 5-10（偶尔触发）
- **逃生舱事件**: weight 40-60（负债时必须快速触发）
- **传说事件**: weight 1-3（极其罕见）

### 4. 文案风格指南

- **flavorText**: 描述性，沉浸式，50-150字
- **roast**: 黑色幽默，一句话，直击痛点
- **news.source**: 使用真实媒体名称增加沉浸感
- **news.content**: 模仿新闻标题风格

### 5. 效果设计原则

- 扣钱账单 → 配合 `insightGain`（痛苦觉醒）
- 奖励账单 → 配合 `insightClear`（幸福使人盲目）
- 逃生舱 → 大金额正数 + 大 HP 伤害
- 绝对剥削 → 无视阶级，固定金额

---

## 系统耦合关系

### 账单系统与其他系统的交互

```
BillSystem
├── 保险系统 → 医疗账单减免
├── 房产系统 → 防御减免（DISASTER/JUMP_SCARE）
├── 车辆系统 → 标签检查、物品移除
├── 银行系统 → 负债概率提升、逾期贷款触发
├── 库存系统 → 物品ID/标签检查
├── 医疗系统 → 延迟账单、保险报销
├── 阶级系统 → 专属触发、金额系数
├── 监狱系统 → 狱中阻断
├── 信仰系统 → 信仰专属账单（新增）
├── 加密货币 → 持仓/杠杆触发（新增）
└── Archive系统 → 档案减免
```

### 新增账单时的检查清单

- [ ] ID 唯一且不重复
- [ ] 金额符合阶级预期
- [ ] type 选择正确（LEGAL/VEHICLE 为绝对金额）
- [ ] triggerCondition 逻辑完备
- [ ] 至少填写 flavorText
- [ ] JSON 格式验证通过（无 trailing comma）
- [ ] 如有特殊效果需在 BillSystem.ts 添加处理逻辑

---

## 附录：现有账单速查

### 按类型统计

| 类型 | 数量 | 代表账单 |
|------|------|----------|
| JUMP_SCARE | ~60 | 突发事件为主 |
| SURPRISE | ~20 | 意外奖励为主 |
| LEGAL | ~10 | 罚单、诉讼 |
| VEHICLE | ~8 | 修车、拖车 |
| DISASTER | ~5 | 车祸、自然灾害 |
| MEDICAL | ~4 | 医疗账单 |

### 按阶级统计

| 阶级 | 数量 |
|------|------|
| HOMELESS | ~19 |
| WORKER | ~17 |
| MIDDLE | ~17 |
| CAPITALIST | ~16 |
| GENERAL | ~12 |
| 信仰相关 | 3 |
| 加密相关 | 3 |

---

## 联系与反馈

如有疑问或发现数据问题，请联系系统设计者或提交 Issue。

---

**Happy Billing! 💸**
