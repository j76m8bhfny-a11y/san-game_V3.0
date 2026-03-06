/**
 * useGlobalKeyboard - 全局键盘事件管理器
 * 
 * 已实现功能：
 * - IME冲突检测
 * - Escape关闭弹窗/暂停
 * - Shift+Tab防冲突（Steam Overlay）
 * - Q/W/E/R 事件选项选择
 * - E结束回合, I背包, M地图, Ctrl+S保存
 */

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardOptions {
  /** 当前是否有弹窗打开（用于Escape处理） */
  isModalOpen?: boolean;
  /** 当前是否显示事件窗口 */
  isEventOpen?: boolean;
  /** 当前是否在游戏主界面 */
  isGameActive?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 暂停回调 */
  onPause?: () => void;
  /** 结束回合回调 */
  onEndTurn?: () => void;
  /** 打开背包回调 */
  onOpenInventory?: () => void;
  /** 切换地图回调 */
  onToggleMap?: () => void;
  /** 保存游戏回调 */
  onSave?: () => void;
}

/**
 * 全局键盘管理器
 */
export const useGlobalKeyboard = (options: KeyboardOptions = {}) => {
  const { 
    isModalOpen, 
    isEventOpen, 
    isGameActive,
    onClose, 
    onPause,
    onEndTurn,
    onOpenInventory,
    onToggleMap,
    onSave,
  } = options;
  const imeActiveRef = useRef(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ===== IME冲突检测 =====
    if (e.isComposing) {
      imeActiveRef.current = true;
      return;
    }

    // 检测输入法状态变化
    if (e.key === 'Process') {
      imeActiveRef.current = true;
      return;
    }

    // ===== Ctrl+S 保存 =====
    if (e.key === 's' && e.ctrlKey) {
      e.preventDefault();
      if (isGameActive && onSave) {
        onSave();
      }
      return;
    }

    // ===== 游戏功能快捷键（仅在游戏主界面且无弹窗时）=====
    if (isGameActive && !isModalOpen && !isEventOpen) {
      switch (e.key.toLowerCase()) {
        case 'e': // 结束回合
          e.preventDefault();
          onEndTurn?.();
          return;
        case 'i': // 打开背包
          e.preventDefault();
          onOpenInventory?.();
          return;
        case 'm': // 切换地图
          e.preventDefault();
          onToggleMap?.();
          return;
      }
    }

    // ===== 事件选项快捷键（Q/W/E/R）=====
    if (isEventOpen) {
      const optionMap: Record<string, string> = {
        'q': 'A', 'w': 'B', 'e': 'C', 'r': 'D',
        'Q': 'A', 'W': 'B', 'E': 'C', 'R': 'D',
      };
      
      if (optionMap[e.key]) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('select-event-option', { 
          detail: { option: optionMap[e.key] } 
        }));
        return;
      }
    }

    // ===== Shift+Tab防冲突（Steam Overlay）=====
    if (e.key === 'Tab' && e.shiftKey) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Keyboard] Shift+Tab pressed (Steam Overlay safe)');
      }
    }

    // ===== Escape处理 =====
    if (e.key === 'Escape') {
      if (isModalOpen && onClose) {
        e.preventDefault();
        onClose();
        return;
      }
      
      if (!isModalOpen && !isEventOpen && onPause) {
        e.preventDefault();
        onPause();
        return;
      }
    }

    // ===== 调试快捷键（仅开发模式）=====
    if (process.env.NODE_ENV === 'development') {
      if (e.key === 'F1') {
        e.preventDefault();
        console.log('[Debug] IME Status:', imeActiveRef.current ? 'Active' : 'Inactive');
      }
    }
  }, [isModalOpen, isEventOpen, isGameActive, onClose, onPause, onEndTurn, onOpenInventory, onToggleMap, onSave]);

  // 监听输入法事件
  useEffect(() => {
    const handleCompositionStart = () => {
      imeActiveRef.current = true;
    };
    
    const handleCompositionEnd = () => {
      imeActiveRef.current = false;
    };

    window.addEventListener('compositionstart', handleCompositionStart);
    window.addEventListener('compositionend', handleCompositionEnd);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('compositionstart', handleCompositionStart);
      window.removeEventListener('compositionend', handleCompositionEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    isIMEActive: () => imeActiveRef.current,
  };
};

/**
 * 检测键盘导航用户
 * 当用户按Tab键时，添加键盘导航类
 */
export const useKeyboardUserDetection = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-user');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};

/**
 * 为特定元素添加键盘激活支持
 * 确保可以通过Enter/Space激活
 */
export const useKeyboardActivatable = (
  onActivate: () => void,
  options: { disabled?: boolean } = {}
) => {
  const { disabled = false } = options;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  }, [onActivate, disabled]);

  return {
    onKeyDown: handleKeyDown,
    tabIndex: disabled ? -1 : 0,
    role: 'button',
  };
};
