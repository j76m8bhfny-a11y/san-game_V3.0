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

// 导入职业配置数据
import CLASSES from '@/assets/data/classes.json';

// 导入账单数据
import BILLS from '@/assets/data/bills.json';

// 导入物品数据
import ITEMS from '@/assets/data/items.json' as any;

// 1. 定义 Actions 接口
interface GameActions {
  // 核心循环 Actions
  nextDay: () => void;
  chooseOption: (optionId: string) => void;
  buyItem: (itemId: string) => void;
  
  // UI 辅助数据 (Getters/Derived)
  shopItems: Item[];       // 商店当前显示的物品
  dailySummary: any | null; // 每日结算数据
  
  // UI 状态 Actions
  setShopOpen: (isOpen: boolean) => void;
  
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
  
  points: { red: 0, wolf: 0, old: 0 },
  
  isShopOpen: false
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
        isShopOpen: false, // 商店开关状态

        // --- 占位 Actions ---
        shopItems: ITEMS,
        dailySummary: null,

        nextDay: () => {
          const state = get();
          
          // a. 职业更新检查
          const newClass = checkClassUpdate(state.gold);
          
          // b. 查找职业配置
          const classConfig = CLASSES.find(c => c.id === newClass);
          if (!classConfig) {
            console.error('[System] Class config not found:', newClass);
            return;
          }
          
          // c. 收入计算
          const baseSalary = Math.floor(
            Math.random() * (classConfig.salaryBaseMax - classConfig.salaryBaseMin + 1) + classConfig.salaryBaseMin
          );
          const income = calcSalary(baseSalary, state.san);
          
          // d. 获取每日开销
          const dailyCost = classConfig.dailyCost;
          
          // e. 应用变化
          const newDay = state.day + 1;
          const newHp = Math.max(0, state.hp - 1); // 自然衰减，不低于 0
          const newGold = state.gold + (income - dailyCost);
          
          // f. 保存每日结算数据
          const summary = {
            income,
            dailyCost,
            netChange: income - dailyCost,
            event: 'sleep',
            className: classConfig.name
          };
          
          // g. 账单触发
          const bill = triggerBill(newGold, newClass, BILLS as any);
          
          set({
            day: newDay,
            hp: newHp,
            gold: newGold,
            currentClass: newClass,
            dailySummary: summary,
            activeBill: bill || null
          });
          
          console.log('[System] Next Day:', newDay, 'HP:', newHp, 'Gold:', newGold, 'Class:', newClass, 'Bill:', bill?.id || 'none');
        },

        chooseOption: (optionId) => {
          const state = get();
          
          // 验证当前事件存在
          if (!state.currentEvent) {
            console.warn('[System] No active event to choose option');
            return;
          }
          
          // 查找选中的选项配置
          const option = state.currentEvent.options[optionId as keyof typeof state.currentEvent.options];
          if (!option) {
            console.error('[System] Option not found:', optionId);
            return;
          }
          
          // 应用效果
          const effects = option.effects;
          const newHp = Math.max(0, Math.min(state.maxHp, state.hp + (effects.hp || 0)));
          const newSan = Math.max(0, Math.min(100, state.san + (effects.san || 0)));
          const newGold = state.gold + (effects.gold || 0);
          
          // 处理积分
          const newPoints = {
            red: state.points.red + (effects.points?.red || 0),
            wolf: state.points.wolf + (effects.points?.wolf || 0),
            old: state.points.old + (effects.points?.old || 0)
          };
          
          // 处理物品
          const newInventory = [...state.inventory];
          if (effects.items) {
            effects.items.forEach(item => {
              if (item.count > 0) {
                // 添加物品
                for (let i = 0; i < item.count; i++) {
                  newInventory.push(item.itemId);
                }
              } else {
                // 移除物品
                let removeCount = Math.abs(item.count);
                for (let i = newInventory.length - 1; i >= 0 && removeCount > 0; i--) {
                  if (newInventory[i] === item.itemId) {
                    newInventory.splice(i, 1);
                    removeCount--;
                  }
                }
              }
            });
          }
          
          // 记录历史
          const newHistory = [...state.history, `Day ${state.day}: ${option.label}`];
          
          // 解锁档案
          const newArchives = [...state.unlockedArchives];
          if (option.archiveId && !newArchives.includes(option.archiveId)) {
            newArchives.push(option.archiveId);
          }
          
          // 关闭事件
          set({
            hp: newHp,
            san: newSan,
            gold: newGold,
            points: newPoints,
            inventory: newInventory,
            history: newHistory,
            unlockedArchives: newArchives,
            currentEvent: null
          });
          
          console.log('[System] Option Chosen:', optionId, 'Effects:', effects);
        },

        buyItem: (itemId) => {
          const state = get();
          
          // 查找物品配置
          const item = ITEMS.find(i => i.id === itemId);
          if (!item) {
            console.error('[System] Item not found:', itemId);
            return;
          }
          
          // 检查金币是否足够
          if (state.gold < item.price) {
            console.warn('[System] Not enough gold:', state.gold, 'Price:', item.price);
            return;
          }
          
          // 应用效果
          const newHp = Math.max(0, Math.min(state.maxHp, state.hp + (item.effects.hp || 0)));
          const newSan = Math.max(0, Math.min(100, state.san + (item.effects.san || 0)));
          const newGold = state.gold - item.price;
          const newMaxHp = item.effects.maxHp !== undefined ? state.maxHp + item.effects.maxHp : state.maxHp;
          
          // 添加到库存
          const newInventory = [...state.inventory, itemId];
          
          // 记录历史
          const newHistory = [...state.history, `Day ${state.day}: Bought ${item.name}`];
          
          set({
            hp: newHp,
            san: newSan,
            gold: newGold,
            maxHp: newMaxHp,
            inventory: newInventory,
            history: newHistory
          });
          
          console.log('[System] Bought:', item.name, 'Price:', item.price, 'Effects:', item.effects);
        },

        setShopOpen: (isOpen) => {
          set({ isShopOpen: isOpen });
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
// 👇【在此处添加】上帝模式调试挂载
// 允许在浏览器控制台通过 window.game.getState() 查看数据
// 或 window.game.setState({ gold: 9999 }) 修改数据
(window as any).game = useGameStore;