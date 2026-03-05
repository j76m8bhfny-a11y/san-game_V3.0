# 游戏流程完整性深度检查报告（严重缺陷版）

**检查日期**: 2026-03-05  
**检查人员**: AI QA Engineer（深度模式）  
**游戏版本**: American Insight 异化生存 V3.0  

---

## 一、严重缺陷汇总（需立即修复）

### 🔴 致命级（可能导致游戏崩溃/死档）

| ID | 缺陷 | 风险 | 代码位置 | 修复优先级 |
|----|------|------|----------|------------|
| F-001 | **竞态条件：异步解锁档案** | 状态不一致、重复解锁 | `eventResolver.ts:182-184` | P0 |
| F-002 | **监狱结算重复执行** | 双倍扣款/扣血 | `createPrisonSlice.ts:262` + `nextTurn` | P0 |
| F-003 | **setTimeout 内存泄露** | 组件卸载后定时器继续执行 | 多处组件 | P1 |
| F-004 | **连锁事件无限循环** | 栈溢出、游戏卡死 | `createShopSlice.ts:463-473` | P0 |
| F-005 | **负数金钱未完全阻止** | 经济系统崩溃 | `addTransaction` 多处 | P1 |

### 🟠 高危级（严重影响游戏体验）

| ID | 缺陷 | 风险 | 代码位置 | 修复优先级 |
|----|------|------|----------|------------|
| H-001 | **事务无回滚机制** | 银行操作半途而废 | `createBankSlice.ts` | P1 |
| H-002 | **事件条件空指针** | 事件无法触发 | `EventSystem.ts:100-130` | P1 |
| H-003 | **存档损坏无恢复** | 玩家进度丢失 | `useGameStore.ts:143-153` | P1 |
| H-004 | **医疗预约过期未处理** | 玩家损失定金 | `createVitalitySlice.ts:859-946` | P2 |
| H-005 | **模态框无堆栈管理** | 界面卡死 | `App.tsx` 多个模态框 | P2 |

---

## 二、致命级缺陷详情

### 🔴 F-001: 竞态条件 - 异步解锁档案

#### 问题描述
```typescript
// eventResolver.ts:182-184
setTimeout(() => {
  useGameStore.getState().unlockArchive(option.archiveId!);
}, 0);
```

**风险分析**:
1. **状态不一致**: 使用 `setTimeout` 异步更新状态，在玩家快速操作时，可能在前一个事件还没处理完时就触发新事件
2. **重复解锁**: 如果玩家快速点击，可能导致同一个档案被解锁多次
3. **空值风险**: `option.archiveId!` 使用非空断言，如果 `archiveId` 为 `undefined`，会报错

#### 攻击路径
```
1. 触发事件A，选择D选项
2. 快速关闭事件A（或触发新事件B）
3. setTimeout 回调执行时，游戏状态已改变
4. 可能解锁错误的档案，或在错误的状态下解锁
```

#### 修复建议
```typescript
// 修复方案：同步处理，移除 setTimeout
if (option.archiveId) {
  const wasUnlocked = state.unlockedArchives.includes(option.archiveId);
  
  if (!wasUnlocked) {
    draft.unlockedArchives.push(option.archiveId);
    // 同步调用，不通过 setTimeout
    const store = useGameStore.getState();
    if (store.unlockArchive && !store.unlockedArchives.includes(option.archiveId)) {
      store.unlockArchive(option.archiveId);
    }
  }
}
```

---

### 🔴 F-002: 监狱结算重复执行

#### 问题描述
```typescript
// createPrisonSlice.ts:262
const settlementResult = applySystemSettlement(state);

// createGameSlice.ts:319-371 nextTurn 也会调用结算
const settlementResult = get().runCoreSettlement(state);
```

**风险分析**:
1. **双重扣款**: 坐牢时 `serveTime` 调用 `applySystemSettlement`，出狱后 `nextTurn` 再次结算
2. **双倍伤害**: 监狱惩罚 + 正常回合衰减重复计算
3. **时间混乱**: 回合数计算可能出现跳跃

#### 攻击路径
```
1. 玩家被捕入狱
2. serveTime 执行：系统结算 + 监狱惩罚 + 回合+1
3. 出狱后点击下一回合
4. nextTurn 再次执行结算
5. 玩家被双倍扣款/扣血
```

#### 修复建议
```typescript
// 在 createGameSlice.ts 中添加监狱检查
nextTurn: () => {
  if (get().prison?.inJail) {
    // 坐牢期间不执行正常回合结算，由 serveTime 处理
    return;
  }
  // ... 正常结算逻辑
}
```

---

### 🔴 F-003: setTimeout 内存泄露

#### 问题描述
```typescript
// 在多个组件中发现，如：
// TitleScreen.tsx:99-106
setInterval(() => {
  if (random() < uiConfig.glitchChance) {
    setGlitchTrigger(true);
    setTimeout(() => setGlitchTrigger(false), uiConfig.glitchDuration);
  }
}, uiConfig.glitchInterval);

// createUISlice.ts:153-158
const timer = setTimeout(() => {
  pendingTimers.delete(timer);
  get().removeNotification(id);
}, duration);
```

**风险分析**:
1. **组件卸载后执行**: 如果组件在 `setTimeout` 回调执行前卸载，可能导致内存泄露或操作已卸载的组件
2. **store 已重置**: 如果游戏重启（`restartGame`），定时器仍可能引用旧的 store 状态
3. **累积泄露**: 长时间游戏可能导致大量定时器累积

#### 发现位置（部分）
- `TitleScreen.tsx` - glitch 效果定时器
- `createUISlice.ts` - 通知定时器（虽有清理，但组件级别也有）
- `createVitalitySlice.ts:749-754` - 商店刷新定时器
- `MessageWindow.tsx` - 打字机效果定时器

#### 修复建议
```typescript
// 使用统一的定时器管理
const useGameTimers = () => {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  useEffect(() => {
    return () => {
      // 组件卸载时清理所有定时器
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);
  
  const setGameTimer = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  };
  
  return { setGameTimer };
};
```

---

### 🔴 F-004: 连锁事件无限循环

#### 问题描述
```typescript
// createShopSlice.ts:463-473
trigger_event: {
  const { eventId, probability = 1.0 } = params;
  if (Math.random() < probability) {
    const eventData = state.gameDataCache?.events?.find((e: any) => e.id === eventId);
    if (eventData && state.triggerEvent) {
      state.triggerEvent(eventData);  // 🔴 可能触发另一个有 trigger_event 的选项
    }
  }
}
```

**风险分析**:
1. **事件A → 事件B → 事件C → 事件A**: 如果事件配置不当，可能形成无限循环
2. **没有循环检测**: 代码中没有检查事件触发深度或循环
3. **栈溢出**: 无限递归会导致 JavaScript 栈溢出，游戏卡死

#### 攻击路径
```
事件A 选项D: trigger_event: { eventId: 'B' }
事件B 选项D: trigger_event: { eventId: 'C' }
事件C 选项D: trigger_event: { eventId: 'A' }
→ 玩家选择 A→D, B→D, C→D 后进入无限循环
```

#### 修复建议
```typescript
// 添加事件触发深度限制
const MAX_EVENT_CHAIN = 3;
let eventChainDepth = 0;

const triggerEvent = (event) => {
  if (eventChainDepth >= MAX_EVENT_CHAIN) {
    console.warn('事件连锁深度超过限制，停止触发');
    return;
  }
  
  eventChainDepth++;
  set({ currentEvent: event });
  // 在事件关闭时重置深度
};

// 在 closeEvent 中重置
closeEvent: () => {
  eventChainDepth = 0;
  set({ currentEvent: null });
}
```

---

### 🔴 F-005: 负数金钱未完全阻止

#### 问题描述
```typescript
// createVitalitySlice.ts:189-225
addTransaction: (category, amount, description) => {
  let success = true;
  let actualAmount = amount;
  
  set((state: any) => {
    const currentGold = state.vitality.metrics.gold;
    const newGold = currentGold + amount;
    
    if (newGold < 0) {
      success = false;
      actualAmount = 0;
      return {};  // 🔴 返回空对象，但未阻止后续操作
    }
    // ...
  });
  
  return { success, actualAmount };  // 调用方可能忽略这个返回值
}

// 调用方示例（createShopSlice.ts:213-218）
const txResult = state.addTransaction(transactionType, -item.price, `购买: ${item.name}`);
if (!txResult.success) {
  state.addNotification("交易失败，资金不足", "error");
  return;
}
```

**风险分析**:
1. **竞争条件**: 如果两个购买同时发生，检查通过但扣款时余额不足
2. **忽略返回值**: 某些调用方可能不检查 `success`
3. **异步更新**: `set` 是异步的，可能在检查余额后、扣款前，其他操作改变了余额

#### 发现的风险点
- `createShopSlice.ts:213-218` - 购买物品
- `createVitalitySlice.ts:466` - 医疗预约定金
- `createPrisonSlice.ts:357-360` - 支付保释金

#### 修复建议
```typescript
// 使用同步检查 + 原子操作
addTransaction: (category, amount, description) => {
  const state = get();
  const currentGold = state.vitality.metrics.gold;
  
  // 同步检查
  if (currentGold + amount < 0) {
    return { success: false, actualAmount: 0 };
  }
  
  // 原子更新
  set((state: any) => ({
    vitality: {
      ...state.vitality,
      metrics: { ...state.vitality.metrics, gold: state.vitality.metrics.gold + amount },
      ledger: { history: [...state.vitality.ledger.history, newRecord] }
    }
  }));
  
  return { success: true, actualAmount: amount };
}
```

---

## 三、高危级缺陷详情

### 🟠 H-001: 事务无回滚机制

#### 问题描述
```typescript
// createBankSlice.ts:30-88
takeLoan: (productId, amount) => {
  // 1. 检查信用分
  // 2. 发放贷款 addTransaction
  // 3. 扣信用分 modifyStats
  // 4. 创建贷款记录 set
  
  // 🔴 问题：如果步骤2成功，步骤3或4失败，玩家拿到钱但没有贷款记录
}

// createPrisonSlice.ts:456-469
signBailBond: () => {
  // 1. 扣除首付 addTransaction
  // 2. 发放贷款 takeLoan
  // 3. 释放 set
  
  // 🔴 问题：如果步骤1成功，步骤2失败，会尝试退款，但如果退款也失败呢？
  state.addTransaction('MISC' as LedgerCategory, downPayment, '保释金首付退款');
}
```

**风险分析**:
1. **原子性缺失**: 多步骤操作没有事务保证
2. **不一致状态**: 玩家可能拿到钱但没有债务记录
3. **退款失败**: 退款操作本身也可能失败

#### 修复建议
```typescript
// 使用事务日志模式
takeLoan: (productId, amount) => {
  const txLog = [];
  
  try {
    // 步骤1
    const txResult = state.addTransaction('BANK', amount, `贷款发放`);
    if (!txResult.success) throw new Error('发放失败');
    txLog.push({ type: 'transaction', amount });
    
    // 步骤2
    state.modifyStats({ creditScore: penalty });
    txLog.push({ type: 'stat', stat: 'creditScore', value: penalty });
    
    // 步骤3
    set((s) => ({ ... }));
    txLog.push({ type: 'loan', loan: newLoan });
    
    return { success: true };
  } catch (error) {
    // 回滚
    txLog.reverse().forEach(op => {
      if (op.type === 'transaction') {
        state.addTransaction('BANK', -op.amount, '回滚');
      }
      // ... 其他回滚逻辑
    });
    return { success: false };
  }
}
```

---

### 🟠 H-002: 事件条件空指针

#### 问题描述
```typescript
// EventSystem.ts:100-130
const candidates = allEvents.filter(event => {
  // 检查回合限制
  const eventConditions = event.conditions as any;
  if (eventConditions?.minTurn && currentTurn < eventConditions.minTurn) {
    return false;
  }
  // ...
  
  // 检查其他条件
  return checkCondition(state, event.conditions);
});

// checkCondition 在 eventResolver.ts:7-47
export const checkCondition = (state: GameState, condition: GameEvent['conditions']): boolean => {
  if (!condition) return true;
  
  if (condition.minInsight !== undefined && state.vitality.metrics.insight < condition.minInsight) return false;
  // ...
  
  // 🔴 问题：如果 state.vitality.metrics 为 undefined，这里会报错
}
```

**风险分析**:
1. **空指针异常**: 如果游戏数据未完全加载，访问 `state.vitality.metrics` 会报错
2. **事件系统瘫痪**: 一个异常可能导致整个事件系统停止工作
3. **玩家卡死**: 如果事件触发失败，玩家可能无法进行游戏

#### 修复建议
```typescript
// 添加防御性检查
export const checkCondition = (state: GameState, condition: GameEvent['conditions']): boolean => {
  if (!condition) return true;
  
  // 防御性检查
  if (!state?.vitality?.metrics) {
    console.warn('checkCondition: 状态不完整', state);
    return false;
  }
  
  if (condition.minInsight !== undefined && state.vitality.metrics.insight < condition.minInsight) {
    return false;
  }
  // ...
}
```

---

### 🟠 H-003: 存档损坏无恢复

#### 问题描述
```typescript
// useGameStore.ts:143-153
onRehydrateStorage: () => (state) => {
  setTimeout(() => {
    if (state && state.setHasHydrated) {
      console.log("💧 Storage Hydrated! System Ready.");
      state.setHasHydrated(true);
    } else {
      console.error("❌ 严重错误: Store 中找不到 setHasHydrated 方法，游戏将一直卡在 Loading 界面！");
    }
  }, 0);
}
```

**风险分析**:
1. **存档损坏**: 如果 localStorage 数据损坏，游戏可能无限卡在 Loading
2. **版本不兼容**: 新版本代码读取旧版本存档，可能导致数据结构不匹配
3. **无恢复机制**: 发现存档问题时，没有自动重置或修复机制

#### 修复建议
```typescript
onRehydrateStorage: () => (state) => {
  setTimeout(() => {
    try {
      // 验证存档完整性
      if (!isValidSaveData(state)) {
        console.warn("存档数据损坏或版本不兼容，将重置游戏");
        localStorage.removeItem('pixel-life-storage');
        window.location.reload();
        return;
      }
      
      if (state && state.setHasHydrated) {
        state.setHasHydrated(true);
      }
    } catch (error) {
      console.error("存档恢复失败:", error);
      localStorage.removeItem('pixel-life-storage');
      window.location.reload();
    }
  }, 0);
}

const isValidSaveData = (state: any): boolean => {
  // 检查必要字段
  return state?.vitality?.metrics?.gold !== undefined &&
         state?.vitality?.time?.currentTurn !== undefined;
};
```

---

## 四、中危级缺陷

### 🟡 M-001: 医疗预约过期未处理

```typescript
// createVitalitySlice.ts:859-946
// 处理到期的医疗预约
for (const appt of dueAppointments) {
  // ... 执行手术效果
  
  // ✅ 无延迟账单时，才直接扣除尾款
  if (!hasDeferredPayment) {
    const remainingCost = apptService.baseCost - appt.depositPaid;
    if (remainingCost > 0) {
      if (state.addTransaction) {
        state.addTransaction('MEDICAL', -remainingCost, `手术尾款`);
      }
      updates.metrics.gold -= remainingCost;  // 🔴 可能变成负数
    }
  }
}
```

**风险**: 如果玩家定金支付后，在手术前花光了钱，尾款扣除可能导致负数金钱。

### 🟡 M-002: 模态框无堆栈管理

```typescript
// App.tsx:307-316
{isShopOpen && <ShopModal ... />}
{isJobBoardOpen && <JobBoardModal ... />}
{isInsuranceOpen && <InsuranceModal ... />}
```

**风险**: 可以同时打开多个模态框，界面混乱，可能遮挡重要信息。

### 🟡 M-003: 音频存储循环依赖

```typescript
// createVitalitySlice.ts:242-243
import { useAudioStore } from '@/store/useAudioStore';
// ...
const { playSfx } = useAudioStore.getState();
```

**风险**: 如果 AudioStore 也引用 VitalityStore，可能形成循环依赖。

---

## 五、修复建议汇总

### 立即修复（P0）

1. **移除所有 setTimeout 状态更新** - 改为同步处理
2. **添加事件连锁深度限制** - 最多3层
3. **修复监狱结算重复** - 坐牢期间跳过正常结算
4. **统一定时器管理** - 组件卸载时清理

### 短期修复（P1）

1. **添加事务回滚机制** - 多步骤操作原子化
2. **加强空值检查** - 所有状态访问前检查
3. **存档验证与恢复** - 损坏时自动重置
4. **负数金钱完全阻止** - 同步检查 + 原子操作

### 中期优化（P2）

1. **模态框堆栈管理** - 只允许一个模态框
2. **医疗预约资金检查** - 手术前检查尾款
3. **性能优化** - 减少不必要的重渲染

---

## 六、测试建议

### 压力测试
1. **快速点击测试**: 在事件界面快速点击选项100次
2. **连续回合测试**: 连续进行50个回合，检查数据一致性
3. **监狱循环测试**: 多次入狱出狱，检查结算是否正确
4. **事件连锁测试**: 故意配置循环事件，检查是否能被阻止

### 边界测试
1. **金钱为0测试**: 在金钱为0时尝试所有消费操作
2. **HP为1测试**: 在HP为1时结束回合
3. **存档损坏测试**: 手动修改 localStorage，检查恢复机制
4. **网络中断测试**: 游戏过程中清除 localStorage

---

## 七、总结

本次深度检查发现了 **5个致命级缺陷** 和 **5个高危级缺陷**，主要集中在：

1. **异步状态管理** - setTimeout 导致的竞态条件
2. **事务完整性** - 多步骤操作缺乏原子性保证
3. **循环检测缺失** - 事件系统可能无限循环
4. **空值检查不足** - 多处代码未做防御性检查
5. **资源泄露** - 定时器未正确清理

**建议**: 在发布前必须修复 P0 级缺陷，否则可能导致玩家游戏卡死或数据损坏。
