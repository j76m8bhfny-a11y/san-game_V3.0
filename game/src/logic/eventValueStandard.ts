/**
 * 事件数值标准化词典
 * 
 * 设计理念：
 * - 所有事件必须引用此词典，确保全局数值平衡
 * - 四选项对应四种意识形态：A(奋斗逼)/B(麻木)/C(维稳)/D(觉醒)
 * - 数值经过严格校准，确保选择张力
 */

import { PlayerClass } from '@/types/schema';

// ==========================================
// 1. 四选项标准数值模板
// ==========================================

export const EVENT_VALUE_TEMPLATES = {
  /**
   * A选项：奋斗逼/精神资本家
   * - 迎合系统，用身体换钱
   * - 高收入但高身体损耗
   * - 认知失调导致灵视增长
   */
  A_LEVERAGE: {
    description: '迎合系统，内耗换钱',
    ideology: '新自由主义/奋斗逼',
    scaling: 'LEVERAGE' as const,
    gold: 150,           // 基础值，乘以阶级系数
    hp: -12,             // 严重身体损耗
    insightGain: 5,      // 认知失调滋长灵视
    points: { old: 3 }   // 偏向保守/传统价值观
  },

  /**
   * A选项（无家可归者补偿版）
   * - 越穷越信鸡汤，觉醒更深
   */
  A_LEVERAGE_HOMELESS: {
    description: '迎合系统，内耗换钱（无家可归者版）',
    ideology: '新自由主义/奋斗逼',
    scaling: 'LEVERAGE' as const,
    gold: 150,
    hp: -12,
    insightGain: 8,      // 认知失调更严重
    points: { old: 5 }
  },

  /**
   * B选项：麻木打工人/随波逐流
   * - 不思考，不反抗
   * - 慢性死亡选项
   */
  B_FIXED: {
    description: '麻木生存，慢性死亡',
    ideology: '犬儒主义/摆烂',
    scaling: 'FIXED' as const,
    gold: 25,            // 微量固定收入
    hp: -3,              // 轻微损耗（不再回血）
    insightGain: 1,      // 极少觉醒
    points: {}           // 无政治倾向
  },

  /**
   * C选项：理中客/消费主义维稳
   * - 花钱消灾，洗掉灵视
   * - 维稳通道，避免高灵视失业
   */
  C_INCOME: {
    description: '花钱消灾，洗掉灵视',
    ideology: '消费主义/岁静',
    scaling: 'INCOME' as const,
    gold: -0.15,         // 扣除15%周薪
    hp: 8,               // 消费安慰剂回血
    insight: -10,        // 洗掉10点灵视（注意是负值=减少）
    points: { wolf: 3 }  // 偏向自由派/改良主义
  },

  /**
   * D选项：清醒者/揭露真相
   * - 直视深渊，获得档案
   * - 前置条件：灵视>40
   */
  D_TRUTH: {
    description: '直视深渊，获得档案',
    ideology: '激进左翼/觉醒',
    scaling: 'FIXED' as const,
    gold: -100,          // 巨额固定惩罚
    hp: -18,             // 重创（基础值，实际受减免影响）
    insight: -10,        // 燃烧灵视固化为档案
    points: { red: 15 }, // 极大激进左翼倾向
    sanLock: 40,         // 前置条件：灵视>40
    isGlitched: true     // UI故障风格
  },

  /**
   * D选项（后期弱化版）
   * - sanLock降低，更容易看到
   */
  D_TRUTH_VETERAN: {
    description: '直视深渊（老手版）',
    ideology: '激进左翼/觉醒',
    scaling: 'FIXED' as const,
    gold: -100,
    hp: -18,
    insight: -10,
    points: { red: 15 },
    sanLock: 35,         // 门槛降低
    isGlitched: true
  }
};

// ==========================================
// 2. 阶级杠杆系数
// ==========================================

/**
 * LEVERAGE模式下的阶级乘数
 * 体现阶级不平等：越高阶级，同样的"努力"获得越多
 */
export const CLASS_LEVERAGE_MULTIPLIERS: Record<PlayerClass, number> = {
  HOMELESS: 0.15,      // 150 × 0.15 = 22.5金（最剥削）
  WORKER: 0.50,        // 150 × 0.50 = 75金
  MIDDLE: 1.00,        // 150 × 1.00 = 150金
  CAPITALIST: 2.00     // 150 × 2.00 = 300金（最暴利）
};

// ==========================================
// 3. 数值边界保护
// ==========================================

/**
 * 应用数值边界保护
 * 确保各种计算不会溢出或产生荒谬结果
 */
export const ValueBounds = {
  // HP相关
  hp: {
    min: 0,
    max: 100,
    deathThreshold: 0    // 0以下死亡
  },

  // 金钱相关
  gold: {
    min: -999999,        // 允许巨额负债
    bankruptcyThreshold: -1000  // 负债超过此值触发破产事件
  },

  // 灵视相关
  insight: {
    min: 0,
    max: 100,
    madnessThreshold: 100,     // 100时精神崩溃
    awakeningThreshold: 40     // 40以上看到D选项
  },

  // 政治倾向
  points: {
    min: -1000,
    max: 1000
  }
};

/**
 * 应用边界限制
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampHp(hp: number): number {
  return clampValue(hp, ValueBounds.hp.min, ValueBounds.hp.max);
}

export function clampInsight(insight: number): number {
  return clampValue(insight, ValueBounds.insight.min, ValueBounds.insight.max);
}

export function clampGold(gold: number): number {
  return Math.max(ValueBounds.gold.min, gold); // 无上界
}

// ==========================================
// 4. 事件效果计算助手
// ==========================================

/**
 * 计算A选项的实际收益
 * 考虑阶级杠杆和 homeless 补偿
 */
export function calculateAOptionValue(
  playerClass: PlayerClass,
  isHomeless: boolean
): { gold: number; hp: number; insightGain: number } {
  const template = isHomeless && playerClass === 'HOMELESS'
    ? EVENT_VALUE_TEMPLATES.A_LEVERAGE_HOMELESS
    : EVENT_VALUE_TEMPLATES.A_LEVERAGE;

  const multiplier = CLASS_LEVERAGE_MULTIPLIERS[playerClass];

  return {
    gold: Math.round(template.gold * multiplier),
    hp: template.hp,
    insightGain: template.insightGain
  };
}

/**
 * 计算B选项的实际收益
 * 固定值，不受阶级影响
 */
export function calculateBOptionValue(): { gold: number; hp: number; insightGain: number } {
  const template = EVENT_VALUE_TEMPLATES.B_FIXED;
  return {
    gold: template.gold,
    hp: template.hp,
    insightGain: template.insightGain
  };
}

/**
 * 计算C选项的实际收益
 * 基于玩家周收入的比例
 */
export function calculateCOptionValue(
  weeklyIncome: number
): { gold: number; hp: number; insight: number } {
  const template = EVENT_VALUE_TEMPLATES.C_INCOME;
  return {
    gold: Math.round(weeklyIncome * template.gold), // gold是负数
    hp: template.hp,
    insight: template.insight  // 负值=减少灵视
  };
}

/**
 * 计算D选项的实际收益
 * 受档案减免系统影响
 */
export function calculateDOptionValue(
  reductionRate: number  // 0~0.67，来自archiveModifier
): { gold: number; hp: number; insight: number } {
  const template = EVENT_VALUE_TEMPLATES.D_TRUTH;
  return {
    gold: template.gold,
    hp: Math.round(template.hp * (1 - reductionRate)), // 应用减免
    insight: template.insight
  };
}

// ==========================================
// 5. 事件模板验证
// ==========================================

/**
 * 验证事件数值是否符合标准
 * 用于开发期检查，确保所有事件引用标准词典
 */
export function validateEventValues(
  optionType: 'A' | 'B' | 'C' | 'D',
  values: { gold?: number; hp?: number; insight?: number; insightGain?: number }
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const template = EVENT_VALUE_TEMPLATES[`${optionType}_LEVERAGE` as keyof typeof EVENT_VALUE_TEMPLATES] 
    || EVENT_VALUE_TEMPLATES[`${optionType}_FIXED` as keyof typeof EVENT_VALUE_TEMPLATES]
    || EVENT_VALUE_TEMPLATES[`${optionType}_INCOME` as keyof typeof EVENT_VALUE_TEMPLATES]
    || EVENT_VALUE_TEMPLATES[`${optionType}_TRUTH` as keyof typeof EVENT_VALUE_TEMPLATES];

  if (!template) {
    return { valid: false, warnings: [`Unknown option type: ${optionType}`] };
  }

  // 检查数值是否偏离标准（允许±20%浮动）
  if (values.gold !== undefined && template.gold !== undefined) {
    const deviation = Math.abs(values.gold - template.gold) / Math.abs(template.gold);
    if (deviation > 0.2) {
      warnings.push(`Gold value ${values.gold} deviates ${(deviation * 100).toFixed(0)}% from standard ${template.gold}`);
    }
  }

  if (values.hp !== undefined && template.hp !== undefined) {
    const deviation = Math.abs(values.hp - template.hp) / Math.abs(template.hp);
    if (deviation > 0.2) {
      warnings.push(`HP value ${values.hp} deviates ${(deviation * 100).toFixed(0)}% from standard ${template.hp}`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}
