import { StateCreator } from 'zustand';
import { 
  VitalityState, 
  PlayerClass, 
  LedgerCategory, 
  GameState 
} from '@/types/schema';
import { CLASS_INITIAL_STATS } from './createPlayerSlice';
import { calculateMedicalCost } from '@/logic/medical';
import { checkDailyDisease } from '@/logic/health';

import hospitalData from '@/assets/data/hospital_services.json';
// ✅ 1. 引入配置文件群 (Configuration Swarm)
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json'; // 引入全局规则(Caps)
import rules from '@/assets/data/rules/vitalityRules.json';
import medicalRules from '@/assets/data/rules/medicalRules.json';

export interface VitalitySlice {
  vitality: VitalityState;
  initGame: (selectedClass: PlayerClass) => void;
  addTransaction: (category: LedgerCategory, amount: number, description: string) => void;
  modifyStats: (changes: Partial<VitalityState['metrics']>) => void;
  contractDisease: (diseaseId: string) => void;
  cureDisease: (diseaseId: string) => void;
  advanceTurn: () => void;
  clearWeeklyLedger: () => void;
  performTreatment: (serviceId: string) => { success: boolean; msg: string };
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const createVitalitySlice: StateCreator<any, [], [], VitalitySlice> = (set, get) => ({
  vitality: {
    // ✅ Use Spread from JSON
    metrics: { ...INITIAL_STATE.vitality },
    identity: { 
        currentClass: INITIAL_STATE.identity.defaultClass as PlayerClass, 
        points: { ...INITIAL_STATE.identity.points } 
    },
    time: { ...INITIAL_STATE.time, currentTurn: 1, totalTurns: 1 },
    activeDiseases: [],
    ledger: { history: [] },
    flags: { 
            ...INITIAL_STATE.flags, 
            hiddenTags: [] 
        },
    activeJobs: []
  },

  initGame: (selectedClass) => {
    const classConfig = CLASS_INITIAL_STATS[selectedClass];
    if (!classConfig) return;

    // ✅ 获取配置常量 (Single Source of Truth)
    const { maxSan, maxHunger } = INITIAL_STATE.vitality;
    const { startPrice } = INITIAL_STATE.crypto;
    const { creditScore } = rules.defaults; // 或从 rules 读取

    set((state: any) => ({
      vitality: {
        ...state.vitality,
        metrics: {
          ...state.vitality.metrics,
          gold: classConfig.gold,
          hp: classConfig.hp,
          maxHp: classConfig.hp, // 职业初始 HP 即为上限
          
          // ✅ Fix: 使用 JSON 配置的值，而非硬编码 100
          san: classConfig.san,
          maxSan: maxSan, 
          hunger: maxHunger,
          maxHunger: maxHunger,
          
          resistance: 0,
          creditScore: selectedClass === PlayerClass.Homeless ? creditScore.homeless : creditScore.standard
        },
        identity: { ...state.vitality.identity, currentClass: selectedClass },
        time: { currentTurn: 1, totalTurns: 1 },
        activeDiseases: [],
        ledger: { history: [] },
        flags: { 
        ...INITIAL_STATE.flags, 
        hiddenTags: [] 
        },
        activeJobs: []
      },
      // 重置子系统
      faith: { id: 'NONE', level: 0, hasPerformedRite: false },
      prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 },
      
      // ✅ Fix: Crypto 重置逻辑与 initial_state.json 保持一致
      crypto: { 
          isAccountOpen: false, 
          btcPrice: startPrice, // 修正：原代码写死 20000 -> 改为读取配置(15000)
          positions: [], 
          priceHistory: [startPrice], // 修正：历史记录应包含初始价格 
          dailyNews: null 
      },
      
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

  modifyStats: (changes) => set((state: any) => {
    // ✅ 建议：此处也可以引入 SYSTEM_RULES.caps 进行安全钳制
    return {
      vitality: {
          ...state.vitality,
          metrics: { ...state.vitality.metrics, ...changes }
      }
    };
  }),

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

    // 计算风险
    const baseRisk = service.requirements?.riskRate || 0;
    const riskMultiplier = medicalRules.settings?.baseRiskMultiplier || 1.0;
    const finalRiskRate = Math.min(baseRisk * riskMultiplier, 1.0);

    const isSuccess = Math.random() >= finalRiskRate;
    const effects = service.effects || {};
    
    // ✅ Fix: 获取全局属性上限配置
    const { maxStat } = SYSTEM_RULES.caps; 

    if (isSuccess) {
        const addictionGain = effects.addiction || 0;
        
        // ✅ Fix: 使用 metrics.maxHp/maxSan 动态上限，addiction 使用全局 Caps
        const newHp = Math.min(metrics.maxHp, Math.max(0, metrics.hp + (effects.hpRestore || 0)));
        const newSan = Math.min(metrics.maxSan, Math.max(0, metrics.san + (effects.sanRestore || 0)));
        
        // 修正：成瘾度上限不再写死 100，而是读取配置
        const newAddiction = Math.min(maxStat, Math.max(0, metrics.addiction + addictionGain));

        state.modifyStats({
            hp: newHp,
            san: newSan,
            addiction: newAddiction
        });
        return { success: true, msg: `治疗成功。${service.flavorText || ''}` };
    } else {
        // 失败逻辑
        const failure = rules.medical?.failurePenalty || { hp: -10, san: -5 }; // 防御性读取
        
        const newHp = Math.max(0, metrics.hp + (failure.hp || -10));
        const newSan = Math.max(0, metrics.san + (failure.san || -5));
        
        // 失败也会增加成瘾度
        const newAddiction = Math.min(maxStat, metrics.addiction + (effects.addiction || 0));

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

  advanceTurn: () => set((state: any) => {
    const allDiseases = state.gameDataCache?.diseases || [];
    const newDiseaseId = checkDailyDisease(state, allDiseases);

    let updates: any = {
      time: {
        currentTurn: state.vitality.time.currentTurn + 1,
        totalTurns: state.vitality.time.totalTurns + 1
      }
    };

    if (newDiseaseId) {
      if (!state.vitality.activeDiseases.includes(newDiseaseId)) {
        updates.activeDiseases = [...state.vitality.activeDiseases, newDiseaseId];
        const diseaseName = allDiseases.find((d: any) => d.id === newDiseaseId)?.name || newDiseaseId;
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