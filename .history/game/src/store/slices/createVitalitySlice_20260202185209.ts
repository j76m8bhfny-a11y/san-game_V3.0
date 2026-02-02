import { StateCreator } from 'zustand';
import { VitalityState, PlayerClass, GameState, LedgerCategory, LedgerRecord, Disease } from '@/types/schema';
import { checkDailyDisease } from '@/logic/health';

// 初始配置常量
const CLASS_CONFIG = {
  [PlayerClass.Homeless]: { gold: 50, hp: 60, san: 40, resistance: 0 },
  [PlayerClass.Worker]: { gold: 200, hp: 100, san: 60, resistance: 10 },
  [PlayerClass.Middle]: { gold: 2000, hp: 90, san: 70, resistance: 20 },
  [PlayerClass.Capitalist]: { gold: 10000, hp: 80, san: 50, resistance: 30 }
};

export interface VitalitySlice {
  vitality: VitalityState;

  // --- Actions ---
  initGame: (selectedClass: PlayerClass) => void;
  addTransaction: (category: LedgerCategory, amount: number, description: string) => void;
  modifyStats: (changes: { 
    hp?: number; san?: number; 
    maxHp?: number; maxSan?: number;
    addiction?: number; resistance?: number;
  }) => void;
  contractDisease: (diseaseId: string) => void;
  cureDisease: (diseaseId: string) => void;
  advanceTurn: () => void;
  clearWeeklyLedger: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const createVitalitySlice: StateCreator<any, [], [], VitalitySlice> = (set, get) => ({
  vitality: {
    metrics: { 
      hp: 100, maxHp: 100, 
      san: 50, maxSan: 100, 
      gold: 0,
      creditScore: 580,
      addiction: 0,
      resistance: 0
    },
    identity: {
      currentClass: PlayerClass.Homeless,
      points: { red: 0, wolf: 0, old: 0 }
    },
    time: {
      currentTurn: 1,
      totalTurns: 52,
      dayOfWeek: 1
    },
    activeDiseases: [],
    ledger: { history: [] },
    flags: { isHomeless: false, debtTurns: 0, hiddenTags: [] },
    activeJobs: []
  },

  initGame: (selectedClass) => {
    const config = CLASS_CONFIG[selectedClass];
    set({
      vitality: {
        metrics: { 
          hp: config.hp, maxHp: config.hp, 
          san: config.san, maxSan: 100, 
          gold: config.gold, 
          creditScore: 580,
          addiction: 0,
          resistance: config.resistance
        },
        identity: { currentClass: selectedClass, points: { red: 0, wolf: 0, old: 0 } },
        time: { currentTurn: 1, totalTurns: 52, dayOfWeek: 1 },
        ledger: { history: [] },
        activeDiseases: [],
        flags: { isHomeless: selectedClass === PlayerClass.Homeless, debtTurns: 0, hiddenTags: [] },
        activeJobs: []
      }
    });
  },

  addTransaction: (category, amount, description) => {
    set((state: GameState) => {
      const { metrics, time, ledger } = state.vitality;
      const newRecord: LedgerRecord = {
        id: generateId(),
        turn: time.currentTurn,
        category,
        amount,
        description,
        timestamp: Date.now()
      };
      return {
        vitality: {
          ...state.vitality,
          metrics: { ...metrics, gold: metrics.gold + amount },
          ledger: { ...ledger, history: [...ledger.history, newRecord] }
        }
      };
    });
  },

  modifyStats: (changes) => {
    set((state: GameState) => {
      const m = state.vitality.metrics;
      const newMetrics = { ...m };
      
      if (changes.maxHp) newMetrics.maxHp += changes.maxHp;
      if (changes.maxSan) newMetrics.maxSan += changes.maxSan;
      
      if (changes.hp) newMetrics.hp = Math.min(newMetrics.maxHp, Math.max(0, m.hp + changes.hp));
      if (changes.san) newMetrics.san = Math.min(newMetrics.maxSan, Math.max(0, m.san + changes.san));

      if (changes.addiction) {
        newMetrics.addiction = Math.min(100, Math.max(0, m.addiction + changes.addiction));
      }
      
      if (changes.resistance) {
        newMetrics.resistance = Math.min(100, Math.max(0, m.resistance + changes.resistance));
      }

      return { vitality: { ...state.vitality, metrics: newMetrics } };
    });
  },

  contractDisease: (diseaseId) => {
    const state = get();
    if (state.vitality.activeDiseases.includes(diseaseId)) return;

    const diseaseData = state.gameDataCache?.diseases?.find((d: Disease) => d.id === diseaseId);
    if (diseaseData) {
      state.addNotification(`确诊: ${diseaseData.name}`, 'warning');
    }

    set((s: GameState) => ({
      vitality: {
        ...s.vitality,
        activeDiseases: [...s.vitality.activeDiseases, diseaseId]
      }
    }));
  },

  cureDisease: (diseaseId) => {
    set((s: GameState) => ({
      vitality: {
        ...s.vitality,
        activeDiseases: s.vitality.activeDiseases.filter(id => id !== diseaseId)
      }
    }));
    get().addNotification(`疾病已治愈`, 'success');
  },

  advanceTurn: () => {
    const state = get();
    const { metrics, activeDiseases } = state.vitality;
    const diseaseDB = state.gameDataCache?.diseases || [];
    
    // 1. 每日致病检查
    if (!state.prison?.inJail) {
      const newDiseaseId = checkDailyDisease(state);
      if (newDiseaseId) {
        get().contractDisease(newDiseaseId);
        const dInfo = diseaseDB.find((d: any) => d.id === newDiseaseId);
        if (dInfo?.type === 'ACUTE') {
          state.addNotification("紧急医疗警报：检测到急性病症！", "error");
        }
      }
    }

    // 2. 生理结算 (Addiction Decay)
    let newAddiction = metrics.addiction;
    if (newAddiction > 0) {
      newAddiction = Math.max(0, newAddiction - 5);
      if (metrics.addiction > 60) {
        state.modifyStats({ san: -5 });
        state.addNotification("严重的药物戒断反应 (SAN -5)", 'warning');
      }
    }

    // 3. 疾病结算 (Disease Tick)
    let totalHpLoss = 0;
    let totalSanLoss = 0;
    
    activeDiseases.forEach((dId: string) => {
      const disease = diseaseDB.find((d: Disease) => d.id === dId);
      if (!disease) return;

      if (disease.type === 'CHRONIC' && disease.effects.hpDrain) {
        totalHpLoss += disease.effects.hpDrain;
      }
      if (disease.type === 'MENTAL' && disease.effects.sanDrain) {
        totalSanLoss += disease.effects.sanDrain;
      }
    });

    // 应用扣血/扣San/成瘾衰退
    if (totalHpLoss > 0 || totalSanLoss > 0) {
       state.modifyStats({ 
         hp: -totalHpLoss, 
         san: -totalSanLoss,
         addiction: (newAddiction - metrics.addiction) 
       });
       
       if (totalHpLoss > 0) state.addNotification(`疾病折磨: HP -${totalHpLoss}`, 'HP');
       if (totalSanLoss > 0) state.addNotification(`精神侵蚀: SAN -${totalSanLoss}`, 'SAN');
    } else {
       state.modifyStats({ addiction: (newAddiction - metrics.addiction) });
    }

    // === ✅ 新增: 自动扣除保险费 (Step 4 Logic) ===
    // 检查全局状态中的 activeInsurance (它不在 vitality slice 里，而在顶层)
    const activeInsurance = state.activeInsurance; 
    
    // 只有非监狱状态且拥有保险，且费用 > 0 时扣费
    if (!state.prison?.inJail && activeInsurance && activeInsurance.weeklyCost > 0) {
       get().addTransaction(
         'BANK', 
         -activeInsurance.weeklyCost, 
         `保险费: ${activeInsurance.name}`
       );
    }

    // 4. 推进时间
    set((s: GameState) => ({
      vitality: {
        ...s.vitality,
        time: {
          ...s.vitality.time,
          currentTurn: s.vitality.time.currentTurn + 1
        }
      }
    }));
  },
  
  clearWeeklyLedger: () => {
    set((state: GameState) => ({
      vitality: {
        ...state.vitality,
        ledger: { history: [] }
      }
    }));
  }
});