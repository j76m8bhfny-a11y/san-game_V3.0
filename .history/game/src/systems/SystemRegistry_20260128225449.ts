import { GameSystem, SystemContext, SystemResult } from './types';
import { GameState } from '@/types/schema';

// --- 导入具体的子系统 ---
import { HousingSystem } from '../store/systems/core/HousingSystem';
// import { JobSystem } from './core/JobSystem'; // 待实现
// import { BankSystem } from './core/BankSystem'; // 待实现
// import { StatRuleSystem } from './core/StatRuleSystem'; // 待实现

// --- 注册表：决定系统的执行顺序 ---
// 顺序很重要，例如先扣房租(Housing)，剩下的钱才用来算是否饿死(StatRules)
const activeSystems: GameSystem[] = [
  HousingSystem,
  // JobSystem,
  // BankSystem, 
  // StatRuleSystem, 
];

// --- 核心调度函数 ---
export const runDailySystems = (initialContext: SystemContext) => {
  let accumulatedUpdates: Partial<GameState> = {};
  const allLogs: string[] = [];
  const allNotes: string[] = [];

  // 我们维护一个不断更新的“临时状态”，
  // 这样 HousingSystem 扣完钱后，下一个系统看到的就是扣钱后的余额。
  let currentState = { ...initialContext.state };

  for (const system of activeSystems) {
    if (system.processDay) {
      // 构造当前系统的上下文
      const context: SystemContext = {
        state: currentState
      };

      // 执行系统逻辑
      const result: SystemResult = system.processDay(context);

      // 1. 收集更新
      accumulatedUpdates = { ...accumulatedUpdates, ...result.updates };
      
      // 2. 收集日志
      if (result.logs.length > 0) allLogs.push(...result.logs);
      if (result.notes.length > 0) allNotes.push(...result.notes);

      // 3. 立即应用更新到临时状态，以便下一个系统使用最新数据
      currentState = { ...currentState, ...result.updates } as GameState;
    }
  }

  // 返回最终汇总的所有变更
  return { 
    updates: accumulatedUpdates, 
    logs: allLogs, 
    notes: allNotes 
  };
};