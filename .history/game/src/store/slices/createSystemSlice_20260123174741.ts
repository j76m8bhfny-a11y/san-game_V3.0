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
    // 如果已经有缓存，直接返回
    if (get().gameDataCache) return;
    
    try {
      // ✅ 修复 3: 如果传入了 preloadedData 就直接用，否则自己去加载
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
    const { gameDataCache, gold } = get();
    if (!gameDataCache) return [];

    return gameDataCache.items.filter((item: Item) => {
      if (item.price < 0) {
          if (item.unlockCondition === "Gold < 0" && gold >= 0) return false;
          return true;
      }
      return true; 
    });
  }
});