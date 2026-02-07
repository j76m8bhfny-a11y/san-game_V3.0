import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';
import type { VitalityMetrics, ActiveInsuranceState, Housing, ActiveHousingState } from '@/types/schema';

// 导入数据 - 使用统一配置加载器
import { Config } from '@/config';

export const BillSystem: GameSystem = {
  id: 'BILL',

  processTurn: ({ state }: SystemContext) => {
    const logs: string[] = [];
    const notes: string[] = [];
    const newTransactions: any[] = []; 

    const { metrics, identity } = state.vitality;
    const activeInsurance = state.activeInsurance as ActiveInsuranceState | null;
    
    // ✅ 修复: 解析房产配置 (单一房产)
    const currentHousing = state.activeHousing;
    const housingConfig = currentHousing
      ? (Config.housing as unknown as Housing[]).find(h => h.id === currentHousing.definitionId) || null
      : null;

    // =================================================================
    // ⚡️ 随机账单触发
    // =================================================================

    const vehicleTags = (state.inventory || [])
      .map((id: string) => (Config.items as any[]).find(i => i.id === id)?.tags || [])
      .flat()
      .filter((t: string) => t.startsWith('VEHICLE'));

    const bill = triggerBill(
      metrics.gold,
      metrics.san,
      identity.currentClass,
      Config.bills as any,
      Config.global.billConfig,
      {
        housing: housingConfig, // ✅ 传入解析后的配置对象
        vehicleTags
      }
    );

    if (!bill) {
      return { updates: {}, logs, notes, newTransactions };
    }

    // 计算减免 (现在传入正确的 housingConfig)
    // 防御性检查：确保 housingConfig 存在
    const mitigation = calculateBillMitigation(bill, housingConfig || null, activeInsurance);
    const finalAmount = mitigation.finalAmount;

    if (mitigation.mitigated) {
      notes.push(`${mitigation.reason}: 减免至 ${finalAmount}`);
    }
    logs.push(`收到账单: ${bill.name} (${finalAmount} Gold)`);

    newTransactions.push({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
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