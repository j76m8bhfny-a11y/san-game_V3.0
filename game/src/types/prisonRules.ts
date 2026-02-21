/**
 * 监狱规则配置类型定义
 */

export interface PrisonRules {
  settings: PrisonSettings;
  bail: BailConfig;
  dailyRoutine: DailyRoutineConfig;
  messages?: PrisonMessages;
}

export interface PrisonSettings {
  systemPriority: number;
  blockedSystems: string[];
  blockMovement: boolean;
}

export interface BailConfig {
  enableCashBail: boolean;
  enableBond: boolean;
  bondDownPaymentRate: number;
  linkedLoanProductId: string;
}

export interface DailyRoutineConfig {
  default: DailyEffect;
  classOverrides: Record<string, DailyEffect | 'default'>;
}

export interface DailyEffect {
  hpChange: number;
  insightChange: number;
  log: string;
}

export interface PrisonMessages {
  // 错误消息
  invalidSentence: string;
  invalidBailAmount: string;
  invalidDownPayment: string;
  invalidRate: string;
  missingLoanProductId: string;
  stateError: string;
  
  // 成功消息
  cashBailSuccess: string;
  bondSuccess: string;
  released: string;
  
  // 失败消息
  insufficientFunds: string;
  insufficientFundsForBail: string;
  insufficientFundsForDownPayment: string;
  loanRejected: string;
  transactionFailed: string;
  downPaymentTransactionFailed: string;
  
  // 坐牢消息
  servingTime: string;
}

/**
 * 类型守卫：检查对象是否为 DailyEffect
 */
export function isDailyEffect(obj: unknown): obj is DailyEffect {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj) &&
    'hpChange' in obj &&
    'insightChange' in obj &&
    'log' in obj &&
    typeof (obj as DailyEffect).hpChange === 'number' &&
    typeof (obj as DailyEffect).insightChange === 'number' &&
    typeof (obj as DailyEffect).log === 'string'
  );
}
