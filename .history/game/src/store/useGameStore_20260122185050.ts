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
import { loadAllGameData, createItemMap, createEventMap, createBillMap, createArchiveMap, createEndingMap } from '@/utils/dataLoader';

// --- 数值配置 ---
const CLASS_SETTINGS = {
  [PlayerClass.Homeless]: { baseSalary: 50, monthlyCost: 0, leverage: 0.1 },
  [PlayerClass.Worker]: { baseSalary: 3200, monthlyCost: 2400, leverage: 1.0 },
  [PlayerClass.Middle]: { baseSalary: 12000, monthlyCost: 7500, leverage: 5.0 },
  [PlayerClass.Capitalist]: { baseSalary: 80000, monthlyCost: 16000, leverage: 200.0 },
};

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
  dismissRoastAndEndEvent: () => void; // 👈 新增：手动关闭吐槽并结束事件
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
        });
      },

      initializeData: async () => {
        if (gameDataCache) return;
        try {
          const data = await loadAllGameData();
          gameDataCache = {
            ...data,
            itemMap: createItemMap(data.items),
            eventMap: createEventMap(data.events),
            billMap: createBillMap(data.bills),
            archiveMap: createArchiveMap(data.archives),
            endingMap: createEndingMap(data.endings),
          };
          console.log('[Store] Data initialized');
        } catch (error) {
          console.error('[Store] Failed to load data:', error);
        }
      },

      shopItems: () => {
        if (!gameDataCache) return [];
        const { gold } = get();
        return gameDataCache.items.filter((item: Item) => {
          if (item.price < 0) {
             if (item.unlockCondition === "Gold < 0" && gold >= 0) return false;
             return true;
          }
          return true; 
        });
      },

      // --- 核心循环 ---
      nextDay: () => {
        const state = get();
        if (!gameDataCache) return;
        
        // 0. 胜利判定
        if (state.day >= 40 && state.hp > 0) {
            set({ ending: 'ED-06' });
            return;
        }

        const isFirstDay = state.day === 0;
        const currentClassData = CLASS_SETTINGS[state.currentClass];
        const notes: string[] = []; 
        const log: string[] = [];

        let newHp = state.hp;
        let newGold = state.gold;
        let bill = null;
        let billAmount = 0;
        let salary = 0;

        if (!isFirstDay) {
            // 1. 扣除月度固定开销
            if (currentClassData.monthlyCost > 0) {
                newGold -= currentClassData.monthlyCost;
                log.push(`月常: -$${currentClassData.monthlyCost}`);
            }
            
            // 🚨 [已移除] Homeless 的 "严寒: HP-10" Debuff

            // 2. 计算薪资
            salary = calcSalary(currentClassData.baseSalary, state.san);
            newGold += salary;

            // 3. 触发账单
            bill = triggerBill(newGold, state.san, state.currentClass, gameDataCache.bills);
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

            // 4. 债务代偿机制
            if (newGold < 0) {
                const debt = Math.abs(newGold);
                const debtDmg = Math.floor(debt / 10); 
                if (debtDmg > 0) {
                    newHp -= debtDmg;
                    log.push(`债务惩罚: HP-${debtDmg}`);
                    notes.push(`无法支付债务，系统提取了你的生命值 (-${debtDmg} HP)`);
                }
            }

            // 5. 人体拆解检查
            const dismantleResult = humanDismantlementCheck(state.currentClass, state.flags.debtDays, newGold);
            if (dismantleResult?.triggered && dismantleResult.type === 'PASSIVE') {
                 newGold = dismantleResult.changes.goldSetTo;
                 notes.push("你被强制进行了人体拆解手术以抵债。");
            }
        }

        // 6. 更新阶级
        const newClass = checkClassUpdate(newGold);
        if (newClass !== state.currentClass) {
            log.push(`阶级变更: ${newClass}`);
            notes.push(`阶级变更: ${newClass}`);
        }

        // 7. 死亡检查
        if (newHp <= 0) {
            set({ ending: 'ED-01' });
            return;
        }

        // 8. 随机事件
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
        
        const P = calcPressure(state.san);

        // 1. 获取选项配置
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

        // 2. 计算金钱
        let deltaGold = calcDynamicGold(baseGold, mode, state.currentClass, CLASS_SETTINGS);

        // 🚨 [已移除] Middle Class 的 Option C 价格翻倍 Debuff

        // 3. 计算 HP 和 SAN
        let deltaHp = baseHp;
        let deltaSan = baseSan;

        if ((optionId === 'A' || optionId === 'D') && baseHp < 0) {
            deltaHp = Math.floor(baseHp * P);
        }

        // 🚨 [已移除] Capitalist 的 Option D SAN 变化翻倍 Debuff

        // 触发吐槽
        if (optionConfig.roast) {
          get().setRoast(optionConfig.roast); 
        }

        let newInventory = [...state.inventory];
        let newArchives = [...state.unlockedArchives];
        const newFlags = { ...state.flags };

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
                const deathEnding = resolveEnding({ ...state, hp: state.hp + deltaHp }, optionConfig.effects.deathReason);
                if (deathEnding) {
                    set({ ending: deathEnding });
                    return;
                }
            }
        }

        const finalHp = clamp(state.hp + Math.floor(deltaHp), 0, state.maxHp);
        const finalSan = clamp(state.san + deltaSan, 0, 100);
        const finalGold = state.gold + Math.floor(deltaGold);

        if (finalHp <= 0) {
            set({ ending: 'ED-05' }); 
            return;
        }
        
        const endingId = resolveEnding({ ...state, hp: finalHp, san: finalSan, gold: finalGold });
        if (endingId) { set({ ending: endingId }); return; }
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
      dismissRoastAndEndEvent: () => {
      const { viewingArchive } = get();
  
      // 👈 核心修改逻辑
      if (viewingArchive) {
        // 场景 A: 有关联档案 -> 关闭吐槽和事件，但立即打开档案机
        set({ 
          currentRoast: null, 
          currentEvent: null,
          isArchiveOpen: true  // 自动开启 BlackBox
        });
      } else {
        // 场景 B: 无档案 -> 正常关闭所有
        set({ 
          currentRoast: null, 
          currentEvent: null 
        });
      }
    },
      buyItem: (itemId) => {
        // ... (保持原样，未修改)
        const state = get();
        if (!gameDataCache) return;
        
        const item = gameDataCache.itemMap.get(itemId);
        if (!item) return;

        let newGold = state.gold;
        let newHp = state.hp;
        let newMaxHp = state.maxHp;
        let newSan = state.san;
        let newInventory = [...state.inventory];
        let newFlags = { ...state.flags };

        if (itemId === 'D05') { 
            if (newGold < 0) newGold = 0; 
            newMaxHp -= 30;
            newHp -= 30;
            get().addNotification('手术成功...如果你能叫这成功的话', 'warning');
        } else if (itemId === 'D01') { 
            newGold += 40; 
            newHp -= 15;
            get().addNotification('献血换来了$40和一阵眩晕', 'warning');
        } else if (itemId === 'I13') { 
            newGold -= item.price;
            newSan += 1;
            if (Math.random() < 0.01) {
                newGold += 5000;
                get().addNotification('中奖了！不可思议！+$5000', 'success');
            } else {
                get().addNotification('谢谢惠顾', 'info');
            }
        } else {
            if (newGold < item.price) {
                get().addNotification('资金不足', 'error');
                return;
            }
            newGold -= item.price;
            newHp += item.effects.hp || 0;
            newSan += item.effects.san || 0;
            newMaxHp += item.effects.maxHp || 0;
            
            if (!newInventory.includes(itemId)) {
                newInventory.push(itemId);
            }
            get().addNotification(`购买了 ${item.name}`, 'success');
        }

        if (newHp <= 0) {
             set({ ending: 'ED-02' });
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
      version: 13.0, // 更新版本号以防冲突
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version !== 13.0) return INITIAL_STATE as any;
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);