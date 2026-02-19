# C. JSON结构模板与字段规范

> 本文档定义所有可配置JSON文件的字段结构、数据类型和约束
> 基于现有代码 `survivalCalculator.ts` 的读取逻辑

---

## 一、items.json - 物品系统

### 文件位置
`game/src/assets/data/items.json`

### 被代码读取的字段

| 字段名 | 类型 | 必填 | 代码中的使用位置 | 说明 |
|-------|------|------|----------------|------|
| `id` | string | ✅ | 全系统 | 唯一标识符，大写下划线格式 |
| `name` | string | ✅ | UI显示 | 中文名称 |
| `type` | enum | ✅ | 系统逻辑 | "CONSUMABLE"/"PASSIVE"/"KEY" |
| `price` | integer | ✅ | UI显示 | 美元，可正可负（负数=卖钱） |
| `effects` | object | ✅ | 维度计算 | 见下表 |
| `tags` | string[] | ✅ | 维度计算 | 系统识别标签，见下表 |
| `regions` | string[] | ❌ | 商店显示 | 可销售区域，空=全区域 |
| `flavorText` | string | ❌ | UI显示 | 描述文本 |

### effects 字段详解

代码读取 `effects` 中的以下字段：

| 字段名 | 类型 | 影响维度 | 代码中的使用 |
|-------|------|---------|------------|
| `hp` | integer | medicalSupport | medicalSupport计算，×2乘数 |
| `hunger` | integer | nutritionSupply | nutritionSupply计算，×1.5乘数 |
| `san` | integer | mentalStability | （预留，当前未接入） |
| `addiction` | integer | 疾病惩罚 | 直接加在成瘾度上 |

### tags 字段详解

代码通过 `tags` 识别物品类型：

| tag值 | 代码中的识别 | 必须配合的effects字段 |
|------|------------|---------------------|
| `"FOOD"` | nutritionSupply计算 | `effects.hunger` |
| `"MEDICAL"` | medicalSupport计算 | `effects.hp` |
| `"JUNK_FOOD"` | 饮食追踪系统 | `effects.addiction` |
| `"SNAP_ELIGIBLE"` | 系统逻辑（预留） | - |
| `"TIER_1"` | 系统逻辑（预留） | - |

### 完整模板

```json
{
  "id": "FOOD_EXAMPLE_ID",
  "name": "示例食物",
  "type": "CONSUMABLE",
  "price": 20,
  "regions": ["SLUMS", "RUST_BELT"],
  "effects": {
    "hunger": 20,
    "hp": 0,
    "addiction": 0
  },
  "tags": ["FOOD", "JUNK_FOOD"],
  "flavorText": "这是示例描述文本。"
}
```

### 约束条件

1. **ID格式**：全大写，单词间下划线分隔，如 `FOOD_WAGYU_BEEF`
2. **价格范围**：建议 $1-$5000，负数需配合 `POOR_ONLY` 标签
3. **effects至少一个非零**：否则物品无效果
4. **tags必须包含系统标签**：否则无法被维度计算识别

---

## 二、housing.json - 住所系统

### 文件位置
`game/src/assets/data/housing.json`

### 被代码读取的字段

| 字段名 | 类型 | 必填 | 代码中的使用位置 | 说明 |
|-------|------|------|----------------|------|
| `id` | string | ✅ | 全系统 | 唯一标识符，大写下划线 |
| `name` | string | ✅ | UI显示 | 中文名称 |
| `defenseLevel` | integer | ✅ | physicalDefense | ×5乘数 |
| `regenHp` | integer | ✅ | physicalDefense + mentalStability | ×2和×3乘数 |
| `value` | integer | ✅ | 系统逻辑 | 房产价值（净资产计算） |
| `region` | enum | ✅ | 系统逻辑 | "SLUMS"/"RUST_BELT"/"SUBURBS"/"DOWNTOWN" |
| `requiredClass` | enum | ✅ | 购买限制 | "HOMELESS"/"WORKER"/"MIDDLE"/"CAPITALIST" |
| `rentConfig` | object | 条件 | 系统逻辑 | 租房配置，见下表 |
| `buyConfig` | object | 条件 | 系统逻辑 | 购房配置，见下表 |
| `description` | string | ❌ | UI显示 | 描述文本 |

### rentConfig 字段详解（租房）

| 字段名 | 类型 | 说明 |
|-------|------|------|
| `deposit` | integer | 押金 |
| `weeklyCosts` | array | 每周费用列表 |
| `weeklyCosts[].key` | string | 费用代码，如 "RENT" |
| `weeklyCosts[].label` | string | 费用名称，如 "租金" |
| `weeklyCosts[].baseAmount` | integer | 费用金额 |

### buyConfig 字段详解（购房）

| 字段名 | 类型 | 说明 |
|-------|------|------|
| `price` | integer | 总房价 |
| `downPaymentRate` | number | 首付比例（0-1） |
| `mortgageTermTurns` | integer | 贷款周期（周数） |
| `interestRate` | number | 周利率（如0.002=0.2%） |
| `weeklyCosts` | array | 每周费用（同rentConfig） |

### 完整模板

```json
{
  "id": "APT_SLUMS_EXAMPLE",
  "name": "示例集装箱",
  "region": "SLUMS",
  "requiredClass": "HOMELESS",
  "value": 0,
  "defenseLevel": 1,
  "regenHp": 5,
  "rentConfig": {
    "deposit": 0,
    "weeklyCosts": [
      { "key": "RENT", "label": "床位费", "baseAmount": 50 },
      { "key": "PROTECTION", "label": "保护费", "baseAmount": 20 }
    ]
  },
  "description": "这是示例描述。"
}
```

### 约束条件

1. **defenseLevel范围**：建议1-15
2. **regenHp范围**：建议5-50
3. **rentConfig和buyConfig至少一个**：不能都没有
4. **value与配置匹配**：租房value=0，购房value=房价

---

## 三、jobs.json - 工作系统

### 文件位置
`game/src/assets/data/jobs.json`

### 被代码读取的字段

| 字段名 | 类型 | 必填 | 代码中的使用位置 | 说明 |
|-------|------|------|----------------|------|
| `id` | string | ✅ | 全系统 | 唯一标识符 |
| `title` | string | ✅ | UI显示 | 工作名称 |
| `type` | enum | ✅ | 系统逻辑 | "FULL_TIME"/"GIG" |
| `baseSalary` | integer | ✅ | economicSecurity | ×0.05乘数 |
| `hpCost` | integer | ✅ | 系统逻辑（预留） | 每周消耗HP |
| `sanCost` | integer | ✅ | 系统逻辑（预留） | 每周消耗SAN |
| `region` | enum | ✅ | 系统逻辑 | 工作所在区域 |
| `requiredClass` | enum | ✅ | 系统逻辑 | 最低阶级要求 |
| `requiresHousing` | boolean | ✅ | 系统逻辑 | 是否需要住所 |
| `requiredItem` | string | ❌ | 系统逻辑 | 需要的物品ID（如"VEHICLE"） |
| `payCycle` | enum | ✅ | 系统逻辑 | "DAILY"/"WEEKLY"/"MONTHLY" |
| `description` | string | ❌ | UI显示 | 描述文本 |

### 完整模板

```json
{
  "id": "JOB_EXAMPLE_WORKER",
  "title": "示例工人",
  "type": "FULL_TIME",
  "region": "RUST_BELT",
  "requiredClass": "WORKER",
  "baseSalary": 800,
  "payCycle": "WEEKLY",
  "hpCost": 25,
  "sanCost": 5,
  "requiresHousing": true,
  "requiredItem": null,
  "description": "这是示例描述。"
}
```

### 约束条件

1. **baseSalary与阶级匹配**：流浪者$0-300，工人$500-1500，中产$1500-5000，资本家$5000+
2. **costs非负**：hpCost和sanCost >= 0
3. **type与payCycle匹配**：零工可用DAILY，全职通常WEEKLY

---

## 四、diseases.json - 疾病系统

### 文件位置
`game/src/assets/data/diseases.json`

### 被代码读取的字段

| 字段名 | 类型 | 必填 | 代码中的使用位置 | 说明 |
|-------|------|------|----------------|------|
| `id` | string | ✅ | 全系统 | 唯一标识符 |
| `name` | string | ✅ | UI显示 | 疾病名称 |
| `type` | enum | ✅ | 疾病惩罚 | "ACUTE"/"CHRONIC"/"MENTAL" |
| `severity` | integer | ✅ | 系统逻辑 | 严重程度1-10 |
| `effects` | object | ❌ | 系统逻辑（预留） | 持续效果 |
| `description` | string | ❌ | UI显示 | 描述文本 |

### type字段详解

| type值 | 代码中的惩罚 | 说明 |
|-------|------------|------|
| `"ACUTE"` | -15% 存活率 | 急性病，惩罚重 |
| `"CHRONIC"` | -5% 存活率 | 慢性病，惩罚轻 |
| `"MENTAL"` | -5% 存活率 | 精神病，同慢性病 |

### 完整模板

```json
{
  "id": "DISEASE_FLU",
  "name": "流感",
  "type": "CHRONIC",
  "severity": 3,
  "effects": {
    "hpDrain": 5,
    "sanDrain": 2
  },
  "description": "常见的呼吸道疾病。"
}
```

---

## 五、insurance.json - 保险系统

### 文件位置
`game/src/assets/data/insurance.json`

### 被代码读取的字段

| 字段名 | 类型 | 必填 | 代码中的使用位置 | 说明 |
|-------|------|------|----------------|------|
| `id` | string | ✅ | 全系统 | 唯一标识符 |
| `type` | enum | ✅ | medicalSupport | 必须包含"MEDICAL"以触发60分 |
| `weeklyCost` | integer | ✅ | 系统逻辑 | 每周保费 |
| `coverage` | object | ✅ | 系统逻辑 | 覆盖范围 |
| `allowedClasses` | string[] | ✅ | 购买限制 | 可购买的阶级列表 |

### coverage字段

代码当前只检查是否存在，不读取具体值（可扩展）。

### 完整模板

```json
{
  "id": "INS_MEDICAL_BASIC",
  "name": "基础医保",
  "type": "MEDICAL",
  "weeklyCost": 50,
  "allowedClasses": ["WORKER", "MIDDLE", "CAPITALIST"],
  "coverage": {
    "copayModifier": 0.5,
    "emergencyCovered": true
  }
}
```

---

## 六、faiths.json - 信仰系统

### 文件位置
`game/src/assets/data/faiths.json`

### 被代码读取的字段

| 字段名 | 类型 | 必填 | 代码中的使用位置 | 说明 |
|-------|------|------|----------------|------|
| `id` | enum | ✅ | 系统逻辑 | "NONE"/"CHURCH"/... |
| `level` | integer | ✅ | mentalStability | ×25乘数 |

### 说明
代码中只读取 `faith.level`，其他字段用于UI显示。

---

## 七、配置参数文件

### survival_dimensions_simple.json

此文件为纯配置文件，无模板，所有字段见 **B_PARAMETERS_CONFIG.md**。

### 关键修改点

设计师可以修改的参数文件：

| 文件 | 可修改内容 | 影响 |
|-----|-----------|------|
| `items.json` | 物品effects数值 | 维度分数 |
| `housing.json` | defenseLevel, regenHp | 维度分数 |
| `jobs.json` | baseSalary | 维度分数 |
| `diseases.json` | type(ACUTE/CHRONIC) | 惩罚大小 |
| `survival_dimensions_simple.json` | 所有权重和系数 | 全局平衡 |

---

## 八、字段数据类型汇总

| 类型 | 说明 | 示例 |
|-----|------|------|
| `string` | 字符串 | "FOOD_WAGYU" |
| `integer` | 整数 | 25, -10, 0 |
| `number` | 浮点数 | 0.08, 0.5 |
| `boolean` | 布尔 | true, false |
| `enum` | 枚举值 | 见各字段说明 |
| `string[]` | 字符串数组 | ["FOOD", "LUXURY"] |
| `object` | 对象 | 见模板 |

---

## 九、常见错误检查清单

设计师完成JSON后，检查：

- [ ] 所有ID唯一，无重复
- [ ] 所有必填字段已填
- [ ] `effects`中至少一个非零值
- [ ] `tags`包含正确的系统标签（FOOD/MEDICAL）
- [ ] `price`为正数（特殊设计除外）
- [ ] `regions`数组正确（空数组=全区域，非空=限定区域）
- [ ] JSON格式正确（可用VSCode验证）
