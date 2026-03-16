/**
 * Vitality Slice - 统一导出
 * 
 * 重构后的 vitality slice，将功能拆分为多个子模块
 */

// 类型定义
export type { ClassChangeInfo, VitalitySlice } from './types';

// 工具函数
export { 
  generateId, 
  limitArrayLength, 
  MAX_LEDGER_HISTORY, 
  GOLD_MAX,
  sanitizeValue,
  processingTriggers 
} from './utils';

// 交易模块
export type { TransactionResult } from './transaction';
export { addTransaction, clearWeeklyLedger } from './transaction';
