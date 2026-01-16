import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';

import {
  GameState,
  PlayerClass,
  Item,
  Bill,
  GameEvent
} from '@/types/schema';

// 引入逻辑库 (无重复)
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
  // 核心动作
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  resolveBill: () => void;
  
  // UI 开关 (Setters)
  setShopOpen: (isOpen: boolean) => void;
  setMenuOpen: (isOpen: boolean) => void;
  setArchiveOpen: (isOpen: boolean) => void;

  // 辅助数据
  shopItems: Item[];       
  dailySummary: any | null; 
  
  // 系统动作
  setHydrated: () => void;
  resetGame: () => void;
  // ✅ 新增: 物品栏开关
  isInventoryOpen: boolean;
  setInventoryOpen: (isOpen: boolean) => void;
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
  isArchiveOpen: false,

  lastAction: { type: 'NONE', id: 0 } // ✅ 初始化反馈信号
};

const STORE_VERSION = 4; // 🚨 Schema 变更，升级版本号

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

          // 债务计数器
          let newDebtDays = state.flags.debtDays;
          if (newGold < 0) newDebtDays += 1;
          else newDebtDays = 0;

          // 人体拆解
          let finalMaxHp = state.maxHp;
          let historyLog = '';
          const dismantle = humanDismantlementCheck(newClass, newDebtDays, newGold);
          
          if (dismantle?.triggered) {
            newGold = dismantle.changes.goldSetTo;
            finalMaxHp = Math.floor(state.maxHp * dismantle.changes.maxHpMultiplier); 
            newDebtDays = 0;
            historyLog = `[SYSTEM] 欠债逾期。执行强制器官回收协议。`;
          }

          let bill = null;
          if (!dismantle?.triggered) bill = triggerBill(newGold, newClass, BILLS as Bill[]);

          let event = null;
          if (!dismantle?.triggered && !bill) event = pickEvent(newClass, state.san, EVENTS as GameEvent[], state.inventory);

          // 结局判定
          const tempState = { ...state, day: newDay, hp: newHp, gold: newGold, currentClass: newClass, flags: { ...state.flags, debtDays: newDebtDays }};
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
            flags: { ...state.flags, debtDays: newDebtDays, isHomeless: newClass === PlayerClass.Homeless },
            history: historyLog ? [...state.history, historyLog] : state.history,
            dailySummary: { income: actualIncome, expense: dailyCost, class: newClass },
            // 下一天由于自然扣血，可以触发微弱的伤害反馈，或者不做反馈
            lastAction: { type: 'NONE', id: Date.now() } 
          });
        },

        // --- 账单结算 ---
        resolveBill: () => {
          const state = get();
          const bill = state.activeBill;
          if (!bill) return;

          const newGold = state.gold + bill.amount;
          
          set({
            gold: newGold,
            activeBill: null,
            history: [...state.history, `[Bill] ${bill.name}: ${bill.amount > 0 ? '+' : ''}${bill.amount}`],
            lastAction: { type: bill.amount > 0 ? 'INCOME' : 'PAYMENT', id: Date.now() } // ✅ 触发金钱反馈
          });
        },

        // --- 选项交互 (核心逻辑补全) ---
        chooseOption: (optId) => {
          const state = get();
          if (!state.currentEvent) return;

          const option = state.currentEvent.options[optId as keyof typeof state.currentEvent.options];
          if (!option) return;

          const effects = option.effects || {};
          
          // 1. 基础数值
          const newHp = Math.max(0, state.hp + (effects.hp || 0));
          const newSan = Math.max(0, Math.min(100, state.san + (effects.san || 0)));
          const newGold = state.gold + (effects.gold || 0);

          // 2. 信仰值 (✅ Logic Added)
          const pt = effects.points || {};
          const newPoints = {
            red: state.points.red + (pt.red || 0),
            wolf: state.points.wolf + (pt.wolf || 0),
            old: state.points.old + (pt.old || 0),
          };

          // 3. 结局判定
          let endingId = null;
          if (effects.deathReason || newHp <= 0) {
             const tempState = { ...state, hp: newHp, san: newSan, gold: newGold, points: newPoints };
             endingId = resolveEnding(tempState as GameState, effects.deathReason);
          }
          
          // 4. 物品处理
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
          
          // 5. 档案解锁
          let newArchives = [...state.unlockedArchives];
          if (option.archiveId && !newArchives.includes(option.archiveId)) {
            newArchives.push(option.archiveId);
          }

          // 6. 决定反馈类型 (✅ Logic Added)
          let actionType: any = 'NONE';
          if (effects.hp && effects.hp < 0) actionType = 'DAMAGE';
          else if (effects.hp && effects.hp > 0) actionType = 'HEAL';
          else if (effects.san && effects.san < -5) actionType = 'INSANITY';

          set((prev) => ({
            hp: newHp,
            san: newSan,
            gold: newGold,
            points: newPoints, // ✅ 保存信仰值
            inventory: newInventory,
            unlockedArchives: newArchives,
            ending: endingId || prev.ending,
            currentEvent: null,
            history: [...prev.history, `[Day ${prev.day}] ${option.label}`],
            lastAction: { type: actionType, id: Date.now() } // ✅ 触发反馈
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
            history: [...prev.history, `[Day ${prev.day}] Bought ${item.name}`],
            lastAction: { type: 'PAYMENT', id: Date.now() }
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