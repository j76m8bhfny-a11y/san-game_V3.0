/**
 * 系统凝视 (System Gaze)
 * 
 * 动态难度反制系统
 * 
 * 核心理念：
 * - 玩家解锁档案越多，系统越"察觉"这个异常节点
 * - 20档案起强度为0，80档案达到满强度(1.0)
 * - 平滑过渡，避免突然难度跳跃
 */

import { StoreState } from '@/types/store';
import { getArchiveCounts } from './archiveModifier';

// ==========================================
// 1. 凝视强度计算
// ==========================================

/**
 * 计算系统凝视强度
 * 
 * 公式：intensity = max(0, min(1, (totalArchives - 20) / 60))
 * 
 * 曲线：
 * - 0-20档案：0强度（系统尚未察觉）
 * - 20档案：0强度
 * - 40档案：0.33强度
 * - 60档案：0.67强度
 * - 80+档案：1.0强度（满强度）
 */
export function calculateGazeIntensity(totalArchives: number): number {
  return Math.max(0, Math.min(1, (totalArchives - 20) / 60));
}

/**
 * 从State获取凝视强度
 */
export function getCurrentGazeIntensity(state: StoreState): number {
  const counts = getArchiveCounts(state.unlockedArchives || []);
  return calculateGazeIntensity(counts.total);
}

// ==========================================
// 2. 凝视效果配置
// ==========================================

export interface GazeEffects {
  // IRS审计概率（每回合）
  irsAuditChance: number;
  
  // 零工薪资波动下限降低
  gigPayLowerBoundMultiplier: number;
  
  // 保险拒保概率
  insuranceRejectionChance: number;
  
  // 特殊监控事件权重
  surveillanceEventWeight: number;
  
  // 银行审查严格度（影响贷款额度）
  bankScrutinyMultiplier: number;
  
  // 就业歧视概率（高档案=高风险求职者）
  employmentDiscriminationChance: number;
}

/**
 * 根据凝视强度计算具体效果
 */
export function calculateGazeEffects(intensity: number): GazeEffects {
  return {
    // IRS审计：0~15%
    irsAuditChance: intensity * 0.15,
    
    // 零工薪资下限：基础值 × (1 - 0~30%)
    gigPayLowerBoundMultiplier: 1 - intensity * 0.3,
    
    // 保险拒保：0~25%
    insuranceRejectionChance: intensity * 0.25,
    
    // 监控事件权重：1x ~ 3x
    surveillanceEventWeight: 1 + intensity * 2,
    
    // 银行审查：贷款额度 × (1 - 0~20%)
    bankScrutinyMultiplier: 1 - intensity * 0.2,
    
    // 就业歧视：0~20%
    employmentDiscriminationChance: intensity * 0.2
  };
}

/**
 * GAZE_EFFECTS - 向后兼容的函数集合
 * 供其他模块使用来计算具体效果值
 */
export const GAZE_EFFECTS = {
  irsAuditChance: (intensity: number): number => intensity * 0.15,
  gigPayLowerBound: (intensity: number, baseValue: number): number => 
    Math.floor(baseValue * (1 - intensity * 0.3)),
  insuranceRejectionChance: (intensity: number): number => intensity * 0.25,
  lifeCostIncrease: (intensity: number): number => intensity * 0.15,
  evasionDetectionBonus: (intensity: number): number => intensity * 0.2,
  creditRatingImpact: (intensity: number): number => intensity * 0.2
};

// ==========================================
// 3. 叙事分级
// ==========================================

export interface GazeNarrative {
  level: 'NONE' | 'SUBTLE' | 'NOTICEABLE' | 'INTENSE' | 'OVERWHELMING';
  title: string;
  description: string;
  uiEffect?: 'none' | 'subtle_glitch' | 'screen_flicker' | 'edge_distortion' | 'full_glitch';
}

/**
 * 获取当前凝视强度的叙事描述
 */
export function getGazeNarrative(intensity: number): GazeNarrative {
  if (intensity <= 0) {
    return {
      level: 'NONE',
      title: '系统盲区',
      description: '你还没有引起系统的注意。',
      uiEffect: 'none'
    };
  }
  
  if (intensity < 0.2) {
    return {
      level: 'SUBTLE',
      title: '隐约注视',
      description: '你感觉有人在看你。偶尔，你会在人群中看到熟悉的制服。',
      uiEffect: 'subtle_glitch'
    };
  }
  
  if (intensity < 0.5) {
    return {
      level: 'NOTICEABLE',
      title: '系统标记',
      description: '你的银行账户被标记为"高风险"。贷款申请被拒绝的次数变多了。',
      uiEffect: 'screen_flicker'
    };
  }
  
  if (intensity < 0.8) {
    return {
      level: 'INTENSE',
      title: '深度监控',
      description: 'IRS的信封躺在你的门口。你的零工账户被算法限流。他们开始行动了。',
      uiEffect: 'edge_distortion'
    };
  }
  
  return {
    level: 'OVERWHELMING',
    title: '系统追杀',
    description: '他们知道你是谁了。系统正在自我修复这个漏洞。所有 doors are closing.',
    uiEffect: 'full_glitch'
  };
}

// ==========================================
// 4. 具体游戏机制影响
// ==========================================

/**
 * 计算零工实际薪资
 * 考虑系统凝视导致的薪资打压
 */
export function calculateGigPay(
  state: StoreState,
  basePay: number
): { actualPay: number; gazeApplied: boolean } {
  const intensity = getCurrentGazeIntensity(state);
  const effects = calculateGazeEffects(intensity);
  
  if (intensity <= 0) {
    return { actualPay: basePay, gazeApplied: false };
  }
  
  // 薪资下限降低，随机波动范围收窄向下
  const minPay = basePay * 0.5 * effects.gigPayLowerBoundMultiplier;
  const maxPay = basePay * 0.9; // 上限也降低
  
  const actualPay = Math.floor(minPay + Math.random() * (maxPay - minPay));
  
  return { actualPay, gazeApplied: true };
}

/**
 * 检查是否触发IRS审计
 * 每回合调用一次
 */
export function checkIRSAudit(state: StoreState): boolean {
  const intensity = getCurrentGazeIntensity(state);
  const effects = calculateGazeEffects(intensity);
  
  return Math.random() < effects.irsAuditChance;
}

/**
 * 检查保险购买是否被拒保
 */
export function checkInsuranceRejection(
  state: StoreState,
  insuranceType: 'MEDICAL' | 'AUTO' | 'LIFE'
): boolean {
  const intensity = getCurrentGazeIntensity(state);
  const effects = calculateGazeEffects(intensity);
  
  // 基础拒保概率
  let rejectionChance = effects.insuranceRejectionChance;
  
  // 医疗险更容易被拒（既往症审查）
  if (insuranceType === 'MEDICAL') {
    rejectionChance *= 1.5;
  }
  
  return Math.random() < rejectionChance;
}

/**
 * 计算实际可贷款额度
 * 银行审查导致额度降低
 */
export function calculateLoanLimit(
  state: StoreState,
  baseLimit: number
): { actualLimit: number; reason?: string } {
  const intensity = getCurrentGazeIntensity(state);
  const effects = calculateGazeEffects(intensity);
  
  const actualLimit = Math.floor(baseLimit * effects.bankScrutinyMultiplier);
  
  if (intensity > 0.5 && actualLimit < baseLimit) {
    return {
      actualLimit,
      reason: '系统标记：信用历史异常'
    };
  }
  
  return { actualLimit };
}

/**
 * 检查就业歧视
 * 高档案玩家求职时可能被拒
 */
export function checkEmploymentDiscrimination(state: StoreState): boolean {
  const intensity = getCurrentGazeIntensity(state);
  const effects = calculateGazeEffects(intensity);
  
  return Math.random() < effects.employmentDiscriminationChance;
}

// ==========================================
// 5. 事件权重调整
// ==========================================

/**
 * 获取监控类事件的权重倍率
 * 用于事件池抽样
 */
export function getSurveillanceEventWeightMultiplier(state: StoreState): number {
  const intensity = getCurrentGazeIntensity(state);
  const effects = calculateGazeEffects(intensity);
  return effects.surveillanceEventWeight;
}

/**
 * 系统凝视专属事件列表
 * 这些事件只在凝视强度>0时可能触发
 */
export const GAZE_EXCLUSIVE_EVENTS = [
  'EVT_GAZE_IRS_AUDIT',           // IRS审计
  'EVT_GAZE_BANK_FREEZE',         // 账户冻结
  'EVT_GAZE_ALGORITHM_BAN',       // 算法封号
  'EVT_GAZE_BLACKLIST',           // 行业黑名单
  'EVT_GAZE_PRIVATE_INVESTIGATOR', // 私家侦探
  'EVT_GAZE_PHONE_TAP',           // 电话监听
  'EVT_GAZE_CREDIT_DOWNGRADE',    // 信用降级
  'EVT_GAZE_MEDIA_SMear'          // 媒体抹黑
];

/**
 * 检查是否可以触发凝视专属事件
 */
export function canTriggerGazeEvent(state: StoreState, eventId: string): boolean {
  if (!GAZE_EXCLUSIVE_EVENTS.includes(eventId)) {
    return true; // 非专属事件总是可以触发
  }
  
  const intensity = getCurrentGazeIntensity(state);
  return intensity > 0;
}

// ==========================================
// 6. UI状态查询
// ==========================================

/**
 * 获取完整的系统凝视状态（用于UI显示）
 */
export function getGazeStatus(state: StoreState): {
  intensity: number;
  narrative: GazeNarrative;
  effects: GazeEffects;
  warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
} {
  const intensity = getCurrentGazeIntensity(state);
  const narrative = getGazeNarrative(intensity);
  const effects = calculateGazeEffects(intensity);
  
  let warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
  if (intensity > 0.8) warningLevel = 'critical';
  else if (intensity > 0.6) warningLevel = 'high';
  else if (intensity > 0.4) warningLevel = 'medium';
  else if (intensity > 0.2) warningLevel = 'low';
  
  return {
    intensity,
    narrative,
    effects,
    warningLevel
  };
}

// ==========================================
// 7. 调试工具
// ==========================================

/**
 * 打印系统凝视状态（调试用）
 */
export function printGazeStatus(state: StoreState): string {
  const status = getGazeStatus(state);
  const { intensity, narrative, effects } = status;
  
  let output = '\n╔══════════════════════════════════════════════════════════╗\n';
  output += '║                 系统凝视 (System Gaze)                    ║\n';
  output += '╚══════════════════════════════════════════════════════════╝\n\n';
  
  output += `👁️ 凝视强度: ${(intensity * 100).toFixed(1)}% [${narrative.level}]\n`;
  output += `📛 当前等级: ${narrative.title}\n`;
  output += `💬 系统消息: "${narrative.description}"\n\n`;
  
  output += `⚠️ 具体影响:\n`;
  output += `   IRS审计概率: ${(effects.irsAuditChance * 100).toFixed(1)}%/回合\n`;
  output += `   零工薪资下限: ${(effects.gigPayLowerBoundMultiplier * 100).toFixed(0)}%\n`;
  output += `   保险拒保概率: ${(effects.insuranceRejectionChance * 100).toFixed(1)}%\n`;
  output += `   银行贷款额度: ${(effects.bankScrutinyMultiplier * 100).toFixed(0)}%\n`;
  output += `   就业歧视概率: ${(effects.employmentDiscriminationChance * 100).toFixed(1)}%\n`;
  output += `   监控事件权重: ${effects.surveillanceEventWeight.toFixed(1)}x\n`;
  
  return output;
}
