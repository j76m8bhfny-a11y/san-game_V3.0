import { StateCreator } from 'zustand';
import { Item } from '@/types/schema';
import { 
  loadAllGameData, 
  createItemMap, 
  createEventMap, 
  createBillMap, 
  createArchiveMap, 
  createEndingMap 
} from '@/utils/dataLoader';

export interface SystemSlice {
  // --- State ---
  _hasHydrated: boolean;
  gameDataCache: any; // 存储所有加载后的 JSON 数据 (Events, Items, etc.)
  
  // --- Actions ---
  setHydrated: () => void;
  initializeData: () => Promise<void>;
  
  // 获取当前可购买的商店物品 (替换原 store.shopItems())
  getShopItems: () => Item[]; 
}

export const createSystemSlice: StateCreator<any, [], [], SystemSlice> = (set, get) => ({
  // --- Initial State ---
  _hasHydrated: false,
  gameDataCache: null,

  // --- Actions Implementation ---
  setHydrated: () => set({ _hasHydrated: true }),

  initializeData: async () => {
    // 防止重复加载
    if (get().gameDataCache) return;
    
    try {
      const data = await loadAllGameData();
      
      // 构建各种 Map 以便通过 ID 快速查找
      const cache = {
        ...data,
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
    const { gameDataCache, gold } = get();
    if (!gameDataCache) return [];

    return gameDataCache.items.filter((item: Item) => {
      // 特殊物品逻辑 (负价物品，通常是卖身/卖器官)
      if (item.price < 0) {
          // 如果解锁条件是 "Gold < 0" (负债)，而玩家没有负债，则不显示
          if (item.unlockCondition === "Gold < 0" && gold >= 0) return false;
          return true;
      }
      // 普通物品默认显示 (也可以在这里扩展更多解锁条件)
      return true; 
    });
  }
});