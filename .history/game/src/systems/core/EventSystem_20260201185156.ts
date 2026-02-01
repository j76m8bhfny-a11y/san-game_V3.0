import { GameSystem, SystemResult } from '../types';
import { GameState, GameEvent } from '@/types/schema'; // ✅ 引入 GameEvent 类型
import eventsData from '@/assets/data/events.json';
import { checkCondition } from '@/logic/eventResolver';

// 简单的随机工具
const getRandomEvent = (state: GameState) => {
  // ✅ 核心修复：将 JSON 数据强制断言为 GameEvent[] 类型
  // 这样 TS 就会把 json 里的 "WORKER" 字符串视为 PlayerClass.Worker 枚举
  const typedEvents = eventsData as unknown as GameEvent[];

  // 过滤出符合条件的事件
  const availableEvents = typedEvents.filter(event => 
    checkCondition(state, event.conditions)
  );

  if (availableEvents.length === 0) return null;

  // 简单的权重随机或纯随机
  const randomIndex = Math.floor(Math.random() * availableEvents.length);
  return availableEvents[randomIndex];
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

    // 1. 基础几率判定 (例如每周末有 30% 几率触发随机事件)
    const TRIGGER_CHANCE = 0.3; 
    
    // 基于 SAN 值动态调整几率
    const currentSan = state.vitality.metrics.san;
    const maxSan = state.vitality.metrics.maxSan;
    const sanRatio = currentSan / maxSan;
    
    // SAN 低于 30% 时，事件几率提升
    const actualChance = sanRatio < 0.3 ? 0.6 : TRIGGER_CHANCE;

    if (Math.random() < actualChance) {
      const event = getRandomEvent(state);
      
      if (event) {
        result.updates = {
            currentEvent: event,
            isEventOpen: true // 强制打开事件窗口
        } as any; 

        result.logs.push("遭遇随机事件！");
      }
    }

    return result;
  }
};