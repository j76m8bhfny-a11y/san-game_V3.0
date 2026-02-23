# 事件与档案 JSON 生成规范

> 版本: 3.0  
> 适用: SANGUO 游戏事件系统

---

## 一、文件结构

```
game/src/assets/data/events/
├── homeless/          # 流浪者事件 (EVT_H01-EVT_H60)
├── worker/            # 工人事件 (EVT_W01-EVT_W60)
├── middle/            # 中产事件 (EVT_M01-EVT_M60)
├── capitalist/        # 资本家事件 (EVT_C01-EVT_C60)
└── common/            # 通用事件 (EVT_X01-EVT_X30)
```

---

## 二、事件 JSON 结构

### 完整模板

```json
{
  "$schema": "game-event-v3",
  "id": "EVT_H01_BENCH_SLEEP",
  "title": "睡长椅的一夜",
  "category": "HOMELESS",
  "series": "基础生存",
  "layer": {
    "background": "/assets/scenes/bg_park_night.png",
    "foreground": "/assets/events/evt_bench_sleep.png"
  },
  "conditions": {
    "requiredClass": ["HOMELESS"],
    "minInsight": 0,
    "maxInsight": 100,
    "minTurn": 1,
    "maxTurn": 52,
    "weight": 10
  },
  "text": "凌晨四点，你被冻醒。长椅的金属扶手结了层霜，你的手指已经失去知觉。对面写字楼的保安看了你一眼，没说什么——他已经习惯了你的存在。",
  "historicalNote": "基于美国城市'敌意建筑'（Hostile Architecture）设计。长椅被故意设计得让人无法躺下，以驱赶无家可归者。",
  "options": {
    "A": {
      "label": "相信明天会更好，努力就能改变",
      "roast": "明天会更糟，但你不知道。你已经被系统标记为'不合作者'。",
      "flavorText": "你告诉自己要坚持，要相信努力就能改变命运。这种信念让你在寒风中多撑了一会儿。",
      "ideology": "新自由主义/奋斗逼",
      "archiveCommentary": "这种选择代表了系统最希望穷人持有的心态：自责、内卷、永不质疑结构。当你相信失败是个人原因时，你就不会质疑游戏规则本身。",
      "effects": {
        "scaling": "LEVERAGE",
        "gold": 150,
        "hp": -12,
        "points": { "old": 3 },
        "insightGain": 8
      }
    },
    "B": {
      "label": "换个角落躲风，别被人看见",
      "roast": "你学会了隐形，这是流浪者的生存第一课。",
      "flavorText": "你选择了最安全、最不需要思考的路径。麻木不是愚蠢，而是生存策略。",
      "ideology": "犬儒主义/摆烂",
      "archiveCommentary": "在一个无法胜利的系统中，不抱希望就不会失望。这种'低姿态生存'是高剥夺环境下的理性适应。",
      "effects": {
        "scaling": "FIXED",
        "gold": 25,
        "hp": -3,
        "points": {},
        "insightGain": 1
      }
    },
    "C": {
      "label": "去便利店买杯热咖啡取暖",
      "roast": "1.5美元换来半小时的温暖，然后回到原地。消费主义提供了完美的出口。",
      "flavorText": "你决定花钱解决这个让你不安的问题。消费行为让你短暂地感觉自己像个'正常人'。",
      "ideology": "消费主义/岁静",
      "archiveCommentary": "消费主义提供了一个完美的出口：把系统性问题转化为个人问题，然后用钱解决。咖啡的温暖是真实的，但问题的根源被掩盖了。",
      "effects": {
        "scaling": "INCOME",
        "gold": -0.15,
        "hp": 8,
        "points": { "wolf": 3 },
        "insight": -10
      }
    },
    "D": {
      "label": "⚠️ 意识到这张长椅是城市设计的一部分——它故意设计得让人无法舒适地躺下",
      "roast": " hostility architecture（敌意建筑）。金属扶手、倾斜椅面、间隔凸起——每一个细节都是为了驱赶你。",
      "flavorText": "你看到了表象之下的真相：这不是疏忽，而是设计。城市的每一个角落都在对你说'你不属于这里'。",
      "ideology": "激进左翼/觉醒",
      "archiveCommentary": "真相的代价总是高昂的，但沉默的代价更高。当你看到结构性暴力时，你就再也无法假装这只是个人失败。",
      "effects": {
        "scaling": "FIXED",
        "gold": -100,
        "hp": -18,
        "points": { "red": 15 },
        "insight": -10
      },
      "sanLock": 40,
      "isGlitched": true,
      "glitchEffect": "chromatic_aberration",
      "archiveId": "No.01_HOSTILE_ARCHITECTURE"
    }
  },
  "metadata": {
    "author": "你的笔名",
    "version": "3.0",
    "createdAt": "2024-01-20",
    "updatedAt": "2024-01-20",
    "references": [
      "https://en.wikipedia.org/wiki/Hostile_architecture"
    ],
    "relatedEvents": ["EVT_H02_TRASH_LOCKED", "EVT_H03_PUBLIC_RESTROOM"]
  }
}
```

---

## 三、字段详解

### 3.1 基础信息

| 字段 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `$schema` | string | ✅ | 固定值 `"game-event-v3"` |
| `id` | string | ✅ | 格式: `EVT_{分类}{序号}_{英文标题}` |
| `title` | string | ✅ | 事件标题，8-15字，有文学感 |
| `category` | string | ✅ | `HOMELESS`/`WORKER`/`MIDDLE`/`CAPITALIST`/`COMMON` |
| `series` | string | ✅ | 系列主题，如"基础生存","医疗系统","阶级跨越" |
| `text` | string | ✅ | 事件描述，100-200字，具体场景，有画面感 |
| `historicalNote` | string | ❌ | 现实背景说明，增强真实感 |

#### ID 命名规范

```
格式: EVT_{分类代码}{序号}_{英文主题}

分类代码:
- H = HOMELESS (流浪者)
- W = WORKER (工人)
- M = MIDDLE (中产)
- C = CAPITALIST (资本家)
- X = COMMON (通用)

示例:
- EVT_H01_BENCH_SLEEP       # 流浪者01号：睡长椅
- EVT_W23_FACTORY_INJURY    # 工人23号：工伤
- EVT_M12_HOA_FINE          # 中产12号：HOA罚款
- EVT_C45_OFFSHORE_ACCOUNT  # 资本家45号：离岸账户
- EVT_X07_FLU               # 通用07号：流感
```

### 3.2 视觉层

```json
"layer": {
  "background": "/assets/scenes/{场景}.png",
  "foreground": "/assets/events/{事件图}.png"
}
```

可用场景背景 (bg_*.png):
- `bg_park_night` - 公园夜晚
- `bg_welfare_office` - 福利署
- `bg_factory_floor` - 工厂车间
- `bg_suburban_home` - 郊区住宅
- `bg_downtown_office` - 金融区写字楼
- `bg_emergency_room` - 急诊室
- `bg_alley_night` - 后巷夜晚

### 3.3 触发条件

```json
"conditions": {
  "requiredClass": ["HOMELESS"],    // 可选，限制职业
  "minInsight": 0,                   // 最小灵视（觉醒度不足看不到）
  "maxInsight": 100,                 // 最大灵视（太觉醒看不到世俗事件）
  "minTurn": 1,                      // 最早触发回合
  "maxTurn": 52,                     // 最晚触发回合
  "weight": 10                       // 权重，越高越容易被抽中
}
```

### 3.4 选项结构

四个选项必须全部存在：A, B, C, D

#### 文案字段

| 字段 | 字数 | 风格要求 |
|:---|:---|:---|
| `label` | 10-20字 | 选项文字，D选项必须以 ⚠️ 开头 |
| `roast` | 20-40字 | 吐槽，打破第四面墙，犀利 |
| `flavorText` | 30-60字 | 风味描述，第一人称内心独白 |
| `ideology` | - | 意识形态标签，见下表 |
| `archiveCommentary` | 50-100字 | 档案评论，社会学家视角冷静分析 |

#### 意识形态标签库

**A选项（奋斗/鸡汤）:**
- `新自由主义/奋斗逼`
- `美国梦/个人奋斗`
- `成功学/自我提升`
- `技术乌托邦/创新崇拜`

**B选项（安全/麻木）:**
- `犬儒主义/摆烂`
- `实用主义/生存优先`
- `虚无主义/无意义`
- `斯多葛主义/接受命运`

**C选项（消费/逃避）:**
- `消费主义/岁静`
- `舒适区/小确幸`
- `身份政治/符号消费`
- `心理治疗/自我关怀`

**D选项（觉醒/真相）:**
- `激进左翼/觉醒`
- `马克思主义/阶级斗争`
- `无政府主义/反体制`
- ` Accelerationism / 加速主义`

#### 数值字段（已统一，照抄即可）

```json
"effects": {
  "scaling": "LEVERAGE|FIXED|INCOME",  // A=LEVERAGE, B=FIXED, C=INCOME, D=FIXED
  "gold": 150|25|-0.15|-100,           // A=150, B=25, C=-0.15, D=-100
  "hp": -12|-3|8|-18,                  // A=-12, B=-3, C=8, D=-18
  "points": { "old":3 } | {} | { "wolf":3 } | { "red":15 },
  "insight": -10,                      // 只有C/D有
  "insightGain": 8|5|1                 // A=8(HOMELESS)或5(其他), B=1
}
```

#### D选项特有字段

```json
"D": {
  // ... 其他字段 ...
  
  "sanLock": 40,                    // 看到D选项所需的最低灵视（默认40）
  "isGlitched": true,               // 是否有视觉扭曲效果
  "glitchEffect": "chromatic_aberration",  // 效果类型
  "archiveId": "No.01_HOSTILE_ARCH"  // 解锁的档案ID（重要！）
}
```

**glitchEffect 可选值:**
- `chromatic_aberration` - 色差
- `scan_lines` - 扫描线
- `pixel_sort` - 像素排序
- `noise` - 噪点
- `vhs` - VHS效果

---

## 四、档案 ID 规范

### 命名格式

```
No.{序号}_{英文主题}

序号分配:
- No.01-60    HOMELESS 系列
- No.W01-W60  WORKER 系列
- No.M01-M60  MIDDLE 系列
- No.C01-C60  CAPITALIST 系列

示例:
- No.01_HOSTILE_ARCHITECTURE
- No.15_BLOOD_PLASMA_ECONOMY
- No.W23_FACTORY_DISEASE
- No.M12_HOA_TYRANNY
```

### 档案 JSON 结构

档案信息存储在单独的 JSON 中：

```json
// game/src/assets/data/archives/No.01_HOSTILE_ARCHITECTURE.json
{
  "id": "No.01_HOSTILE_ARCHITECTURE",
  "title": "敌意建筑",
  "flavorText": "城市的每一个角落都在对无家可归者说：'你不属于这里'。",
  "content": "敌意建筑（Hostile Architecture）是一种城市设计策略，通过长椅上的金属扶手、倾斜的椅面、间隔的凸起等设计，故意让公共空间无法被无家可归者用于休息或睡眠。这种设计将结构性暴力隐藏在日常景观之中，让'正常'市民可以在不感到不适的情况下完成对穷人的驱逐。",
  "image": "/assets/archives/hostile_architecture.png",
  "unlockedBy": "EVT_H01_BENCH_SLEEP",
  "category": "HOMELESS",
  "tags": ["城市设计", "空间政治", "无家可归"],
  "references": [
    {
      "title": "Hostile architecture: How cities are designed to target the homeless",
      "url": "https://www.bbc.com/news/uk-england-45861045"
    }
  ]
}
```

---

## 五、文案风格指南

### 5.1 文本写作原则

**好的 text:**
```
凌晨四点，你被冻醒。长椅的金属扶手结了层霜，你的手指已经失去知觉。对面写字楼的保安看了你一眼，没说什么——他已经习惯了你的存在。
```
✅ 具体时间（凌晨四点）  
✅ 感官细节（霜、失去知觉）  
✅ 人物互动（保安的眼神）  
✅ 暗示系统（"习惯了你的存在"）

**差的 text:**
```
你是一个无家可归者，在公园里睡觉。 capitalism 很坏，穷人没有地方住。你应该选择D选项来觉醒。
```
❌ 说教  
❌ 抽象概念  
❌ 直接告诉玩家该选什么

### 5.2 选项 label 对比

| 选项 | 差的示例 | 好的示例 |
|:---|:---|:---|
| A | "努力工作" | "相信明天会更好，努力就能改变" |
| B | "什么都不做" | "换个角落躲风，别被人看见" |
| C | "花钱解决" | "去便利店买杯热咖啡取暖" |
| D | "反对资本主义" | "⚠️ 意识到这张长椅是城市设计的一部分——它故意设计得让人无法舒适地躺下" |

### 5.3 roast（吐槽）风格

**原则：** 打破第四面墙，直接对玩家说话

```
✅ "明天会更糟，但你不知道。你已经被系统标记为'不合作者'。"
✅ "1.5美元换来半小时的温暖，然后回到原地。消费主义提供了完美的出口。"
✅ "hostility architecture。金属扶手、倾斜椅面——每一个细节都是为了驱赶你。"

❌ "这个选择不好。"
❌ " capitalism 害了你。"
```

### 5.4 archiveCommentary（档案评论）风格

**原则：** 冷静、学术、分析性，像维基百科+法兰克福学派

```
✅ "这种选择代表了系统最希望穷人持有的心态：自责、内卷、永不质疑结构。当你相信失败是个人原因时，你就不会质疑游戏规则本身。"

✅ "消费主义提供了一个完美的出口：把系统性问题转化为个人问题，然后用钱解决。咖啡的温暖是真实的，但问题的根源被掩盖了。"

❌ "你真傻，怎么能选这个？"
❌ " capitalism 太坏了！"
```

---

## 六、数值速查表

复制到每个事件的对应位置：

```json
"A": {
  "effects": {
    "scaling": "LEVERAGE",
    "gold": 150,
    "hp": -12,
    "points": { "old": 3 },
    "insightGain": 8  // HOMELESS用8，其他用5
  }
}

"B": {
  "effects": {
    "scaling": "FIXED",
    "gold": 25,
    "hp": -3,
    "points": {},
    "insightGain": 1
  }
}

"C": {
  "effects": {
    "scaling": "INCOME",
    "gold": -0.15,
    "hp": 8,
    "points": { "wolf": 3 },
    "insight": -10
  }
}

"D": {
  "effects": {
    "scaling": "FIXED",
    "gold": -100,
    "hp": -18,
    "points": { "red": 15 },
    "insight": -10
  },
  "sanLock": 40,
  "isGlitched": true,
  "glitchEffect": "chromatic_aberration",
  "archiveId": "No.xx_YYYY"
}
```

---

## 七、创建流程

1. **确定主题**：选择一个具体的、有画面感的场景
2. **研究现实**：查找相关的真实事件、统计数据、新闻报道
3. **撰写 text**：用感官细节构建场景
4. **设计四个选项**：
   - A：相信系统/个人奋斗
   - B：逃避/麻木/生存
   - C：消费/仪式/自我安慰
   - D：⚠️ 看到结构性暴力
5. **撰写 roast**：每个选项配一句犀利吐槽
6. **撰写 archiveCommentary**：社会学视角分析
7. **确定 archiveId**：格式 No.xx_英文名
8. **填写 metadata**：作者、日期、参考链接
9. **验证 JSON**：确保格式正确，无语法错误

---

## 八、示例事件（完整参考）

见文件：`examples/EVT_H01_BENCH_SLEEP.json`

---

## 九、常见错误

### ❌ 错误 1：数值不统一
```json
// 错误
"A": { "gold": 200, "hp": -8 }  // 应该是 150 和 -12
"D": { "gold": -50 }           // 应该是 -100
```

### ❌ 错误 2：忘记 archiveId
```json
// 错误
"D": {
  // ... 其他字段 ...
  // 缺少 archiveId！
}
```

### ❌ 错误 3：ID 格式错误
```json
// 错误
"id": "bench_sleep"           // 缺少 EVT_H01_ 前缀
"id": "EVT_H1_BENCH"          // 序号应该是两位 01

// 正确
"id": "EVT_H01_BENCH_SLEEP"
```

### ❌ 错误 4：文案说教
```json
// 错误
"text": "资本主义很坏，穷人很惨。你应该反对资本主义。"

// 正确
"text": "凌晨四点，你被冻醒。长椅的金属扶手结了层霜..."
```

### ❌ 错误 5：D选项没有 ⚠️
```json
// 错误
"label": "意识到长椅是故意设计的"

// 正确
"label": "⚠️ 意识到长椅是城市设计的一部分——它故意设计得让人无法舒适地躺下"
```

---

## 十、质量检查清单

提交前检查：

- [ ] JSON 格式正确（可用 jsonlint.com 验证）
- [ ] `id` 符合命名规范
- [ ] `category` 与所在文件夹一致
- [ ] `options.D` 有 `archiveId`
- [ ] `options.D.label` 以 `⚠️` 开头
- [ ] 四个选项的 `effects` 数值符合标准
- [ ] `historicalNote` 有现实依据
- [ ] 文案无说教，有画面感
- [ ] `roast` 犀利，打破第四面墙
- [ ] `archiveCommentary` 冷静分析

---

## 附录：参考资料

### 主题灵感来源

**HOMELESS:**
- 敌意建筑（Hostile Architecture）
- 卖血经济（Plasma Economy）
- 福利悬崖（Welfare Cliff）
- 刑事化无家可归（Criminalization of Homelessness）

**WORKER:**
- 工伤与职业病
- 零工经济（Gig Economy）
- 工会瓦解
- 996与过劳死

**MIDDLE:**
- HOA暴政
- 医疗债务
- 学区房与教育军备竞赛
- 401k陷阱

**CAPITALIST:**
- 离岸账户与避税
- 做空与做空攻击
- 政治献金与旋转门
- 寡头垄断

### 写作工具

- **场景构建**: 使用具体的时间、地点、感官细节
- **引用现实**: 添加 `historicalNote` 增强真实感
- **保持愤怒**: 但不要说教，让读者自己感受

---

**祝你创作愉快。记住：我们不是在写游戏，我们是在为真实的人记录真实的系统暴力。**
