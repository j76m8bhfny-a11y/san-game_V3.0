import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState } from '@/types/schema';

// 1. 导入切片 (保持不变)
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

// --- 组合所有切片的类型 (保持不变) ---
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

export const useGameStore = create<StoreState>()(
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
        // ❌ 已移除 activeJob (使用 vitality.activeJobs)
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
      
      version: 1, 
      // 🔥🔥🔥 必须添加这一段！ 🔥🔥🔥
      // 这是告诉 App "我已经从本地存储加载完了，你可以显示画面了"
      onRehydrateStorage: () => (state) => {
        // 等待下一帧以确保 React 准备就绪
        setTimeout(() => {
            // 这里调用你在 Slice 里定义的 setHasHydrated 方法
            // 如果你在 slice 里没有定义这个方法，请看下面的【补充检查】
            state?.setHasHydrated?.(true); 
        }, 0);
    }
  )
);