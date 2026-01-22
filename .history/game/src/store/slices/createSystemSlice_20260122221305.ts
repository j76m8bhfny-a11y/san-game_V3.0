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
  initializeData: () => Promise<void>;
  getShopItems: () => Item[]; 
}

export const createSystemSlice: StateCreator<any, [], [], SystemSlice> = (set, get) => ({
  _hasHydrated: false,
  gameDataCache: null,

  setHydrated: () => set({ _hasHydrated: true }),

  initializeData: async () => {
    if (get().gameDataCache) return;
    
    try {
      const data = await loadAllGameData();
      
      // ✅ 修复：构建 classMap，否则 GameSlice 会报错
      const classMap = data.classes.reduce((acc: any, cur: any) => {
        acc[cur.id] = cur;
        return acc;
      }, {});

      const cache = {
        ...data,
        classMap, // <--- 注入 classMap
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