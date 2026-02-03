import { GameState, VitalityState, LedgerRecord } from '@/types/schema';

export interface SystemContext {
  state: GameState;
  // 可以传入一些辅助函数，如果需要的话
}

export interface SystemResult {
  updates: Partial<GameState> & {
    // 允许 vitality 内部的属性也是可选的
    vitality?: {
      metrics?: Partial<VitalityMetrics>;
      identity?: Partial<VitalityIdentity>;
      flags?: Record<string, any>;
    };
  };
  newTransactions?: any[]; // 根据你的 LedgerRecord 定义
  logs: string[];
  notes: string[];
}

export interface GameSystem {
  id: string;
  // 改名为 processTurn，明确是回合结算
  processTurn?: (context: SystemContext) => SystemResult;
}