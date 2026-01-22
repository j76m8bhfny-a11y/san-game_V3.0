import { StateCreator } from 'zustand';
import { GameEvent, Bill, ScalingMode, PlayerClass } from '@/types/schema';
import { 
  checkClassUpdate, 
  calcSalary, 
  triggerBill, 
  humanDismantlementCheck, 
  clamp, 
  calcPressure, 
  calcDynamicGold 
} from '@/logic/core';
import { resolveEnding } from '@/logic/endings';

// --- 优化点 2: 将物品特殊效果抽离为独立的处理函数 ---
// 这样以后加新机制（比如股票），只需在这里加函数，不用动 buyItem 主逻辑
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
  // Vibe Coding 预留位：以后可以直接加 'STOCK_BUY': ...
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
    // 调用 UI 重置
    get().setShopOpen(false);
    get().setInventoryOpen(false);
    get().setArchiveOpen(false);
    get().setMenuOpen(false);
    get().setRoast(null);
  },

  nextDay: () => {
    const state = get();
    const { gameDataCache } = state;
    if (!gameDataCache) return;
    
    const { global, classMap, bills, events } = gameDataCache; // 优化点 1: 直接解构 classMap
    const globalRules = global.gameRules;

    if (state.day >= globalRules.maxDays && state.hp > globalRules.victoryHpThreshold) {
        state.triggerEnding('ED-06');
        return;
    }

    const isFirstDay = state.day === 0;
    
    // 优化: 使用 classMap O(1) 查找，而不是 find O(n)
    const currentClassData = classMap[state.currentClass] || classMap[PlayerClass.Homeless];

    const notes: string[] = []; 
    const log: string[] = [];
    let newHp = state.hp;
    let newGold = state.gold;
    let bill = null;
    let billAmount = 0;
    let salary = 0;

    if (!isFirstDay) {
        if (currentClassData.monthlyCost > 0) {
            newGold -= currentClassData.monthlyCost;
            log.push(`月常: -$${currentClassData.monthlyCost}`);
        }
        salary = calcSalary(currentClassData.baseSalary, state.san, global.salaryConfig);
        newGold += salary;

        bill = triggerBill(newGold, state.san, state.currentClass, bills, global.billConfig);
        if (bill) {
            billAmount = bill.amount;
            newGold += billAmount;
            if (bill.effects?.hp) {
                newHp += bill.effects.hp;
                notes.push(`环境伤害: HP ${bill.effects.hp}`); 
                log.push(`账单扣血: ${bill.effects.hp}`);      
            }
            notes.push(`新增账单: ${bill.name} (${bill.amount})`);
        }

        if (newGold < 0) {
            const debt = Math.abs(newGold);
            const debtDmg = Math.floor(debt / 10); 
            if (debtDmg > 0) {
                newHp -= debtDmg;
                log.push(`债务惩罚: HP-${debtDmg}`);
                notes.push(`无法支付债务 (-${debtDmg} HP)`);
            }
        }

        const dismantleResult = humanDismantlementCheck(state.currentClass, state.flags.debtDays, newGold);
        if (dismantleResult?.triggered && dismantleResult.type === 'PASSIVE') {
             newGold = dismantleResult.changes.goldSetTo;
             notes.push("你被强制进行了人体拆解手术以抵债。");
        }
    }

    // 优化: 传入 classMap 而不是整个 classes 数组
    const newClass = checkClassUpdate(newGold, gameDataCache.classes); 
    if (newClass !== state.currentClass) {
        log.push(`阶级变更: ${newClass}`);
        notes.push(`阶级变更: ${newClass}`);
    }

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

    const availableEvents = events.filter((event: GameEvent) => {
      const { conditions } = event;
      if (conditions.minSan !== undefined && state.san < conditions.minSan) return false;
      if (conditions.maxSan !== undefined && state.san > conditions.maxSan) return false;
      if (conditions.requiredClass && !conditions.requiredClass.includes(newClass)) return false;
      if (conditions.hasItem && !state.inventory.includes(conditions.hasItem)) return false;
      return true;
    });

    let randomEvent = availableEvents.length > 0 
        ? availableEvents[Math.floor(Math.random() * availableEvents.length)] 
        : null;

    // 优化点 3: 兜底逻辑
    // 理想情况下，FALLBACK_EVENT 应该在 global.json 里配置。这里暂时保留结构，但清理了代码。
    if (!randomEvent && !isFirstDay) {
        console.warn("[Game] No event matched, triggering fallback.");
        randomEvent = {
             id: 'FALLBACK_EVENT',
             title: '平淡的一天',
             bgImage: '/assets/scenes/city_morning.png',
             text: { lowSan: '...', highSan: '无事发生。' },
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
            expenses: currentClassData.monthlyCost + Math.abs(billAmount),
            notes: notes
        },
    });
    
    state.updatePlayerStats({
        day: state.day + 1,
        gold: newGold,
        hp: clamp(newHp, 0, state.maxHp),
        currentClass: newClass,
        history: [...state.history, `Month ${state.day + 1}: ${log.join(', ')}`]
    });
  },

  chooseOption: (optionId) => {
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

    // 优化点 1: 直接使用 SystemSlice 里已经生成好的 classMap
    // 不需要再 reduce 重复计算了！
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

    // 临时对象用于计算变更
    const updates = {
        newGold: state.gold,
        newHp: state.hp,
        newMaxHp: state.maxHp,
        newSan: state.san,
        newInventory: [...state.inventory]
    };

    // 1. 检查资金
    const isDebtAllowed = item.activeEffect && (item.activeEffect.type === 'SURGERY' || item.price < 0);
    if (!isDebtAllowed && updates.newGold < item.price) {
        state.addNotification('资金不足', 'error');
        return;
    }

    // 2. 基础结算
    updates.newGold -= item.price;
    updates.newHp += item.effects.hp || 0;
    updates.newSan += item.effects.san || 0;
    updates.newMaxHp += item.effects.maxHp || 0;

    // 3. 激活特殊效果 (使用 handler 映射表，代码更干净)
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

    // 统一提交变更
    state.updatePlayerStats({
        gold: updates.newGold,
        hp: clamp(updates.newHp, 0, updates.newMaxHp),
        maxHp: updates.newMaxHp,
        san: clamp(updates.newSan, 0, 100),
        inventory: updates.newInventory
    });
  }
});