import { StateCreator } from 'zustand';
import { StoreState } from '@/types/store';
import { Insurance } from '@/types/schema';
import insuranceData from '@/assets/data/insurance.json';

export interface InsuranceSlice {
  // Actions
  signInsurance: (insuranceId: string) => { success: boolean; message: string };
  cancelInsurance: (insuranceId?: string) => { success: boolean; message: string };
  getAvailableInsurance: (type?: 'MEDICAL' | 'AUTO') => Insurance[];
  hasInsurance: (type: 'MEDICAL' | 'AUTO') => boolean;
  getActiveInsurance: (type: 'MEDICAL' | 'AUTO') => Insurance | null;
}

export const createInsuranceSlice: StateCreator<StoreState, [], [], InsuranceSlice> = (set, get) => ({
  getAvailableInsurance: (type) => {
    const { vitality } = get();
    // 筛选符合阶级要求的保险
    return (insuranceData as any[])
      .filter((ins: Insurance) => {
        // 类型筛选
        if (type && ins.type !== type) return false;
        // 阶级筛选
        return ins.allowedClasses.includes(vitality.identity.currentClass);
      }) as Insurance[];
  },

  hasInsurance: (type) => {
    const { vitality } = get();
    return vitality.activeInsurances.some((ins: Insurance) => ins.type === type);
  },

  getActiveInsurance: (type) => {
    const { vitality } = get();
    return vitality.activeInsurances.find((ins: Insurance) => ins.type === type) || null;
  },

  signInsurance: (insuranceId) => {
    const state = get();
    const { vitality } = state;
    const plan = (insuranceData as any[]).find((i: Insurance) => i.id === insuranceId);

    if (!plan) return { success: false, message: "保险计划不存在" };

    // 1. 检查是否已购买同类型保险
    const hasSameType = vitality.activeInsurances.some((ins: Insurance) => ins.type === plan.type);
    if (hasSameType) {
      return { success: false, message: `你已拥有${plan.type === 'AUTO' ? '车险' : '医疗保险'}，请先退保再购买新的` };
    }

    // 2. 检查是否有钱支付首周费用
    if (vitality.metrics.gold < plan.weeklyCost) {
      return { success: false, message: "资金不足，无法支付首周保费" };
    }

    // 3. 检查阶级 (双重验证)
    if (!plan.allowedClasses.includes(vitality.identity.currentClass)) {
      return { success: false, message: "你不符合该保险的投保资格" };
    }

    // 4. 执行购买（添加到数组）
    set((prev) => ({
      vitality: {
        ...prev.vitality,
        metrics: {
          ...prev.vitality.metrics,
          gold: prev.vitality.metrics.gold - plan.weeklyCost
        },
        activeInsurances: [...prev.vitality.activeInsurances, plan]
      }
    }));

    // 添加交易记录
    const category = plan.type === 'AUTO' ? 'BILL' : 'MEDICAL';
    state.addTransaction(category, -plan.weeklyCost, `签署${plan.type === 'AUTO' ? '车险' : '医疗保险'}: ${plan.name}`);

    return { success: true, message: `${plan.name} 已生效` };
  },

  cancelInsurance: (insuranceId) => {
    const state = get();
    const { vitality } = state;
    
    if (vitality.activeInsurances.length === 0) {
      return { success: false, message: "当前没有生效的保险" };
    }

    // 如果没有指定ID，取消第一个保险
    const targetId = insuranceId || vitality.activeInsurances[0]?.id;
    const plan = vitality.activeInsurances.find((ins: Insurance) => ins.id === targetId);
    
    if (!plan) {
      return { success: false, message: "指定的保险不存在" };
    }

    set((prev) => ({
      vitality: {
        ...prev.vitality,
        activeInsurances: prev.vitality.activeInsurances.filter((ins: Insurance) => ins.id !== targetId)
      }
    }));

    return { success: true, message: `已终止 ${plan.name}` };
  }
});
