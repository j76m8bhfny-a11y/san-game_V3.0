import { 
  GameState, 
  LedgerRecord, 
  VitalityMetrics, 
  VitalityIdentity 
} from '@/types/schema';

/**
 * 系统运行上下文
 */
export interface SystemContext {
  state: GameState;
}

/**
 * 系统结算结果
 */
export interface SystemResult {
  /**
   * 状态更新
   * 支持 GameState 的根属性更新
   * 同时也支持对 vitality 内部指标（metrics/identity/flags）进行局部更新
   */
  updates: Omit<Partial<GameState>, 'vitality'> & {
    vitality?: {
      metrics?: Partial<VitalityMetrics>;
      identity?: Partial<VitalityIdentity>;
      flags?: Record<string, any>;
      time?: { currentTurn?: number; totalTurns?: number };
      activeDiseases?: string[];
      // 允许更新账本历史
      ledger?: { history: LedgerRecord[] }; 
    };
  };
  
  /**
   * 该系统产生的新账单记录（会被自动计入流水并同步金钱）
   */
  newTransactions?: LedgerRecord[];
  
  /**
   * 结算日志（通常用于 UI 滚动显示）
   */
  logs: string[];
  
  /**
   * 补充说明（如：保险减免详情）
   */
  notes: string[];
}

/**
 * 游戏子系统接口定义
 */
export interface GameSystem {
  id: string;
  /**
   * 执行优先级 (数值越高越先执行)
   * 建议：核心生存=100, 金融=90, 工作/收入=80
   */
  priority?: number; 
  
  /**
   * 每周/回合结算逻辑
   */
  processTurn?: (context: SystemContext) => SystemResult;
}