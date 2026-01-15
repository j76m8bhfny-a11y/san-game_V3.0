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

import { checkClassUpdate, calcSalary, triggerBill } from '@/logic/core';
import { resolveEnding } from '@/logic/endings'; // 引入结局逻辑

// 1. 引入所有数据源
import CLASSES from '@/assets/data/classes.json';
import BILLS from '@/assets/data/bills.json';
import ITEMS from '@/assets/data/items.json'; // ✅ 新增：商品数据

interface GameActions {
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  
  // UI 状态
  isShopOpen: boolean;
  setShopOpen: (isOpen: boolean) => void;

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
  
  points: { red: 0, wolf: 0, old: 0 }
};

const STORE_VERSION = 1;

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,
        _hasHydrated: false,
        
        // ✅ 修正：初始化时加载商品数据
        shopItems: ITEMS as Item[], 
        dailySummary: null,
        isShopOpen: false,

        setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),

        nextDay: () => {
          const state = get();
          
          // 1. 职业更新
          const newClass = checkClassUpdate(state.gold);
          const classConfig = CLASSES.find(c => c.id === newClass) || CLASSES[1];

          // 2. 薪资计算
          const baseIncome = Math.floor(Math.random() * (classConfig.salaryBaseMax - classConfig.salaryBaseMin + 1)) + classConfig.salaryBaseMin;
          const actualIncome = calcSalary(baseIncome, state.san);
          const dailyCost = classConfig.dailyCost;

          // 3. 基础数值变化
          const newDay = state.day + 1;
          const newHp = state.hp - 1; 
          const newGold = state.gold + actualIncome - dailyCost;

          // 4. 触发账单
          const bill = triggerBill(newGold, newClass, BILLS as Bill[]);

          // 5. 结局预判 (Node 4.3 逻辑)
          // 构造一个临时状态用于检查结局
          const tempState = { ...state, day: newDay, hp: newHp, gold: newGold, currentClass: newClass };
          const endingId = resolveEnding(tempState);

          set({
            day: newDay,
            hp: newHp,
            gold: newGold,
            currentClass: newClass,
            activeBill: bill || null,
            ending: endingId || null, // 如果触发结局，直接设置
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
          
          // 处理物品获取/失去
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

          set((prev) => ({
            hp: prev.hp + (effects.hp || 0),
            san: prev.san + (effects.san || 0),
            gold: prev.gold + (effects.gold || 0),
            inventory: newInventory,
            currentEvent: null,
            history: [...prev.history, `[Day ${prev.day}] ${state.currentEvent?.title}: ${option.label}`]
          }));
        },

        // ✅ 修正：实现购买逻辑
        buyItem: (itemId) => {
          const state = get();
          const item = state.shopItems.find(i => i.id === itemId);
          
          if (!item) return;
          if (state.gold < item.price) {
            console.log("Not enough cash!"); // 这里未来可以加 Feedback
            return; 
          }

          // 扣钱 & 加属性
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
          set({ ...INITIAL_STATE, shopItems: ITEMS as Item[], _hasHydrated: true }); // Reset时也要记得重置shopItems
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
          state?.setHydrated();
        }
      }
    ),
    { name: 'GameStore' }
  )
);
(window as any).game = useGameStore;