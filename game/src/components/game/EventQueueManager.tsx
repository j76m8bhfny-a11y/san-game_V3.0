/**
 * EventQueueManager - 事件队列管理
 * 
 * 将事件弹窗接入 ModalQueueManager 系统
 * 确保事件在所有提示（如住房系统解锁）之后显示
 * 使用全局状态管理，供 App.tsx 使用
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useQueuedModal } from '@/components/ui/ModalQueueManager';

export const useEventQueue = () => {
  const { currentEvent, isEventOpen, closeEvent } = useGameStore();
  const { show, close, isOpen } = useQueuedModal('event');
  
  // 检查是否可以显示事件（队列空闲且已轮到事件）
  const canShowEvent = isOpen && isEventOpen && currentEvent;
  
  // 将事件加入队列
  const queueEvent = useCallback(() => {
    if (isEventOpen && currentEvent && !isOpen) {
      show(
        <EventPlaceholder />,
        // 事件不自动关闭
      );
      return true;
    }
    return false;
  }, [isEventOpen, currentEvent, isOpen, show]);
  
  // 关闭事件
  const closeQueuedEvent = useCallback(() => {
    close();
    closeEvent();
  }, [close, closeEvent]);
  
  return {
    canShowEvent,
    isEventQueued: isOpen,
    queueEvent,
    closeQueuedEvent,
    queuedEvent: currentEvent,
  };
};

// 占位组件，实际渲染在 App.tsx 中
const EventPlaceholder: React.FC = () => null;

// 提供全局访问的组件
export const EventQueueManager: React.FC = () => {
  const { isEventOpen, currentEvent, closeEvent } = useGameStore();
  const { isOpen, close } = useQueuedModal('event');
  
  // 当事件被外部关闭时，同步队列状态
  useEffect(() => {
    if (!isEventOpen && isOpen) {
      close();
    }
  }, [isEventOpen, isOpen, close]);
  
  // 当队列中的事件被关闭时，同步外部状态
  useEffect(() => {
    if (isOpen && !currentEvent) {
      closeEvent();
    }
  }, [isOpen, currentEvent, closeEvent]);
  
  return null;
};

export default EventQueueManager;
