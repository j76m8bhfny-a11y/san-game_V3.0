import { GameSystem, SystemResult } from '../types';
import { GameState, GameEvent } from '@/types/schema';
import eventsData from '@/assets/data/events.json';
import { checkCondition } from '@/logic/eventResolver';

// 随机获取符合条件的事件
const getRandomEvent = (state: GameState): GameEvent | null => {
  // 1. 类型断言
  const allEvents = eventsData as unknown as GameEvent[];
  const currentClass = state.vitality.identity.currentClass;

  // 2. 筛选候选池 (Pool Filter)
  const candidates = allEvents.filter(event => {
    // A. 阶级过滤 (Class Filter) - 核心逻辑
    // 如果事件定义了 requiredClass，则必须包含当前阶级
    // 如果没定义，视为通用事件
    if (event.conditions?.requiredClass) {
        if (!event.conditions.requiredClass.includes(currentClass)) {
            return false;
        }
    }

    // B. 条件检查 (Condition Check)
    // 检查属性、区域、前置事件等
    return checkCondition(state, event.conditions);
  });

  if (candidates.length === 0) return null;

  // 3. 随机抽取
  // 进阶优化：可以根据 rarity 字段进行加权随机
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
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
      result.updates = {
        currentEvent: event,
        isEventOpen: true
      } as any;

      result.logs.push(`触发事件: ${event.title}`);
    }

    return result;
  }
};