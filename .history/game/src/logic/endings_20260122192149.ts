import { GameState, Ending, PlayerClass } from '../types/schema';

// 通用条件检查器
const checkCondition = (state: GameState, condition: Ending['conditions']): boolean => {
  if (!condition) return true;

  if (condition.minDay !== undefined && state.day < condition.minDay) return false;
  if (condition.maxHp !== undefined && state.hp > condition.maxHp) return false;
  
  // 检查 San 值区间
  if (condition.minSan !== undefined && state.san < condition.minSan) return false;
  if (condition.maxSan !== undefined && state.san > condition.maxSan) return false;

  // 检查 Gold 区间
  if (condition.minGold !== undefined && state.gold < condition.minGold) return false;
  if (condition.maxGold !== undefined && state.gold > condition.maxGold) return false;

  // 检查阶级
  if (condition.requiredClass !== undefined && state.currentClass !== condition.requiredClass) return false;

  // 检查 Flags
  if (condition.requiredFlags) {
      for (const flag of condition.requiredFlags) {
          if (!state.flags[flag]) return false;
      }
  }

  // 检查 Points
  if (condition.requiredPoints) {
      const { red, wolf, old } = state.points;
      if (condition.requiredPoints.red !== undefined && red < condition.requiredPoints.red) return false;
      if (condition.requiredPoints.wolf !== undefined && wolf < condition.requiredPoints.wolf) return false;
      if (condition.requiredPoints.old !== undefined && old < condition.requiredPoints.old) return false;
      
      // 特殊逻辑：如果要比较点数大小（例如 old >= red），目前 JSON Schema 较难表达
      // 可以在这里保留少量特殊逻辑，或者在 JSON 里用特殊字符串标记，如 "red > wolf"
      // 为了保持纯粹性，目前先只支持绝对值检查。
      // 复杂的“点数比大小”逻辑建议保留一个 specialized check 或者扩展 Schema。
  }

  // 检查物品/档案
  if (condition.hasItem && !state.inventory.includes(condition.hasItem)) return false;
  if (condition.hasArchive && !state.unlockedArchives.includes(condition.hasArchive)) return false;

  return true;
};

export const resolveEnding = (
    state: GameState, 
    allEndings: Ending[], 
    deathReason?: string
): string => {
  // 1. 系统强制死亡判定 (最高优先级，防止死人继续玩)
  if (state.hp <= 0 || deathReason) {
      if (deathReason === 'DISMANTLED') return 'ED-03';
      if (deathReason === 'COP') return 'ED-04'; // 如果有这个逻辑
      if (deathReason === 'SUICIDE') return 'ED-05';
      
      // 默认死亡结局查找 (可以在 endings.json 里定义 type='DEATH' 的默认项)
      // 这里为了兼容旧逻辑：
      if (state.currentClass === PlayerClass.Homeless) return 'ED-01';
      return 'ED-02';
  }

  // 2. 遍历配置的结局
  // 按 priority 降序排列 (Priority 越大越优先)
  // 注意：在 store 加载时最好已经排好序，这里为了保险再排一次
  const sortedEndings = [...allEndings].sort((a, b) => b.priority - a.priority);

  for (const ending of sortedEndings) {
      // 只有非 DEATH 类型的结局才在这里检查 (DEATH 由上面强制接管，或者你也配在 JSON 里)
      if (ending.type === 'DEATH') continue; 

      if (checkCondition(state, ending.conditions)) {
          return ending.id;
      }
  }

  return '';
};