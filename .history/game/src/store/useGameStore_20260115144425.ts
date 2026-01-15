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

// 引入逻辑库
import { checkClassUpdate, calcSalary, triggerBill } from '@/logic/core';
import { resolveEnding } from '@/logic/endings'; // ✅ 结局逻辑已连接

// 引入数据源
import CLASSES from '@/assets/data/classes.json';
import BILLS from '@/assets/data/bills.json';
// @ts-ignore - 忽略 JSON 类型检查
import ITEMS from '@/assets/data/items.json';

// 1. Actions 接口
interface GameActions {
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  
  shopItems: Item[];       
  dailySummary: any | null; 
  
  isShopOpen: boolean;
  setShopOpen: (isOpen: boolean) => void;
  
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
  
  points: { red: 0, wolf: 0, old: 0 },
  
  isShopOpen: false
};

// 🚨 升级版本号，强制重置旧缓存
const STORE_VERSION = 2;

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_STATE,
        _hasHydrated: false,
        shopItems: ITEMS as Item[], // ✅ 确保商店数据加载
        dailySummary: null,

        // --- 核心循环 ---
        nextDay: () => {
          const state = get();
          
          // 1. 职业更新
          const newClass = checkClassUpdate(state.gold);
          const classConfig = CLASSES.find(c => c.id === newClass) || CLASSES[1];

          // 2. 薪资计算
          const baseIncome = Math.floor(Math.random() * (classConfig.salaryBaseMax - classConfig.salaryBaseMin + 1)) + classConfig.salaryBaseMin;
          const actualIncome = calcSalary(baseIncome, state.san);
          const dailyCost = classConfig.dailyCost;

          // 3. 数值结算
          const newDay = state.day + 1;
          const newHp = Math.max(0, state.hp - 1); 
          const newGold = state.gold + actualIncome - dailyCost;

          // 4. 触发账单
          const bill = triggerBill(newGold, newClass, BILLS as Bill[]);

          // 5. 结局判定 (Ω-Logic)
          // 构造临时状态进行检查
          const tempState = { ...state, day: newDay, hp: newHp, gold: newGold, currentClass: newClass };
          const endingId = resolveEnding(tempState as GameState);

          set({
            day: newDay,
            hp: newHp,
            gold: newGold,
            currentClass: newClass,
            activeBill: bill || null,
            ending: endingId || null, // ✅ 写入结局
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
          
          // 计算新数值
          const newHp = Math.max(0, state.hp + (effects.hp || 0));
          const newSan = Math.max(0, Math.min(100, state.san + (effects.san || 0)));
          const newGold = state.gold + (effects.gold || 0);

          // 立即检查是否导致死亡 (如: 袭警)
          let endingId = null;
          if (effects.deathReason || newHp <= 0) {
             const tempState = { ...state, hp: newHp, san: newSan, gold: newGold };
             endingId = resolveEnding(tempState as GameState, effects.deathReason);
          }
          
          // 物品处理
          let newInventory = [...state.inventory];
          if (effects.items) {
             effects.items.forEach(i => {
                if (i.count > 0) newInventory.push(i.itemId);
                else { // 移除物品
                   const idx = newInventory.indexOf(i.itemId);
                   if (idx > -1) newInventory.splice(idx, 1);
                }
             });
          }

          set((prev) => ({
            hp: newHp,
            san: newSan,
            gold: newGold,
            inventory: newInventory,
            ending: endingId || prev.ending, // ✅ 如果触发结局，立即结算
            currentEvent: null,
            history: [...prev.history, `[Day ${prev.day}] ${option.label}`]
          }));
        },

        // --- 购买逻辑 ---
        buyItem: (itemId) => {
          const state = get();
          const item = state.shopItems.find(i => i.id === itemId);
          
          if (!item) return;
          if (state.gold < item.price) return; // 钱不够

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

        setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
        setHydrated: () => set({ _hasHydrated: true }),
        
        resetGame: () => {
          localStorage.removeItem('american-insight-storage');
          set({ ...INITIAL_STATE, shopItems: ITEMS as Item[], _hasHydrated: true });
          window.location.reload(); 
        }
      }),
      {
        name: 'american-insight-storage',
        version: STORE_VERSION, // ✅ 版本控制
        storage: createJSONStorage(() => localStorage),
        migrate: (persistedState: any, version) => {
          if (version !== STORE_VERSION) {
             // 版本不匹配时重置，防止旧数据污染
             return INITIAL_STATE as any;
          }
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

// 上帝模式挂载
(window as any).game = useGameStore;