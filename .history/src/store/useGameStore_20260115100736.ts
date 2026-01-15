// src/store/useGameStore.ts
import { create } from 'zustand';
// 1. [Fix] 必须引入 devtools
import { persist, createJSONStorage, devtools } from 'zustand/middleware'; 
// import { immer } from 'zustand/middleware/immer'; 

import { 
  GameState, 
  PlayerClass, 
  Item, 
  Bill, 
  GameEvent 
} from '@/types/schema';

// 预先导入逻辑函数，方便 AI 后续填充
import { checkClassUpdate, calcSalary, triggerBill, humanDismantlementCheck } from '@/logic/core';

// 1. 定义 Actions 接口
interface GameActions {
  // 核心循环 Actions
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  
  // UI 辅助数据 (Getters/Derived)
  shopItems: Item[];       // 商店当前显示的物品
  dailySummary: any | null; // 每日结算数据
  
  // 系统 Actions
  setHydrated: () => void;
  resetGame: () => void;
}

// 合并 State 和 Actions
type GameStore = GameState & GameActions;

// 2. 初始状态 (Initial State)
const INITIAL_STATE: Omit<GameState, '_hasHydrated'> = {
  day: 1,
  hp: 100,
  maxHp: 100,
  san: 50,    // 默认蓝药丸状态
  gold: 100,  // 初始资金
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

// 3. 版本控制 (Ω-Optimized)
const STORE_VERSION = 1;

// 4. Store 实现
export const useGameStore = create<GameStore>()(
  devtools( // 2. 包裹在最外层
    persist(
      (set, get) => ({
        ...INITIAL_STATE,
        _hasHydrated: false, // 💧 防水闸初始关闭

        // --- 占位 Actions ---
        shopItems: [], 
        dailySummary: null,

        nextDay: () => {
          console.log('[System] Next Day Triggered (Placeholder)');
        },

        chooseOption: (optId) => {
          console.log('[System] Option Chosen:', optId);
        },

        buyItem: (itemId) => {
          console.log('[System] Buy Item:', itemId);
        },

        setHydrated: () => set({ _hasHydrated: true }),
        
        // 优化 Reset
        resetGame: () => {
          localStorage.removeItem('american-insight-storage');
          set({ ...INITIAL_STATE, _hasHydrated: true });
          window.location.reload(); 
        }
      }),
      {
        name: 'american-insight-storage', // 存档文件名 (LocalStorage Key)
        version: STORE_VERSION,
        storage: createJSONStorage(() => localStorage), 
        
        migrate: (persistedState: any, version) => {
          if (version !== STORE_VERSION) {
            console.warn(`[Store] Version mismatch. Resetting state.`);
            return INITIAL_STATE as any;
          }
          return persistedState as GameStore;
        },

        // 🚨 Hydration Gate 核心
        onRehydrateStorage: () => (state) => {
          console.log('Storage Hydrated!');
          state?.setHydrated();
        }
      }
    ),
    { name: 'GameStore' } // 3. [Opt] 在 Redux DevTools 里显示的名字
  )
);