# 讽刺性死亡结局实施指南

## 结局列表（26个）

### 消费主义陷阱类（3个）

| ID | 名称 | 核心讽刺 | 触发条件 | 实现难度 |
|----|------|----------|----------|----------|
| ED-23 | 有机瑜伽垫上的圆寂 | 花钱买中产符号，买不起医保 | 有瑜伽垫 + 金币<1000 | ⭐ |
| ED-24 | Dollar Menu的献祭 | 廉价食物的代价是健康 | 糖尿病/心脏病 + 金币<500 | ⭐ |
| ED-25 | 年轻血液的反向输血 | 花钱买穷人血续命，死于负债 | 买过年轻血液 + 负债>5000 | ⭐ |

### 医疗系统屠宰类（4个）

| ID | 名称 | 核心讽刺 | 触发条件 | 实现难度 |
|----|------|----------|----------|----------|
| ED-26 | 免赔额地狱 | 有保险却用不起 | HDHP保险 + 有病不治 + 有钱 | ⭐⭐ |
| ED-27 | 网络外惊喜 | 救命的救护车是网络外的 | 用过救护车 + 负债>10000 | ⭐ |
| ED-28 | 止痛药轮盘赌 | 看不起医生，靠OTC续命 | 买布洛芬>5次 + 穷 | ⭐⭐ |
| ED-29 | 卖血者的贫血 | 卖血维生，最终贫血而死 | 卖血>8次 + 生命上限<70 | ⭐⭐ |

### 工作伦理献祭类（4个）

| ID | 名称 | 核心讽刺 | 触发条件 | 实现难度 |
|----|------|----------|----------|----------|
| ED-30 | 亚马逊算法的裁员令 | 为公司卖命，被算法抛弃 | 亚马逊工作>30周 | ⭐⭐ |
| ED-31 | 零工经济的最后一单 | 自由职业的自由是破产自由 | 只打零工 + 有车 + 负债 | ⭐⭐ |
| ED-32 | 双开轮班的猝死 | 打多份工才能生存 | 同时2份工作 + 长期低HP | ⭐ |
| ED-33 | 试药员的白老鼠结局 | 用身体做实验赚钱 | 做过试药 + 患精神病 | ⭐ |

### 信仰与意识形态类（3个）

| ID | 名称 | 核心讽刺 | 触发条件 | 实现难度 |
|----|------|----------|----------|----------|
| ED-34 | 教会的十一税 | 借钱给上帝 | 信仰教会 + 等级>2 + 负债 | ⭐ |
| ED-35 | 邪教的Kool-Aid | 被邪教吸干一切 | 信仰邪教 + 等级>3 + 做过仪式 | ⭐ |
| ED-36 | 革命的误伤 | 被两边利用 | 信仰革命 + 红色>60 + 有案底 | ⭐ |

### 金融陷阱类（4个）

| ID | 名称 | 核心讽刺 | 触发条件 | 实现难度 |
|----|------|----------|----------|----------|
| ED-37 | 发薪日贷款的绞索 | 高利贷滚雪球 | 发薪日贷款>3次 + 负债>5000 | ⭐⭐ |
| ED-38 | 学生贷款的永恒诅咒 | 教育投资=终身债务 | 有学位 + 学贷>10万 + 50周+ | ⭐ |
| ED-39 | 401K的幻觉 | 存了一辈子，死前花不到 | 全职工作>40周 + 穷 | ⭐⭐ |
| ED-40 | 房产税的驱逐 | 买房只是租地 | 有房→失去→无家可归 | ⭐⭐⭐ |

### 住房/居住类（3个）

| ID | 名称 | 核心讽刺 | 触发条件 | 实现难度 |
|----|------|----------|----------|----------|
| ED-41 | 房东的涨租通知 | 被涨租驱赶至死 | 被驱逐>2次 + 无家可归 | ⭐⭐ |
| ED-42 | HOA的暴君 | 被业主委员会逼死 | 中产 + 因HOA失去房子 | ⭐⭐ |
| ED-43 | 帐篷城的甲烷爆炸 | 被系统性忽视杀死 | 无家可归>30周 + 住贫民窟 | ⭐ |

### 科技/现代生活类（2个）

| ID | 名称 | 核心讽刺 | 触发条件 | 实现难度 |
|----|------|----------|----------|----------|
| ED-44 | 算法的美颜 | 被AI判定不值得生存 | 信用分<400 + 被拒贷>2次 | ⭐⭐ |
| ED-45 | 社交媒体的最后直播 | 成为流量的祭品 | 被网红拍摄事件 + 穷 | ⭐ |

### 综合/特殊类（3个）

| ID | 名称 | 核心讽刺 | 触发条件 | 实现难度 |
|----|------|----------|----------|----------|
| ED-46 | 保险的完美客户 | 买一辈子保险，从不理赔 | 保险支出>5万 + 理赔0次 | ⭐⭐⭐ |
| ED-47 | 信用评分的奴隶 | 为维持信用而死 | 信用分>750 + 穷 | ⭐ |
| ED-48 | 美国梦的自动续订 | 被订阅服务榨干 | 订阅费>200/月 + 穷 | ⭐⭐ |

---

## 需要新增的状态追踪字段

### 1. 消费行为追踪（ConsumptionTracker）

```typescript
// 需要在 GameState 中添加
interface GameState {
  // ... 现有字段
  
  // 新增：行为追踪
  behaviorTracker: {
    // 消费
    dollarMenuWeeks: number;        // 连续吃垃圾食品周数
    plasmaDonationCount: number;    // 卖血次数
    otcPainkillerPurchases: number; // OTC止痛药购买次数
    
    // 工作
    amazonPickerWeeks: number;      // 亚马逊工作周数
    gigWorkOnly: boolean;           // 是否只打零工
    currentJobWeeks: number;        // 当前工作周数
    
    // 金融
    paydayLoanCount: number;        // 发薪日贷款次数
    totalInsurancePaid: number;     // 总保险支出
    insuranceClaimsCount: number;   // 理赔次数
    
    // 住房
    evictionCount: number;          // 被驱逐次数
    homelessWeeks: number;          // 无家可归周数
    
    // 历史标记
    hasPerformedRite: boolean;      // 是否做过宗教仪式
    hadDegree: boolean;             // 是否曾有学位
  }
}
```

### 2. 结局判定需要的新条件函数

```typescript
// endings.ts 中需要添加的条件检查

// 检查是否使用了特定服务
const hasUsedService = (state: GameState, serviceId: string): boolean => {
  return state.vitality.ledger.history.some(
    record => record.category === 'MEDICAL' && record.description.includes(serviceId)
  );
};

// 检查是否购买了特定物品N次
const getItemPurchaseCount = (state: GameState, itemId: string): number => {
  return state.vitality.ledger.history.filter(
    record => record.category === 'MEDICAL' && record.description.includes(itemId)
  ).length;
};

// 检查是否有HDHP保险
const hasHDHPInsurance = (state: GameState): boolean => {
  return state.vitality.activeInsurances.some(
    insurance => insurance.id.includes('HDHP') || insurance.coverage.deductible > 5000
  );
};

// 检查是否有未治疗的疾病
const hasUntreatedDisease = (state: GameState): boolean => {
  return state.vitality.activeDiseases.length > 0 && 
         state.vitality.ledger.history.filter(r => r.category === 'MEDICAL').length === 0;
};

// 检查工作持续时间
const getCurrentJobDuration = (state: GameState): number => {
  return state.behaviorTracker.currentJobWeeks;
};

// 检查是否只打零工
const isGigWorkOnly = (state: GameState): boolean => {
  return state.behaviorTracker.gigWorkOnly;
};

// 检查连续低HP周数
const getConsecutiveLowHpWeeks = (state: GameState): number => {
  // 需要从历史中计算
  return state.behaviorTracker.consecutiveLowHpWeeks || 0;
};

// 检查总保险支出
const getTotalInsurancePaid = (state: GameState): number => {
  return state.behaviorTracker.totalInsurancePaid;
};
```

### 3. 需要在各系统中添加的追踪逻辑

#### 商店系统 (createShopSlice.ts)
```typescript
// 购买物品时记录
purchaseItem: (itemId) => {
  // ... 现有逻辑
  
  // 新增追踪
  if (itemId === 'MEDICAL_BULK_IBUPROFEN') {
    state.behaviorTracker.otcPainkillerPurchases++;
  }
  if (itemId === 'FOOD_DOLLAR_MENU' || itemId === 'FOOD_INSTANT_RAMEN') {
    state.behaviorTracker.dollarMenuWeeks++;
  } else {
    state.behaviorTracker.dollarMenuWeeks = 0;
  }
}
```

#### 医疗系统
```typescript
// 使用服务时记录
useMedicalService: (serviceId) => {
  // ... 现有逻辑
  
  // 新增追踪
  if (serviceId === 'SLUM_PLASMA_DONATION') {
    state.behaviorTracker.plasmaDonationCount++;
    state.vitality.metrics.maxHp -= 2; // 每次卖血永久减生命上限
  }
}
```

#### 工作系统
```typescript
// 接受工作时记录
acceptJob: (jobId) => {
  // ... 现有逻辑
  
  // 新增追踪
  if (jobId === 'JOB_AMAZON_PICKER') {
    state.behaviorTracker.amazonPickerWeeks++;
  }
  state.behaviorTracker.currentJobWeeks = 0;
}

// 每周结算时
weeklySettlement: () => {
  // ... 现有逻辑
  
  state.behaviorTracker.currentJobWeeks++;
  
  // 追踪是否只打零工
  const hasFullTimeJob = state.vitality.activeJobs.some(
    jobId => jobs.find(j => j.id === jobId)?.type === 'FULL_TIME'
  );
  if (!hasFullTimeJob) {
    state.behaviorTracker.gigWorkOnly = true;
  }
}
```

#### 信仰系统
```typescript
// 进行仪式时
performRite: () => {
  // ... 现有逻辑
  state.behaviorTracker.hasPerformedRite = true;
}
```

#### 保险系统
```typescript
// 支付保费时
payInsurance: (amount) => {
  // ... 现有逻辑
  state.behaviorTracker.totalInsurancePaid += amount;
}

// 理赔时
fileClaim: () => {
  state.behaviorTracker.insuranceClaimsCount++;
}
```

---

## 优先级实施计划

### 第一周：基础消费/医疗（简单条件）
- [ ] ED-23 有机瑜伽垫（只需检查物品和金币）
- [ ] ED-24 Dollar Menu（检查疾病和金币）
- [ ] ED-25 年轻血液（检查物品和金币）
- [ ] ED-27 救护车惊喜（检查账本记录）

### 第二周：工作相关
- [ ] ED-30 亚马逊算法（需要追踪工作周数）
- [ ] ED-32 双开猝死（需要追踪多份工作）
- [ ] ED-31 零工经济（需要标记只打零工）

### 第三周：医疗深度
- [ ] ED-26 免赔额地狱（需要HDHP检测）
- [ ] ED-28 止痛药轮盘赌（需要购买计数）
- [ ] ED-29 卖血者（需要卖血计数 + 生命上限扣除）

### 第四周：信仰/金融
- [ ] ED-34~36 信仰结局
- [ ] ED-37~40 金融结局

### 第五周：住房/综合
- [ ] ED-41~43 住房结局
- [ ] ED-44~48 综合结局

---

## 测试检查清单

每个结局实现后需要测试：
- [ ] 条件满足时是否正确触发
- [ ] 条件不满足时不会误触发
- [ ] 优先级是否正确（高优先级的先判定）
- [ ] 描述文本显示正常
- [ ] 不影响其他结局的触发
