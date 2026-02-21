import { GameSystem, SystemResult } from '../types';
import { GameState, GameEvent } from '@/types/schema';
import { checkCondition } from '@/logic/eventResolver';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import { random } from '@/utils/random';
import { 
  shouldTriggerGazeEvent, 
  getAvailableGazeEvents,
  getCurrentGazeEffects 
} from '@/logic/gazeEventSystem';
import { loadAllEvents } from '@/assets/data/events';

// 缓存事件数据
let eventsCache: GameEvent[] | null = null;

// 异步加载所有事件
const loadEvents = async (): Promise<GameEvent[]> => {
  if (eventsCache) return eventsCache;
  
  try {
    eventsCache = await loadAllEvents();
    return eventsCache;
  } catch (error) {
    console.error('[EventSystem] 加载事件失败:', error);
    return [];
  }
};

// 获取事件权重
const getEventWeight = (event: GameEvent): number => {
  const w = (event.conditions as any)?.weight;
  if (typeof w === 'number' && Number.isFinite(w) && w >= 0) {
    return w;
  }
  return NARRATIVE_RULES.system.defaults.eventWeight;
};

// 检查是否是v3格式事件
const isV3Event = (event: any): boolean => {
  return event.$schema === 'game-event-v3' || event.metadata?.version?.startsWith('3.');
};

// 获取随机事件
const getRandomEvent = async (state: GameState): Promise<GameEvent | null> => {
  const allEvents = await loadEvents();
  const currentClass = state.vitality.identity.currentClass;
  const triggeredEvents = state.vitality.flags?.triggeredEvents || [];
  
  // 获取当前gaze状态
  const { intensity } = getCurrentGazeEffects(state);
  void intensity; // 可用于根据gaze强度调整事件池

  // 筛选候选池
  const candidates = allEvents.filter(event => {
    // 排除已触发过的事件
    if (triggeredEvents.includes(event.id)) {
      return false;
    }
    
    // v3事件：检查requiredClass
    if (isV3Event(event) && event.conditions?.requiredClass) {
      if (!event.conditions.requiredClass.includes(currentClass)) {
        return false;
      }
    }
    // 兼容旧格式
    else if (event.conditions?.requiredClass) {
      if (!event.conditions.requiredClass.includes(currentClass)) {
        return false;
      }
    }

    // 检查条件
    return checkCondition(state, event.conditions);
  });

  if (candidates.length === 0) return null;

  // 加权随机抽取
  const totalWeight = candidates.reduce((sum, event) => sum + getEventWeight(event), 0);
  
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    console.warn('[EventSystem] 总权重异常:', totalWeight);
    return candidates[0] || null;
  }
  
  let randomValue = random() * totalWeight;

  for (const event of candidates) {
    randomValue -= getEventWeight(event);
    if (randomValue <= 0) {
      return event;
    }
  }

  return candidates[candidates.length - 1];
};

// 获取System Gaze专属事件
const getGazeEvent = async (state: GameState): Promise<GameEvent | null> => {
  if (!shouldTriggerGazeEvent(state)) {
    return null;
  }
  
  const gazeEvents = await getAvailableGazeEvents(state);
  if (gazeEvents.length === 0) return null;
  
  // 随机选择一个
  return gazeEvents[Math.floor(random() * gazeEvents.length)];
};

// 内部处理函数
const processTurnInternal = async (state: GameState): Promise<SystemResult> => {
  const result: SystemResult = {
    updates: {},
    newTransactions: [],
    logs: [],
    notes: []
  };

  // 优先检查System Gaze专属事件
  const gazeEvent = await getGazeEvent(state);
  
  if (gazeEvent) {
    const triggeredEvents = state.vitality.flags?.triggeredEvents || [];
    
    result.updates = {
      currentEvent: gazeEvent,
      isEventOpen: true,
      vitality: {
        ...state.vitality,
        flags: {
          ...state.vitality.flags,
          triggeredEvents: [...triggeredEvents, gazeEvent.id]
        }
      }
    } as any;

    result.logs.push(`[系统凝视] 触发事件: ${gazeEvent.title}`);
    return result;
  }

  // 普通事件
  const event = await getRandomEvent(state);

  if (event) {
    const triggeredEvents = state.vitality.flags?.triggeredEvents || [];
    
    result.updates = {
      currentEvent: event,
      isEventOpen: true,
      vitality: {
        ...state.vitality,
        flags: {
          ...state.vitality.flags,
          triggeredEvents: [...triggeredEvents, event.id]
        }
      }
    } as any;

    result.logs.push(`触发事件: ${event.title}`);
  }

  return result;
};

export const EventSystem: GameSystem = {
  id: 'EVENT_SYSTEM',

  processTurn: ({ state: _state }) => {
    // 注意：这里返回一个同步结果，实际异步加载在内部处理
    // 由于GameSystem接口要求同步返回，我们需要确保事件已预加载
    // 或者修改接口以支持Promise
    
    // 临时解决方案：返回空结果，异步加载后通过其他方式触发事件
    // 更好的方案是在游戏初始化时预加载所有事件
    
    // 立即执行并返回结果（如果缓存已准备好）
    if (eventsCache) {
      // 由于无法直接await，我们需要同步处理
      // 这是一个设计妥协
    }
    
    return {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };
  }
};

// 导出异步版本供实际使用
export const processEventTurnAsync = processTurnInternal;

// 导出辅助函数
export { getCurrentGazeEffects };
