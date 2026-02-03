import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';
import { VitalityState, GameState } from '@/types/schema';

// 导入数据
import billsData from '@/assets/data/bills.json';
import globalData from '@/assets/data/global.json';
import itemsData from '@/assets/data/items.json';

export const BillSystem: GameSystem = {
  id: 'BILL',

  // 1. 修正方法名为 processTurn
  processTurn: ({ state }: SystemContext) => {
    // 初始化结果，支持新的嵌套更新结构
    const result: SystemResult = { 
      updates: {
        vitality: {} // 用于存放数值更新
      }, 
      logs: [], 
      notes: [] 
    };

    // 快捷访问路径
    const { metrics, identity } = state.vitality;

    // 2. 准备数据：收集玩家的载具 Tag (Inventory 依然在根层级)
    const vehicleTags = (state.inventory || [])
      .map((id) => (itemsData as any[]).find(i => i.id === id)?.tags || [])
      .flat()
      .filter((t) => t.startsWith('VEHICLE'));

    // 3. 核心逻辑：触发账单 (修正访问路径)
    const bill = triggerBill(
      metrics.gold, 
      metrics.san, 
      identity.currentClass, 
      billsData as any, 
      globalData.billConfig,
      { 
        // 这里的逻辑函数可能需要完整的 Housing 定义，暂时用 as any 适配
        housing: state.activeHousing as any, 
        vehicleTags 
      }
    );

    if (!bill) return result;

    // 4. 核心逻辑：计算减免
    const mitigation = calculateBillMitigation(bill, state.activeHousing as any, state.activeInsurance);
    const finalAmount = mitigation.finalAmount;

    // 5. 应用结果：通过 vitality.metrics 更新
    // 注意：SystemRegistry 会自动处理金钱累加，这里只需提供 metrics 的 Partial
    result.updates = {
      ...result.updates,
      activeBill: bill, // 账单对象仍在根状态用于 UI 显示
      vitality: {
        metrics: {
          // 这里可以只传增量，SystemRegistry 的 mergeVitality 会处理
          gold: metrics.gold + finalAmount, 
          hp: metrics.hp + (bill.effects?.hp || 0),
          san: metrics.san + (bill.effects?.san || 0),
        }
      }
    };

    // 6. 记录文本
    if (mitigation.mitigated) {
      result.notes.push(`${mitigation.reason}: 减免至 ${finalAmount}`);
    }
    result.logs.push(`收到账单: ${bill.name} (${finalAmount} Gold)`);

    return result;
  }
};