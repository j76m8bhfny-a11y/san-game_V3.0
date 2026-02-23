# Endings.json 结构规范

> 结局系统数据文件格式说明 - 用于定义游戏的所有结局

## 文件位置
```
game/src/assets/data/endings.json
```

## 根结构

| 字段 | 类型 | 说明 |
|-----|------|------|
| 根 | `Ending[]` | 结局数组，包含所有结局定义 |

---

## Ending 对象结构

```json
{
  "id": "ED-XX",           // 结局唯一标识
  "title": "结局标题",      // 显示给玩家的标题
  "description": "描述文本", // 结局的叙事文本
  "priority": 5,           // 优先级（1-5，数字越大越优先）
  "type": "DEATH",         // 结局类型
  "conditions": {          // 触发条件（可选）
    // 条件字段见下方
  }
}
```

### 字段详解

| 字段 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `id` | `string` | ✅ | 结局唯一标识，格式 `ED-` + 两位数字 |
| `title` | `string` | ✅ | 结局标题，支持中文 |
| `description` | `string` | ✅ | 结局描述文本，支持多行 |
| `priority` | `number` | ✅ | 优先级 1-5，高优先级结局优先判定 |
| `type` | `EndingType` | ✅ | 结局类型：`DEATH`/`SURVIVAL`/`ALIENATION`/`STANCE`/`UR` |
| `conditions` | `object` | ❌ | 触发条件，不填则无条件（但受类型限制） |

---

## 优先级系统 (Priority)

**重要**：优先级数字越大，越优先被判定

| 优先级 | 用途 | 典型结局 |
|-------|------|---------|
| `5` | UR/真结局 | ED-22 觉醒者、ED-17 润 |
| `4` | STANCE 立场觉醒 | ED-13 赤色幽灵、ED-14 华尔街之狼 |
| `3` | ALIENATION 异化 | ED-10 阿卡姆病栋、ED-21 蒙昧的幸福 |
| `2` | SURVIVAL 阶级苟活 | ED-06 月光电池、ED-08 中产噩梦 |
| `1` | DEATH 死亡保底 | ED-01 冷冻披萨、ED-02 止痛药幻境 |

**判定流程**：
1. 达到 52 周时，系统按 priority 降序遍历
2. 第一个匹配条件的结局被触发
3. DEATH 类型结局仅在 HP≤0 时触发

---

## 结局类型 (Type)

| 类型 | 含义 | UI 效果 |
|-----|------|--------|
| `DEATH` | 死亡结局 | 红色故障效果 |
| `SURVIVAL` | 阶级苟活 | 默认白色 |
| `ALIENATION` | 精神异化 | 灰色风格 |
| `STANCE` | 立场觉醒 | 青色发光效果 |
| `UR` | 超稀有/隐藏 | 青色发光效果 |

**UI 分类**：
- `goodTypes`: `["UR", "STANCE"]` - 视为"好结局"
- `death`: `"DEATH"` - 死亡结局分类

---

## 条件字段 (Conditions)

所有条件都是**可选**的，只有定义了才会检查

### 基础属性条件

| 字段 | 类型 | 说明 | 示例 |
|-----|------|------|------|
| `minTurn` | `number` | 最小回合数 | `40` - 至少存活40周 |
| `maxTurn` | `number` | 最大回合数 | `20` - 必须在20周前 |
| `maxHp` | `number` | 最大生命值 | `10` - 濒死状态 |
| `minInsight` | `number` | 最小灵视值 | `85` - 高觉醒度 |
| `maxInsight` | `number` | 最大灵视值 | `10` - 从未觉醒 |
| `minGold` | `number` | 最小金钱 | `500000` - 富有 |
| `maxGold` | `number` | 最大金钱（负债） | `-5000` - 严重负债 |

### 阶级与阵营条件

| 字段 | 类型 | 说明 | 示例 |
|-----|------|------|------|
| `requiredClass` | `string` | 要求阶级 | `"WORKER"`、`"HOMELESS"`、`"MIDDLE"`、`"CAPITALIST"` |
| `requiredPoints` | `object` | 阵营点数 | `{ "red": 100, "wolf": 50, "old": 0 }` |

### 物品与档案条件

| 字段 | 类型 | 说明 | 示例 |
|-----|------|------|------|
| `hasItem` | `string` | 持有道具ID | `"SURVIVAL_KIT"`、`"FAKE_PASSPORT"` |
| `hasArchive` | `string` | 档案条件 | `"ARCHIVE_COUNT_35"` 或单个档案 `"ARCH_001"` |
| `requiredFlags` | `string[]` | 状态标志 | `["FLAG_PRISON_ESCAPE"]` |

---

## 特殊条件格式

### 档案计数（跨局累计）
```json
{
  "conditions": {
    "hasArchive": "ARCHIVE_COUNT_35"
  }
}
```
- 格式：`ARCHIVE_COUNT_` + 数字
- 检查玩家**跨局累计**解锁的档案总数
- 用于真结局 ED-22

### 单个档案检查
```json
{
  "conditions": {
    "hasArchive": "ARCHIVE_SECRET_001"
  }
}
```
- 检查是否解锁特定档案

### 阵营点数
```json
{
  "conditions": {
    "requiredPoints": {
      "red": 100,    // 红色倾向（革命/左派）
      "wolf": 50,    // 狼性倾向（资本/个人主义）
      "old": 0       // 老派倾向（保守/传统）
    }
  }
}
```

---

## 完整示例

### 示例 1：死亡结局（无条件）
```json
{
  "id": "ED-01",
  "title": "冷冻披萨的温度",
  "description": "验尸官说你是低体温症，但其实你只是因为付不起暖气费...",
  "priority": 1,
  "type": "DEATH"
}
```

### 示例 2：阶级苟活结局
```json
{
  "id": "ED-06",
  "title": "月光电池",
  "description": "你没死，也没富。你每天睁眼就欠银行钱...",
  "priority": 2,
  "type": "SURVIVAL",
  "conditions": {
    "requiredClass": "WORKER"
  }
}
```

### 示例 3：高灵视异化结局
```json
{
  "id": "ED-10",
  "title": "阿卡姆病栋",
  "description": "你看透了一切，但无力改变...",
  "priority": 3,
  "type": "ALIENATION",
  "conditions": {
    "minInsight": 95
  }
}
```

### 示例 4：阵营立场结局
```json
{
  "id": "ED-13",
  "title": "赤色幽灵",
  "description": "你不再是一个人。你在铁锈带搞起了罢工...",
  "priority": 4,
  "type": "STANCE",
  "conditions": {
    "requiredPoints": { "red": 100 },
    "requiredClass": "WORKER"
  }
}
```

### 示例 5：真结局 ED-22（跨局累计）
```json
{
  "id": "ED-22",
  "title": "觉醒者：系统重置",
  "description": "你带着上百次轮回的记忆，掌握了这个吃人系统所有的运行代码...",
  "priority": 5,
  "type": "STANCE",
  "conditions": {
    "minInsight": 100,
    "requiredPoints": { "red": 50 },
    "hasArchive": "ARCHIVE_COUNT_35"
  }
}
```

### 示例 6：UR 隐藏结局
```json
{
  "id": "ED-19",
  "title": "第四面墙",
  "description": "你突然抬头看向屏幕外：喂，玩游戏那个...",
  "priority": 5,
  "type": "UR",
  "conditions": {
    "minTurn": 10,
    "maxTurn": 20,
    "maxHp": 10,
    "minInsight": 90
  }
}
```

---

## ID 分配建议

| ID 范围 | 用途 |
|--------|------|
| `ED-01` ~ `ED-09` | 基础结局（已占用） |
| `ED-10` ~ `ED-19` | ALIENATION 结局（部分已占用） |
| `ED-20` ~ `ED-29` | UR/STANCE 结局（部分已占用） |
| `ED-30` ~ `ED-50` | 预留：新增结局 |

现有结局 ID：
- `ED-01~05`: DEATH
- `ED-06~09`: SURVIVAL
- `ED-10~12, 21`: ALIENATION
- `ED-13~16`: STANCE
- `ED-17~20`: UR
- `ED-22`: 真结局（STANCE）

---

## 验证清单

添加新结局后，请检查：

- [ ] `id` 格式正确（`ED-` + 两位数字）
- [ ] `priority` 在 1-5 范围内
- [ ] `type` 是有效的枚举值
- [ ] `conditions` 中的字段名正确（区分大小写）
- [ ] 道具 ID 在 `items.json` 中存在
- [ ] 档案条件格式正确（`ARCHIVE_COUNT_XX` 或具体 ID）
- [ ] 无 JSON 语法错误（可使用在线 JSON 验证器）
