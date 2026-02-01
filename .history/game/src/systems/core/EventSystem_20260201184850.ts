import { GameSystem, SystemResult } from '../types';
import { GameState } from '@/types/schema';
import eventsData from '@/assets/data/events.json';
import { checkCondition } from '@/logic/eventResolver';

// 简单的随机工具
const getRandomEvent = (state: GameState) => {
  // 过滤出符合条件的事件
  const availableEvents = eventsData.filter(event => 
    checkCondition(state, event.conditions)
  );

  if (availableEvents.length === 0) return null;

  // 简单的权重随机或纯随机
  const randomIndex = Math.floor(Math.random() * availableEvents.length);
  return availableEvents[randomIndex];
};

export const EventSystem: GameSystem = {
  id: 'EVENT_SYSTEM',

  // ✅ 修复: 改为 processTurn
  processTurn: ({ state }) => {
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    // 1. 基础几率判定 (例如每周末有 30% 几率触发随机事件)
    const TRIGGER_CHANCE = 0.3; 
    
    // 也可以基于 SAN 值动态调整几率，SAN 越低越容易出事
    // ✅ 修复: 正确访问 SAN (state.vitality.metrics.san)
    const currentSan = state.vitality.metrics.san;
    const maxSan = state.vitality.metrics.maxSan;
    const sanRatio = currentSan / maxSan;
    
    // SAN 低于 30% 时，事件几率提升
    const actualChance = sanRatio < 0.3 ? 0.6 : TRIGGER_CHANCE;

    if (Math.random() < actualChance) {
      const event = getRandomEvent(state);
      
      if (event) {
        // 将事件放入 updates，GameSlice 需要处理这个更新并打开窗口
        // 注意：这里我们假设 GameSlice 会监听 currentEvent 的变化并自动 isEventOpen = true
        // 或者我们直接在这里设置 isEventOpen (如果类型允许)
        
        result.updates = {
            currentEvent: event,
            isEventOpen: true // 强制打开事件窗口
        } as any; // Cast as any because GameState definition might strictly check types

        result.logs.push("遭遇随机事件！");
      }
    }

    return result;
  }
};