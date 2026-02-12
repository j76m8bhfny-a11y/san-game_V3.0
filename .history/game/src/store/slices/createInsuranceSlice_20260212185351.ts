import { StateCreator } from 'zustand';
import { StoreState } from '@/types/store';
import { Insurance, PlayerClass } from '@/types/schema';
import insuranceData from '@/assets/data/insurance.json';

export interface InsuranceSlice {
  // Actions
  signInsurance: (insuranceId: string) => { success: boolean; message: string };
  cancelInsurance: () => { success: boolean; message: string };
  getAvailableInsurance: () => Insurance[];
}

export const createInsuranceSlice: StateCreator<StoreState, [], [], InsuranceSlice> = (set, get) => ({
  isInsuranceOpen: false,
  setInsuranceOpen: (isOpen) => set({ isInsuranceOpen: isOpen }),
  
  getAvailableInsurance: () => {
    const { vitality } = get();
    const currentClass = vitality.identity.currentClass;
    
    // 筛选符合阶级要求的保险
    // 强制类型转换: JSON 导入通常需要断言匹配 Schema
    return (insuranceData as any[]).filter((ins: Insurance) => 
      ins.allowedClasses.includes(vitality.identity.currentClass)
    ) as Insurance[];
  },

  signInsurance: (insuranceId) => {
    const state = get();
    const { vitality } = state;
    const plan = (insuranceData as any[]).find(i => i.id === insuranceId);

    if (!plan) return { success: false, message: "保险计划不存在" };

    // 1. 检查是否有钱支付首周费用
    if (vitality.metrics.gold < plan.weeklyCost) {
      return { success: false, message: "资金不足，无法支付首周保费" };
    }

    // 2. 检查阶级 (双重验证)
    if (!plan.allowedClasses.includes(vitality.identity.currentClass)) {
      return { success: false, message: "你不符合该保险的投保资格" };
    }

    // 3. 执行购买
    set((prev) => ({
      vitality: {
        ...prev.vitality,
        metrics: {
          ...prev.vitality.metrics,
          gold: prev.vitality.metrics.gold - plan.weeklyCost
        },
        activeInsurance: plan // 保存完整的保险对象或ID，建议保存对象以便快速读取属性
      }
    }));

    // 添加交易记录
    state.addTransaction({
      amount: -plan.weeklyCost,
      category: 'MEDICAL',
      description: `签署保险: ${plan.name}`
    });

    return { success: true, message: "保险生效" };
  },

  cancelInsurance: () => {
    const state = get();
    if (!state.vitality.activeInsurance) {
      return { success: false, message: "当前没有生效的保险" };
    }

    const planName = state.vitality.activeInsurance.name;

    set((prev) => ({
      vitality: {
        ...prev.vitality,
        activeInsurance: null // 清除状态
      }
    }));

    return { success: true, message: `已终止 ${planName}` };
  }
});