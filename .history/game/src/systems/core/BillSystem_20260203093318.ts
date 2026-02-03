import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';
// 1. 修正导入：添加 VitalityMetrics 导入，并改用 import type
import type { GameState, VitalityMetrics } from '@/types/schema';

// 导入数据
import billsData from '@/assets/data/bills.json';
import globalData from '@/assets/data/global.json';
import itemsData from '@/assets/data/items.json';

export const BillSystem: GameSystem = {
  id: 'BILL',

  processTurn: ({ state }: SystemContext) => {
    // 2. 初始化的 updates 必须明确符合 SystemResult['updates'] 类型
    // 或者直接不写初始值，在返回时一次性构建
    const logs: string[] = [];
    const notes: string[] = [];

    // 快捷访问路径
    const { metrics, identity } = state.vitality;

    // 准备数据
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

    // 如果没账单，返回空更新
    if (!bill) {
      return { updates: {}, logs, notes };
    }

    // 核心逻辑：计算减免
    const mitigation = calculateBillMitigation(bill, state.activeHousing as any, state.activeInsurance);
    const finalAmount = mitigation.finalAmount;

    // 3. 构建最终结果
    if (mitigation.mitigated) {
      notes.push(`${mitigation.reason}: 减免至 ${finalAmount}`);
    }
    logs.push(`收到账单: ${bill.name} (${finalAmount} Gold)`);

    // 重点：使用 const 断言或显式定义 result 确保 vitality 下的属性被视为可选更新
    const result: SystemResult = {
      updates: {
        activeBill: bill,
        vitality: {
          metrics: {
            gold: metrics.gold + finalAmount,
            hp: metrics.hp + (bill.effects?.hp || 0),
            san: metrics.san + (bill.effects?.san || 0),
          } as Partial<VitalityMetrics> // 这里必须有导出才能引用
        } as any // 这里由于 schema.ts 中 vitality 类型的特殊合并，暂时需要 as any 避开全量检查
      },
      logs,
      notes
    };

    return result;
  }
};