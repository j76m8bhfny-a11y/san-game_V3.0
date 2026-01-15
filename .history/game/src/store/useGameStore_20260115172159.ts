import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware'; // 引入 devtools

import {
  GameState,
  PlayerClass,
  Item,
  Bill,
  GameEvent
} from '@/types/schema';

// 引入逻辑库 (包含了 pickEvent 和 humanDismantlementCheck)
import { checkClassUpdate, calcSalary, triggerBill, pickEvent, humanDismantlementCheck } from '@/logic/core';
import { resolveEnding } from '@/logic/endings';

// 引入数据源
import CLASSES from '@/assets/data/classes.json';
import BILLS from '@/assets/data/bills.json';
// @ts-ignore
import ITEMS from '@/assets/data/items.json';
// @ts-ignore
import EVENTS from '@/assets/data/events.json'; // ✅ 引入事件库

interface GameActions {
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  
  // UI 状态
  isShopOpen: boolean;
  setShopOpen: (isOpen: boolean) => void;
  isMenuOpen: boolean;
  setMenuOpen: (isOpen: boolean) => void;
  isArchiveOpen: boolean;
  setArchiveOpen: (isOpen: boolean) => void;

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
  isArchiveOpen: false
};

const STORE_VERSION = 3; // 🚨 升级版本号以应用新逻辑

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
        setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
        setArchiveOpen: (isOpen) => set({ isArchiveOpen: isOpen }),

        // --- 核心循环 (Core Loop) ---
        nextDay: () => {
          const state = get();
          
          // 1. 职业与经济计算
          const newClass = checkClassUpdate(state.gold);
          const classConfig = CLASSES.find(c => c.id === newClass) || CLASSES[1];

          // 随机薪资 & SAN值效率影响
          const baseIncome = Math.floor(Math.random() * (classConfig.salaryBaseMax - classConfig.salaryBaseMin + 1)) + classConfig.salaryBaseMin;
          const actualIncome = calcSalary(baseIncome, state.san);
          const dailyCost = classConfig.dailyCost;

          // 2. 基础数值结算
          const newDay = state.day + 1;
          const newHp = Math.max(0, state.hp - 1); // 每日自然衰减
          let newGold = state.gold + actualIncome - dailyCost;

          // 3. 债务计数器更新 (Critical Logic)
          let newDebtDays = state.flags.debtDays;
          if (newGold < 0) {
            newDebtDays += 1; // 负债天数 +1
          } else {
            newDebtDays = 0; // 一旦还清，计数重置
          }

          // 4. 人体拆解检测 (Dismantlement Check)
          let finalMaxHp = state.maxHp;
          let historyLog = '';
          const dismantle = humanDismantlementCheck(newClass, newDebtDays, newGold);
          
          if (dismantle?.triggered) {
            newGold = dismantle.changes.goldSetTo; // 强制债务清零
            finalMaxHp = Math.floor(state.maxHp * dismantle.changes.maxHpMultiplier); // 最大生命减半
            newDebtDays = 0;
            historyLog = `[SYSTEM] 欠债逾期。执行强制器官回收协议。债务已重置。`;
            console.warn("⚠️ DISMANTLEMENT TRIGGERED");
          }

          // 5. 账单触发 (Bill)
          // 只有在没被拆解的情况下才触发新账单，不然太残忍了
          let bill = null;
          if (!dismantle?.triggered) {
            bill = triggerBill(newGold, newClass, BILLS as Bill[]);
          }

          // 6. 随机事件触发 (Event)
          // 优先级: 拆解 > 账单 > 随机事件
          let event = null;
          if (!dismantle?.triggered && !bill) {
            event = pickEvent(newClass, state.san, EVENTS as GameEvent[], state.inventory);
          }

          // 7. 结局判定
          const tempState = { 
            ...state, 
            day: newDay, 
            hp: Math.min(newHp, finalMaxHp), // 确保 HP 不超过新上限
            gold: newGold, 
            currentClass: newClass,
            flags: { ...state.flags, debtDays: newDebtDays }
          };
          const endingId = resolveEnding(tempState as GameState);

          // 8. 应用所有变更
          set({
            day: newDay,
            hp: Math.min(newHp, finalMaxHp),
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
            
            dailySummary: {
              income: actualIncome,
              expense: dailyCost,
              class: newClass
            }
          });
        },

        // --- 选项交互 ---
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
          
          let newArchives = [...state.unlockedArchives];
          if (option.archiveId && !newArchives.includes(option.archiveId)) {
            newArchives.push(option.archiveId);
          }

          set((prev) => ({
            hp: newHp,
            san: newSan,
            gold: newGold,
            inventory: newInventory,
            unlockedArchives: newArchives,
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