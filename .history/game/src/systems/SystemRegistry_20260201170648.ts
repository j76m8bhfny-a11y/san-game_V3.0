import { GameSystem, SystemContext, SystemResult } from './types';
import { GameState, VitalityState } from '@/types/schema';

// --- 导入具体的子系统 ---
import { HousingSystem } from './core/HousingSystem';
import { JobSystem } from './core/JobSystem'; 
import { BillSystem } from './core/BillSystem';
import { StatRuleSystem } from './core/StatRuleSystem';
// import { BankSystem } from './core/BankSystem'; // 如果有逻辑需要每日自动运行可加入

// --- 注册表：决定系统的执行顺序 ---
// 顺序非常关键：
// 1. Housing: 先扣房租（可能导致流落街头）
// 2. Job: 再发工资（基于当前的精神状态）
// 3. Bill: 处理突发账单（可能会扣钱或扣血）
// 4. StatRule: 最后结算生存规则（如饥饿、精神崩溃自残）
const activeSystems: GameSystem[] = [
  HousingSystem,
  JobSystem,
  BillSystem,
  StatRuleSystem,
];

/**
 * 辅助函数：深度合并 Vitality 状态
 * 避免 shallow merge 导致 nested object (如 identity, flags) 丢失
 */
const mergeVitality = (current: VitalityState, updates: any): VitalityState => {
  if (!updates) return current;

  return {
    // 1. 合并数值 (metrics)
    metrics: { 
      ...current.metrics, 
      ...(updates.metrics || {}) 
    },
    
    // 2. 合并身份 (identity) - 注意 points 也是嵌套的
    identity: { 
      ...current.identity, 
      ...(updates.identity || {}),
      points: { 
        ...current.identity.points, 
        ...(updates.identity?.points || {}) 
      }
    },
    
    // 3. 合并标记 (flags)
    flags: { 
      ...current.flags, 
      ...(updates.flags || {}) 
    }
  };
};

// --- 核心调度函数 ---
export const runDailySystems = (initialContext: SystemContext) => {
  // 最终要应用到 Store 的更新累积
  // 我们使用 explicit any 是因为 update 可能包含深层嵌套结构，而 Partial<GameState> 主要是浅层的
  let accumulatedUpdates: any = {}; 
  
  const allLogs: string[] = [];
  const allNotes: string[] = [];

  // 维护一个不断更新的“临时状态副本”
  // 这样 HousingSystem 扣完钱后，JobSystem 看到的就是扣钱后的余额
  // 注意：需要深拷贝 vitality 以防修改引用
  let currentState: GameState = {
    ...initialContext.state,
    vitality: JSON.parse(JSON.stringify(initialContext.state.vitality))
  };

  for (const system of activeSystems) {
    if (system.processDay) {
      // 构造当前系统的上下文
      const context: SystemContext = {
        state: currentState
      };

      // 执行系统逻辑
      const result: SystemResult = system.processDay(context);

      // --- 智能合并逻辑 ---

      // 1. 分离更新：将 "vitality更新" 和 "其他更新" 分开处理
      // (result.updates 是子系统返回的差异包)
      const { vitality: vitalityUpdates, ...otherUpdates } = result.updates as any;

      // 2. 应用普通更新 (第一层属性，如 bank, prison, activeJob 等)
      // 这些通常是替换整个对象引用，或者是简单值
      currentState = { ...currentState, ...otherUpdates };
      accumulatedUpdates = { ...accumulatedUpdates, ...otherUpdates };

      // 3. 应用 Vitality 更新 (深度合并)
      if (vitalityUpdates) {
        // 计算新的完整 vitality 对象
        const newVitality = mergeVitality(currentState.vitality, vitalityUpdates);
        
        // 更新临时状态，供下一个系统使用
        currentState.vitality = newVitality;
        
        // 将这个"最新的完整 vitality"放入累积更新中
        // 当 Store 最终应用这个 update 时，会直接替换掉旧的 vitality 对象
        accumulatedUpdates.vitality = newVitality;
      }

      // 4. 收集日志与笔记
      if (result.logs.length > 0) allLogs.push(...result.logs);
      if (result.notes.length > 0) allNotes.push(...result.notes);
    }
  }

  // 返回最终汇总的所有变更
  return { 
    updates: accumulatedUpdates, 
    logs: allLogs, 
    notes: allNotes 
  };
};