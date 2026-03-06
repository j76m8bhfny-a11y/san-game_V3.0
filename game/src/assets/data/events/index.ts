/**
 * Events Index - 事件动态加载入口
 * 
 * 所有事件都通过这里暴露给游戏逻辑
 * 支持动态导入和类型安全
 */

import { GameEvent } from '@/types/schema';

// ==========================================
// 事件模块类型
// ==========================================

export interface EventModule {
  default: GameEvent;
}

export interface EventRegistry {
  [eventId: string]: () => Promise<EventModule>;
}

// ==========================================
// 动态导入映射
// ==========================================

// 使用Vite的import.meta.glob动态加载所有事件
const eventModules: EventRegistry = (import.meta as any).glob('./*/**/*.json');

// ==========================================
// 事件索引
// ==========================================

class EventIndex {
  private cache: Map<string, GameEvent> = new Map();
  private accessOrder: string[] = [];  // LRU追踪
  private readonly MAX_CACHE_SIZE = 100;  // 最大缓存事件数

  /**
   * 更新访问顺序（LRU）
   */
  private updateAccessOrder(eventId: string): void {
    const index = this.accessOrder.indexOf(eventId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(eventId);
  }

  /**
   * 清理最旧的缓存项
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) return;
    const oldestId = this.accessOrder.shift();
    if (oldestId) {
      this.cache.delete(oldestId);
      console.log(`[EventIndex] 清理缓存: ${oldestId}`);
    }
  }


  /**
   * 获取所有可用的事件ID
   */
  getAllEventIds(): string[] {
    return Object.keys(eventModules).map(path => this.pathToId(path));
  }

  /**
   * 按类别获取事件ID
   */
  getEventIdsByCategory(category: 'HOMELESS' | 'WORKER' | 'MIDDLE' | 'CAPITALIST' | 'COMMON'): string[] {
    return this.getAllEventIds().filter(id => {
      if (category === 'HOMELESS') return id.startsWith('EVT_H');
      if (category === 'WORKER') return id.startsWith('EVT_W');
      if (category === 'MIDDLE') return id.startsWith('EVT_M');
      if (category === 'CAPITALIST') return id.startsWith('EVT_CAPITALIST');
      if (category === 'COMMON') {
        // Common 事件: EVT_C + 数字 (如 EVT_C01), AGING_*, ANXIETY_*, WITHDRAWAL_*, EVT_FOODPOISONING_*
        return id.startsWith('EVT_C') && /^EVT_C\d/.test(id) || 
               id.startsWith('AGING_') || 
               id.startsWith('ANXIETY_') || 
               id.startsWith('WITHDRAWAL_') ||
               id.startsWith('EVT_FOODPOISONING');
      }
      return false;
    });
  }

  /**
   * 加载单个事件
   */
  async loadEvent(eventId: string): Promise<GameEvent | null> {
    // 检查缓存
    if (this.cache.has(eventId)) {
      this.updateAccessOrder(eventId);
      return this.cache.get(eventId)!;
    }
    
    // 缓存满了，清理最旧的
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    // 查找对应的模块路径
    const path = this.idToPath(eventId);
    const loader = eventModules[path];

    if (!loader) {
      console.warn(`Event not found: ${eventId}`);
      return null;
    }

    try {
      const module = await loader();
      const event = module.default;
      this.cache.set(eventId, event);
      this.updateAccessOrder(eventId);
      return event;
    } catch (error) {
      console.error(`Failed to load event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * 批量加载事件
   */
  async loadEvents(eventIds: string[]): Promise<GameEvent[]> {
    const events = await Promise.all(
      eventIds.map(id => this.loadEvent(id))
    );
    return events.filter((e): e is GameEvent => e !== null);
  }

  /**
   * 加载所有事件
   */
  async loadAllEvents(): Promise<GameEvent[]> {
    const allIds = this.getAllEventIds();
    return this.loadEvents(allIds);
  }

  /**
   * 按类别加载事件
   */
  async loadEventsByCategory(
    category: 'HOMELESS' | 'WORKER' | 'MIDDLE' | 'CAPITALIST' | 'COMMON'
  ): Promise<GameEvent[]> {
    const ids = this.getEventIdsByCategory(category);
    return this.loadEvents(ids);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: this.cache.size / this.MAX_CACHE_SIZE
    };
  }

  /**
   * 路径转ID
   */
  private pathToId(path: string): string {
    // 从路径中提取事件ID
    // 例如: ./homeless/EVT_H01_BENCH.json -> EVT_H01_BENCH
    const match = path.match(/\/([^/]+)\.json$/);
    return match ? match[1] : path;
  }

  /**
   * ID转路径
   */
  private idToPath(eventId: string): string {
    // 从ID推断路径
    // 例如: EVT_H01_BENCH -> ./homeless/EVT_H01_BENCH.json
    if (eventId.startsWith('EVT_H')) {
      return `./homeless/${eventId}.json`;
    } else if (eventId.startsWith('EVT_W') || eventId.startsWith('WORKER')) {
      return `./worker/${eventId}.json`;
    } else if (eventId.startsWith('EVT_M') || eventId.startsWith('MIDDLE')) {
      return `./middle/${eventId}.json`;
    } else if (eventId.startsWith('EVT_CAPITALIST') || eventId.startsWith('CAPITALIST')) {
      // Capitalist 事件
      return `./capitalist/${eventId}.json`;
    } else if (eventId.startsWith('GAZE_')) {
      // GAZE_事件在common目录
      return `./common/${eventId}.json`;
    } else if (eventId.startsWith('EVT_C')) {
      // EVT_C + 数字 是 Common 事件 (如 EVT_C01_HEAT_WAVE)
      return `./common/${eventId}.json`;
    } else if (eventId.startsWith('AGING_') || eventId.startsWith('ANXIETY_') || eventId.startsWith('WITHDRAWAL_')) {
      // 这些特殊事件在 homeless 目录
      return `./homeless/${eventId}.json`;
    } else if (eventId.startsWith('EVT_')) {
      return `./common/${eventId}.json`;
    } else {
      return `./common/${eventId}.json`;
    }
  }
}

// 导出单例
export const eventIndex = new EventIndex();

// ==========================================
// 便捷导出
// ==========================================

export const loadEvent = (eventId: string) => eventIndex.loadEvent(eventId);
export const loadEvents = (eventIds: string[]) => eventIndex.loadEvents(eventIds);
export const loadAllEvents = () => eventIndex.loadAllEvents();
export const loadEventsByCategory = (category: Parameters<typeof eventIndex.loadEventsByCategory>[0]) => 
  eventIndex.loadEventsByCategory(category);

// ==========================================
// 统计信息
// ==========================================

export const getEventStats = async () => {
  const allEvents = await loadAllEvents();
  return {
    total: allEvents.length,
    homeless: allEvents.filter(e => (e as any).category === 'HOMELESS' || e.id?.startsWith('H') || e.id?.startsWith('EVT_H')).length,
    worker: allEvents.filter(e => (e as any).category === 'WORKER' || e.id?.startsWith('W') || e.id?.startsWith('WORKER')).length,
    middle: allEvents.filter(e => (e as any).category === 'MIDDLE' || e.id?.startsWith('M') || e.id?.startsWith('MIDDLE')).length,
    capitalist: allEvents.filter(e => (e as any).category === 'CAPITALIST' || e.id?.startsWith('C') || e.id?.startsWith('CAPITALIST')).length,
    common: allEvents.filter(e => (e as any).category === 'COMMON' || e.id?.startsWith('X') || e.id?.startsWith('EVT_X')).length,
    gazeExclusive: allEvents.filter(e => e.id?.startsWith('GAZE_')).length
  };
};
