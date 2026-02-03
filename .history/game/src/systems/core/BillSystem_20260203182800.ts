import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';
import type { VitalityMetrics, ActiveInsuranceState } from '@/types/schema'; // ✅ 引入正确类型

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

    const { metrics, identity } = state.vitality;
    // ✅ 类型断言确保 activeInsurance 是运行时状态
    const activeInsurance = state.activeInsurance as ActiveInsuranceState | null;
    const activeHousing = state.activeHousing;

    // =================================================================
    // 🛡️ 核心修复: 自动扣除保险费
    // =================================================================
    // ⚠️ 修正: 运行时属性是 premium，不是 weeklyCost
    if (activeInsurance && activeInsurance.premium > 0) {
        newTransactions.push({
            id: Math.random().toString(36).substring(2, 9),
            turn: state.vitality.time.currentTurn,
            category: 'MEDICAL', 
            amount: -activeInsurance.premium, // ✅ 使用 premium
            description: `保险续费: ${activeInsurance.name}`,
            timestamp: Date.now()
        });
        
        logs.push(`自动扣除保险费: $${activeInsurance.premium}`);
    }

    // =================================================================
    // ⚡️ 随机账单触发
    // =================================================================

    const vehicleTags = (state.inventory || [])
      .map((id: string) => (itemsData as any[]).find(i => i.id === id)?.tags || [])
      .flat()
      .filter((t: string) => t.startsWith('VEHICLE'));

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

    if (!bill) {
      return { updates: {}, logs, notes, newTransactions };
    }

    const mitigation = calculateBillMitigation(bill, activeHousing as any, activeInsurance);
    const finalAmount = mitigation.finalAmount;

    if (mitigation.mitigated) {
      notes.push(`${mitigation.reason}: 减免至 ${finalAmount}`);
    }
    logs.push(`收到账单: ${bill.name} (${finalAmount} Gold)`);

    newTransactions.push({
      id: Math.random().toString(36).substring(2, 9),
      turn: state.vitality.time.currentTurn,
      category: 'BILL',
      amount: finalAmount, 
      description: `账单: ${bill.name}`,
      timestamp: Date.now()
    });

    const result: SystemResult = {
      updates: {
        activeBill: bill,
        vitality: {
          metrics: {
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