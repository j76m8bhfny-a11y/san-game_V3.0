# 事件批量生成模板

> 用 Excel/Google Sheets 填写后，导出为 CSV 使用

---

## 使用说明

1. **复制表格**到 Excel 或 Google Sheets
2. **逐行填写**事件内容（黄色列必填）
3. **数值列**（绿色）可直接复制，无需修改
4. **导出为 CSV**（UTF-8 编码）
5. **使用转换脚本**生成 JSON

---

## 表格结构

### 基础信息列（黄色 = 必填）

| 列名 | 说明 | 示例 |
|:---|:---|:---|
| `id` | 事件ID | EVT_H01_BENCH_SLEEP |
| `category` | 分类 | HOMELESS/WORKER/MIDDLE/CAPITALIST/COMMON |
| `series` | 系列主题 | 基础生存/医疗系统/阶级跨越 |
| `title` | 标题 | 睡长椅的一夜 |
| `text` | 事件描述 | 凌晨四点，你被冻醒... |
| `historicalNote` | 现实背景 | 基于敌意建筑设计... |
| `background` | 背景图 | bg_park_night |
| `foreground` | 前景图 | evt_bench_sleep |

### A选项列（信念/鸡汤）

| 列名 | 字数 | 示例 |
|:---|:---:|:---|
| `A_label` | 10-20 | 相信明天会更好，努力就能改变 |
| `A_roast` | 20-40 | 明天会更糟，但你不知道... |
| `A_flavorText` | 30-60 | 你告诉自己要坚持... |
| `A_ideology` | - | 新自由主义/奋斗逼 |
| `A_archiveCommentary` | 50-100 | 这种选择代表了系统最希望... |

### B选项列（安全/麻木）

| 列名 | 字数 | 示例 |
|:---|:---:|:---|
| `B_label` | 10-20 | 换个角落躲风，别被人看见 |
| `B_roast` | 20-40 | 你学会了隐形，这是流浪者的... |
| `B_flavorText` | 30-60 | 你选择了最安全的路径... |
| `B_ideology` | - | 犬儒主义/摆烂 |
| `B_archiveCommentary` | 50-100 | 在一个无法胜利的系统中... |

### C选项列（消费/逃避）

| 列名 | 字数 | 示例 |
|:---|:---:|:---|
| `C_label` | 10-20 | 去便利店买杯热咖啡取暖 |
| `C_roast` | 20-40 | 1.5美元换来半小时的温暖... |
| `C_flavorText` | 30-60 | 你决定花钱解决这个让你... |
| `C_ideology` | - | 消费主义/岁静 |
| `C_archiveCommentary` | 50-100 | 消费主义提供了一个完美的... |

### D选项列（觉醒/真相）

| 列名 | 字数 | 示例 |
|:---|:---:|:---|
| `D_label` | 15-25 | ⚠️ 意识到这张长椅是城市设计的一部分... |
| `D_roast` | 20-40 | hostility architecture。金属扶手... |
| `D_flavorText` | 30-60 | 你看到了表象之下的真相... |
| `D_ideology` | - | 激进左翼/觉醒 |
| `D_archiveCommentary` | 50-100 | 真相的代价总是高昂的... |

### 档案与元数据列

| 列名 | 说明 | 示例 |
|:---|:---|:---|
| `archiveId` | 档案ID | No.01_HOSTILE_ARCHITECTURE |
| `sanLock` | 看到D所需灵视 | 40（默认）|
| `glitchEffect` | 视觉效果 | chromatic_aberration |
| `author` | 作者名 | 你的笔名 |
| `references` | 参考链接 | https://... |

---

## 填写示例

### 完整一行示例

| 字段 | 内容 |
|:---|:---|
| **id** | EVT_H01_BENCH_SLEEP |
| **category** | HOMELESS |
| **series** | 基础生存 |
| **title** | 睡长椅的一夜 |
| **text** | 凌晨四点，你被冻醒。长椅的金属扶手结了层霜，你的手指已经失去知觉。对面写字楼的保安看了你一眼，没说什么——他已经习惯了你的存在。 |
| **historicalNote** | 基于美国城市'敌意建筑'（Hostile Architecture）设计。长椅被故意设计得让人无法躺下，以驱赶无家可归者。 |
| **background** | bg_park_night |
| **foreground** | evt_bench_sleep |
| **A_label** | 相信明天会更好，努力就能改变 |
| **A_roast** | 明天会更糟，但你不知道。你已经被系统标记为'不合作者'。 |
| **A_flavorText** | 你告诉自己要坚持，要相信努力就能改变命运。这种信念让你在寒风中多撑了一会儿。 |
| **A_ideology** | 新自由主义/奋斗逼 |
| **A_archiveCommentary** | 这种选择代表了系统最希望穷人持有的心态：自责、内卷、永不质疑结构。当你相信失败是个人原因时，你就不会质疑游戏规则本身。 |
| **B_label** | 换个角落躲风，别被人看见 |
| **B_roast** | 你学会了隐形，这是流浪者的生存第一课。 |
| **B_flavorText** | 你选择了最安全、最不需要思考的路径。麻木不是愚蠢，而是生存策略。 |
| **B_ideology** | 犬儒主义/摆烂 |
| **B_archiveCommentary** | 在一个无法胜利的系统中，不抱希望就不会失望。这种'低姿态生存'是高剥夺环境下的理性适应。 |
| **C_label** | 去便利店买杯热咖啡取暖 |
| **C_roast** | 1.5美元换来半小时的温暖，然后回到原地。消费主义提供了完美的出口。 |
| **C_flavorText** | 你决定花钱解决这个让你不安的问题。消费行为让你短暂地感觉自己像个'正常人'。 |
| **C_ideology** | 消费主义/岁静 |
| **C_archiveCommentary** | 消费主义提供了一个完美的出口：把系统性问题转化为个人问题，然后用钱解决。咖啡的温暖是真实的，但问题的根源被掩盖了。 |
| **D_label** | ⚠️ 意识到这张长椅是城市设计的一部分——它故意设计得让人无法舒适地躺下 |
| **D_roast** | hostility architecture（敌意建筑）。金属扶手、倾斜椅面、间隔凸起——每一个细节都是为了驱赶你。 |
| **D_flavorText** | 你看到了表象之下的真相：这不是疏忽，而是设计。城市的每一个角落都在对你说'你不属于这里'。 |
| **D_ideology** | 激进左翼/觉醒 |
| **D_archiveCommentary** | 真相的代价总是高昂的，但沉默的代价更高。当你看到结构性暴力时，你就再也无法假装这只是个人失败。 |
| **archiveId** | No.01_HOSTILE_ARCHITECTURE |
| **sanLock** | 40 |
| **glitchEffect** | chromatic_aberration |
| **author** | 你的笔名 |
| **references** | https://en.wikipedia.org/wiki/Hostile_architecture |

---

## 可用的背景图列表

### 场景背景 (bg_*.png)

| 文件名 | 场景描述 |
|:---|:---|
| bg_park_night | 公园夜晚 |
| bg_park_day | 公园白天 |
| bg_welfare_office | 福利署 |
| bg_factory_floor | 工厂车间 |
| bg_factory_locker | 工厂更衣室 |
| bg_suburban_home | 郊区住宅 |
| bg_suburban_street | 郊区街道 |
| bg_downtown_office | 金融区写字楼 |
| bg_downtown_night | 金融区夜晚 |
| bg_emergency_room | 急诊室 |
| bg_hospital_corridor | 医院走廊 |
| bg_alley_night | 后巷夜晚 |
| bg_alley_day | 后巷白天 |
| bg_convenience_store | 便利店 |
| bg_fast_food | 快餐店 |
| bg_courtroom | 法庭 |
| bg_prison_cell | 监狱牢房 |
| bg_shelter | 收容所 |
| bg_church | 教堂 |
| bg_bank | 银行 |
| bg_crypto_exchange | 加密货币交易所 |

---

## 可用的 glitchEffect

| 效果名 | 描述 |
|:---|:---|
| chromatic_aberration | 色差（推荐默认）|
| scan_lines | 扫描线 |
| pixel_sort | 像素排序 |
| noise | 噪点 |
| vhs | VHS录像带效果 |
| glitch | 通用故障效果 |

---

## 意识形态标签速查

### A选项标签
- 新自由主义/奋斗逼
- 美国梦/个人奋斗
- 成功学/自我提升
- 技术乌托邦/创新崇拜

### B选项标签
- 犬儒主义/摆烂
- 实用主义/生存优先
- 虚无主义/无意义
- 斯多葛主义/接受命运

### C选项标签
- 消费主义/岁静
- 舒适区/小确幸
- 身份政治/符号消费
- 心理治疗/自我关怀

### D选项标签
- 激进左翼/觉醒
- 马克思主义/阶级斗争
- 无政府主义/反体制
- Accelerationism/加速主义

---

## CSV → JSON 转换脚本

使用以下脚本将 CSV 转换为游戏可用的 JSON：

```bash
# 在 game 目录下运行
node scripts/convertEvents.js EVENT_BATCH_TEMPLATE.csv
```

脚本会自动：
1. 读取 CSV 文件
2. 生成标准 JSON 格式
3. 保存到对应的 events/{category}/ 文件夹
4. 验证 JSON 格式正确性

---

## 批量生产建议

### 1. 主题分组法
不要随机想事件，按主题批量生产：

```
第1批：医疗系统（5个事件）
- 急诊室等待
- 保险拒赔
- 药物依赖
- 医疗债务
- 预防性放弃治疗

第2批：住房危机（5个事件）
- 房租上涨
- 驱逐通知
- HOA罚款
- 房贷陷阱
-  Airbnb驱逐
```

### 2. 参考现实事件
每个事件基于真实新闻：
- 搜索 "homeless hostile architecture news"
- 搜索 "medical debt bankruptcy US"
- 搜索 "Amazon warehouse injury"

### 3. 保持连贯性
同系列事件有内在联系：
- 角色可以重复出现（那个保安、那个社工）
- 地点可以串联（公园→收容所→医院）
- 后果可以累积（第一次选A，第二次事件会有不同文本）

---

## 质量检查

填写完每行后，检查：

- [ ] id 格式正确 (EVT_H01_xxx)
- [ ] title 8-15字，有文学感
- [ ] text 有具体时间和感官细节
- [ ] D_label 以 ⚠️ 开头
- [ ] archiveId 格式正确 (No.xx_xxx)
- [ ] 四个选项的意识形态标签不重复
- [ ] roast 犀利，不说教
- [ ] archiveCommentary 冷静分析

---

**祝你批量生产愉快！**
