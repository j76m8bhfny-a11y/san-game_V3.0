/**
 * Vitality Slice - 交易/账本模块
 */

import { LedgerCategory } from '@/types/schema';
import { StoreState } from '@/types/store';
import { generateId, limitArrayLength, MAX_LEDGER_HISTORY } from './utils';

export interface TransactionResult {
  success: boolean;
  actualAmount: number;
}

/**
 * 添加交易记录
 */
export function addTransaction(
  get: () => StoreState,
  set: (fn: (state: StoreState) => Partial<StoreState>) => void,
  category: LedgerCategory,
  amount: number,
  description: string
): TransactionResult {
  // 同步获取当前状态，避免竞态条件
  const currentState = get();
  const currentGold = currentState.vitality.metrics.gold;
  const newGold = currentGold + amount;
  
  // 预先检查，避免负数金钱
  if (newGold < 0) {
    if (currentState.addNotification) {
      currentState.addNotification(`资金不足！需要 $${Math.abs(amount)}，当前 $${currentGold}`, 'error');
    }
    return { success: false, actualAmount: 0 };
  }
  
  let success = true;
  let actualAmount = amount;
  
  set((state: StoreState) => {
    // 双重检查，确保状态一致性
    const checkGold = state.vitality.metrics.gold;
    if (checkGold + amount < 0) {
      success = false;
      actualAmount = 0;
      if (state.addNotification) {
        state.addNotification(`资金不足！需要 $${Math.abs(amount)}，当前 $${checkGold}`, 'error');
      }
      return {}; 
    }
    
    const newRecord = {
      id: generateId(),
      turn: state.vitality.time.currentTurn,
      category,
      amount,
      description,
      timestamp: Date.now()
    };
    
    return {
      vitality: {
        ...state.vitality,
        metrics: { ...state.vitality.metrics, gold: newGold },
        ledger: { 
          history: limitArrayLength(
            [...state.vitality.ledger.history, newRecord], 
            MAX_LEDGER_HISTORY
          ) 
        }
      }
    };
  });
  
  return { success, actualAmount };
}

/**
 * 清空周账本
 */
export function clearWeeklyLedger(
  set: (fn: (state: StoreState) => Partial<StoreState>) => void
): void {
  set((state: StoreState) => ({
    vitality: {
      ...state.vitality,
      ledger: { history: [] }
    }
  }));
}
