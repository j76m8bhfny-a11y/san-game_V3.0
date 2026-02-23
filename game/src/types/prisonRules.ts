/**
 * 监狱规则配置类型定义
 * 版本: 2.0 - 阶级再生产的暴力机器
 */

export interface PrisonRules {
  $schema?: string;
  description?: string;
  version?: string;
  settings: PrisonSettings;
  sentence: SentenceConfig;
  bail: BailConfig;
  penalty: PenaltyConfig;
  dailyRoutine: DailyRoutineConfig;
  prisonMedical?: PrisonMedicalConfig;
  insuranceInPrison?: InsuranceInPrisonConfig;
  messages?: PrisonMessages;
}

export interface PrisonSettings {
  description?: string;
  systemPriority: number;
  blockedSystems: string[];
  blockMovement: boolean;
  allowMedicalInPrison?: boolean;
  allowInsuranceCancellation?: boolean;
}

export interface SentenceConfig {
  description?: string;
  baseTurns: number;
  debtIncrement: number;
  maxTurns: number;
  formula?: string;
}

export interface BailConfig {
  description?: string;
  enableCashBail: boolean;
  enableBond: boolean;
  bondDownPaymentRate: number;
  linkedLoanProductId: string;
  interestRate?: number;
  formula?: string;
}

export interface PenaltyConfig {
  description?: string;
  creditScorePenalty: number;
  addFelonyRecord: boolean;
  felonyRecordDescription?: string;
}

export interface PrisonMedicalConfig {
  description?: string;
  enableBlackMarketMedicine: boolean;
  blackMarketPainkillerCost: number;
  blackMarketPainkillerEffect: {
    hpRestore: number;
    description: string;
  };
  diseaseDamageMultiplier: number;
  cannotAccessHospital: boolean;
}

export interface InsuranceInPrisonConfig {
  description?: string;
  suspendAfterMissedPayments: number;
  suspensionMessage?: string;
}

export interface DailyRoutineConfig {
  description?: string;
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
  releasedWithFelony?: string;
  
  // 失败消息
  insufficientFunds: string;
  insufficientFundsForBail: string;
  insufficientFundsForDownPayment: string;
  loanRejected: string;
  transactionFailed: string;
  downPaymentTransactionFailed: string;
  downPaymentFailed: string;
  
  // 坐牢消息
  serveTimeError: string;
  
  // 新增消息
  blackMarketMedicine?: string;
  insuranceSuspended?: string;
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

/**
 * 计算动态刑期
 * @param totalDebt 总债务
 * @param config 刑期配置
 * @returns 计算后的刑期（周）
 */
export function calculateDynamicSentence(totalDebt: number, config: SentenceConfig): number {
  const additionalTurns = Math.floor(totalDebt / config.debtIncrement);
  return Math.min(config.maxTurns, config.baseTurns + additionalTurns);
}
