import { create, StateCreator, StoreMutatorIdentifier } from 'zustand';
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
  & ShopSlice;

// --- 🛠️ 定义日志中间件 (Logger Middleware) ---
type Logger = <
  T extends unknown,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

const loggerImpl: Logger = (f, name) => (set, get, store) => {
  // ✅ 修复 1 & 2: 显式声明 args 的类型，解决 implicit any 和 spread argument 错误
  const loggedSet: typeof set = (...args: Parameters<typeof set>) => {
    const prevState = get();
    
    // 执行原来的 set
    set(...args);
    
    const newState = get();

    console.groupCollapsed(`🎬 Action Triggered`);
    console.log(`%c Prev State`, 'color: #9E9E9E; font-weight: bold;', prevState);
    console.log(`%c New State `, 'color: #4CAF50; font-weight: bold;', newState);
    console.groupEnd();
  };

  // ✅ 修复 3: 使用类型断言 (as ...) 解决 TS2322 赋值类型不匹配问题
  store.setState = loggedSet as typeof store.setState;

  return f(loggedSet, get, store);
};

// --- 创建 Store ---
export const useGameStore = create<StoreState>()(
  // 🔥 使用 logger 包裹 persist
  loggerImpl(
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
      }),
      {
        name: 'pixel-life-storage', 
        storage: createJSONStorage(() => localStorage), 
        
        // --- 持久化白名单 (Partialize) ---
        partialize: (state) => ({
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
          
          // 注意：不要持久化 _hasHydrated 或 UI 临时状态，
          // 让它们在每次刷新时重置
        }),
        
        version: 1, 
        
        // 🔥🔥🔥 关键：解决白屏问题的回调 🔥🔥🔥
        onRehydrateStorage: () => (state) => {
          // 这里的 setTimeout 是为了确保 React 组件已经挂载
          setTimeout(() => {
            if (state && state.setHasHydrated) {
              console.log("💧 Storage Hydrated! Setting flag to true.");
              state.setHasHydrated(true);
            } else {
              console.warn("⚠️ setHasHydrated method missing in store slices!");
            }
          }, 0);
        },
      }
    )
  )
);