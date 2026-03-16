import { StateCreator } from 'zustand';
import {
  PlayerClass,
  RegionID,
  FaithID,
  Ending
} from '@/types/schema';
import { CLASS_INITIAL_STATS } from './createPlayerSlice';
import { checkDailyDisease } from '@/logic/health';
import { determineClass, hasClassChanged, getClassChangeDesc } from '@/logic/class';
import { checkSurvival } from '@/logic/survivalCalculator';
import { SurvivalBuff } from '@/types/schema';
import { StoreState } from '@/types/store';
import { resolveEnding } from '@/logic/endings';
import endingsData from '@/assets/data/endings.json';
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';
import { useAudioStore } from '@/store/useAudioStore';

import hospitalData from '@/assets/data/hospital_services.json';
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';
import rules from '@/assets/data/rules/vitality_rules.json';
import bankRules from '@/assets/data/rules/bank_rules.json';
import { globalTimerManager } from '@/hooks/useGameTimer';

// 从子模块导入类型和工具
import { VitalitySlice } from './vitality/types';
export type { ClassChangeInfo, VitalitySlice } from './vitality/types';

// 工具函数（通过 transaction.ts 间接使用）
// import { generateId, limitArrayLength, MAX_LEDGER_HISTORY } from './vitality/utils';

// 医疗模块
import {
  performTreatment,
  contractDisease,
  cureDisease,
  scheduleAppointment,
  cancelAppointment
} from './vitality/medical';

// Buff 模块
import {
  addSurvivalBuff,
  removeSurvivalBuff,
  processBuffs,
  applyEventBuff,
  applyItemBuff
} from './vitality/buffs';

// 交易模块
import {
  addTransaction,
  clearWeeklyLedger
} from './vitality/transaction';

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
    activeInsurances: [],
    activeBuffs: [],
    pendingMedicalBills: [],
    deductibleTrackers: [],
    medicalAppointments: [],
  },
  
  // 待处理的阶级变化
  pendingClassChanges: [],
  
  initGame: (selectedClass) => {
    const classConfig = CLASS_INITIAL_STATS[selectedClass];
    if (!classConfig) return;

    const { maxInsight, maxHunger } = INITIAL_STATE.vitality;
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
          insight: classConfig.insight,
          maxInsight: maxInsight, 
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
        activeJobs: [],
        activeBuffs: [],
        pendingMedicalBills: [],
        deductibleTrackers: [],
        medicalAppointments: []
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
          weeklyNews: null,
          weeklyTradesCount: 0,
          lastTradeTurn: -1
      },
      
      currentRegion: RegionID.Slums,
      activeHousing: null,
      activeInsurances: [],
      inventory: [],
      bank: { activeLoans: [], lifetimeInterestPaid: 0 },
      shopInventory: {
        [RegionID.Slums]: [],
        [RegionID.RustBelt]: [],
        [RegionID.Suburbs]: [],
        [RegionID.Downtown]: []
      } // 🏪 将在游戏初始化后由 refreshShopInventory 填充
    }));
    
    // 🏪 初始化商店库存（使用全局定时器管理器）
    globalTimerManager.setTimeout(() => {
      const store = get() as any;
      if (store.refreshShopInventory) {
        store.refreshShopInventory();
      }
    }, 0);
  },

  addTransaction: (category, amount, description) => 
    addTransaction(get, set, category, amount, description),
  
  recalculateClass: () => {
    const state = get() as StoreState;
    const { newClass, netWorth, reason } = determineClass(state);
    const oldClass = state.vitality.identity.currentClass;
    
    if (hasClassChanged(state, newClass)) {
      const desc = getClassChangeDesc(oldClass, newClass);
      
      // 判断升级/降级
      const classOrder = ['HOMELESS', 'WORKER', 'MIDDLE', 'CAPITALIST'];
      const oldIndex = classOrder.indexOf(oldClass);
      const newIndex = classOrder.indexOf(newClass);
      const isUpgrade = newIndex > oldIndex;
      
      // 播放音效（业务逻辑层）
      const { playSfx } = useAudioStore.getState();
      playSfx(isUpgrade ? 'sfx_class_upgrade' : 'sfx_class_downgrade');
      
      // 设置待处理的阶级变化（入队）
      const classChangeInfo = {
        oldClass,
        newClass,
        netWorth,
        reason,
        timestamp: Date.now()
      };
      
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
        },
        pendingClassChanges: [...prev.pendingClassChanges, classChangeInfo]  // 入队
      }));
      
      const store = get() as any;
      if (store.addNotification) {
        store.addNotification(`${isUpgrade ? '⬆️' : '⬇️'} ${desc} (资产: $${netWorth.toLocaleString()})`, isUpgrade ? 'success' : 'warning');
      }
      
      return { changed: true, oldClass, newClass, netWorth, reason };
    }
    
    return { changed: false, oldClass, newClass, netWorth, reason };
  },
  
  // 清除待处理的阶级变化（出队）
  clearPendingClassChange: () => {
    set((state: any) => ({
      pendingClassChanges: state.pendingClassChanges.slice(1)  // 移除队首
    }));
  },

  modifyStats: (changes) => set((state: any) => {
    const { minStat, maxStat } = SYSTEM_RULES.caps;
    const metrics = state.vitality.metrics;
    
    // ✅ 辅助函数：安全处理数值（防止 Infinity/NaN）
    const sanitizeValue = (value: number, defaultValue: number): number => {
      if (!isFinite(value) || isNaN(value)) {
        console.warn(`[modifyStats] 收到无效值: ${value}，使用默认值: ${defaultValue}`);
        return defaultValue;
      }
      return value;
    };
    
    // 创建新的 metrics
    const newMetrics = { ...metrics, ...changes };
    
    // ✅ Fix: 获取“生效中”的最大值。如果 changes 里有 maxHp，优先用 changes 的，否则用当前的
    // 这样可以确保如果 maxHp 被削减（比如信仰惩罚），当前的 hp 钳制逻辑会使用新的更低的 maxHp
    const effectiveMaxHp = changes.maxHp !== undefined ? changes.maxHp : (metrics.maxHp ?? maxStat);
    const effectiveMaxInsight = changes.maxInsight !== undefined ? changes.maxInsight : (metrics.maxInsight ?? maxStat);
    const effectiveMaxHunger = metrics.maxHunger ?? maxStat;

    // 对关键属性进行钳制（带 Infinity/NaN 防护）
    if (changes.hp !== undefined) {
      const safeHp = sanitizeValue(changes.hp, metrics.hp);
      newMetrics.hp = Math.max(minStat, Math.min(effectiveMaxHp, safeHp));
    }
    if (changes.insight !== undefined) {
      const safeInsight = sanitizeValue(changes.insight, metrics.insight);
      newMetrics.insight = Math.max(minStat, Math.min(effectiveMaxInsight, safeInsight));
    }
    if (changes.gold !== undefined) {
      const GOLD_MAX = 999999999;
      const safeGold = sanitizeValue(changes.gold, metrics.gold);
      newMetrics.gold = Math.max(minStat, Math.min(GOLD_MAX, safeGold));
    }
    if (changes.addiction !== undefined) {
      const safeAddiction = sanitizeValue(changes.addiction, metrics.addiction);
      newMetrics.addiction = Math.max(minStat, Math.min(maxStat, safeAddiction));
    }
    if (changes.resistance !== undefined) {
      const safeResistance = sanitizeValue(changes.resistance, metrics.resistance);
      newMetrics.resistance = Math.max(minStat, Math.min(maxStat, safeResistance));
    }
    if (changes.hunger !== undefined) {
      const safeHunger = sanitizeValue(changes.hunger, metrics.hunger);
      newMetrics.hunger = Math.max(minStat, Math.min(effectiveMaxHunger, safeHunger));
    }
    // ✅ 修复：钳制 creditScore (信用分范围 [300, 850])
    if (changes.creditScore !== undefined) {
      const { minScore, maxScore } = bankRules.creditScore;
      const safeCredit = sanitizeValue(changes.creditScore, metrics.creditScore);
      newMetrics.creditScore = Math.max(minScore, Math.min(maxScore, safeCredit));
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

  performTreatment: (serviceId) => performTreatment(get, set, serviceId),

  // ==========================================
  // 疾病管理（已由医疗模块实现）
  // ==========================================
  
  contractDisease: (diseaseId) => contractDisease(set, diseaseId),
  
  cureDisease: (diseaseId) => cureDisease(set, diseaseId),

  // ==========================================
  // 医疗排期管理（已由医疗模块实现）
  // ==========================================
  
  scheduleAppointment: (serviceId, deposit) => scheduleAppointment(get, set, serviceId, deposit),
  
  cancelAppointment: (appointmentId) => cancelAppointment(get, set, appointmentId),

  advanceTurn: () => set((state: StoreState) => {
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
      get().applyEventBuff('DISEASE_CONTRACTED');
    }

    const { decay } = checkSurvival(state);
    const { hpChange: buffHpChange, insightChange: buffInsightChange } = get().processBuffs();
    
    const currentMetrics = state.vitality.metrics;
    const totalHpChange = decay.hpDecay + buffHpChange;
    const totalInsightChange = decay.sanDecay + buffInsightChange;
    
    const newHp = Math.max(0, Math.min(currentMetrics.maxHp || 100, currentMetrics.hp + totalHpChange));
    const newInsight = Math.min(currentMetrics.maxInsight || 100, currentMetrics.insight + totalInsightChange);
    
    updates.metrics = {
      ...currentMetrics,
      hp: newHp,
      insight: newInsight
    };
    
    if (newHp <= 0) {
      if (state.triggerEnding) {
        const endingId = resolveEnding(state, endingsData as unknown as Ending[], ENDING_RULES.constraints.maxTurns, 'HP_DEPLETED');
        state.triggerEnding(endingId);
      }
    }
    
    if (state.addNotification) {
      if (decay.level === 'CRITICAL') {
        state.addNotification('⚠️ 生命危险！环境极度恶劣', 'error');
      } else if (decay.level === 'DANGER') {
        state.addNotification('⚠️ 健康状况堪忧', 'warning');
      }
    }
    
    globalTimerManager.setTimeout(() => {
      const store = get() as any;
      if (store.refreshShopInventory) {
        store.refreshShopInventory();
      }
    }, 0);

    const pendingBills = state.vitality.pendingMedicalBills || [];
    const currentTurn = state.vitality.time.currentTurn + 1;
    const triggeredBills: any[] = [];
    const remainingBills: any[] = [];

    for (const bill of pendingBills) {
      if (bill.triggerTurn <= currentTurn) {
        triggeredBills.push(bill);
      } else {
        remainingBills.push(bill);
      }
    }

    let totalBillAmount = 0;
    const billMessages: string[] = [];
    
    for (const bill of triggeredBills) {
      totalBillAmount += bill.deferredAmount;
      if (state.addNotification) {
        const surprisePrefix = bill.isSurprise ? "【惊喜账单】" : "【医疗账单】";
        state.addNotification(`${surprisePrefix} 收到${bill.description}账单 $${bill.deferredAmount}`, 'warning');
      }
      billMessages.push(`${bill.description}: $${bill.deferredAmount}`);
    }

    if (triggeredBills.length > 0) {
      const currentGold = updates.metrics?.gold ?? state.vitality.metrics.gold;
      
      if (currentGold >= totalBillAmount) {
        updates.metrics = { ...updates.metrics, gold: currentGold - totalBillAmount };
        if (state.addTransaction) {
          state.addTransaction('MEDICAL', -totalBillAmount, `延迟医疗账单: ${billMessages.join(', ')}`);
        }
        if (state.addNotification) {
          state.addNotification(`已自动扣除医疗账单 $${totalBillAmount}`, 'info');
        }
      } else {
        const shortfall = totalBillAmount - currentGold;
        updates.metrics = { ...updates.metrics, gold: 0 };
        
        const collectionBuff = {
          id: `buff_medical_collection_${Date.now()}`,
          name: '医疗债务催收',
          description: `未支付的医疗账单$${shortfall}已进入催收程序。信用评分严重受损，无法申请贷款或购买中产房产。`,
          duration: 999, maxDuration: 999,
          effects: { perTurn: {}, onApply: { clearStatus: [] } },
          source: 'medical_debt', stackable: true, maxStacks: 3, stacks: 1,
          data: { creditScoreModifier: -200, loanBlacklist: true, housingBlacklist: ['MIDDLE', 'CAPITALIST'] }
        };
        
        get().addSurvivalBuff(collectionBuff);
        
        if (state.addNotification) {
          state.addNotification(`⚠️ 医疗账单$${totalBillAmount}无法支付！已进入催收程序。`, 'error');
        }
        get().applyEventBuff('MEDICAL_DEBT_COLLECTIONS');
      }
    }
    updates.pendingMedicalBills = remainingBills;

    const appointments = state.vitality.medicalAppointments || [];
    const dueAppointments: any[] = [];
    const remainingAppointments: any[] = [];

    for (const appt of appointments) {
      if (appt.scheduledTurn <= currentTurn) { dueAppointments.push(appt); }
      else { remainingAppointments.push(appt); }
    }

    for (const appt of dueAppointments) {
      const apptService = (hospitalData as any[]).find((s: any) => s.id === appt.serviceId);
      if (apptService) {
        const serviceEffects = apptService.effects || {};
        const currentMetrics = updates.metrics || state.vitality.metrics;
        
        if (state.addNotification) {
          const hasDeferredPayment = apptService.deferredPayment;
          if (hasDeferredPayment) {
            state.addNotification(`🏥 预约手术时间到：${appt.serviceName}。手术已完成，延迟账单将在后续回合到达。`, 'info');
          } else {
            const remainingCost = apptService.baseCost - appt.depositPaid;
            if (remainingCost > 0) {
              state.addNotification(`🏥 预约手术时间到：${appt.serviceName}。需支付尾款 $${remainingCost}`, 'info');
            }
          }
        }
        
        let newMetrics = { ...currentMetrics };
        if (serviceEffects.hpRestore) {
          newMetrics.hp = Math.min(newMetrics.maxHp, newMetrics.hp + serviceEffects.hpRestore);
        }
        if (serviceEffects.insightRestore) {
          newMetrics.insight = Math.min(newMetrics.maxInsight, newMetrics.insight + serviceEffects.insightRestore);
        }
        if (serviceEffects.addiction) {
          newMetrics.addiction = Math.min(100, Math.max(0, newMetrics.addiction + serviceEffects.addiction));
        }
        
        if (serviceEffects.cureDisease || serviceEffects.cureDiseases) {
          const diseasesToCure = serviceEffects.cureDiseases || [serviceEffects.cureDisease];
          const currentDiseases = updates.activeDiseases || state.vitality.activeDiseases || [];
          updates.activeDiseases = currentDiseases.filter((d: string) => !diseasesToCure.includes(d));
        }
        
        updates.metrics = newMetrics;
        
        if (!apptService.deferredPayment) {
          const remainingCost = apptService.baseCost - appt.depositPaid;
          if (remainingCost > 0) {
            const currentGold = updates.metrics?.gold ?? state.vitality.metrics.gold;
            if (currentGold < remainingCost) {
              if (state.addNotification) {
                state.addNotification(`❌ 手术失败：${appt.serviceName}。资金不足，医院拒绝进行手术。`, 'error');
              }
              continue;
            }
            
            const txResult = state.addTransaction?.('MEDICAL', -remainingCost, `手术尾款: ${appt.serviceName}`);
            if (txResult?.success !== false) {
              updates.metrics = { ...updates.metrics, gold: Math.max(0, (updates.metrics?.gold ?? state.vitality.metrics.gold) - remainingCost) };
            }
          }
        }
        
        if (state.addNotification) {
          state.addNotification(`✅ 手术完成：${appt.serviceName}。${apptService.flavorText || ''}`, 'success');
        }
      }
    }
    updates.medicalAppointments = remainingAppointments;

    return { vitality: { ...state.vitality, ...updates } };
  }),

  clearWeeklyLedger: () => clearWeeklyLedger(set),

  // ==========================================
  // 原 performTreatment 函数已迁移到 ./vitality/medical.ts
  // 原 Buff 管理方法已迁移到 ./vitality/buffs.ts
  // 保留注释供参考：

  // ==========================================
  // Buff管理方法（已委托给子模块）
  // ==========================================
  
  addSurvivalBuff: (buff: SurvivalBuff) => addSurvivalBuff(get, set, buff),
  
  removeSurvivalBuff: (buffId: string) => removeSurvivalBuff(set, buffId),
  
  processBuffs: () => processBuffs(get, set),
  
  applyEventBuff: (eventId: string) => applyEventBuff(get, eventId),
  
  applyItemBuff: (buffId: string, customDuration?: number) => applyItemBuff(get, buffId, customDuration)
});