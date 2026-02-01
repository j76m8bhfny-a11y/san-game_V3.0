import { GameState, VitalityState, LedgerRecord } from '@/types/schema';

export interface SystemContext {
  state: GameState;
  // 可以传入一些辅助函数，如果需要的话
}

export interface SystemResult {
  // 必须包含 state 的更新
  updates: Partial<GameState> | { vitality: Partial<VitalityState> };
  
  // 该系统产生的新账单 (用于自动系统，如房租)
  newTransactions?: LedgerRecord[];
  
  logs: string[];
  notes: string[];
}

export interface GameSystem {
  id: string;
  // 改名为 processTurn，明确是回合结算
  processTurn?: (context: SystemContext) => SystemResult;
}