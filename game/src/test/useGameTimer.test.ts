import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { globalTimerManager } from '@/hooks/useGameTimer';

describe('全局定时器管理器', () => {
  beforeEach(() => {
    globalTimerManager.clearAll();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('setTimeout 正常执行', () => {
    const callback = vi.fn();
    globalTimerManager.setTimeout(callback, 1000);
    
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });

  it('setInterval 正常执行', () => {
    const callback = vi.fn();
    globalTimerManager.setInterval(callback, 1000);
    
    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('clearAll 清理所有定时器', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    
    globalTimerManager.setTimeout(callback1, 1000);
    globalTimerManager.setInterval(callback2, 1000);
    
    globalTimerManager.clearAll();
    vi.advanceTimersByTime(2000);
    
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });

  it('getActiveCount 返回活动定时器数量', () => {
    expect(globalTimerManager.getActiveCount()).toBe(0);
    
    globalTimerManager.setTimeout(() => {}, 1000);
    expect(globalTimerManager.getActiveCount()).toBe(1);
    
    globalTimerManager.setInterval(() => {}, 1000);
    expect(globalTimerManager.getActiveCount()).toBe(2);
  });
});
