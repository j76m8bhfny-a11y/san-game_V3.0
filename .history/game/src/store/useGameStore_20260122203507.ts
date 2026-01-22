import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 引入拆分后的切片
import { createPlayerSlice, PlayerSlice } from './slices/createPlayerSlice';
import { createUISlice, UISlice } from './slices/createUISlice';
import { createSystemSlice, SystemSlice } from './slices/createSystemSlice';
import { createGameSlice, GameSlice } from './slices/createGameSlice';

// 1. 定义完整的 Store 类型 (合并所有切片的接口)
export type GameStore = PlayerSlice & UISlice & SystemSlice & GameSlice;

// 2. 创建 Store
export const useGameStore = create<GameStore>()(
  persist(
    // 3. 合并所有切片的状态和方法
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createUISlice(...a),
      ...createSystemSlice(...a),
      ...createGameSlice(...a),
    }),
    {
      name: 'american-insight-storage', // 本地存储的 Key
      version: 14.0, // 升级版本号，确保旧的脏数据被重置
      storage: createJSONStorage(() => localStorage),
      
      // 迁移逻辑：版本不匹配时，直接返回空对象以重置状态
      migrate: (persistedState: any, version) => {
        if (version !== 14.0) return {}; 
        return persistedState;
      },

      // Hydration 完成后的回调
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },

      // 4. 选择性持久化 (只保存需要存档的数据，不保存 UI 临时状态)
      partialize: (state) => ({
        // 玩家核心数据
        day: state.day,
        hp: state.hp,
        maxHp: state.maxHp,
        san: state.san,
        gold: state.gold,
        currentClass: state.currentClass,
        
        // 物品与进度
        inventory: state.inventory,
        history: state.history,
        unlockedArchives: state.unlockedArchives,
        achievedEndings: state.achievedEndings, // 永久成就
        
        // 关键标记
        flags: state.flags,
        points: state.points,
        
        // 如果你需要保存当前正在进行的事件（防止刷新丢失进度），可以加上这些：
        // currentEvent: state.currentEvent,
        // activeBill: state.activeBill,
      }),
    }
  )
);