import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  GameState,
  PlayerClass,
  Item,
  GameEvent,
  GameNotification,
  ScalingMode
} from '@/types/schema';

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
import { 
  loadAllGameData, 
  createItemMap, 
  createEventMap, 
  createBillMap, 
  createArchiveMap, 
  createEndingMap 
} from '@/utils/dataLoader';

// --- Actions 接口 ---
interface GameActions {
  nextDay: () => void;
  chooseOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  buyItem: (itemId: string) => void;
  resolveBill: () => void;
  
  setShopOpen: (isOpen: boolean) => void;
  setInventoryOpen: (isOpen: boolean) => void;
  setArchiveOpen: (isOpen: boolean) => void;
  setMenuOpen: (isOpen: boolean) => void;
  setRoast: (content: string | null) => void;
  setViewingArchive: (archiveId: string | null) => void;
  closeDailySummary: () => void;

  addNotification: (message: string, type?: GameNotification['type']) => void;
  removeNotification: (id: string) => void;

  shopItems: () => Item[];
  
  setHydrated: () => void;
  resetGame: () => void;
  initializeData: () => Promise<void>;
  
  dismissRoastAndEndEvent: () => void;
  triggerEnding: (endingId: string) => void;
}

type GameStore = GameState & GameActions;

const INITIAL_STATE: Omit<GameState, '_hasHydrated'> = {
  day: 0,
  hp: 100,
  maxHp: 100,
  san: 50,
  gold: 100,
  currentClass: PlayerClass.Worker,
  
  currentEvent: null,
  activeBill: null,
  ending: null,
  dailySummary: null,
  
  inventory: [],
  history: [],
  unlockedArchives: [],
  achievedEndings: [],
  
  flags: { isHomeless: false, debtDays: 0, hasRedBook: false, hasCryptoKey: false },
  points: { red: 0, wolf: 0, old: 0 },

  isShopOpen: false,
  isInventoryOpen: false,
  isArchiveOpen: false,
  isMenuOpen: false,
  currentRoast: null,
  notifications: [],
  viewingArchive: null
};

// 数据缓存（包含 Global, Classes, Items 等所有 JSON 数据）
let gameDataCache: any = null;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      _hasHydrated: false,

      // --- UI Actions ---
      setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
      setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
      setArchiveOpen: (isOpen) => set({ 
        isArchiveOpen: isOpen,
        viewingArchive: isOpen ? get().viewingArchive : null 
      }),
      setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
      setRoast: (content) => set({ currentRoast: content }),
      setViewingArchive: (archiveId) => set({ viewingArchive: archiveId }),
      closeDailySummary: () => set({ dailySummary: null }),

      addNotification: (message, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
          notifications: [...state.notifications, { id, message, type }]
        }));
        setTimeout(() => get().removeNotification(id), 3000);
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      resolveBill: () => set({ activeBill: null }),
      setHydrated: () => set({ _hasHydrated: true }),
      
      resetGame: () => {
        set({
          ...INITIAL_STATE,
          day: 0,
          _hasHydrated: true,
          ending: null,
          isShopOpen: false,
          isInventoryOpen: false,
          isArchiveOpen: false,
          isMenuOpen: false,
          activeBill: null,
          dailySummary: null,
          currentEvent: null,
          inventory: [],
          history: [],
          achievedEndings: get().achievedEndings, // 保留解锁的结局
        });
      },

      initializeData: async () => {
        if (gameDataCache) return;
        try {
          const data = await loadAllGameData();
          
          // 构建 Class Map 方便通过 ID (WORKER/MIDDLE) 快速查找配置
          const classMap = data.classes.reduce((acc: any, cur: any) => {
            acc[cur.id] = cur;
            return acc;
          }, {});

          gameDataCache = {
            ...data,
            classMap, 
            itemMap: createItemMap(data.items),
            eventMap: createEventMap(data.events),
            billMap: createBillMap(data.bills),
            archiveMap: createArchiveMap(data.archives),
            endingMap: createEndingMap(data.endings),
          };
          console.log('[Store] Data initialized with Global Config');
        } catch (error) {
          console.error('[Store] Failed to load data:', error);
        }
      },

      shopItems: () => {
        if (!gameDataCache) return [];
        const { gold } = get();
        return gameDataCache.items.filter((item: Item) => {
          // 处理特殊解锁条件 (简单逻辑)
          if (item.unlockCondition === "Gold < 0" && gold >= 0) return false;
          return true; 
        });
      },

      triggerEnding: (endingId: string) => {
        const { achievedEndings } = get();
        const currentAchieved = achievedEndings || [];
        
        const newAchieved = currentAchieved.includes(endingId) 
          ? currentAchieved 
          : [...currentAchieved, endingId];
          
        set({ 
          ending: endingId,
          achievedEndings: newAchieved
        });
      },

      dismissRoastAndEndEvent: () => {
        const { viewingArchive } = get();
        if (viewingArchive) {
          set({ 
            currentRoast: null, 
            currentEvent: null,
            isArchiveOpen: true 
          });
        } else {
          set({ 
            currentRoast: null, 
            currentEvent: null 
          });
        }
      },

      // --- 核心循环 (Refactored) ---
      nextDay: () => {
        const state = get();
        if (!gameDataCache) return;
        
        const { global, classMap, classes, bills } = gameDataCache;

        // 0. 胜利判定 (依赖 Global Config)
        if (state.day >= global.gameRules.maxDays && state.hp > global.gameRules.victoryHpThreshold) {
            get().triggerEnding('ED-06'); // 或根据条件判断具体生存结局
            return;
        }

        const isFirstDay = state.day === 0;
        const currentClassData = classMap[state.currentClass] || classMap[PlayerClass.Homeless];
        const notes: string[] = []; 
        const log: string[] = [];

        let newHp = state.hp;
        let newGold = state.gold;
        let bill = null;
        let billAmount = 0;
        let salary = 0;

        if (!isFirstDay) {
            // 1. 扣除月常开销 (依赖 Classes Config)
            if (currentClassData.monthlyCost > 0) {
                newGold -= currentClassData.monthlyCost;
                log.push(`月常: -$${currentClassData.monthlyCost}`);
            }
            
            // 2. 计算薪资 (依赖 Global Salary Config)
            salary = calcSalary(currentClassData.baseSalary, state.san, global.salaryConfig);
            newGold += salary;

            // 3. 触发账单 (依赖 Global Bill Config)
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

        if (newHp <= 0) {
            // 💀 修复：传入 maxDays 且指定 'HP' 原因，允许随时死亡
            const deathEnding = resolveEnding(
                { ...state, hp: newHp }, 
                gameDataCache.endings, 
                global.gameRules.maxDays, 
                'HP'
            );
            get().triggerEnding(deathEnding || 'ED-01');
            return;
        }

        // 7. 事件筛选
        const availableEvents = gameDataCache.events.filter((event: GameEvent) => {
          const { conditions } = event;
          if (conditions.minSan !== undefined && state.san < conditions.minSan) return false;
          if (conditions.maxSan !== undefined && state.san > conditions.maxSan) return false;
          if (conditions.requiredClass && !conditions.requiredClass.includes(newClass)) return false;
          if (conditions.hasItem && !state.inventory.includes(conditions.hasItem)) return false;
          return true;
        });

        const randomEvent = availableEvents.length > 0 
            ? availableEvents[Math.floor(Math.random() * availableEvents.length)] 
            : null;

        set({
            day: state.day + 1,
            gold: newGold,
            hp: clamp(newHp, 0, state.maxHp),
            currentClass: newClass,
            activeBill: bill,
            currentEvent: randomEvent,
            dailySummary: isFirstDay ? null : {
                revenue: salary,
                expenses: currentClassData.monthlyCost + Math.abs(billAmount),
                notes: notes
            },
            history: [...state.history, `Month ${state.day + 1}: ${log.join(', ')}`]
        });
      },

      chooseOption: (optionId) => {
        const state = get();
        if (!state.currentEvent || !gameDataCache) return;
        
        const globalRules = gameDataCache.global.gameRules; // 获取全局规则
        
        const P = calcPressure(state.san, globalRules.pressureDivisor);
        const optionConfig = state.currentEvent.options[optionId];
        
        const baseGold = optionConfig.effects.gold || 0;
        const baseHp = optionConfig.effects.hp || 0;
        const baseSan = optionConfig.effects.san || 0;

        let mode = optionConfig.effects.scaling;
        if (!mode) {
             if (optionId === 'A') mode = ScalingMode.CLASS_LEVERAGE;
             else if (optionId === 'B') mode = ScalingMode.FIXED;
             else if (optionId === 'C' || optionId === 'D') mode = ScalingMode.INCOME_RATIO;
        }

        let deltaGold = calcDynamicGold(baseGold, mode, state.currentClass, gameDataCache.classMap);
        let deltaHp = baseHp;
        let deltaSan = baseSan;

        if ((optionId === 'A' || optionId === 'D') && baseHp < 0) {
            deltaHp = Math.floor(baseHp * P);
        }

        if (optionConfig.roast) {
          get().setRoast(optionConfig.roast); 
        }

        let newInventory = [...state.inventory];
        let newArchives = [...state.unlockedArchives];
        const newFlags = { ...state.flags };

        // 效果应用
        if (optionConfig) {
            if (optionConfig.effects.items) {
                optionConfig.effects.items.forEach(({ itemId, count }) => {
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
                get().addNotification(`解锁档案: ${optionConfig.archiveId}`, 'success');
                set({ viewingArchive: optionConfig.archiveId });
            }
            if (optionConfig.effects.deathReason) {
                // 💀 修复：选项导致的特殊死亡
                const deathEnding = resolveEnding(
                    { ...state, hp: state.hp + deltaHp }, 
                    gameDataCache.endings, 
                    globalRules.maxDays, 
                    optionConfig.effects.deathReason
                );
                if (deathEnding) {
                    get().triggerEnding(deathEnding);
                    return;
                }
            }
        }

        const finalHp = clamp(state.hp + Math.floor(deltaHp), 0, state.maxHp);
        const finalSan = clamp(state.san + deltaSan, 0, 100);
        const finalGold = state.gold + Math.floor(deltaGold);

        if (finalHp <= 0) {
            // 💀 修复：HP归零导致的通用死亡
            const deathEnding = resolveEnding(
                { ...state, hp: finalHp }, 
                gameDataCache.endings, 
                globalRules.maxDays, 
                'HP'
            );
            get().triggerEnding(deathEnding);
            return;
        }
        
        // 🏁 修复：常规结局检查（传入 maxDays 防止提前结束）
        const endingId = resolveEnding(
            { ...state, hp: finalHp, san: finalSan, gold: finalGold }, 
            gameDataCache.endings,
            globalRules.maxDays // 👈 这里是防止第一天就通关的关键
        );
        
        if (endingId) { 
          get().triggerEnding(endingId);
          return; 
        }
        
        const hasRoast = !!optionConfig.roast;

        set({
            hp: finalHp,
            san: finalSan,
            gold: finalGold,
            inventory: newInventory,
            unlockedArchives: newArchives,
            flags: newFlags,
            currentEvent: hasRoast ? state.currentEvent : null,
            history: [...state.history, `Option ${optionId}: HP${deltaHp.toFixed(1)} SAN${deltaSan} $${deltaGold}`]
        });
      },

      buyItem: (itemId) => {
        const state = get();
        if (!gameDataCache) return;
        
        const item = gameDataCache.itemMap.get(itemId);
        if (!item) return;

        let newGold = state.gold;
        let newHp = state.hp;
        let newMaxHp = state.maxHp;
        let newSan = state.san;
        let newInventory = [...state.inventory];
        const newFlags = { ...state.flags };

        // 1. 检查资金
        const isDebtAllowed = item.activeEffect && (item.activeEffect.type === 'SURGERY' || item.price < 0);
        
        if (!isDebtAllowed && newGold < item.price) {
            get().addNotification('资金不足', 'error');
            return;
        }

        // 2. 应用基础属性
        newGold -= item.price;
        newHp += item.effects.hp || 0;
        newSan += item.effects.san || 0;
        newMaxHp += item.effects.maxHp || 0;

        // 3. 应用通用 Active Effects
        if (item.activeEffect) {
            const { type, params } = item.activeEffect;
            
            switch (type) {
                case 'SURGERY': 
                    if (newGold < 0) newGold = 0; 
                    const dmg = params.damage || 30;
                    newMaxHp -= dmg;
                    newHp -= dmg;
                    get().addNotification(params.message || '手术成功...如果你能叫这成功的话', 'warning');
                    break;
                
                case 'BLOOD_DONATION': 
                    const gain = params.gold || 40;
                    const cost = params.hpCost || 15;
                    newGold += gain; 
                    newHp -= cost;
                    get().addNotification(params.message || '献血换来了现金', 'warning');
                    break;

                case 'LOTTERY': 
                    const winRate = params.winRate || 0.01;
                    const winPrize = params.winPrize || 5000;
                    if (Math.random() < winRate) {
                        newGold += winPrize;
                        get().addNotification(params.winMessage || '中奖了！不可思议！', 'success');
                    } else {
                        get().addNotification(params.loseMessage || '谢谢惠顾', 'info');
                    }
                    break;
                    
                default:
                    break;
            }
        } else {
            get().addNotification(`购买了 ${item.name}`, 'success');
        }

        if (!newInventory.includes(itemId)) {
            newInventory.push(itemId);
        }

        if (newHp <= 0) {
             const deathEnding = resolveEnding(
                 { ...state, hp: newHp }, 
                 gameDataCache.endings, 
                 gameDataCache.global.gameRules.maxDays, 
                 'HP'
             );
             get().triggerEnding(deathEnding);
             return;
        }

        set({
            gold: newGold,
            hp: clamp(newHp, 0, newMaxHp),
            maxHp: newMaxHp,
            san: clamp(newSan, 0, 100),
            inventory: newInventory,
            flags: newFlags
        });
      }
    }),
    {
      name: 'american-insight-storage',
      version: 13.2, // 升级版本号以重置潜在的错误状态
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version !== 13.2) return INITIAL_STATE as any;
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);