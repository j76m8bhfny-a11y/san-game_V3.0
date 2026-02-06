import { GameSystem, SystemResult } from './types';
import { GameState, LedgerRecord, VitalityState } from '@/types/schema';
import { BankSystem } from './core/BankSystem'; 
import { HousingSystem } from './core/HousingSystem';
import { JobSystem } from './core/JobSystem'; 
import { BillSystem } from './core/BillSystem'; // 引入
import { FaithSystem } from './core/FaithSystem';
import { EventSystem } from './core/EventSystem';
import systemRules from '@/assets/data/rules/systemRules.json';
import prisonRules from '@/assets/data/rules/prisonRules.json';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

const { priorities } = systemRules;
const { executionOrder } = SYSTEM_RULES;

// ✅ 按照优先级注册系统
// 核心生存(100) -> 金融(90) -> 工作(80) -> 账单(70)
const activeSystems: GameSystem[] = [
  { ...HousingSystem, priority: executionOrder.housing },
  { ...BankSystem, priority: executionOrder.bank },
  { ...JobSystem, priority: executionOrder.job },
  { ...BillSystem, priority: executionOrder.bill },
  { ...FaithSystem, priority: executionOrder.faith },
  { ...EventSystem, priority: executionOrder.event }
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

  // 追踪本轮结算产生的金钱变动
  let turnNetGoldChange = 0;

  // --- 执行各系统 ---
  for (const system of activeSystems) {
    
    // 🔴 修复漏洞 1：监狱拦截逻辑 (Prison Interception)
    // 如果玩家在坐牢，强制跳过工作系统 (无收入)
    // 但保留 Housing (扣房租) 和 Bank (算利息/房贷)，实现“坐吃山空”的惩罚
    if (currentState.prison.inJail && prisonRules.settings.blockedSystems.includes(system.id)) {
        logs.push(`【狱中】无法访问 ${system.id}，系统已挂起。`);
        continue; 
    }

    if (system.processTurn) {
      // 传入最新的临时状态 (包含前置系统造成的 HP/SAN 变动)
      const result = system.processTurn({ state: tempState });

      // A. 收集 Vitality 更新 (增加安全过滤)
      if (result.updates.vitality) {
        const rawUpdates = result.updates.vitality;
        
        // 创建一个用于合并的 updates 对象，避免直接修改原始引用
        // 并处理 gold 剥离逻辑
        let safeUpdates = rawUpdates;

        // 🔥 核心修复：防御性剥离 gold 字段
        if (rawUpdates.metrics && typeof rawUpdates.metrics.gold !== 'undefined') {
          // 我们只信任 transaction 带来的金钱变动
          const { gold, ...restMetrics } = rawUpdates.metrics;
          
          // 构建一个新的 updates 对象，覆盖 metrics
          safeUpdates = {
            ...rawUpdates,
            metrics: restMetrics as any // 👈 强制断言，允许缺少 gold，因为 mergeVitality 能处理
          };
        }

        // 使用处理后的 safeUpdates 进行合并
        tempState.vitality = mergeVitality(tempState.vitality, safeUpdates);
        
        // 同步到最终更新列表
        if (!accumulatedUpdates.vitality) {
             accumulatedUpdates.vitality = JSON.parse(JSON.stringify(currentState.vitality));
        }
        accumulatedUpdates.vitality = mergeVitality(accumulatedUpdates.vitality, safeUpdates);
      }

      // B. 收集其他状态更新
      const { vitality, ...otherUpdates } = result.updates as any;
      if (Object.keys(otherUpdates).length > 0) {
        accumulatedUpdates = { ...accumulatedUpdates, ...otherUpdates };
        tempState = { ...tempState, ...otherUpdates };
      }
      
      // C. 处理账单并同步扣钱
      if (result.newTransactions && result.newTransactions.length > 0) {
        // 1. 记入账本
        currentLedger = [...currentLedger, ...result.newTransactions];
        
        // 2. 累加金钱变动
        result.newTransactions.forEach(t => {
            turnNetGoldChange += t.amount;
            
            // ✨ 进阶优化：实时更新 tempState 的金钱
            // 这样 Priority 较低的系统 (如 Bank) 就能看到 Priority 较高的系统 (如 Housing) 扣款后的真实余额
            // 避免 "实际上没钱了，但银行系统看到的还是旧余额" 的情况
            if (tempState.vitality && tempState.vitality.metrics) {
                tempState.vitality.metrics.gold = (tempState.vitality.metrics.gold || 0) + t.amount;
            }
        });
      }

      if (result.logs) logs.push(...result.logs);
      if (result.notes) notes.push(...result.notes);
    }
  }

  // --- 结算收尾 ---

  // 3. 统一应用金钱变动 (确保 Gold 不为负)
  if (!accumulatedUpdates.vitality) accumulatedUpdates.vitality = JSON.parse(JSON.stringify(currentState.vitality));
  
  const initialGold = currentState.vitality.metrics.gold;
  let finalGold = initialGold + turnNetGoldChange;
  
  // 🔴 Gold 不能为负数 - 如果为负，回滚部分交易
  if (finalGold < 0) {
    // 优先扣除必要费用(HOUSING, BANK)，其他费用(BILL, MISC)按优先级扣除
    const priorityOrder = ['HOUSING', 'BANK', 'FOOD', 'MEDICAL', 'TAX', 'BILL', 'MISC', 'INCOME'];
    const sortedLedger = [...currentLedger].sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.category);
      const bIdx = priorityOrder.indexOf(b.category);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
    
    // 重新计算，跳过会导致负数的交易
    let runningGold = initialGold;
    const allowedTransactions: typeof currentLedger = [];
    
    for (const record of sortedLedger) {
      const projectedGold = runningGold + record.amount;
      if (projectedGold >= 0) {
        allowedTransactions.push(record);
        runningGold = projectedGold;
      } else if (record.amount > 0) {
        // 收入总是接受
        allowedTransactions.push(record);
        runningGold = projectedGold;
      }
      // 支出会导致负数，跳过
    }
    
    // 如果有被跳过的交易，添加警告
    const skippedCount = currentLedger.length - allowedTransactions.length;
    if (skippedCount > 0) {
      logs.push(`【资金不足】${skippedCount} 笔账单因余额不足未支付`);
      notes.push(`资金告急：部分费用无法支付，请尽快补充资金！`);
    }
    
    // 重新计算变动
    turnNetGoldChange = allowedTransactions.reduce((sum, t) => sum + t.amount, 0);
    finalGold = initialGold + turnNetGoldChange;
    currentLedger = allowedTransactions;
  }
  
  accumulatedUpdates.vitality.metrics.gold = Math.max(0, finalGold);

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