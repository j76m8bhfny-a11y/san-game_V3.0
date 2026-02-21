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
      const prefix = category === 'HOMELESS' ? 'EVT_H' :
                     category === 'WORKER' ? 'EVT_W' :
                     category === 'MIDDLE' ? 'EVT_M' :
                     category === 'CAPITALIST' ? 'EVT_C' : 
                     category === 'COMMON' ? 'EVT_C' : 'EVT_';
      return id.startsWith(prefix);
    });
  }

  /**
   * 加载单个事件
   */
  async loadEvent(eventId: string): Promise<GameEvent | null> {
    // 检查缓存
    if (this.cache.has(eventId)) {
      return this.cache.get(eventId)!;
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
    } else if (eventId.startsWith('EVT_C') || eventId.startsWith('CAPITALIST') || eventId.startsWith('GAZE_')) {
      // GAZE_事件在common目录
      if (eventId.startsWith('GAZE_')) {
        return `./common/${eventId}.json`;
      }
      // 检查是COMMON还是CAPITALIST
      // 这里简化处理，实际应该根据内容判断
      return `./capitalist/${eventId}.json`;
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
