import { GameState } from '@/types/schema';

// --- 定义动作指令集 (OpCodes) ---
export type ActionType = 
  | 'MODIFY_STAT'   // 修改基础数值 (HP, SAN, GOLD)
  | 'ADD_ITEM'      // 获得物品
  | 'REMOVE_ITEM'   // 移除物品
  | 'CHANCE'        // 概率触发子动作
  | 'UNLOCK_ARCHIVE'; // 解锁档案

export interface GameAction {
  code: ActionType;
  params: any; // 灵活的参数对象
}

// --- 执行器核心函数 ---
// 输入：动作列表 + 当前状态
// 输出：状态变更 (Partial<GameState>)
export const executeActions = (
  actions: GameAction[], 
  currentState: GameState
): Partial<GameState> => {
  
  let updates: Partial<GameState> = {};
  
  // 辅助函数：获取最新的数值（考虑累积更新）
  const getStat = (key: keyof GameState) => {
    return (updates[key] !== undefined ? updates[key] : currentState[key]) as number;
  };

  actions.forEach(action => {
    switch (action.code) {
      case 'MODIFY_STAT': {
        const { target, value, min, max } = action.params;
        // target: 'hp' | 'san' | 'gold'
        if (target && typeof value === 'number') {
          let current = getStat(target as keyof GameState);
          let next = current + value;
          
          // 处理边界限制 (Clamp)
          if (min !== undefined) next = Math.max(min, next);
          if (max !== undefined) next = Math.min(max, next); // 注意：MaxHP 需要另外读取
          
          // 特殊处理：如果是 HP，不能超过 maxHp
          if (target === 'hp') {
             const maxHp = getStat('maxHp');
             next = Math.min(maxHp, next);
          }

          (updates as any)[target] = next;
        }
        break;
      }

      case 'ADD_ITEM': {
        const { itemId } = action.params;
        const currentInventory = (updates.inventory || currentState.inventory) as string[];
        if (itemId && !currentInventory.includes(itemId)) {
          updates.inventory = [...currentInventory, itemId];
        }
        break;
      }

      case 'REMOVE_ITEM': {
        const { itemId } = action.params;
        const currentInventory = (updates.inventory || currentState.inventory) as string[];
        if (itemId && currentInventory.includes(itemId)) {
          updates.inventory = currentInventory.filter(id => id !== itemId);
        }
        break;
      }

      case 'UNLOCK_ARCHIVE': {
        const { archiveId } = action.params;
        const currentArchives = (updates.unlockedArchives || currentState.unlockedArchives) as string[];
        if (archiveId && !currentArchives.includes(archiveId)) {
          updates.unlockedArchives = [...currentArchives, archiveId];
        }
        break;
      }

      case 'CHANCE': {
        const { rate, successActions, failActions } = action.params;
        // rate: 0.0 ~ 1.0
        if (Math.random() < rate) {
          if (successActions && Array.isArray(successActions)) {
            // 递归执行成功分支
            const subUpdates = executeActions(successActions, { ...currentState, ...updates });
            updates = { ...updates, ...subUpdates };
          }
        } else {
          if (failActions && Array.isArray(failActions)) {
            // 递归执行失败分支
            const subUpdates = executeActions(failActions, { ...currentState, ...updates });
            updates = { ...updates, ...subUpdates };
          }
        }
        break;
      }
      
      default:
        console.warn(`Unknown action code: ${action.code}`);
        break;
    }
  });

  return updates;
};