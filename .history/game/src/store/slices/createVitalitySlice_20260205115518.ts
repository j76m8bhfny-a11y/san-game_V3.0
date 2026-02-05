import { StateCreator } from 'zustand';
import { 
  VitalityState, 
  PlayerClass, 
  LedgerCategory, 
  GameState,
  ActiveInsuranceState 
} from '@/types/schema';
import { CLASS_INITIAL_STATS } from './createPlayerSlice';
import { calculateMedicalCost } from '@/logic/medical';
import { checkDailyDisease } from '@/logic/health'; // ✅ 确保引入

import hospitalData from '@/assets/data/hospital_services.json';
import rules from '@/assets/data/rules/vitalityRules.json';
import medicalRules from '@/assets/data/rules/medicalRules.json'; // ✅ 引入医疗规则

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
  
  // ✅ 医疗交互逻辑集中于此
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
          creditScore: selectedClass === PlayerClass.Homeless ? rules.defaults.creditScore.homeless : rules.defaults.creditScore.standard
        },
        identity: { ...state.vitality.identity, currentClass: selectedClass },
        time: { currentTurn: 1, totalTurns: 1 },
        activeDiseases: [],
        ledger: { history: [] },
        activeJobs: []
      },
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

  // ✅ 核心医疗逻辑 (已修复耦合与数值计算)
  performTreatment: (serviceId) => {
    const state = get() as GameState & VitalitySlice;
    const { vitality, activeInsurance } = state;
    const { metrics } = vitality;

    const service = (hospitalData as any[]).find(s => s.id === serviceId);
    if (!service) return { success: false, msg: "服务不可用" };

    const { finalCost } = calculateMedicalCost(service, activeInsurance, vitality.identity.currentClass);

    if (vitality.metrics.gold < finalCost) {
        return { success: false, msg: "资金不足" };
    }

    state.addTransaction('MEDICAL', -finalCost, `治疗: ${service.name}`);

    // ✅ 修复：应用全局风险乘数
    const baseRisk = service.requirements?.riskRate || 0;
    const riskMultiplier = medicalRules.settings.baseRiskMultiplier || 1.0;
    // 确保风险不超过 100%
    const finalRiskRate = Math.min(baseRisk * riskMultiplier, 1.0);

    // Roll 点机制：Random >= Risk 为成功 (例: Risk 0.2, Random 0.1(Fail), 0.3(Success))
    const isSuccess = Math.random() >= finalRiskRate;
    
    const effects = service.effects || {};
    const addictionGain = effects.addiction || 0;

    if (isSuccess) {
        // ✅ 修复：基于当前数值进行增减，并限制范围
        const newHp = Math.min(metrics.maxHp, Math.max(0, metrics.hp + (effects.hpRestore || 0)));
        const newSan = Math.min(metrics.maxSan, Math.max(0, metrics.san + (effects.sanRestore || 0)));
        const newAddiction = Math.min(100, Math.max(0, metrics.addiction + addictionGain));

        state.modifyStats({
            hp: newHp,
            san: newSan,
            addiction: newAddiction
        });
        return { success: true, msg: `治疗成功。${service.flavorText || ''}` };
    } else {
        // 失败惩罚
        const newHp = Math.max(0, metrics.hp + (rules.medical.failurePenalty.hp || -10));
        const newSan = Math.max(0, metrics.san + (rules.medical.failurePenalty.san || -5));
        const newAddiction = Math.min(100, metrics.addiction + addictionGain); // 失败通常也可能成瘾

        state.modifyStats({
            hp: newHp, 
            san: newSan,
            addiction: newAddiction
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

  // ✅ 核心回合推进逻辑 (已集成疾病检查)
  advanceTurn: () => set((state: any) => {
    // 1. 获取缓存的疾病定义，用于 checkDailyDisease 内部判断类型
    const allDiseases = state.gameDataCache?.diseases || [];
    
    // 2. 执行每日疾病判定
    const newDiseaseId = checkDailyDisease(state, allDiseases);

    let updates: any = {
      time: {
        currentTurn: state.vitality.time.currentTurn + 1,
        totalTurns: state.vitality.time.totalTurns + 1
      }
    };

    // 3. 如果染病，更新状态并通知
    if (newDiseaseId) {
      // 避免重复感染同一种病（checkDailyDisease 应该已经防范，这里双重保险）
      if (!state.vitality.activeDiseases.includes(newDiseaseId)) {
        updates.activeDiseases = [...state.vitality.activeDiseases, newDiseaseId];
        
        // 尝试查找疾病名称以便通知
        const diseaseName = allDiseases.find((d: any) => d.id === newDiseaseId)?.name || newDiseaseId;
        
        // 调用 UI Slice 的通知功能
        if (state.addNotification) {
          state.addNotification(`警告：你患上了 ${diseaseName}`, 'warning');
        }
      }
    }

    return {
      vitality: {
        ...state.vitality,
        ...updates
      }
    };
  }),

  clearWeeklyLedger: () => set((state: any) => ({
      vitality: {
          ...state.vitality,
          ledger: { history: [] }
      }
  }))
});