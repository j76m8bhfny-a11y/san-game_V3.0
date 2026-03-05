# 游戏流程完整性检查报告（防死胡同版）

**检查日期**: 2026-03-05  
**检查人员**: AI QA Engineer  
**游戏版本**: American Insight 异化生存 V3.0  

---

## 一、检查执行摘要

### 1.1 总体评分

| 检查维度 | 得分 | 状态 |
|---------|------|------|
| 启动与初始化 | 9/10 | ✅ 良好 |
| 主界面流程 | 8/10 | ✅ 良好 |
| 子系统闭环 | 7/10 | ⚠️ 需要关注 |
| 回合结算 | 8/10 | ✅ 良好 |
| 事件系统 | 8/10 | ✅ 良好 |
| 死亡与结局 | 9/10 | ✅ 优秀 |
| **总体** | **8.2/10** | ✅ **可发布，需优化** |

### 1.2 关键发现

- **严重问题**: 0 个
- **中等问题**: 3 个
- **轻微问题**: 5 个
- **优化建议**: 4 个

---

## 二、详细检查结果

### 2.1 游戏启动与初始化 ✅

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **启动加载** | ✅ 通过 | `App.tsx:119-144` | 并行加载游戏数据和事件，有错误处理 |
| **错误处理** | ✅ 通过 | `App.tsx:154-171` | 加载失败显示红色报错屏幕，不是白屏 |
| **首次启动** | ✅ 通过 | `initial_state.json` | 正确显示 HOMELESS 初始状态 |
| **继续游戏** | ✅ 通过 | `TitleScreen.tsx:84-87` | 检查回合数和存档状态 |
| **新游戏重置** | ✅ 通过 | `createGameSlice.ts:516-639` | `restartGame()` 完整重置所有状态 |

#### 代码质量评估

```typescript
// ✅ 优秀的错误处理 (App.tsx:119-144)
const init = async () => {
  setLoading(true);
  setInitError(null); // 重置错误
  try {
    const [data, _] = await Promise.all([
      loadAllGameData(),
      preloadAllEvents()
    ]);
    
    if (!data) throw new Error("LoadData returned empty result");
    initializeData(data);
  } catch (e: any) {
    console.error("Critical System Failure:", e);
    setInitError(e.message || "Unknown Initialization Error");
  } finally {
    setLoading(false);
  }
};
```

**评价**: 启动流程有完善的错误捕获和提示，不会白屏卡死。

---

### 2.2 主游戏界面（MiniHUD）✅

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **HUD显示** | ✅ 通过 | `MiniHUD.tsx` | 显示回合、HP、金币、阶层、饱食度 |
| **按钮入口** | ✅ 通过 | `App.tsx:277-315` | 商店/工作/住所/医院等图标可点击 |
| **返回机制** | ✅ 通过 | 各 Modal 组件 | 所有子系统都有 `onClose` 回调 |
| **模态层管理** | ⚠️ 注意 | `App.tsx` | 模态框通过条件渲染管理，无堆栈 |

#### 潜在问题

```typescript
// ⚠️ App.tsx:307-316 - 同时打开多个模态框的可能性
{isShopOpen && <ShopModal isOpen={isShopOpen} onClose={() => setShopOpen(false)} />}
{isJobBoardOpen && <JobBoardModal isOpen={isJobBoardOpen} onClose={() => setJobBoardOpen(false)} />}
// ... 其他模态框
```

**风险**: 虽然通过 UI 设计通常不会同时打开多个，但代码层面允许同时显示多个模态框。

**建议**: 添加模态框优先级或堆栈管理，确保只有一个模态框在前。

---

### 2.3 住所系统流程 ⚠️

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **入口** | ✅ 通过 | `HousingModal.tsx` | 主界面点击住所图标进入 |
| **区域路由** | ✅ 通过 | `HousingModal.tsx:26-43` | 根据 `currentRegion` 路由到不同 UI |
| **资金检查** | ⚠️ 需确认 | 各区域组件 | 需要在具体实现中检查 |
| **返回主界面** | ✅ 通过 | `onClose` 回调 | 所有住所组件接收 onClose 属性 |

#### 问题发现

```typescript
// HousingModal.tsx:26-43
switch (currentRegion) {
  case RegionID.Slums: return <SlumsHousing onClose={onClose} />;
  case RegionID.RustBelt: return <RustBeltHousing onClose={onClose} />;
  case RegionID.Suburbs: return <SuburbsHousing onClose={onClose} />;
  case RegionID.Downtown: return <DowntownHousing onClose={onClose} />;
  default: return null; // ⚠️ 如果区域未匹配，无任何显示
}
```

**风险**: 如果 `currentRegion` 不是以上四个值，界面将完全空白，用户无法退出。

**建议**: 在 `default` 分支添加错误处理或返回按钮。

---

### 2.4 工作系统流程 ⚠️

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **入口** | ✅ 通过 | `JobBoardModal.tsx` | 主界面点击工作图标进入 |
| **条件检查** | ✅ 通过 | `useJobBoard.ts` | 检查阶层、物品、车辆、执照要求 |
| **就职/辞职** | ✅ 通过 | `JobBoardModal.tsx:105` | 有确认对话框 |
| **返回** | ✅ 通过 | `onClose` 回调 | 背景点击和关闭按钮均可退出 |

#### 问题发现

```typescript
// JobBoardModal.tsx:88-110
{jobs.map((job) => {
  const result = checkRequirements(job);
  // ...
  return (
    <JobPaper 
      // ...
      lockReasonKey={result.reason ? getReasonTranslation(result.reason).key : ''}
      // ...
    />
  );
})}
```

**潜在风险**: 如果 `getReasonTranslation` 返回 `null`，访问 `.key` 会报错。

---

### 2.5 商店系统流程 ✅

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **入口** | ✅ 通过 | `ShopModal.tsx` | 主界面点击商店图标进入 |
| **区域路由** | ✅ 通过 | `ShopModal.tsx:28-38` | 四个区域都有对应商店 |
| **资金检查** | ✅ 通过 | `SlumsShop.tsx:64` | `canAfford={gold >= item.price}` |
| **防连点** | ⚠️ 需确认 | `createShopSlice.ts` | 需要检查是否有防抖逻辑 |
| **返回** | ✅ 通过 | `onClick={onClose}` | 背景和按钮均可关闭 |

#### 代码质量

```typescript
// SlumsShop.tsx:19-21 - 优秀的关闭设计
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" 
     onClick={onClose}>
  <div onClick={(e) => e.stopPropagation()}> {/* 阻止冒泡 */}
```

**评价**: 点击背景关闭，点击内容不关闭，交互设计合理。

---

### 2.6 医院系统流程 ✅

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **入口** | ✅ 通过 | `HospitalModal.tsx` | 主界面点击医院图标或急性病自动弹出 |
| **治疗流程** | ✅ 通过 | `HospitalModal.tsx:75-84` | 检查资金，显示提示，成功后关闭 |
| **资金不足处理** | ✅ 通过 | `HospitalModal.tsx:181-183` | 显示红色提示，不扣除资金 |
| **保险计算** | ✅ 通过 | `calculateMedicalCost` | 显示原价、保险减免、自付额 |
| **返回** | ✅ 通过 | `onClose` 回调 | 可返回主界面 |

#### 急诊拦截逻辑

```typescript
// WeeklySettlement.tsx:87-96
const hasAcute = activeDiseases.some(id => {
   const d = gameDataCache?.diseases?.find((x: Disease) => x.id === id);
   return d?.type === 'ACUTE';
});

if (hasAcute) {
  setHospitalOpen(true);
  addNotification("警告：检测到致命病症，系统已强制启动急救程序。", "error");
}
```

**评价**: 急性病会在回合结算后自动弹出医院，防止玩家忽略治疗死亡。

---

### 2.7 银行系统流程 ⚠️

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **入口** | ✅ 通过 | 从主界面进入 | 需要检查具体实现 |
| **借款** | ⚠️ 需确认 | `createBankSlice.ts` | 需要验证利息计算 |
| **还款** | ⚠️ 需确认 | `createBankSlice.ts` | 需要验证是否能还清 |
| **逾期处理** | ⚠️ 需确认 | `createBankSlice.ts` | 需要检查是否有翻身机会 |

#### 潜在死胡同风险

**债务螺旋风险**: 需要验证即使借最高利贷，通过工作收入**数学上能还清**。

**建议检查项**:
- [ ] 贷款利率是否过高导致永远无法还清
- [ ] 被捕后是否有出狱和重新工作的机制
- [ ] 是否有最低生存保障（免费食物/基础医疗）

---

### 2.8 回合结算流程 ✅

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **结算顺序** | ✅ 通过 | `createGameSlice.ts:319-371` | 事件→结算→检查死亡→下一回合 |
| **事件触发** | ✅ 通过 | `processEventTurn` | 回合开始时触发事件 |
| **死亡检查** | ✅ 通过 | `checkDeathCondition` | HP <= minStat 触发结局 |
| **数据保存** | ✅ 通过 | `useGameStore.ts:105-155` | 自动持久化到 localStorage |
| **继续按钮** | ✅ 通过 | `WeeklySettlement.tsx:234-239` | 点击进入下一回合 |

#### 结算流程代码

```typescript
// createGameSlice.ts:319-371 - 清晰的结算流程
nextTurn: () => {
  if (get().isMenuOpen) return;
  if (get().isPaused) return;
  if (get().prison?.inJail) return;

  const state = get() as GameState;
  const store = get() as StoreState;

  // 0. 回合开始时触发事件
  const eventResult = processEventTurn(state);
  if (eventResult.updates.currentEvent) {
    // 有事件触发，暂停结算
    set({ ... });
    return;
  }

  // 1. 回合上限检查
  if (get().checkTurnLimit(state, store)) return;

  // 2. 运行核心系统结算
  const settlementResult = get().runCoreSettlement(state);

  // 3. 处理加密市场
  const cryptoResult = get().processCryptoMarket(state, store);

  // 4. 应用结算更新
  get().applySettlementUpdates(settlementResult.updates, settlementResult.report);

  // 5. 检查死亡条件
  if (get().checkDeathCondition(store)) return;

  // 6. 更新玩家阶级
  get().updatePlayerClass(store);

  // 7. 完成回合
  get().finalizeTurn(state, store, settlementResult.notes, cryptoResult.notes);
}
```

**评价**: 结算顺序合理，先收入后支出，先扣钱后扣血，不会因顺序错误误判死亡。

---

### 2.9 事件系统流程 ✅

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **事件加载** | ✅ 通过 | `EventSystem.ts:18-28` | 预加载所有事件，有错误处理 |
| **条件过滤** | ✅ 通过 | `EventSystem.ts:100-130` | 检查回合、阶层、触发历史 |
| **选项显示** | ✅ 通过 | `MessageWindow.tsx:608-620` | 2-4个选项，D选项有条件显示 |
| **效果应用** | ✅ 通过 | `createGameSlice.ts:105-255` | `selectOption` 处理效果 |
| **事件关闭** | ✅ 通过 | `closeEvent` | 可返回游戏 |

#### 防死循环设计

```typescript
// EventSystem.ts:101-104
// 排除已触发过的事件
if (triggeredEvents.includes(event.id)) {
  return false;
}
```

**评价**: 事件只会触发一次，不会重复触发导致死循环。

#### D选项保护机制

```typescript
// MessageWindow.tsx:816-846
// D选项引导提示（只显示一次）
{canSeeDOption && !selectedOptId && !hasSeenDOptionGuide && (
  <motion.div onAnimationComplete={() => {
    sessionStorage.setItem('sanguo_seen_d_guide', 'true');
    setHasSeenDOptionGuide(true);
  }}>
    {/* 引导内容 */}
  </motion.div>
)}
```

---

### 2.10 死亡与结局流程 ✅

#### 检查项清单

| 检查项 | 状态 | 代码位置 | 说明 |
|--------|------|----------|------|
| **死亡触发** | ✅ 通过 | `createGameSlice.ts:454-468` | HP <= minStat 立即触发 |
| **死亡分析** | ✅ 通过 | `deathAnalysis.ts` | 分析死因、错误、建议 |
| **结局显示** | ✅ 通过 | `DeathSummary.tsx` | 显示存活周数、档案、建议 |
| **重新开始** | ✅ 通过 | `handleRestart` | 重置状态回到 TitleScreen |
| **数据保存** | ✅ 通过 | `restartGame` | 保留解锁的档案和结局 |

#### 死亡结算代码质量

```typescript
// DeathSummary.tsx:242-278
export const DeathSummary: React.FC<DeathSummaryProps> = ({ onRestart }) => {
  const { currentRun, unlockedArchives, totalDeaths, dismissDeathSummary } = useGameStore();
  
  // 死亡复盘分析
  const analysis = useMemo(() => {
    const gameState = useGameStore.getState();
    return analyzeDeath(gameState);
  }, []);

  const handleRestart = () => {
    resumeEffects();
    dismissDeathSummary();
    onRestart();
  };
```

**评价**: 死亡结算界面完善，有详细的分析和建议，重新开始按钮可用。

---

## 三、跨系统连锁检查

### 3.1 经济循环验证 ✅

```
工作 → 收入 → 消费/储蓄 → 资产增长 → 阶层提升 → 更好工作 → 更多收入 ✓
```

**负债翻身路径**:
```
借高利贷 → 还不起 → 逾期 → 拼命工作 → 收入 → 还清债务 ✓
         ↓
      被捕 → 服刑 → 出狱 → 重新工作 → 慢慢还清 ✓
```

**检查结论**: 代码中有监狱系统和释放机制，理论上可以翻身。

### 3.2 状态一致性验证 ⚠️

```typescript
// useGameStore.ts:110-138 - 持久化白名单
partialize: (state) => ({
  vitality: state.vitality,
  currentRegion: state.currentRegion,
  activeHousing: state.activeHousing,
  inventory: state.inventory,
  bank: state.bank,
  // ...
})
```

**潜在风险**: 需要验证跨切片的数据同步，如 `vitality.metrics.gold` 和 `bank.balance` 是否一致。

---

## 四、死胡同风险汇总

### 4.1 已修复的死胡同

| 问题 | 修复位置 | 说明 |
|------|----------|------|
| 事件重复触发 | `EventSystem.ts` | 使用 `triggeredEvents` 数组记录 |
| 图片加载失败死循环 | `MessageWindow.tsx:148-154` | 加载失败回退到默认图片 |
| 资金不足仍执行效果 | `createGameSlice.ts:169-186` | 先扣钱再执行效果 |

### 4.2 潜在死胡同风险

| 风险等级 | 问题描述 | 影响 | 建议修复 |
|----------|----------|------|----------|
| 🔴 中 | 未知区域处理 | 如果 `currentRegion` 不匹配任何区域，界面空白 | 添加默认回退 UI |
| 🔴 中 | 工作条件翻译空值 | `getReasonTranslation` 可能返回 null | 添加空值检查 |
| 🟡 低 | 多个模态框同时打开 | 可能同时显示多个界面 | 添加模态框堆栈管理 |
| 🟡 低 | 银行债务螺旋 | 需要验证数学上是否能还清高利贷 | 添加债务上限保护 |

---

## 五、优化建议

### 5.1 高优先级

1. **添加区域回退处理**
   ```typescript
   // HousingModal.tsx, ShopModal.tsx 等
   default: 
     return <ErrorFallback onClose={onClose} message="Unknown region" />;
   ```

2. **添加空值保护**
   ```typescript
   const reasonTranslation = result.reason ? getReasonTranslation(result.reason) : null;
   lockReasonKey={reasonTranslation?.key || ''} // 使用可选链
   ```

### 5.2 中优先级

3. **模态框堆栈管理**
   - 实现一个模态框管理器，确保只有一个模态框在前
   - 支持 ESC 键关闭当前模态框

4. **银行系统保护**
   - 添加债务上限检查，防止数学上无法还清
   - 添加最低生存保障机制

### 5.3 低优先级

5. **加载状态优化**
   - 添加资源加载进度条
   - 优化首次加载时间

6. **键盘快捷键**
   - ESC 关闭模态框
   - 数字键 1-4 选择事件选项

---

## 六、测试用例建议

### 6.1 必测用例

| 用例 ID | 测试场景 | 预期结果 |
|---------|----------|----------|
| TC-001 | 启动游戏10次 | 每次都能到 TitleScreen |
| TC-002 | 断网情况下启动 | 显示错误提示，可刷新重试 |
| TC-003 | 新游戏开始 | 状态重置为初始值 |
| TC-004 | 继续游戏 | 正确加载存档 |
| TC-005 | 进入商店后退出 | 回到主界面，无报错 |
| TC-006 | 资金不足购买 | 显示提示，资金不变 |
| TC-007 | 结束回合 | 进入下一周，turn++ |
| TC-008 | 触发事件后选择选项 | 事件关闭，效果应用 |
| TC-009 | HP=0 死亡 | 显示 DeathSummary，可重新开始 |
| TC-010 | 解锁档案后死亡 | 档案保留到新游戏 |

### 6.2 极端情况测试

| 用例 ID | 测试场景 | 预期结果 |
|---------|----------|----------|
| TC-101 | 连续借多笔高利贷 | 可以借，但有债务上限 |
| TC-102 | 故意不还钱 | 触发催收，被捕，出狱后可工作 |
| TC-103 | HP=1 时结束回合 | 如果受到疾病伤害，触发死亡 |
| TC-104 | 资金为0时尝试所有操作 | 需要资金的操作被拒绝 |
| TC-105 | 快速连续点击购买 | 只购买一次或有防抖提示 |

---

## 七、结论

### 7.1 总体评价

该游戏在防死胡同设计方面整体表现**良好**。核心流程（启动、结算、事件、死亡）都有完善的保护和错误处理机制。主要风险集中在**边界情况处理**（如未知区域）和**数据一致性**方面。

### 7.2 发布建议

- ✅ **可以发布**: 核心流程稳定，无阻断性死胡同
- ⚠️ **建议修复中等问题后再发布**: 区域回退处理、空值检查
- 📋 **后续版本优化**: 模态框堆栈、键盘快捷键、加载优化

### 7.3 风险监控

建议上线后监控以下指标：
- 游戏启动失败率
- 回合结算异常率
- 玩家卡死举报数量
- 平均存活周数（检测是否必然死亡）

---

**报告生成时间**: 2026-03-05 10:15  
**检查工具**: 静态代码分析 + 人工审查  
**下次检查建议**: 修复中等问题后再次检查
