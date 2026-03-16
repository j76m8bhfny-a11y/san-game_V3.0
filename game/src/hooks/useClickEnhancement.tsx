/**
 * useClickEnhancement - 点击交互增强
 * 
 * 提供：
 * - 双击防抖
 * - 长按检测
 * - 触摸反馈
 * - 点击波纹效果
 */

import { useCallback, useRef, useState, useEffect } from 'react';

interface ClickEnhancementOptions {
  /** 双击防抖间隔(ms) */
  debounceMs?: number;
  /** 长按触发时间(ms) */
  longPressMs?: number;
  /** 禁用状态 */
  disabled?: boolean;
  /** 长按回调 */
  onLongPress?: () => void;
  /** 双击回调 */
  onDoubleClick?: () => void;
}

/**
 * 双击防抖Hook
 * 防止快速双击导致重复触发
 */
export const useDoubleClickPrevention = (options: { debounceMs?: number } = {}) => {
  const { debounceMs = 500 } = options;
  const lastClickTimeRef = useRef(0);

  const isDebounced = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    if (timeSinceLastClick < debounceMs) {
      console.log('[Click] Double click prevented');
      return true;
    }
    
    lastClickTimeRef.current = now;
    return false;
  }, [debounceMs]);

  return isDebounced;
};

/**
 * 长按检测Hook
 * 用于显示详情/菜单
 */
export const useLongPress = (options: ClickEnhancementOptions = {}) => {
  const { 
    longPressMs = 500, 
    disabled = false, 
    onLongPress,
    onDoubleClick,
    debounceMs = 500
  } = options;
  
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);
  const isLongPressTriggeredRef = useRef(false);

  const startPress = useCallback(() => {
    if (disabled) return;
    
    isLongPressTriggeredRef.current = false;
    setIsPressing(true);
    
    timerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      onLongPress?.();
      setIsPressing(false);
    }, longPressMs);
  }, [disabled, longPressMs, onLongPress]);

  const endPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    // 如果长按已触发，不处理点击
    if (isLongPressTriggeredRef.current) {
      return;
    }
    
    // 双击检测
    const now = Date.now();
    if (now - lastClickTimeRef.current < debounceMs) {
      onDoubleClick?.();
      lastClickTimeRef.current = 0;
      return;
    }
    lastClickTimeRef.current = now;
  }, [disabled, debounceMs, onDoubleClick]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    isPressing,
    handlers: {
      onMouseDown: startPress,
      onMouseUp: endPress,
      onMouseLeave: endPress,
      onTouchStart: startPress,
      onTouchEnd: endPress,
      onClick: handleClick,
    },
  };
};

/**
 * 触摸反馈Hook
 * 提供:active状态的即时反馈
 */
export const useTouchFeedback = () => {
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activate = useCallback(() => {
    setIsActive(true);
    
    // 100ms后自动移除active状态
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isActive,
    activate,
    className: isActive ? 'scale-95 brightness-90' : '',
  };
};

/**
 * 点击波纹效果Hook
 * 提供Material Design风格的波纹效果
 */
export const useRippleEffect = () => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const idCounter = useRef(0);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = { id: idCounter.current++, x, y };
    
    setRipples(prev => [...prev, newRipple]);
    
    // 600ms后移除波纹
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  }, []);

  const RippleContainer: React.FC<{ children: React.ReactNode; className?: string }> = 
    ({ children, className = '' }) => (
      <span className={`relative overflow-hidden inline-block ${className}`}>
        {children}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
      </span>
    );

  return { createRipple, RippleContainer };
};

/**
 * 右键菜单Hook
 * 为元素添加上下文菜单支持
 */
export const useContextMenu = (options: {
  onContextMenu?: () => void;
  disabled?: boolean;
} = {}) => {
  const { onContextMenu, disabled = false } = options;

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    onContextMenu?.();
  }, [disabled, onContextMenu]);

  return {
    onContextMenu: handleContextMenu,
  };
};
