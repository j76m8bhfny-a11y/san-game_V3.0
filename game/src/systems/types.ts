import { GameState } from '@/types/schema';

// 上下文：系统运行时能获取到的环境信息
// 包含了当前最新的游戏状态 (state)
// 未来可以在这里扩展 helpers (如随机数生成器、配置读取器等)
export interface SystemContext {
  state: GameState;
}

// 系统处理结果
// 包含状态更新、日志记录和通知
export interface SystemResult {
  updates: Partial<GameState>;
  logs: string[];
  notes: string[];
}

// 核心系统接口
export interface GameSystem {
  id: string; // 系统唯一标识，如 "HOUSING", "JOB"
  
  // 1. 每日开始前 (可选)
  // 用于重置每日变量，如 "hasWorkedToday = false"
  onDayStart?: (ctx: SystemContext) => Partial<GameState>;
  
  // 2. 每日结算核心 (核心逻辑)
  // 返回所有的变化，而不是直接修改 state
  processDay?: (ctx: SystemContext) => SystemResult;

  // 3. 每日结束后 (可选)
  // 用于触发后续检查，如死亡判定、成就解锁
  onDayEnd?: (ctx: SystemContext) => void;
}