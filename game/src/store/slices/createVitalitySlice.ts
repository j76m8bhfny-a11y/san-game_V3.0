import { StateCreator } from 'zustand';
import {
  VitalityState,
  PlayerClass,
  LedgerCategory,
  GameState,
  RegionID,
  FaithID
} from '@/types/schema';
import { CLASS_INITIAL_STATS } from './createPlayerSlice';
import { calculateMedicalCost } from '@/logic/medical';
import { checkDailyDisease } from '@/logic/health';
import { determineClass, hasClassChanged, getClassChangeDesc } from '@/logic/class';
import { StoreState } from '@/types/store';

import hospitalData from '@/assets/data/hospital_services.json';
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';
import rules from '@/assets/data/rules/vitalityRules.json';
import medicalRules from '@/assets/data/rules/medicalRules.json';

export interface VitalitySlice {
  vitality: VitalityState;
  initGame: (selectedClass: PlayerClass) => void;
  addTransaction: (category: LedgerCategory, amount: number, description: string) => { success: boolean; actualAmount: number };
  modifyStats: (changes: Partial<VitalityState['metrics']>) => void;
  updateIdentityPoints: (points: { red?: number; wolf?: number; old?: number }) => void;
  updateFlags: (changes: Partial<VitalityState['flags']>) => void;
  contractDisease: (diseaseId: string) => void;
  cureDisease: (diseaseId: string) => void;
  advanceTurn: () => void;
  clearWeeklyLedger: () => void;
  performTreatment: (serviceId: string) => { success: boolean; msg: string };
  recalculateClass: () => { 
    changed: boolean; 
    oldClass?: PlayerClass; 
    newClass?: PlayerClass; 
    netWorth?: number; 
    reason?: string;
  };
}

const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

export const createVitalitySlice: StateCreator<StoreState, [], [], VitalitySlice> = (set, get) => ({
  vitality: {
    metrics: { ...INITIAL_STATE.vitality },
    identity: { 
        currentClass: INITIAL_STATE.identity.defaultClass as PlayerClass, 
        points: { ...INITIAL_STATE.identity.points } 
    },
    time: { ...INITIAL_STATE.time, currentTurn: INITIAL_STATE.time.startTurn, totalTurns: 1 },
    activeDiseases: [],
    ledger: { history: [] },
    flags: { 
            ...INITIAL_STATE.flags, 
            hiddenTags: [] 
        },
    activeJobs: [],
    activeInsurances: []
  },

  initGame: (selectedClass) => {
    const classConfig = CLASS_INITIAL_STATS[selectedClass];
    if (!classConfig) return;

    const { maxSan, maxHunger } = INITIAL_STATE.vitality;
    const { startPrice } = INITIAL_STATE.crypto;
    const creditScore = rules.defaults?.creditScore || { homeless: 500, standard: 650 };

    set((state) => ({
      vitality: {
        ...state.vitality,
        metrics: {
          ...state.vitality.metrics,
          gold: classConfig.gold,
          hp: classConfig.hp,
          maxHp: classConfig.maxHp ?? classConfig.hp,
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
          hiddenTags: [],
          triggeredEvents: []
        },
        activeJobs: []
      },
      
      // ✅ Fix: 适配新的 FaithState 结构，初始化 behaviorState
      faith: { 
        id: FaithID.NONE, 
        level: 1, 
        hasPerformedRite: false, 
        debuffs: [], 
        bannedFaiths: [],
        behaviorState: {
          lastAction: null,
          currentStreak: 0,
          hasReceivedInvitation: false
        }
      },
      
      prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 },
      
      crypto: {
          isAccountOpen: false,
          btcPrice: startPrice,
          positions: [],
          priceHistory: Array(7).fill(startPrice),
          weeklyNews: null
      },
      
      currentRegion: RegionID.Slums,
      activeHousing: null,
      activeInsurances: [],
      inventory: [],
      bank: { activeLoans: [], lifetimeInterestPaid: 0 }
    }));
  },

  addTransaction: (category, amount, description) => {
     let success = true;
     let actualAmount = amount;
     
     set((state: any) => {
        const currentGold = state.vitality.metrics.gold;
        const newGold = currentGold + amount;
        
        if (newGold < 0) {
          success = false;
          actualAmount = 0;
          if (state.addNotification) {
            state.addNotification(`资金不足！需要 $${Math.abs(amount)}，当前 $${currentGold}`, 'error');
          }
          return {}; 
        }
        
        const newRecord = {
            id: generateId(),
            turn: state.vitality.time.currentTurn,
            category,
            amount,
            description,
            timestamp: Date.now()
        };
        
        return {
            vitality: {
                ...state.vitality,
                metrics: { ...state.vitality.metrics, gold: newGold },
                ledger: { history: [...state.vitality.ledger.history, newRecord] }
            }
        };
     });
     
     return { success, actualAmount };
  },
  
  recalculateClass: () => {
    const state = get() as GameState;
    const { newClass, netWorth, reason } = determineClass(state);
    const oldClass = state.vitality.identity.currentClass;
    
    if (hasClassChanged(state, newClass)) {
      const desc = getClassChangeDesc(oldClass, newClass);
      
      set((prev: any) => ({
        vitality: {
          ...prev.vitality,
          identity: {
            ...prev.vitality.identity,
            currentClass: newClass
          },
          flags: {
            ...prev.vitality.flags,
            debtTurns: newClass === PlayerClass.Homeless && oldClass !== PlayerClass.Homeless 
              ? 0 
              : prev.vitality.flags.debtTurns
          }
        }
      }));
      
      const store = get() as any;
      if (store.addNotification) {
        const isUpgrade = 
          (oldClass === PlayerClass.Homeless && newClass !== PlayerClass.Homeless) ||
          (oldClass === PlayerClass.Worker && (newClass === PlayerClass.Middle || newClass === PlayerClass.Capitalist)) ||
          (oldClass === PlayerClass.Middle && newClass === PlayerClass.Capitalist);
        
        store.addNotification(`${isUpgrade ? '⬆️' : '⬇️'} ${desc} (资产: $${netWorth.toLocaleString()})`, isUpgrade ? 'success' : 'warning');
      }
      
      return { changed: true, oldClass, newClass, netWorth, reason };
    }
    
    return { changed: false, oldClass, newClass, netWorth, reason };
  },

  modifyStats: (changes) => set((state: any) => {
    const { minStat, maxStat } = SYSTEM_RULES.caps;
    const metrics = state.vitality.metrics;
    
    // 创建新的 metrics
    const newMetrics = { ...metrics, ...changes };
    
    // ✅ Fix: 获取“生效中”的最大值。如果 changes 里有 maxHp，优先用 changes 的，否则用当前的
    // 这样可以确保如果 maxHp 被削减（比如信仰惩罚），当前的 hp 钳制逻辑会使用新的更低的 maxHp
    const effectiveMaxHp = changes.maxHp !== undefined ? changes.maxHp : (metrics.maxHp ?? maxStat);
    const effectiveMaxSan = changes.maxSan !== undefined ? changes.maxSan : (metrics.maxSan ?? maxStat);
    const effectiveMaxHunger = metrics.maxHunger ?? maxStat;

    // 对关键属性进行钳制
    if (changes.hp !== undefined) {
      newMetrics.hp = Math.max(minStat, Math.min(effectiveMaxHp, changes.hp));
    }
    if (changes.san !== undefined) {
      newMetrics.san = Math.max(minStat, Math.min(effectiveMaxSan, changes.san));
    }
    if (changes.gold !== undefined) {
      newMetrics.gold = Math.max(minStat, changes.gold);
    }
    if (changes.addiction !== undefined) {
      newMetrics.addiction = Math.max(minStat, Math.min(maxStat, changes.addiction));
    }
    if (changes.resistance !== undefined) {
      newMetrics.resistance = Math.max(minStat, Math.min(maxStat, changes.resistance));
    }
    if (changes.hunger !== undefined) {
      newMetrics.hunger = Math.max(minStat, Math.min(effectiveMaxHunger, changes.hunger));
    }
    
    return {
      vitality: {
          ...state.vitality,
          metrics: newMetrics
      }
    };
  }),

  updateIdentityPoints: (points) => set((state: any) => {
    const currentPoints = state.vitality.identity.points;
    return {
      vitality: {
        ...state.vitality,
        identity: {
          ...state.vitality.identity,
          points: {
            red: points.red !== undefined ? points.red : currentPoints.red,
            wolf: points.wolf !== undefined ? points.wolf : currentPoints.wolf,
            old: points.old !== undefined ? points.old : currentPoints.old,
          }
        }
      }
    };
  }),

  updateFlags: (changes) => set((state: any) => ({
    vitality: {
      ...state.vitality,
      flags: {
        ...state.vitality.flags,
        ...changes
      }
    }
  })),

  performTreatment: (serviceId) => {
    const state = get() as GameState & VitalitySlice;
    const { vitality } = state;
    const { metrics, activeInsurances } = vitality;
    
    // 获取医疗保险（用于医疗报销）
    const medicalInsurance = activeInsurances.find((ins: any) => ins.type === 'MEDICAL') || null;

    const service = (hospitalData as any[]).find(s => s.id === serviceId);
    if (!service) return { success: false, msg: "服务不可用" };

    const { finalCost } = calculateMedicalCost(service, medicalInsurance, vitality.identity.currentClass);

    if (vitality.metrics.gold < finalCost) {
        return { success: false, msg: "资金不足" };
    }

    const txResult = state.addTransaction('MEDICAL', -finalCost, `治疗: ${service.name}`);
    if (!txResult.success) {
        return { success: false, msg: "资金不足以支付治疗费用" };
    }

    const baseRisk = service.requirements?.riskRate || 0;
    const riskMultiplier = medicalRules.settings?.baseRiskMultiplier || 1.0;
    const finalRiskRate = Math.min(baseRisk * riskMultiplier, 1.0);

    const isSuccess = Math.random() >= finalRiskRate;
    const effects = service.effects || {};
    
    const { minStat, maxStat } = SYSTEM_RULES.caps; 

    if (isSuccess) {
        const addictionGain = effects.addiction || 0;
        
        // 这里的 maxHp/maxSan 使用当前的，如果是手术修改上限，会在 effects.hpCapMod 中体现，
        // 但这里简化处理，假设治疗只恢复数值
        const newHp = Math.min(metrics.maxHp, Math.max(minStat, metrics.hp + (effects.hpRestore || 0)));
        const newSan = Math.min(metrics.maxSan, Math.max(minStat, metrics.san + (effects.sanRestore || 0)));
        const newAddiction = Math.min(maxStat, Math.max(minStat, metrics.addiction + addictionGain));

        state.modifyStats({
            hp: newHp,
            san: newSan,
            addiction: newAddiction
        });
        return { success: true, msg: `治疗成功。${service.flavorText || ''}` };
    } else {
        const failure = rules.medical?.failurePenalty || { hp: -10, san: -5 };
        
        const newHp = Math.max(minStat, metrics.hp + (failure.hp || -10));
        const newSan = Math.max(minStat, metrics.san + (failure.san || -5));
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
    if (!state.gameDataCache?.diseases) {
      console.warn('[Vitality] gameDataCache.diseases 未初始化，跳过疾病检查');
    }
    const allDiseases = state.gameDataCache?.diseases || [];
    
    const newDiseaseId = checkDailyDisease(state, allDiseases);
    const existingDiseases = new Set(state.vitality.activeDiseases);
    const uniqueNewDiseaseId = newDiseaseId && !existingDiseases.has(newDiseaseId) ? newDiseaseId : null;

    let updates: any = {
      time: {
        currentTurn: state.vitality.time.currentTurn + 1,
        totalTurns: state.vitality.time.totalTurns + 1
      }
    };

    if (uniqueNewDiseaseId) {
      updates.activeDiseases = [...state.vitality.activeDiseases, uniqueNewDiseaseId];
      const diseaseName = allDiseases.find((d: any) => d.id === uniqueNewDiseaseId)?.name || uniqueNewDiseaseId;
      if (state.addNotification) {
        state.addNotification(`警告：你患上了 ${diseaseName}`, 'warning');
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