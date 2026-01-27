import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createPlayerSlice, PlayerSlice } from './slices/createPlayerSlice';
import { createUISlice, UISlice } from './slices/createUISlice';
import { createSystemSlice, SystemSlice } from './slices/createSystemSlice';
import { createGameSlice, GameSlice } from './slices/createGameSlice';
import { createCryptoSlice, CryptoSlice } from './slices/createCryptoSlice';

// ✅ 1. 补上 CryptoSlice
export type GameStore = PlayerSlice & UISlice & SystemSlice & GameSlice & CryptoSlice;

export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createUISlice(...a),
      ...createSystemSlice(...a),
      ...createGameSlice(...a),
      ...createCryptoSlice(...a),
    }),
    {
      name: 'american-insight-storage',
      version: 14.1, // 👈 建议升级一下版本号，强制重置状态以防旧数据冲突
      storage: createJSONStorage(() => localStorage),
      
      migrate: (persistedState: any, version) => {
        if (version !== 14.1) return {}; 
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
        
        // ✅ 2. 记得把 crypto 状态也持久化！
        // 如果不加这个，刷新后你的持仓和比特币价格就丢失了
        crypto: state.crypto, 
      }),
    }
  )
);