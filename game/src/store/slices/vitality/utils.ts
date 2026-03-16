/**
 * Vitality Slice - 工具函数
 */

// 生成唯一ID
export const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

// 数组长度限制常量
export const MAX_LEDGER_HISTORY = 100;

// 金币上限
export const GOLD_MAX = 999999999;

/**
 * 限制数组长度，保留最新的N条
 */
export function limitArrayLength<T>(arr: T[], maxLength: number): T[] {
  if (arr.length <= maxLength) return arr;
  return arr.slice(arr.length - maxLength);
}

// 防止Buff触发循环的全局跟踪器
export const processingTriggers = new Set<string>();

/**
 * 安全值处理函数
 */
export function sanitizeValue(value: number, defaultValue: number, min?: number, max?: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  let result = value;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  return result;
}
