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
          creditScore: selectedClass === PlayerClass.Homeless ? 500 : 650
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

  // ✅ 核心医疗逻辑 (保留)
  performTreatment: (serviceId) => {
    const state = get() as GameState & VitalitySlice;
    const { vitality, activeInsurance } = state;

    const service = (hospitalData as any[]).find(s => s.id === serviceId);
    if (!service) return { success: false, msg: "服务不可用" };

    const { finalCost } = calculateMedicalCost(service, activeInsurance, vitality.identity.currentClass);

    if (vitality.metrics.gold < finalCost) {
        return { success: false, msg: "资金不足" };
    }

    state.addTransaction('MEDICAL', -finalCost, `治疗: ${service.name}`);

    // 风险判定: roll (0~1) >= riskRate 则成功
    // 例如 riskRate 0.2, roll 0.1 (失败), roll 0.3 (成功)
    // 成功率 = 1 - riskRate
    const riskRate = service.requirements?.riskRate || 0;
    const isSuccess = Math.random() >= riskRate;
    
    const effects = service.effects || {};
    const addictionGain = effects.addiction || 0;

    if (isSuccess) {
        state.modifyStats({
            hp: effects.hpRestore || 0,
            san: effects.sanRestore || 0,
            addiction: addictionGain
        });
        return { success: true, msg: `治疗成功。${service.flavorText || ''}` };
    } else {
        state.modifyStats({
            hp: -10, 
            san: -5,
            addiction: addictionGain // 失败也成瘾
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