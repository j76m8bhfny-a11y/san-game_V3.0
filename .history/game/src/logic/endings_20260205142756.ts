import { GameState, Ending, PlayerClass } from '../types/schema';
// ✅ 1. 引入配置
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';

// 复用 checkCondition (保持不变，略...)
const checkCondition = (state: GameState, condition: Ending['conditions']): boolean => {
    // ... (保持原逻辑) ...
    // 为节省篇幅，此处省略 checkCondition 具体实现，与原文件一致
    if (!condition) return true;
    const { metrics, identity, time, flags } = state.vitality;
    if (condition.minTurn !== undefined && time.currentTurn < condition.minTurn) return false;
    if (condition.maxHp !== undefined && metrics.hp > condition.maxHp) return false;
    if (condition.minSan !== undefined && metrics.san < condition.minSan) return false;
    if (condition.maxSan !== undefined && metrics.san > condition.maxSan) return false;
    if (condition.minGold !== undefined && metrics.gold < condition.minGold) return false;
    if (condition.maxGold !== undefined && metrics.gold > condition.maxGold) return false;
    if (condition.requiredClass !== undefined && identity.currentClass !== condition.requiredClass) return false;
    if (condition.requiredFlags) {
        for (const flag of condition.requiredFlags) { if (!flags[flag]) return false; }
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

export const resolveEnding = (
    state: GameState, 
    allEndings: Ending[], 
    // ✅ 2. 参数默认值改为从配置读取
    maxTurns: number = ENDING_RULES.constraints.maxTurns, 
    deathReason?: string
): string => {
  const { metrics, identity, time } = state.vitality;
  const { deathReasons, mappings, ui } = ENDING_RULES;

  // 1. 系统强制死亡判定
  if (metrics.hp <= 0 || deathReason) {
      
      // ✅ 3. 动态映射特殊死因
      // 如果 deathReason 存在于配置表中，直接返回对应 ID
      if (deathReason && (deathReasons as any)[deathReason]) {
          return (deathReasons as any)[deathReason];
      }
      
      // 检查特定条件死亡结局
      const deathEnding = allEndings.find(e => 
        e.type === ui.categories.death && checkCondition(state, e.conditions)
      );
      if (deathEnding) return deathEnding.id;

      // ✅ 4. 动态返回保底结局
      return identity.currentClass === PlayerClass.Homeless 
        ? mappings.fallbackDeath.homeless 
        : mappings.fallbackDeath.default;
  }

  // 🔴 保护逻辑：如果还没到最后一周，直接屏蔽
  if (time.currentTurn < maxTurns) {
      return ''; 
  }

  // 2. 正常结局遍历 (按优先级)
  const sortedEndings = [...allEndings].sort((a, b) => b.priority - a.priority);

  for (const ending of sortedEndings) {
      if (ending.type === ui.categories.death) continue; 

      if (checkCondition(state, ending.conditions)) {
          return ending.id;
      }
  }

  return '';
};