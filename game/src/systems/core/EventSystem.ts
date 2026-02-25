import { GameSystem, SystemResult } from '../types';
import { GameState, GameEvent } from '@/types/schema';
import { checkCondition } from '@/logic/eventResolver';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import { random } from '@/utils/random';
import { 
  shouldTriggerGazeEvent, 
  getCurrentGazeEffects 
} from '@/logic/gazeEventSystem';
import { eventIndex } from '@/assets/data/events/index';

// 缓存事件数据 - 导出以便外部预加载
export let eventsCache: GameEvent[] | null = null;

/**
 * 预加载所有事件 - 应在游戏初始化时调用
 */
export const preloadAllEvents = async (): Promise<void> => {
  if (eventsCache) return;
  
  try {
    eventsCache = await eventIndex.loadAllEvents();
    console.log(`[EventSystem] 已预加载 ${eventsCache.length} 个事件`);
  } catch (error) {
    console.error('[EventSystem] 预加载事件失败:', error);
    eventsCache = [];
  }
};

/**
 * 获取缓存的事件（同步）
 */
const getCachedEvents = (): GameEvent[] => {
  if (!eventsCache) {
    console.warn('[EventSystem] 事件未预加载，返回空数组');
    return [];
  }
  return eventsCache;
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

// 负面事件标签列表
const NEGATIVE_EVENT_TAGS = ['NEGATIVE', 'DISASTER', 'CRISIS', 'BILL', 'LEGAL', 'PENALTY'];

// 检查事件是否为负面事件
const isNegativeEvent = (event: GameEvent): boolean => {
  const category = (event as any).category;
  const tags = (event as any).tags || [];
  
  // 检查 category
  if (NEGATIVE_EVENT_TAGS.includes(category)) return true;
  
  // 检查 tags
  if (tags.some((tag: string) => NEGATIVE_EVENT_TAGS.includes(tag))) return true;
  
  // 检查事件效果（如果主要效果是负面的）
  const options = (event as any).options;
  if (options) {
    const allOptions = [options.A, options.B, options.C, options.D].filter(Boolean);
    const negativeCount = allOptions.filter((opt: any) => {
      const effects = opt?.effects;
      if (!effects) return false;
      return (effects.hp && effects.hp < 0) || 
             (effects.gold && effects.gold < 0) ||
             (effects.insight && effects.insight < 0);
    }).length;
    // 如果大部分选项都是负面的，认为是负面事件
    if (negativeCount >= allOptions.length * 0.5) return true;
  }
  
  return false;
};

// 获取随机事件（同步版本）
const getRandomEventSync = (state: GameState): GameEvent | null => {
  const allEvents = getCachedEvents();
  if (allEvents.length === 0) return null;
  
  const currentClass = state.vitality.identity.currentClass;
  const triggeredEvents = state.vitality.flags?.triggeredEvents || [];
  const currentTurn = state.vitality.time.currentTurn;
  
  // 获取当前gaze状态
  const { intensity } = getCurrentGazeEffects(state);

  // 筛选候选池
  const candidates = allEvents.filter(event => {
    // 排除已触发过的事件
    if (triggeredEvents.includes(event.id)) {
      return false;
    }
    
    // 检查回合限制
    const eventConditions = event.conditions as any;
    if (eventConditions?.minTurn && currentTurn < eventConditions.minTurn) {
      return false;
    }
    if (eventConditions?.maxTurn && currentTurn > eventConditions.maxTurn) {
      return false;
    }
    
    // v3事件：检查requiredClass
    if (isV3Event(event) && eventConditions?.requiredClass) {
      if (!eventConditions.requiredClass.includes(currentClass)) {
        return false;
      }
    }
    // 兼容旧格式
    else if (eventConditions?.requiredClass) {
      if (!eventConditions.requiredClass.includes(currentClass)) {
        return false;
      }
    }

    // 检查其他条件
    return checkCondition(state, event.conditions);
  });

  if (candidates.length === 0) return null;

  // ✅ System Gaze 影响：高 Gaze (50+) 增加负面事件权重 20-50%
  const gazeMultiplier = intensity >= 0.5 ? (1 + intensity * 0.5) : 1;

  // 加权随机抽取
  const totalWeight = candidates.reduce((sum, event) => {
    let weight = getEventWeight(event);
    
    // 高 Gaze 增加负面事件权重
    if (intensity >= 0.5 && isNegativeEvent(event)) {
      weight *= gazeMultiplier;
    }
    
    return sum + weight;
  }, 0);
  
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    console.warn('[EventSystem] 总权重异常:', totalWeight);
    return candidates[0] || null;
  }
  
  let randomValue = random() * totalWeight;

  for (const event of candidates) {
    let weight = getEventWeight(event);
    // 再次应用 Gaze 影响
    if (intensity >= 0.5 && isNegativeEvent(event)) {
      weight *= gazeMultiplier;
    }
    
    randomValue -= weight;
    if (randomValue <= 0) {
      return event;
    }
  }

  return candidates[candidates.length - 1];
};

// 获取System Gaze专属事件（同步版本）
const getGazeEventSync = (state: GameState): GameEvent | null => {
  if (!shouldTriggerGazeEvent(state)) {
    return null;
  }
  
  const allEvents = getCachedEvents();
  const gazeEvents = allEvents.filter(e => e.id?.startsWith('GAZE_'));
  
  if (gazeEvents.length === 0) return null;
  
  // 随机选择一个
  return gazeEvents[Math.floor(random() * gazeEvents.length)];
};

// 结算事件系统（每回合开始时调用）
export const processEventTurn = (state: GameState): SystemResult => {
  const result: SystemResult = {
    updates: {},
    newTransactions: [],
    logs: [],
    notes: []
  };

  // 确保事件已加载
  if (!eventsCache) {
    console.warn('[EventSystem] 事件未预加载，跳过事件触发');
    return result;
  }

  // 优先检查System Gaze专属事件
  const gazeEvent = getGazeEventSync(state);
  
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
  const event = getRandomEventSync(state);

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

// GameSystem 接口实现
export const EventSystem: GameSystem = {
  id: 'EVENT_SYSTEM',
  priority: 95, // 高优先级，在结算前触发

  processTurn: ({ state }) => {
    return processEventTurn(state);
  }
};

// 导出辅助函数
export { getCurrentGazeEffects };
