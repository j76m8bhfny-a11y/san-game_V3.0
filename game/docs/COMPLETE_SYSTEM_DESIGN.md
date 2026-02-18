# 完整系统设计 - 所有 JSON 如何影响生存

## 核心设计理念

```
所有系统最终都归入 5 大生存维度

items/housing/jobs        → 基础维度分数（确定性）
events/bills/news         → 随机扰动（近期冲击）  
vehicles/licenses         → 区域能力（机会扩展）
faith/diseases            → 状态修正（持续影响）
```

---

## 各系统与生存维度的映射

### 1. 物品系统 (items.json)

| 物品类型 | 关键字段 | 影响维度 | 计算方式 |
|---------|---------|---------|---------|
| 食物 | `effects.hunger` + `tags: ["FOOD"]` | nutritionSupply | hunger × 1.5 |
| 医疗 | `effects.hp` + `tags: ["MEDICAL"]` | medicalSupport | hp × 2 |
| 装备 | `effects.maxHp` | physicalDefense | maxHp × 0.2 |
| 舒适 | `effects.san` | mentalStability | san × 1.2 |

---

### 2. 住所系统 (housing.json)

| 字段 | 影响维度 | 计算方式 |
|-----|---------|---------|
| `defenseLevel` | physicalDefense | defenseLevel × 5 |
| `regenHp` | physicalDefense + mentalStability | regenHp × 2~3 |
| `region` | 区域修正 | 贫民窟-10%, 市中心+10% |

---

### 3. 工作系统 (jobs.json)

| 字段 | 影响维度 | 计算方式 |
|-----|---------|---------|
| `baseSalary` | economicSecurity | baseSalary × 0.05 |
| `hpCost` | 负面 | 高消耗降低有效HP |
| `sanCost` | 负面 | 高消耗降低有效SAN |

**跨区工作影响**：
- 需要车辆才能做的工作：如果没车，无法获得该收入
- 需要驾照的工作：如果没驾照，无法获得该收入

---

### 4. 事件系统 (events.json) ⭐ 新增

**事件是"随机扰动"的主要来源**

```json
{
  "id": "EVENT_ROBBERY",
  "options": {
    "A": {
      "effects": {
        "hp": -20,        // ← 直接影响 physicalDefense
        "gold": -100      // ← 直接影响 economicSecurity
      }
    }
  }
}
```

**事件影响计算**：
- 最近3个回合发生的事件效果累积
- 负面事件降低存活率（-5%~-20%）
- 正面事件提升存活率（+3%~+10%）

---

### 5. 账单系统 (bills.json) ⭐ 新增

**突发账单是经济冲击**

```json
{
  "id": "BILL_MEDICAL_EMERGENCY",
  "amount": 500,        // ← 大额支出影响 economicSecurity
  "effects": {
    "hp": -10          // 可选：直接伤害
  }
}
```

**账单影响计算**：
- 未支付的账单累积为"债务压力"
- 债务压力降低 mentalStability（焦虑）
- 债务压力降低 economicSecurity（信用受损）

---

### 6. 新闻/市场系统 (news.json) ⭐ 新增

**加密市场波动影响经济安全**

```json
{
  "id": "NEWS_CRYPTO_CRASH",
  "effect": -0.3        // ← 市场下跌 30%
}
```

**市场影响计算**：
- 持有加密仓位时，市场波动直接影响资产
- 大幅亏损（>50%）严重降低 economicSecurity
- 持续亏损触发 mentalStability 下降（恐慌）

---

### 7. 车辆系统 (vehicles.json + licenses.json) ⭐ 新增

**车辆和驾照是"区域能力"**

```json
{
  "id": "VEHICLE_BROKEN_TRUCK",
  "requiredLicense": "CLASS_C",
  "reliability": 0.7    // ← 故障率影响稳定性
}
```

**车辆影响计算**：

| 状态 | 影响 |
|-----|------|
| 无车 | 只能做本地工作（收入-30%） |
| 有旧车 | 可以做跨区工作，但有故障风险 |
| 有新车 | 可以做跨区工作，稳定 |
| 无驾照 | 不能做需要车辆的工作 |

**计算公式**：
```
vehicleBonus = hasVehicle ? (vehicleReliability * 15) : 0
licensePenalty = requiredButNoLicense ? -20 : 0

// 影响 economicSecurity（通过工作机会）
// 影响 physicalDefense（车辆提供庇护）
```

---

### 8. 信仰系统 (faiths.json)

| 字段 | 影响维度 | 计算方式 |
|-----|---------|---------|
| `level` | mentalStability | level × 25 |
| `rite.sanCost` | 负面 | 仪式消耗 |
| `rite.hpReward` | 正面 | 恢复HP |

---

### 9. 疾病系统 (diseases.json)

| 类型 | 存活率惩罚 | 其他影响 |
|-----|-----------|---------|
| `ACUTE` | -15% | 立即大幅扣HP |
| `CHRONIC` | -5% | 每回合持续扣HP/SAN |
| `MENTAL` | -5% | 降低 mentalStability |

---

### 10. 医院服务 (hospital_services.json)

**拥有治疗能力提升 medicalSupport**

```json
{
  "id": "SERVICE_SURGERY",
  "effects": {
    "hpRestore": 50    // ← 拥有此服务时 +medicalSupport
  }
}
```

---

## 扩展后的维度计算

### nutritionSupply（营养供给）
```
= 饮食追踪得分 × 0.5
+ 背包食物平均值 × 0.3
+ 住所厨房 × 0.2
- 疾病惩罚 × 0.1
```

### physicalDefense（物理防御）
```
= 住所 defenseLevel × 5
+ 住所 regenHp × 2
+ 车辆庇护 bonus
+ 装备 bonus
- 疾病类型惩罚
- 事件伤害惩罚（最近）
```

### mentalStability（精神稳定）
```
= 住所 regenHp × 3
+ 信仰 level × 25
+ 舒适物品 bonus
- 债务压力
- 市场亏损焦虑
- 事件创伤（最近）
```

### medicalSupport（医疗支持）
```
= 保险覆盖 60分
+ 背包医疗物品
+ 区域医院等级
+ 医院服务可用性
- 急性病惩罚
```

### economicSecurity（经济安全）
```
= 周收入 × 0.05
+ 现金对数
+ 车辆工作机会 bonus
- 未付账单压力
- 市场亏损
- 区域限制惩罚（无车/无驾照）
```

---

## 随机扰动计算（新增）

```typescript
interface VarianceInput {
  // 来自 events.json
  recentEvents: EventEffect[];      // 最近3回合的事件
  
  // 来自 bills.json
  pendingBills: number;              // 未付账单总额
  
  // 来自 news.json
  marketVolatility: number;          // 市场波动率
  
  // 来自 vehicles.json
  vehicleBreakdownRisk: number;      // 车辆故障概率
}

function calculateVariance(
  baseRate: number,
  variance: VarianceInput
): number {
  let adjustment = 0;
  
  // 近期事件影响
  for (const event of variance.recentEvents) {
    adjustment += event.impact;  // -0.2 ~ +0.1
  }
  
  // 债务压力
  if (variance.pendingBills > 500) {
    adjustment -= 0.1;  // 大额债务 -10%
  }
  
  // 市场恐慌
  if (variance.marketVolatility > 0.3) {
    adjustment -= 0.05;  // 市场波动 -5%
  }
  
  // 车辆故障风险
  if (variance.vehicleBreakdownRisk > 0.5) {
    adjustment -= 0.03;  // 担心车坏 -3%
  }
  
  return Math.max(-0.3, Math.min(0.2, adjustment));
}
```

---

## 设计建议

### 如何设计一个完整的事件链

```
例子：车辆故障事件链

1. vehicles.json
   - 旧车 reliability: 0.7（30%故障率）

2. events.json
   - EVENT_CAR_BREAKDOWN（车辆故障事件）
   - 选项：
     A. 花钱修车 (-$200, 无惩罚)
     B. 不修继续开 (触发 BILL_ACCIDENT 风险)

3. bills.json
   - BILL_ACCIDENT（事故账单）
   - amount: 1000
   - effects: { hp: -20 }

4. 最终影响
   - 修车：economicSecurity -200
   - 不修车：40%概率事故 → -1000钱, -20HP
```

### 如何设计区域差异

```
贫民窟(SLUMS):
- 医院等级: 20分
- 工作收入: -30%
- 事件池: 更多负面事件
- 食物: 只有垃圾食品

市中心(DOWNTOWN):
- 医院等级: 90分
- 工作收入: +50%
- 事件池: 更多正面/中性事件
- 食物: 全种类

跨区域需要:
- 车辆 (vehicles.json)
- 或 驾照 (licenses.json)
```

---

## 下一步行动

要我帮你：

1. **扩展 survivalCalculator.ts** - 加入所有系统的计算？
2. **设计具体的事件数值** - events.json 如何影响存活？
3. **设计车辆/驾照系统** - 如何影响工作和收入？
4. **设计账单冲击** - bills.json 如何与存活联动？

选一个，我立即实现！
