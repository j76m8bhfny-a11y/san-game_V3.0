# 监狱系统完整设计文档

> 版本: 1.0 | 用于数值设计参考

---

## 一、核心逻辑概述

监狱系统是游戏的**终极惩罚机制**，当玩家债务违约达到最严重阶段时触发。它同时也是一个**阶级差异化的体验系统**——不同阶级在监狱中的遭遇截然不同。

### 1.1 系统定位

| 属性 | 说明 |
|------|------|
| **系统ID** | `PRISON_SYSTEM`（通过Store Slice实现） |
| **触发方式** | 被动触发（银行催收第4阶段）/ 主动触发（事件选择） |
| **系统优先级** | 最高（阻塞其他系统执行） |
| **设计目标** | 债务惩罚 + 阶级差异化叙事 + Insight获取途径 |

---

## 二、入狱触发机制

### 2.1 触发来源

```
┌─────────────────────────────────────────────────────────────┐
│                     入狱触发路径                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  路径A: 银行催收系统（被动）                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  第1阶段     │ -> │  第2阶段     │ -> │  第3阶段     │     │
│  │  逾期警告    │    │  暴力催收    │    │  强制划扣    │     │
│  │  (HP-0)     │    │  (HP-20)    │    │  (资产冻结)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                              │              │
│                                              v              │
│                                       ┌─────────────┐      │
│                                       │  第4阶段     │      │
│                                       │  司法介入    │      │
│                                       │  → 入狱      │      │
│                                       └─────────────┘      │
│                                                             │
│  路径B: 事件系统（主动）                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  某些事件选项直接触发入狱（如犯罪选择、抗议被捕等）     │   │
│  │  示例: "参与抗议游行" → 被捕入狱 3-5 周               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 银行催收入狱详细逻辑

**触发条件**（位于 `BankSystem.ts` 第188-201行）：

```typescript
// 当 loan.overdueTurns > collection.seizure.maxTurn (8周)
else {
  const jailMsg = getRandomMessage(bankNarratives.collection.jail.messages);
  result.logs.push(jailMsg);
  
  (result.updates as any).prison = {
    inJail: true,
    sentenceTurns: collection.jail.sentenceTurns, // 配置: 4周
    crime: "金融诈骗与恶意欠款",
    bailAmount: 0  // 银行催收触发的入狱无保释金
  };
  
  totalScoreChange -= collection.jail.scorePenalty; // 信用分惩罚
}
```

**关键数值**（需配置在 `bill_rules.json`）：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `collection.jail.sentenceTurns` | 4 | 入狱刑期（周） |
| `collection.jail.scorePenalty` | 100 | 入狱信用分惩罚 |
| `collection.seizure.maxTurn` | 8 | 强制划扣持续周数上限 |

---

## 三、监狱状态数据结构

```typescript
interface PrisonState {
  inJail: boolean;        // 是否在监狱中
  crime: string;          // 罪名描述
  sentenceTurns: number;  // 总刑期（周）
  turnsServed: number;    // 已服刑周数
  bailAmount: number;     // 保释金金额
}

// 初始状态
const INITIAL_PRISON = {
  inJail: false,
  crime: '',
  sentenceTurns: 0,
  turnsServed: 0,
  bailAmount: 0
};
```

---

## 四、每日监狱生活（核心机制）

### 4.1 执行流程

```
玩家点击 "服刑一周" 按钮
        │
        v
┌─────────────────────────────────────┐
│ 1. 执行系统结算 (runTurnSettlement) │
│    - 房租/房贷继续扣除               │
│    - 银行利息继续计算                │
│    - 保险费用继续扣除                │
│    【实现"坐吃山空"效果】            │
└─────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────┐
│ 2. 应用监狱惩罚                     │
│    - 根据阶级读取配置                │
│    - 扣除 HP / Insight              │
└─────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────┐
│ 3. 推进时间                         │
│    - currentTurn + 1                │
│    - totalTurns + 1                 │
│    - turnsServed + 1                │
└─────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────┐
│ 4. 检查释放条件                     │
│    - turnsServed >= sentenceTurns   │
│    - 是 → 释放                      │
│    - 否 → 继续坐牢                  │
└─────────────────────────────────────┘
        │
        v
┌─────────────────────────────────────┐
│ 5. 检查死亡条件                     │
│    - HP <= 0 或 Insight <= 0        │
│    - 是 → 触发死亡结局              │
│    - 否 → 正常继续                  │
└─────────────────────────────────────┘
```

### 4.2 阶级差异化惩罚配置

配置文件: `prison_rules.json`

```json
{
  "dailyRoutine": {
    "default": {
      "hpChange": -20,
      "insightChange": -25,
      "log": "这是地狱。帮派分子抢走了你的饭，狱警对此视而不见。"
    },
    "classOverrides": {
      "CAPITALIST": {
        "hpChange": 5,
        "insightChange": 5,
        "log": "你在最低安保级别的'度假村'里打了一天高尔夫，结识了几位参议员。"
      },
      "MIDDLE": {
        "hpChange": -5,
        "insightChange": -10,
        "log": "你在单人牢房里读了一整天书。隔壁的尖叫声让你有点神经衰弱。"
      },
      "WORKER": "default",
      "HOMELESS": "default"
    }
  }
}
```

### 4.3 阶级惩罚数值对比

| 阶级 | HP变化 | Insight变化 | 设计意图 |
|------|--------|-------------|----------|
| **CAPITALIST** | +5 | +5 | 精英监狱是"俱乐部"，有益身心健康 |
| **MIDDLE** | -5 | -10 | 中产焦虑，精神折磨大于肉体 |
| **WORKER** | -20 | -25 | 人间地狱，肉体和精神双重摧残 |
| **HOMELESS** | -20 | -25 | 与工人阶级同样待遇 |

---

## 五、保释机制

### 5.1 保释方式对比

| 保释方式 | 触发条件 | 费用 | 后果 |
|----------|----------|------|------|
| **现金保释** | `gold >= bailAmount` | 全额保释金 | 直接释放，无负债 |
| **保释贷款** | `gold >= bailAmount × 10%` | 10%首付 + 贷款 | 释放但背上高利贷 |

### 5.2 保释贷款逻辑

```typescript
// 首付比例配置
const bondDownPaymentRate = 0.1;  // 10%

// 计算
const downPayment = Math.floor(totalBail * 0.1);
const loanAmount = totalBail - downPayment;  // 剩余90%走贷款

// 关联贷款产品
const loanProductId = 'LOAN_BAIL_BOND';

// 原子性操作：先扣首付 → 发放贷款 → 释放
// 失败回滚：贷款被拒时退还首付
```

### 5.3 保释贷款产品配置

需在 `loan_products.json` 中配置：

```json
{
  "id": "LOAN_BAIL_BOND",
  "name": "保释金紧急贷款",
  "interestRate": 0.15,      // 周利率15%（高利贷）
  "maxAmount": 10000,
  "minCreditScore": 300,     // 最低信用分要求
  "description": "紧急保释贷款，利息极高"
}
```

---

## 六、与其他系统的耦合

### 6.1 系统耦合总览图

```
┌──────────────────────────────────────────────────────────────────────┐
│                         监狱系统耦合关系                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐                                                 │
│  │   PRISON SYSTEM  │                                                │
│  │  (createPrisonSlice)│                                              │
│  └────────┬────────┘                                                 │
│           │                                                          │
│     ┌─────┴─────┬─────────────┬─────────────┬─────────────┐         │
│     │           │             │             │             │         │
│     v           v             v             v             v         │
│ ┌──────┐   ┌──────┐    ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│ │ Bank │   │Event │    │SystemReg │  │  Housing │  │  Game    │   │
│ │System│   │System│    │  istry   │  │  System  │  │  Slice   │   │
│ └──┬───┘   └──┬───┘    └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│    │          │             │             │             │         │
│    │ 触发入狱  │ 事件可触发   │ 监狱阻断    │ 房租继续扣   │ 阻塞回合   │
│    │ (第4阶段)│ 入狱选项    │ 某些系统    │ 实现坐吃山空 │ 推进      │
│    │          │             │             │             │         │
└────┴──────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

### 6.2 详细耦合关系

#### A. 与银行系统（触发源）

```typescript
// BankSystem.ts 第188-201行
// 当贷款逾期超过 seizure.maxTurn 时触发入狱

(result.updates as any).prison = {
  inJail: true,
  sentenceTurns: collection.jail.sentenceTurns,
  crime: "金融诈骗与恶意欠款",
  bailAmount: 0
};
```

**耦合点**:
- 银行系统直接修改 `prison` 状态触发入狱
- 银行催收触发的入狱**无保释金**（`bailAmount: 0`）
- 信用分大幅下降

#### B. 与事件系统（可选触发）

```typescript
// createGameSlice.ts 第229-237行
// 事件选择可直接触发入狱

if (option.effects.jail) {
  store.imprison(
    option.effects.jail.reason || "事件触发",
    option.effects.jail.turns,
    option.effects.jail.bail
  );
}
```

**事件示例配置**:
```json
{
  "options": {
    "A": {
      "effects": {
        "jail": {
          "reason": "参与非法抗议",
          "turns": 3,
          "bail": 500
        }
      }
    }
  }
}
```

#### C. 与SystemRegistry（系统阻断）

```typescript
// SystemRegistry.ts 第77-83行
// 监狱状态下阻断特定系统

if (currentState.prison.inJail && getBlockedSystems().includes(system.id)) {
    logs.push(`【狱中】无法访问 ${system.id}，系统已挂起。`);
    continue; 
}
```

**阻断系统列表**（配置在 `prison_rules.json`）：
```json
{
  "settings": {
    "blockedSystems": ["JOB_SYSTEM", "EVENT_SYSTEM", "BILL_SYSTEM"],
    "blockMovement": true
  }
}
```

| 系统 | 监狱中状态 | 说明 |
|------|-----------|------|
| `JOB_SYSTEM` | ❌ 阻断 | 无法工作，无收入 |
| `EVENT_SYSTEM` | ❌ 阻断 | 无法触发随机事件 |
| `BILL_SYSTEM` | ❌ 阻断 | 不生成新账单 |
| `BANK_SYSTEM` | ✅ 执行 | 利息继续计算 |
| `HOUSING_SYSTEM` | ✅ 执行 | 房租/房贷继续扣除 |
| `VEHICLE_SYSTEM` | ✅ 执行 | 车辆费用继续 |

#### D. 与游戏主循环（回合阻塞）

```typescript
// createGameSlice.ts 第302行
// 监狱状态下不执行普通回合结算

nextTurn: () => {
  if (get().prison?.inJail) return; // 阻塞普通回合
  // ... 正常回合逻辑
}
```

**特殊处理**：监狱中使用独立的 `serveTime()` 推进时间。

#### E. 与结局系统（死亡判定）

```typescript
// createPrisonSlice.ts 第239-256行
// 监狱中HP/Insight归零触发死亡结局

if (died) {
  nextState.vitality.metrics.hp = Math.max(0, nextState.vitality.metrics.hp);
  nextState.vitality.metrics.insight = Math.max(0, nextState.vitality.metrics.insight);
  
  setTimeout(() => {
    const endingId = resolveEnding(state, endingsData, 52, 'PRISON_DEATH');
    store.triggerEnding(endingId);
  }, 0);
}
```

---

## 七、数值设计建议

### 7.1 刑期设计

| 触发来源 | 建议刑期 | 说明 |
|----------|----------|------|
| 银行催收（第4阶段） | 4周 | 足够产生压力但不过于惩罚 |
| 轻微犯罪事件 | 1-2周 | 短期警告 |
| 严重犯罪事件 | 4-8周 | 重大代价 |
| 抗议/政治犯 | 2-4周 | 中等惩罚 |

### 7.2 保释金设计

| 罪名类型 | 建议保释金 | 相当于工人周收入 |
|----------|-----------|-----------------|
| 金融违约 | $0 | N/A（银行触发无保释） |
| 轻微违法 | $200-500 | 1-2周 |
| 中度犯罪 | $500-2000 | 2-8周 |
| 严重犯罪 | $2000-5000 | 8-20周 |

### 7.3 监狱惩罚调整建议

当前配置下，工人在监狱中4周会损失：
- HP: -80 (4周 × -20)
- Insight: -100 (4周 × -25)

**风险**: 这可能导致玩家快速死亡，建议根据游戏整体难度调整：

```json
// 建议配置（更温和的惩罚）
{
  "dailyRoutine": {
    "default": {
      "hpChange": -10,      // 从-20调整为-10
      "insightChange": -15, // 从-25调整为-15
      "log": "..."
    }
  }
}
```

### 7.4 阶级差异化深化建议

当前中产和精英的惩罚差异较大，建议增加更多中间阶级：

```json
{
  "classOverrides": {
    "CAPITALIST": {
      "hpChange": 10,
      "insightChange": 10,
      "log": "度假村监狱，红酒配牛排，你在谈生意。"
    },
    "UPPER_MIDDLE": {
      "hpChange": 0,
      "insightChange": -5,
      "log": "最低安保监狱，你有独立的阅读时间。"
    },
    "MIDDLE": {
      "hpChange": -5,
      "insightChange": -10,
      "log": "普通监狱，你努力保持低调。"
    },
    "WORKING": {
      "hpChange": -15,
      "insightChange": -20,
      "log": " overcrowded 的牢房，你得小心别惹麻烦。"
    },
    "HOMELESS": {
      "hpChange": -20,
      "insightChange": -25,
      "log": "这是地狱。"
    }
  }
}
```

---

## 八、关键代码文件

| 文件路径 | 职责 |
|----------|------|
| `store/slices/createPrisonSlice.ts` | 监狱状态管理、服刑逻辑、保释逻辑 |
| `logic/prison.ts` | 每日惩罚计算 |
| `types/prisonRules.ts` | 类型定义 |
| `assets/data/rules/prison_rules.json` | 数值配置 |
| `components/game/JailOverlay.tsx` | 监狱界面UI |
| `systems/core/BankSystem.ts` | 触发入狱（第4阶段） |
| `systems/SystemRegistry.ts` | 监狱系统阻断逻辑 |
| `store/slices/createGameSlice.ts` | 事件入狱触发、回合阻塞 |

---

## 九、待确认数值设计问题

1. **刑期长度**: 当前4周是否合适？是否需要根据欠款金额动态计算？
2. **保释金**: 事件触发的保释金数额是否合理？
3. **惩罚强度**: 工人阶级-20HP/周是否过于严厉？
4. **信用分惩罚**: 入狱-100分是否过高？
5. **保释贷款利率**: 15%周利率是否足够体现"高利贷"的压迫感？

---

*文档生成时间: 2026-02-22*
*适用于数值设计评审*
