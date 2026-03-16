# 游戏结局扩展计划 V2

> 基于实际游戏代码和内容的结局设计方案
> **重要**: 所有结局判定条件必须基于 GameState 中真实存在的字段

## 一、现有结局回顾（基于 endings.json）

### 现有22个结局

**DEATH 结局 (ED-01~05)**
| ID | 名称 | 触发条件 |
|----|------|----------|
| ED-01 | 冷冻披萨的温度 | HP≤0, 无家可归者保底 |
| ED-02 | 止痛药幻境 | HP≤0, 默认死亡 |
| ED-03 | 零件批发 | HP≤0, deathReason=DISMANTLED |
| ED-04 | 暴力催收 | HP≤0, deathReason=COP, 或金币<-5000 |
| ED-05 | 天台的抛物线 | HP≤0, deathReason=SUICIDE |

**SURVIVAL 结局 (ED-06~09)** - 52回合到达时触发
| ID | 名称 | 条件 |
|----|------|------|
| ED-06 | 月光电池 | 工人阶级存活 |
| ED-07 | 沉默的耗材 | 无家可归者存活 |
| ED-08 | 中产噩梦 | 中产阶级存活 |
| ED-09 | 猪的快乐 | 资本家存活 |

**ALIENATION 结局 (ED-10~12, 21)**
| ID | 名称 | 条件 |
|----|------|------|
| ED-21 | 蒙昧的幸福 | 灵视<10 |
| ED-10 | 阿卡姆病栋 | 灵视≥95 |
| ED-11 | 末日鼠王 | 灵视≥70 + 持有SURVIVAL_KIT |
| ED-12 | 键盘政治 | 无特定条件 |

**STANCE 结局 (ED-13~16, 22)**
| ID | 名称 | 条件 |
|----|------|------|
| ED-13 | 赤色幽灵 | 红色点数≥100 + 工人阶级 |
| ED-14 | 华尔街之狼 | 狼性点数≥100 + 金币≥500000 |
| ED-15 | 键盘政治 | 老派点数≥100 + 金币<5000 |
| ED-16 | 灯塔 | 回合≥40 |
| ED-22 | 觉醒者：系统重置 | 灵视=100 + 红色≥50 + 档案≥35 |

**UR 结局 (ED-17~20)**
| ID | 名称 | 条件 |
|----|------|------|
| ED-17 | 润(Run) | 金币≥10000 + 灵视≥80 + 持有FAKE_PASSPORT |
| ED-18 | 佛罗里达人 | 无条件 |
| ED-19 | 第四面墙 | 回合10-20 + HP≤10 + 灵视≥90 |
| ED-20 | 美式灵视 | 灵视≥85 |

---

## 二、新增结局设计方案

### 分类原则
1. **死亡结局**: HP≤0 时触发，基于死亡原因、状态、物品等
2. **存活结局**: 52回合到达时触发，基于游戏过程中的行为累积

### GameState 中真实可用的字段（用于判定条件）

```typescript
// 核心属性
vitality.metrics.hp           // 生命值
vitality.metrics.insight      // 灵视值
vitality.metrics.gold         // 金钱
vitality.metrics.addiction    // 成瘾值
vitality.metrics.hunger       // 饱腹度
vitality.metrics.creditScore  // 信用分

// 身份
vitality.identity.currentClass    // 当前阶级 HOMELESS/WORKER/MIDDLE/CAPITALIST
vitality.identity.points.red      // 红色点数
vitality.identity.points.wolf     // 狼性点数
vitality.identity.points.old      // 老派点数

// 时间
vitality.time.currentTurn     // 当前回合

// 状态标记
vitality.flags.isHomeless           // 是否无家可归
vitality.flags.debtTurns            // 连续负债周数
vitality.flags.hasFelonyRecord      // 是否有重罪记录
vitality.flags.insuranceSuspended   // 保险是否暂停
vitality.activeDiseases             // 疾病ID数组

// 工作
vitality.activeJobs             // 工作ID数组

// 物品
inventory                       // 物品ID数组

// 信仰
faith.id                        // 当前信仰 NONE/CHURCH/BROTHERHOOD/CULT/REVOLUTION
faith.level                     // 信仰等级
faith.hasPerformedRite          // 是否进行过仪式

// 监狱
prison.inJail                   // 是否在监狱
prison.sentenceTurns            // 刑期
prison.hasFelonyRecord          // 重罪记录

// 银行
bank.activeLoans                // 活跃贷款
bank.lifetimeInterestPaid       // 一生支付利息

// 房产
activeHousing                   // 当前住房

// 车辆
activeLease                     // 租赁车辆

// 档案
unlockedArchives                // 已解锁档案ID数组
achievedEndings                 // 已达成结局ID数组

// 账本
vitality.ledger.history         // 账本记录
```

---

## 三、新增死亡结局（HP≤0 时触发）

### 3.1 疾病相关死亡

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-23 | 败血症休克 | DEATH | HP≤0 + 患有SEPSIS | 伤口感染最终吞噬了你的生命。你死时高烧42度，像一块被锈蚀的废铁。 |
| ED-24 | 心脏病发作 | DEATH | HP≤0 + 患有HEART_DISEASE | 胸口的剧痛是你最后的知觉。你的心脏支架手术账单还躺在抽屉里，金额是50000美元。 |
| ED-25 | 糖尿病昏迷 | DEATH | HP≤0 + 患有TYPE_2_DIABETES + 金币<胰岛素费用 | 你选择用胰岛素钱付了房租。酮症酸中毒带走了你，临终前你不再感到饥饿。 |
| ED-26 | 铁锈尘肺 | DEATH | HP≤0 + 患有WORKER_LUNG + 工人阶级 | 你咳出的最后一痰里有金属颗粒——那是你二十年工龄的勋章。 |
| ED-27 | 虚空吞噬 | DEATH | HP≤0 + 患有VOID_PSYCHOSIS + 灵视>80 | 你终于看见了世界背后的代码。那不是光，是吞噬一切的虚空。 |
| ED-28 | 坏血病终末期 | DEATH | HP≤0 + 患有SCURVY + 回合>30 | 21天没有新鲜蔬果，你的牙龈全部溃烂。在21世纪的美国，你死于中世纪的水手病。 |

### 3.2 成瘾相关死亡

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-29 | 阿片类过量 | DEATH | HP≤0 + addiction≥70 | 你只是想止痛，但街头药片的纯度不稳定。你成为了每年70000个阿片类死亡统计中的一个。 |
| ED-30 | 酒精戒断 | DEATH | HP≤0 + 持有buff_addiction_alcohol + HP<20 | 你试图戒酒，但震颤性谵妄引发了癫痫发作。系统没有提供免费戒毒服务。 |

### 3.3 社会系统死亡

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-31 | 驱逐令执行 | DEATH | HP≤0 + hasFelonyRecord=true + 无家可归 | 有犯罪记录的你被所有收容所拒绝。那个冬夜，你在公园长椅上睡着了，再也没有醒来。 |
| ED-32 | 保险拒赔死亡 | DEATH | HP≤0 + insuranceSuspended=true | 出狱后保险被暂停，你付不起急诊室的挂号费。在候诊室的长椅上，你静静死去。 |
| ED-33 | 饿死 | DEATH | HP≤0 + hunger=0 + 金币<10 | 你花光了最后一分钱，食物银行已经关门。胃里最后一丝暖意消失后，世界变得安静。 |
| ED-34 | 信用评分死亡 | DEATH | HP≤0 + creditScore<300 + debtTurns>10 | 信用评分低于300，你连高利贷都借不到。没有资金流转，生命也就此停滞。 |

### 3.4 死亡结局判定优先级

```
1. 特定死因映射 (DISMANTLED→ED-03, COP→ED-04, SUICIDE→ED-05)
2. 疾病死亡 (ED-23~ED-28, 优先级高于普通死亡)
3. 成瘾死亡 (ED-29~ED-30)
4. 社会系统死亡 (ED-31~ED-34)
5. 保底死亡 (ED-01~ED-02)
```

---

## 四、新增存活结局（52回合到达时触发）

### 4.1 阶级跃迁类

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-35 | 爬出深渊 | SURVIVAL | 初始HOMELESS + 当前MIDDLE/CAPITALIST + 信用分>600 | 你从无家可归者变成了有房有车的中产阶级。这段路你走了52周，而其他人要走一辈子。 |
| ED-36 | 坠落贵族 | ALIENATION | 初始MIDDLE/CAPITALIST + 当前HOMELESS | 你曾是体面人，现在和流浪汉抢垃圾桶。你比其他人更清楚坠落的感觉——因为你知道上面是什么样子。 |
| ED-37 | 阶层守护者 | STANCE | 保持同一阶级52回合 + 红色点数>30 | 你拒绝了所有"晋升"的机会，选择留在铁锈带和兄弟们一起。你守护着比金钱更重要的东西。 |

### 4.2 信仰类

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-38 | 虔诚信徒 | ALIENATION | faith.id=CHURCH + faith.level≥3 + 每周捐献 | 你把工资的十分之一给了上帝。虽然你还是个穷人，但牧师的笑容比你的存款余额更灿烂。 |
| ED-39 | 兄弟会领袖 | STANCE | faith.id=BROTHERHOOD + faith.level≥3 + 红色点数>50 | 你在贫民窟建立了互助网络。当系统抛弃他们时，你成为了那个递出面包的人。 |
| ED-40 | 邪教祭品 | DEATH | faith.id=CULT + faith.level≥3 + HP<30 | 你献祭了太多——金钱、健康、理智。当教主开着法拉利离开时，你才明白自己只是燃料。 |
| ED-41 | 革命先知 | STANCE | faith.id=REVOLUTION + faith.level≥3 + 灵视>70 | 你不再相信任何神，只相信人民的力量。FBI的文件里，你的名字被红色标记。 |

### 4.3 工作/经济类

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-42 | 零工经济祭品 | SURVIVAL | 全程GIG工作 + 从未FULL_TIME + 金币<20000 | 你是Uber司机、送餐员、TaskRabbit杂工。52周后你没有401K、没有医保，只有一辆磨损的车。 |
| ED-43 | 公司忠犬 | ALIENATION | 同一FULL_TIME工作>40回合 + 灵视<30 | 你从未跳过槽，从未请过病假。公司爱你——直到下个季度的裁员名单。但现在，你是优秀员工。 |
| ED-44 | 债务自由 | STANCE | bank.activeLoans为空 + 一生利息支付>10000 | 你还清了所有债务，包括那笔像是永恒的助学贷款。自由的味道，是没有任何还款提醒的早晨。 |
| ED-45 | 银行奴隶 | SURVIVAL | activeLoans中有房贷 + debtTurns>20 | 你有了房子，也有了30年的锁链。恭喜，你的墓碑上将刻着："按时还款的公民"。 |
| ED-46 | 现金之王 | UR | gold>500000 + bank.activeLoans为空 + 信用分<400 | 你几乎不用银行，只用现金交易。FBI怀疑你是毒贩，但其实你只是想逃离信用评分系统。 |

### 4.4 疾病/医疗类

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-47 | 疾病幸存者 | STANCE | 曾患HEART_DISEASE/SEPSIS + 治愈 + 金币<0 | 一场大病让你负债累累，但你活了下来。现在你知道了：在美国，生病是一种特权。 |
| ED-48 | 未诊断的代价 | DEATH | 患有CHRONIC疾病>20回合 + 从未治疗 | 你感觉到了症状，但付不起诊断费。52周后，那个可治愈的病变成了致命的东西。 |
| ED-49 | 医疗旅游难民 | UR | 曾治疗疾病 + 因治疗导致gold<-30000 | 你在美国医疗系统中幸存下来，但代价是终身债务。你的病历比小说还厚，账单比圣经还重。 |

### 4.5 社会行为类

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-50 | 完美信用囚徒 | ALIENATION | creditScore>800 + 从未逾期 + 灵视<40 | 你从未逾期还款。银行爱你，你的信用评分像你的血压一样健康。完美得像一场表演。 |
| ED-51 | 重罪烙印 | SURVIVAL | hasFelonyRecord=true + 存活52回合 | 有犯罪记录的你被所有体面工作拒绝。但你活了下来，用那些"不体面"的方式。 |
| ED-52 | 监狱毕业生 | STANCE | 曾入狱 + 刑期>5回合 + 未再犯罪 | 你在监狱里读完了大学课程。出狱后你成为了帮助囚犯的社工，把地狱变成了教室。 |
| ED-53 | 隐士 | ALIENATION | 社交事件<10次 + 灵视>80 + 金币<5000 | 你几乎不再与人交流。窗外的世界太吵了，而你的大脑里有整个宇宙在运转。 |
| ED-54 | 档案收藏家 | STANCE | unlockedArchives>25 + 灵视>60 | 你收集了25个档案，拼凑出系统的真相。知识没有让你富有，但让你自由。 |
| ED-55 | 永不为奴 | STANCE | 从未activeJobs满槽 + 红色点数>40 | 你拒绝了所有全职工作的offer。不稳定，但自由——这是你唯一拥有的奢侈品。 |

### 4.6 极端玩法类

| ID | 名称 | 类型 | 触发条件 | 描述 |
|----|------|------|----------|------|
| ED-56 | 囤积狂 | ALIENATION | inventory物品数量>40 + 金币<10000 | 你的房间堆满了罐头、药品和末日装备。如果核战爆发，你至少可以安心地发疯。 |
| ED-57 | 零消费主义者 | STANCE | 52回合总消费<15000 + hunger从未<30 | 你几乎不花钱。在这个消费主义宗教里，你是个异教徒——也是最自由的人。 |
| ED-58 | 房东之路 | SURVIVAL | 拥有房产 + 出租收入>工资收入 + 狼性点数>30 | 你终于也成了那个收租的人。看着租客的挣扎，你想起曾经的自己——然后调高了一点租金。 |
| ED-59 | 车辆奴隶 | SURVIVAL | 全程依赖VEHICLE工作 + 车辆维修费>总收入30% | 没车就没法工作，为了养车你必须工作。你被困在这个轮子里，像仓鼠一样奔跑。 |
| ED-60 | 觉醒边缘 | UR | 灵视95-99 + 红色点数<50 | 你几乎看透了系统的代码，但还差一点。那种接近真理却无法触及的痛苦，比无知更折磨。 |

---

## 五、结局数据文件

### 新增死亡结局 JSON (endings_death_additions.json)

```json
[
  {
    "id": "ED-23",
    "title": "败血症休克",
    "description": "伤口感染最终吞噬了你的生命。你死时高烧42度，像一块被锈蚀的废铁。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasDisease": "SEPSIS"
    }
  },
  {
    "id": "ED-24",
    "title": "心脏病发作",
    "description": "胸口的剧痛是你最后的知觉。你的心脏支架手术账单还躺在抽屉里，金额是50000美元。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasDisease": "HEART_DISEASE"
    }
  },
  {
    "id": "ED-25",
    "title": "糖尿病昏迷",
    "description": "你选择用胰岛素钱付了房租。酮症酸中毒带走了你，临终前你不再感到饥饿。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasDisease": "TYPE_2_DIABETES"
    }
  },
  {
    "id": "ED-26",
    "title": "铁锈尘肺",
    "description": "你咳出的最后一痰里有金属颗粒——那是你二十年工龄的勋章。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasDisease": "WORKER_LUNG",
      "requiredClass": "WORKER"
    }
  },
  {
    "id": "ED-27",
    "title": "虚空吞噬",
    "description": "你终于看见了世界背后的代码。那不是光，是吞噬一切的虚空。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasDisease": "VOID_PSYCHOSIS",
      "minInsight": 80
    }
  },
  {
    "id": "ED-28",
    "title": "坏血病终末期",
    "description": "21天没有新鲜蔬果，你的牙龈全部溃烂。在21世纪的美国，你死于中世纪的水手病。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasDisease": "SCURVY"
    }
  },
  {
    "id": "ED-29",
    "title": "阿片类过量",
    "description": "你只是想止痛，但街头药片的纯度不稳定。你成为了每年70000个阿片类死亡统计中的一个。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "minAddiction": 70
    }
  },
  {
    "id": "ED-30",
    "title": "酒精戒断",
    "description": "你试图戒酒，但震颤性谵妄引发了癫痫发作。系统没有提供免费戒毒服务。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasBuff": "buff_addiction_alcohol",
      "maxHp": 20
    }
  },
  {
    "id": "ED-31",
    "title": "驱逐令执行",
    "description": "有犯罪记录的你被所有收容所拒绝。那个冬夜，你在公园长椅上睡着了，再也没有醒来。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "requiredClass": "HOMELESS",
      "hasFlag": "hasFelonyRecord"
    }
  },
  {
    "id": "ED-32",
    "title": "保险拒赔死亡",
    "description": "出狱后保险被暂停，你付不起急诊室的挂号费。在候诊室的长椅上，你静静死去。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasFlag": "insuranceSuspended"
    }
  },
  {
    "id": "ED-33",
    "title": "饿死",
    "description": "你花光了最后一分钱，食物银行已经关门。胃里最后一丝暖意消失后，世界变得安静。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "maxGold": 10
    }
  },
  {
    "id": "ED-40",
    "title": "邪教祭品",
    "description": "你献祭了太多——金钱、健康、理智。当教主开着法拉利离开时，你才明白自己只是燃料。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "requiredFaith": "CULT",
      "minFaithLevel": 3,
      "maxHp": 30
    }
  },
  {
    "id": "ED-48",
    "title": "未诊断的代价",
    "description": "你感觉到了症状，但付不起诊断费。52周后，那个可治愈的病变成了致命的东西。",
    "priority": 1,
    "type": "DEATH",
    "conditions": {
      "maxHp": 0,
      "hasChronicDiseaseTurns": 20
    }
  }
]
```

### 新增存活结局 JSON (endings_survival_additions.json)

```json
[
  {
    "id": "ED-35",
    "title": "爬出深渊",
    "description": "你从无家可归者变成了有房有车的中产阶级。这段路你走了52周，而其他人要走一辈子。",
    "priority": 2,
    "type": "SURVIVAL",
    "conditions": {
      "minTurn": 52,
      "startedAsClass": "HOMELESS",
      "requiredClass": "MIDDLE",
      "minCreditScore": 600
    }
  },
  {
    "id": "ED-36",
    "title": "坠落贵族",
    "description": "你曾是体面人，现在和流浪汉抢垃圾桶。你比其他人更清楚坠落的感觉——因为你知道上面是什么样子。",
    "priority": 3,
    "type": "ALIENATION",
    "conditions": {
      "minTurn": 52,
      "startedAsClass": "MIDDLE",
      "requiredClass": "HOMELESS"
    }
  },
  {
    "id": "ED-37",
    "title": "阶层守护者",
    "description": "你拒绝了所有"晋升"的机会，选择留在铁锈带和兄弟们一起。你守护着比金钱更重要的东西。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "sameClassTurns": 52,
      "requiredPoints": { "red": 30 }
    }
  },
  {
    "id": "ED-38",
    "title": "虔诚信徒",
    "description": "你把工资的十分之一给了上帝。虽然你还是个穷人，但牧师的笑容比你的存款余额更灿烂。",
    "priority": 3,
    "type": "ALIENATION",
    "conditions": {
      "minTurn": 52,
      "requiredFaith": "CHURCH",
      "minFaithLevel": 3
    }
  },
  {
    "id": "ED-39",
    "title": "兄弟会领袖",
    "description": "你在贫民窟建立了互助网络。当系统抛弃他们时，你成为了那个递出面包的人。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "requiredFaith": "BROTHERHOOD",
      "minFaithLevel": 3,
      "requiredPoints": { "red": 50 }
    }
  },
  {
    "id": "ED-41",
    "title": "革命先知",
    "description": "你不再相信任何神，只相信人民的力量。FBI的文件里，你的名字被红色标记。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "requiredFaith": "REVOLUTION",
      "minFaithLevel": 3,
      "minInsight": 70
    }
  },
  {
    "id": "ED-42",
    "title": "零工经济祭品",
    "description": "你是Uber司机、送餐员、TaskRabbit杂工。52周后你没有401K、没有医保，只有一辆磨损的车。",
    "priority": 2,
    "type": "SURVIVAL",
    "conditions": {
      "minTurn": 52,
      "onlyGigWork": true,
      "maxGold": 20000
    }
  },
  {
    "id": "ED-43",
    "title": "公司忠犬",
    "description": "你从未跳过槽，从未请过病假。公司爱你——直到下个季度的裁员名单。但现在，你是优秀员工。",
    "priority": 3,
    "type": "ALIENATION",
    "conditions": {
      "minTurn": 52,
      "sameJobTurns": 40,
      "maxInsight": 30
    }
  },
  {
    "id": "ED-44",
    "title": "债务自由",
    "description": "你还清了所有债务，包括那笔像是永恒的助学贷款。自由的味道，是没有任何还款提醒的早晨。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "noActiveLoans": true,
      "lifetimeInterestPaid": 10000
    }
  },
  {
    "id": "ED-45",
    "title": "银行奴隶",
    "description": "你有了房子，也有了30年的锁链。恭喜，你的墓碑上将刻着："按时还款的公民"。",
    "priority": 2,
    "type": "SURVIVAL",
    "conditions": {
      "minTurn": 52,
      "hasMortgage": true,
      "debtTurns": 20
    }
  },
  {
    "id": "ED-46",
    "title": "现金之王",
    "description": "你几乎不用银行，只用现金交易。FBI怀疑你是毒贩，但其实你只是想逃离信用评分系统。",
    "priority": 5,
    "type": "UR",
    "conditions": {
      "minTurn": 52,
      "minGold": 500000,
      "noActiveLoans": true,
      "maxCreditScore": 400
    }
  },
  {
    "id": "ED-47",
    "title": "疾病幸存者",
    "description": "一场大病让你负债累累，但你活了下来。现在你知道了：在美国，生病是一种特权。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "hadDisease": ["HEART_DISEASE", "SEPSIS"],
      "curedDisease": true,
      "maxGold": 0
    }
  },
  {
    "id": "ED-49",
    "title": "医疗旅游难民",
    "description": "你在美国医疗系统中幸存下来，但代价是终身债务。你的病历比小说还厚，账单比圣经还重。",
    "priority": 5,
    "type": "UR",
    "conditions": {
      "minTurn": 52,
      "hadMedicalTreatment": true,
      "maxGold": -30000
    }
  },
  {
    "id": "ED-50",
    "title": "完美信用囚徒",
    "description": "你从未逾期还款。银行爱你，你的信用评分像你的血压一样健康。完美得像一场表演。",
    "priority": 3,
    "type": "ALIENATION",
    "conditions": {
      "minTurn": 52,
      "minCreditScore": 800,
      "neverOverdue": true,
      "maxInsight": 40
    }
  },
  {
    "id": "ED-51",
    "title": "重罪烙印",
    "description": "有犯罪记录的你被所有体面工作拒绝。但你活了下来，用那些"不体面"的方式。",
    "priority": 2,
    "type": "SURVIVAL",
    "conditions": {
      "minTurn": 52,
      "hasFlag": "hasFelonyRecord"
    }
  },
  {
    "id": "ED-52",
    "title": "监狱毕业生",
    "description": "你在监狱里读完了大学课程。出狱后你成为了帮助囚犯的社工，把地狱变成了教室。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "wasInPrison": true,
      "prisonTurns": 5,
      "noReoffense": true
    }
  },
  {
    "id": "ED-53",
    "title": "隐士",
    "description": "你几乎不再与人交流。窗外的世界太吵了，而你的大脑里有整个宇宙在运转。",
    "priority": 3,
    "type": "ALIENATION",
    "conditions": {
      "minTurn": 52,
      "socialEvents": 10,
      "minInsight": 80,
      "maxGold": 5000
    }
  },
  {
    "id": "ED-54",
    "title": "档案收藏家",
    "description": "你收集了25个档案，拼凑出系统的真相。知识没有让你富有，但让你自由。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "minArchives": 25,
      "minInsight": 60
    }
  },
  {
    "id": "ED-55",
    "title": "永不为奴",
    "description": "你拒绝了所有全职工作的offer。不稳定，但自由——这是你唯一拥有的奢侈品。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "neverFullTime": true,
      "requiredPoints": { "red": 40 }
    }
  },
  {
    "id": "ED-56",
    "title": "囤积狂",
    "description": "你的房间堆满了罐头、药品和末日装备。如果核战爆发，你至少可以安心地发疯。",
    "priority": 3,
    "type": "ALIENATION",
    "conditions": {
      "minTurn": 52,
      "minInventoryCount": 40,
      "maxGold": 10000
    }
  },
  {
    "id": "ED-57",
    "title": "零消费主义者",
    "description": "你几乎不花钱。在这个消费主义宗教里，你是个异教徒——也是最自由的人。",
    "priority": 4,
    "type": "STANCE",
    "conditions": {
      "minTurn": 52,
      "totalSpending": 15000,
      "neverStarved": true
    }
  },
  {
    "id": "ED-58",
    "title": "房东之路",
    "description": "你终于也成了那个收租的人。看着租客的挣扎，你想起曾经的自己——然后调高了一点租金。",
    "priority": 2,
    "type": "SURVIVAL",
    "conditions": {
      "minTurn": 52,
      "hasRentalIncome": true,
      "rentalIncomeGreaterThanSalary": true,
      "requiredPoints": { "wolf": 30 }
    }
  },
  {
    "id": "ED-59",
    "title": "车辆奴隶",
    "description": "没车就没法工作，为了养车你必须工作。你被困在这个轮子里，像仓鼠一样奔跑。",
    "priority": 2,
    "type": "SURVIVAL",
    "conditions": {
      "minTurn": 52,
      "vehicleRequiredForWork": true,
      "vehicleCostPercent": 30
    }
  },
  {
    "id": "ED-60",
    "title": "觉醒边缘",
    "description": "你几乎看透了系统的代码，但还差一点。那种接近真理却无法触及的痛苦，比无知更折磨。",
    "priority": 5,
    "type": "UR",
    "conditions": {
      "minTurn": 52,
      "insightRange": [95, 99],
      "requiredPoints": { "red": 0, "maxRed": 50 }
    }
  }
]
```

---

## 六、需要实现的新条件检查

在 `endings.ts` 中需要添加以下新条件检查：

```typescript
// 疾病检查
if (condition.hasDisease && !state.vitality.activeDiseases.includes(condition.hasDisease)) return false;
if (condition.hasChronicDiseaseTurns && !checkChronicDiseaseDuration(state, condition.hasChronicDiseaseTurns)) return false;

// Buff检查
if (condition.hasBuff && !hasBuff(state, condition.hasBuff)) return false;

// 信仰检查
if (condition.requiredFaith && state.faith.id !== condition.requiredFaith) return false;
if (condition.minFaithLevel && state.faith.level < condition.minFaithLevel) return false;

// 标记检查
if (condition.hasFlag && !state.vitality.flags[condition.hasFlag]) return false;

// 历史检查（需要追踪）
if (condition.startedAsClass && !checkStartedAsClass(state, condition.startedAsClass)) return false;
if (condition.sameClassTurns && !checkSameClassDuration(state, condition.sameClassTurns)) return false;
if (condition.sameJobTurns && !checkSameJobDuration(state, condition.sameJobTurns)) return false;
if (condition.wasInPrison && !state.vitality.flags.hasBeenInPrison) return false;
if (condition.noReoffense && checkReoffense(state)) return false;
if (condition.onlyGigWork && !checkOnlyGigWork(state)) return false;
if (condition.neverFullTime && checkHadFullTime(state)) return false;
if (condition.neverOverdue && checkHadOverdue(state)) return false;
if (condition.hadDisease && !checkHadDisease(state, condition.hadDisease)) return false;
if (condition.curedDisease && !checkCuredDisease(state)) return false;
if (condition.noActiveLoans && state.bank.activeLoans.length > 0) return false;
if (condition.hasMortgage && !hasMortgage(state)) return false;
if (condition.lifetimeInterestPaid && state.bank.lifetimeInterestPaid < condition.lifetimeInterestPaid) return false;
if (condition.minArchives && state.unlockedArchives.length < condition.minArchives) return false;
if (condition.minInventoryCount && state.inventory.length < condition.minInventoryCount) return false;
if (condition.totalSpending && calculateTotalSpending(state) > condition.totalSpending) return false;
if (condition.neverStarved && checkWasStarved(state)) return false;
if (condition.hasRentalIncome && !hasRentalIncome(state)) return false;
if (condition.rentalIncomeGreaterThanSalary && !checkRentalVsSalary(state)) return false;
if (condition.vehicleRequiredForWork && !isVehicleRequired(state)) return false;
if (condition.vehicleCostPercent && !checkVehicleCostPercent(state, condition.vehicleCostPercent)) return false;
if (condition.socialEvents && countSocialEvents(state) > condition.socialEvents) return false;
if (condition.hadMedicalTreatment && !checkHadMedicalTreatment(state)) return false;
if (condition.insightRange && !isInsightInRange(state, condition.insightRange)) return false;
```

---

## 七、结局统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 原有结局 | 22个 | ED-01~ED-22 |
| 新增死亡结局 | 13个 | ED-23~ED-34, ED-40, ED-48 |
| 新增存活结局 | 26个 | ED-35~ED-39, ED-41~ED-47, ED-49~ED-60 |
| **总计** | **61个** | 完整结局库 |

---

## 八、实施建议

### 第一阶段：基础死亡结局（1周）
- 实现疾病死亡结局 (ED-23~ED-28)
- 实现成瘾死亡结局 (ED-29~ED-30)

### 第二阶段：社会系统死亡结局（1周）
- 实现社会死亡结局 (ED-31~ED-34)
- 添加必要的游戏状态追踪

### 第三阶段：存活结局 - 阶级与信仰（1周）
- 实现阶级跃迁结局 (ED-35~ED-37)
- 实现信仰结局 (ED-38~ED-41)

### 第四阶段：存活结局 - 经济与社会（1周）
- 实现工作/经济结局 (ED-42~ED-46)
- 实现医疗/社会结局 (ED-47~ED-55)

### 第五阶段：极端玩法结局（1周）
- 实现极端玩法结局 (ED-56~ED-60)
- 完善所有条件检查逻辑

---

## 九、备注

1. **所有条件必须可验证**: 每个结局条件必须能从 GameState 中读取
2. **向后兼容**: 不影响现有22个结局的触发
3. **优先级协调**: 新增结局优先级与现有结局不冲突
4. **性能考虑**: 历史追踪字段需要在游戏过程中持续记录，避免结局判定时遍历整个历史
