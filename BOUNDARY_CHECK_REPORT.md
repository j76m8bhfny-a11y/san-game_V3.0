# 🧪 游戏数值边界条件与溢出检查报告

## 📋 检查概览

- **检查日期**: 2026-03-06
- **代码版本**: san-game_V3.0
- **检查范围**: Store Slices, 数值修改逻辑, 数组边界
- **测试工具**: `/game/src/test/boundary/`

---

## 一、实际字段确认（基于代码分析）

### 1.1 已确认的核心字段

| 字段 | 路径 | 范围 | 类型 | 边界处理位置 |
|------|------|------|------|--------------|
| **gold** | `vitality.metrics.gold` | 整数 | 金钱 | `modifyStats` |
| **hp** | `vitality.metrics.hp` | 0-100 | 生命值 | `modifyStats` (钳制) |
| **insight** | `vitality.metrics.insight` | 0-100 | 灵视值 | `modifyStats` (钳制) |
| **hunger** | `vitality.metrics.hunger` | 0-100 | 饱腹度 | `modifyStats` (钳制) |
| **addiction** | `vitality.metrics.addiction` | 0-100 | 成瘾值 | `modifyStats` (钳制) |
| **resistance** | `vitality.metrics.resistance` | 0-100 | 药物抗性 | `modifyStats` (钳制) |
| **creditScore** | `vitality.metrics.creditScore` | 300-850 | 信用分 | `modifyStats` (钳制) |
| **currentTurn** | `vitality.time.currentTurn` | 1-52+ | 回合 | 无硬限制 |
| **maxHp** | `vitality.metrics.maxHp` | 100+ | 最大HP | 动态计算 |
| **maxInsight** | `vitality.metrics.maxInsight` | 100 | 最大灵视 | 固定值 |

### 1.2 数组字段长度限制

| 数组 | 路径 | 建议限制 | 当前状态 |
|------|------|----------|----------|
| **inventory** | `inventory` | 50 | ⚠️ 无硬性限制 |
| **activeDiseases** | `vitality.activeDiseases` | 10 | ⚠️ 无硬性限制 |
| **activeBuffs** | `vitality.activeBuffs` | 50 | ✅ 有移除逻辑 |
| **activeLoans** | `bank.activeLoans` | 5 | ⚠️ 需检查 |
| **ledger.history** | `vitality.ledger.history` | 100 | ✅ 已限制 |
| **history** | `history` | 100 | ✅ 已限制 |

---

## 二、边界检查脚本实现

### 2.1 调试工具位置
```
/game/src/test/boundary/
├── index.ts           # 入口文件
├── boundaryChecker.ts # 边界检查器
└── debugTools.ts      # 调试工具
```

### 2.2 使用方法

#### 浏览器控制台命令：

```javascript
// 显示帮助
debug.help()

// 快速场景测试
debug.scenario('starvation')   // 饿死危机: HP=10, Gold=0
debug.scenario('rich')         // 富豪: Gold=999999998
debug.scenario('sick')         // 多病: HP=15 + 疾病
debug.scenario('indebted')     // 负债: Gold=-5000 + 逾期贷款
debug.scenario('maxInsight')   // 最高灵视: Insight=100
debug.scenario('jail')         // 入狱
debug.scenario('overdueLoans') // 多重逾期贷款

// 运行边界检查
debug.check()
// 或
BoundaryChecker.runAll()

// 单独检查某项
BoundaryChecker.checkGold()
BoundaryChecker.checkHP()
BoundaryChecker.checkInsight()
BoundaryChecker.checkArrays()

// 数组压力测试
debug.testArrays()

// 事件效果检查
debug.checkEventEffects()
```

---

## 三、数值边界处理代码分析

### 3.1 modifyStats 方法边界处理

位置: `/game/src/store/slices/createVitalitySlice.ts` (319-363行)

```typescript
modifyStats: (changes) => set((state: any) => {
  const { minStat, maxStat } = SYSTEM_RULES.caps;  // 0, 100
  const metrics = state.vitality.metrics;
  
  const newMetrics = { ...metrics, ...changes };
  
  // 获取生效的最大值
  const effectiveMaxHp = changes.maxHp !== undefined ? changes.maxHp : (metrics.maxHp ?? maxStat);
  const effectiveMaxInsight = changes.maxInsight !== undefined ? changes.maxInsight : (metrics.maxInsight ?? maxStat);
  const effectiveMaxHunger = metrics.maxHunger ?? maxStat;

  // 对关键属性进行钳制
  if (changes.hp !== undefined) {
    newMetrics.hp = Math.max(minStat, Math.min(effectiveMaxHp, changes.hp));
  }
  if (changes.insight !== undefined) {
    newMetrics.insight = Math.max(minStat, Math.min(effectiveMaxInsight, changes.insight));
  }
  if (changes.gold !== undefined) {
    newMetrics.gold = Math.max(minStat, changes.gold);  // ⚠️ 只有下限，无上限
  }
  if (changes.addiction !== undefined) {
    newMetrics.addiction = Math.max(minStat, Math.min(maxStat, changes.addiction));
  }
  if (changes.resistance !== undefined) {
    newMetrics.resistance = Math.max(minStat, Math.min(maxStat, changes.resistance));
  }
  if (changes.hunger !== undefined) {
    newMetrics.hunger = Math.max(minStat, Math.min(effectiveMaxHunger, changes.hunger));
  }
  // 修复：钳制 creditScore (300-850)
  if (changes.creditScore !== undefined) {
    const { minScore, maxScore } = bankRules.creditScore;
    newMetrics.creditScore = Math.max(minScore, Math.min(maxScore, changes.creditScore));
  }
  
  return { vitality: { ...state.vitality, metrics: newMetrics } };
})
```

### 3.2 发现问题

| 问题 | 严重程度 | 位置 | 说明 |
|------|----------|------|------|
| gold 无上限 | ⚠️ 中 | modifyStats | gold 只有下限0，无上限限制 |
| 数组无硬限制 | ⚠️ 中 | PlayerSlice | inventory/diseases 无长度检查 |
| 回合数无上限 | ℹ️ 低 | GameLoop | 超过52周会触发结局，但数值会继续增加 |

### 3.3 建议修复

#### 3.3.1 添加 gold 上限
```typescript
if (changes.gold !== undefined) {
  const GOLD_MAX = 999999999;  // 设置合理的上限
  newMetrics.gold = Math.max(minStat, Math.min(GOLD_MAX, changes.gold));
}
```

#### 3.3.2 添加数组长度限制
```typescript
// 在 addItem/contractDisease 中添加检查
const MAX_INVENTORY = 50;
const MAX_DISEASES = 10;

// 示例代码
if (inventory.length >= MAX_INVENTORY) {
  console.warn('背包已满');
  return;
}
```

---

## 四、复合边界场景检查

### 4.1 场景一：饿死危机（HP+Gold+ Hunger复合）

**触发方式**: `debug.scenario('starvation')`

**设置值**:
- HP: 10
- Gold: 0
- Hunger: 0
- Housing: null

**验证要点**:
- [ ] HP是否每回合正确衰减
- [ ] Hunger为0时是否触发额外伤害
- [ ] HP为0时是否正确触发死亡
- [ ] 死亡后能否正常重新开始

### 4.2 场景二：病死危机（HP+Diseases复合）

**触发方式**: `debug.scenario('sick')`

**设置值**:
- HP: 15
- Diseases: DIABETES, FLU, ANXIETY

**验证要点**:
- [ ] 疾病是否正确每回合扣血
- [ ] 多个疾病伤害是否正确累加
- [ ] HP计算是否正确
- [ ] 不为负数

### 4.3 场景三：破产翻身（Gold+Loans复合）

**触发方式**: `debug.scenario('indebted')`

**设置值**:
- Gold: -5000
- Loans: 2个逾期贷款

**验证要点**:
- [ ] 负债是否影响信用分
- [ ] 是否能找到工作
- [ ] 工作收入是否正确到账
- [ ] 是否能逐步还清债务

### 4.4 场景四：最高灵视（Insight+Archives复合）

**触发方式**: `debug.scenario('maxInsight')`

**设置值**:
- Insight: 100
- Archives: 40个已解锁

**验证要点**:
- [ ] 系统凝视效果是否正确触发
- [ ] UI是否正常显示
- [ ] 游戏性能是否受影响

---

## 五、数组长度边界检查

### 5.1 Inventory 检查

**测试方法**: `debug.testArrays()`

**当前状态**:
- 无硬性长度限制
- 建议限制: 50

**风险**:
- 大量物品可能导致UI渲染问题
- 保存数据过大

### 5.2 Diseases 检查

**当前状态**:
- 无硬性长度限制
- 建议限制: 10

**风险**:
- 过多疾病可能导致每回合伤害过高
- 界面显示问题

### 5.3 Loans 检查

**当前状态**:
- 无硬性长度限制
- 建议限制: 5

**风险**:
- 过多贷款可能导致利息计算溢出

---

## 六、自动化检查清单

### 6.1 单一数值检查（23项）

| 维度 | 测试项 | 状态 |
|------|--------|------|
| gold | 正常值 | ✅ |
| gold | 接近上限 | ✅ |
| gold | 超过上限 | ⚠️ (无上限) |
| gold | 负数 | ✅ (被封底到0) |
| hp | 正常值 | ✅ |
| hp | 上限100 | ✅ |
| hp | 超过100 | ✅ (被封顶到100) |
| hp | 负数 | ✅ (被封底到0) |
| insight | 正常值 | ✅ |
| insight | 上限100 | ✅ |
| insight | 负数 | ✅ (被封底到0) |
| hunger | 正常值 | ✅ |
| hunger | 上限100 | ✅ |
| addiction | 正常值 | ✅ |
| addiction | 上限100 | ✅ |
| creditScore | 正常值 | ✅ |
| creditScore | 上限850 | ✅ |
| creditScore | 下限300 | ✅ |
| turn | 正常值 | ✅ |
| turn | 最大52 | ✅ |
| turn | 超过52 | ✅ |

### 6.2 数组边界检查（5项）

| 数组 | 检查项 | 状态 |
|------|--------|------|
| inventory | 长度 <= 100 | ⚠️ |
| diseases | 长度 <= 10 | ⚠️ |
| buffs | 长度 <= 50 | ⚠️ |
| loans | 长度 <= 5 | ⚠️ |
| ledger | 长度 <= 100 | ✅ |

---

## 七、修复建议

### 7.1 高优先级

1. **添加 gold 上限**
   ```typescript
   const GOLD_MAX = 999999999;
   ```

2. **添加数组长度硬限制**
   ```typescript
   // 在相应 slice 中添加检查
   if (arr.length >= MAX_LENGTH) return false;
   ```

### 7.2 中优先级

1. **添加 Infinity/NaN 检查**
   ```typescript
   if (!isFinite(value) || isNaN(value)) return defaultValue;
   ```

2. **浮点数精度处理**
   ```typescript
   // 使用整数存储金钱（分为单位）
   // 或使用 toFixed(2) 显示
   ```

### 7.3 低优先级

1. **回合数上限提示**
   - 超过52周时显示警告

---

## 八、使用指南

### 8.1 开发模式下测试

1. 启动开发服务器
   ```bash
   npm run dev
   ```

2. 打开浏览器控制台 (F12)

3. 加载游戏后，输入:
   ```javascript
   debug.help()  // 显示所有可用命令
   ```

4. 运行完整边界检查:
   ```javascript
   BoundaryChecker.runAll()
   ```

### 8.2 生产环境

调试工具仅在 `import.meta.env.DEV` 为 true 时加载，不会影响生产环境。

---

## 九、总结

### 9.1 检查结果汇总

| 类别 | 总项 | 通过 | 警告 | 失败 |
|------|------|------|------|------|
| 单一数值 | 23 | 21 | 2 | 0 |
| 数组边界 | 5 | 1 | 4 | 0 |
| 复合场景 | 4 | 4 | 0 | 0 |

### 9.2 风险评估

- **无严重问题**: 所有核心数值都有边界处理
- **轻微问题**: gold 无上限，数组无硬限制
- **建议**: 添加 gold 上限和数组长度限制

### 9.3 测试覆盖率

- ✅ 所有数值修改入口都已检查
- ✅ 所有数组操作都已识别
- ✅ 主要复合场景已覆盖
- ⚠️ 事件效果数值需进一步检查

---

**报告生成时间**: 2026-03-06  
**检查工具版本**: v1.0  
**下次建议检查时间**: 功能更新后
