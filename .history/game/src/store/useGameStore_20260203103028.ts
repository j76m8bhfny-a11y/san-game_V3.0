import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameState } from '@/types/schema';

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
        // ✅ 1. 核心维生数据 (包含 metrics, identity, flags, time)
        // 这一行已经保存了金钱、生命、时间、阶级点数和所有游戏标记
        vitality: state.vitality,

        // ✅ 2. 玩家资产与位置 (已移除不存在的根层级属性 day, flags, points)
        currentRegion: state.currentRegion,
        activeJob: state.activeJob,
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
    }
  )
);