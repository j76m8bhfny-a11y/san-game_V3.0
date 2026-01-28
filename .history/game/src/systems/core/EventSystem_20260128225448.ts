import { GameSystem, SystemResult, SystemContext } from '../../../systems/types';
import { GameEvent } from '@/types/schema';
import eventsData from '@/assets/data/events.json';

// Fallback 事件 (当没有事件满足条件时)
const FALLBACK_EVENT: GameEvent = {
  id: 'FALLBACK_EVENT',
  title: '平淡的一天',
  text: { lowSan: '...', highSan: '今天无事发生，但这平静让人不安。' },
  conditions: {},
  options: {
    A: { label: '休息', effects: { hp: 5 } },
    B: { label: '发呆', effects: { san: 2 } },
    C: { label: '...', effects: {} },
    D: { label: '...', effects: {} }
  }
} as any;

export const EventSystem: GameSystem = {
  id: 'EVENT_GENERATOR',

  processDay: ({ state }: SystemContext) => {
    const { san, currentClass, inventory, currentRegion } = state;
    
    // 1. 筛选逻辑
    const availableEvents = (eventsData as GameEvent[]).filter((event) => {
      const { conditions } = event;
      if (conditions.minSan !== undefined && san < conditions.minSan) return false;
      if (conditions.maxSan !== undefined && san > conditions.maxSan) return false;
      if (conditions.requiredClass && !conditions.requiredClass.includes(currentClass)) return false;
      if (conditions.hasItem && !inventory.includes(conditions.hasItem)) return false;
      if (conditions.region && conditions.region !== currentRegion) return false;
      return true;
    });

    // 2. 随机抽取
    const randomEvent = availableEvents.length > 0 
      ? availableEvents[Math.floor(Math.random() * availableEvents.length)] 
      : FALLBACK_EVENT;

    // 3. 返回结果
    return {
      updates: { currentEvent: randomEvent },
      logs: [],
      notes: []
    };
  }
};