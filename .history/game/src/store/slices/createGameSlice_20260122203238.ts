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

// 定义游戏逻辑切片的状态和方法
export interface GameSlice {
  // --- State (核心循环相关) ---
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  dailySummary: {
    revenue: number;
    expenses: number;
    notes: string[];
  } | null;
  
  // --- Actions ---
  nextDay: () => void;
  chooseOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  buyItem: (itemId: string) => void;
  
  resolveBill: () => void;
  closeDailySummary: () => void;
  
  // 全局重置 (调用各切片的重置逻辑)
  resetGame: () => void;
}

export const createGameSlice: StateCreator<any, [], [], GameSlice> = (set, get) => ({
  // --- Initial State ---
  currentEvent: null,
  activeBill: null,
  dailySummary: null,

  // --- Actions ---

  resolveBill: () => set({ activeBill: null }),
  
  closeDailySummary: () => set({ dailySummary: null }),

  resetGame: () => {
    // 1. 调用 Player 切片的重置
    get().resetPlayerState();
    
    // 2. 重置本切片状态
    set({
      currentEvent: null,
      activeBill: null,
      dailySummary: null,
    });
    
    // 3. 重置 UI 切片状态
    set({
      isShopOpen: false, 
      isInventoryOpen: false,
      isArchiveOpen: false,
      isMenuOpen: false,
      currentRoast: null,
      notifications: [],
      viewingArchive: null
    });
  },

  nextDay: () => {
    const state = get(); // 获取整个 Store (包含所有切片数据)
    const { gameDataCache } = state;
    
    // 如果数据没加载好，不能进行下一天
    if (!gameDataCache) return;
    
    const { global, classes, bills, events } = gameDataCache;
    const globalRules = global.gameRules;

    // 0. 胜利判定
    if (state.day >= globalRules.maxDays && state.hp > globalRules.victoryHpThreshold) {
        state.triggerEnding('ED-06'); // 生存结局
        return;
    }

    const isFirstDay = state.day === 0;
    
    // 从缓存的 classes 数组中找到当前职业的配置
    const currentClassData = classes.find((c: any) => c.id === state.currentClass) 
                             || classes.find((c: any) => c.id === PlayerClass.Homeless);

    const notes: string[] = []; 
    const log: string[] = [];

    let newHp = state.hp;
    let newGold = state.gold;
    let bill = null;
    let billAmount = 0;
    let salary = 0;

    if (!isFirstDay) {
        // 1. 扣除月常开销
        if (currentClassData.monthlyCost > 0) {
            newGold -= currentClassData.monthlyCost;
            log.push(`月常: -$${currentClassData.monthlyCost}`);
        }
        
        // 2. 计算薪资
        salary = calcSalary(currentClassData.baseSalary, state.san, global.salaryConfig);
        newGold += salary;

        // 3. 触发账单
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

        // 4. 债务与惩罚
        if (newGold < 0) {
            const debt = Math.abs(newGold);
            const debtDmg = Math.floor(debt / 10); 
            if (debtDmg > 0) {
                newHp -= debtDmg;
                log.push(`债务惩罚: HP-${debtDmg}`);
                notes.push(`无法支付债务，系统提取了你的生命值 (-${debtDmg} HP)`);
            }
        }

        // 5. 人体拆解被动触发
        const dismantleResult = humanDismantlementCheck(state.currentClass, state.flags.debtDays, newGold);
        if (dismantleResult?.triggered && dismantleResult.type === 'PASSIVE') {
             newGold = dismantleResult.changes.goldSetTo;
             notes.push("你被强制进行了人体拆解手术以抵债。");
        }
    }

    // 6. 阶级变更
    const newClass = checkClassUpdate(newGold, classes);
    if (newClass !== state.currentClass) {
        log.push(`阶级变更: ${newClass}`);
        notes.push(`阶级变更: ${newClass}`);
    }

    // 死亡检查 (提前拦截)
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

    // 7. 事件筛选
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

    // 兜底事件 (防止无事件可触发)
    if (!randomEvent && !isFirstDay) {
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

    // 更新 Player 和 Game 状态
    set({
        activeBill: bill,
        currentEvent: randomEvent,
        dailySummary: isFirstDay ? null : {
            revenue: salary,
            expenses: currentClassData.monthlyCost + Math.abs(billAmount),
            notes: notes
        },
    });
    
    // 更新 PlayerSlice 的数据
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
    
    const baseGold = optionConfig.effects.gold || 0;
    const baseHp = optionConfig.effects.hp || 0;
    const baseSan = optionConfig.effects.san || 0;

    let mode = optionConfig.effects.scaling;
    if (!mode) {
         if (optionId === 'A') mode = ScalingMode.CLASS_LEVERAGE;
         else if (optionId === 'B') mode = ScalingMode.FIXED;
         else if (optionId === 'C' || optionId === 'D') mode = ScalingMode.INCOME_RATIO;
    }

    // 为了兼容 calcDynamicGold，我们需要把数组转成 Map 形式或者直接传数组改逻辑
    // 这里简单起见，我们构建一个临时 Map
    const classMap = gameDataCache.classes.reduce((acc: any, cur: any) => {
        acc[cur.id] = cur; return acc; 
    }, {});
    
    let deltaGold = calcDynamicGold(baseGold, mode, state.currentClass, classMap);
    let deltaHp = baseHp;
    let deltaSan = baseSan;

    // A/D 选项受压力影响 HP 扣减
    if ((optionId === 'A' || optionId === 'D') && baseHp < 0) {
        deltaHp = Math.floor(baseHp * P);
    }

    // 设置吐槽
    if (optionConfig.roast) {
      state.setRoast(optionConfig.roast); 
    }

    // 处理物品和档案
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
        
        // 选项导致的特殊死亡
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

    // HP 归零死亡
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
    
    // 结局判定
    const endingId = resolveEnding(
        { ...state, hp: finalHp, san: finalSan, gold: finalGold }, 
        gameDataCache.endings,
        globalRules.maxDays
    );
    
    if (endingId) { 
      state.triggerEnding(endingId);
      return; 
    }
    
    // 更新是否继续显示事件 (如果有吐槽，保持显示)
    const hasRoast = !!optionConfig.roast;
    set({ currentEvent: hasRoast ? state.currentEvent : null });

    // 更新玩家数值
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

    let newGold = state.gold;
    let newHp = state.hp;
    let newMaxHp = state.maxHp;
    let newSan = state.san;
    let newInventory = [...state.inventory];

    // 1. 检查资金 (允许特殊物品负债购买)
    const isDebtAllowed = item.activeEffect && (item.activeEffect.type === 'SURGERY' || item.price < 0);
    
    if (!isDebtAllowed && newGold < item.price) {
        state.addNotification('资金不足', 'error');
        return;
    }

    // 2. 基础结算
    newGold -= item.price;
    newHp += item.effects.hp || 0;
    newSan += item.effects.san || 0;
    newMaxHp += item.effects.maxHp || 0;

    // 3. 激活特殊效果
    if (item.activeEffect) {
        const { type, params } = item.activeEffect;
        switch (type) {
            case 'SURGERY': 
                if (newGold < 0) newGold = 0; 
                const dmg = params.damage || 30;
                newMaxHp -= dmg;
                newHp -= dmg;
                state.addNotification(params.message || '手术成功', 'warning');
                break;
            case 'BLOOD_DONATION': 
                const gain = params.gold || 40;
                const cost = params.hpCost || 15;
                newGold += gain; 
                newHp -= cost;
                state.addNotification(params.message || '献血成功', 'warning');
                break;
            case 'LOTTERY': 
                const winRate = params.winRate || 0.01;
                const winPrize = params.winPrize || 5000;
                if (Math.random() < winRate) {
                    newGold += winPrize;
                    state.addNotification(params.winMessage || '中奖了！', 'success');
                } else {
                    state.addNotification(params.loseMessage || '谢谢惠顾', 'info');
                }
                break;
        }
    } else {
        state.addNotification(`购买了 ${item.name}`, 'success');
    }

    if (!newInventory.includes(itemId)) {
        newInventory.push(itemId);
    }

    // 购买导致的死亡 (如卖血过度)
    if (newHp <= 0) {
         const deathEnding = resolveEnding(
             { ...state, hp: newHp }, 
             gameDataCache.endings, 
             gameDataCache.global.gameRules.maxDays, 
             'HP'
         );
         state.triggerEnding(deathEnding);
         return;
    }

    state.updatePlayerStats({
        gold: newGold,
        hp: clamp(newHp, 0, newMaxHp),
        maxHp: newMaxHp,
        san: clamp(newSan, 0, 100),
        inventory: newInventory
    });
  }
});