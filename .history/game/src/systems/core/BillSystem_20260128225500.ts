import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';

// 需要把 bills.json 和 global.json 传进来，或者在这里 import
import billsData from '@/assets/data/bills.json';
import globalData from '@/assets/data/global.json';
import itemsData from '@/assets/data/items.json'; // 用于查找载具 Tag

export const BillSystem: GameSystem = {
  id: 'BILL',

  processDay: ({ state }: SystemContext) => {
    const result: SystemResult = { updates: {}, logs: [], notes: [] };

    // 1. 准备数据：收集玩家的载具 Tag
    const vehicleTags = (state.inventory || [])
      .map((id) => itemsData.find(i => i.id === id)?.tags || [])
      .flat()
      .filter((t) => t.startsWith('VEHICLE'));

    // 2. 核心逻辑：触发账单
    const bill = triggerBill(
      state.gold, 
      state.san, 
      state.currentClass, 
      billsData as any, 
      globalData.billConfig,
      { housing: state.activeHousing, vehicleTags }
    );

    if (!bill) return result;

    // 3. 核心逻辑：计算减免
    const mitigation = calculateBillMitigation(bill, state.activeHousing, state.activeInsurance);
    const finalAmount = mitigation.finalAmount;

    // 4. 应用结果
    result.updates.gold = state.gold + finalAmount; // 扣钱（通常 finalAmount 是负数）
    result.updates.activeBill = bill; // 存入 State 以便 UI 显示

    // 5. 记录文本
    if (mitigation.mitigated) {
      result.notes.push(`${mitigation.reason}: 账单减免至 ${Math.abs(finalAmount)}`);
    } else {
      result.notes.push(`新增账单: ${bill.name} (${finalAmount})`);
    }

    // 6. 账单的额外伤害 (副作用)
    if (bill.effects?.hp) {
      result.updates.hp = (state.hp) + bill.effects.hp;
      result.logs.push(`账单伤害: HP${bill.effects.hp}`);
    }

    return result;
  }
};