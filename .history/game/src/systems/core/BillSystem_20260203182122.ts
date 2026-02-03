import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';
import type { VitalityMetrics } from '@/types/schema';

// 导入数据
import billsData from '@/assets/data/bills.json';
import globalData from '@/assets/data/global.json';
import itemsData from '@/assets/data/items.json';

export const BillSystem: GameSystem = {
  id: 'BILL',

  processTurn: ({ state }: SystemContext) => {
    const logs: string[] = [];
    const notes: string[] = [];
    const newTransactions: any[] = []; 

    // 快捷访问路径
    const { metrics, identity } = state.vitality;
    const { activeInsurance, activeHousing } = state; // ✅ 获取保险状态

    // =================================================================
    // 🛡️ 核心修复 1: 自动扣除保险费 (Recurring Premium)
    // =================================================================
    if (activeInsurance && activeInsurance.weeklyCost > 0) {
        // 检查余额是否足够 (如果不足，通常保险会失效或欠费，这里简化为直接扣成负数或强制扣除)
        // 既然是 System 结算，我们通常允许扣成负数，或者在 log 里提示
        
        newTransactions.push({
            id: Math.random().toString(36).substring(2, 9),
            turn: state.vitality.time.currentTurn,
            category: 'MEDICAL', // 归类为医疗/保险支出
            amount: -activeInsurance.weeklyCost,
            description: `保险续费: ${activeInsurance.name}`,
            timestamp: Date.now()
        });
        
        logs.push(`自动扣除保险费: $${activeInsurance.weeklyCost}`);
    }

    // =================================================================
    // ⚡️ 原有逻辑: 随机账单触发
    // =================================================================

    // 准备数据 (车辆标签)
    const vehicleTags = (state.inventory || [])
      .map((id: string) => (itemsData as any[]).find(i => i.id === id)?.tags || [])
      .flat()
      .filter((t: string) => t.startsWith('VEHICLE'));

    // 触发账单
    const bill = triggerBill(
      metrics.gold, 
      metrics.san, 
      identity.currentClass, 
      billsData as any, 
      globalData.billConfig,
      { 
        housing: activeHousing as any, 
        vehicleTags 
      }
    );

    // 如果没账单，直接返回 (带上保险费的事务)
    if (!bill) {
      return { updates: {}, logs, notes, newTransactions };
    }

    // 计算减免
    const mitigation = calculateBillMitigation(bill, activeHousing as any, activeInsurance);
    const finalAmount = mitigation.finalAmount;

    if (mitigation.mitigated) {
      notes.push(`${mitigation.reason}: 减免至 ${finalAmount}`);
    }
    logs.push(`收到账单: ${bill.name} (${finalAmount} Gold)`);

    // 生成账单事务
    newTransactions.push({
      id: Math.random().toString(36).substring(2, 9),
      turn: state.vitality.time.currentTurn,
      category: 'BILL',
      amount: finalAmount, 
      description: `账单: ${bill.name}`,
      timestamp: Date.now()
    });

    // 构建结果
    const result: SystemResult = {
      updates: {
        activeBill: bill,
        vitality: {
          metrics: {
            // gold 由事务处理
            hp: metrics.hp + (bill.effects?.hp || 0),
            san: metrics.san + (bill.effects?.san || 0),
          } as Partial<VitalityMetrics>
        } as any 
      },
      newTransactions, 
      logs,
      notes
    };

    return result;
  }
};