import { StateCreator } from 'zustand';
import { GameState, MedicalService } from '@/types/schema';
import { calculateMedicalCost } from '@/logic/medical';
import hospitalData from '@/assets/data/hospital_services.json';

export interface MedicalSlice {
  performTreatment: (serviceId: string) => { success: boolean; msg: string };
}

export const createMedicalSlice: StateCreator<any, [], [], MedicalSlice> = (set, get) => ({
  performTreatment: (serviceId) => {
    // 获取全量状态 (以便调用其他 Slice 的方法，如 addTransaction, modifyStats)
    const state = get() as GameState & { 
      addTransaction: Function; 
      modifyStats: Function; 
      cureDisease: Function;
      addNotification: Function;
    };
    
    const { vitality, activeInsurance } = state;

    // 1. 查找服务配置
    const service = (hospitalData as unknown as MedicalService[]).find(s => s.id === serviceId);
    if (!service) return { success: false, msg: "服务不可用 (Service Not Found)" };

    // 2. 计算最终费用 (含保险报销)
    const { finalCost, reason } = calculateMedicalCost(service, activeInsurance, vitality.identity.currentClass);

    // 3. 检查资金
    if (vitality.metrics.gold < finalCost) {
      return { success: false, msg: "资金不足，无法支付治疗费用。" };
    }

    // 4. 扣费 (生成流水)
    state.addTransaction('MEDICAL', -finalCost, `治疗: ${service.name}`);

    // 5. 风险判定 (RNG)
    // 如果没有配置 riskRate，默认为 0 (必定成功)
    const riskRate = service.requirements?.riskRate || 0;
    const roll = Math.random();
    const isSuccess = roll >= riskRate;

    const effects = service.effects || {};
    const addictionGain = effects.addiction || 0;

    // 6. 执行结果
    if (isSuccess) {
      // --- 成功逻辑 ---
      
      // A. 治愈疾病
      if (effects.cureType) {
        const targetTypes = Array.isArray(effects.cureType) ? effects.cureType : [effects.cureType];
        
        // 遍历当前患病列表，移除符合类型的病
        // 注意：这里需要配合 diseases.json 的数据来判断类型，
        // 简化起见，我们假设 cureDisease 支持按 ID 移除，这里我们可能需要更复杂的逻辑来查找 ID
        // 或者简单粗暴：如果 cureType 包含 'ACUTE'，移除所有急性病
        
        // 由于 vitality.activeDiseases 存的是 ID，我们需要去 diseases.json 查类型
        // 这里暂时简化为：调用 cureDisease (如果知道 ID)。
        // 为了通用性，建议在 modifyStats 里处理数值，而在外部处理逻辑。
        // *此处暂仅处理数值恢复，具体疾病移除逻辑若复杂建议放入 logic/medical.ts*
      }

      // B. 数值恢复
      state.modifyStats({
        hp: effects.hpRestore || 0,
        san: effects.sanRestore || 0,
        addiction: addictionGain // 治疗成功也会成瘾
      });

      return { 
        success: true, 
        msg: `治疗成功。${reason !== '无保险覆盖' ? `(${reason})` : ''}` 
      };

    } else {
      // --- 失败逻辑 ---
      
      // 医疗事故：扣除 HP (例如 10点 或 更多)
      state.modifyStats({
        hp: -15, 
        san: -5,
        addiction: addictionGain // 药吃了，病没好，瘾还在
      });

      return { 
        success: false, 
        msg: `治疗失败！产生了严重的排异反应 (HP -15)。资金已扣除。` 
      };
    }
  }
});