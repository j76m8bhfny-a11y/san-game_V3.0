import { create, StateCreator, StoreMutatorIdentifier } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// @ts-expect-error globalTimerManager 用于 side effect
import { globalTimerManager } from '@/hooks/useGameTimer';
import { isTauri, getStorageAdapter } from '@/utils/fileStorage';
// @ts-expect-error migrateFromLocalStorage 在模块内部使用
import { migrateFromLocalStorage } from '@/utils/fileStorage';

// 1. 导入切片
import { createVitalitySlice } from './slices/createVitalitySlice';
import { createBankSlice } from './slices/createBankSlice';
import { createFaithSlice } from './slices/createFaithSlice';
import { createCryptoSlice } from './slices/createCryptoSlice';
import { createPrisonSlice } from './slices/createPrisonSlice';
import { createUISlice } from './slices/createUISlice';
import { createSystemSlice } from './slices/createSystemSlice';
import { createGameSlice } from './slices/createGameSlice';
import { createHousingSlice } from './slices/createHousingSlice';
import { createJobSlice } from './slices/createJobSlice'; 
import { createShopSlice } from './slices/createShopSlice';
import { createPlayerSlice } from './slices/createPlayerSlice';
import { createInsuranceSlice } from './slices/createInsuranceSlice';
import { createVehicleSlice } from './slices/createVehicleSlice';
import { createGlobalProgressSlice } from './slices/createGlobalProgressSlice';

// --- 从 types/store 重新导出 StoreState ---
// 避免重复定义导致类型不一致
import type { StoreState } from '@/types/store';
export type { StoreState };

// --- 🛠️ 日志中间件 (Logger Middleware) ---
type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

const loggerImpl: Logger = (f, _name) => (set, get, store) => {
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
        ...createVehicleSlice(...a), // [NEW]
        ...createGlobalProgressSlice(...a), // [NEW] 全局进度
        
        // 🍖 饮食系统初始状态
        dietState: {
          junkFoodPoints: 0,
          healthyPoints: 0,
          consecutiveJunkDays: 0,
          consecutiveHealthyDays: 0,
          sodiumIntake: 0,
          sugarIntake: 0,
          redMeatPoints: 0,
          noFreshFoodDays: 0
        },
        activeBuffs: [],
        // 🏪 商店库存系统初始状态
        shopInventory: {
          SLUMS: [],
          RUST_BELT: [],
          SUBURBS: [],
          DOWNTOWN: []
        },
        // 🚗 车辆购买区域记录
        vehiclePurchaseRegion: null,
        // ✅ 注意: activeInsurances 由 createVitalitySlice 提供
        // 这里添加空数组以满足 TypeScript 类型检查
        activeInsurances: []
      }),
      {
        name: 'pixel-life-storage', 
        // ✅ 自动检测环境：Tauri 使用文件存储，浏览器使用 localStorage
        storage: createJSONStorage(() => getStorageAdapter()), 
        
        // --- 持久化白名单 ---
        partialize: (state) => ({
          // ✅ 0. 存档元数据（版本管理和迁移必需）
          saveVersion: '1.0',           // 存档数据结构版本
          saveTime: Date.now(),         // 保存时间戳

          // ✅ 1. 核心维生数据
          vitality: state.vitality,

          // ✅ 2. 玩家资产与位置
          currentRegion: state.currentRegion,
          activeHousing: state.activeHousing,  // 单一房产
          // 注意: activeInsurances 已移至 vitality 中管理，从顶层移除
          dmvQueue: state.dmvQueue, // [NEW] DMV排队状态
          activeLease: state.activeLease, // [NEW] 租赁状态
          inventory: state.inventory,
          history: state.history,
          unlockedArchives: state.unlockedArchives,
          achievedEndings: state.achievedEndings,
          archiveUnlockDates: state.archiveUnlockDates,
          endingUnlockDates: state.endingUnlockDates,
          totalDeaths: state.totalDeaths,
          totalPlayTime: state.totalPlayTime,
          totalRuns: state.totalRuns,
          longestSurvival: state.longestSurvival,
          darkWebEchoes: state.darkWebEchoes,
          systemGaze: state.systemGaze,

          // ✅ 3. 子系统数据
          bank: state.bank,
          faith: state.faith,
          crypto: state.crypto,
          prison: state.prison,
          
          // ✅ 4. 其他游戏状态
          dietState: state.dietState,                   // 🍖 饮食系统
          activeBuffs: state.activeBuffs,               // 顶层 Buff 列表
          shopInventory: state.shopInventory,           // 🏪 商店库存
          vehiclePurchaseRegion: state.vehiclePurchaseRegion, // 🚗 车辆购买区域
        }),
        
        version: 1, 
        
        // --- Hydration 完成回调 ---
        onRehydrateStorage: () => (state, error) => {
          // 使用 async IIFE 支持异步操作
          (async () => {
            try {
              // ✅ 处理持久化错误（如存储空间不足）
              if (error) {
                console.error("❌ 存档持久化错误:", error);
                // 尝试从localStorage重新读取（浏览器环境）
                if (!isTauri()) {
                  const raw = localStorage.getItem('pixel-life-storage');
                  if (raw) {
                    try {
                      state = JSON.parse(raw);
                    } catch (parseError) {
                      console.error('存档解析失败:', parseError);
                    }
                  }
                }
              }

              // ✅ 存档数据存在性和有效性检查
              if (!state || typeof state !== 'object') {
                console.warn("⚠️ 存档数据不存在或格式错误");
                window.location.reload();
                return;
              }

              // ✅ 版本检查和迁移
              const anyState = state as any;
              if (!anyState.saveVersion) {
                console.log("📦 检测到 v0 旧存档，执行迁移到 v1.0...");
                state = migrateSaveV0ToV1(anyState);
                // 保存迁移后的数据（仅在浏览器环境下，Tauri 会在文件存储中处理）
                if (!isTauri()) {
                  localStorage.setItem('pixel-life-storage', JSON.stringify(state));
                }
              } else if (anyState.saveVersion !== '1.0') {
                console.warn(`⚠️ 存档版本 ${anyState.saveVersion} 与当前版本 1.0 不兼容`);
                await backupAndResetSave('版本不兼容');
                return;
              }

              // ✅ 验证核心字段完整性
              const requiredPaths = [
                'vitality.metrics.gold',
                'vitality.metrics.hp',
                'vitality.time.currentTurn',
                'vitality.identity.currentClass'
              ];
              
              const missingFields = requiredPaths.filter(path => {
                const parts = path.split('.');
                let obj: any = state;
                for (const part of parts) {
                  if (obj == null || typeof obj !== 'object' || !(part in obj)) {
                    return true;
                  }
                  obj = obj[part];
                }
                return false;
              });

              if (missingFields.length > 0) {
                console.warn("⚠️ 存档字段缺失:", missingFields.join(', '));
                await backupAndResetSave('字段缺失');
                return;
              }
              
              // ⚠️ 请确保你的 createGameSlice.ts 或 createUISlice.ts 里真的有 setHasHydrated 方法
              if (state && state.setHasHydrated) {
                console.log("💧 Storage Hydrated! System Ready. (版本:", (state as any).saveVersion, ")");
                state.setHasHydrated(true);
                
                // 注意：localStorage 迁移逻辑已在 getStorageAdapter 中处理
              } else {
                console.error("❌ 严重错误: Store 中找不到 setHasHydrated 方法，游戏将一直卡在 Loading 界面！请检查 Slice 定义。");
                // 自动重置避免卡死
                if (isTauri()) {
                  const { fileStorage } = await import('@/utils/fileStorage');
                  await fileStorage.delete(0).catch(console.error);
                } else {
                  localStorage.removeItem('pixel-life-storage');
                }
                window.location.reload();
              }
            } catch (err) {
              console.error("❌ 存档恢复失败:", err);
              await backupAndResetSave('恢复异常');
            }
          })();
        },
      }
    )
  )
);

// ==========================================
// 存档迁移和备份工具函数
// ==========================================

/**
 * 备份损坏的存档并重置游戏
 * 支持浏览器 localStorage 和 Tauri 文件存储两种环境
 * @param reason 重置原因
 */
async function backupAndResetSave(reason: string): Promise<void> {
  try {
    if (isTauri()) {
      // Tauri 环境：备份文件存档
      const { fileStorage } = await import('@/utils/fileStorage');
      const hasSave = await fileStorage.exists(0);
      if (hasSave) {
        const timestamp = Date.now();
        await fileStorage.backup(0, `corrupted-${timestamp}`);
        console.warn(`⚠️ 文件存档已备份到 backup_corrupted-${timestamp}_0.json，原因: ${reason}`);
        await fileStorage.delete(0);
      }
    } else {
      // 浏览器环境：备份 localStorage
      const corrupted = localStorage.getItem('pixel-life-storage');
      if (corrupted) {
        const backupKey = `pixel-life-storage-corrupted-${Date.now()}`;
        localStorage.setItem(backupKey, corrupted);
        console.warn(`⚠️ 存档已备份到 ${backupKey}，原因: ${reason}`);
        
        // 只保留最近5个备份，避免占用过多空间
        cleanupOldBackups();
      }
      localStorage.removeItem('pixel-life-storage');
    }
  } catch (e) {
    console.error('备份存档失败:', e);
  }
  
  window.location.reload();
}

/**
 * 清理旧的存档备份，只保留最近5个
 */
function cleanupOldBackups(): void {
  try {
    const backupKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pixel-life-storage-corrupted-')) {
        backupKeys.push(key);
      }
    }
    
    // 按时间戳排序，删除旧的
    if (backupKeys.length > 5) {
      backupKeys.sort();
      const toDelete = backupKeys.slice(0, backupKeys.length - 5);
      toDelete.forEach(key => localStorage.removeItem(key));
    }
  } catch (e) {
    console.error('清理旧备份失败:', e);
  }
}

/**
 * 从 v0 (无版本号) 迁移到 v1.0
 * @param oldState 旧存档状态
 * @returns 新存档状态
 */
function migrateSaveV0ToV1(oldState: any): any {
  console.log('🔄 执行存档迁移: v0 -> v1.0');
  
  // 深拷贝避免修改原对象
  const newState = JSON.parse(JSON.stringify(oldState));
  
  // 添加版本号和元数据
  newState.saveVersion = '1.0';
  newState.saveTime = Date.now();
  
  // 确保所有必需字段存在，缺失时设置默认值
  if (!newState.vitality) {
    newState.vitality = {};
  }
  if (!newState.vitality.metrics) {
    newState.vitality.metrics = {};
  }
  if (!newState.vitality.identity) {
    newState.vitality.identity = { currentClass: 'HOMELESS', points: { red: 0, wolf: 0, old: 0 } };
  }
  if (!newState.vitality.time) {
    newState.vitality.time = { currentTurn: 1, totalTurns: 1 };
  }
  
  // 确保全局进度字段存在
  if (!newState.unlockedArchives) {
    newState.unlockedArchives = [];
  }
  if (!newState.achievedEndings) {
    newState.achievedEndings = [];
  }
  if (!newState.totalDeaths) {
    newState.totalDeaths = 0;
  }
  if (!newState.totalRuns) {
    newState.totalRuns = 0;
  }
  
  // 确保其他游戏状态字段存在（v0 存档可能没有这些）
  if (!newState.dietState) {
    newState.dietState = {
      junkFoodPoints: 0,
      healthyPoints: 0,
      consecutiveJunkDays: 0,
      consecutiveHealthyDays: 0,
      sodiumIntake: 0,
      sugarIntake: 0,
      redMeatPoints: 0,
      noFreshFoodDays: 0
    };
  }
  if (!newState.activeBuffs) {
    newState.activeBuffs = [];
  }
  if (!newState.shopInventory) {
    newState.shopInventory = {
      SLUMS: [],
      RUST_BELT: [],
      SUBURBS: [],
      DOWNTOWN: []
    };
  }
  if (!newState.vehiclePurchaseRegion) {
    newState.vehiclePurchaseRegion = null;
  }
  
  console.log('✅ 存档迁移完成');
  return newState;
}