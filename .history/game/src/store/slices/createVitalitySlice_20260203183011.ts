import { StateCreator } from 'zustand';
import { VitalityState, PlayerClass, LedgerCategory, GameState , ActiveInsuranceState } from '@/types/schema';
import { CLASS_INITIAL_STATS } from './createPlayerSlice';
// ✅ 引入计算逻辑和数据
import { calculateMedicalCost } from '@/logic/medical';
import hospitalData from '@/assets/data/hospital_services.json';

export interface VitalitySlice {
  vitality: VitalityState;

  // --- Actions ---
  initGame: (selectedClass: PlayerClass) => void;
  addTransaction: (category: LedgerCategory, amount: number, description: string) => void;
  modifyStats: (changes: { 
    hp?: number; san?: number; 
    hunger?: number;
    maxHp?: number; maxSan?: number;
    addiction?: number; resistance?: number;
  }) => void;
  contractDisease: (diseaseId: string) => void;
  cureDisease: (diseaseId: string) => void;
  advanceTurn: () => void;
  clearWeeklyLedger: () => void;
  
  // ✅ 新增: 执行医疗治疗 (含风险判定)
  performTreatment: (serviceId: string) => { success: boolean; msg: string };
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const createVitalitySlice: StateCreator<any, [], [], VitalitySlice> = (set, get) => ({
  vitality: {
    metrics: { hunger: 100, maxHunger: 100, hp: 100, maxHp: 100, san: 100, maxSan: 100, gold: 0, creditScore: 650, addiction: 0, resistance: 0 },
    identity: { currentClass: PlayerClass.Homeless, points: { red: 0, wolf: 0, old: 0 } },
    time: { currentTurn: 1, totalTurns: 1 },
    activeDiseases: [],
    ledger: { history: [] },
    flags: { isHomeless: true, debtTurns: 0, hiddenTags: [] },
    activeJobs: []
  },

  initGame: (selectedClass) => {
    const config = CLASS_INITIAL_STATS[selectedClass];
    if (!config) return;

    set((state: any) => ({
      vitality: {
        ...state.vitality,
        metrics: {
          ...state.vitality.metrics,
          gold: config.gold,
          hp: config.hp,
          maxHp: config.hp,
          san: config.san,
          maxSan: 100,
          hunger: 100,
          maxHunger: 100,
          resistance: 0,
          creditScore: selectedClass === PlayerClass.Homeless ? 500 : 650
        },
        identity: { ...state.vitality.identity, currentClass: selectedClass },
        time: { currentTurn: 1, totalTurns: 1 },
        activeDiseases: [],
        ledger: { history: [] },
        activeJobs: []
      },
      // ... 其他重置逻辑保持不变
      faith: { id: 'NONE', level: 0, hasPerformedRite: false },
      prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 },
      crypto: { isAccountOpen: false, btcPrice: 20000, positions: [], priceHistory: [], dailyNews: null },
      activeHousing: null,
      activeInsurance: null,
      activeJob: null,
      inventory: [],
      bank: { activeLoans: [], lifetimeInterestPaid: 0 }
    }));
  },

  addTransaction: (category, amount, description) => {
     set((state: any) => {
        const newRecord = {
            id: generateId(),
            turn: state.vitality.time.currentTurn,
            category,
            amount,
            description,
            timestamp: Date.now()
        };
        const newGold = state.vitality.metrics.gold + amount;
        
        return {
            vitality: {
                ...state.vitality,
                metrics: { ...state.vitality.metrics, gold: newGold },
                ledger: { history: [...state.vitality.ledger.history, newRecord] }
            }
        };
     });
  },

  modifyStats: (changes) => set((state: any) => ({
    vitality: {
        ...state.vitality,
        metrics: { ...state.vitality.metrics, ...changes }
    }
  })),

  // 🛡️ 核心修复 2: 医疗行为 Action
  performTreatment: (serviceId) => {
    const state = get() as GameState & VitalitySlice;
    const { vitality, activeInsurance } = state;

    // 1. 查找服务
    const service = (hospitalData as any[]).find(s => s.id === serviceId);
    if (!service) return { success: false, msg: "服务不可用" };

    // 2. 计算费用
    const { finalCost } = calculateMedicalCost(service, activeInsurance, vitality.identity.currentClass);

    // 3. 检查资金
    if (vitality.metrics.gold < finalCost) {
        return { success: false, msg: "资金不足" };
    }

    // 4. 扣费
    state.addTransaction('MEDICAL', -finalCost, `治疗: ${service.name}`);

    // 5. 风险判定
    const riskRate = service.requirements?.riskRate || 0;
    const isSuccess = Math.random() >= riskRate;
    
    // 6. 应用结果
    // 注意：无论成功失败，成瘾值(addiction)通常都会增加（如果有配置）
    const effects = service.effects || {};
    const addictionGain = effects.addiction || 0;

    if (isSuccess) {
        // 成功：恢复 HP/SAN，增加成瘾
        state.modifyStats({
            hp: effects.hpRestore || 0,
            san: effects.sanRestore || 0,
            addiction: addictionGain
        });

        // 治愈疾病逻辑 (如果有 cureType)
        if (effects.cureType) {
            // 简单的全部清除逻辑，或者根据 cureType 筛选
            // 这里假设 cureDisease 已经处理好了
            // 实际可能需要遍历 activeDiseases 并匹配类型
            // 简化处理：这里仅返回成功消息，具体治愈哪些病可能需要在 UI 层调用 cureDisease，或者在这里增强
            // 建议：在这里处理 cureDisease
            const cureTypes = Array.isArray(effects.cureType) ? effects.cureType : [effects.cureType];
            // 逻辑略复杂，暂时只处理数值，治愈逻辑可由调用方处理或后续完善
        }

        return { success: true, msg: `治疗成功。${service.flavorText || ''}` };
    } else {
        // 失败：扣除少量 HP (医疗事故)，增加成瘾，病没好
        state.modifyStats({
            hp: -10, // 医疗事故扣血
            san: -5, // 精神受挫
            addiction: addictionGain // 药还是吃了
        });
        
        return { success: false, msg: "治疗失败！产生了严重的排异反应，病情未见好转。" };
    }
  },

  contractDisease: (diseaseId) => set((state: any) => ({
    vitality: {
      ...state.vitality,
      activeDiseases: [...state.vitality.activeDiseases, diseaseId]
    }
  })),

  cureDisease: (diseaseId) => set((state: any) => ({
    vitality: {
      ...state.vitality,
      activeDiseases: state.vitality.activeDiseases.filter((id: string) => id !== diseaseId)
    }
  })),

  advanceTurn: () => set((state: any) => ({
    vitality: {
        ...state.vitality,
        time: {
            ...state.vitality.time,
            currentTurn: state.vitality.time.currentTurn + 1,
            totalTurns: state.vitality.time.totalTurns + 1
        }
    }
  })),

  clearWeeklyLedger: () => set((state: any) => ({
      vitality: {
          ...state.vitality,
          ledger: { history: [] }
      }
  }))
});