# 模型→代码映射文档

> 展示如何将抽象数学模型翻译为TypeScript实现
> 版本：v2.0（基于修正后模型）

---

## 一、映射总览

```
数学模型                    代码文件                          函数
─────────────────────────────────────────────────────────────────────────
Dimension聚合公式    →    survivalCalculator.ts    →    calculateDimension()
Sigmoid映射 S        →    survivalCalculator.ts    →    calculateSurvivalRate()
Vitality Decay       →    (待实现)                 →    calculateVitalityDecay()
ClassResistance      →    (待实现)                 →    applyClassResistance()
StatusEffect Buff    →    characterSlice.ts        →    activeBuffs 系统
复合风险惩罚         →    survivalCalculator.ts    →    (已在calculateSurvivalRate中)
```

---

## 二、逐层映射详解

### 2.1 维度聚合公式 → calculateDimension()

**数学公式**：
$$D = 0.7 \times \frac{\sum_{i}(source_{i} \times weight_{i})}{\sum weight_{i}} + 0.3 \times C_{D} + \delta_{homeless}$$

**代码实现**：
```typescript
// survivalCalculator.ts
function calculateDimension(
  state: StoreState,
  character: Character,
  dimensionId: string,
  config: SurvivalConfig
): number {
  const dimensionConfig = config.dimensions[dimensionId];
  
  // 1. 计算来源加权平均 (0.7部分)
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const source of dimensionConfig.sources) {
    const value = getSourceValue(state, character, source.type, source.attribute);
    weightedSum += value * source.weight;
    totalWeight += source.weight;
  }
  
  const normalizedScore = weightedSum / totalWeight;
  
  // 2. 加入阶级基础分 (0.3部分)
  const classBaseScore = config.calculation.classBaseScores[character.class];
  const dimensionIndex = ['physicalDefense', 'mentalStability', 
                         'nutritionSupply', 'medicalSupport', 
                         'economicSecurity'].indexOf(dimensionId);
  const classComponent = classBaseScore[dimensionIndex];
  
  // 3. 应用无家可归惩罚
  const homelessPenalty = config.calculation.homelessPenalty[dimensionId] || 0;
  const hasHome = character.ownedHousing.length > 0;
  const homelessAdjustment = hasHome ? 0 : homelessPenalty;
  
  // 4. 组合计算
  const finalScore = normalizedScore * 0.7 + classComponent * 0.3 + homelessAdjustment;
  
  return Math.max(0, Math.min(100, finalScore));
}
```

---

### 2.2 Sigmoid映射 → calculateSurvivalRate()

**数学公式**：
$$S = \frac{1}{1 + e^{-k(\sum w_{dim} \cdot dim - x_0)}}$$

**代码实现**：
```typescript
// survivalCalculator.ts
function calculateSurvivalRate(
  dimensions: SurvivalDimensions,
  config: SurvivalConfig
): number {
  const { steepness, midpoint } = config.calculation.sigmoid;
  const weights = config.calculation.dimensionWeights;
  
  // 1. 加权求和
  const weightedSum = 
    dimensions.physicalDefense * weights.physicalDefense +
    dimensions.mentalStability * weights.mentalStability +
    dimensions.nutritionSupply * weights.nutritionSupply +
    dimensions.medicalSupport * weights.medicalSupport +
    dimensions.economicSecurity * weights.economicSecurity;
  
  // 2. Sigmoid映射
  const exponent = -steepness * (weightedSum - midpoint);
  const survivalRate = 1 / (1 + Math.exp(exponent));
  
  // 3. 疾病惩罚（含ClassResistance修正）
  const diseasePenalty = calculateDiseasePenalty(character, config);
  const finalRate = Math.max(0, survivalRate - diseasePenalty);
  
  return finalRate;
}

// 辅助函数：计算疾病惩罚
function calculateDiseasePenalty(
  character: Character,
  config: SurvivalConfig
): number {
  const diseaseConfig = config.calculation.diseasePenalty;
  const classResistance = config.calculation.classResistance[character.class];
  
  // 统计疾病
  const diseases = character.diseases || [];
  const regularDiseases = diseases.filter((d: Disease) => d.type === 'CHRONIC').length;
  const acuteDiseases = diseases.filter((d: Disease) => d.type === 'ACUTE').length;
  const addictionPoints = diseases
    .filter((d: Disease) => d.type === 'MENTAL')
    .reduce((sum: number, d: Disease) => sum + (d.severity || 1), 0);
  
  // 基础惩罚（已含ClassResistance）
  const basePenalty = 
    regularDiseases * diseaseConfig.perDisease +
    acuteDiseases * diseaseConfig.perAcuteDisease +
    addictionPoints * diseaseConfig.addictionMultiplier;
  
  // 应用阶级抗性：惩罚 = 基础惩罚 / 抗性
  return basePenalty / classResistance;
}
```

---

### 2.3 Vitality Decay Rate → 新函数（待实现）

**数学公式**：
$$\Delta HP_{turn} = f(S), \quad \Delta SAN_{turn} = g(S)$$

**代码实现**：
```typescript
// survivalCalculator.ts（新增函数）
export interface VitalityDecay {
  hpDecay: number;
  sanDecay: number;
  level: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'DANGER' | 'CRITICAL';
}

export function calculateVitalityDecay(
  survivalRate: number,
  config: SurvivalConfig
): VitalityDecay {
  const decayConfig = config.calculation.vitalityDecay;
  const thresholds = decayConfig.thresholds; // [0.2, 0.4, 0.6, 0.8]
  
  // 确定等级
  let levelIndex: number;
  if (survivalRate >= thresholds[3]) levelIndex = 4;      // EXCELLENT
  else if (survivalRate >= thresholds[2]) levelIndex = 3; // GOOD
  else if (survivalRate >= thresholds[1]) levelIndex = 2; // WARNING
  else if (survivalRate >= thresholds[0]) levelIndex = 1; // DANGER
  else levelIndex = 0;                                     // CRITICAL
  
  const levels = ['CRITICAL', 'DANGER', 'WARNING', 'GOOD', 'EXCELLENT'];
  
  return {
    hpDecay: decayConfig.hpDecay[levelIndex],
    sanDecay: decayConfig.sanDecay[levelIndex],
    level: levels[levelIndex] as VitalityDecay['level']
  };
}

// 使用示例（在advanceTurn中调用）
function advanceTurn() {
  const state = useGameStore.getState();
  const character = state.getActiveCharacter();
  
  // 计算生存率
  const survivalRate = calculateSurvivalRate(state, character);
  
  // 计算Decay
  const decay = calculateVitalityDecay(survivalRate, state.gameDataCache);
  
  // 应用变化
  state.updateCharacter({
    hp: Math.max(0, Math.min(100, character.hp + decay.hpDecay)),
    san: Math.max(0, Math.min(100, character.san + decay.sanDecay))
  });
  
  // 检查死亡
  if (character.hp <= 0) {
    state.triggerEnding('DEATH');
  }
  if (character.san <= 0) {
    state.triggerEnding('MADNESS');
  }
}
```

---

### 2.4 StatusEffect Buff → activeBuffs系统

**数学概念**：替代$E_{history}$的指数衰减

**JSON配置（StatusEffect定义）**：
```typescript
// 新增文件：survival_buffs.json
{
  "buffs": {
    "shock_homelessness": {
      "name": "居无定所",
      "description": "露宿街头带来的心理压力",
      "duration": 3,
      "effects": {
        "perTurn": { "san": -2 },
        "onExpire": { "san": 5 }
      },
      "stackable": false,
      "icon": "buff_homeless"
    },
    "shock_fired": {
      "name": "失业打击",
      "description": "失去工作的焦虑",
      "duration": 5,
      "effects": {
        "perTurn": { "san": -1, "hp": -1 },
        "onExpire": { "san": 3 }
      },
      "stackable": true,
      "maxStacks": 3
    }
  }
}
```

**代码集成（characterSlice.ts）**：
```typescript
// characterSlice.ts
interface StatusEffect {
  id: string;
  name: string;
  duration: number;      // 剩余回合数
  maxDuration: number;   // 总回合数
  effects: {
    perTurn?: { hp?: number; san?: number; gold?: number };
    onExpire?: { hp?: number; san?: number; gold?: number };
  };
  source: string;        // 触发来源（事件ID）
}

interface CharacterSlice {
  // ... 现有属性
  activeBuffs: StatusEffect[];
  
  // 新增方法
  addStatusEffect: (effect: StatusEffect) => void;
  removeStatusEffect: (effectId: string) => void;
  processBuffs: () => void;  // 每回合调用
}

// 处理Buffs的reducer
processBuffs: () => set((state) => {
  const character = state.activeCharacter;
  if (!character) return;
  
  let hpChange = 0;
  let sanChange = 0;
  const remainingBuffs: StatusEffect[] = [];
  
  for (const buff of character.activeBuffs || []) {
    // 应用每回合效果
    if (buff.effects.perTurn) {
      hpChange += buff.effects.perTurn.hp || 0;
      sanChange += buff.effects.perTurn.san || 0;
    }
    
    // 减少持续时间
    buff.duration -= 1;
    
    if (buff.duration > 0) {
      // Buff继续
      remainingBuffs.push(buff);
    } else {
      // Buff过期，应用结束效果
      if (buff.effects.onExpire) {
        hpChange += buff.effects.onExpire.hp || 0;
        sanChange += buff.effects.onExpire.san || 0;
      }
    }
  }
  
  // 更新角色状态
  state.updateCharacter({
    hp: Math.max(0, Math.min(100, character.hp + hpChange)),
    san: Math.max(0, Math.min(100, character.san + sanChange)),
    activeBuffs: remainingBuffs
  });
})
```

**事件触发Buff示例**：
```typescript
// eventsSlice.ts
onEventTrigger: (eventId: string) => {
  const event = getEventById(eventId);
  
  // 触发原有逻辑
  // ...
  
  // 新增：附加StatusEffect
  if (event.statusEffectId) {
    const buffConfig = getBuffConfig(event.statusEffectId);
    get().addStatusEffect({
      id: `${event.statusEffectId}_${Date.now()}`,
      name: buffConfig.name,
      duration: buffConfig.duration,
      maxDuration: buffConfig.duration,
      effects: buffConfig.effects,
      source: eventId
    });
  }
}
```

---

### 2.5 复合风险 → 惩罚叠加

**数学公式**：
$$R_{compound} = 1 - \prod_{risk}(1 - penalty_{base}/ClassResistance)$$

**代码实现**：
```typescript
// survivalCalculator.ts
function calculateCompoundPenalty(
  penalties: number[],
  characterClass: CharacterClass,
  config: SurvivalConfig
): number {
  const classResistance = config.calculation.classResistance[characterClass];
  
  // 每个惩罚都除以classResistance
  const adjustedPenalties = penalties.map(p => p / classResistance);
  
  // 乘法叠加: 1 - (1-p1)(1-p2)(1-p3)...
  const survivalProduct = adjustedPenalties.reduce(
    (product, penalty) => product * (1 - penalty),
    1
  );
  
  return 1 - survivalProduct;
}

// 使用示例
const penalties = [
  0.10, // 生病惩罚10%
  0.05, // 饥饿惩罚5%
  0.15  // 失业惩罚15%
];

const compoundPenalty = calculateCompoundPenalty(
  penalties,
  'HOMELESS',
  config
);
// HOMELESS: compoundPenalty ≈ 51.7%
// CAPITALIST: compoundPenalty ≈ 14.2%
```

---

## 三、完整调用链

```typescript
// advanceTurn.ts（回合推进主逻辑）
export function advanceTurn() {
  const state = useGameStore.getState();
  const character = state.getActiveCharacter();
  
  // 步骤1: 计算五维分数
  const dimensions = {
    physicalDefense: calculateDimension(state, character, 'physicalDefense', config),
    mentalStability: calculateDimension(state, character, 'mentalStability', config),
    nutritionSupply: calculateDimension(state, character, 'nutritionSupply', config),
    medicalSupport: calculateDimension(state, character, 'medicalSupport', config),
    economicSecurity: calculateDimension(state, character, 'economicSecurity', config)
  };
  
  // 步骤2: 计算生存率 S
  const survivalRate = calculateSurvivalRate(dimensions, character, config);
  
  // 步骤3: 计算Vitality Decay
  const decay = calculateVitalityDecay(survivalRate, config);
  
  // 步骤4: 应用Decay到HP/SAN
  let newHp = character.hp + decay.hpDecay;
  let newSan = character.san + decay.sanDecay;
  
  // 步骤5: 处理StatusEffect Buffs
  state.processBuffs();
  
  // 步骤6: 更新角色状态
  state.updateCharacter({ hp: newHp, san: newSan });
  
  // 步骤7: 死亡判定
  if (newHp <= 0) {
    state.triggerEnding('DEATH', `在${decay.level}状态下生命耗尽`);
  }
  if (newSan <= 0) {
    state.triggerEnding('MADNESS', `精神崩溃于${decay.level}环境`);
  }
}
```

---

## 四、配置→代码的数据流

```
survival_dimensions_simple.json
        │
        ├── dimensions.*
        │       └── calculateDimension() 中的来源定义
        │
        ├── calculation.sigmoid
        │       └── calculateSurvivalRate() 中的 sigmoid 参数
        │
        ├── calculation.vitalityDecay ★新增
        │       └── calculateVitalityDecay() 中的 decay 表
        │
        ├── calculation.classResistance ★新增
        │       └── calculateDiseasePenalty() 中的抗性系数
        │
        ├── calculation.diseasePenalty
        │       └── 疾病惩罚计算
        │
        └── calculation.homelessPenalty
                └── calculateDimension() 中的无家可归修正

survival_buffs.json ★新增
        │
        └── buffs.*
                └── processBuffs() 中的 StatusEffect 定义
```

---

## 五、关键文件清单

| 文件路径 | 用途 | 状态 |
|---------|------|------|
| `survivalCalculator.ts` | 核心计算逻辑 | ✅ 已有，需扩展 |
| `survival_dimensions_simple.json` | 参数配置 | ✅ 已有，需添加新字段 |
| `survival_buffs.json` | Buff定义 | ⬜ 需新建 |
| `characterSlice.ts` | Buff状态管理 | ⬜ 需添加activeBuffs |
| `advanceTurn.ts` | 回合主逻辑 | ⬜ 需整合新计算 |

---

## 六、开发Checklist

### 必须实现（2-3小时工作量）

- [ ] 1. `survival_dimensions_simple.json` 添加新字段
  - [ ] `calculation.vitalityDecay`
  - [ ] `calculation.classResistance`

- [ ] 2. 新建 `survival_buffs.json`
  - [ ] 定义所有事件对应的Buff

- [ ] 3. 扩展 `survivalCalculator.ts`
  - [ ] 实现 `calculateVitalityDecay()`
  - [ ] 更新 `calculateDiseasePenalty()` 加入ClassResistance

- [ ] 4. 扩展 `characterSlice.ts`
  - [ ] 添加 `activeBuffs` 字段
  - [ ] 实现 `addStatusEffect()`
  - [ ] 实现 `processBuffs()`

- [ ] 5. 更新 `advanceTurn.ts`
  - [ ] 整合新的计算流程
  - [ ] 添加死亡判定

### 可选优化

- [ ] 6. UI显示当前Decay等级和预期HP变化
- [ ] 7. 添加Buff图标和倒计时显示
- [ ] 8. 音效/视觉反馈对应不同Decay等级

---

## 七、快速参考：公式→代码对照表

| 数学符号 | 代码变量 | 类型 | 来源 |
|---------|---------|------|------|
| $D, M, N, H, E$ | `dimensions.*` | number[5] | calculateDimension() |
| $S$ | `survivalRate` | number | calculateSurvivalRate() |
| $k$ | `steepness` | number | config.calculation.sigmoid |
| $x_0$ | `midpoint` | number | config.calculation.sigmoid |
| $w_{dim}$ | `dimensionWeights.*` | number[5] | config.calculation |
| $C_D$ | `classBaseScores[class]` | number[5] | config.calculation |
| $\delta_{homeless}$ | `homelessPenalty.*` | number[2] | config.calculation |
| $f(S)$ | `hpDecay` | number | calculateVitalityDecay() |
| $g(S)$ | `sanDecay` | number | calculateVitalityDecay() |
| $ClassResistance$ | `classResistance[class]` | number | config.calculation |
| $\epsilon$ | `random()` | number | Math.random() |

---

**文档版本**：v2.0  
**更新日期**：2026-02-18  
**对应代码版本**：survivalCalculator.ts（当前版本 + 待实现扩展）
