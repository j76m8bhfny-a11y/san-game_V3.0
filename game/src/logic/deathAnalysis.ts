/**
 * deathAnalysis - 死亡复盘分析系统
 * 
 * 分析玩家死亡原因，提供具体改进建议
 * 帮助玩家从失败中学习，提高留存率
 */

import { StoreState } from '@/types/store';

export type DeathCause = 
  | 'starvation'      // 饥饿
  | 'violence'        // 暴力/伤害
  | 'disease'         // 疾病
  | 'accident'        // 意外
  | 'system'          // 系统惩罚
  | 'unknown';        // 未知

export interface PlayerMistake {
  turn: number;
  description: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface ImprovementSuggestion {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium';
}

export interface DeathAnalysis {
  cause: DeathCause;
  causeDescription: string;
  mistakes: PlayerMistake[];
  suggestions: ImprovementSuggestion[];
  replayIncentive: string;
  milestones: {
    survivedWeeks: number;
    unlockedArchives: number;
    isPersonalBest: boolean;
  };
}

// 饥饿相关死亡关键词
const STARVATION_KEYWORDS = ['hunger', 'starvation', '饥饿', '饿死', '虚弱'];
// 暴力相关死亡关键词
const VIOLENCE_KEYWORDS = ['violence', 'attack', 'damage', '伤害', '攻击', '暴力'];
// 疾病相关死亡关键词
const DISEASE_KEYWORDS = ['disease', 'illness', 'sick', '疾病', '感染', '病毒'];
// 意外相关死亡关键词
const ACCIDENT_KEYWORDS = ['accident', 'mishap', '意外', '事故'];
// 系统惩罚关键词
const SYSTEM_KEYWORDS = ['audit', 'arrest', 'system', '审计', '逮捕', '系统'];

/**
 * 分析死亡原因
 */
function analyzeDeathCause(
  finalState: StoreState,
  deathEventId?: string,
  deathDescription?: string
): { cause: DeathCause; description: string } {
  const { vitality } = finalState;
  const desc = deathDescription?.toLowerCase() || '';
  const eventId = deathEventId?.toLowerCase() || '';
  
  // 检查关键词
  const checkKeywords = (keywords: string[]) => 
    keywords.some(kw => desc.includes(kw) || eventId.includes(kw));
  
  // 饥饿死亡判断
  if (vitality.metrics.hunger >= 90 || checkKeywords(STARVATION_KEYWORDS)) {
    return {
      cause: 'starvation',
      description: '长期饥饿导致身体虚弱，最终无法维持生命机能',
    };
  }
  
  // 暴力死亡判断
  if (vitality.metrics.hp <= 0 && checkKeywords(VIOLENCE_KEYWORDS)) {
    return {
      cause: 'violence',
      description: '遭受严重伤害，生命值归零',
    };
  }
  
  // 疾病死亡判断
  if (vitality.activeDiseases.length > 0 && checkKeywords(DISEASE_KEYWORDS)) {
    return {
      cause: 'disease',
      description: '疾病未得到及时治疗，病情恶化导致死亡',
    };
  }
  
  // 系统惩罚死亡
  if (checkKeywords(SYSTEM_KEYWORDS)) {
    return {
      cause: 'system',
      description: '系统惩罚机制触发，无法承受压力',
    };
  }
  
  // 意外死亡
  if (checkKeywords(ACCIDENT_KEYWORDS)) {
    return {
      cause: 'accident',
      description: '遭遇不可预料的意外事件',
    };
  }
  
  // 默认判断
  if (vitality.metrics.hunger > 80) {
    return {
      cause: 'starvation',
      description: '饥饿度过高导致死亡',
    };
  }
  
  if (vitality.activeDiseases.length > 0) {
    return {
      cause: 'disease',
      description: '疾病导致死亡',
    };
  }
  
  return {
    cause: 'unknown',
    description: '死因不明，可能是多种因素叠加',
  };
}

/**
 * 分析玩家犯的错误
 */
function analyzeMistakes(gameState: StoreState): PlayerMistake[] {
  const mistakes: PlayerMistake[] = [];
  const { vitality } = gameState;
  
  // 检查历史记录（如果有）
  const history = (gameState as any).turnHistory || [];
  
  // 分析饥饿相关错误
  let hungerWarnings = 0;
  history.forEach((turn: any, index: number) => {
    if (turn.hunger > 70) {
      hungerWarnings++;
      if (hungerWarnings >= 2 && !mistakes.find(m => m.description.includes('饥饿'))) {
        mistakes.push({
          turn: index + 1,
          description: `第${index + 1}周饥饿度超过70%但未及时处理`,
          severity: 'critical',
        });
      }
    }
    
    // 有钱不买食物
    if (turn.hunger > 60 && turn.gold > 50 && turn.foodConsumed === 0) {
      mistakes.push({
        turn: index + 1,
        description: `第${index + 1}周有钱($${turn.gold})但没有购买食物`,
        severity: 'major',
      });
    }
  });
  
  // 当前状态分析
  if (vitality.metrics.gold > 100 && vitality.metrics.hunger > 50) {
    mistakes.push({
      turn: vitality.time.currentTurn,
      description: '死亡时身上有较多现金，但没有用于解决饥饿',
      severity: 'critical',
    });
  }
  
  // 疾病未治疗
  if (vitality.activeDiseases.length > 0) {
    const diseaseCount = vitality.activeDiseases.length;
    mistakes.push({
      turn: vitality.time.currentTurn,
      description: `携带${diseaseCount}种疾病未治疗，健康状态持续恶化`,
      severity: 'major',
    });
  }
  
  // 高风险选择
  const highRiskChoices = history.filter((h: any) => h.choiceType === 'D' && h.hpChange < -15);
  if (highRiskChoices.length > 0) {
    mistakes.push({
      turn: highRiskChoices[highRiskChoices.length - 1].turn,
      description: '在生命值较低时仍选择高风险选项',
      severity: 'major',
    });
  }
  
  // 无家可归且没有防御
  if (!gameState.activeHousing && vitality.metrics.hp < 30) {
    mistakes.push({
      turn: vitality.time.currentTurn,
      description: '没有住所，无法恢复HP，在危险状态下得不到保护',
      severity: 'major',
    });
  }
  
  return mistakes.slice(0, 4); // 最多显示4个错误
}

/**
 * 生成改进建议
 */
function generateSuggestions(
  cause: DeathCause,
  mistakes: PlayerMistake[]
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  
  // 根据死亡原因给出首要建议
  switch (cause) {
    case 'starvation':
      suggestions.push({
        title: '优先保证食物',
        description: '每周开始时先预留食物钱。便利店的食物虽然贵但方便，贫民窟的食物便宜但需要时间。',
        priority: 'urgent',
      });
      break;
      
    case 'violence':
      suggestions.push({
        title: '避免危险区域',
        description: '当HP低于50%时，避免进入高风险区域。优先找住所恢复HP。',
        priority: 'urgent',
      });
      break;
      
    case 'disease':
      suggestions.push({
        title: '及时治疗疾病',
        description: '生病后尽快去医院或使用药品。小病不治会拖成大病。',
        priority: 'urgent',
      });
      break;
      
    case 'system':
      suggestions.push({
        title: '控制档案解锁节奏',
        description: '解锁太多档案会触发系统惩罚。适当控制节奏，先确保生存。',
        priority: 'high',
      });
      break;
  }
  
  // 根据错误给出具体建议
  if (mistakes.some(m => m.description.includes('饥饿'))) {
    suggestions.push({
      title: '监控饥饿度',
      description: '当饥饿度超过70%时，选择最安全的选项（通常是A）。',
      priority: 'high',
    });
  }
  
  if (mistakes.some(m => m.description.includes('疾病'))) {
    suggestions.push({
      title: '购买医疗保险',
      description: '医保可以大幅降低治疗成本。长期来说，保险是划算的投资。',
      priority: 'high',
    });
  }
  
  if (mistakes.some(m => m.description.includes('住所'))) {
    suggestions.push({
      title: '优先解决住宿',
      description: '住所不仅提供HP恢复，还能解锁更多选择。把住宿当作第二优先级。',
      priority: 'medium',
    });
  }
  
  // 通用建议
  suggestions.push({
    title: '理解生存率',
    description: '注意屏幕角落的生存率显示。低于50%时，你正处于危险状态。',
    priority: 'medium',
  });
  
  return suggestions.slice(0, 4); // 最多显示4条建议
}

/**
 * 生成再玩激励文案
 */
function generateReplayIncentive(
  survivedWeeks: number,
  unlockedArchives: number,
  totalDeaths: number
): string {
  if (unlockedArchives > 0) {
    return `你解锁了${unlockedArchives}份档案，下次D选项伤害减少${Math.min(unlockedArchives * 2, 67)}%。每一次轮回都会让你更强大。`;
  }
  
  if (totalDeaths === 1) {
    return '第一次死亡总是最艰难的。现在你已经了解了这个世界的残酷，下次会更好。';
  }
  
  if (survivedWeeks < 3) {
    return `你存活了${survivedWeeks}周。试着活过第一周，你会发现游戏开始变得更加清晰。`;
  }
  
  if (survivedWeeks >= 5) {
    return `不错的表现！${survivedWeeks}周的存活证明你已经掌握了基本生存技巧。`;
  }
  
  return '死亡不是终点，而是学习的一部分。每一次轮回都会让你更接近真相。';
}

/**
 * 主分析函数
 */
export function analyzeDeath(
  gameState: StoreState,
  deathEventId?: string,
  deathDescription?: string
): DeathAnalysis {
  const { vitality } = gameState;
  const currentRunArchives = (gameState as any).currentRun?.unlockedArchives || [];
  
  // 分析死因
  const { cause, description: causeDescription } = analyzeDeathCause(
    gameState,
    deathEventId,
    deathDescription
  );
  
  // 分析错误
  const mistakes = analyzeMistakes(gameState);
  
  // 生成建议
  const suggestions = generateSuggestions(cause, mistakes);
  
  // 生成激励
  const replayIncentive = generateReplayIncentive(
    vitality.time.currentTurn,
    currentRunArchives.length,
    (gameState as any).totalDeaths || 1
  );
  
  return {
    cause,
    causeDescription,
    mistakes,
    suggestions,
    replayIncentive,
    milestones: {
      survivedWeeks: vitality.time.currentTurn,
      unlockedArchives: currentRunArchives.length,
      isPersonalBest: false, // TODO: 与历史记录比较
    },
  };
}

export default analyzeDeath;
