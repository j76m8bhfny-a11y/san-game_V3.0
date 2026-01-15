// src/store/useGameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// import { immer } from 'zustand/middleware/immer'; // 可选，如需复杂状态嵌套更新可开启
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
// 修改数据结构时（如新增 flag），请增加此版本号
const STORE_VERSION = 1;

// 4. Store 实现
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
    (set, get) => ({
      ...INITIAL_STATE,
      _hasHydrated: false, // 💧 防水闸初始关闭

      // --- 占位 Actions (让 App.tsx 不报错) ---
      // AI 将在 Task 2.1 中填充具体的业务逻辑
      
      shopItems: [], // 需要从 items.json 加载
      dailySummary: null,

      nextDay: () => {
        console.log('[System] Next Day Triggered (Placeholder)');
        // AI TODO: 实现 checkClassUpdate, calcSalary, triggerBill 等逻辑
      },

      chooseOption: (optId) => {
        console.log('[System] Option Chosen:', optId);
        // AI TODO: 实现 HP/SAN 结算, 写入 history
      },

      buyItem: (itemId) => {
        console.log('[System] Buy Item:', itemId);
        // AI TODO: 扣钱, 加属性, 处理特殊物品
      },

      setHydrated: () => set({ _hasHydrated: true }),
      
      // 优化 Reset: 强制清除并重载 (Ω-Optimized)
      resetGame: () => {
        localStorage.removeItem('american-insight-storage');
        set({ ...INITIAL_STATE, _hasHydrated: true });
        // 简单粗暴防止内存残留和状态污染
        window.location.reload(); 
      }
    }),
    {
      name: 'american-insight-storage', // 存档文件名
      version: STORE_VERSION,           // ⚡️ 加入版本控制 (Ω-Optimized)
      storage: createJSONStorage(() => localStorage), // ⚠️ 生产环境需替换为 Tauri FS
      
      // ⚡️ 迁移逻辑：如果版本不匹配，重置存档，防止白屏 (Ω-Optimized)
      migrate: (persistedState: any, version) => {
        if (version !== STORE_VERSION) {
          console.warn(`[Store] Version mismatch (${version} vs ${STORE_VERSION}). Resetting state.`);
          // 返回初始状态（注意：这里只需返回 State 部分，Actions 会由 zustand 自动绑定）
          return INITIAL_STATE as any;
        }
        return persistedState as GameStore;
      },

      // 🚨 [Critical] Hydration Gate 核心实现
      onRehydrateStorage: () => (state) => {
        console.log('Storage Hydrated!');
        state?.setHydrated();
      }
    }
    )
  )
);