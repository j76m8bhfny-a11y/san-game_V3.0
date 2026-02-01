import { GameState, GameEvent, EventOption, ActionCode, GameAction } from '@/types/schema';
import { executeAction } from './ActionExecutor';

// 辅助：统一获取属性值的 Helper (适配 Vitality 结构)
const getStat = (state: GameState, key: string): any => {
  if (key === 'hp') return state.vitality.metrics.hp;
  if (key === 'maxHp') return state.vitality.metrics.maxHp;
  if (key === 'san') return state.vitality.metrics.san;
  if (key === 'maxSan') return state.vitality.metrics.maxSan;
  if (key === 'gold') return state.vitality.metrics.gold;
  if (key === 'currentClass') return state.vitality.identity.currentClass;
  return 0;
};

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

// ✅ 新增：解析并执行选项结果 (修复了 createGameSlice 的报错)
export const resolveOption = (state: GameState, option: EventOption): { updates: any; logs: string[]; nextEventId?: string } => {
  let combinedUpdates: any = {};
  const logs: string[] = [];

  // 1. 基础数值变动 (HP, SAN)
  // 注意：Gold 的变动建议由 Store 层的 addTransaction 处理，这里只处理非账本数值
  // 从而保证所有的金钱变动都有账单记录
  
  if (option.effects.hp) {
    const action: GameAction = { code: ActionCode.MODIFY_STAT, params: { target: 'hp', value: option.effects.hp } };
    const res = executeAction(state, action);
    
    // 手动合并 Vitality 更新
    if (res.updates.vitality) {
       if (!combinedUpdates.vitality) combinedUpdates.vitality = { metrics: {} };
       combinedUpdates.vitality.metrics = { ...combinedUpdates.vitality.metrics, ...res.updates.vitality.metrics };
    }
    logs.push(...res.logs);
  }

  if (option.effects.san) {
    const action: GameAction = { code: ActionCode.MODIFY_STAT, params: { target: 'san', value: option.effects.san } };
    const res = executeAction(state, action);
    
    if (res.updates.vitality) {
       if (!combinedUpdates.vitality) combinedUpdates.vitality = { metrics: {} };
       combinedUpdates.vitality.metrics = { ...combinedUpdates.vitality.metrics, ...res.updates.vitality.metrics };
    }
    logs.push(...res.logs);
  }

  // 2. 获得物品
  if (option.effects.items) {
      option.effects.items.forEach(item => {
          // 获取当前最新的 inventory (如果已有更新则用最新的，否则用 state 的)
          const currentInv = combinedUpdates.inventory || state.inventory;
          const newItems = Array(item.count).fill(item.itemId);
          combinedUpdates.inventory = [...currentInv, ...newItems];
          logs.push(`获得物品: ${item.itemId} x${item.count}`);
      });
  }

  // 3. 触发后续 (Archive)
  if (option.archiveId) {
      const currentArchives = combinedUpdates.unlockedArchives || state.unlockedArchives;
      if (!currentArchives.includes(option.archiveId)) {
          combinedUpdates.unlockedArchives = [...currentArchives, option.archiveId];
          logs.push(`解锁档案`);
      }
  }

  // 4. 政治倾向 (Points)
  if (option.effects.points) {
      // 需要深拷贝或构建新的 identity 对象
      const currentIdentity = combinedUpdates.vitality?.identity || state.vitality.identity;
      const currentPoints = currentIdentity.points;
      
      const newPoints = {
          red: currentPoints.red + (option.effects.points.red || 0),
          wolf: currentPoints.wolf + (option.effects.points.wolf || 0),
          old: currentPoints.old + (option.effects.points.old || 0)
      };

      // 确保结构存在
      if (!combinedUpdates.vitality) combinedUpdates.vitality = {};
      if (!combinedUpdates.vitality.identity) {
          // 这里我们只更新 points，保持 identity 其他字段（如 class）不变
          // 注意：Slice 层的 mergeVitality 需要能处理这种部分更新
          combinedUpdates.vitality.identity = { points: newPoints };
      } else {
          combinedUpdates.vitality.identity.points = newPoints;
      }
      
      if (option.effects.points.red) logs.push(`红方倾向 ${option.effects.points.red > 0 ? '+' : ''}${option.effects.points.red}`);
      if (option.effects.points.wolf) logs.push(`蓝方倾向 ${option.effects.points.wolf > 0 ? '+' : ''}${option.effects.points.wolf}`);
      if (option.effects.points.old) logs.push(`旧派倾向 ${option.effects.points.old > 0 ? '+' : ''}${option.effects.points.old}`);
  }

  return {
    updates: combinedUpdates,
    logs
  };
};