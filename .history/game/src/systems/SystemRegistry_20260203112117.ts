import { GameSystem, SystemResult } from './types';
import { GameState, LedgerRecord, VitalityState } from '@/types/schema';
import { BankSystem } from './core/BankSystem'; 
import { HousingSystem } from './core/HousingSystem';
import { JobSystem } from './core/JobSystem'; 

// ✅ 修复：不再依赖数组声明顺序，而是显式注入优先级并排序
// Housing (100) -> Bank (90) -> Job (80)
// 确保先扣房租（生存），再算利息（金融），最后发工资（收入），符合严苛的生存逻辑
const activeSystems: GameSystem[] = [
  { ...HousingSystem, priority: 100 },
  { ...BankSystem, priority: 90 },
  { ...JobSystem, priority: 80 }
].sort((a, b) => (b.priority || 0) - (a.priority || 0));

// 辅助：深度合并 Vitality
const mergeVitality = (current: VitalityState, updates: any): VitalityState => {
  if (!updates) return current;
  return {
    ...current,
    ...updates,
    metrics: { ...current.metrics, ...(updates.metrics || {}) },
    identity: { ...current.identity, ...(updates.identity || {}) },
    flags: { ...current.flags, ...(updates.flags || {}) },
  };
};

export interface WeeklyReport {
  turn: number;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  records: LedgerRecord[];
  summaryByCategory: Record<string, number>;
}

export const runTurnSettlement = (currentState: GameState) => {
  let accumulatedUpdates: any = {};
  const logs: string[] = [];
  const notes: string[] = [];
  
  // 1. 获取本周已有的玩家操作账单
  let currentLedger = [...currentState.vitality.ledger.history];
  
  // 2. 临时状态副本 (Snapshot)
  let tempState = JSON.parse(JSON.stringify(currentState));

  // ✨ 新增: 追踪本轮结算产生的金钱变动
  let turnNetGoldChange = 0;

  // --- 执行各系统 (已按 Priority 排序) ---
  for (const system of activeSystems) {
    if (system.processTurn) {
      // 传入最新的临时状态，确保系统间的数据依赖（比如A系统扣了血，B系统能看到）
      const result = system.processTurn({ state: tempState });

      // A. 收集普通状态更新
      const { vitality: vitUpdates, ...otherUpdates } = result.updates as any;
      accumulatedUpdates = { ...accumulatedUpdates, ...otherUpdates };
      tempState = { ...tempState, ...otherUpdates };

      // B. 收集 Vitality 更新
      if (vitUpdates) {
        tempState.vitality = mergeVitality(tempState.vitality, vitUpdates);
        
        // 确保 accumulatedUpdates 也包含合并后的 vitality
        if (!accumulatedUpdates.vitality) {
             accumulatedUpdates.vitality = JSON.parse(JSON.stringify(currentState.vitality));
        }
        accumulatedUpdates.vitality = mergeVitality(accumulatedUpdates.vitality, vitUpdates);
      }
      
      // C. 处理账单并同步扣钱
      if (result.newTransactions && result.newTransactions.length > 0) {
        // 1. 记入账本
        currentLedger = [...currentLedger, ...result.newTransactions];
        
        // 2. 累加金钱变动
        result.newTransactions.forEach(t => {
            turnNetGoldChange += t.amount;
        });
      }

      if (result.logs) logs.push(...result.logs);
      if (result.notes) notes.push(...result.notes);
    }
  }

  // --- 结算收尾 ---

  // 3. 统一应用金钱变动
  if (!accumulatedUpdates.vitality) accumulatedUpdates.vitality = JSON.parse(JSON.stringify(currentState.vitality));
  
  const currentGold = accumulatedUpdates.vitality.metrics.gold ?? currentState.vitality.metrics.gold;
  accumulatedUpdates.vitality.metrics.gold = currentGold + turnNetGoldChange;

  // 4. 将最终的 Ledger 写入状态
  accumulatedUpdates.vitality.ledger = { history: currentLedger };

  // 5. 生成周报
  const report: WeeklyReport = {
    turn: currentState.vitality.time.currentTurn,
    records: currentLedger,
    totalIncome: currentLedger.filter(r => r.amount > 0).reduce((a, b) => a + b.amount, 0),
    totalExpense: currentLedger.filter(r => r.amount < 0).reduce((a, b) => a + b.amount, 0),
    netChange: 0,
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