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
import { createInsuranceSlice, InsuranceSlice } from './slices/createInsuranceSlice'; // [NEW]

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
  & InsuranceSlice // [NEW]
  & ShopSlice;

// --- 🛠️ 日志中间件 (Logger Middleware) ---
type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

const loggerImpl: Logger = (f, name) => (set, get, store) => {
  // 1. 定义拦截函数，接受任意参数
  const loggedSet = (...args: any[]) => {
    const prevState = get();
    // 强制执行原 set 函数
    (set as any)(...args);
    const newState = get();

    console.groupCollapsed(`🎬 Action Triggered`);
    console.log(`%c Prev State`, 'color: #9E9E9E; font-weight: bold;', prevState);
    console.log(`%c New State `, 'color: #4CAF50; font-weight: bold;', newState);
    console.groupEnd();
  };

  // 2. 覆盖 store 的 setState 方法
  store.setState = loggedSet as any;

  // 🔥 3. 关键修复：在这里也加 as any，解决 "参数类型不匹配" 的 TS 报错
  return f(loggedSet as any, get, store);
};

// --- 创建 Store ---
export const useGameStore = create<StoreState>()(
  // 使用 logger 包裹 persist
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
        ...createInsuranceSlice(...a), // [NEW]
      }),
      {
        name: 'pixel-life-storage', 
        storage: createJSONStorage(() => localStorage), 
        
        // --- 持久化白名单 ---
        partialize: (state) => ({
          // ✅ 1. 核心维生数据
          vitality: state.vitality,

          // ✅ 2. 玩家资产与位置
          currentRegion: state.currentRegion,
          activeHousing: state.activeHousing,  // 单一房产
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
        
        version: 1, 
        
        // --- Hydration 完成回调 ---
        onRehydrateStorage: () => (state) => {
          setTimeout(() => {
            // ⚠️ 请确保你的 createGameSlice.ts 或 createUISlice.ts 里真的有 setHasHydrated 方法
            if (state && state.setHasHydrated) {
              console.log("💧 Storage Hydrated! System Ready.");
              state.setHasHydrated(true);
            } else {
              console.error("❌ 严重错误: Store 中找不到 setHasHydrated 方法，游戏将一直卡在 Loading 界面！请检查 Slice 定义。");
            }
          }, 0);
        },
      }
    )
  )
);