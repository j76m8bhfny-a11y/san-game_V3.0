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
// 2. 什一税机制
// ==========================================

export interface TitheMechanic {
  enabled: boolean;
  targetFaithId: string;
  rate: number;
  minAmount: number;
  description: string;
}

export interface FaithMechanics {
  tithe: TitheMechanic;
}

// ==========================================
// 3. Debuff 效果类型
// ==========================================

export interface DebuffEffect {
  incomeMultiplier?: number;
  hpDrain?: number;
  sanDrain?: number;
  goldDrain?: number;
  [key: string]: number | boolean | string;
}

export interface DebuffConfig {
  id: string;
  name: string;
  duration: number;
  effect: DebuffEffect;
  description?: string;
}

// ==========================================
// 4. 退出惩罚配置
// ==========================================

export interface LeavePenalty {
  sanChange?: number;
  maxHpChange?: number;
  permanentBan?: boolean;
  description?: string;
  confirmMessage?: string;
  debuff?: DebuffConfig;
}

export type LeavePenalties = Record<string, LeavePenalty>;

// ==========================================
// 5. 文本配置
// ==========================================

export interface FaithText {
  joinSuccess: string;
  leaveSuccess: string;
  leaveConfirmTitle: string;
  riteDone: string;
  noFaith: string;
  insufficientGold: string;
}

// ==========================================
// 6. 完整规则对象
// ==========================================

export interface FaithRules {
  defaults: FaithDefaults;
  constraints: FaithConstraints;
  mechanics: FaithMechanics;
  leavePenalties: LeavePenalties;
  text: FaithText;
}
