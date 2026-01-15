// src/store/useGameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';

import { 
  GameState, 
  PlayerClass, 
  Item, 
  Bill, 
  GameEvent 
} from '@/types/schema';

// 引入逻辑库和数据源
import { checkClassUpdate, calcSalary, triggerBill } from '@/logic/core';
import CLASSES from '@/assets/data/classes.json';
import BILLS from '@/assets/data/bills.json';

// 1. 定义 Actions 接口
interface GameActions {
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  
  shopItems: Item[];       
  dailySummary: any | null; 
  
  setHydrated: () => void;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

// 2. 初始状态
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
  
  points: { red: 0, wolf: 0, old: 0 }
};

const STORE_VERSION = 1;

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,
        _hasHydrated: false,
        shopItems: [], 
        dailySummary: null,

        // --- 核心循环逻辑 (Node 3.1 + 3.2 + 3.3) ---
        nextDay: () => {
          const state = get();
          
          // 1. 更新阶级 (Node 3.2)
          const newClass = checkClassUpdate(state.gold);
          const classConfig = CLASSES.find(c => c.id === newClass) || CLASSES[1]; // 默认 Worker

          // 2. 计算薪资与开销 (Node 3.2)
          // 随机基础薪资
          const baseIncome = Math.floor(Math.random() * (classConfig.salaryBaseMax - classConfig.salaryBaseMin + 1)) + classConfig.salaryBaseMin;
          // SAN 值惩罚
          const actualIncome = calcSalary(baseIncome, state.san);
          const dailyCost = classConfig.dailyCost;

          // 3. 应用数值变化 (Node 3.1)
          const newDay = state.day + 1;
          const newHp = state.hp - 1; // 自然衰减
          const newGold = state.gold + actualIncome - dailyCost;

          // 4. 触发账单 (Node 3.3)
          const bill = triggerBill(newGold, newClass, BILLS as Bill[]);

          set({
            day: newDay,
            hp: newHp,
            gold: newGold,
            currentClass: newClass,
            activeBill: bill || null, // 如果有账单，设置 activeBill
            dailySummary: {
              income: actualIncome,
              expense: dailyCost,
              class: newClass
            }
          });

          console.log(`[System] Day ${newDay}: Income ${actualIncome}, Cost ${dailyCost}, Bill: ${bill?.name || 'None'}`);
        },

        // --- 选项交互逻辑 (Node 3.3) ---
        chooseOption: (optId) => {
          const state = get();
          if (!state.currentEvent) return;

          const option = state.currentEvent.options[optId as keyof typeof state.currentEvent.options];
          if (!option) return;

          console.log('[System] Option Chosen:', option.label);

          // 应用效果
          const effects = option.effects || {};
          
          set((prev) => ({
            hp: prev.hp + (effects.hp || 0),
            san: prev.san + (effects.san || 0),
            gold: prev.gold + (effects.gold || 0),
            currentEvent: null, // 关闭事件
            history: [...prev.history, `[Day ${prev.day}] ${state.currentEvent?.title}: ${option.label}`]
          }));
        },

        buyItem: (itemId) => {
          console.log('[System] Buy Item Placeholder:', itemId);
        },

        setHydrated: () => set({ _hasHydrated: true }),
        
        resetGame: () => {
          localStorage.removeItem('american-insight-storage');
          set({ ...INITIAL_STATE, _hasHydrated: true });
          window.location.reload(); 
        }
      }),
      {
        name: 'american-insight-storage',
        version: STORE_VERSION,
        storage: createJSONStorage(() => localStorage),
        migrate: (persistedState: any, version) => {
          if (version !== STORE_VERSION) return INITIAL_STATE as any;
          return persistedState as GameStore;
        },
        onRehydrateStorage: () => (state) => {
          console.log('Storage Hydrated!');
          state?.setHydrated();
        }
      }
    ),
    { name: 'GameStore' }
  )
);

// 上帝模式挂载
(window as any).game = useGameStore;