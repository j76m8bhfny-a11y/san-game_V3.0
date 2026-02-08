import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';
import type { VitalityMetrics, ActiveInsuranceState, Housing } from '@/types/schema';

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
      .map((id: string) => (Config.items as unknown as Array<{id: string; tags: string[]}>).find(i => i.id === id)?.tags || [])
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

    // ✅ 修复变量顺序：先构建 result，再引用
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
      newTransactions: [], // 先空数组，后面再添加
      logs,
      notes
    };
    
    // ✅ 获取前置系统可能已更新的 HP/SAN 最新值
    const currentHp = (result.updates?.vitality?.metrics?.hp as number) ?? metrics.hp;
    const currentSan = (result.updates?.vitality?.metrics?.san as number) ?? metrics.san;
    
    // 更新 HP/SAN（累加模式）
    result.updates.vitality = {
      metrics: {
        hp: currentHp + (bill.effects?.hp || 0),
        san: currentSan + (bill.effects?.san || 0),
      } as Partial<VitalityMetrics>
    } as any;
    
    // ✅ 修复：奖励账单（正数金额）使用 INCOME 分类，扣款账单使用 BILL 分类
    const isReward = finalAmount > 0;
    newTransactions.push({
      id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
      turn: state.vitality.time.currentTurn,
      category: isReward ? 'INCOME' : 'BILL',
      amount: finalAmount,
      description: isReward ? `奖励: ${bill.name}` : `账单: ${bill.name}`,
      timestamp: Date.now()
    });
    
    result.newTransactions = newTransactions;

    return result;
  }
};