/**
 * ModalQueueManager - 弹窗队列管理系统
 * 
 * 解决弹窗堆叠问题：
 * - 同一时间只显示一个弹窗
 * - 按优先级排队
 * - 互斥规则管理
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// 弹窗类型
export type ModalType = 
  | 'deathSummary'      // 死亡结算 (最高优先级)
  | 'systemAlert'       // 系统警告
  | 'progressiveUnlock' // 机制解锁
  | 'guardianHint'      // 守护灵提示
  | 'insightMilestone'  // 灵视里程碑
  | 'dOptionConfirm'    // D选项确认
  | 'weeklySettlement'  // 周结算
  | 'billOverlay'       // 账单
  | 'archiveMilestone'  // 档案里程碑
  | 'roastModal';       // 嘲讽弹窗

// 弹窗优先级配置 (数字越大优先级越高)
const MODAL_PRIORITIES: Record<ModalType, number> = {
  'deathSummary': 10000,      // 最高：死亡时必须看到
  'systemAlert': 200,         // 系统警告强制弹窗
  'progressiveUnlock': 100,   // 机制解锁重要
  'guardianHint': 95,         // 守护灵提示
  'insightMilestone': 90,     // 灵视里程碑
  'dOptionConfirm': 85,       // D选项确认
  'archiveMilestone': 80,     // 档案里程碑
  'weeklySettlement': 50,     // 周结算
  'billOverlay': 40,          // 账单
  'roastModal': 30,           // 嘲讽
};

// 互斥规则：某些弹窗不能同时显示
const MUTUAL_EXCLUSIVE: ModalType[][] = [
  ['guardianHint', 'insightMilestone', 'progressiveUnlock'], // 新手引导类互斥
  ['deathSummary', 'weeklySettlement', 'billOverlay'],        // 结算类互斥
];

// 弹窗队列项
interface QueuedModal {
  id: string;
  type: ModalType;
  component: React.ReactNode;
  priority: number;
  timestamp: number;
  autoClose?: number; // 自动关闭时间（毫秒）
}

// Context接口
interface ModalQueueContextType {
  currentModal: QueuedModal | null;
  queueModal: (type: ModalType, component: React.ReactNode, autoClose?: number) => string;
  closeCurrent: () => void;
  isModalOpen: (type: ModalType) => boolean;
  clearQueue: () => void;
}

const ModalQueueContext = createContext<ModalQueueContextType | null>(null);

// Provider组件
export const ModalQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedModal[]>([]);
  const [currentModal, setCurrentModal] = useState<QueuedModal | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 处理队列
  useEffect(() => {
    if (isProcessing || currentModal || queue.length === 0) return;

    setIsProcessing(true);
    
    // 找到优先级最高的弹窗
    const sortedQueue = [...queue].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    const nextModal = sortedQueue[0];
    
    // 延迟显示，给上一个弹窗关闭的动画时间
    setTimeout(() => {
      setCurrentModal(nextModal);
      setQueue(prev => prev.filter(m => m.id !== nextModal.id));
      setIsProcessing(false);

      // 自动关闭
      if (nextModal.autoClose) {
        setTimeout(() => {
          setCurrentModal(prev => prev?.id === nextModal.id ? null : prev);
        }, nextModal.autoClose);
      }
    }, 300);
  }, [queue, currentModal, isProcessing]);

  // 加入队列
  const queueModal = useCallback((
    type: ModalType, 
    component: React.ReactNode, 
    autoClose?: number
  ): string => {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setQueue(prev => {
      // 检查是否已存在同类型弹窗
      if (prev.some(m => m.type === type)) {
        return prev;
      }

      // 检查互斥规则
      for (const exclusiveGroup of MUTUAL_EXCLUSIVE) {
        if (exclusiveGroup.includes(type)) {
          // 如果队列中已有同组的弹窗，移除优先级较低的
          const existingInGroup = prev.filter(m => exclusiveGroup.includes(m.type));
          if (existingInGroup.length > 0) {
            const currentPriority = MODAL_PRIORITIES[type];
            const higherPriorityExisting = existingInGroup.find(
              m => m.priority > currentPriority
            );
            if (higherPriorityExisting) {
              return prev; // 有更高优先级的同组弹窗，不加入
            }
            // 移除同组中优先级较低的
            prev = prev.filter(m => !exclusiveGroup.includes(m.type) || m.priority >= currentPriority);
          }
        }
      }

      return [...prev, {
        id,
        type,
        component,
        priority: MODAL_PRIORITIES[type],
        timestamp: Date.now(),
        autoClose,
      }];
    });

    return id;
  }, []);

  // 关闭当前弹窗
  const closeCurrent = useCallback(() => {
    setCurrentModal(null);
  }, []);

  // 检查某类型弹窗是否打开或在队列中
  const isModalOpen = useCallback((type: ModalType): boolean => {
    return currentModal?.type === type || queue.some(m => m.type === type);
  }, [currentModal, queue]);

  // 清空队列
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentModal(null);
  }, []);

  return (
    <ModalQueueContext.Provider value={{
      currentModal,
      queueModal,
      closeCurrent,
      isModalOpen,
      clearQueue,
    }}>
      {children}
      {/* 渲染当前弹窗 */}
      {currentModal && (
        <div className="modal-queue-current">
          {currentModal.component}
        </div>
      )}
    </ModalQueueContext.Provider>
  );
};

// Hook
export const useModalQueue = () => {
  const context = useContext(ModalQueueContext);
  if (!context) {
    throw new Error('useModalQueue must be used within ModalQueueProvider');
  }
  return context;
};

// 便捷Hook：用于特定弹窗类型
export const useQueuedModal = (type: ModalType) => {
  const { queueModal, closeCurrent, isModalOpen } = useModalQueue();

  const show = useCallback((component: React.ReactNode, autoClose?: number) => {
    return queueModal(type, component, autoClose);
  }, [queueModal, type]);

  const close = useCallback(() => {
    closeCurrent();
  }, [closeCurrent]);

  const isOpen = isModalOpen(type);

  return { show, close, isOpen };
};

export default ModalQueueProvider;
