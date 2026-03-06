/**
 * FocusTrap - 焦点陷阱组件
 * 
 * 用于Modal、Dialog等弹窗，确保Tab导航在弹窗内循环
 * 符合WAI-ARIA规范
 */

import React, { useEffect, useRef, useCallback } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  /** 是否激活焦点陷阱 */
  isActive: boolean;
  /** 初始焦点元素（默认为第一个可聚焦元素） */
  initialFocus?: React.RefObject<HTMLElement>;
  /** 恢复焦点元素（关闭时焦点返回到该元素） */
  returnFocus?: React.RefObject<HTMLElement>;
  /** 关闭回调（Escape键触发） */
  onClose?: () => void;
  /** 是否阻止Escape键关闭 */
  preventEscape?: boolean;
}

/**
 * 获取可聚焦元素列表
 */
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ].join(', ');

  return Array.from(container.querySelectorAll(selector)).filter(
    (el): el is HTMLElement => {
      // 过滤不可见元素
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }
  );
};

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive,
  initialFocus,
  returnFocus,
  onClose,
  preventEscape = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // 保存之前的焦点元素
  useEffect(() => {
    if (isActive) {
      previousActiveElement.current = document.activeElement;
    }
  }, [isActive]);

  // 设置初始焦点
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else if (containerRef.current) {
        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isActive, initialFocus]);

  // 恢复焦点
  useEffect(() => {
    return () => {
      if (returnFocus?.current) {
        returnFocus.current.focus();
      } else if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [returnFocus]);

  // Tab导航循环
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isActive || !containerRef.current) return;

    // Escape处理
    if (e.key === 'Escape' && onClose && !preventEscape) {
      e.preventDefault();
      onClose();
      return;
    }

    // Tab导航陷阱
    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements(containerRef.current);
      
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift+Tab: 如果在第一个元素，跳到最后一个
      if (e.shiftKey) {
        if (activeElement === firstElement || !containerRef.current.contains(activeElement as Node)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: 如果在最后一个元素，跳到第一个
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isActive, onClose, preventEscape]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={containerRef}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
};

/**
 * 简单的焦点管理Hook
 * 用于单个组件的焦点控制
 */
export const useFocusManager = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement>(null);
  const lastFocusableRef = useRef<HTMLElement>(null);

  const setFirstFocusable = useCallback((el: HTMLElement | null) => {
    firstFocusableRef.current = el;
  }, []);

  const setLastFocusable = useCallback((el: HTMLElement | null) => {
    lastFocusableRef.current = el;
  }, []);

  const focusFirst = useCallback(() => {
    firstFocusableRef.current?.focus();
  }, []);

  const focusLast = useCallback(() => {
    lastFocusableRef.current?.focus();
  }, []);

  return {
    containerRef,
    firstFocusableRef,
    lastFocusableRef,
    setFirstFocusable,
    setLastFocusable,
    focusFirst,
    focusLast,
  };
};

export default FocusTrap;
