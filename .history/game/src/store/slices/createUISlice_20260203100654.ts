import { StateCreator } from 'zustand';
// ✅ 修复：从 schema 导入缺失的 Bill 类型
import { GameNotification, Bill } from '@/types/schema';

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
  activeBill: Bill | null; // ✅ 确保 Bill 类型已正确引用

  // --- Actions ---
  setShopOpen: (isOpen: boolean) => void;
  setInventoryOpen: (isOpen: boolean) => void;
  setArchiveOpen: (isOpen: boolean) => void;
  setMenuOpen: (isOpen: boolean) => void;
  setJobBoardOpen: (isOpen: boolean) => void;
  setHousingOpen: (isOpen: boolean) => void;
  setHospitalOpen: (isOpen: boolean) => void;
  setCryptoOpen: (isOpen: boolean) => void;
  setRoast: (content: string | null) => void;
  setViewingArchive: (archiveId: string | null) => void;
  
  // ✅ 补充：在接口中定义 closeBill，以便在 BillOverlay 中正确调用
  closeBill: () => void;

  dismissRoastAndEndEvent: () => void;

  // 通知系统
  addNotification: (message: string, type?: GameNotification['type']) => void;
  removeNotification: (id: string) => void;
  setViewMode: (mode: 'MAP' | 'REGION') => void;
  setFaithOpen: (isOpen: boolean) => void; 
  setBankOpen: (isOpen: boolean) => void;
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
  setRoast: (content) => set({ currentRoast: content }),
  setViewingArchive: (archiveId) => set({ viewingArchive: archiveId }),
  setBankOpen: (isOpen) => set({ isBankOpen: isOpen }),
  setFaithOpen: (isOpen) => set({ isFaithOpen: isOpen }),

  // ✅ 规范化 Action 实现
  closeBill: () => set({ activeBill: null }),

  dismissRoastAndEndEvent: () => {
    const { viewingArchive } = get();
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
    setTimeout(() => get().removeNotification(id), 3000);
  },

  removeNotification: (id) => {
    set((state: any) => ({
      notifications: state.notifications.filter((n: GameNotification) => n.id !== id)
    }));
  },
  setViewMode: (mode) => set({ viewMode: mode }),
});