/**
 * 节流按钮组件
 * 防止快速点击导致的重复操作
 */

import React, { ButtonHTMLAttributes, useCallback } from 'react';
import { useThrottle } from '@/hooks/useThrottle';

interface ThrottledButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 点击回调函数 */
  onClick: () => void;
  /** 节流延迟（毫秒），默认 300ms */
  throttleDelay?: number;
  /** 是否在节流中显示加载状态 */
  showLoading?: boolean;
  /** 自定义节流中显示的内容 */
  loadingContent?: React.ReactNode;
}

export const ThrottledButton: React.FC<ThrottledButtonProps> = ({
  onClick,
  throttleDelay = 300,
  showLoading = true,
  loadingContent,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const [throttledClick, isPending] = useThrottle(
    onClick,
    { delay: throttleDelay }
  );

  const handleClick = useCallback(() => {
    throttledClick();
  }, [throttledClick]);

  const isDisabled = disabled || (showLoading && isPending());

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isDisabled}
      className={`${className} ${isPending() && showLoading ? 'opacity-70 cursor-wait' : ''}`}
    >
      {isPending() && showLoading && loadingContent ? loadingContent : children}
    </button>
  );
};

/**
 * 高阶组件：为按钮添加节流功能
 * 适用于需要对现有按钮组件进行节流包装的场景
 */
export function withThrottle<P extends { onClick: () => void; disabled?: boolean }>(
  Component: React.ComponentType<P>,
  delay: number = 300
): React.FC<P> {
  return function ThrottledComponent(props) {
    const [throttledClick, isPending] = useThrottle(
      props.onClick,
      { delay }
    );

    return (
      <Component
        {...props}
        onClick={throttledClick}
        disabled={props.disabled || isPending()}
      />
    );
  };
}
