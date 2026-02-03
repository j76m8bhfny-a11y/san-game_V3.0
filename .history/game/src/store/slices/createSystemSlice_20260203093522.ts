import { StateCreator } from 'zustand';
import { Item, GameState } from '@/types/schema';
import { 
  loadAllGameData, 
  createItemMap, 
  createEventMap, 
  createBillMap, 
  createArchiveMap, 
  createEndingMap 
} from '@/utils/dataLoader';

export interface SystemSlice {
  _hasHydrated: boolean;
  gameDataCache: any; 
  
  setHydrated: () => void;
  initializeData: (data?: any) => Promise<void>;
  getShopItems: () => Item[]; 
}

export const createSystemSlice: StateCreator<any, [], [], SystemSlice> = (set, get) => ({
  _hasHydrated: false,
  gameDataCache: null,

  setHydrated: () => set({ _hasHydrated: true }),

  initializeData: async (preloadedData?: any) => {
    if (get().gameDataCache) return;
    
    try {
      const data = preloadedData || await loadAllGameData();
      
      const classMap = data.classes.reduce((acc: any, cur: any) => {
        acc[cur.id] = cur;
        return acc;
      }, {});

      const cache = {
        ...data,
        classMap,
        itemMap: createItemMap(data.items),
        eventMap: createEventMap(data.events),
        billMap: createBillMap(data.bills),
        archiveMap: createArchiveMap(data.archives),
        endingMap: createEndingMap(data.endings),
      };

      set({ gameDataCache: cache });
      console.log('[System] Data initialized successfully');
    } catch (error) {
      console.error('[System] Failed to load game data:', error);
    }
  },

  getShopItems: () => {
    // ✅ 路径修复：通过 vitality.metrics 获取 gold
    const state = get() as GameState;
    const { gameDataCache } = state;
    const gold = state.vitality?.metrics?.gold ?? 0;

    if (!gameDataCache) return [];

    return gameDataCache.items.filter((item: Item) => {
      // ✅ 逻辑修复：Item 类型已不再包含 unlockCondition
      // 如果该字段已迁移到 tags 或 flags，请相应调整。
      // 这里暂时移除报错的属性访问，仅保留价格检查
      if (item.price < 0) {
          // 如果有特殊的“负债商店”逻辑，建议通过 tags 判定
          const isDebtItem = item.tags.includes('DEBT_ONLY');
          if (isDebtItem && gold >= 0) return false;
      }
      return true; 
    });
  }
});