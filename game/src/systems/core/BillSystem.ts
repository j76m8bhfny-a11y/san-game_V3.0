import { GameSystem, SystemResult, SystemContext } from '../types';
import { triggerBill, calculateBillMitigation } from '@/logic/core';
import type { VitalityMetrics, Insurance, Housing } from '@/types/schema';
import { getArchiveCounts } from '@/logic/archiveModifier';

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
      metrics.insight,
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
        })),
        // ✅ 新增：信仰和加密货币状态
        faithId: state.faith?.id || 'NONE',
        hasCryptoAccount: state.crypto?.isAccountOpen || false,
        cryptoPositions: state.crypto?.positions || []
      }
    );

    if (!bill) {
      return { updates: {}, logs, notes, newTransactions };
    }

    // =================================================================
    // 💰 金额计算（绝对剥削 vs 资产税）
    // =================================================================
    
    // 绝对剥削类型：无视阶级系数（固定成本对穷人的致命性）
    const isAbsolute = ['LEGAL', 'VEHICLE'].includes(bill.type);
    
    // 获取阶级系数
    const classMultipliers: Record<string, number> = {
      'HOMELESS': 0.5,
      'WORKER': 1.0,
      'MIDDLE': 1.5,
      'CAPITALIST': 3.0
    };
    const multiplier = isAbsolute ? 1.0 : (classMultipliers[identity.currentClass] || 1.0);
    
    // 应用阶级系数后的基础金额
    const scaledAmount = Math.floor(bill.amount * multiplier);
    
    // 创建临时账单对象用于减免计算（使用缩放后的金额）
    const scaledBill = { ...bill, amount: scaledAmount };

    // =================================================================
    // 🛡️ 减免计算（保险 + 房产防御 + Archive 档案）
    // =================================================================
    
    // 计算 Archive 档案减免
    const archiveCounts = getArchiveCounts(state.unlockedArchives || []);
    let archiveReduction = 0;
    
    // LEGAL 账单：中产档案减免
    if (bill.type === 'LEGAL' && archiveCounts.middle >= 5) {
      archiveReduction += 0.2;
      notes.push(`[档案增益] 中产经验：法务费用减免 20%`);
    }
    
    // VEHICLE 账单：工人档案减免
    if (bill.type === 'VEHICLE' && archiveCounts.worker >= 10) {
      archiveReduction += 0.3;
      notes.push(`[档案增益] 蓝领经验：车辆维修减免 30%`);
    }
    
    // 其他减免（保险、房产）
    const mitigation = calculateBillMitigation(scaledBill, housingConfig || null, medicalInsurance);
    
    // 应用 Archive 减免（在原有减免基础上）
    let finalAmount = mitigation.finalAmount;
    if (archiveReduction > 0 && finalAmount < 0) {
      // 只对扣款账单应用减免，奖励账单不减
      const archiveMultiplier = Math.max(0.1, 1 - archiveReduction); // 最高减免 90%
      finalAmount = Math.floor(finalAmount * archiveMultiplier);
    }

    if (mitigation.mitigated || archiveReduction > 0) {
      notes.push(`${mitigation.reason || '档案减免'}: 减免至 ${finalAmount}`);
    }
    logs.push(`收到账单: ${bill.name} (${finalAmount} Gold)`);

    // =================================================================
    // 📊 构建结果
    // =================================================================
    
    const result: SystemResult = {
      updates: {
        activeBill: bill,
        vitality: {
          metrics: {
            hp: metrics.hp + (bill.effects?.hp || 0),
            insight: metrics.insight + (bill.effects?.insight || 0),
          } as Partial<VitalityMetrics>
        } as any 
      },
      newTransactions: [],
      logs,
      notes
    };
    
    // ✅ 获取前置系统可能已更新的 HP/SAN 最新值
    const currentHp = (result.updates?.vitality?.metrics?.hp as number) ?? metrics.hp;
    const currentInsight = (result.updates?.vitality?.metrics?.insight as number) ?? metrics.insight;
    
    // 更新 HP/SAN（累加模式）
    result.updates.vitality = {
      metrics: {
        hp: currentHp + (bill.effects?.hp || 0),
        insight: currentInsight + (bill.effects?.insight || 0),
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
    
    // =================================================================
    // 🚗 处理特殊账单效果
    // =================================================================
    
    // B_CAR_REPO: 车辆被拖走
    if (bill.id === 'B_CAR_REPO') {
      const vehicleToRemove = state.inventory.find((id: string) => id.startsWith('CAR_') || id === 'KEY_CAR');
      if (vehicleToRemove) {
        result.updates.inventory = state.inventory.filter((id: string) => id !== vehicleToRemove);
        notes.push(`车辆 ${vehicleToRemove} 已被拖走`);
      }
    }
    
    // B_ESCAPE_REPO_MEN: 暴力资产回收（逃生舱账单）
    if (bill.id === 'B_ESCAPE_REPO_MEN') {
      const vehicleToRemove = state.inventory.find((id: string) => id.startsWith('CAR_') || id === 'KEY_CAR');
      if (vehicleToRemove) {
        result.updates.inventory = state.inventory.filter((id: string) => id !== vehicleToRemove);
        notes.push(`车辆 ${vehicleToRemove} 被强制回收，你获得了 $2500`);
      }
    }

    return result;
  }
};
