import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { checkClassUpdate, calcSalary, triggerBill, pickEvent, humanDismantlementCheck } from '@/logic/core';

import {
  GameState,
  PlayerClass,
  Item,
  Bill,
  GameEvent
} from '@/types/schema';

// 引入逻辑库
import { checkClassUpdate, calcSalary, triggerBill, pickEvent, humanDismantlementCheck } from '@/logic/core';
import { resolveEnding } from '@/logic/endings';

// 引入数据源
import CLASSES from '@/assets/data/classes.json';
import BILLS from '@/assets/data/bills.json';
// @ts-ignore
import ITEMS from '@/assets/data/items.json';
// @ts-ignore
import EVENTS from '@/assets/data/events.json';

interface GameActions {
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  resolveBill: () => void; // ✅ 新增: 结算账单 Action
  
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

const STORE_VERSION = 3;

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

        // --- 核心循环 ---
        nextDay: () => {
          const state = get();
          
          const newClass = checkClassUpdate(state.gold);
          const classConfig = CLASSES.find(c => c.id === newClass) || CLASSES[1];

          const baseIncome = Math.floor(Math.random() * (classConfig.salaryBaseMax - classConfig.salaryBaseMin + 1)) + classConfig.salaryBaseMin;
          const actualIncome = calcSalary(baseIncome, state.san);
          const dailyCost = classConfig.dailyCost;

          const newDay = state.day + 1;
          const newHp = Math.max(0, state.hp - 1); 
          let newGold = state.gold + actualIncome - dailyCost;

          let newDebtDays = state.flags.debtDays;
          if (newGold < 0) {
            newDebtDays += 1;
          } else {
            newDebtDays = 0;
          }

          let finalMaxHp = state.maxHp;
          let historyLog = '';
          const dismantle = humanDismantlementCheck(newClass, newDebtDays, newGold);
          
          if (dismantle?.triggered) {
            newGold = dismantle.changes.goldSetTo;
            finalMaxHp = Math.floor(state.maxHp * dismantle.changes.maxHpMultiplier); 
            newDebtDays = 0;
            historyLog = `[SYSTEM] 欠债逾期。执行强制器官回收协议。债务已重置。`;
          }

          let bill = null;
          if (!dismantle?.triggered) {
            bill = triggerBill(newGold, newClass, BILLS as Bill[]);
          }

          let event = null;
          if (!dismantle?.triggered && !bill) {
            event = pickEvent(newClass, state.san, EVENTS as GameEvent[], state.inventory);
          }

          const tempState = { 
            ...state, 
            day: newDay, 
            hp: Math.min(newHp, finalMaxHp), 
            gold: newGold, 
            currentClass: newClass,
            flags: { ...state.flags, debtDays: newDebtDays }
          };
          const endingId = resolveEnding(tempState as GameState);

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

        // --- 账单结算实现 (✅ Step 2 Core) ---
        resolveBill: () => {
          const state = get();
          const bill = state.activeBill;
          
          if (!bill) return;

          // 扣钱 (amount 为负数时即扣钱)
          const newGold = state.gold + bill.amount;
          
          set({
            gold: newGold,
            activeBill: null, // 关闭弹窗
            history: [...state.history, `[Bill] ${bill.name}: ${bill.amount > 0 ? '+' : ''}${bill.amount}`]
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
            ending: endingId || prev.ending, // 立即结算结局
            currentEvent: null,
            history: [...prev.history, `[Day ${prev.day}] ${option.label}`]
          }));
        },

        buyItem: (itemId) => {
          const state = get();
          const item = state.shopItems.find(i => i.id === itemId);
          if (!item) return;
          // --- [逻辑修复] Special Logic: 主动人体拆解 (Active Dismantlement) ---
          if (itemId === 'D05') {
             // 1. 调用核心校验逻辑 (isShopAction = true)
             const result = humanDismantlementCheck(state.currentClass, state.flags.debtDays, state.gold, true);
             
             // 2. 如果满足条件 (其实 D05 本身就需要条件解锁，这里是双重保险)
             if (result && result.triggered) {
                const newMaxHp = Math.floor(state.maxHp * result.changes.maxHpMultiplier);
                
                set(prev => ({
                   gold: result.changes.goldSetTo, // 债务强制归零
                   maxHp: newMaxHp,                // 最大生命值减半
                   hp: Math.min(prev.hp, newMaxHp), // 当前生命值不能超过上限
                   flags: { ...prev.flags, debtDays: 0 }, // 计数器重置
                   inventory: [...prev.inventory, item.id],
                   history: [...prev.history, `[Day ${prev.day}] SURGERY COMPLETED. DEBT ERASED. ORGAN LOST.`]
                }));
                
                // 播放音效 (如果有)
                // useAudioStore.getState().playSfx('sfx_drill'); 
                return; // 🚨 关键：阻止执行后续的常规扣钱逻辑
             }
          }
          if (state.gold < item.price) {
            // 可选：触发一个 Feedback "资金不足"
            return;
          }

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
        storage: createJSONStorage(() => localStorage), // ✅ 确保这里有 createJSONStorage
        onRehydrateStorage: () => (state) => state?.setHydrated()
      }
    ),
    { name: 'GameStore' }
  )
);
(window as any).game = useGameStore;