import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';

import {
  GameState,
  PlayerClass,
  Item,
  Bill,
  GameEvent
} from '@/types/schema';

import { checkClassUpdate, calcSalary, triggerBill } from '@/logic/core';
import { resolveEnding } from '@/logic/endings';
import CLASSES from '@/assets/data/classes.json';
import BILLS from '@/assets/data/bills.json';
// @ts-ignore
import ITEMS from '@/assets/data/items.json';

interface GameActions {
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  
  // UI 状态
  isShopOpen: boolean;
  setShopOpen: (isOpen: boolean) => void;
  
  isMenuOpen: boolean; // ✅ 新增
  setMenuOpen: (isOpen: boolean) => void; // ✅ 新增
  
  isArchiveOpen: boolean; // ✅ 新增
  setArchiveOpen: (isOpen: boolean) => void; // ✅ 新增

  shopItems: Item[];       
  dailySummary: any | null; 
  
  setHydrated: () => void;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

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
  unlockedArchives: [], // 初始已解锁档案
  
  flags: {
    isHomeless: false,
    debtDays: 0,
    hasRedBook: false,
    hasCryptoKey: false
  },
  
  points: { red: 0, wolf: 0, old: 0 },
  
  isShopOpen: false,
  isMenuOpen: false, // ✅ 初始化
  isArchiveOpen: false // ✅ 初始化
};

const STORE_VERSION = 2;

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,
        _hasHydrated: false,
        shopItems: ITEMS as Item[], 
        dailySummary: null,

        // --- UI Setters ---
        setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
        setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }), // ✅ 实现
        setArchiveOpen: (isOpen) => set({ isArchiveOpen: isOpen }), // ✅ 实现

        nextDay: () => {
          const state = get();
          
          const newClass = checkClassUpdate(state.gold);
          const classConfig = CLASSES.find(c => c.id === newClass) || CLASSES[1];

          const baseIncome = Math.floor(Math.random() * (classConfig.salaryBaseMax - classConfig.salaryBaseMin + 1)) + classConfig.salaryBaseMin;
          const actualIncome = calcSalary(baseIncome, state.san);
          const dailyCost = classConfig.dailyCost;

          const newDay = state.day + 1;
          const newHp = Math.max(0, state.hp - 1); 
          const newGold = state.gold + actualIncome - dailyCost;

          const bill = triggerBill(newGold, newClass, BILLS as Bill[]);

          const tempState = { ...state, day: newDay, hp: newHp, gold: newGold, currentClass: newClass };
          const endingId = resolveEnding(tempState as GameState);

          set({
            day: newDay,
            hp: newHp,
            gold: newGold,
            currentClass: newClass,
            activeBill: bill || null,
            ending: endingId || null,
            dailySummary: {
              income: actualIncome,
              expense: dailyCost,
              class: newClass
            }
          });
        },

        chooseOption: (optId) => {
          const state = get();
          if (!state.currentEvent) return;

          const option = state.currentEvent.options[optId as keyof typeof state.currentEvent.options];
          if (!option) return;

          const effects = option.effects || {};
          
          const newHp = Math.max(0, state.hp + (effects.hp || 0));
          const newSan = Math.max(0, Math.min(100, state.san + (effects.san || 0)));
          const newGold = state.gold + (effects.gold || 0);

          let endingId = null;
          if (effects.deathReason || newHp <= 0) {
             const tempState = { ...state, hp: newHp, san: newSan, gold: newGold };
             endingId = resolveEnding(tempState as GameState, effects.deathReason);
          }
          
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
          
          // 档案解锁逻辑 (如果有 archiveId)
          let newArchives = [...state.unlockedArchives];
          if (option.archiveId && !newArchives.includes(option.archiveId)) {
            newArchives.push(option.archiveId);
          }

          set((prev) => ({
            hp: newHp,
            san: newSan,
            gold: newGold,
            inventory: newInventory,
            unlockedArchives: newArchives, // 更新档案
            ending: endingId || prev.ending,
            currentEvent: null,
            history: [...prev.history, `[Day ${prev.day}] ${option.label}`]
          }));
        },

        buyItem: (itemId) => {
          const state = get();
          const item = state.shopItems.find(i => i.id === itemId);
          if (!item || state.gold < item.price) return;

          const effects = item.effects;
          
          set(prev => ({
            gold: prev.gold - item.price,
            hp: Math.min(prev.maxHp, prev.hp + (effects.hp || 0)),
            san: Math.min(100, Math.max(0, prev.san + (effects.san || 0))),
            maxHp: prev.maxHp + (effects.maxHp || 0),
            inventory: [...prev.inventory, item.id],
            history: [...prev.history, `[Day ${prev.day}] Bought ${item.name}`]
          }));
        },

        setHydrated: () => set({ _hasHydrated: true }),
        resetGame: () => {
          localStorage.removeItem('american-insight-storage');
          set({ ...INITIAL_STATE, shopItems: ITEMS as Item[], _hasHydrated: true });
          window.location.reload(); 
        }
      }),
      {
        name: 'american-insight-storage',
        version: STORE_VERSION,
        storage: createJSONStorage(() => localStorage),
        onRehydrateStorage: () => (state) => state?.setHydrated()
      }
    ),
    { name: 'GameStore' }
  )
);
(window as any).game = useGameStore;