import { GameState, Ending, PlayerClass } from '../types/schema';
// ✅ 1. 引入配置文件 (核心改动)
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// 通用条件检查器 (保持原有逻辑，仅做少量格式优化)
const checkCondition = (state: GameState, condition: Ending['conditions']): boolean => {
  if (!condition) return true;

  // 1. 快捷访问路径
  const { metrics, identity, time, flags } = state.vitality;

  // 2. 检查各项指标
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

// 🛠️ 结局判定逻辑 (已重构)
export const resolveEnding = (
    state: GameState, 
    allEndings: Ending[], 
    // ✅ 2. 默认值改为从配置读取 (不再硬编码 40)
    maxTurns: number = ENDING_RULES.constraints.maxTurns, 
    deathReason?: string
): string => {
  const { metrics, identity, time } = state.vitality;
  
  // ✅ 3. 解构配置项
  const { deathReasons, mappings, ui } = ENDING_RULES;
  const { minStat } = SYSTEM_RULES.caps;

  // --- A. 系统强制死亡判定 ---
  if (metrics.hp <= minStat || deathReason) {
      
      // ✅ 4. 动态死因映射
      // 以前这里是写死的 if (deathReason === 'COP') return 'ED-04'...
      // 现在支持通过 JSON 扩展任意新的死因，无需修改代码
      if (deathReason) {
          // 使用类型断言访问 JSON 对象，获取对应的结局 ID
          const specificEndingId = (deathReasons as Record<string, string>)[deathReason];
          if (specificEndingId) {
              return specificEndingId;
          }
      }
      
      // ✅ 5. 检查特定条件死亡结局
      // 使用配置中的 ui.categories.death 替代硬编码字符串 'DEATH'
      const deathEnding = allEndings.find(e => 
        e.type === ui.categories.death && checkCondition(state, e.conditions)
      );
      if (deathEnding) return deathEnding.id;

      // ✅ 6. 动态返回保底结局
      // 不再硬写 'ED-01' / 'ED-02'
      return identity.currentClass === PlayerClass.Homeless 
          ? mappings.fallbackDeath.homeless 
          : mappings.fallbackDeath.default;
  }

  // 🔴 保护逻辑：如果还没到最后一周/回合，直接屏蔽所有“非死亡”结局
  // 使用传入的 maxTurns (默认来自配置)
  if (time.currentTurn < maxTurns) {
      return ''; 
  }

  // --- B. 正常结局遍历 ---
  const sortedEndings = [...allEndings].sort((a, b) => b.priority - a.priority);

  for (const ending of sortedEndings) {
      // 跳过死亡类型的结局 (它们只在上面触发)
      if (ending.type === ui.categories.death) continue; 

      if (checkCondition(state, ending.conditions)) {
          return ending.id;
      }
  }

  return '';
};