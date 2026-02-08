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
// ✅ 1. 引入配置文件群 (Configuration Swarm)
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json'; // 引入全局规则(Caps)
import rules from '@/assets/data/rules/vitalityRules.json';
import medicalRules from '@/assets/data/rules/medicalRules.json';

export interface VitalitySlice {
  vitality: VitalityState;
  initGame: (selectedClass: PlayerClass) => void;
  addTransaction: (category: LedgerCategory, amount: number, description: string) => { success: boolean; actualAmount: number };
  modifyStats: (changes: Partial<VitalityState['metrics']>) => void;
  updateIdentityPoints: (points: { red?: number; wolf?: number; old?: number }) => void;
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
    // ✅ Use Spread from JSON
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
    activeJobs: []
  },

  initGame: (selectedClass) => {
    const classConfig = CLASS_INITIAL_STATS[selectedClass];
    if (!classConfig) return;

    // ✅ 获取配置常量 (Single Source of Truth)
    const { maxSan, maxHunger } = INITIAL_STATE.vitality;
    const { startPrice } = INITIAL_STATE.crypto;
    const { creditScore } = rules.defaults; // 或从 rules 读取

    set((state) => ({
      vitality: {
        ...state.vitality,
        metrics: {
          ...state.vitality.metrics,
          gold: classConfig.gold,
          hp: classConfig.hp,
          maxHp: classConfig.maxHp ?? classConfig.hp, // 使用配置的 maxHp，若无则回退到 hp
          
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
          hiddenTags: [],
          triggeredEvents: [] // ✅ 新游戏重置已触发事件列表
        },
        activeJobs: []
      },
      // 重置子系统
      faith: { id: FaithID.NONE, level: 1, hasPerformedRite: false, debuffs: [], bannedFaiths: [] },
      prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 },
      
      // ✅ Fix: Crypto 重置逻辑与 initial_state.json 保持一致
      crypto: {
          isAccountOpen: false,
          btcPrice: startPrice,
          positions: [],
          priceHistory: Array(7).fill(startPrice),
          weeklyNews: null
      },
      
      currentRegion: RegionID.Slums,
      activeHousing: null,
      activeInsurance: null,
      inventory: [],
      bank: { activeLoans: [], lifetimeInterestPaid: 0 }
    }));
  },

  addTransaction: (category, amount, description) => {
     // 使用变量存储结果，避免闭包问题
     let success = true;
     let actualAmount = amount;
     
     set((state: any) => {
        const currentGold = state.vitality.metrics.gold;
        const newGold = currentGold + amount;
        
        // 🔴 Gold 不能为负数 - 拒绝交易
        if (newGold < 0) {
          success = false;
          actualAmount = 0;
          // 发送通知但不执行交易
          if (state.addNotification) {
            state.addNotification(`资金不足！需要 $${Math.abs(amount)}，当前 $${currentGold}`, 'error');
          }
          return {}; // 不修改状态
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
  
  /**
   * 判定并更新阶级
   * 返回是否发生了阶级变化
   */
  recalculateClass: () => {
    const state = get() as GameState;
    const { newClass, netWorth, reason } = determineClass(state);
    const oldClass = state.vitality.identity.currentClass;
    
    if (hasClassChanged(state, newClass)) {
      // 阶级发生变化
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
            // 跌落时重置债务计数器
            debtTurns: newClass === PlayerClass.Homeless && oldClass !== PlayerClass.Homeless 
              ? 0 
              : prev.vitality.flags.debtTurns
          }
        }
      }));
      
      // 发送通知
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
    // ✅ 使用 SYSTEM_RULES.caps 进行安全钳制
    const { minStat, maxStat } = SYSTEM_RULES.caps;
    const metrics = state.vitality.metrics;
    
    // 创建新的 metrics，对需要钳制的属性进行边界检查
    const newMetrics = { ...metrics, ...changes };
    
    // 对关键属性进行钳制
    if (changes.hp !== undefined) {
      newMetrics.hp = Math.max(minStat, Math.min(metrics.maxHp ?? maxStat, changes.hp));
    }
    if (changes.san !== undefined) {
      newMetrics.san = Math.max(minStat, Math.min(metrics.maxSan ?? maxStat, changes.san));
    }
    if (changes.gold !== undefined) {
      // 金钱通常不设上限，但确保不低于 minStat (通常是 0)
      newMetrics.gold = Math.max(minStat, changes.gold);
    }
    if (changes.addiction !== undefined) {
      newMetrics.addiction = Math.max(minStat, Math.min(maxStat, changes.addiction));
    }
    if (changes.resistance !== undefined) {
      newMetrics.resistance = Math.max(minStat, Math.min(maxStat, changes.resistance));
    }
    if (changes.hunger !== undefined) {
      newMetrics.hunger = Math.max(minStat, Math.min(metrics.maxHunger ?? maxStat, changes.hunger));
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

    const txResult = state.addTransaction('MEDICAL', -finalCost, `治疗: ${service.name}`);
    if (!txResult.success) {
        return { success: false, msg: "资金不足以支付治疗费用" };
    }

    // 计算风险
    const baseRisk = service.requirements?.riskRate || 0;
    const riskMultiplier = medicalRules.settings?.baseRiskMultiplier || 1.0;
    const finalRiskRate = Math.min(baseRisk * riskMultiplier, 1.0);

    const isSuccess = Math.random() >= finalRiskRate;
    const effects = service.effects || {};
    
    // ✅ Fix: 获取全局属性上下限配置
    const { minStat, maxStat } = SYSTEM_RULES.caps; 

    if (isSuccess) {
        const addictionGain = effects.addiction || 0;
        
        // ✅ Fix: 使用 metrics.maxHp/maxSan 动态上限，HP/SAN 下限使用配置 minStat
        const newHp = Math.min(metrics.maxHp, Math.max(minStat, metrics.hp + (effects.hpRestore || 0)));
        const newSan = Math.min(metrics.maxSan, Math.max(minStat, metrics.san + (effects.sanRestore || 0)));
        
        // 修正：成瘾度上限不再写死 100，而是读取配置
        const newAddiction = Math.min(maxStat, Math.max(minStat, metrics.addiction + addictionGain));

        state.modifyStats({
            hp: newHp,
            san: newSan,
            addiction: newAddiction
        });
        return { success: true, msg: `治疗成功。${service.flavorText || ''}` };
    } else {
        // 失败逻辑
        const failure = rules.medical?.failurePenalty || { hp: -10, san: -5 }; // 防御性读取
        
        const newHp = Math.max(minStat, metrics.hp + (failure.hp || -10));
        const newSan = Math.max(minStat, metrics.san + (failure.san || -5));
        
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
    // 防御性检查：确保疾病数据已加载
    if (!state.gameDataCache?.diseases) {
      console.warn('[Vitality] gameDataCache.diseases 未初始化，跳过疾病检查');
    }
    const allDiseases = state.gameDataCache?.diseases || [];
    
    // 检查是否患上新疾病
    const newDiseaseId = checkDailyDisease(state, allDiseases);
    
    // 过滤掉已存在的疾病ID，避免重复
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