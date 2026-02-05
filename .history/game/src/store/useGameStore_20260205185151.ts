import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. 导入切片
import { createVitalitySlice, VitalitySlice } from './slices/createVitalitySlice';
import { createBankSlice, BankSlice } from './slices/createBankSlice';
import { createFaithSlice, FaithSlice } from './slices/createFaithSlice';
import { createCryptoSlice, CryptoSlice } from './slices/createCryptoSlice';
import { createPrisonSlice, PrisonSlice } from './slices/createPrisonSlice';
import { createUISlice, UISlice } from './slices/createUISlice';
import { createSystemSlice, SystemSlice } from './slices/createSystemSlice';
import { createGameSlice, GameSlice } from './slices/createGameSlice';
import { createHousingSlice, HousingSlice } from './slices/createHousingSlice';
import { createJobSlice, JobSlice } from './slices/createJobSlice'; 
import { createShopSlice, ShopSlice } from './slices/createShopSlice';
import { createPlayerSlice, PlayerSlice } from './slices/createPlayerSlice';

// --- 定义 Hydration (防白屏机制) ---
interface HydrationSlice {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// --- 组合所有切片的类型 ---
export type StoreState = 
  & VitalitySlice   
  & PlayerSlice     
  & BankSlice       
  & FaithSlice      
  & CryptoSlice     
  & PrisonSlice     
  & UISlice         
  & SystemSlice     
  & HousingSlice     
  & GameSlice     
  & JobSlice
  & ShopSlice
  & HydrationSlice; // 👈 新增这个

// --- 🎬 日志中间件 (Logger Middleware) ---
// 这个函数会拦截所有的 set 操作，打印出修改前后的状态
const logger = <T>(config: StateCreator<T, [], []>): StateCreator<T, [], []> => 
  (set, get, api) => config(
    (args) => {
      const prevState = get(); // 获取修改前的状态
      set(args);               // 执行修改
      const newState = get();  // 获取修改后的状态
      
      // 过滤掉一些高频且不重要的日志（可选）
      // if (Object.keys(args).includes('some_noisy_action')) return;

      console.groupCollapsed("🎬 State Update", args); // 折叠显示，点击展开
      console.log("Prev:", prevState);
      console.log("Args:", args);
      console.log("Next:", newState);
      console.groupEnd();
    },
    get,
    api
  );

export const useGameStore = create<StoreState>()(
  // 1. 包裹 Logger
  logger(
    // 2. 包裹 Persist
    persist(
      (...a) => ({
        // --- 挂载所有切片 ---
        ...createVitalitySlice(...a),
        ...createHousingSlice(...a),
        ...createPlayerSlice(...a),
        ...createBankSlice(...a),
        ...createFaithSlice(...a),
        ...createCryptoSlice(...a),
        ...createPrisonSlice(...a),
        ...createUISlice(...a),
        ...createSystemSlice(...a),
        ...createGameSlice(...a),
        ...createJobSlice(...a),
        ...createShopSlice(...a),
        
        // --- 实现 Hydration ---
        _hasHydrated: false,
        setHasHydrated: (state) => {
          const set = a[0]; // 获取 set 函数
          set({ _hasHydrated: state });
        }
      }),
      {
        name: 'pixel-life-storage', 
        storage: createJSONStorage(() => localStorage), 
        
        // --- 持久化白名单 (Partialize) ---
        // 关键修复：显式指定 state 类型为 StoreState
        partialize: (state: StoreState) => ({
          // ✅ 1. 核心维生数据
          vitality: state.vitality,

          // ✅ 2. 玩家资产与位置
          currentRegion: state.currentRegion,
          activeHousing: state.activeHousing,
          activeInsurance: state.activeInsurance,
          inventory: state.inventory,
          history: state.history,
          unlockedArchives: state.unlockedArchives,
          achievedEndings: state.achievedEndings,

          // ✅ 3. 子系统数据
          bank: state.bank,
          faith: state.faith,
          crypto: state.crypto,
          prison: state.prison,
        }),
        
        // --- 修复 setHasHydrated 报错 ---
        onRehydrateStorage: () => (state) => {
          // 这里的 state 可能为 undefined，所以要用 ?.
          state?.setHasHydrated(true);
        },
        
        version: 1, 
      }
    )
  )
);