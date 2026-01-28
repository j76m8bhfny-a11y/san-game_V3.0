import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createPrisonSlice, PrisonSlice } from './slices/createPrisonSlice';
// 引入开发者工具 (可选，但在之前你的代码里可能被去掉了，如果需要可以加回 devtools)

import { createPlayerSlice, PlayerSlice } from './slices/createPlayerSlice';
import { createUISlice, UISlice } from './slices/createUISlice';
import { createSystemSlice, SystemSlice } from './slices/createSystemSlice';
import { createGameSlice, GameSlice } from './slices/createGameSlice';
import { createCryptoSlice, CryptoSlice } from './slices/createCryptoSlice';
import { createBankSlice, BankSlice } from './slices/createBankSlice'; // ✨ Import
// ✨ 1. 引入新创建的 FaithSlice
import { createFaithSlice, FaithSlice } from './slices/createFaithSlice';

// ✅ 2. 在类型定义中合并 FaithSlice
export type GameStore = PlayerSlice & UISlice & SystemSlice & GameSlice & CryptoSlice & FaithSlice & BankSlice & PrisonSlice; // ✨ Add Type

export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createUISlice(...a),
      ...createSystemSlice(...a),
      ...createGameSlice(...a),
      ...createCryptoSlice(...a),
      // ✨ 3. 挂载 slice
      ...createFaithSlice(...a),
      ...createBankSlice(...a), // ✨ Add Slice
      ...createPrisonSlice(...a),
    }),
    {
      name: 'american-insight-storage',
      version: 14.3, // 👈 建议再升一下，因为加了 faith 结构
      storage: createJSONStorage(() => localStorage),
      
      migrate: (persistedState: any, version) => {
        if (version < 14.2) {
          // 简单粗暴的处理：旧版本直接丢弃或重置，防止报错
          // 如果想保留数据，可以手动 merge，但开发阶段直接重置比较安全
          return {}; 
        }
        return persistedState;
      },

      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },

      partialize: (state) => ({
        day: state.day,
        hp: state.hp,
        maxHp: state.maxHp,
        san: state.san,
        gold: state.gold,
        currentClass: state.currentClass,
        inventory: state.inventory,
        history: state.history,
        unlockedArchives: state.unlockedArchives,
        achievedEndings: state.achievedEndings,
        flags: state.flags,
        points: state.points,
        currentRegion: state.currentRegion,
        activeJob: state.activeJob,
        activeHousing: state.activeHousing,
        activeInsurance: state.activeInsurance,
        
        crypto: state.crypto, 

        // ✨ 4. 关键：把 faith 状态加入持久化白名单！
        faith: state.faith,
        bank: state.bank, // ✨ Add to persistence whitelist!
        prison: state.prison, // ✨ 持久化
      }),
    }
  )
);