/**
 * 节流 Hook - 防止函数被频繁调用
 * 用于关键按钮（购买、结束回合等）防止重复提交
 */

import { useRef, useCallback } from 'react';

interface ThrottleOptions {
  /** 节流延迟（毫秒） */
  delay?: number;
  /** 是否执行延迟队列中的最后一次调用 */
  trailing?: boolean;
}

/**
 * 创建节流函数
 * @param fn 要节流的函数
 * @param options 配置选项
 * @returns [throttledFn, isPending, reset]
 *  - throttledFn: 节流后的函数
 *  - isPending: 返回是否处于节流冷却中
 *  - reset: 手动重置节流状态
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  options: ThrottleOptions = {}
): [T, () => boolean, () => void] {
  const { delay = 300, trailing = false } = options;
  
  const lastTime = useRef<number>(0);
  const pendingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  const reset = useCallback(() => {
    lastTime.current = 0;
    pendingRef.current = false;
    pendingArgsRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const throttledFn = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastTime.current;
    
    // 如果超过延迟时间，立即执行
    if (timeSinceLastCall >= delay) {
      lastTime.current = now;
      pendingRef.current = false;
      pendingArgsRef.current = null;
      fn(...args);
      return;
    }
    
    // 在冷却期内
    pendingRef.current = true;
    
    // 如果需要执行最后一次调用（trailing）
    if (trailing) {
      pendingArgsRef.current = args;
      
      // 清除之前的延迟调用
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // 设置新的延迟调用
      timeoutRef.current = setTimeout(() => {
        lastTime.current = Date.now();
        pendingRef.current = false;
        if (pendingArgsRef.current) {
          fn(...pendingArgsRef.current);
          pendingArgsRef.current = null;
        }
        timeoutRef.current = null;
      }, delay - timeSinceLastCall);
    }
  }, [fn, delay, trailing]) as T;

  const isPending = useCallback(() => pendingRef.current, []);

  return [throttledFn, isPending, reset];
}

/**
 * 简化版节流 Hook - 只返回节流函数
 * 适用于不需要检查状态的场景
 */
export function useThrottleSimple<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  const lastTime = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime.current >= delay) {
      lastTime.current = now;
      fn(...args);
    }
  }, [fn, delay]) as T;
}
