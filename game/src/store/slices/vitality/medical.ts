/**
 * Vitality Slice - 医疗系统模块
 * 
 * 包含：治疗、预约、疾病管理
 */

import { StoreState } from '@/types/store';
import { calculateMedicalCost } from '@/logic/medical';


import hospitalData from '@/assets/data/hospital_services.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';
import rules from '@/assets/data/rules/vitality_rules.json';
import medicalRules from '@/assets/data/rules/medical_rules.json';
import { executeTransactionSync, createStep } from '@/utils/transaction';

export interface TreatmentResult {
  success: boolean;
  msg: string;
}

export interface AppointmentResult {
  success: boolean;
  msg: string;
}

export interface CancelAppointmentResult {
  success: boolean;
  msg: string;
  refund: number;
}

/**
 * 执行治疗
 */
export function performTreatment(
  get: () => StoreState,
  set: (fn: (state: StoreState) => Partial<StoreState>) => void,
  serviceId: string
): TreatmentResult {
  const state = get();
  const { vitality } = state;
  const { metrics, activeInsurances, time, deductibleTrackers } = vitality;
  
  // 获取医疗保险（用于医疗报销）
  const medicalInsurance = activeInsurances.find((ins: any) => ins.type === 'MEDICAL') || null;

  const service = (hospitalData as any[]).find(s => s.id === serviceId);
  if (!service) return { success: false, msg: "服务不可用" };

  // 获取或创建免赔额追踪器（HDHP机制）
  let deductibleTracker = medicalInsurance 
    ? deductibleTrackers.find((dt: any) => dt.insuranceId === medicalInsurance.id)
    : undefined;
  
  if (medicalInsurance && !deductibleTracker && medicalInsurance.coverage?.deductible) {
    deductibleTracker = {
      insuranceId: medicalInsurance.id,
      deductible: medicalInsurance.coverage.deductible,
      currentSpent: 0,
      remaining: medicalInsurance.coverage.deductible,
      planYear: new Date().getFullYear(),
      isMet: false
    };
    // 添加到追踪器列表
    if (deductibleTracker) {
      set((state: StoreState) => ({
        vitality: {
          ...state.vitality,
          deductibleTrackers: [...state.vitality.deductibleTrackers, deductibleTracker!]
        }
      }));
    }
  }

  // 计算医疗费用（考虑保险和免赔额）
  const { finalCost, insuranceCoverage, deductibleStatus: _deductibleStatus } = calculateMedicalCost(
    service, 
    medicalInsurance, 
    vitality.identity.currentClass,
    deductibleTracker
  );

  // 更新免赔额追踪器（HDHP机制）
  if (deductibleTracker && finalCost > 0) {
    const newSpent = deductibleTracker.currentSpent + finalCost;
    const isMet = newSpent >= deductibleTracker.deductible;
    
    set((state: StoreState) => ({
      vitality: {
        ...state.vitality,
        deductibleTrackers: state.vitality.deductibleTrackers.map((dt: any) => 
          dt.insuranceId === deductibleTracker!.insuranceId
            ? {
                ...dt,
                currentSpent: newSpent,
                remaining: Math.max(0, deductibleTracker!.deductible - newSpent),
                isMet
              }
            : dt
        )
      }
    }));

    // 如果刚满足免赔额，发送通知
    if (isMet && !deductibleTracker.isMet && state.addNotification) {
      state.addNotification(
        `🎉 恭喜！您已满足年度免赔额$${deductibleTracker.deductible}，后续医疗费用将正常报销！`,
        'success'
      );
    }
  }

  const { minStat, maxStat } = SYSTEM_RULES.caps;
  const baseRisk = service.requirements?.riskRate || 0;
  const riskMultiplier = medicalRules.settings?.baseRiskMultiplier || 1.0;
  const finalRiskRate = Math.min(baseRisk * riskMultiplier, 1.0);
  const isSuccess = Math.random() >= finalRiskRate;
  const effects = service.effects || {};

  // 排期机制（手术等待队列）
  const waitTurnsConfig = service.requirements?.waitTurns;
  if (waitTurnsConfig && waitTurnsConfig[0] > 0) {
    // 需要排期的手术
    const [minWait, maxWait] = waitTurnsConfig;
    const actualWait = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;
    const deposit = Math.floor(finalCost * 0.1); // 定金为10%
    
    // 检查是否已存在相同服务的预约
    const existingAppointment = vitality.medicalAppointments.find(
      (appt: any) => appt.serviceId === serviceId
    );
    if (existingAppointment) {
      return { 
        success: false, 
        msg: `您已经预约了${service.name}，预计${existingAppointment.scheduledTurn - time.currentTurn}回合后进行。` 
      };
    }
    
    // 检查定金
    if (metrics.gold < deposit) {
      return { success: false, msg: `需要支付$${deposit}定金才能预约。` };
    }
    
    // 扣除定金
    const txResult = state.addTransaction('MEDICAL', -deposit, `预约定金: ${service.name}`);
    if (!txResult.success) {
      return { success: false, msg: "资金不足以支付预约定金" };
    }
    
    // 创建预约
    const appointment = {
      id: `APPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceId: service.id,
      serviceName: service.name,
      scheduledTurn: time.currentTurn + actualWait,
      depositPaid: deposit,
      canCancel: true,
      refundRate: 0.5,
    };
    
    // 如果服务还有延迟支付配置，预约时也要扣除挂号费并生成延迟账单
    let pendingBillId = null;
    if (service.deferredPayment) {
      const { upfrontCopay, delayTurns, description, isSurprise, collectionsRisk } = service.deferredPayment;
      
      // 检查是否有足够资金支付定金+挂号费
      if (upfrontCopay > 0 && metrics.gold < deposit + upfrontCopay) {
        return { success: false, msg: `需要支付定金$${deposit} + 挂号费$${upfrontCopay} = $${deposit + upfrontCopay}` };
      }
      
      // 扣除挂号费
      if (upfrontCopay > 0) {
        const copayResult = state.addTransaction('MEDICAL', -upfrontCopay, `挂号费: ${service.name}`);
        if (!copayResult.success) {
          return { success: false, msg: "资金不足以支付挂号费" };
        }
      }
      
      // 生成延迟账单（预约时生成，但 triggerTurn 应该是手术后）
      const pendingBill = {
        id: `DEFERRED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalServiceId: service.id,
        originalCost: finalCost,
        upfrontCopay: upfrontCopay || 0,
        deferredAmount: Math.floor(finalCost * 0.9), // 90% 尾款
        delayTurns: delayTurns,
        triggerTurn: time.currentTurn + actualWait + delayTurns, // 预约时间 + 延迟时间
        description: description || `${service.name}的后续账单`,
        isSurprise: isSurprise || false,
        collectionsRisk: collectionsRisk || 0.3,
        hospitalRegion: service.region,
        issuedTurn: time.currentTurn,
      };
      
      set((state: StoreState) => ({
        vitality: {
          ...state.vitality,
          pendingMedicalBills: [...state.vitality.pendingMedicalBills, pendingBill]
        }
      }));
      
      pendingBillId = pendingBill.id;
    }

    set((state: StoreState) => ({
      vitality: {
        ...state.vitality,
        medicalAppointments: [...state.vitality.medicalAppointments, appointment]
      }
    }));
    
    if (state.addNotification) {
      state.addNotification(
        `📅 预约成功：${service.name} 已排到 ${actualWait} 回合后`,
        'info'
      );
    }
    
    const deferredMsg = pendingBillId ? ` (${service.deferredPayment.delayTurns}回合后将收到延迟账单)` : '';
    return { 
      success: true, 
      msg: `预约成功！${service.name} 已排到 ${actualWait} 回合后。已支付定金 $${deposit}。${deferredMsg}` 
    };
  }

  // 延迟支付机制（达摩克利斯之剑）
  if (service.deferredPayment) {
    const { upfrontCopay, delayTurns, description, isSurprise, collectionsRisk } = service.deferredPayment;
    
    // 计算保险后自付金额（惊喜账单用原始费用）
    const surpriseMultiplier = isSurprise ? 1.0 : (1 - (insuranceCoverage || 0));
    const deferredAmount = Math.floor(finalCost * surpriseMultiplier);
    
    // 检查是否能支付挂号费
    if (metrics.gold < upfrontCopay) {
      return { success: false, msg: `连$${upfrontCopay}的挂号费都付不起。医院保安礼貌地请你离开。` };
    }

    // 扣除挂号费
    if (upfrontCopay > 0) {
      const txResult = state.addTransaction('MEDICAL', -upfrontCopay, `挂号费: ${service.name}`);
      if (!txResult.success) {
        return { success: false, msg: "资金不足以支付挂号费" };
      }
    }

    // 生成延迟账单
    const pendingBill = {
      id: `DEFERRED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalServiceId: service.id,
      originalCost: finalCost,
      upfrontCopay: upfrontCopay,
      deferredAmount: deferredAmount,
      delayTurns: delayTurns,
      triggerTurn: time.currentTurn + delayTurns,
      description: description || `${service.name}的后续账单`,
      isSurprise: isSurprise || false,
      collectionsRisk: collectionsRisk || 0.3,
      hospitalRegion: service.region,
      issuedTurn: time.currentTurn,
    };

    // 添加到延迟账单队列
    set((state: StoreState) => ({
      vitality: {
        ...state.vitality,
        pendingMedicalBills: [...state.vitality.pendingMedicalBills, pendingBill]
      }
    }));

    // 执行治疗效果
    if (isSuccess) {
      const addictionGain = effects.addiction || 0;
      const newHp = Math.min(metrics.maxHp, Math.max(minStat, metrics.hp + (effects.hpRestore || 0)));
      const newInsight = Math.min(metrics.maxInsight, Math.max(minStat, metrics.insight + (effects.insightRestore || 0)));
      const newAddiction = Math.min(maxStat, Math.max(minStat, metrics.addiction + addictionGain));

      state.modifyStats({
        hp: newHp,
        insight: newInsight,
        addiction: newAddiction
      });

      const surpriseMsg = isSurprise 
        ? "你签了一堆文件，但没人告诉你真实的费用。" 
        : "";
      return { 
        success: true, 
        msg: `治疗成功。${service.flavorText || ''} ${surpriseMsg} (${delayTurns}回合后将收到剩余账单$${deferredAmount})` 
      };
    } else {
      const failure = rules.medical?.failurePenalty || { hp: -10, insight: -5 };
      const newHp = Math.max(minStat, metrics.hp + (failure.hp || -10));
      const newInsight = Math.max(minStat, metrics.insight + (failure.insight || -5));

      state.modifyStats({
        hp: newHp, 
        insight: newInsight,
      });
      return { 
        success: false, 
        msg: `治疗失败！产生了严重的排异反应。更糟的是，${delayTurns}回合后你还得付$${deferredAmount}的账单。` 
      };
    }
  }

  // 标准支付流程（无延迟）- 使用事务管理器
  if (vitality.metrics.gold < finalCost) {
      return { success: false, msg: "资金不足" };
  }

  // 保存初始状态用于回滚
  const initialHp = metrics.hp;
  const initialInsight = metrics.insight;
  const initialAddiction = metrics.addiction;

  const result = executeTransactionSync([
    createStep(
      '扣除医疗费用',
      () => {
        const txResult = state.addTransaction('MEDICAL', -finalCost, `治疗: ${service.name}`);
        return txResult.success;
      },
      () => {
        // 回滚：退还费用
        state.addTransaction('MEDICAL', finalCost, `治疗回滚: ${service.name}`);
      }
    ),
    createStep(
      '应用治疗效果',
      () => {
        if (isSuccess) {
          const addictionGain = effects.addiction || 0;
          const newHp = Math.min(metrics.maxHp, Math.max(minStat, metrics.hp + (effects.hpRestore || 0)));
          const newInsight = Math.min(metrics.maxInsight, Math.max(minStat, metrics.insight + (effects.insightRestore || 0)));
          const newAddiction = Math.min(maxStat, Math.max(minStat, metrics.addiction + addictionGain));
          state.modifyStats({ hp: newHp, insight: newInsight, addiction: newAddiction });
        } else {
          const failure = rules.medical?.failurePenalty || { hp: -10, insight: -5 };
          const newHp = Math.max(minStat, metrics.hp + (failure.hp || -10));
          const newInsight = Math.max(minStat, metrics.insight + (failure.insight || -5));
          state.modifyStats({ hp: newHp, insight: newInsight });
        }
        return true;
      },
      () => {
        // 回滚：恢复状态
        state.modifyStats({ hp: initialHp, insight: initialInsight, addiction: initialAddiction });
      }
    )
  ], 'performTreatment');

  if (result.success) {
    return { 
      success: true, 
      msg: isSuccess 
        ? `治疗成功。${service.flavorText || ''}` 
        : "治疗失败！产生了严重的排异反应，病情未见好转。"
    };
  } else {
    return { success: false, msg: `治疗失败: ${result.error}` };
  }
}

/**
 * 感染疾病
 */
export function contractDisease(
  set: (fn: (state: StoreState) => Partial<StoreState>) => void,
  diseaseId: string
): void {
  set((state: StoreState) => {
    const diseases = state.vitality.activeDiseases;
    const MAX_DISEASES = 10;
    
    // 检查是否已达上限
    if (diseases.length >= MAX_DISEASES) {
      console.warn(`[VitalitySlice] 疾病数量已达上限 ${MAX_DISEASES}，无法添加 ${diseaseId}`);
      if (state.addNotification) {
        state.addNotification('身体已无法承受更多疾病', 'warning');
      }
      return {}; // 不修改状态
    }
    
    // 检查是否已存在
    if (diseases.includes(diseaseId)) {
      return {}; // 已存在，不重复添加
    }
    
    return {
      vitality: {
        ...state.vitality,
        activeDiseases: [...diseases, diseaseId]
      }
    };
  });
}

/**
 * 治愈疾病
 */
export function cureDisease(
  set: (fn: (state: StoreState) => Partial<StoreState>) => void,
  diseaseId: string
): void {
  set((state: StoreState) => ({
    vitality: {
      ...state.vitality,
      activeDiseases: state.vitality.activeDiseases.filter((id: string) => id !== diseaseId)
    }
  }));
}

/**
 * 预约医疗服务
 */
export function scheduleAppointment(
  get: () => StoreState,
  set: (fn: (state: StoreState) => Partial<StoreState>) => void,
  serviceId: string,
  deposit: number
): AppointmentResult {
  const state = get();
  const { vitality } = state;
  const { metrics, time } = vitality;
  
  const service = (hospitalData as any[]).find((s: any) => s.id === serviceId);
  if (!service) return { success: false, msg: "服务不可用" };
  
  // 检查是否已有相同预约
  const existingAppointment = vitality.medicalAppointments.find(
    (appt: any) => appt.serviceId === serviceId
  );
  if (existingAppointment) {
    return { 
      success: false, 
      msg: `您已经预约了${service.name}，预计${existingAppointment.scheduledTurn - time.currentTurn}回合后进行。` 
    };
  }
  
  // 检查资金
  if (metrics.gold < deposit) {
    return { success: false, msg: `需要支付$${deposit}定金才能预约。` };
  }
  
  // 扣除定金
  const txResult = state.addTransaction('MEDICAL', -deposit, `预约定金: ${service.name}`);
  if (!txResult.success) {
    return { success: false, msg: "资金不足以支付预约定金" };
  }
  
  // 计算等待时间
  const waitTurnsConfig = service.requirements?.waitTurns || [1, 2];
  const [minWait, maxWait] = waitTurnsConfig;
  const actualWait = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;
  
  // 创建预约
  const appointment = {
    id: `APPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    serviceId: service.id,
    serviceName: service.name,
    scheduledTurn: time.currentTurn + actualWait,
    depositPaid: deposit,
    canCancel: true,
    refundRate: 0.5,
  };
  
  set((state: StoreState) => ({
    vitality: {
      ...state.vitality,
      medicalAppointments: [...state.vitality.medicalAppointments, appointment]
    }
  }));
  
  return { 
    success: true, 
    msg: `预约成功！${service.name} 已排到 ${actualWait} 回合后。已支付定金 $${deposit}。` 
  };
}

/**
 * 取消预约
 */
export function cancelAppointment(
  get: () => StoreState,
  set: (fn: (state: StoreState) => Partial<StoreState>) => void,
  appointmentId: string
): CancelAppointmentResult {
  const state = get();
  const { vitality } = state;
  
  const appointment = vitality.medicalAppointments.find((appt: any) => appt.id === appointmentId);
  if (!appointment) {
    return { success: false, msg: "未找到该预约", refund: 0 };
  }
  
  if (!appointment.canCancel) {
    return { success: false, msg: "该预约无法取消", refund: 0 };
  }
  
  // 计算退款
  const refund = Math.floor(appointment.depositPaid * appointment.refundRate);
  
  // 退还定金
  if (refund > 0) {
    state.addTransaction('MEDICAL', refund, `取消预约退款: ${appointment.serviceName}`);
    state.modifyStats({ gold: (state.vitality?.metrics?.gold || 0) + refund });
  }
  
  // 同时取消相关的延迟账单（如果存在）
  const relatedBillIndex = vitality.pendingMedicalBills.findIndex(
    (bill: any) => bill.originalServiceId === appointment.serviceId && bill.triggerTurn > vitality.time.currentTurn
  );
  
  if (relatedBillIndex >= 0) {
    set((state: StoreState) => ({
      vitality: {
        ...state.vitality,
        medicalAppointments: state.vitality.medicalAppointments.filter((appt: any) => appt.id !== appointmentId),
        pendingMedicalBills: state.vitality.pendingMedicalBills.filter((_: any, index: number) => index !== relatedBillIndex)
      }
    }));
    
    return { 
      success: true, 
      msg: `已取消${appointment.serviceName}的预约及相关延迟账单。退还定金$${refund}（扣除50%手续费）。`,
      refund 
    };
  }
  
  // 移除预约
  set((state: StoreState) => ({
    vitality: {
      ...state.vitality,
      medicalAppointments: state.vitality.medicalAppointments.filter((appt: any) => appt.id !== appointmentId)
    }
  }));
  
  return { 
    success: true, 
    msg: `已取消${appointment.serviceName}的预约。退还定金$${refund}（扣除50%手续费）。`,
    refund 
  };
}
