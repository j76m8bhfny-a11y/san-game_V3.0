/**
 * 游戏定时器 Hook
 * 统一管理定时器，自动清理，防止内存泄露
 */

import { useCallback, useEffect, useRef } from 'react';

export function useGameTimer() {
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      // 清理所有 setTimeout
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
      
      // 清理所有 setInterval
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
    };
  }, []);

  /**
   * 设置安全的 setTimeout
   */
  const setGameTimeout = useCallback((callback: () => void, delay: number): (() => void) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    
    timersRef.current.add(timer);
    
    // 返回取消函数
    return () => {
      clearTimeout(timer);
      timersRef.current.delete(timer);
    };
  }, []);

  /**
   * 设置安全的 setInterval
   */
  const setGameInterval = useCallback((callback: () => void, delay: number): (() => void) => {
    const interval = setInterval(callback, delay);
    intervalsRef.current.add(interval);
    
    // 返回取消函数
    return () => {
      clearInterval(interval);
      intervalsRef.current.delete(interval);
    };
  }, []);

  /**
   * 清理所有定时器
   */
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    
    intervalsRef.current.forEach(interval => clearInterval(interval));
    intervalsRef.current.clear();
  }, []);

  return {
    setGameTimeout,
    setGameInterval,
    clearAllTimers
  };
}

/**
 * 全局定时器管理器（用于非组件场景）
 */
class GlobalTimerManager {
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();

  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  clearTimer(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  getActiveCount(): number {
    return this.timers.size + this.intervals.size;
  }
}

// 导出全局实例
export const globalTimerManager = new GlobalTimerManager();

// 在页面卸载时清理（防止内存泄露）
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalTimerManager.clearAll();
  });
}
