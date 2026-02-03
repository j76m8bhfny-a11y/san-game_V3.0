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
    // 初始化结果对象
    const logs: string[] = [];
    const notes: string[] = [];
    const newTransactions: any[] = []; // ✅ 1. 初始化事务数组

    // 快捷访问路径
    const { metrics, identity } = state.vitality;

    // 准备数据 (车辆标签)
    const vehicleTags = (state.inventory || [])
      .map((id: string) => (itemsData as any[]).find(i => i.id === id)?.tags || [])
      .flat()
      .filter((t: string) => t.startsWith('VEHICLE'));

    // 核心逻辑：触发账单
    const bill = triggerBill(
      metrics.gold, 
      metrics.san, 
      identity.currentClass, 
      billsData as any, 
      globalData.billConfig,
      { 
        housing: state.activeHousing as any, 
        vehicleTags 
      }
    );

    // 如果没账单，直接返回
    if (!bill) {
      return { updates: {}, logs, notes, newTransactions: [] };
    }

    // 核心逻辑：计算减免
    const mitigation = calculateBillMitigation(bill, state.activeHousing as any, state.activeInsurance);
    const finalAmount = mitigation.finalAmount;

    // 构建日志
    if (mitigation.mitigated) {
      notes.push(`${mitigation.reason}: 减免至 ${finalAmount}`);
    }
    logs.push(`收到账单: ${bill.name} (${finalAmount} Gold)`);

    // ✅ 2. 生成金钱变动事务 (修复金钱不扣除的 Bug)
    newTransactions.push({
      id: Math.random().toString(36).substring(2, 9),
      turn: state.vitality.time.currentTurn,
      category: 'BILL',
      amount: finalAmount, // 负数代表扣款
      description: `账单: ${bill.name}`,
      timestamp: Date.now()
    });

    // 3. 构建最终结果
    const result: SystemResult = {
      updates: {
        activeBill: bill,
        vitality: {
          metrics: {
            // ❌ 移除 gold 修改，防止被 SystemRegistry 剥离
            // gold: metrics.gold + finalAmount, 
            
            // 保留 HP/SAN 的直接影响
            hp: metrics.hp + (bill.effects?.hp || 0),
            san: metrics.san + (bill.effects?.san || 0),
          } as Partial<VitalityMetrics>
        } as any 
      },
      newTransactions, // ✅ 提交事务
      logs,
      notes
    };

    return result;
  }
};