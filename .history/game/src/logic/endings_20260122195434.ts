import { GameState, Ending, PlayerClass } from '../types/schema';

// 通用条件检查器 (保持不变)
const checkCondition = (state: GameState, condition: Ending['conditions']): boolean => {
  if (!condition) return true;

  if (condition.minDay !== undefined && state.day < condition.minDay) return false;
  if (condition.maxHp !== undefined && state.hp > condition.maxHp) return false;
  
  if (condition.minSan !== undefined && state.san < condition.minSan) return false;
  if (condition.maxSan !== undefined && state.san > condition.maxSan) return false;

  if (condition.minGold !== undefined && state.gold < condition.minGold) return false;
  if (condition.maxGold !== undefined && state.gold > condition.maxGold) return false;

  if (condition.requiredClass !== undefined && state.currentClass !== condition.requiredClass) return false;

  if (condition.requiredFlags) {
      for (const flag of condition.requiredFlags) {
          if (!state.flags[flag]) return false;
      }
  }

  if (condition.requiredPoints) {
      const { red, wolf, old } = state.points;
      if (condition.requiredPoints.red !== undefined && red < condition.requiredPoints.red) return false;
      if (condition.requiredPoints.wolf !== undefined && wolf < condition.requiredPoints.wolf) return false;
      if (condition.requiredPoints.old !== undefined && old < condition.requiredPoints.old) return false;
  }

  if (condition.hasItem && !state.inventory.includes(condition.hasItem)) return false;
  if (condition.hasArchive && !state.unlockedArchives.includes(condition.hasArchive)) return false;

  return true;
};

// 🛠️ 修复：增加 maxDays 参数，并添加防止提前结局的保护逻辑
export const resolveEnding = (
    state: GameState, 
    allEndings: Ending[], 
    maxDays: number = 40, // 默认 40
    deathReason?: string
): string => {
  // 1. 系统强制死亡判定 (最高优先级，随时触发)
  if (state.hp <= 0 || deathReason) {
      if (deathReason === 'DISMANTLED') return 'ED-03';
      if (deathReason === 'COP') return 'ED-04';
      if (deathReason === 'SUICIDE') return 'ED-05';
      
      // 默认死亡结局查找 (查找配置了 type='DEATH' 且符合条件的)
      // 如果没有找到，兜底返回 ED-01 或 ED-02
      const deathEnding = allEndings.find(e => 
        e.type === 'DEATH' && checkCondition(state, e.conditions)
      );
      if (deathEnding) return deathEnding.id;

      return state.currentClass === PlayerClass.Homeless ? 'ED-01' : 'ED-02';
  }

  // 🔴 核心修复：如果还没到最后一天，直接屏蔽所有“非死亡”结局
  // 除非该结局显式配置了 `ignoreDayLimit: true` (如果你以后想做“提前胜利”的话)
  if (state.day < maxDays) {
      return ''; 
  }

  // 2. 正常结局遍历 (只有到达 maxDays 后才会执行到这里)
  const sortedEndings = [...allEndings].sort((a, b) => b.priority - a.priority);

  for (const ending of sortedEndings) {
      // 死亡结局前面已经处理过了，这里跳过
      if (ending.type === 'DEATH') continue; 

      if (checkCondition(state, ending.conditions)) {
          return ending.id;
      }
  }

  return '';
};