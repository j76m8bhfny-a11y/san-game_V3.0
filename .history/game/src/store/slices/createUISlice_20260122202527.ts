import { StateCreator } from 'zustand';
import { GameNotification } from '@/types/schema';

// 定义 UI 切片的状态和方法
export interface UISlice {
  // --- State ---
  isShopOpen: boolean;
  isInventoryOpen: boolean;
  isArchiveOpen: boolean;
  isMenuOpen: boolean;
  currentRoast: string | null;
  notifications: GameNotification[];
  viewingArchive: string | null;

  // --- Actions ---
  setShopOpen: (isOpen: boolean) => void;
  setInventoryOpen: (isOpen: boolean) => void;
  setArchiveOpen: (isOpen: boolean) => void;
  setMenuOpen: (isOpen: boolean) => void;
  setRoast: (content: string | null) => void;
  setViewingArchive: (archiveId: string | null) => void;
  
  // 复杂的 UI 逻辑：关闭吐槽弹窗并结束当前事件（用于查看档案后）
  dismissRoastAndEndEvent: () => void;

  // 通知系统
  addNotification: (message: string, type?: GameNotification['type']) => void;
  removeNotification: (id: string) => void;
}

// 创建切片
// 注意：这里的泛型 <any, [], [], UISlice> 表示我们将它合并到主 Store 中
export const createUISlice: StateCreator<any, [], [], UISlice> = (set, get) => ({
  // --- Initial State ---
  isShopOpen: false,
  isInventoryOpen: false,
  isArchiveOpen: false,
  isMenuOpen: false,
  currentRoast: null,
  notifications: [],
  viewingArchive: null,

  // --- Actions Implementation ---
  setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
  setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
  
  setArchiveOpen: (isOpen) => set({ 
    isArchiveOpen: isOpen,
    // 如果关闭档案，同时清空当前查看的档案 ID
    viewingArchive: isOpen ? get().viewingArchive : null 
  }),
  
  setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
  setRoast: (content) => set({ currentRoast: content }),
  setViewingArchive: (archiveId) => set({ viewingArchive: archiveId }),

  dismissRoastAndEndEvent: () => {
    const { viewingArchive } = get();
    // 如果当前正在查看档案（比如通过事件选项解锁并跳转的），关闭 Roast 后保持 Archive 开启
    if (viewingArchive) {
      set({ 
        currentRoast: null, 
        currentEvent: null, // 结束事件
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
    const id = Math.random().toString(36).substr(2, 9);
    set((state: any) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    // 3秒后自动移除
    setTimeout(() => get().removeNotification(id), 3000);
  },

  removeNotification: (id) => {
    set((state: any) => ({
      notifications: state.notifications.filter((n: GameNotification) => n.id !== id)
    }));
  },
});