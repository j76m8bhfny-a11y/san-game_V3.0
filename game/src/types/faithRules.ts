/**
 * 信仰规则类型定义
 * 对应 faithRules.json 的完整结构
 */

// ==========================================
// 1. 基础类型
// ==========================================

export interface FaithDefaults {
  initialLevel: number;
  dailyReset: boolean;
  transactionCategories: {
    actionCost?: string;
    actionReward?: string;
    noviceIncome?: string;
    noviceCost?: string;
    join: string;
    riteCost: string;
    riteIncome: string;
  };
}

export interface FaithConstraints {
  forbiddenItemIds: string[];
  checkCleanInventoryMessage: string;
}

// ==========================================
// 2. 新手行为机制
// ==========================================

export interface RegionFlavor {
  label: string;
  description: string;
}

export interface NoviceMechanic {
  id: string;
  targetFaithId: string;
  unlockStreak: number;
  requiredItemId?: string;
  cost: {
    gold?: number;
    hp?: number;
    insight?: number;  // 灵视值消耗
  };
  reward: {
    gold?: number;
    hp?: number;
    insight?: number;  // 灵视值奖励
    points?: {
      red?: number;
      wolf?: number;
      old?: number;
    };
  };
  regionFlavor: {
    SLUMS?: RegionFlavor;
    RUST_BELT?: RegionFlavor;
    SUBURBS?: RegionFlavor;
    DOWNTOWN?: RegionFlavor;
    DEFAULT: RegionFlavor;
  };
  successMessage?: string;
}

export interface NoviceMechanics {
  DEDICATE: NoviceMechanic;
  AID: NoviceMechanic;
  SACRIFICE: NoviceMechanic;
  REJECT: NoviceMechanic;
}

// ==========================================
// 3. 什一税机制
// ==========================================

export interface TitheMechanic {
  enabled: boolean;
  targetFaithId: string;
  rate: number;
  minAmount: number;
  description: string;
}

export interface FaithMechanics {
  tithe?: TitheMechanic;
}

// ==========================================
// 4. Debuff 效果类型
// ==========================================

// DebuffEffect 必须与 FaithDebuffEffect 兼容
// 使用相同的类型结构：可选属性 + Record 索引签名
export type DebuffEffect = {
  incomeMultiplier?: number;
  hpDrain?: number;
  insightDrain?: number;  // 灵视值流失（Debuff效果）
  goldDrain?: number;
} & Record<string, number | boolean | string>;

export interface DebuffConfig {
  id: string;
  name: string;
  duration: number;
  effect: DebuffEffect;
  description?: string;
}

// ==========================================
// 5. 退出惩罚配置
// ==========================================

export interface LeavePenalty {
  insightChange?: number;
  maxHpChange?: number;
  permanentBan?: boolean;
  description?: string;
  confirmMessage?: string;
  debuff?: DebuffConfig;
}

export type LeavePenalties = Record<string, LeavePenalty>;

// ==========================================
// 6. 文本配置
// ==========================================

export interface FaithText {
  joinSuccess?: string;
  leaveSuccess?: string;
  leaveConfirmTitle?: string;
  riteDone?: string;
  noFaith?: string;
  insufficientGold?: string;
  insufficientResource?: string;
  streakBroken?: string;
  streakProgress?: string;
  unlockTitle?: string;
  unlockMessage?: string;
  resourceInsufficient?: string;
  itemMissing?: string;
  unlockPrompt?: string;
}

// ==========================================
// 7. 完整规则对象
// ==========================================

export interface FaithRules {
  defaults: FaithDefaults;
  constraints: FaithConstraints;
  noviceMechanics: NoviceMechanics;
  mechanics?: FaithMechanics;
  leavePenalties: LeavePenalties;
  text: FaithText;
}
