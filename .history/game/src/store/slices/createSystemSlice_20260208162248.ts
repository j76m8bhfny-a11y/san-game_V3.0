import { StateCreator } from 'zustand';
import { Item, GameDataCache } from '@/types/schema';
import { StoreState } from '@/types/store';
import {
  loadAllGameData,
  createItemMap,
  createEventMap,
  createBillMap,
  createArchiveMap,
  createEndingMap,
  createJobMap
} from '@/utils/dataLoader';

export interface SystemSlice {
  gameDataCache: GameDataCache | null;
  gameDataLoadFailed: boolean; // ✅ 新增：数据加载失败标志
  
  initializeData: (data?: Partial<GameDataCache>) => Promise<void>;
  getShopItems: () => Item[];
}

export const createSystemSlice: StateCreator<StoreState, [], [], SystemSlice> = (set, get) => ({
  gameDataCache: null,
  gameDataLoadFailed: false, // ✅ 新增：初始为false

  initializeData: async (preloadedData?: GameDataCache) => {
    if (get().gameDataCache) {
      console.log('[System] Data already initialized, skipping...');
      return;
    }
    
    try {
      const data = preloadedData || await loadAllGameData();
      
      const classMap = data.classes.reduce((acc: any, cur: any) => {
        acc[cur.id] = cur;
        return acc;
      }, {});

      const cache: GameDataCache = {
        ...data,
        classMap,
        itemMap: createItemMap(data.items),
        eventMap: createEventMap(data.events),
        billMap: createBillMap(data.bills),
        archiveMap: createArchiveMap(data.archives),
        endingMap: createEndingMap(data.endings),
        jobMap: createJobMap(data.jobs),
      };

      set({ gameDataCache: cache, gameDataLoadFailed: false });
      console.log('[System] Data initialized successfully');
    } catch (error) {
      console.error('[System] Failed to load game data:', error);
      // ✅ 设置失败标志，UI可以据此显示错误页面
      set({ gameDataLoadFailed: true });
    }
  },

  getShopItems: () => {
    // ✅ 路径修复：通过 vitality.metrics 获取 gold
    const state = get() as StoreState;
    const { gameDataCache } = state;
    const gold = state.vitality?.metrics?.gold ?? 0;

    if (!gameDataCache) return [];

    return gameDataCache.items.filter((item: Item) => {
      // ✅ 【问题3-A】穷人专属商品逻辑：
      // 带有 POOR_ONLY 标签的商品（高利贷等），只有余额<0时才显示
      // 这是设计意图：你越穷，越能接触到非法贷款
      if (item.price < 0) {
          const isPoorOnlyItem = item.tags?.includes('POOR_ONLY') || item.tags?.includes('DEBT_ONLY');
          if (isPoorOnlyItem && gold >= 0) return false; // 有钱就看不到
      }
      return true; 
    });
  }
});