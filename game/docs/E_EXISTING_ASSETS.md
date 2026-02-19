# E. 现有资产清单（基于已有JSON）

> 本文档汇总所有已定义的JSON内容
> 数值策划师应在此基础上进行**数值调整**，而非重新定义

---

## 一、物品系统（items.json）

### 已定义物品概览

当前共有 **9个食物物品** 已定义，按阶级分层：

#### 阶级1: HOMELESS - 食物荒漠生存（7个）

| ID | 名称 | 价格 | effects.hunger | effects.hp | effects.addiction | 区域 | 状态 |
|-----|------|------|----------------|------------|-------------------|------|------|
| FOOD_DOLLAR_MENU | Dollar Menu汉堡 | $2 | 20 | -2 | 8 | SLUMS | ✅ 保留 |
| FOOD_CORNER_STORE_CHIPS | 便利店薯片 | $3 | 10 | - | 12 | SLUMS | ✅ 保留 |
| FOOD_CORNER_STORE_BREAD | 便利店白面包 | $4 | 18 | -3 | - | SLUMS | ✅ 保留 |
| FOOD_CHEAP_SODA | 大瓶汽水 | $2 | 8 | - | 15 | SLUMS | ✅ 保留 |
| FOOD_INSTANT_RAMEN | 杯面 | $1 | 15 | -5 | 3 | SLUMS/RUST_BELT | ✅ 保留 |
| FOOD_FOOD_BANK | 食品银行救济包 | $0 | 25 | - | - | SLUMS/RUST_BELT | ✅ 保留 |
| FOOD_DUMPSTER | 餐厅泔水 | $0 | 15 | -8 | - | SLUMS | ✅ 保留 |

#### 阶级2: WORKER - 工人燃料（2个）

| ID | 名称 | 价格 | effects.hunger | effects.hp | 区域 | 状态 |
|-----|------|------|----------------|------------|------|------|
| FOOD_FACTORY_CAFE | 工厂食堂套餐 | $8 | 35 | 5 | RUST_BELT | ✅ 保留 |
| FOOD_GAS_STATION_HOTDOG | 加油站热狗 | $3 | 22 | -3 | RUST_BELT/SLUMS | ✅ 保留 |

### 数值策划任务

**【待补充】** 以下物品需要设计：

| 类别 | 需要数量 | 建议设计方向 |
|------|---------|-------------|
| 中产食物(MIDDLE) | 3-5个 | $20-50价格区间，hunger 25-35 |
| 资本家食物(CAPITALIST) | 2-3个 | $100+价格区间，hunger 35-45，可能带SAN加成 |
| 医疗物品(MEDICAL) | 4-6个 | 各阶级都有，hp恢复10-40 |
| 舒适物品(COMFORT) | 3-4个 | 恢复SAN，提升精神维度 |

---

## 二、住所系统（housing.json）

### 已定义住所概览（4个）

| ID | 名称 | 区域 | 目标阶级 | defenseLevel | regenHp | 周费用 | 状态 |
|-----|------|------|---------|-------------|---------|--------|------|
| APT_SLUMS_01 | 漏风集装箱 | SLUMS | HOMELESS | 1 | 5 | $70(租) | ✅ 保留 |
| APT_RUST_01 | 工会宿舍 | RUST_BELT | WORKER | 3 | 10 | $280(租) | ✅ 保留 |
| HOUSE_SUBURB_01 | 橡树街独栋 | SUBURBS | MIDDLE | 8 | 25 | $350(贷) | ✅ 保留 |
| PENTHOUSE_DOWNTOWN_01 | 云端penthouse | DOWNTOWN | CAPITALIST | 15 | 40 | $8500(贷) | ✅ 保留 |

### 关键数值验证

**物理防御计算**（验证公式）：
- 集装箱：0.7×(1×5×0.6 + 5×2×0.4) + 5×0.3 -10 = **2.1分**
- 工会宿舍：0.7×(3×5×0.6 + 10×2×0.4) + 15×0.3 = **12.95分**
- 郊区独栋：0.7×(8×5×0.6 + 25×2×0.4) + 30×0.3 = **38.5分**
- 顶层豪宅：0.7×(15×5×0.6 + 40×2×0.4) + 50×0.3 = **69.5分**

**阶梯合理**：2 → 13 → 39 → 70（约3-5倍增长）

---

## 三、工作系统（jobs.json）

### 已定义工作概览（7个）

| ID | 名称 | 类型 | 区域 | 目标阶级 | baseSalary | hpCost | sanCost | 特殊要求 | 状态 |
|-----|------|------|------|---------|------------|--------|---------|---------|------|
| JOB_SCAVENGER | 拾荒者 | GIG | SLUMS | HOMELESS | $100 | 15 | 5 | 无 | ✅ 保留 |
| JOB_BLACK_MARKET_LABOR | 黑市苦力 | GIG | SLUMS | HOMELESS | $300 | 30 | 10 | 无 | ✅ 保留 |
| JOB_FACTORY_WORKER | 流水线工人 | FULL_TIME | RUST_BELT | WORKER | $800 | 25 | 5 | 需住所 | ✅ 保留 |
| JOB_UBER_DRIVER | 幽灵车手 | GIG | RUST_BELT | WORKER | $400 | 10 | 15 | 需车辆 | ✅ 保留 |
| JOB_CORP_ACCOUNTANT | 企业会计 | FULL_TIME | DOWNTOWN | MIDDLE | $2500 | 10 | 25 | 需住所 | ✅ 保留 |
| JOB_CONSULTANT | 危机顾问 | GIG | DOWNTOWN | MIDDLE | $1000 | 5 | 30 | 需住所 | ✅ 保留 |
| JOB_BOARD_MEMBER | 董事会成员 | FULL_TIME | DOWNTOWN | CAPITALIST | $15000 | 5 | 50 | 需住所 | ✅ 保留 |

---

## 四、车辆系统（vehicles.json）

### 已定义车辆概览（4个）

| ID | 名称 | 价格 | 目标阶级 | 区域 | 特殊效果 | 状态 |
|-----|------|------|---------|------|---------|------|
| VEH_JUNK | 破车 | $500 | HOMELESS | SLUMS | san-2, 故障率25%, 禁止进入SUBURBS/DOWNTOWN | ✅ 保留 |
| VEH_PICKUP | 二手皮卡 | $2000 | WORKER | RUST_BELT | 可贷款(LOAN_CAR_SUBPRIME) | ✅ 保留 |
| VEH_SEDAN | 轿车 | $8000 | MIDDLE | SUBURBS/RUST_BELT | 需信用分600, 可贷款(LOAN_CAR_STANDARD) | ✅ 保留 |
| VEH_LIMO | 豪华轿车 | $150000 | CAPITALIST | DOWNTOWN | POLICE_IMMUNE(免警察骚扰) | ✅ 保留 |

### 关键机制

**车辆对工作的影响**：
- JOB_UBER_DRIVER（幽灵车手）需要VEHICLE才能工作
- 破车(VEH_JUNK)有区域限制（不能去中产/富人区）
- 车辆有故障机制（billTriggers.breakdownChance）

**车辆对经济的影响**：
- 拥有车辆可以解锁跨区域工作
- 车辆可以出售（sellPriceRate 60-70%）

---

## 五、医院服务系统（hospital_services.json）

### 已定义医疗服务（7个）

| ID | 名称 | 区域 | 类型 | baseCost | 效果 | 保险覆盖 | 状态 |
|-----|------|------|------|----------|------|---------|------|
| SLUM_MYSTERY_PILL | 散装止痛片 | SLUMS | DRUG | $20 | hpRestore15, addiction+10 | 不覆盖 | ✅ 保留 |
| SLUM_SELL_KIDNEY | 器官捐赠(左肾) | SLUMS | SPECIAL | -$3000(赚钱) | hpCap-30, hp-20 | 不覆盖 | ✅ 保留 |
| SLUM_STREET_DOC | 街头急救 | SLUMS | SURGERY | $150 | 治愈ACUTE, hpRestore20, 风险率50% | 不覆盖 | ✅ 保留 |
| RUST_WORKER_SURGERY | 基础外科手术 | RUST_BELT | SURGERY | $2000 | 治愈ACUTE/CHRONIC, hpRestore50, 等待4-8回合 | 覆盖30% | ✅ 保留 |
| RUST_TEST_DRUG | 二期临床试药 | RUST_BELT | SPECIAL | -$500(赚钱) | hp-10, addiction+5, san-5 | 不覆盖 | ✅ 保留 |
| DOWNTOWN_THERAPY | 深度心理重构 | DOWNTOWN | THERAPY | $5000 | sanRestore60, 治愈MENTAL, 等待1-3回合 | 覆盖20% | ✅ 保留 |
| DOWNTOWN_STEM_CELL | 干细胞再生疗法 | DOWNTOWN | SPECIAL | $50000 | hpCap+20, hpRestore100 | 不覆盖 | ✅ 保留 |

### 关键机制

**医疗对生存的影响**：
- 治愈疾病移除存活率惩罚（-5%或-15%）
- hpRestore直接提升HP（影响physicalDefense）
- 部分服务有等待时间（waitTurns）
- 保险覆盖降低自付比例（copayRate）

---

## 六、贷款系统（loans.json）

### 已定义贷款产品（7个）

| ID | 名称 | 提供者 | 目标区域 | minScore | 周利率 | 最大金额 | 周期 | 风险等级 |
|-----|------|--------|---------|----------|--------|----------|------|---------|
| LOAN_SHARK | 街头高利贷 | 黑手党 | SLUMS | 0 | 25% | $2000 | 2周 | EXTREME |
| LOAN_PAYDAY | 发薪日快贷 | 吸血鬼金融 | RUST_BELT | 500 | 10% | $5000 | 4周 | HIGH |
| LOAN_PERSONAL | 个人消费贷 | 联合银行 | SUBURBS | 650 | 3% | $20000 | 12周 | MEDIUM |
| LOAN_BUSINESS | 商业杠杆贷 | 高盛资本 | DOWNTOWN | 750 | 1% | $1000000 | 24周 | LOW |
| LOAN_BAIL_BOND | 自由契约(保释贷) | 铁窗金融 | SLUMS | 0 | 15% | $100000 | 24周 | PREDATORY |
| LOAN_CAR_SUBPRIME | 掠夺性车贷 | Smiling Jack | RUST_BELT | 0 | 5% | $5000 | 20周 | EXTREME |
| LOAN_CAR_STANDARD | 标准车贷 | AutoMall | SUBURBS | 600 | 1.5% | $50000 | 52周 | LOW |

### 关键机制

**贷款对生存的影响**：
- 贷款提供即时现金流（可购买住所/车辆/物品）
- 每周还款压力（interestRate）影响economicSecurity
- 逾期可能触发催收事件（bills.json）
- 高利贷（25%周利率）极难还清，可能陷入债务陷阱

---

## 七、信仰系统（faiths.json）

### 已定义信仰（4个）

| ID | 名称 | 颜色/主题 | 基础区域 | 加入条件 | 仪式名称 | 仪式效果 | 状态 |
|-----|------|----------|---------|---------|---------|---------|------|
| CHURCH | 救赎教会 | 金色 | SUBURBS | $100 | 缴纳什一税 | 消耗10%现金(最少$20), sanReward+15 | ✅ 保留 |
| BROTHERHOOD | 互助兄弟会 | 绿色 | RUST_BELT | 清空背包 | 参加聚礼 | 免费, san+5, hp+10 | ✅ 保留 |
| CULT | 血肉神教 | 紫色 | SLUMS | maxSan≤40 | 进行血祭 | 消耗15HP, goldReward+$150 | ✅ 保留 |
| REVOLUTION | 星星之火 | 红色 | DOWNTOWN | hp≥80, san≥80 | 理论学习 | 消耗10SAN, redPoint+5 | ✅ 保留 |

### 关键机制

**信仰对生存的影响**：
- 仪式直接恢复SAN（影响mentalStability）
- CHURCH/BROTHERHOOD正向恢复
- CULT用HP换金钱（高风险）
- 加入条件筛选不同玩家状态

---

## 八、账单系统（bills.json）

### 已定义账单（5个，HOMELESS专属）

| ID | 名称 | 金额 | 类型 | 效果 | 目标阶级 |
|-----|------|------|------|------|---------|
| B_HOMELESS_ARSON | 人体火炬 | -$50 | JUMP_SCARE | hp-35 | HOMELESS |
| B_HOMELESS_SPRINKLER | 自动喷淋伏击 | $0 | JUMP_SCARE | hp-10 | HOMELESS |
| B_HOMELESS_TIKTOK | 病毒式慈善 | +$200 | JUMP_SCARE | san-20 | HOMELESS |
| B_HOMELESS_NO_SHOES | 鞋子消失术 | -$20 | JUMP_SCARE | hp-5 | HOMELESS |
| B_HOMELESS_RAT_BITE | 鼠群之吻 | $0 | JUMP_SCARE | hp-15 | HOMELESS |

### 关键机制

**账单对生存的影响**：
- 突发金钱损失影响economicSecurity
- HP伤害影响physicalDefense
- SAN伤害影响mentalStability
- 正面账单（如慈善+$200）也有代价（尊严-20SAN）

---

## 九、疾病系统（diseases.json）

### 已定义疾病概览（13个）

| ID | 名称 | 类型 | severity | hpDrain | sanDrain | 状态 |
|-----|------|------|----------|---------|----------|------|
| FLU_LOW | 贫民窟流感 | CHRONIC | 1 | 5 | - | ✅ 保留 |
| SEPSIS | 败血症 | ACUTE | 8 | 40 | - | ✅ 保留 |
| WORKER_LUNG | 铁锈尘肺 | CHRONIC | 3 | 8 | - | ✅ 保留 |
| VOID_PSYCHOSIS | 虚空精神病 | MENTAL | 5 | - | 10 | ✅ 保留 |
| FOOD_POISONING | 食物中毒 | ACUTE | 4 | 10 | - | ✅ 保留 |
| TYPE_2_DIABETES | II型糖尿病 | CHRONIC | 6 | 5 | - | ✅ 保留 |
| HYPERTENSION | 高血压 | CHRONIC | 5 | 3 | - | ✅ 保留 |
| HEART_DISEASE | 心脏病 | CHRONIC | 8 | 8 | - | ✅ 保留 |
| METABOLIC_SYNDROME | 代谢综合征 | CHRONIC | 5 | 4 | - | ✅ 保留 |
| GOUT | 痛风 | CHRONIC | 4 | 3 | - | ✅ 保留 |
| SCURVY | 坏血病 | CHRONIC | 3 | 5 | - | ✅ 保留 |
| FATTY_LIVER | 非酒精性脂肪肝 | CHRONIC | 4 | 3 | - | ✅ 保留 |

---

## 十、保险系统（insurance.json）

### 已定义保险产品（6个）

| ID | 名称 | 类型 | 目标阶级 | weeklyCost | 赔付比例 | 状态 |
|-----|------|------|---------|------------|---------|------|
| INS_SLUMS_SCAM | 快速救急金 | MEDICAL | HOMELESS | $50 | 50% | ✅ 保留 |
| INS_WORKER_UNION | 工团互助险 | MEDICAL | WORKER | $150 | 70% | ✅ 保留 |
| INS_CORP_GOLD | LifeShield黄金 | MEDICAL | MIDDLE | $600 | 90% | ✅ 保留 |
| INS_GLOBAL_VIP | Apex生物安全 | MEDICAL | CAPITALIST | $2500 | 100% | ✅ 保留 |
| INS_AUTO_FAKE | 非标车险 | AUTO | HOMELESS/WORKER | $200 | 50% | ✅ 保留 |
| INS_AUTO_STANDARD | 标准车险 | AUTO | WORKER+ | $50 | 80% | ✅ 保留 |

---

## 十一、事件系统（events.json）

### 已定义事件概览（11个）

当前所有事件均为**HOMELESS阶级专属**：

| ID | 标题 | 场景 | 选项数 | 状态 |
|-----|------|------|--------|------|
| EVT_01_BENCH | 公园长椅 | 暴雪夜无处安身 | 4 | ✅ 保留 |
| EVT_02_TOILET | 上锁的厕所 | 星巴克拒绝借用 | 4 | ✅ 保留 |
| EVT_03_MILK | 倒掉牛奶 | 店员销毁食物 | 4 | ✅ 保留 |
| EVT_04_SPIKES | 桥下尖刺 | 防流浪汉水泥锥 | 4 | ✅ 保留 |
| EVT_05_BUS_TICKET | 单程车票 | 警察驱逐去外地 | 4 | ✅ 保留 |
| EVT_06_HOSPITAL_DUMP | 医院弃人 | 无保险被扔出去 | 4 | ✅ 保留 |
| EVT_07_BEGGING_FINE | 乞讨罚单 | 要饭被罚$50 | 4 | ✅ 保留 |
| EVT_08_LIBRARY | 图书馆驱逐 | 体味被拒入内 | 4 | ✅ 保留 |
| EVT_09_NO_WATER | 消失的水机 | 免费饮水被拆除 | 4 | ✅ 保留 |
| EVT_10_SELLING_PLASMA | 卖血换钱 | 血浆中心$30 | 4 | ✅ 保留 |
| EVT_11_SNAP_HOT_FOOD | 只要冷的 | 食品券不能买热食 | 4 | ✅ 保留 |

---

## 十二、车辆商店系统（vehicleShops.json）

### 已定义车辆商店（4个，按区域）

| 区域 | ID | 主题 | 功能 | 特殊机制 |
|-----|-----|------|------|---------|
| SLUMS | SLUMS_CHOP_SHOP | 拆车厂 | 买车、卖车、驾照 | 黑市交易，可能买到赃车 |
| RUST_BELT | RUST_BELT_AUTO | 二手车行 | 买车、卖车、驾照、DMV排队 | 标准二手车交易 |
| SUBURBS | SUBURBS_DEALERSHIP | 4S店 | 买车、卖车、置换、驾照、租赁 | 支持贷款、信用检查、租赁 |
| DOWNTOWN | DOWNTOWN_SHOWROOM | 豪华展厅 | 买车、卖车、精英驾照 | 现金交易，礼宾服务 |

### 关键机制

**车辆获取路径**：
- SLUMS：破车$500，无门槛
- RUST_BELT：皮卡$2000，可次贷
- SUBURBS：轿车$8000，需信用600
- DOWNTOWN：豪车$150000，现金交易

---

## 十三、数值策划工作重点清单

### 优先级1：填补缺失（必须）

| 系统 | 缺失内容 | 优先级 |
|-----|---------|--------|
| 物品 | 中产食物3-5个、资本家食物2-3个、医疗物品4-6个、舒适物品3-4个 | 🔴 高 |
| 工作 | $800-2500收入区间工作（工头$1200、小业主$1800） | 🔴 高 |
| 事件 | WORKER事件8-10个、MIDDLE事件8-10个、CAPITALIST事件5-8个 | 🔴 高 |
| 账单 | WORKER/MIDDLE/CAPITALIST专属账单（房贷、股票亏损等） | 🟡 中 |

### 优先级2：数值校准（建议）

- [ ] 验证所有物品的hunger/hp值是否符合目标存活率提升
- [ ] 验证住所defenseLevel/regenHp的阶梯是否合理
- [ ] 验证工作收入与消耗的平衡
- [ ] 验证车辆价格与解锁工作的价值比
- [ ] 验证医疗价格与治愈效果的性价比
- [ ] 验证贷款利率与风险的匹配

### 优先级3：关联优化（可选）

- [ ] 设计需要特定车辆的跨区工作
- [ ] 设计需要特定保险的医疗服务优惠
- [ ] 设计信仰与事件的互动
- [ ] 设计贷款逾期与账单系统的联动

---

## 十四、系统间关联图

```
┌─────────────────────────────────────────────────────────────┐
│                        生存率计算                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  物品 ──────┐                                               │
│  (hunger/   │                                               │
│   hp/san)   │                                               │
│             ▼                                               │
│  住所 ─────► 五维分数 ──► Sigmoid ──► 存活率               │
│  (defense/  (physical/                                          │
│   regen)    mental/                                          │
│             nutrition/                                       │
│  工作 ─────► medical/                                         │
│  (salary)   economic)                                        │
│                                                              │
│  信仰 ──────┘ (mental加成)                                   │
│  (san reward)                                                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        影响系统                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  车辆 ──► 解锁工作/跨区移动                                   │
│  贷款 ──► 提前消费/债务压力                                   │
│  保险 ──► 降低医疗成本                                        │
│  医疗 ──► 治愈疾病/恢复HP                                     │
│  事件 ──► 突发HP/Gold/SAN变化                                 │
│  账单 ──► 定期金钱消耗                                        │
│  疾病 ──► 存活率惩罚                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 十五、使用建议

### 对数值策划师

1. **先读本文档** → 了解已有资产
2. **再读B文档** → 理解公式参数
3. **调整现有数值** → 用B文档公式验证
4. **填补缺失内容** → 参考已有资产的风格和结构

### 关键验证公式

```javascript
// 在浏览器控制台验证
import { calculateSurvivalRate } from '@/logic/survivalCalculator';

// 测试物品效果
const before = calculateSurvivalRate(testState);
const after = calculateSurvivalRate(testStateWithItem);
console.log(`物品提升存活率: ${(after.survivalRate - before.survivalRate) * 100}%`);
```

---

**文档版本**：v1.1  
**最后更新**：2026-02-18  
**对应JSON版本**：所有现有JSON文件当前版本
