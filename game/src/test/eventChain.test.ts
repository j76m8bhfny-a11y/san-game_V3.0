import { describe, it, expect, vi, beforeEach } from 'vitest';

// 模拟事件连锁深度限制
describe('事件连锁深度限制', () => {
  const MAX_EVENT_CHAIN = 3;
  let eventChainDepth = 0;

  beforeEach(() => {
    eventChainDepth = 0;
  });

  const triggerEvent = (eventId: string): boolean => {
    if (eventChainDepth >= MAX_EVENT_CHAIN) {
      console.warn(`事件连锁深度超过限制 (${MAX_EVENT_CHAIN})，停止触发新事件`);
      return false;
    }
    eventChainDepth++;
    console.log(`触发事件: ${eventId}, 深度: ${eventChainDepth}`);
    return true;
  };

  const closeEvent = () => {
    eventChainDepth = 0;
  };

  it('正常触发事件（深度 < 3）', () => {
    expect(triggerEvent('事件1')).toBe(true);
    expect(triggerEvent('事件2')).toBe(true);
    expect(triggerEvent('事件3')).toBe(true);
    expect(eventChainDepth).toBe(3);
  });

  it('超过连锁深度时阻止触发', () => {
    triggerEvent('事件1');
    triggerEvent('事件2');
    triggerEvent('事件3');
    
    // 第4次应该被阻止
    expect(triggerEvent('事件4')).toBe(false);
    expect(eventChainDepth).toBe(3);
  });

  it('关闭事件后重置深度', () => {
    triggerEvent('事件1');
    triggerEvent('事件2');
    triggerEvent('事件3');
    
    closeEvent();
    
    // 重置后可以再次触发
    expect(triggerEvent('事件4')).toBe(true);
    expect(eventChainDepth).toBe(1);
  });
});
