import { StateCreator } from 'zustand';
import { GameEvent, Bill, ScalingMode, PlayerClass, RegionID } from '@/types/schema';
import { 
  checkClassUpdate, 
  calcSalary, 
  triggerBill, 
  humanDismantlementCheck, 
  clamp, 
  calculateBillMitigation,
  calcPressure, 
  calcDynamicGold,
  checkMovePermission // 👈 引入新逻辑
} from '@/logic/core';
import { resolveEnding } from '@/logic/endings';

// --- Item Effect Handlers (保持不变) ---
const ItemEffectHandlers: Record<string, (params: any, state: any, updates: any) => void> = {
  'SURGERY': (params, state, updates) => {
    if (updates.newGold < 0) updates.newGold = 0;
    const dmg = params.damage || 30;
    updates.newMaxHp -= dmg;
    updates.newHp -= dmg;
    state.addNotification(params.message || '手术成功', 'warning');
  },
  'BLOOD_DONATION': (params, state, updates) => {
    const gain = params.gold || 40;
    const cost = params.hpCost || 15;
    updates.newGold += gain;
    updates.newHp -= cost;
    state.addNotification(params.message || '献血成功', 'warning');
  },
  'LOTTERY': (params, state, updates) => {
    const winRate = params.winRate || 0.01;
    const winPrize = params.winPrize || 5000;
    if (Math.random() < winRate) {
        updates.newGold += winPrize;
        state.addNotification(params.winMessage || '中奖了！', 'success');
    } else {
        state.addNotification(params.loseMessage || '谢谢惠顾', 'info');
    }
  },
};

export interface GameSlice {
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  dailySummary: {
    revenue: number;
    expenses: number;
    notes: string[];
  } | null;
  
  nextDay: () => void;
  chooseOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  buyItem: (itemId: string) => void;
  
  // 🗺️ 新增: 尝试移动区域
  attemptMove: (targetRegion: RegionID) => void;
  
  resolveBill: () => void;
  closeDailySummary: () => void;
  resetGame: () => void;
}

export const createGameSlice: StateCreator<any, [], [], GameSlice> = (set, get) => ({
  currentEvent: null,
  activeBill: null,
  dailySummary: null,

  resolveBill: () => set({ activeBill: null }),
  closeDailySummary: () => set({ dailySummary: null }),

  resetGame: () => {
    get().resetPlayerState();
    set({
      currentEvent: null,
      activeBill: null,
      dailySummary: null,
    });
    get().setShopOpen(false);
    get().setInventoryOpen(false);
    get().setArchiveOpen(false);
    get().setMenuOpen(false);
    get().setRoast(null);
  },

  // 🗺️ 实现移动逻辑
  attemptMove: (targetRegion) => {
    const state = get();
    
    // 如果已经在该区域，不做操作
    if (state.currentRegion === targetRegion) return;

    const { gameDataCache } = state;
    if (!gameDataCache) return;

    // 1. 调用逻辑层检查权限
    const check = checkMovePermission(
      targetRegion, 
      state.currentClass, 
      state.inventory, 
      gameDataCache.itemMap
    );

    // 2. 处理结果
    if (check.allowed) {
      // 允许移动
      state.setRegion(targetRegion);
      state.addNotification(`进入区域: ${targetRegion}`, 'success');
      
      // 可选：移动可以消耗少量 SAN 或时间，这里暂不处理
    } else {
      // 拒绝移动
      state.addNotification(check.reason || '无法进入该区域', 'error');
      // 这里可以播放一个拒绝的音效 playSfx('sfx_deny')
    }
  },

  nextDay: () => {
    const state = get();
    const { gameDataCache } = state;
    if (!gameDataCache) return;
    
    const { global, classMap, bills, events, itemMap } = gameDataCache;
    const globalRules = global.gameRules;

    // 1. 胜利判定
    if (state.day >= globalRules.maxDays && state.hp > globalRules.victoryHpThreshold) {
        state.triggerEnding('ED-06');
        return;
    }

    const isFirstDay = state.day === 0;
    const currentClassData = classMap[state.currentClass] || classMap[PlayerClass.Homeless];

    const notes: string[] = []; 
    const log: string[] = [];
    let newHp = state.hp;
    let newGold = state.gold;
    let newSan = state.san;
    let bill = null;
    let billAmount = 0;
    let salary = 0;

    // --- ⬇️ 核心经济逻辑重写 ⬇️ ---

    if (!isFirstDay) {
        // A. 固定开销 (房租 + 医保)
        const rentCost = state.activeHousing?.dailyCost || 0;
        const insuranceCost = state.activeInsurance?.dailyCost || 0;
        const totalFixedCost = rentCost + insuranceCost;

        // B. 违约判定 (付不起房租)
        if (rentCost > 0 && newGold < rentCost) {
            // 💀 触发驱逐逻辑
            log.push(`违约: 失去房产与工作`);
            notes.push(`[严重] 资金不足以支付房租，你被房东赶了出来！失去住所和工作。`);
            
            // 强制扣除剩余资金（或者不扣，直接赶走，这里选择不扣钱但重置状态）
            // newGold -= rentCost; // 可选：是否还要扣成负数？
            
            // 重置状态
            set({ activeHousing: null, activeJob: null });
            // 医保可能还会保留，只要付得起
        } else {
            // 正常扣费
            if (totalFixedCost > 0) {
                newGold -= totalFixedCost;
                log.push(`固定开销: -$${totalFixedCost}`);
                if (insuranceCost > 0) notes.push(`医保扣费: -$${insuranceCost}`);
                if (rentCost > 0) notes.push(`房租扣费: -$${rentCost}`);
            }
        }
        
        // C. 工作产出 (Job Salary)
        // 逻辑：如果有工作，领工作薪资；没工作，领低保(如果是流浪汉)
        let baseSalary = 0;
        if (state.activeJob) {
            baseSalary = state.activeJob.salary;
            // 工作可能消耗 SAN (可选，如果 activeJob 有 sanCost)
            if (state.activeJob.sanCost) {
                newSan -= state.activeJob.sanCost;
                // log.push(`工作劳累: SAN -${state.activeJob.sanCost}`);
            }
        } else if (state.currentClass === PlayerClass.Homeless) {
            // 流浪汉低保 (保持原有的 class baseSalary 作为低保)
            baseSalary = currentClassData.baseSalary; 
        }

        // 应用 SAN 值效率修正 (打工人心情不好效率低)
        salary = calcSalary(baseSalary, newSan, global.salaryConfig);
        newGold += salary;

        // --- 3. (新) 加密市场夜间结算 ---

        if (gameDataCache.news) {
        // 调用 CryptoSlice 的结算函数
        const marketResult = state.processNightlyMarket(gameDataCache.news);
        
        // 合并日志和笔记
        if (marketResult.logs.length > 0) log.push(...marketResult.logs);
        if (marketResult.notes.length > 0) notes.push(...marketResult.notes);
    }
        
        // D. 账单触发与减免
        // 收集背包里的载具 Tag
        const vehicleTags = state.inventory
            .map((id: string) => itemMap.get(id)?.tags || [])
            .flat()
            .filter((t: string) => t.startsWith('VEHICLE'));

        bill = triggerBill(
            newGold, newSan, state.currentClass, bills, global.billConfig,
            { housing: state.activeHousing, vehicleTags }
        );

        if (bill) {
            // 计算减免
            const mitigation = calculateBillMitigation(bill, state.activeHousing, state.activeInsurance);
            billAmount = mitigation.finalAmount; // 这是一个负数或0 (如果bill.amount是负数)
            
            // 注意：bill.amount 在 json 里通常定义为负数 (e.g. -500)，或者正数代表扣除？
            // 假设 json 里 amount 是 -500。
            // 如果 mitigation 也是负数，直接加。
            newGold += billAmount;

            if (mitigation.mitigated) {
                notes.push(`${mitigation.reason}: 减免至 ${Math.abs(billAmount)}`);
            } else {
                notes.push(`新增账单: ${bill.name} (${billAmount})`);
            }

            // 账单造成的额外伤害 (如 HP/SAN)
            // 这里也可以加入房产防御逻辑 (比如豪宅减少 HP 伤害)
            if (bill.effects?.hp) {
                newHp += bill.effects.hp;
                log.push(`账单伤害: HP${bill.effects.hp}`);
            }
        }

        // E. 负债与惩罚 (保持不变)
        if (newGold < 0) {
            const debt = Math.abs(newGold);
            const debtDmg = Math.floor(debt / 10); 
            if (debtDmg > 0) {
                newHp -= debtDmg;
                log.push(`债务惩罚: HP-${debtDmg}`);
                notes.push(`无法支付债务 (-${debtDmg} HP)`);
            }
        }

        // F. 人体拆解 (保持不变)
        const dismantleResult = humanDismantlementCheck(state.currentClass, state.flags.debtDays, newGold);
        if (dismantleResult?.triggered && dismantleResult.type === 'PASSIVE') {
             newGold = dismantleResult.changes.goldSetTo;
             notes.push("你被强制进行了人体拆解手术以抵债。");
        }
    }

    // 2. 阶级更新
    const newClass = checkClassUpdate(newGold, gameDataCache.classes); 
    if (newClass !== state.currentClass) {
        log.push(`阶级变更: ${newClass}`);
        notes.push(`阶级变更: ${newClass}`);
    }

    // 3. 死亡判定
    if (newHp <= 0) {
        const deathEnding = resolveEnding(
            { ...state, hp: newHp }, 
            gameDataCache.endings, 
            globalRules.maxDays, 
            'HP'
        );
        state.triggerEnding(deathEnding || 'ED-01');
        return;
    }

    // 4. 事件生成 (保持 Phase 2-Part 1 的逻辑)
    const availableEvents = events.filter((event: GameEvent) => {
      const { conditions } = event;
      if (conditions.minSan !== undefined && newSan < conditions.minSan) return false;
      if (conditions.maxSan !== undefined && newSan > conditions.maxSan) return false;
      if (conditions.requiredClass && !conditions.requiredClass.includes(newClass)) return false;
      if (conditions.hasItem && !state.inventory.includes(conditions.hasItem)) return false;
      // 区域过滤
      if (conditions.region && conditions.region !== state.currentRegion) return false;
      return true;
    });

    let randomEvent = availableEvents.length > 0 
        ? availableEvents[Math.floor(Math.random() * availableEvents.length)] 
        : null;

    if (!randomEvent) {
        randomEvent = {
             id: 'FALLBACK_EVENT',
             title: '平淡的一天',
             bgImage: '/assets/scenes/city_morning.png',
             text: { lowSan: '...', highSan: '今天无事发生，但这平静让人不安。' },
             conditions: {},
             options: {
                A: { label: '休息', effects: { scaling: 'FIXED', hp: 5 } },
                B: { label: '发呆', effects: { scaling: 'FIXED', san: 2 } },
                C: { label: '...', effects: {} },
                D: { label: '...', effects: {} }
             }
        } as GameEvent;
    }

    set({
        activeBill: bill,
        currentEvent: randomEvent,
        dailySummary: isFirstDay ? null : {
            revenue: salary,
            expenses: Math.abs(billAmount), // 这里仅显示额外支出，固定支出已在 notes 里体现，或者你可以把 totalFixedCost 加进来
            notes: notes
        },
    });
    
    state.updatePlayerStats({
        day: state.day + 1,
        gold: newGold,
        hp: clamp(newHp, 0, state.maxHp),
        san: clamp(newSan, 0, 100), // 记得更新 San
        currentClass: newClass,
        history: [...state.history, `Day ${state.day + 1}: ${log.join(', ')}`]
    });
  },

  chooseOption: (optionId) => {
    // ... (chooseOption 逻辑保持不变，为了节省篇幅，这里未展示改动，因为它不涉及移动) ...
    // 但你需要确保在粘贴时，chooseOption 函数体是完整的。
    // 如果你需要我提供完整的 chooseOption 代码，请告诉我。
    // 这里为了安全，建议你只替换 attemptMove 和 nextDay 部分，或者我下面提供完整的 chooseOption 以防万一。
    const state = get();
    const { gameDataCache, currentEvent } = state;
    if (!currentEvent || !gameDataCache) return;
    
    const globalRules = gameDataCache.global.gameRules;
    const P = calcPressure(state.san, globalRules.pressureDivisor);
    const optionConfig = currentEvent.options[optionId];
    
    let mode = optionConfig.effects.scaling;
    if (!mode) {
         if (optionId === 'A') mode = ScalingMode.CLASS_LEVERAGE;
         else if (optionId === 'B') mode = ScalingMode.FIXED;
         else if (optionId === 'C' || optionId === 'D') mode = ScalingMode.INCOME_RATIO;
    }

    let deltaGold = calcDynamicGold(
        optionConfig.effects.gold || 0, 
        mode, 
        state.currentClass, 
        gameDataCache.classMap
    );
    
    let deltaHp = optionConfig.effects.hp || 0;
    let deltaSan = optionConfig.effects.san || 0;

    if ((optionId === 'A' || optionId === 'D') && deltaHp < 0) {
        deltaHp = Math.floor(deltaHp * P);
    }

    if (optionConfig.roast) {
      state.setRoast(optionConfig.roast); 
    }

    let newInventory = [...state.inventory];
    let newArchives = [...state.unlockedArchives];

    if (optionConfig) {
        if (optionConfig.effects.items) {
            optionConfig.effects.items.forEach(({ itemId, count }: any) => {
                if (count > 0) {
                     if (!newInventory.includes(itemId)) newInventory.push(itemId);
                } else {
                     const idx = newInventory.indexOf(itemId);
                     if (idx > -1) newInventory.splice(idx, 1);
                }
            });
        }
        if (optionConfig.archiveId && !newArchives.includes(optionConfig.archiveId)) {
            newArchives.push(optionConfig.archiveId);
            state.addNotification(`解锁档案: ${optionConfig.archiveId}`, 'success');
            state.setViewingArchive(optionConfig.archiveId);
        }
        if (optionConfig.effects.deathReason) {
            const deathEnding = resolveEnding(
                { ...state, hp: state.hp + deltaHp }, 
                gameDataCache.endings, 
                globalRules.maxDays, 
                optionConfig.effects.deathReason
            );
            if (deathEnding) {
                state.triggerEnding(deathEnding);
                return;
            }
        }
    }

    const finalHp = clamp(state.hp + Math.floor(deltaHp), 0, state.maxHp);
    const finalSan = clamp(state.san + deltaSan, 0, 100);
    const finalGold = state.gold + Math.floor(deltaGold);

    if (finalHp <= 0) {
        const deathEnding = resolveEnding(
            { ...state, hp: finalHp }, 
            gameDataCache.endings, 
            globalRules.maxDays, 
            'HP'
        );
        state.triggerEnding(deathEnding);
        return;
    }
    
    const endingId = resolveEnding(
        { ...state, hp: finalHp, san: finalSan, gold: finalGold }, 
        gameDataCache.endings,
        globalRules.maxDays
    );
    
    if (endingId) { 
      state.triggerEnding(endingId);
      return; 
    }
    
    const hasRoast = !!optionConfig.roast;
    set({ currentEvent: hasRoast ? state.currentEvent : null });

    state.updatePlayerStats({
        hp: finalHp,
        san: finalSan,
        gold: finalGold,
        inventory: newInventory,
        unlockedArchives: newArchives,
        history: [...state.history, `Option ${optionId}: HP${deltaHp.toFixed(1)} SAN${deltaSan} $${deltaGold}`]
    });
  },

  buyItem: (itemId) => {
    const state = get();
    const { gameDataCache } = state;
    if (!gameDataCache) return;
    
    const item = gameDataCache.itemMap.get(itemId);
    if (!item) return;

    const updates = {
        newGold: state.gold,
        newHp: state.hp,
        newMaxHp: state.maxHp,
        newSan: state.san,
        newInventory: [...state.inventory]
    };

    const isDebtAllowed = item.activeEffect && (item.activeEffect.type === 'SURGERY' || item.price < 0);
    if (!isDebtAllowed && updates.newGold < item.price) {
        state.addNotification('资金不足', 'error');
        return;
    }

    updates.newGold -= item.price;
    updates.newHp += item.effects.hp || 0;
    updates.newSan += item.effects.san || 0;
    updates.newMaxHp += item.effects.maxHp || 0;

    if (item.activeEffect) {
        const handler = ItemEffectHandlers[item.activeEffect.type];
        if (handler) {
            handler(item.activeEffect.params, state, updates);
        }
    } else {
        state.addNotification(`购买了 ${item.name}`, 'success');
    }

    if (!updates.newInventory.includes(itemId)) {
        updates.newInventory.push(itemId);
    }

    if (updates.newHp <= 0) {
         const deathEnding = resolveEnding(
             { ...state, hp: updates.newHp }, 
             gameDataCache.endings, 
             gameDataCache.global.gameRules.maxDays, 
             'HP'
         );
         state.triggerEnding(deathEnding);
         return;
    }

    state.updatePlayerStats({
        gold: updates.newGold,
        hp: clamp(updates.newHp, 0, updates.newMaxHp),
        maxHp: updates.newMaxHp,
        san: clamp(updates.newSan, 0, 100),
        inventory: updates.newInventory
    });
  }
});