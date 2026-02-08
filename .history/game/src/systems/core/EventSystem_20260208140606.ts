import { GameSystem, SystemResult } from '../types';
import { GameState, GameEvent } from '@/types/schema';
import eventsData from '@/assets/data/events.json';
import { checkCondition } from '@/logic/eventResolver';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';

// 获取事件权重 (配置驱动)
// 优先使用事件自定义权重，否则使用全局默认权重
const getEventWeight = (event: GameEvent): number => {
  // ✅ 类型安全：直接访问 weight 字段（已在 EventSchema 中定义）
  const w = event.weight;
  // ✅ 防御性编程：验证数值有效且非负
  if (typeof w === 'number' && Number.isFinite(w) && w >= 0) {
    return w;
  }
  return NARRATIVE_RULES.system.defaults.eventWeight;
};

// 随机获取符合条件的事件（排除本轮已触发过的）
const getRandomEvent = (state: GameState): GameEvent | null => {
  // 1. 类型断言
  const allEvents = eventsData as unknown as GameEvent[];
  const currentClass = state.vitality.identity.currentClass;
  
  // 获取本轮已触发的事件ID列表
  const triggeredEvents = state.vitality.flags?.triggeredEvents || [];

  // 2. 筛选候选池 (Pool Filter)
  const candidates = allEvents.filter(event => {
    // A. 排除已触发过的事件（本轮游戏不重复）
    if (triggeredEvents.includes(event.id)) {
      return false;
    }
    
    // B. 阶级过滤 (Class Filter) - 核心逻辑
    // 如果事件定义了 requiredClass，则必须包含当前阶级
    // 如果没定义，视为通用事件
    if (event.conditions?.requiredClass) {
        if (!event.conditions.requiredClass.includes(currentClass)) {
            return false;
        }
    }

    // C. 条件检查 (Condition Check)
    // 检查属性、区域、前置事件等
    return checkCondition(state, event.conditions);
  });

  if (candidates.length === 0) return null;

  // 3. 加权随机抽取 (Weighted Random)
  // 计算总权重
  const totalWeight = candidates.reduce((sum, event) => sum + getEventWeight(event), 0);
  
  // 生成随机数
  let randomValue = Math.random() * totalWeight;

  // 遍历寻找命中区间
  for (const event of candidates) {
    randomValue -= getEventWeight(event);
    if (randomValue <= 0) {
      return event;
    }
  }

  // 兜底返回最后一个（理论上不应执行到此，除非浮点误差）
  return candidates[candidates.length - 1];
};

export const EventSystem: GameSystem = {
  id: 'EVENT_SYSTEM',

  processTurn: ({ state }) => {
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    // 1. 触发判断 (Trigger Check)
    // 你要求“每回合都触发”，所以这里不再进行 Math.random() 判定
    // 除非处于特殊状态 (如监狱中可能只能触发监狱事件，这里暂不处理特殊状态，由 getRandomEvent 里的 condition 控制)
    
    // 2. 获取事件
    const event = getRandomEvent(state);

    if (event) {
      // ✅ 修复 2: 使用正确的状态字段名 currentEvent
      // 同时设置 isEventOpen: true 以打开 UI
      // ✅ 新增: 将事件ID添加到已触发列表，防止本轮重复
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
  }
};