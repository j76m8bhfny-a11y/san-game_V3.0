import { StateCreator } from 'zustand';
import { GameNotification, Bill } from '@/types/schema';
// ✅ 1. 引入系统规则配置 (Source of Truth)
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// 定义 UI 切片的状态和方法
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
  viewMode: 'MAP' | 'REGION';

  currentRoast: string | null;
  notifications: GameNotification[];
  viewingArchive: string | null;
  activeBill: Bill | null;

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
  
  setRoast: (content: string | null) => void;
  setViewingArchive: (archiveId: string | null) => void;
  setViewMode: (mode: 'MAP' | 'REGION') => void;
  
  closeBill: () => void;
  dismissRoastAndEndEvent: () => void;

  // 通知系统
  addNotification: (message: string, type?: GameNotification['type']) => void;
  removeNotification: (id: string) => void;
  _hasHydrated: boolean;     // 👈 必须有这个
  setHasHydrated: (state: boolean) => void; // 👈 必须有这个
}

export const createUISlice: StateCreator<any, [], [], UISlice> = (set, get) => ({
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
  viewMode: 'REGION',
  currentRoast: null,
  notifications: [],
  viewingArchive: null,
  activeBill: null,
  _hasHydrated: false,

  // --- Actions Implementation ---
  setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
  setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
  
  setArchiveOpen: (isOpen) => set({ 
    isArchiveOpen: isOpen,
    viewingArchive: isOpen ? get().viewingArchive : null 
  }),
  
  setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
  setJobBoardOpen: (isOpen) => set({ isJobBoardOpen: isOpen }),
  setHousingOpen: (isOpen) => set({ isHousingOpen: isOpen }),
  setHospitalOpen: (isOpen) => set({ isHospitalOpen: isOpen }),
  setCryptoOpen: (isOpen) => set({ isCryptoOpen: isOpen }),
  setBankOpen: (isOpen) => set({ isBankOpen: isOpen }),
  setFaithOpen: (isOpen) => set({ isFaithOpen: isOpen }),
  
  setRoast: (content) => set({ currentRoast: content }),
  setViewingArchive: (archiveId) => set({ viewingArchive: archiveId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setHasHydrated: (state) => set({ _hasHydrated: state }),

  closeBill: () => set({ activeBill: null }),

  dismissRoastAndEndEvent: () => {
    const { viewingArchive } = get();
    // 如果当前正在查看档案（比如结局时），关闭 Roast 后保持档案打开
    if (viewingArchive) {
      set({
        currentRoast: null,
        currentEvent: null, 
        isArchiveOpen: true
      });
    } else {
      set({
        currentRoast: null,
        currentEvent: null
      });
    }
  },

  addNotification: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    
    set((state: any) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    
    // ✅ Fix: 使用系统配置的持续时间，不再硬编码 3000ms
    const duration = SYSTEM_RULES.ui?.notificationDuration || 3000;
    
    setTimeout(() => get().removeNotification(id), duration);
  },

  removeNotification: (id) => {
    set((state: any) => ({
      notifications: state.notifications.filter((n: GameNotification) => n.id !== id)
    }));
  },
});