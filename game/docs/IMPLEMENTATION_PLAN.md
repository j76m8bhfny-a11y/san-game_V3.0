# 生存系统调整实施计划

> 基于数值专家审查结果的三项核心调整
> 预估工作量：2-3小时

---

## 一、调整总览

| 编号 | 调整项 | 原设计 | 新设计 | 影响文件 |
|-----|-------|-------|-------|---------|
| 1 | **Vitality Decay机制** | $S$=存活概率，Roll点判定生死 | $S$=环境健康指数，控制HP/SAN流失速率 | survivalCalculator.ts, survival_dimensions_simple.json |
| 2 | **ClassResistance系数** | 统一惩罚所有阶级 | $penalty_{real} = penalty_{base} / ClassResistance$ | survivalCalculator.ts, survival_dimensions_simple.json |
| 3 | **StatusEffect Buff系统** | $E_{history}$历史事件回溯累加 | Buff带duration倒计时，每回合生效 | createVitalitySlice.ts, 新建survival_buffs.json |

---

## 二、实施步骤详解

### 阶段1：配置参数更新（15分钟）

#### 步骤1.1：修改 `survival_dimensions_simple.json`

**添加三个新配置块**：

```json
{
  "calculation": {
    "// ... 现有配置保留": {},
    
    "vitalityDecay": {
      "description": "生存率S对应的生命/理智每回合变化",
      "thresholds": [0.2, 0.4, 0.6, 0.8],
      "levels": ["CRITICAL", "DANGER", "WARNING", "GOOD", "EXCELLENT"],
      "hpDecay": [-5, -2, -1, 0, 1],
      "sanDecay": [-3, -1, 0, 0, 1]
    },
    
    "classResistance": {
      "description": "阶级抗性系数，越低越脆弱",
      "HOMELESS": 0.3,
      "WORKER": 0.6,
      "MIDDLE": 1.0,
      "CAPITALIST": 2.0
    },
    
    "randomVariance": 0.05
  }
}
```

**关键数值说明**：
- HOMELESS: 0.3 → 惩罚×3.33（10%惩罚→33%实际）
- CAPITALIST: 2.0 → 惩罚×0.5（10%惩罚→5%实际）

---

### 阶段2：核心计算逻辑更新（45分钟）

#### 步骤2.1：扩展 `survivalCalculator.ts`

**A. 添加新类型定义**（文件顶部）：

```typescript
// 新增：Vitality Decay结果类型
export interface VitalityDecay {
  hpDecay: number;        // 本回合HP变化
  sanDecay: number;       // 本回合SAN变化
  level: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'DANGER' | 'CRITICAL';
  survivalRate: number;   // 原始生存率（不含随机扰动）
}

// 新增：StatusEffect类型
export interface SurvivalBuff {
  id: string;
  name: string;
  description: string;
  duration: number;       // 剩余回合
  maxDuration: number;    // 总回合
  effects: {
    perTurn?: { hp?: number; san?: number; gold?: number };
    onExpire?: { hp?: number; san?: number; gold?: number };
  };
  source: string;         // 触发来源事件ID
  icon?: string;
}
```

**B. 修改 `calculateSurvivalRate` 函数**：

```typescript
// 修改疾病惩罚计算，加入ClassResistance
function calculateDiseasePenalty(state: StoreState): number {
  const diseases = state.vitality.activeDiseases;
  const diseaseDefs = state.gameDataCache?.diseases || [];
  const calcConfig = config.calculation;
  
  // 获取阶级抗性
  const characterClass = state.vitality.identity.currentClass;
  const classResistance = calcConfig.classResistance[characterClass] || 1.0;
  
  let basePenalty = 0;
  
  for (const diseaseId of diseases) {
    const diseaseDef = diseaseDefs.find((d: Disease) => d.id === diseaseId);
    if (diseaseDef?.type === 'ACUTE') {
      basePenalty += calcConfig.diseasePenalty.perAcuteDisease;
    } else {
      basePenalty += calcConfig.diseasePenalty.perDisease;
    }
  }
  
  // 成瘾惩罚
  basePenalty += state.vitality.metrics.addiction * calcConfig.diseasePenalty.addictionMultiplier;
  
  // 应用阶级抗性：惩罚 = 基础惩罚 / 抗性
  const realPenalty = basePenalty / classResistance;
  
  return realPenalty;
}
```

**C. 新增 `calculateVitalityDecay` 函数**：

```typescript
/**
 * 计算Vitality Decay Rate
 * 根据生存率S返回每回合HP/SAN变化
 */
export function calculateVitalityDecay(
  state: StoreState,
  options?: { includeVariance?: boolean }
): VitalityDecay {
  const result = calculateSurvivalRate(state, { includeVariance: options?.includeVariance });
  const survivalRate = result.survivalRate;
  const decayConfig = config.calculation.vitalityDecay;
  
  // 确定等级索引
  let levelIndex: number;
  const thresholds = decayConfig.thresholds;
  
  if (survivalRate >= thresholds[3]) levelIndex = 4;      // EXCELLENT
  else if (survivalRate >= thresholds[2]) levelIndex = 3; // GOOD
  else if (survivalRate >= thresholds[1]) levelIndex = 2; // WARNING
  else if (survivalRate >= thresholds[0]) levelIndex = 1; // DANGER
  else levelIndex = 0;                                     // CRITICAL
  
  const levels = decayConfig.levels;
  
  return {
    hpDecay: decayConfig.hpDecay[levelIndex],
    sanDecay: decayConfig.sanDecay[levelIndex],
    level: levels[levelIndex] as VitalityDecay['level'],
    survivalRate
  };
}
```

**D. 修改 `checkSurvival` 函数**（废弃旧的Roll点判定）：

```typescript
/**
 * 回合结束时的生存检查
 * 返回VitalityDecay供advanceTurn调用
 * 
 * 旧逻辑（废弃）：Roll点判定生死
 * 新逻辑（当前）：计算Decay Rate，由调用方应用
 */
export function checkSurvival(
  state: StoreState
): { decay: VitalityDecay; wouldDie: boolean } {
  const decay = calculateVitalityDecay(state, { includeVariance: true });
  
  // 预测是否会死亡（用于UI警告）
  const currentHp = state.vitality.metrics.hp;
  const currentSan = state.vitality.metrics.san;
  const wouldDie = (currentHp + decay.hpDecay <= 0) || (currentSan + decay.sanDecay <= 0);
  
  return { decay, wouldDie };
}
```

**E. 更新调试输出函数**：

修改`printSurvivalAnalysis`，增加Decay信息输出。

---

### 阶段3：Buff系统实现（45分钟）

#### 步骤3.1：新建 `survival_buffs.json`

**文件路径**：`game/src/assets/data/rules/survival_buffs.json`

```json
{
  "$schema": "survival-buffs",
  "description": "生存系统StatusEffect定义 - 替代历史事件累加",
  "version": "1.0.0",
  
  "buffs": {
    "shock_homelessness": {
      "name": "居无定所",
      "description": "露宿街头带来的持续心理压力",
      "duration": 3,
      "effects": {
        "perTurn": { "san": -2 },
        "onExpire": { "san": 5 }
      },
      "stackable": false,
      "icon": "buff_homeless"
    },
    
    "shock_fired": {
      "name": "失业焦虑",
      "description": "失去工作的不安全感",
      "duration": 5,
      "effects": {
        "perTurn": { "san": -1 },
        "onExpire": { "san": 3 }
      },
      "stackable": true,
      "maxStacks": 3,
      "icon": "buff_fired"
    },
    
    "shock_illness": {
      "name": "病痛折磨",
      "description": "疾病带来的身体不适",
      "duration": 7,
      "effects": {
        "perTurn": { "hp": -1, "san": -1 },
        "onExpire": { "hp": 3 }
      },
      "stackable": false,
      "icon": "buff_illness"
    },
    
    "buff_insured": {
      "name": "有保障的安心",
      "description": "医疗保险带来的安全感",
      "duration": -1,
      "effects": {
        "perTurn": { "san": 1 }
      },
      "stackable": false,
      "icon": "buff_insured"
    }
  },
  
  "eventMappings": {
    "EVT_01_BENCH": { "buffId": "shock_homelessness", "probability": 0.5 },
    "EVT_04_SPIKES": { "buffId": "shock_homelessness", "probability": 1.0 },
    "JOB_LOST": { "buffId": "shock_fired", "probability": 1.0 },
    "DISEASE_CONTRACTED": { "buffId": "shock_illness", "probability": 1.0 }
  }
}
```

#### 步骤3.2：修改 `createVitalitySlice.ts`

**A. 添加Buff相关状态**：

```typescript
// 在VitalityState类型中添加（需要在types/schema.ts中定义）
interface VitalityState {
  // ... 现有属性
  activeBuffs: SurvivalBuff[];
}
```

**B. 添加Slice方法**：

```typescript
export interface VitalitySlice {
  // ... 现有方法
  
  // Buff管理
  addSurvivalBuff: (buff: SurvivalBuff) => void;
  removeSurvivalBuff: (buffId: string) => void;
  processBuffs: () => { hpChange: number; sanChange: number; expiredBuffs: string[] };
  
  // 从事件触发Buff
  applyEventBuff: (eventId: string) => void;
}
```

**C. 实现方法**：

```typescript
// 在createVitalitySlice实现中
addSurvivalBuff: (buff) => set((state: any) => {
  const existingBuffs = state.vitality.activeBuffs || [];
  
  // 检查是否可堆叠
  if (!buff.stackable) {
    const exists = existingBuffs.some((b: SurvivalBuff) => b.id === buff.id);
    if (exists) {
      // 刷新持续时间
      return {
        vitality: {
          ...state.vitality,
          activeBuffs: existingBuffs.map((b: SurvivalBuff) => 
            b.id === buff.id ? { ...b, duration: buff.maxDuration } : b
          )
        }
      };
    }
  }
  
  return {
    vitality: {
      ...state.vitality,
      activeBuffs: [...existingBuffs, buff]
    }
  };
}),

removeSurvivalBuff: (buffId) => set((state: any) => ({
  vitality: {
    ...state.vitality,
    activeBuffs: (state.vitality.activeBuffs || []).filter((b: SurvivalBuff) => b.id !== buffId)
  }
})),

processBuffs: () => {
  const state = get() as StoreState;
  const buffs = state.vitality.activeBuffs || [];
  
  let hpChange = 0;
  let sanChange = 0;
  const expiredBuffs: string[] = [];
  const remainingBuffs: SurvivalBuff[] = [];
  
  for (const buff of buffs) {
    // 应用每回合效果
    if (buff.effects.perTurn) {
      hpChange += buff.effects.perTurn.hp || 0;
      sanChange += buff.effects.perTurn.san || 0;
    }
    
    // 减少持续时间（-1表示永久）
    const newDuration = buff.duration > 0 ? buff.duration - 1 : buff.duration;
    
    if (newDuration === 0) {
      // Buff过期
      expiredBuffs.push(buff.id);
      if (buff.effects.onExpire) {
        hpChange += buff.effects.onExpire.hp || 0;
        sanChange += buff.effects.onExpire.san || 0;
      }
    } else {
      remainingBuffs.push({ ...buff, duration: newDuration });
    }
  }
  
  // 更新状态
  set((state: any) => ({
    vitality: {
      ...state.vitality,
      activeBuffs: remainingBuffs
    }
  }));
  
  return { hpChange, sanChange, expiredBuffs };
}

**D. 实现 `applyEventBuff` 方法**：

```typescript
// 从survival_buffs.json加载配置
import buffConfig from '@/assets/data/rules/survival_buffs.json';

applyEventBuff: (eventId) => {
  const mapping = buffConfig.eventMappings[eventId];
  if (!mapping) return; // 该事件无Buff映射
  
  // 检查概率
  if (Math.random() > mapping.probability) return;
  
  const buffTemplate = buffConfig.buffs[mapping.buffId];
  if (!buffTemplate) {
    console.warn(`[SurvivalBuff] 未找到Buff定义: ${mapping.buffId}`);
    return;
  }
  
  // 创建Buff实例
  const buff: SurvivalBuff = {
    id: `${mapping.buffId}_${Date.now()}`,
    name: buffTemplate.name,
    description: buffTemplate.description,
    duration: buffTemplate.duration,
    maxDuration: buffTemplate.duration,
    effects: buffTemplate.effects,
    source: eventId,
    stackable: buffTemplate.stackable,
    maxStacks: buffTemplate.maxStacks,
    icon: buffTemplate.icon
  };
  
  get().addSurvivalBuff(buff);
  
  // 通知玩家
  const state = get() as any;
  if (state.addNotification) {
    state.addNotification(`获得状态: ${buff.name}`, 'info');
  }
}
```

---

#### 步骤3.3：EventSystem集成（补充）

在事件处理流程中调用Buff添加。需要修改两个位置：

**文件1: `game/src/systems/core/EventSystem.ts`**

```typescript
import buffConfig from '@/assets/data/rules/survival_buffs.json';

export const EventSystem: GameSystem = {
  id: 'EVENT_SYSTEM',

  processTurn: ({ state, dispatch }) => {
    // ... 原有事件选择逻辑 ...
    
    const event = getRandomEvent(state);
    if (!event) return { state, logs: [] };
    
    // ✅ 新增: 检查事件是否触发Buff
    const buffMapping = buffConfig.eventMappings[event.id];
    if (buffMapping && Math.random() <= buffMapping.probability) {
      // 使用dispatch调用VitalitySlice的applyEventBuff
      dispatch({ 
        type: 'APPLY_EVENT_BUFF', 
        payload: { eventId: event.id } 
      });
    }
    
    // ... 返回事件给UI展示 ...
    return { state, logs, event };
  }
};
```

**文件2: `game/src/logic/eventResolver.ts`**

```typescript
import buffConfig from '@/assets/data/rules/survival_buffs.json';
import { useGameStore } from '@/store/useGameStore';

export const resolveOption = (state, option) => {
  // ... 原有效果处理逻辑 ...
  
  // ✅ 新增: 在选项效果处理完成后，检查触发Buff
  // 注意：这里假设能从state中获取当前处理的事件ID
  // 实际实现可能需要从调用方传入eventId
  
  return { updates, logs, nextEventId };
};

// 替代方案：在事件UI组件中处理
// EventDialog.tsx 中玩家选择选项后：
export function onEventOptionSelected(eventId: string, optionId: string) {
  // 1. 应用选项效果
  resolveOption(state, option);
  
  // 2. 检查并触发Buff
  const { applyEventBuff } = useGameStore.getState();
  applyEventBuff(eventId);
}
```

**推荐方案**：在 `createVitalitySlice.ts` 的 `advanceTurn` 中已包含疾病触发Buff的逻辑。对于事件触发的Buff，建议在**事件UI层**（EventDialog组件）玩家做出选择后调用`applyEventBuff`，这样更直观且易于调试。

---

### 阶段4：回合推进整合（30分钟）

#### 步骤4.1：修改 `advanceTurn` 函数

在`createVitalitySlice.ts`中重写advanceTurn：

```typescript
advanceTurn: () => set((state: any) => {
  // ===== 步骤1: 疾病检查（原有逻辑）=====
  const allDiseases = state.gameDataCache?.diseases || [];
  const newDiseaseId = checkDailyDisease(state, allDiseases);
  const existingDiseases = new Set(state.vitality.activeDiseases);
  const uniqueNewDiseaseId = newDiseaseId && !existingDiseases.has(newDiseaseId) ? newDiseaseId : null;
  
  let updates: any = {
    time: {
      currentTurn: state.vitality.time.currentTurn + 1,
      totalTurns: state.vitality.time.totalTurns + 1
    }
  };
  
  if (uniqueNewDiseaseId) {
    updates.activeDiseases = [...state.vitality.activeDiseases, uniqueNewDiseaseId];
    const diseaseName = allDiseases.find((d: any) => d.id === uniqueNewDiseaseId)?.name || uniqueNewDiseaseId;
    if (state.addNotification) {
      state.addNotification(`警告：你患上了 ${diseaseName}`, 'warning');
    }
    // 触发疾病Buff
    get().applyEventBuff('DISEASE_CONTRACTED');
  }
  
  // ===== 步骤2: 计算Vitality Decay（新逻辑）=====
  const { decay } = checkSurvival(state);
  
  // ===== 步骤3: 处理Buff效果（新逻辑）=====
  const { hpChange: buffHpChange, sanChange: buffSanChange } = get().processBuffs();
  
  // ===== 步骤4: 应用总变化 =====
  const currentMetrics = state.vitality.metrics;
  const totalHpChange = decay.hpDecay + buffHpChange;
  const totalSanChange = decay.sanDecay + buffSanChange;
  
  const newHp = Math.max(0, Math.min(currentMetrics.maxHp, currentMetrics.hp + totalHpChange));
  const newSan = Math.max(0, Math.min(currentMetrics.maxSan, currentMetrics.san + totalSanChange));
  
  updates.metrics = {
    ...currentMetrics,
    hp: newHp,
    san: newSan
  };
  
  // ===== 步骤5: 死亡判定 =====
  if (newHp <= 0) {
    if (state.triggerEnding) {
      state.triggerEnding('DEATH', `在${decay.level}环境下生命耗尽`);
    }
  }
  if (newSan <= 0) {
    if (state.triggerEnding) {
      state.triggerEnding('MADNESS', `精神崩溃于${decay.level}环境`);
    }
  }
  
  // ===== 步骤6: 通知玩家 =====
  if (state.addNotification) {
    if (decay.level === 'CRITICAL') {
      state.addNotification('⚠️ 生命危险！环境极度恶劣', 'error');
    } else if (decay.level === 'DANGER') {
      state.addNotification('⚠️ 健康状况堪忧', 'warning');
    }
  }
  
  return {
    vitality: {
      ...state.vitality,
      ...updates
    }
  };
})
```

---

### 阶段5：类型定义更新（15分钟）

#### 步骤5.1：更新 `types/schema.ts`

添加SurvivalBuff相关类型：

```typescript
// 在适当位置添加
export interface SurvivalBuff {
  id: string;
  name: string;
  description: string;
  duration: number;
  maxDuration: number;
  effects: {
    perTurn?: { hp?: number; san?: number; gold?: number };
    onExpire?: { hp?: number; san?: number; gold?: number };
  };
  source: string;
  stackable: boolean;
  maxStacks?: number;
  icon?: string;
}

// 在VitalityState中添加
export interface VitalityState {
  // ... 现有字段
  activeBuffs: SurvivalBuff[];
}
```

---

## 三、实施顺序建议

```
阶段1 (15min)      阶段2 (45min)         阶段3 (45min)        阶段4 (30min)       阶段5 (15min)
   │                   │                     │                   │                  │
   ▼                   ▼                     ▼                   ▼                  ▼
修改JSON配置  →  修改survivalCalculator  →  新建buffs.json  →  修改advanceTurn  →  更新类型定义
   │                   │                     │                   │                  │
   │                   ▼                     │                   │                  │
   │            添加VitalityDecay类型        │                   │                  │
   │            添加calculateVitalityDecay   │                   │                  │
   │            修改疾病惩罚计算             │                   │                  │
   │            更新checkSurvival            │                   │                  │
   │                                         ▼                   │                  │
   │                              新建survival_buffs.json        │                  │
   │                              定义Buff模板                   │                  │
   │                                                            ▼                  │
   │                                                 修改createVitalitySlice        │
   │                                                 添加activeBuffs状态            │
   │                                                 实现Buff管理方法               │
   │                                                 重写advanceTurn                │
   │                                                                               ▼
   │                                                                    更新types/schema.ts
   │                                                                    添加SurvivalBuff类型
   ▼
测试验证
```

---

## 四、测试验证清单

### 功能测试

- [ ] **Vitality Decay测试**
  - [ ] S=0.9时，HP+1/SAN+1
  - [ ] S=0.5时，HP-1/SAN不变
  - [ ] S=0.1时，HP-5/SAN-3

- [ ] **ClassResistance测试**
  - [ ] HOMELESS患病时惩罚×3.33
  - [ ] CAPITALIST患病时惩罚×0.5
  - [ ] 中间阶级惩罚不变

- [ ] **Buff系统测试**
  - [ ] 事件触发后添加正确Buff
  - [ ] Buff每回合生效
  - [ ] Buff倒计时结束自动移除
  - [ ] 不可堆叠Buff刷新持续时间

- [ ] **死亡判定测试**
  - [ ] HP<=0触发DEATH结局
  - [ ] SAN<=0触发MADNESS结局
  - [ ] 无Roll点随机死亡

### 平衡性测试

- [ ] **流浪汉生存测试**
  - [ ] 开局无住所，验证S<0.4（危险区）
  - [ ] 预期3-5回合内死亡（无干预）

- [ ] **中产舒适测试**
  - [ ] 有住所有工作，验证S>0.6（安全区）
  - [ ] 预期HP/SAN稳定或缓慢恢复

---

## 五、风险与回滚方案

| 风险 | 影响 | 回滚方案 |
|-----|------|---------|
| Decay数值过严 | 游戏过难 | 调整JSON中hpDecay/sanDecay数值 |
| ClassResistance差距过大 | 阶级跨越不可能 | 调整resistance系数（如HOMELESS:0.5） |
| Buff系统冲突 | 编译错误 | 注释掉Buff相关代码，恢复旧advanceTurn |

---

## 六、文件变更清单

| 文件路径 | 变更类型 | 变更内容 |
|---------|---------|---------|
| `survival_dimensions_simple.json` | 修改 | 添加vitalityDecay、classResistance配置 |
| `survivalCalculator.ts` | 修改 | 添加calculateVitalityDecay，修改疾病惩罚计算 |
| `survival_buffs.json` | 新建 | Buff定义配置文件 |
| `createVitalitySlice.ts` | 修改 | 添加activeBuffs，重写advanceTurn |
| `types/schema.ts` | 修改 | 添加SurvivalBuff类型定义 |

---

**制定日期**：2026-02-18  
**基于审查**：数值专家审查意见  
**预估工作量**：2-3小时（按顺序执行）
