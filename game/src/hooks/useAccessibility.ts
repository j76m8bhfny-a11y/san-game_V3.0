/**
 * useAccessibility - 可访问性相关的基础Hooks
 * 
 * 包含：
 * - IME冲突检测
 * - 减少动画偏好检测
 * - 键盘导航辅助
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * 检测用户是否偏好减少动画
 * 用于癫痫/眩晕保护
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * 检测用户是否偏好高对比度
 */
export const usePrefersHighContrast = (): boolean => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
};

/**
 * IME输入法冲突检测
 * 返回当前是否有输入法正在组合输入
 */
export const useIMEStatus = (): { isComposing: boolean; showWarning: () => void } => {
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    const handleCompositionStart = () => setIsComposing(true);
    const handleCompositionEnd = () => setIsComposing(false);

    window.addEventListener('compositionstart', handleCompositionStart);
    window.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      window.removeEventListener('compositionstart', handleCompositionStart);
      window.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, []);

  const showWarning = useCallback(() => {
    if (isComposing) {
      // 可以在这里触发toast或console警告
      console.log('[IME] 输入法处于组合状态，快捷键可能被拦截');
    }
  }, [isComposing]);

  return { isComposing, showWarning };
};

/**
 * 键盘导航增强
 * 处理Tab导航和Escape关闭
 */
export const useKeyboardNavigation = (options: {
  onEscape?: () => void;
  onTab?: (direction: 'forward' | 'backward') => void;
  trapFocus?: boolean;
} = {}) => {
  const { onEscape, onTab, trapFocus = false } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape处理
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }

      // Tab导航处理
      if (e.key === 'Tab' && onTab) {
        const direction = e.shiftKey ? 'backward' : 'forward';
        onTab(direction);
      }

      // 焦点陷阱（用于Modal）
      if (trapFocus && e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onTab, trapFocus]);
};

/**
 * 宣布消息给屏幕阅读器
 */
export const useAnnouncer = () => {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((msg: string, priority: 'polite' | 'assertive' = 'polite') => {
    setMessage(msg);
    setPoliteness(priority);
    // 清空消息以便下次可以重复宣布相同内容
    setTimeout(() => setMessage(''), 100);
  }, []);

  return { message, politeness, announce };
};

/**
 * 检测触摸设备
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0
      );
    };
    checkTouch();
  }, []);

  return isTouch;
};
