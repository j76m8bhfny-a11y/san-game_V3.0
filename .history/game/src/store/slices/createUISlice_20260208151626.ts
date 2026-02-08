import { StateCreator } from 'zustand';
import { GameNotification, Bill } from '@/types/schema';
import { StoreState } from '@/types/store';
// ✅ 1. 引入系统规则配置 (Source of Truth)
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// ✅ 2. 通知定时器管理（防止内存泄漏）
const pendingTimers = new Set<NodeJS.Timeout>();
let notificationIdCounter = 0;

// ✅ 3. 安全的 ID 生成（时间戳 + 递增计数器，避免重复）
const generateNotificationId = () => {
  notificationIdCounter = (notificationIdCounter + 1) % 1000000;
  return `${Date.now().toString(36)}-${notificationIdCounter.toString(36)}`;
};

// ✅ 4. 清理所有待处理的定时器（游戏重置时调用）
export const clearAllNotificationTimers = () => {
  pendingTimers.forEach(timer => clearTimeout(timer));
  pendingTimers.clear();
};

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
    const store = get() as any;
    
    // 如果当前正在查看档案（比如结局时），关闭 Roast 后保持档案打开
    if (viewingArchive) {
      set({
        currentRoast: null,
        isArchiveOpen: true
      });
    } else {
      set({ currentRoast: null });
    }
    
    // ✅ 调用 GameSlice 的方法来正确关闭事件
    if (store.closeEvent) {
      store.closeEvent();
    }
  },

  addNotification: (message, type = 'info') => {
    // ✅ 使用安全的 ID 生成方式
    const id = generateNotificationId();
    
    // ✅ 限制通知数量上限（防止极端情况内存问题）
    const MAX_NOTIFICATIONS = 10;
    
    set((state: any) => {
      const currentNotifications = state.notifications || [];
      // 如果超过上限，移除最旧的通知
      const trimmedNotifications = currentNotifications.length >= MAX_NOTIFICATIONS 
        ? currentNotifications.slice(currentNotifications.length - MAX_NOTIFICATIONS + 1)
        : currentNotifications;
      
      return {
        notifications: [...trimmedNotifications, { id, message, type }]
      };
    });
    
    // ✅ 使用系统配置的持续时间，不再硬编码 3000ms
    const duration = SYSTEM_RULES.ui?.notificationDuration || 3000;
    
    // ✅ 创建定时器并记录，便于清理
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
});