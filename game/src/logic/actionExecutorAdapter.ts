/**
 * Action Executor Adapter - 将新的档案系统接入到现有的ActionExecutor
 * 
 * 功能：
 * 1. 在事件效果计算中应用档案奖励（D选项惩罚减少等）
 * 2. 处理档案解锁逻辑
 * 3. 对接System Gaze系统
 */

import { StoreState } from '@/types/store';
import { 
  getArchiveCounts,
  calculateDOptionReduction as calculateDOptionPenaltyReduction,
  getEffectiveHomelessPenalty,
  getEffectiveWorkerHpCost,
  getEffectiveInterestRate,
  hasMiddleSanImmunity,
  getCapitalistStartingCredit
} from './archiveModifier';
import { 
  calculateGazeIntensity,
  calculateGazeEffects,
  GAZE_EFFECTS
} from './systemGaze';
import { PlayerClass } from '@/types/schema';

// ==========================================
// 效果计算适配器
// ==========================================

export interface CalculatedEffect {
  gold: number;
  hp: number;
  insight: number;
  insightGain: number;
  points: Record<string, number>;
  // 特殊效果
  unlockArchive?: string;
  triggerGazeEvent?: boolean;
}

/**
 * 计算标准化事件效果
 * 
 * 这是核心计算函数，所有事件效果都应该通过这个函数计算
 * 它会自动应用：
 * - 阶级特定加成
 * - 档案奖励
 * - System Gaze惩罚
 */
export function calculateEventEffect(
  state: StoreState,
  baseEffect: {
    scaling: 'LEVERAGE' | 'FIXED' | 'INCOME';
    gold: number;
    hp: number;
    insight?: number;
    insightGain?: number;
    points?: Record<string, number>;
  },
  optionType: 'A' | 'B' | 'C' | 'D',
  isDOption: boolean = false
): CalculatedEffect {
  const result: CalculatedEffect = {
    gold: 0,
    hp: 0,
    insight: 0,
    insightGain: 0,
    points: baseEffect.points || {}
  };

  // 获取全局进度状态
  const totalArchives = state.unlockedArchives?.length || 0;
  const playerClass = state.vitality?.identity?.currentClass as PlayerClass;
  const gazeIntensity = calculateGazeIntensity(totalArchives);

  // 1. 计算金币
  result.gold = calculateGoldEffect(
    baseEffect.gold,
    baseEffect.scaling,
    playerClass,
    state,
    gazeIntensity
  );

  // 2. 计算HP（应用档案奖励和System Gaze）
  result.hp = calculateHpEffect(
    baseEffect.hp,
    optionType,
    playerClass,
    totalArchives,
    isDOption,
    state
  );

  // 3. 计算洞察力
  if (baseEffect.insight !== undefined) {
    result.insight = baseEffect.insight;
  }
  if (baseEffect.insightGain !== undefined) {
    result.insightGain = baseEffect.insightGain;
  }

  // 4. 应用System Gaze效果（如果适用）
  if (gazeIntensity > 0) {
    applyGazeEffects(result, gazeIntensity, playerClass);
  }

  return result;
}

/**
 * 计算金币效果
 */
function calculateGoldEffect(
  baseGold: number,
  scaling: string,
  playerClass: PlayerClass,
  state: StoreState,
  gazeIntensity: number
): number {
  let gold = baseGold;
  const currentGold = state.vitality?.metrics?.gold || 0;

  switch (scaling) {
    case 'LEVERAGE':
      // LEVERAGE: 基于阶级的杠杆
      gold = applyClassMultiplier(gold, playerClass);
      break;
    case 'INCOME':
      // INCOME: 比例扣除/增加
      if (gold < 0) {
        // 扣除：应用gaze的gig pay下限
        const gazeEffects = calculateGazeEffects(gazeIntensity);
        const lowerBound = gazeEffects.gigPayLowerBoundMultiplier * 30;
        const deduction = Math.max(lowerBound, Math.abs(gold) * currentGold);
        gold = -deduction;
      } else {
        gold = gold * currentGold;
      }
      break;
    case 'FIXED':
    default:
      // FIXED: 固定值，不变
      break;
  }

  return Math.round(gold);
}

/**
 * 计算HP效果
 */
function calculateHpEffect(
  baseHp: number,
  _optionType: 'A' | 'B' | 'C' | 'D',
  playerClass: PlayerClass,
  totalArchives: number,
  isDOption: boolean,
  state: StoreState
): number {
  let hp = baseHp;

  // D选项惩罚减免
  if (isDOption && hp < 0) {
    const reduction = calculateDOptionPenaltyReduction(totalArchives);
    hp = Math.round(hp * (1 - reduction));
  }

  // 阶级特定调整
  switch (playerClass) {
    case 'HOMELESS':
      // 流浪者：应用有效惩罚（不会太高）
      if (hp < 0) {
        hp = -getEffectiveHomelessPenalty(state, Math.abs(hp));
      }
      break;
    case 'WORKER':
      // 打工人：应用有效HP消耗（有下限）
      if (hp < 0) {
        hp = -getEffectiveWorkerHpCost({ baseHpCost: Math.abs(hp), jobClass: PlayerClass.Worker });
      }
      break;
    case 'MIDDLE':
      // 中产：可能有SAN免疫
      if (hasMiddleSanImmunity({ unlockedArchives: state.unlockedArchives || [], vitality: state.vitality } as StoreState)) {
        // 免疫某些负面效果
        hp = Math.max(hp, -5); // 伤害不超过5
      }
      break;
    case 'CAPITALIST':
      // 资本家：可能触发审计（ gaze效果 ）
      if (calculateGazeIntensity(totalArchives) > 0.5) {
        const gazeEffects = calculateGazeEffects(calculateGazeIntensity(totalArchives));
        const auditChance = gazeEffects.irsAuditChance;
        if (Math.random() < auditChance) {
          // 审计触发，额外损失
          hp -= 10;
        }
      }
      break;
  }

  return hp;
}

/**
 * 应用阶级倍数
 */
function applyClassMultiplier(baseValue: number, playerClass: PlayerClass): number {
  const multipliers: Record<PlayerClass, number> = {
    'HOMELESS': 0.15,
    'WORKER': 0.5,
    'MIDDLE': 1.0,
    'CAPITALIST': 2.0
  };
  return baseValue * multipliers[playerClass];
}

/**
 * 应用System Gaze效果
 */
function applyGazeEffects(
  effect: CalculatedEffect,
  intensity: number,
  playerClass: PlayerClass
): void {
  // 根据职业应用不同的gaze惩罚
  switch (playerClass) {
    case 'HOMELESS':
      // 流浪者：保险拒赔几率增加
      const gazeEffects = calculateGazeEffects(intensity);
      if (Math.random() < gazeEffects.insuranceRejectionChance) {
        effect.hp -= 5; // 额外HP损失
      }
      break;
    case 'WORKER':
      // 打工人：gig pay下限降低已在calculateGoldEffect中处理
      break;
    case 'MIDDLE':
      // 中产：生活成本增加
      const lifeCostIncrease = calculateGazeEffects(intensity).employmentDiscriminationChance;
      if (effect.gold < 0) {
        effect.gold = Math.round(effect.gold * (1 + lifeCostIncrease));
      }
      break;
    case 'CAPITALIST':
      // 资本家：信用评级影响
      const creditImpact = calculateGazeEffects(intensity).bankScrutinyMultiplier;
      if (effect.gold < 0) {
        effect.gold = Math.round(effect.gold * (1 + creditImpact));
      }
      break;
  }
}

// ==========================================
// 档案解锁适配器
// ==========================================

export interface ArchiveUnlockResult {
  success: boolean;
  archiveId: string;
  isNew: boolean;
  milestoneTriggered: boolean;
}

/**
 * 处理档案解锁
 * 
 * 这个函数应该在玩家选择D选项且满足条件时调用
 */
export function processArchiveUnlock(
  state: StoreState,
  archiveId: string | undefined
): ArchiveUnlockResult {
  const result: ArchiveUnlockResult = {
    success: false,
    archiveId: archiveId || '',
    isNew: false,
    milestoneTriggered: false
  };

  if (!archiveId) {
    return result;
  }

  const wasUnlocked = state.unlockedArchives?.includes(archiveId) || false;

  if (!wasUnlocked) {
    result.success = true;
    result.isNew = true;
    
    // 检查是否触发里程碑
    const newCount = (state.unlockedArchives?.length || 0) + 1;
    if (newCount % 3 === 0 || [10, 25, 40].includes(newCount)) {
      result.milestoneTriggered = true;
    }
  } else {
    result.success = true;
    result.isNew = false;
  }

  return result;
}

// ==========================================
// System Gaze 检查适配器
// ==========================================

export interface GazeCheckResult {
  shouldTrigger: boolean;
  exclusiveEventId?: string;
  intensity: number;
}

/**
 * 检查是否应该触发System Gaze专属事件
 */
export function checkGazeEventTrigger(state: StoreState): GazeCheckResult {
  const totalArchives = state.unlockedArchives?.length || 0;
  const intensity = calculateGazeIntensity(totalArchives);

  const result: GazeCheckResult = {
    shouldTrigger: false,
    intensity
  };

  // 只有gaze强度超过阈值才可能触发
  if (intensity < 0.3) {
    return result;
  }

  // 检查是否应该触发专属事件（随机概率触发）
  const triggerChance = (intensity - 0.3) / 0.7 * 0.15; // 强度0.3~1.0对应0~15%概率
  if (intensity >= 0.3 && Math.random() < triggerChance) {
    result.shouldTrigger = true;
    // 这里可以根据gaze强度返回不同的事件ID
    // 简化版本：返回一个通用ID，由事件加载器处理
    result.exclusiveEventId = 'GAZE_EXCLUSIVE_RANDOM';
  }

  return result;
}

// ==========================================
// 运行时统计适配器
// ==========================================

export interface RuntimeStats {
  // D选项相关
  dOptionPenaltyReduction: number;
  dOptionHpCostMultiplier: number;
  
  // 阶级加成
  classSpecificBonuses: {
    homeless: { penaltyReduction: number };
    worker: { hpCostReduction: number };
    middle: { hasSanImmunity: boolean; interestRate: number };
    capitalist: { startingCredit: number };
  };
  
  // System Gaze
  gazeIntensity: number;
  gazeEffects: {
    irsAuditChance: number;
    gigPayLowerBound: number;
    insuranceRejectionChance: number;
    lifeCostIncrease: number;
    evasionDetectionBonus: number;
    creditRatingImpact: number;
  };
}

/**
 * 获取运行时统计数据
 * 
 * 用于UI显示（如状态栏、工具提示等）
 */
export function getRuntimeStats(state: StoreState): RuntimeStats {
  const totalArchives = state.unlockedArchives?.length || 0;
  const counts = getArchiveCounts(state.unlockedArchives || []);
  const intensity = calculateGazeIntensity(totalArchives);

  return {
    dOptionPenaltyReduction: calculateDOptionPenaltyReduction(totalArchives),
    dOptionHpCostMultiplier: 1 - calculateDOptionPenaltyReduction(totalArchives),
    
    classSpecificBonuses: {
      homeless: {
        penaltyReduction: Math.min(0.3, counts.homeless * 0.03)
      },
      worker: {
        hpCostReduction: Math.min(0.3, counts.worker * 0.03)
      },
      middle: {
        hasSanImmunity: hasMiddleSanImmunity({ unlockedArchives: state.unlockedArchives || [], vitality: state.vitality } as StoreState),
        interestRate: getEffectiveInterestRate(state, 0.05)
      },
      capitalist: {
        startingCredit: getCapitalistStartingCredit(state)
      }
    },
    
    gazeIntensity: intensity,
    gazeEffects: {
      irsAuditChance: GAZE_EFFECTS.irsAuditChance(intensity),
      gigPayLowerBound: GAZE_EFFECTS.gigPayLowerBound(intensity, 30),
      insuranceRejectionChance: GAZE_EFFECTS.insuranceRejectionChance(intensity),
      lifeCostIncrease: GAZE_EFFECTS.lifeCostIncrease(intensity),
      evasionDetectionBonus: GAZE_EFFECTS.evasionDetectionBonus(intensity),
      creditRatingImpact: GAZE_EFFECTS.creditRatingImpact(intensity)
    }
  };
}

// ==========================================
// 与现有ActionExecutor的集成函数
// ==========================================

/**
 * 这是与现有ActionExecutor集成的核心函数
 * 
 * 用法：在现有的ActionExecutor.executeEffect()中调用此函数
 * 来应用档案和System Gaze的修改
 */
export function applyArchiveAndGazeModifiers(
  baseEffect: { gold: number; hp: number; insight: number },
  state: StoreState,
  optionType: 'A' | 'B' | 'C' | 'D',
  eventData?: { scaling?: string; isDOption?: boolean }
): { gold: number; hp: number; insight: number; modifiers: string[] } {
  const modifiers: string[] = [];
  
  const calculated = calculateEventEffect(
    state,
    {
      scaling: (eventData?.scaling as any) || 'FIXED',
      gold: baseEffect.gold,
      hp: baseEffect.hp,
      insight: baseEffect.insight
    },
    optionType,
    eventData?.isDOption || optionType === 'D'
  );

  // 记录应用的修改器（用于UI显示）
  const totalArchives = state.unlockedArchives?.length || 0;
  
  if (optionType === 'D' && totalArchives > 0) {
    const reduction = calculateDOptionPenaltyReduction(totalArchives);
    if (reduction > 0) {
      modifiers.push(`档案减免: ${Math.round(reduction * 100)}%`);
    }
  }

  const gazeIntensity = calculateGazeIntensity(totalArchives);
  if (gazeIntensity > 0) {
    modifiers.push(`系统凝视: ${Math.round(gazeIntensity * 100)}%`);
  }

  return {
    gold: calculated.gold,
    hp: calculated.hp,
    insight: calculated.insight + (calculated.insightGain || 0),
    modifiers
  };
}
