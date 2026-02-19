import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';
import type { VitalityMetrics, Insurance, Housing } from '@/types/schema';

// 导入数据 - 使用统一配置加载器
import { Config } from '@/config';

export const BillSystem: GameSystem = {
  id: 'BILL',

  processTurn: ({ state }: SystemContext) => {
    const logs: string[] = [];
    const notes: string[] = [];
    const newTransactions: any[] = []; 

    const { metrics, identity } = state.vitality;
    // ✅ 获取所有保险（用于触发条件检查）和医疗保险（用于账单减免）
    const allInsurances = state.vitality.activeInsurances || [];
    const medicalInsurance = allInsurances.find((ins: Insurance) => ins.type === 'MEDICAL') || null;
    
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

    // 检查假证风险（如果玩家有车和假证，增加识破概率）
    const hasFakeLicense = state.inventory.includes('LICENSE_FAKE');
    const hasValidLicense = state.inventory.includes('LICENSE_VALID') || state.inventory.includes('LICENSE_ELITE');
    const hasVehicle = state.inventory.some((id: string) => id.startsWith('CAR_') || id === 'KEY_CAR');
    
    // 如果有车、有假证、没有真证，30%概率触发假证被识破
    let forcedBill = null;
    if (hasVehicle && hasFakeLicense && !hasValidLicense) {
      const detectChance = (Config.licenses as any[])?.find((l: any) => l.id === 'LICENSE_FAKE')?.policeCheck?.detectChance || 0.3;
      if (Math.random() < detectChance) {
        forcedBill = (Config.bills as any[]).find((b: any) => b.id === 'B_POLICE_FAKE_LICENSE') || null;
      }
    }

    const bill = forcedBill || triggerBill(
      metrics.gold,
      metrics.san,
      identity.currentClass,
      Config.bills as any,
      Config.global.billConfig,
      {
        housing: housingConfig,
        vehicleTags,
        inventory: state.inventory,
        insurance: allInsurances,
        activeLoans: state.bank?.activeLoans?.map(loan => ({
          productId: loan.productId,
          overdueTurns: loan.overdueTurns
        }))
      }
    );

    if (!bill) {
      return { updates: {}, logs, notes, newTransactions };
    }

    // 计算减免 (现在传入正确的 housingConfig)
    // 防御性检查：确保 housingConfig 存在
    const mitigation = calculateBillMitigation(bill, housingConfig || null, medicalInsurance);
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
    
    // 处理特殊账单效果
    if (bill.id === 'B_CAR_REPO') {
      // 车辆被拖走：从inventory中移除车辆
      const vehicleToRemove = state.inventory.find((id: string) => id.startsWith('CAR_') || id === 'KEY_CAR');
      if (vehicleToRemove) {
        result.updates.inventory = state.inventory.filter((id: string) => id !== vehicleToRemove);
        notes.push(`车辆 ${vehicleToRemove} 已被拖走`);
      }
    }

    return result;
  }
};