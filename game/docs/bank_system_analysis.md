# 银行系统 (Bank System) 完整分析

> 版本: 3.0 | 最后更新: 2024

---

## 一、系统定位与设计哲学

### 核心定位
银行系统是游戏的**"债务陷阱引擎"**——它不提供财富自由的路径，而是模拟美国金融资本主义如何将玩家绑定在"工作-借贷-还债"的无限循环中。

### 设计哲学
> **"信用评分不是你的美德证明，而是你的可剥削性评级。"**

- 高信用 = 更高的借贷额度 = 更深的债务陷阱
- 低信用 = 高利贷 = 更快的坠落
- **没有"好"的信用评分，只有不同程度的奴役。**

---

## 二、核心逻辑架构

### 2.1 数据流图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           银行系统核心循环                            │
└─────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │   申请贷款    │────▶│   信用评估    │────▶│   发放资金    │
   └──────────────┘     └──────────────┘     └──────────────┘
          │                                           │
          ▼                                           ▼
   ┌──────────────┐                          ┌──────────────┐
   │  选择产品类型 │                          │  每周利息滚存 │
   │ - 发薪日贷款  │                          │  (复利计算)   │
   │ - 消费贷     │                          └──────────────┘
   │ - 房贷       │                                   │
   │ - 学生贷     │                                   ▼
   └──────────────┘                          ┌──────────────┐
          │                                   │   到期/逾期   │
          │                                   └──────────────┘
          │                                          │
          │                    ┌─────────────────────┼─────────────────────┐
          │                    ▼                     ▼                     ▼
          │            ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
          │            │   正常还款   │      │  催收阶段    │      │   入狱/法拍  │
          │            └──────────────┘      └──────────────┘      └──────────────┘
          │                                           │
          └───────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   信用分调整      │
                    │  (+按时还款/-逾期) │
                    └──────────────────┘
```

### 2.2 核心计算逻辑

#### 利息计算（每周复利）
```typescript
// processTurnInterest
interestCost = Math.floor((principal + accumulatedInterest) * weeklyRate)
```

**关键设计**: 利息基于**本金+累积利息**计算，是真正的复利陷阱。

#### 信用分评级
```typescript
// getCreditRating
800+: PRIME (至尊) - 资本的宠儿
740+: EXCELLENT (卓越)
670+: GOOD (良好)
580+: FAIR (一般)
300+: POOR (差劲) - 掠夺性贷款的目标
```

#### 借贷额度公式
```typescript
// calculateMaxBorrow
utilizationRatio = baseRate + (currentScore - minScore) / growthDivisor
maxBorrow = product.maxAmount * utilizationRatio
```

---

## 三、现有素材

### 3.1 贷款产品 (loans.json)

| ID | 名称 | 区域 | 最低信用 | 周利率 | 最大额度 | 期限 | 风险等级 |
|----|------|------|---------|--------|---------|------|---------|
| `LOAN_SHARK` | 街头高利贷 | SLUMS | 0 | 25% | $2,000 | 2周 | EXTREME |
| `LOAN_PAYDAY` | 发薪日快贷 | RUST_BELT | 500 | 10% | $5,000 | 4周 | HIGH |
| `LOAN_PERSONAL` | 个人消费贷 | SUBURBS | 650 | 3% | $20,000 | 12周 | MEDIUM |
| `LOAN_BUSINESS` | 商业杠杆贷 | DOWNTOWN | 750 | 1% | $1,000,000 | 24周 | LOW |
| `LOAN_BAIL_BOND` | 保释贷 | SLUMS | 0 | 15% | $100,000 | 24周 | PREDATORY |
| `LOAN_CAR_SUBPRIME` | 掠夺性车贷 | RUST_BELT | 0 | 5% | $5,000 | 20周 | EXTREME |
| `LOAN_CAR_STANDARD` | 标准车贷 | SUBURBS | 600 | 1.5% | $50,000 | 52周 | LOW |
| `LOAN_STUDENT_DEBT` | 学生贷款 | SUBURBS | 0 | 0.3% | $160,000 | 520周 | PREDATORY |

**叙事设计**:
- 贫民窟 (SLUMS): 只有高利贷和保释贷，无信用要求但利率极高
- 铁锈带 (RUST_BELT): 发薪日贷款和掠夺性车贷，工人阶级的陷阱
- 郊区 (SUBURBS): 消费贷和标准车贷，中产阶级的"体面"债务
- 核心区 (DOWNTOWN): 商业贷款，资本家的低成本资金

### 3.2 规则配置 (bank_rules.json)

#### 信用分系统
```json
{
  "minScore": 300,
  "maxScore": 850,
  "borrowLimit": {
    "baseRate": 0.2,
    "growthDivisor": 200
  },
  "actions": {
    "hardInquiry": -5,      // 申请贷款
    "installmentPaid": 1,   // 按时还款
    "loanCleared": 5        // 结清贷款
  }
}
```

#### 催收阶段配置
```json
{
  "warning": { "turn": 1, "scorePenalty": 30 },
  "violence": { "maxTurn": 3, "hpDamage": 20, "insightGain": 15, "scorePenalty": 50 },
  "seizure": { "maxTurn": 8, "limit": 5000, "scorePenalty": 80 },
  "jail": { "sentenceTurns": 8, "scorePenalty": 100 }
}
```

**设计意图**: 逾期不仅伤害信用，还会造成**肉体伤害**（HP-20）和**觉醒**（Insight+15）——痛苦让人看清真相。

#### 房贷配置
```json
{
  "foreclosureTurns": 4,      // 4周后启动法拍
  "warningPenalty": 10,       // 警告期信用惩罚
  "foreclosurePenalty": 100,  // 法拍信用惩罚
  "weeklyPrincipalRate": 0.01, // 每周还本1%
  "weeklyServiceFee": 10      // 每周服务费
}
```

### 3.3 UI 组件素材

| 组件 | 位置 | 功能 |
|------|------|------|
| `DowntownBankExterior.tsx` | 核心区银行外观 | 场景展示 |
| `DowntownBankInterior.tsx` | 核心区银行内部 | 商业贷款交互 |
| `RustBeltBankExterior.tsx` | 铁锈带银行外观 | 场景展示 |
| `RustBeltBankInterior.tsx` | 铁锈带银行内部 | 发薪日贷款交互 |
| `RustBeltLoanClipboard.tsx` | 铁锈带贷款剪贴板 | 贷款申请UI |
| `SlumsBankExterior.tsx` | 贫民窟"银行"外观 | 场景展示（高利贷）|
| `SlumsBankInterior.tsx` | 贫民窟"银行"内部 | 高利贷/保释贷交互 |
| `SlumsLoanPaper.tsx` | 贫民窟贷款纸条 | 简陋的贷款UI |
| `SuburbsBankExterior.tsx` | 郊区银行外观 | 场景展示 |
| `SuburbsBankInterior.tsx` | 郊区银行内部 | 标准贷款交互 |
| `useBankUI.ts` | Hook | 贷款状态管理、警告提示 |

---

## 四、与其他系统的耦合关系

### 4.1 系统耦合图

```
┌─────────────────────────────────────────────────────────────────┐
│                        银行系统 (BankSystem)                     │
│                   - 每周利息计算                                  │
│                   - 催收阶段处理                                  │
│                   - 信用分调整                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│   住房系统    │    │    监狱系统     │    │   生存系统    │
│  HousingSys  │    │  PrisonSystem  │    │  VitalitySys │
└──────────────┘    └────────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
   房贷法拍没收          债务入狱刑罚          HP/Insight
   (阶级跌回流浪)         (8周监禁)            伤害/觉醒
```

### 4.2 详细耦合关系

#### 1. 住房系统 (HousingSystem)

**耦合点**: 房贷 (`isMortgage: true`)

```typescript
// BankSystem.ts
if (loan.isMortgage && overdueWeeks >= mortgage.foreclosureTurns) {
  // 强制收房
  result.updates.activeHousing = null;
  // 阶级跌落
  result.updates.vitality.identity.currentClass = PlayerClass.Homeless;
}
```

**连锁反应**:
1. 房贷逾期 4 周 → 房产被收回
2. 玩家阶级强制变为 `HOMELESS`
3. 信用分 -100

#### 2. 监狱系统 (PrisonSystem)

**耦合点**: 严重债务逾期

```typescript
// BankSystem.ts - 逾期 8+ 周
if (t > collection.seizure.maxTurn) {
  result.updates.prison = {
    inJail: true,
    sentenceTurns: 8,
    crime: "金融诈骗与恶意欠款"
  };
}
```

**设计意图**: 将债务问题刑事化，反映美国司法系统的阶级性。

#### 3. 生存系统 (VitalitySystem)

**耦合点**: 暴力催收伤害

```typescript
// 逾期 2-3 周：暴力催收
result.updates.vitality.metrics.hp -= 20;        // 肉体伤害
result.updates.vitality.metrics.insight += 15;   // 痛苦觉醒
```

**叙事意图**: 被殴打后，玩家更清醒地认识到系统的暴力本质。

#### 4. 账单系统 (BillSystem)

**耦合点**: 保险费用自动扣除

```typescript
// BankSystem.ts - 每周自动扣保险
for (const insurance of activeInsurances) {
  result.newTransactions.push({
    category: insurance.type === 'AUTO' ? 'BILL' : 'MEDICAL',
    amount: -insurance.weeklyCost,
    description: `${insurance.name}周费`
  });
}
```

#### 5. 事件系统 (EventSystem)

**相关事件** (已配置):

| 事件ID | 主题 | 触发条件 |
|--------|------|---------|
| `EVT_C13_CREDIT_SCORE_DROP` | 信用分下降 | 随机/逾期后 |
| `EVT_C14_OVERDRAFT` | 透支费用 | 余额不足 |
| `EVT_C15_DEBT_COLLECTION` | 催债电话 | 有活跃贷款 |
| `EVT_WORKER_10_PAYDAY_LOAN` | 发薪日贷款陷阱 | 工人阶级 |
| `EVT_MIDDLE_05_STUDENT_LOAN` | 学生贷款 | 中产阶级 |
| `EVT_MIDDLE_25_CAR_LOAN` | 车贷 | 中产阶级 |
| `EVT_CAPITALIST_03_TOO_BIG_TO_FAIL` | 大而不倒 | 资本家 |

#### 6. 阶级系统 (ClassSystem)

**耦合点**: 贷款产品区域限制

```typescript
// 贫民窟只能看到高利贷
// 核心区才能申请商业贷款
const availableLoans = loansData.filter(l => l.region === currentRegion);
```

---

## 五、JSON 配置化评估

### 5.1 已 JSON 化的部分 ✅

| 文件 | 内容 | 状态 |
|------|------|------|
| `loans.json` | 贷款产品定义 | ✅ 完整 |
| `bank_rules.json` | 信用分规则、催收阶段、房贷配置 | ✅ 完整 |
| 各区域 Bank 组件 | UI 展示 | ✅ 区域化 |

### 5.2 建议补充的 JSON 配置

#### 建议 1: 催收事件文本配置化

**现状**: 催收阶段的日志文本硬编码在 `BankSystem.ts`

```typescript
// 当前硬编码
result.logs.push("【暴力催收】讨债人打断了你的肋骨！");
result.logs.push("【强制执行】银行冻结并划扣资产");
```

**建议新增** `bank_events.json`:
```json
{
  "collectionMessages": {
    "warning": [
      "银行来电：您的贷款已逾期，请尽快还款。",
      "自动语音：这是催收通知，请按1联系客服。"
    ],
    "violence": [
      "【暴力催收】讨债人打断了你的肋骨！",
      "【深夜敲门】三个彪形大汉在你的车旁等你。"
    ],
    "seizure": [
      "【强制执行】银行冻结并划扣资产",
      "法院通知：您的账户已被查封。"
    ],
    "jail": [
      "【司法介入】因长期恶意拖欠，你被逮捕了。",
      "警察：你有权保持沉默，但你欠的钱不会沉默。"
    ]
  },
  "mortgageMessages": {
    "warning": "房贷逾期 {weeks} 周，{remaining} 周后将收回房产。",
    "foreclosure": "【法拍执行】房屋 {houseName} 因断供被银行强制收回！"
  }
}
```

**优先级**: 🟡 中 - 增加叙事多样性，但当前系统可用

---

#### 建议 2: 信用分评级描述配置化

**现状**: 评级描述在 `bank_rules.json` 中

```json
{
  "ratings": [
    { "threshold": 800, "label": "PRIME (至尊)", "color": "text-yellow-400" }
  ]
}
```

**建议扩展** 增加叙事描述:
```json
{
  "ratings": [
    {
      "threshold": 800,
      "label": "PRIME (至尊)",
      "color": "text-yellow-400",
      "flavorText": "银行把你当作座上宾，但你知道这是因为你更容易被剥削。",
      "loanModifier": 1.0
    }
  ]
}
```

**优先级**: 🟢 低 - 锦上添花

---

#### 建议 3: 区域银行特色配置化

**现状**: 各区域银行组件独立实现

**建议新增** `bank_regions.json`:
```json
{
  "SLUMS": {
    "name": "铁窗金融",
    "theme": "predatory",
    "bgImage": "/assets/bank/slums_loan_shark.png",
    "uiStyle": "paper",  // 简陋纸条风格
    "specialProducts": ["LOAN_SHARK", "LOAN_BAIL_BOND"]
  },
  "RUST_BELT": {
    "name": "发薪日快贷",
    "theme": "desperate",
    "bgImage": "/assets/bank/rust_payday.png",
    "uiStyle": "clipboard",  // 剪贴板风格
    "specialProducts": ["LOAN_PAYDAY", "LOAN_CAR_SUBPRIME"]
  },
  "SUBURBS": {
    "name": "联合银行",
    "theme": "respectable",
    "bgImage": "/assets/bank/suburbs_bank.png",
    "uiStyle": "modern",  // 现代银行风格
    "specialProducts": ["LOAN_PERSONAL", "LOAN_CAR_STANDARD"]
  },
  "DOWNTOWN": {
    "name": "高盛资本",
    "theme": "elite",
    "bgImage": "/assets/bank/downtown_goldman.png",
    "uiStyle": "luxury",  // 奢华风格
    "specialProducts": ["LOAN_BUSINESS"]
  }
}
```

**优先级**: 🟡 中 - 可减少组件重复代码

---

### 5.3 无需 JSON 化的部分

| 内容 | 原因 |
|------|------|
| 利息计算公式 | 核心逻辑，需代码实现 |
| 催收阶段判定 | 涉及多系统协调，需代码控制流程 |
| UI 交互细节 | React 组件逻辑，不适合 JSON |

---

## 六、建议的新增 JSON 文件

### 6.1 `bank_events.json` (推荐)
```
位置: game/src/assets/data/rules/bank_events.json
用途: 催收阶段叙事文本、信用分变化提示
优先级: 🟡 中
工作量: 1-2 小时
```

### 6.2 `bank_narratives.json` (可选)
```
位置: game/src/assets/data/rules/bank_narratives.json
用途: 贷款申请时的描述文本、还款后的反馈
优先级: 🟢 低
```

---

## 七、总结

### 银行系统完成度评估

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 核心借贷逻辑 | 95% | ✅ 完整可用 |
| 利息/复利计算 | 100% | ✅ 完整 |
| 催收阶段系统 | 90% | ✅ 四阶段完整 |
| 信用分系统 | 85% | ✅ 评级/变动已配置 |
| 房贷法拍联动 | 90% | ✅ 与住房系统耦合 |
| 债务入狱联动 | 80% | ✅ 与监狱系统耦合 |
| 区域银行UI | 85% | ✅ 四区域独立风格 |
| 事件联动 | 70% | ✅ 多个相关事件 |

### 建议优先处理

1. **立即**: 无需处理，系统已完整可用
2. **近期**: 考虑添加 `bank_events.json` 增加叙事多样性
3. **远期**: 根据玩家反馈调整贷款利率平衡性

---

## 附录：快速参考

### 贷款产品利率对比

```
周利率换算年利率 (APR):
- 街头高利贷 25% × 52 = 1300% APR
- 发薪日快贷 10% × 52 = 520% APR
- 个人消费贷 3% × 52 = 156% APR
- 商业杠杆贷 1% × 52 = 52% APR
- 学生贷款 0.3% × 52 = 15.6% APR (但期限10年)
```

### 催收时间线

```
周 0: 到期
周 1: 警告 (信用-30)
周 2-3: 暴力催收 (HP-20, Insight+15, 信用-50)
周 4-8: 强制划扣 (最多$5000, 信用-80)
周 9+: 入狱 (8周监禁, 信用-100)
```

### 房贷时间线

```
周 0: 房贷到期未还
周 1-3: 断供警告 (信用-10/周)
周 4: 法拍执行 (房产收回, 信用-100, 阶级→流浪)
```
