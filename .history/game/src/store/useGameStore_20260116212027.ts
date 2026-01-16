import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';

import {
  GameState,
  PlayerClass,
  Item,
  GameEvent,
  GameNotification
} from '@/types/schema';

import { checkClassUpdate, calcSalary, triggerBill, pickEvent, humanDismantlementCheck } from '@/logic/core';
import { resolveEnding } from '@/logic/endings';

// 数据源
import CLASSES from '@/assets/data/classes.json';
import BILLS from '@/assets/data/bills.json';
import ITEMS from '@/assets/data/items.json';
import EVENTS from '@/assets/data/events.json';

interface GameActions {
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  resolveBill: () => void;
  
  setShopOpen: (isOpen: boolean) => void;
  setMenuOpen: (isOpen: boolean) => void;
  setArchiveOpen: (isOpen: boolean) => void;
  setInventoryOpen: (isOpen: boolean) => void;
  setViewingArchive: (id: string | null) => void;
  setRoast: (text: string | null) => void;

  setHydrated: () => void;
  resetGame: () => void;

  addNotification: (type: 'GOLD'|'HP'|'SAN', value: number, message: string) => void;
  removeNotification: (id: string) => void;
}

type GameStore = GameState & GameActions & { dailySummary: any; shopItems: Item[]; notifications: GameNotification[] };

// 初始状态定义
const INITIAL_STATE: Omit<GameState, '_hasHydrated'> = {
  day: 1,
  hp: 100,
  maxHp: 100,
  san: 50,
  gold: 100,
  currentClass: PlayerClass.Worker,
  
  currentEvent: null,
  activeBill: null,
  ending: null,
  
  inventory: [],
  history: [],
  unlockedArchives: [],
  
  flags: {
    isHomeless: false,
    debtDays: 0,
    hasRedBook: false,
    hasCryptoKey: false
  },
  
  points: { red: 0, wolf: 0, old: 0 },
  
  isShopOpen: false,
  isMenuOpen: false,
  isArchiveOpen: false,
  isInventoryOpen: false, // ✅ Added
  viewingArchive: null,   // ✅ Added

  lastAction: { type: 'NONE', id: 0 },
  currentRoast: null
};

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,
        _hasHydrated: false,
        shopItems: ITEMS as Item[], 
        dailySummary: null,
        isInventoryOpen: false,
        notifications: [],
        viewingArchive: null,

        // --- UI Setters ---
        setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
        setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
        setArchiveOpen: (isOpen) => set({ isArchiveOpen: isOpen }),
        setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
        setViewingArchive: (id) => set({ viewingArchive: id }),
        setRoast: (text) => set({ currentRoast: text }),

        // --- Notifications ---
        addNotification: (type, value, message) => {
          if (value === 0) return;
          const newNotif: GameNotification = {
            id: Date.now().toString() + Math.random().toString().slice(2, 6),
            type,
            value,
            message
          };
          set(state => ({ notifications: [...state.notifications, newNotif] }));
        },

        removeNotification: (id) => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        },

        // --- Core Loop: Next Day ---
        nextDay: () => {
          const state = get();
          
          // 1. 结算收支 (Settlement)
          const classConfig = CLASSES.find(c => c.id === state.currentClass) || CLASSES[1];
          const baseIncome = Math.floor(Math.random() * (classConfig.salaryBaseMax - classConfig.salaryBaseMin + 1)) + classConfig.salaryBaseMin;
          const actualIncome = calcSalary(baseIncome, state.san);
          const dailyCost = classConfig.dailyCost;

          let newGold = state.gold + actualIncome - dailyCost;
          const newDay = state.day + 1;
          
          // HP 自然损耗
          const newHpRaw = state.hp - 1; 

          // 2. 阶级判定 (Class Check) - 基于结算后的新 Gold
          const newClass = checkClassUpdate(newGold);
          
          // 3. 债务计数器更新
          let newDebtDays = state.flags.debtDays;
          if (newGold < 0) newDebtDays += 1;
          else newDebtDays = 0;

          // 4. 人体拆解判定 (The Dismantlement)
          let finalMaxHp = state.maxHp;
          let historyLog = '';
          let finalHp = Math.max(0, newHpRaw);
          
          // 使用新的阶级和债务天数进行判定
          const dismantle = humanDismantlementCheck(newClass, newDebtDays, newGold);
          
          if (dismantle?.triggered) {
            newGold = dismantle.changes.goldSetTo;
            finalMaxHp = Math.floor(state.maxHp * dismantle.changes.maxHpMultiplier); 
            finalHp = Math.min(finalHp, finalMaxHp); // 确保当前血量不超过新上限
            newDebtDays = 0;
            
            historyLog = `[SYSTEM] DEBT LIMIT EXCEEDED. ORGAN REPOSSESSION PROTOCOL INITIATED.`;
            get().addNotification('HP', finalMaxHp - state.maxHp, 'ORGAN_REPOSSESSED');
            get().addNotification('GOLD', 0, 'DEBT_CLEARED');
            
            // 触发故障音效 (需在组件层监听 lastAction: DAMAGE 触发)
          }

          // 5. 生成账单/事件 (互斥)
          let bill = null;
          let event = null;
          
          // 只有未被拆解时才触发日常
          if (!dismantle?.triggered) {
             bill = triggerBill(newGold, newClass, BILLS as any[]);
             if (!bill) {
                event = pickEvent(newClass, state.san, EVENTS as GameEvent[], state.inventory);
             }
          }

          // 6. 结局判定
          const tempState = { ...state, day: newDay, hp: finalHp, gold: newGold, currentClass: newClass, flags: { ...state.flags, debtDays: newDebtDays }};
          const endingId = resolveEnding(tempState as GameState);

          set({
            day: newDay,
            hp: finalHp,
            maxHp: finalMaxHp,
            gold: newGold,
            currentClass: newClass,
            activeBill: bill || null,
            currentEvent: event || null,
            ending: endingId || null,
            flags: { 
              ...state.flags, 
              debtDays: newDebtDays, 
              isHomeless: newClass === PlayerClass.Homeless 
            },
            history: historyLog ? [...state.history, historyLog] : state.history,
            dailySummary: { income: actualIncome, expense: dailyCost, class: newClass }, // 用于显示结算弹窗
            lastAction: dismantle?.triggered ? { type: 'DAMAGE', id: Date.now() } : { type: 'NONE', id: Date.now() }
          });
        },

        // --- Bill Logic ---
        resolveBill: () => {
          const state = get();
          const bill = state.activeBill;
          if (!bill) return;

          const newGold = state.gold + bill.amount;
          get().addNotification('GOLD', bill.amount, bill.amount > 0 ? 'WIND_FALL' : 'PAYMENT');

          set({
            gold: newGold,
            activeBill: null,
            history: [...state.history, `[Bill] ${bill.name}: ${bill.amount}`],
            lastAction: { type: bill.amount > 0 ? 'INCOME' : 'PAYMENT', id: Date.now() }
          });
        },

        // --- Option Choice ---
        chooseOption: (optId) => {
          const state = get();
          if (!state.currentEvent) return;

          const option = state.currentEvent.options[optId as keyof typeof state.currentEvent.options];
          if (!option) return;

          const effects = option.effects || {};
          
          const newHp = Math.max(0, Math.min(state.maxHp, state.hp + (effects.hp || 0)));
          const newSan = Math.max(0, Math.min(100, state.san + (effects.san || 0)));
          const newGold = state.gold + (effects.gold || 0);

          // Update Roast
          if (option.roast) {
            set({ currentRoast: option.roast });
            setTimeout(() => {
              if (get().currentRoast === option.roast) set({ currentRoast: null });
            }, 4000);
          }

          // Points & Ending
          const pt = effects.points || {};
          const newPoints = {
            red: state.points.red + (pt.red || 0),
            wolf: state.points.wolf + (pt.wolf || 0),
            old: state.points.old + (pt.old || 0),
          };

          let endingId = null;
          if (effects.deathReason || newHp <= 0) {
             const tempState = { ...state, hp: newHp, san: newSan, gold: newGold, points: newPoints };
             endingId = resolveEnding(tempState as GameState, effects.deathReason || (newHp <= 0 ? 'HP' : undefined));
          }
          
          // Items
          let newInventory = [...state.inventory];
          if (effects.items) {
             effects.items.forEach(i => {
                if (i.count > 0) newInventory.push(i.itemId);
                else {
                   const idx = newInventory.indexOf(i.itemId);
                   if (idx > -1) newInventory.splice(idx, 1);
                }
             });
          }
          
          // Archives
          let newArchives = [...state.unlockedArchives];
          if (option.archiveId && !newArchives.includes(option.archiveId)) {
            newArchives.push(option.archiveId);
            set({ viewingArchive: option.archiveId });
          }

          set((prev) => ({
            hp: newHp,
            san: newSan,
            gold: newGold,
            points: newPoints,
            inventory: newInventory,
            unlockedArchives: newArchives,
            ending: endingId || prev.ending,
            currentEvent: null,
            history: [...prev.history, `[Choice] ${option.label}`],
            lastAction: { 
              type: (effects.hp && effects.hp < 0) ? 'DAMAGE' : (effects.hp && effects.hp > 0) ? 'HEAL' : 'NONE', 
              id: Date.now() 
            }
          }));
        },

        // --- Shop Logic (Active Dismantlement) ---
        buyItem: (itemId) => {
          const state = get();
          const item = state.shopItems.find(i => i.id === itemId);
          if (!item) return;

          // 主动拆解逻辑
          if (itemId === 'D05') {
             const result = humanDismantlementCheck(state.currentClass, state.flags.debtDays, state.gold, true);
             if (result && result.triggered) {
                const newMaxHp = Math.floor(state.maxHp * result.changes.maxHpMultiplier);
                
                get().addNotification('HP', newMaxHp - state.maxHp, 'KIDNEY_SOLD');
                get().addNotification('GOLD', 0, 'DEBT_CLEARED');

                set(prev => ({
                   gold: result.changes.goldSetTo,
                   maxHp: newMaxHp,
                   hp: Math.min(prev.hp, newMaxHp),
                   flags: { ...prev.flags, debtDays: 0 },
                   inventory: [...prev.inventory, item.id],
                   history: [...prev.history, `[Shop] SURGERY COMPLETED. DEBT ERASED.`],
                   lastAction: { type: 'DAMAGE', id: Date.now() } // 触发红屏
                }));
                return;
             }
          }

          if (state.gold < item.price) return;

          const effects = item.effects;
          get().addNotification('GOLD', -item.price, 'PURCHASE');
          if (effects.hp) get().addNotification('HP', effects.hp, effects.hp > 0 ? 'HEAL' : 'DAMAGE');
          
          set(prev => ({
            gold: prev.gold - item.price,
            hp: Math.min(prev.maxHp, prev.hp + (effects.hp || 0)),
            san: Math.min(100, Math.max(0, prev.san + (effects.san || 0))),
            maxHp: prev.maxHp + (effects.maxHp || 0),
            inventory: [...prev.inventory, item.id],
            history: [...prev.history, `[Shop] Bought ${item.name}`],
            lastAction: { type: 'PAYMENT', id: Date.now() }
          }));
        },

        setHydrated: () => set({ _hasHydrated: true }),
        resetGame: () => {
          localStorage.removeItem('american-insight-storage');
          set({ 
            ...INITIAL_STATE, 
            shopItems: ITEMS as Item[], 
            _hasHydrated: true, 
            notifications: [] 
          });
        }
      }),
      {
        name: 'american-insight-storage',
        storage: createJSONStorage(() => localStorage),
        onRehydrateStorage: () => (state) => state?.setHydrated(),
        partialize: (state) => ({
            // 仅持久化关键数据，不持久化 UI 临时状态
            day: state.day,
            hp: state.hp,
            maxHp: state.maxHp,
            san: state.san,
            gold: state.gold,
            currentClass: state.currentClass,
            inventory: state.inventory,
            history: state.history,
            unlockedArchives: state.unlockedArchives,
            flags: state.flags,
            points: state.points,
            ending: state.ending,
            // 必须持久化当前事件/账单，防止刷新大法
            currentEvent: state.currentEvent,
            activeBill: state.activeBill
        })
      }
    ),
    { name: 'GameStore' }
  )
);