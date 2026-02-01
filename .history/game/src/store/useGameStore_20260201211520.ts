import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // ✅ 补全导入
import { GameState } from '@/types/schema';

// 1. 导入新的维生切片
import { createVitalitySlice, VitalitySlice } from './slices/createVitalitySlice';

// 2. 导入原有的其他切片 (功能保持不变)
import { createBankSlice, BankSlice } from './slices/createBankSlice';
import { createFaithSlice, FaithSlice } from './slices/createFaithSlice';
import { createCryptoSlice, CryptoSlice } from './slices/createCryptoSlice';
import { createPrisonSlice, PrisonSlice } from './slices/createPrisonSlice';
import { createUISlice, UISlice } from './slices/createUISlice';
import { createSystemSlice, SystemSlice } from './slices/createSystemSlice';
import { createGameSlice, GameSlice } from './slices/createGameSlice';
import { createHousingSlice, HousingSlice } from './slices/createHousingSlice'; // ✅ 新增
import { createJobSlice, JobSlice } from './slices/createJobSlice'; 

// 3. 导入被“瘦身”后的玩家资产切片
// 注意：原 createPlayerSlice 现在主要负责 Inventory, Job, Housing, Region 等非数值状态
import { createPlayerSlice, PlayerSlice } from './slices/createPlayerSlice';

// --- 组合所有切片的类型 ---
// 这是 TypeScript 的核心，确保 useGameStore 拥有所有属性和方法
export type StoreState = 
  & VitalitySlice   // ✅ 核心维生 (HP, Gold, San, Class)
  & PlayerSlice     // 📍 资产与位置 (Job, House, Region, Items)
  & BankSlice       // 🏦 银行
  & FaithSlice      // 🛐 信仰
  & CryptoSlice     // 📈 炒币
  & PrisonSlice     // ⚖️ 监狱
  & UISlice         // 🖥️ UI状态
  & SystemSlice     // ⚙️ 系统配置
  & HousingSlice     // 🏠 住宅
  & GameSlice     // 🎮 全局游戏控制
  & JobSlice;

export const useGameStore = create<StoreState>()(
  persist(
    (...a) => ({
      // --- 挂载所有切片 ---
      
      // 1. 核心维生 (优先级最高)
      ...createVitalitySlice(...a),
      ...createHousingSlice(...a),

      // 2. 玩家资产与位置
      ...createPlayerSlice(...a),

      // 3. 子系统
      ...createBankSlice(...a),
      ...createFaithSlice(...a),
      ...createCryptoSlice(...a),
      ...createPrisonSlice(...a),
      
      // 4. 基础设施
      ...createUISlice(...a),
      ...createSystemSlice(...a),
      ...createGameSlice(...a),
      ...createJobSlice(...a),
    }),
    {
      name: 'pixel-life-storage', // LocalStorage 的键名
      storage: createJSONStorage(() => localStorage), // 使用浏览器缓存
      
      // --- 持久化白名单 (Partialize) ---
      // 决定哪些数据需要存入 LocalStorage，哪些刷新就重置
      partialize: (state) => ({
        // ✅ 1. 核心维生数据 (必须保存)
        vitality: state.vitality,

        // ✅ 2. 玩家资产与位置
        day: state.day, // 时间
        currentRegion: state.currentRegion,
        activeJob: state.activeJob,
        activeHousing: state.activeHousing,
        activeInsurance: state.activeInsurance,
        inventory: state.inventory,
        history: state.history,
        unlockedArchives: state.unlockedArchives,
        achievedEndings: state.achievedEndings,
        flags: state.flags, // 注意：如果 Vitality 里也有 flags，这里指原来 PlayerSlice 遗留的通用 flags，建议未来逐步迁移到 vitality.flags
        points: state.points, // 同上，注意与 vitality.identity.points 的去重

        // ✅ 3. 子系统数据
        bank: state.bank,
        faith: state.faith,
        crypto: state.crypto,
        prison: state.prison,
        
        // ❌ UI 状态通常不保存 (刷新后重置窗口)
        // isShopOpen: state.isShopOpen... 
      }),
      
      // 版本迁移处理 (可选，暂时留空)
      version: 1, 
    }
  )
);