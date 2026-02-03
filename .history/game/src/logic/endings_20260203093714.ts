import { GameState, Ending, PlayerClass } from '../types/schema';

// 通用条件检查器
const checkCondition = (state: GameState, condition: Ending['conditions']): boolean => {
  if (!condition) return true;

  // 1. 快捷访问路径
  const { metrics, identity, time, flags } = state.vitality;

  // 2. 检查各项指标
  // ✅ 修复：将 condition.minDay 修改为 condition.minTurn
  if (condition.minTurn !== undefined && time.currentTurn < condition.minTurn) return false;
  
  if (condition.maxHp !== undefined && metrics.hp > condition.maxHp) return false;
  
  if (condition.minSan !== undefined && metrics.san < condition.minSan) return false;
  if (condition.maxSan !== undefined && metrics.san > condition.maxSan) return false;

  if (condition.minGold !== undefined && metrics.gold < condition.minGold) return false;
  if (condition.maxGold !== undefined && metrics.gold > condition.maxGold) return false;

  if (condition.requiredClass !== undefined && identity.currentClass !== condition.requiredClass) return false;

  if (condition.requiredFlags) {
      for (const flag of condition.requiredFlags) {
          if (!flags[flag]) return false;
      }
  }

  if (condition.requiredPoints) {
      const { red, wolf, old } = identity.points;
      if (condition.requiredPoints.red !== undefined && red < condition.requiredPoints.red) return false;
      if (condition.requiredPoints.wolf !== undefined && wolf < condition.requiredPoints.wolf) return false;
      if (condition.requiredPoints.old !== undefined && old < condition.requiredPoints.old) return false;
  }

  if (condition.hasItem && !state.inventory.includes(condition.hasItem)) return false;
  if (condition.hasArchive && !state.unlockedArchives.includes(condition.hasArchive)) return false;

  return true;
};

// 🛠️ 结局判定逻辑
export const resolveEnding = (
    state: GameState, 
    allEndings: Ending[], 
    maxTurns: number = 40, // ✅ 建议参数名也改为 maxTurns 以保持一致
    deathReason?: string
): string => {
  const { metrics, identity, time } = state.vitality;

  // 1. 系统强制死亡判定
  if (metrics.hp <= 0 || deathReason) {
      if (deathReason === 'DISMANTLED') return 'ED-03';
      if (deathReason === 'COP') return 'ED-04';
      if (deathReason === 'SUICIDE') return 'ED-05';
      
      const deathEnding = allEndings.find(e => 
        e.type === 'DEATH' && checkCondition(state, e.conditions)
      );
      if (deathEnding) return deathEnding.id;

      return identity.currentClass === PlayerClass.Homeless ? 'ED-01' : 'ED-02';
  }

  // 🔴 保护逻辑：如果还没到最后一周/回合，直接屏蔽所有“非死亡”结局
  // ✅ 修正路径：使用 time.currentTurn 和传入的 maxTurns
  if (time.currentTurn < maxTurns) {
      return ''; 
  }

  // 2. 正常结局遍历
  const sortedEndings = [...allEndings].sort((a, b) => b.priority - a.priority);

  for (const ending of sortedEndings) {
      if (ending.type === 'DEATH') continue; 

      if (checkCondition(state, ending.conditions)) {
          return ending.id;
      }
  }

  return '';
};