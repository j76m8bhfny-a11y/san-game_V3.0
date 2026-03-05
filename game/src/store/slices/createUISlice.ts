import { StateCreator } from 'zustand';
import { GameNotification, Bill } from '@/types/schema';
import { StoreState } from '@/types/store';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

const pendingTimers = new Set<NodeJS.Timeout>();
let notificationIdCounter = 0;

const generateNotificationId = () => {
  notificationIdCounter = (notificationIdCounter + 1) % 1000000;
  return `${Date.now().toString(36)}-${notificationIdCounter.toString(36)}`;
};

export const clearAllNotificationTimers = () => {
  pendingTimers.forEach(timer => clearTimeout(timer));
  pendingTimers.clear();
};

export interface UISlice {
  // --- State ---
  isShopOpen: boolean;
  isInventoryOpen: boolean;
  isArchiveOpen: boolean;
  isMenuOpen: boolean;
  isJobBoardOpen: boolean;
  isHousingOpen: boolean;
  isHospitalOpen: boolean;
  isCryptoOpen: boolean;
  isFaithOpen: boolean; 
  isBankOpen: boolean;
  
  // ✅ [修改点 1]：确保接口定义中有这个状态
  isInsuranceOpen: boolean; 

  viewMode: 'MAP' | 'REGION';
  currentRoast: string | null;
  notifications: GameNotification[];
  viewingArchive: string | null;
  activeBill: Bill | null;
  _hasHydrated: boolean;

  // --- Actions ---
  setShopOpen: (isOpen: boolean) => void;
  setInventoryOpen: (isOpen: boolean) => void;
  setArchiveOpen: (isOpen: boolean) => void;
  setMenuOpen: (isOpen: boolean) => void;
  setJobBoardOpen: (isOpen: boolean) => void;
  setHousingOpen: (isOpen: boolean) => void;
  setHospitalOpen: (isOpen: boolean) => void;
  setCryptoOpen: (isOpen: boolean) => void;
  setFaithOpen: (isOpen: boolean) => void; 
  setBankOpen: (isOpen: boolean) => void;
  
  // ✅ [修改点 2]：确保接口定义中有这个方法
  setInsuranceOpen: (isOpen: boolean) => void; 
  
  setRoast: (content: string | null) => void;
  setViewingArchive: (archiveId: string | null) => void;
  setViewMode: (mode: 'MAP' | 'REGION') => void;
  
  closeBill: () => void;
  dismissRoastAndEndEvent: () => void;
  addNotification: (message: string, type?: GameNotification['type']) => void;
  removeNotification: (id: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set, get) => {
  // ✅ 辅助函数：关闭所有模态框（除了指定的）
  const closeAllModals = (keepOpen?: keyof UISlice) => {
    const updates: Partial<UISlice> = {
      isShopOpen: keepOpen === 'setShopOpen' ? get().isShopOpen : false,
      isJobBoardOpen: keepOpen === 'setJobBoardOpen' ? get().isJobBoardOpen : false,
      isHousingOpen: keepOpen === 'setHousingOpen' ? get().isHousingOpen : false,
      isHospitalOpen: keepOpen === 'setHospitalOpen' ? get().isHospitalOpen : false,
      isCryptoOpen: keepOpen === 'setCryptoOpen' ? get().isCryptoOpen : false,
      isFaithOpen: keepOpen === 'setFaithOpen' ? get().isFaithOpen : false,
      isBankOpen: keepOpen === 'setBankOpen' ? get().isBankOpen : false,
      isInsuranceOpen: keepOpen === 'setInsuranceOpen' ? get().isInsuranceOpen : false,
    };
    set(updates);
  };

  return {
  // --- Initial State ---
  isShopOpen: false,
  isInventoryOpen: false,
  isArchiveOpen: false,
  isMenuOpen: false,
  isJobBoardOpen: false,
  isHousingOpen: false,
  isHospitalOpen: false,
  isCryptoOpen: false,
  isFaithOpen: false,
  isBankOpen: false,
  
  // ✅ [修改点 3]：必须在这里初始化状态，否则是 undefined！
  isInsuranceOpen: false, 

  viewMode: 'REGION',
  currentRoast: null,
  notifications: [],
  viewingArchive: null,
  activeBill: null,
  _hasHydrated: false,

  // --- Actions Implementation ---
  setShopOpen: (isOpen) => {
    if (isOpen) closeAllModals('setShopOpen');
    set({ isShopOpen: isOpen });
  },
  setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
  
  setInsuranceOpen: (isOpen) => {
    if (isOpen) closeAllModals('setInsuranceOpen');
    set({ isInsuranceOpen: isOpen });
  }, 
  
  setArchiveOpen: (isOpen) => set({ 
    isArchiveOpen: isOpen,
    viewingArchive: isOpen ? get().viewingArchive : null 
  }),
  
  setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
  setJobBoardOpen: (isOpen) => {
    if (isOpen) closeAllModals('setJobBoardOpen');
    set({ isJobBoardOpen: isOpen });
  },
  setHousingOpen: (isOpen) => {
    if (isOpen) closeAllModals('setHousingOpen');
    set({ isHousingOpen: isOpen });
  },
  setHospitalOpen: (isOpen) => {
    if (isOpen) closeAllModals('setHospitalOpen');
    set({ isHospitalOpen: isOpen });
  },
  setCryptoOpen: (isOpen) => {
    if (isOpen) closeAllModals('setCryptoOpen');
    set({ isCryptoOpen: isOpen });
  },
  setBankOpen: (isOpen) => {
    if (isOpen) closeAllModals('setBankOpen');
    set({ isBankOpen: isOpen });
  },
  setFaithOpen: (isOpen) => {
    if (isOpen) closeAllModals('setFaithOpen');
    set({ isFaithOpen: isOpen });
  },
  
  setRoast: (content) => set({ currentRoast: content }),
  setViewingArchive: (archiveId) => set({ viewingArchive: archiveId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setHasHydrated: (state) => set({ _hasHydrated: state }),

  closeBill: () => set({ activeBill: null }),

  dismissRoastAndEndEvent: () => {
    const { viewingArchive } = get();
    const store = get() as any;
    
    if (viewingArchive) {
      set({
        currentRoast: null,
        isArchiveOpen: true
      });
    } else {
      set({ currentRoast: null });
    }
    
    if (store.closeEvent) {
      store.closeEvent();
    }
  },

  addNotification: (message, type = 'info') => {
    const id = generateNotificationId();
    const MAX_NOTIFICATIONS = 10;
    
    set((state: any) => {
      const currentNotifications = state.notifications || [];
      const trimmedNotifications = currentNotifications.length >= MAX_NOTIFICATIONS 
        ? currentNotifications.slice(currentNotifications.length - MAX_NOTIFICATIONS + 1)
        : currentNotifications;
      
      return {
        notifications: [...trimmedNotifications, { id, message, type }]
      };
    });
    
    const duration = SYSTEM_RULES.ui?.notificationDuration || 3000;
    
    const timer = setTimeout(() => {
      pendingTimers.delete(timer);
      get().removeNotification(id);
    }, duration);
    
    pendingTimers.add(timer);
  },

  removeNotification: (id) => {
    set((state: any) => ({
      notifications: state.notifications.filter((n: GameNotification) => n.id !== id)
    }));
  },
};
};