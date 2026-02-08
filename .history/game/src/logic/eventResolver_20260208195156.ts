import { GameState, GameEvent, EventOption, ActionCode, GameAction } from '@/types/schema';
import { executeAction } from './ActionExecutor';
import { produce } from 'immer';

// 检查事件触发条件
export const checkCondition = (state: GameState, condition: GameEvent['conditions']): boolean => {
  if (!condition) return true;

  // 1. SAN Check (使用新的 metrics 路径)
  if (condition.minSan !== undefined && state.vitality.metrics.san < condition.minSan) return false;
  if (condition.maxSan !== undefined && state.vitality.metrics.san > condition.maxSan) return false;

  // 2. Class Check (使用新的 identity 路径)
  if (condition.requiredClass) {
    if (!condition.requiredClass.includes(state.vitality.identity.currentClass)) return false;
  }

  // 3. Region Check
  if (condition.region && state.currentRegion !== condition.region) return false;

  // 4. Item Check
  if (condition.hasItem && !state.inventory.includes(condition.hasItem)) return false;

  return true;
};

// ✅ 使用 Immer 简化状态合并逻辑
export const resolveOption = (state: GameState, option: EventOption): { updates: any; logs: string[]; nextEventId?: string } => {
  const logs: string[] = [];
  
  // 使用 Immer 的 produce 函数，基于 state 创建 draft，Immer 会自动生成不可变更新
  const updates = produce(state, (draft) => {
    // 1. 基础数值变动 (HP, SAN)
    if (option.effects.hp) {
      const action: GameAction = { code: ActionCode.MODIFY_STAT, params: { target: 'hp', value: option.effects.hp } };
      const res = executeAction(state, action);
      
      if (res.updates.vitality?.metrics) {
        Object.assign(draft.vitality.metrics, res.updates.vitality.metrics);
      }
      logs.push(...res.logs);
    }

    if (option.effects.san) {
      const action: GameAction = { code: ActionCode.MODIFY_STAT, params: { target: 'san', value: option.effects.san } };
      const res = executeAction(state, action);
      
      if (res.updates.vitality?.metrics) {
        Object.assign(draft.vitality.metrics, res.updates.vitality.metrics);
      }
      logs.push(...res.logs);
    }

    // 2. 获得物品
    if (option.effects.items?.length) {
      option.effects.items.forEach(item => {
        // 防御性检查：确保 item 和必要字段存在
        if (!item?.itemId || typeof item.count !== 'number' || item.count <= 0) {
          console.warn('Invalid item effect:', item);
          return;
        }
        const newItems = Array(item.count).fill(item.itemId);
        draft.inventory.push(...newItems);
        logs.push(`获得物品: ${item.itemId} x${item.count}`);
      });
    }

    // 3. 触发后续 (Archive)
    if (option.archiveId) {
      if (!draft.unlockedArchives.includes(option.archiveId)) {
        draft.unlockedArchives.push(option.archiveId);
        logs.push(`解锁档案`);
      }
    }

    // 4. 政治倾向 (Points)
    if (option.effects.points) {
      const currentPoints = draft.vitality.identity.points;
      
      draft.vitality.identity.points = {
        red: currentPoints.red + (option.effects.points.red || 0),
        wolf: currentPoints.wolf + (option.effects.points.wolf || 0),
        old: currentPoints.old + (option.effects.points.old || 0)
      };
      
      if (option.effects.points.red) logs.push(`红方倾向 ${option.effects.points.red > 0 ? '+' : ''}${option.effects.points.red}`);
      if (option.effects.points.wolf) logs.push(`蓝方倾向 ${option.effects.points.wolf > 0 ? '+' : ''}${option.effects.points.wolf}`);
      if (option.effects.points.old) logs.push(`旧派倾向 ${option.effects.points.old > 0 ? '+' : ''}${option.effects.points.old}`);
    }
  });

  return { updates, logs };
};