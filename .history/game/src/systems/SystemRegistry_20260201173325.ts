import { GameSystem, SystemContext, SystemResult } from './types';
import { GameState, LedgerRecord, VitalityState } from '@/types/schema';

// 导入需要自动结算的系统
import { HousingSystem } from './core/HousingSystem';
// import { BankSystem } from './core/BankSystem'; 

const activeSystems: GameSystem[] = [
  HousingSystem,
  // BankSystem,
];

// 辅助：深度合并 Vitality
const mergeVitality = (current: VitalityState, updates: any): VitalityState => {
  if (!updates) return current;
  return {
    ...current,
    ...updates,
    metrics: { ...current.metrics, ...(updates.metrics || {}) },
    identity: { ...current.identity, ...(updates.identity || {}) },
    flags: { ...current.flags, ...(updates.flags || {}) },
    // 注意：ledger 和 time 通常由 registry 显式处理，不依赖自动合并
  };
};

// 辅助：生成周报数据
export interface WeeklyReport {
  turn: number;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  records: LedgerRecord[]; // 所有的明细
  summaryByCategory: Record<string, number>;
}

// ✅ 核心循环：执行回合结算
export const runTurnSettlement = (currentState: GameState) => {
  let accumulatedUpdates: any = {};
  const logs: string[] = [];
  const notes: string[] = [];
  
  // 1. 获取本周已有的玩家操作账单 (比如手动买药、看病)
  let currentLedger = [...currentState.vitality.ledger.history];
  
  // 2. 也是临时状态，用于传递给各系统
  let tempState = JSON.parse(JSON.stringify(currentState));

  // --- 执行各系统 (处理房租、工资等自动事件) ---
  for (const system of activeSystems) {
    if (system.processTurn) {
      const result = system.processTurn({ state: tempState });

      // A. 收集普通状态更新 (activeJob, flags 等)
      const { vitality: vitUpdates, ...otherUpdates } = result.updates as any;
      accumulatedUpdates = { ...accumulatedUpdates, ...otherUpdates };
      tempState = { ...tempState, ...otherUpdates }; // 更新临时状态给下一个系统用

      // B. 收集 Vitality 更新
      if (vitUpdates) {
        tempState.vitality = mergeVitality(tempState.vitality, vitUpdates);
        accumulatedUpdates.vitality = tempState.vitality;
      }
      
      // C. ✅ 关键：收集系统产生的自动账单 (如房租)
      if (result.newTransactions && result.newTransactions.length > 0) {
        currentLedger = [...currentLedger, ...result.newTransactions];
        // 确保金钱也同步扣除了 (如果系统没在 vitUpdates 里扣钱的话)
        // 通常建议系统只返回 transaction，由 Registry 统一扣钱？
        // 或者系统既返回 updates.gold，也返回 transaction 记录。
        // 这里假设系统已经处理了 updates.vitality.metrics.gold
      }

      if (result.logs) logs.push(...result.logs);
      if (result.notes) notes.push(...result.notes);
    }
  }

  // --- 结算收尾 ---

  // 3. 将最终的 Ledger 写入状态 (为了展示)
  if (!accumulatedUpdates.vitality) accumulatedUpdates.vitality = tempState.vitality;
  accumulatedUpdates.vitality.ledger = { history: currentLedger };

  // 4. 生成周报 (供前端弹窗使用)
  const report: WeeklyReport = {
    turn: currentState.vitality.time.currentTurn,
    records: currentLedger,
    totalIncome: currentLedger.filter(r => r.amount > 0).reduce((a, b) => a + b.amount, 0),
    totalExpense: currentLedger.filter(r => r.amount < 0).reduce((a, b) => a + b.amount, 0),
    netChange: 0, // 计算净值
    summaryByCategory: {}
  };
  report.netChange = report.totalIncome + report.totalExpense;
  
  currentLedger.forEach(r => {
    if (!report.summaryByCategory[r.category]) report.summaryByCategory[r.category] = 0;
    report.summaryByCategory[r.category] += r.amount;
  });

  return {
    updates: accumulatedUpdates,
    report,
    logs,
    notes
  };
};