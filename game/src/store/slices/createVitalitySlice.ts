import { StateCreator } from 'zustand';
import {
  VitalityState,
  PlayerClass,
  LedgerCategory,
  RegionID,
  FaithID,
  Ending
} from '@/types/schema';
import { CLASS_INITIAL_STATS } from './createPlayerSlice';
import { calculateMedicalCost } from '@/logic/medical';
import { checkDailyDisease } from '@/logic/health';
import { determineClass, hasClassChanged, getClassChangeDesc } from '@/logic/class';
import { checkSurvival } from '@/logic/survivalCalculator';
import { SurvivalBuff } from '@/types/schema';
import buffConfig from '@/assets/data/rules/survival_buffs.json';
import { StoreState } from '@/types/store';
import { resolveEnding } from '@/logic/endings';
import endingsData from '@/assets/data/endings.json';
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';
import { useAudioStore } from '@/store/useAudioStore';

import hospitalData from '@/assets/data/hospital_services.json';
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';
import rules from '@/assets/data/rules/vitality_rules.json';
import medicalRules from '@/assets/data/rules/medical_rules.json';
import bankRules from '@/assets/data/rules/bank_rules.json';
import { executeTransactionSync, createStep } from '@/utils/transaction';
import { globalTimerManager } from '@/hooks/useGameTimer';

export interface ClassChangeInfo {
  oldClass: PlayerClass;
  newClass: PlayerClass;
  netWorth: number;
  reason: string;
  timestamp: number;
}

export interface VitalitySlice {
  vitality: VitalityState;
  pendingClassChanges: ClassChangeInfo[];  // 改为数组支持队列
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
  clearPendingClassChange: () => void;
  
  // Buff管理方法
  addSurvivalBuff: (buff: SurvivalBuff) => void;
  removeSurvivalBuff: (buffId: string) => void;
  processBuffs: () => { hpChange: number; insightChange: number; expiredBuffs: string[] };
  applyEventBuff: (eventId: string) => void;
  applyItemBuff: (buffId: string, customDuration?: number) => void;
  
  // 医疗排期管理
  scheduleAppointment: (serviceId: string, deposit: number) => { success: boolean; msg: string };
  cancelAppointment: (appointmentId: string) => { success: boolean; msg: string; refund: number };
}

const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

// 防止Buff触发循环的全局跟踪器
const processingTriggers = new Set<string>();

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

  addTransaction: (category, amount, description) => {
     // 同步获取当前状态，避免竞态条件
     const currentState = get();
     const currentGold = currentState.vitality.metrics.gold;
     const newGold = currentGold + amount;
     
     // 预先检查，避免负数金钱
     if (newGold < 0) {
       if (currentState.addNotification) {
         currentState.addNotification(`资金不足！需要 $${Math.abs(amount)}，当前 $${currentGold}`, 'error');
       }
       return { success: false, actualAmount: 0 };
     }
     
     let success = true;
     let actualAmount = amount;
     
     set((state: any) => {
        // 双重检查，确保状态一致性
        const checkGold = state.vitality.metrics.gold;
        if (checkGold + amount < 0) {
          success = false;
          actualAmount = 0;
          if (state.addNotification) {
            state.addNotification(`资金不足！需要 $${Math.abs(amount)}，当前 $${checkGold}`, 'error');
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
    
    // 创建新的 metrics
    const newMetrics = { ...metrics, ...changes };
    
    // ✅ Fix: 获取“生效中”的最大值。如果 changes 里有 maxHp，优先用 changes 的，否则用当前的
    // 这样可以确保如果 maxHp 被削减（比如信仰惩罚），当前的 hp 钳制逻辑会使用新的更低的 maxHp
    const effectiveMaxHp = changes.maxHp !== undefined ? changes.maxHp : (metrics.maxHp ?? maxStat);
    const effectiveMaxInsight = changes.maxInsight !== undefined ? changes.maxInsight : (metrics.maxInsight ?? maxStat);
    const effectiveMaxHunger = metrics.maxHunger ?? maxStat;

    // 对关键属性进行钳制
    if (changes.hp !== undefined) {
      newMetrics.hp = Math.max(minStat, Math.min(effectiveMaxHp, changes.hp));
    }
    if (changes.insight !== undefined) {
      newMetrics.insight = Math.max(minStat, Math.min(effectiveMaxInsight, changes.insight));
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
    // ✅ 修复：钳制 creditScore (信用分范围 [300, 850])
    if (changes.creditScore !== undefined) {
      const { minScore, maxScore } = bankRules.creditScore;
      newMetrics.creditScore = Math.max(minScore, Math.min(maxScore, changes.creditScore));
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
    const state = get() as StoreState;
    const { vitality } = state;
    const { metrics, activeInsurances, time, deductibleTrackers } = vitality;
    
    // 获取医疗保险（用于医疗报销）
    const medicalInsurance = activeInsurances.find((ins: any) => ins.type === 'MEDICAL') || null;

    const service = (hospitalData as any[]).find(s => s.id === serviceId);
    if (!service) return { success: false, msg: "服务不可用" };

    // ✅ 获取或创建免赔额追踪器（HDHP机制）
    let deductibleTracker = medicalInsurance 
      ? deductibleTrackers.find((dt: any) => dt.insuranceId === medicalInsurance.id)
      : undefined;
    
    if (medicalInsurance && !deductibleTracker && medicalInsurance.coverage?.deductible) {
      deductibleTracker = {
        insuranceId: medicalInsurance.id,
        deductible: medicalInsurance.coverage.deductible,
        currentSpent: 0,
        remaining: medicalInsurance.coverage.deductible,
        planYear: new Date().getFullYear(),
        isMet: false
      };
      // 添加到追踪器列表
      set((state: any) => ({
        vitality: {
          ...state.vitality,
          deductibleTrackers: [...state.vitality.deductibleTrackers, deductibleTracker]
        }
      }));
    }

    // ✅ 计算医疗费用（考虑保险和免赔额）
    const { finalCost, insuranceCoverage, deductibleStatus: _deductibleStatus } = calculateMedicalCost(
      service, 
      medicalInsurance, 
      vitality.identity.currentClass,
      deductibleTracker
    );

    // ✅ 更新免赔额追踪器（HDHP机制）
    if (deductibleTracker && finalCost > 0) {
      const newSpent = deductibleTracker.currentSpent + finalCost;
      const isMet = newSpent >= deductibleTracker.deductible;
      
      set((state: any) => ({
        vitality: {
          ...state.vitality,
          deductibleTrackers: state.vitality.deductibleTrackers.map((dt: any) => 
            dt.insuranceId === deductibleTracker!.insuranceId
              ? {
                  ...dt,
                  currentSpent: newSpent,
                  remaining: Math.max(0, deductibleTracker!.deductible - newSpent),
                  isMet
                }
              : dt
          )
        }
      }));

      // 如果刚满足免赔额，发送通知
      if (isMet && !deductibleTracker.isMet && state.addNotification) {
        state.addNotification(
          `🎉 恭喜！您已满足年度免赔额$${deductibleTracker.deductible}，后续医疗费用将正常报销！`,
          'success'
        );
      }
    }

    const { minStat, maxStat } = SYSTEM_RULES.caps;
    const baseRisk = service.requirements?.riskRate || 0;
    const riskMultiplier = medicalRules.settings?.baseRiskMultiplier || 1.0;
    const finalRiskRate = Math.min(baseRisk * riskMultiplier, 1.0);
    const isSuccess = Math.random() >= finalRiskRate;
    const effects = service.effects || {};

    // ✅ 排期机制（手术等待队列）
    const waitTurnsConfig = service.requirements?.waitTurns;
    if (waitTurnsConfig && waitTurnsConfig[0] > 0) {
      // 需要排期的手术
      const [minWait, maxWait] = waitTurnsConfig;
      const actualWait = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;
      const deposit = Math.floor(finalCost * 0.1); // 定金为10%
      
      // 检查是否已存在相同服务的预约
      const existingAppointment = vitality.medicalAppointments.find(
        (appt: any) => appt.serviceId === serviceId
      );
      if (existingAppointment) {
        return { 
          success: false, 
          msg: `您已经预约了${service.name}，预计${existingAppointment.scheduledTurn - time.currentTurn}回合后进行。` 
        };
      }
      
      // 检查定金
      if (metrics.gold < deposit) {
        return { success: false, msg: `需要支付$${deposit}定金才能预约。` };
      }
      
      // 扣除定金
      const txResult = state.addTransaction('MEDICAL', -deposit, `预约定金: ${service.name}`);
      if (!txResult.success) {
        return { success: false, msg: "资金不足以支付预约定金" };
      }
      
      // 创建预约
      const appointment = {
        id: `APPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        serviceId: service.id,
        serviceName: service.name,
        scheduledTurn: time.currentTurn + actualWait,
        depositPaid: deposit,
        canCancel: true,
        refundRate: 0.5,
      };
      
      // ✅ 如果服务还有延迟支付配置，预约时也要扣除挂号费并生成延迟账单
      let pendingBillId = null;
      if (service.deferredPayment) {
        const { upfrontCopay, delayTurns, description, isSurprise, collectionsRisk } = service.deferredPayment;
        
        // 检查是否有足够资金支付定金+挂号费
        if (upfrontCopay > 0 && metrics.gold < deposit + upfrontCopay) {
          return { success: false, msg: `需要支付定金$${deposit} + 挂号费$${upfrontCopay} = $${deposit + upfrontCopay}` };
        }
        
        // 扣除挂号费
        if (upfrontCopay > 0) {
          const copayResult = state.addTransaction('MEDICAL', -upfrontCopay, `挂号费: ${service.name}`);
          if (!copayResult.success) {
            return { success: false, msg: "资金不足以支付挂号费" };
          }
        }
        
        // 生成延迟账单（预约时生成，但 triggerTurn 应该是手术后）
        const pendingBill = {
          id: `DEFERRED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalServiceId: service.id,
          originalCost: finalCost,
          upfrontCopay: upfrontCopay || 0,
          deferredAmount: Math.floor(finalCost * 0.9), // 90% 尾款
          delayTurns: delayTurns,
          triggerTurn: time.currentTurn + actualWait + delayTurns, // 预约时间 + 延迟时间
          description: description || `${service.name}的后续账单`,
          isSurprise: isSurprise || false,
          collectionsRisk: collectionsRisk || 0.3,
          hospitalRegion: service.region,
          issuedTurn: time.currentTurn,
        };
        
        set((state: any) => ({
          vitality: {
            ...state.vitality,
            pendingMedicalBills: [...state.vitality.pendingMedicalBills, pendingBill]
          }
        }));
        
        pendingBillId = pendingBill.id;
      }

      set((state: any) => ({
        vitality: {
          ...state.vitality,
          medicalAppointments: [...state.vitality.medicalAppointments, appointment]
        }
      }));
      
      if (state.addNotification) {
        state.addNotification(
          `📅 预约成功：${service.name} 已排到 ${actualWait} 回合后`,
          'info'
        );
      }
      
      const deferredMsg = pendingBillId ? ` (${service.deferredPayment.delayTurns}回合后将收到延迟账单)` : '';
      return { 
        success: true, 
        msg: `预约成功！${service.name} 已排到 ${actualWait} 回合后。已支付定金 $${deposit}。${deferredMsg}` 
      };
    }

    // ✅ 延迟支付机制（达摩克利斯之剑）
    if (service.deferredPayment) {
      const { upfrontCopay, delayTurns, description, isSurprise, collectionsRisk } = service.deferredPayment;
      
      // 计算保险后自付金额（惊喜账单用原始费用）
      const surpriseMultiplier = isSurprise ? 1.0 : (1 - (insuranceCoverage || 0));
      const deferredAmount = Math.floor(finalCost * surpriseMultiplier);
      
      // 检查是否能支付挂号费
      if (metrics.gold < upfrontCopay) {
        return { success: false, msg: `连$${upfrontCopay}的挂号费都付不起。医院保安礼貌地请你离开。` };
      }

      // 扣除挂号费
      if (upfrontCopay > 0) {
        const txResult = state.addTransaction('MEDICAL', -upfrontCopay, `挂号费: ${service.name}`);
        if (!txResult.success) {
          return { success: false, msg: "资金不足以支付挂号费" };
        }
      }

      // ✅ 生成延迟账单
      const pendingBill = {
        id: `DEFERRED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalServiceId: service.id,
        originalCost: finalCost,
        upfrontCopay: upfrontCopay,
        deferredAmount: deferredAmount,
        delayTurns: delayTurns,
        triggerTurn: time.currentTurn + delayTurns,
        description: description || `${service.name}的后续账单`,
        isSurprise: isSurprise || false,
        collectionsRisk: collectionsRisk || 0.3,
        hospitalRegion: service.region,
        issuedTurn: time.currentTurn,
      };

      // 添加到延迟账单队列
      set((state: any) => ({
        vitality: {
          ...state.vitality,
          pendingMedicalBills: [...state.vitality.pendingMedicalBills, pendingBill]
        }
      }));

      // 执行治疗效果
      if (isSuccess) {
        const addictionGain = effects.addiction || 0;
        const newHp = Math.min(metrics.maxHp, Math.max(minStat, metrics.hp + (effects.hpRestore || 0)));
        const newInsight = Math.min(metrics.maxInsight, Math.max(minStat, metrics.insight + (effects.insightRestore || 0)));
        const newAddiction = Math.min(maxStat, Math.max(minStat, metrics.addiction + addictionGain));

        state.modifyStats({
          hp: newHp,
          insight: newInsight,
          addiction: newAddiction
        });

        const surpriseMsg = isSurprise 
          ? "你签了一堆文件，但没人告诉你真实的费用。" 
          : "";
        return { 
          success: true, 
          msg: `治疗成功。${service.flavorText || ''} ${surpriseMsg} (${delayTurns}回合后将收到剩余账单$${deferredAmount})` 
        };
      } else {
        const failure = rules.medical?.failurePenalty || { hp: -10, insight: -5 };
        const newHp = Math.max(minStat, metrics.hp + (failure.hp || -10));
        const newInsight = Math.max(minStat, metrics.insight + (failure.insight || -5));

        state.modifyStats({
          hp: newHp, 
          insight: newInsight,
        });
        return { 
          success: false, 
          msg: `治疗失败！产生了严重的排异反应。更糟的是，${delayTurns}回合后你还得付$${deferredAmount}的账单。` 
        };
      }
    }

    // ✅ 标准支付流程（无延迟）- 使用事务管理器
    if (vitality.metrics.gold < finalCost) {
        return { success: false, msg: "资金不足" };
    }

    // 保存初始状态用于回滚
    const initialHp = metrics.hp;
    const initialInsight = metrics.insight;
    const initialAddiction = metrics.addiction;

    const result = executeTransactionSync([
      createStep(
        '扣除医疗费用',
        () => {
          const txResult = state.addTransaction('MEDICAL', -finalCost, `治疗: ${service.name}`);
          return txResult.success;
        },
        () => {
          // 回滚：退还费用
          state.addTransaction('MEDICAL', finalCost, `治疗回滚: ${service.name}`);
        }
      ),
      createStep(
        '应用治疗效果',
        () => {
          if (isSuccess) {
            const addictionGain = effects.addiction || 0;
            const newHp = Math.min(metrics.maxHp, Math.max(minStat, metrics.hp + (effects.hpRestore || 0)));
            const newInsight = Math.min(metrics.maxInsight, Math.max(minStat, metrics.insight + (effects.insightRestore || 0)));
            const newAddiction = Math.min(maxStat, Math.max(minStat, metrics.addiction + addictionGain));
            state.modifyStats({ hp: newHp, insight: newInsight, addiction: newAddiction });
          } else {
            const failure = rules.medical?.failurePenalty || { hp: -10, insight: -5 };
            const newHp = Math.max(minStat, metrics.hp + (failure.hp || -10));
            const newInsight = Math.max(minStat, metrics.insight + (failure.insight || -5));
            state.modifyStats({ hp: newHp, insight: newInsight });
          }
          return true;
        },
        () => {
          // 回滚：恢复状态
          state.modifyStats({ hp: initialHp, insight: initialInsight, addiction: initialAddiction });
        }
      )
    ], 'performTreatment');

    if (result.success) {
      return { 
        success: true, 
        msg: isSuccess 
          ? `治疗成功。${service.flavorText || ''}` 
          : "治疗失败！产生了严重的排异反应，病情未见好转。"
      };
    } else {
      return { success: false, msg: `治疗失败: ${result.error}` };
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
      // 触发疾病Buff
      get().applyEventBuff('DISEASE_CONTRACTED');
    }

    // ===== 步骤1: 计算Vitality Decay（新逻辑）=====
    const { decay } = checkSurvival(state);
    
    // ===== 步骤2: 处理Buff效果（新逻辑）=====
    // 方法名保持不变，但内部使用insight相关变量
    const { hpChange: buffHpChange, insightChange: buffInsightChange } = get().processBuffs();
    
    // ===== 步骤3: 应用总变化 =====
    const currentMetrics = state.vitality.metrics;
    const totalHpChange = decay.hpDecay + buffHpChange;
    const totalInsightChange = decay.sanDecay + buffInsightChange;
    
    const newHp = Math.max(0, Math.min(currentMetrics.maxHp || 100, currentMetrics.hp + totalHpChange));
    // Insight机制：insight越高越接近"觉醒"，所以不做上限钳制到0，而是允许自然增长
    const newInsight = Math.min(currentMetrics.maxInsight || 100, currentMetrics.insight + totalInsightChange);
    
    updates.metrics = {
      ...currentMetrics,
      hp: newHp,
      insight: newInsight
    };
    
    // ===== 步骤4: 死亡判定 =====
    if (newHp <= 0) {
      if (state.triggerEnding) {
        // ✅ 调用 resolveEnding 进行完整结局判定
        const endingId = resolveEnding(state, endingsData as unknown as Ending[], ENDING_RULES.constraints.maxTurns, 'HP_DEPLETED');
        state.triggerEnding(endingId);
      }
    }
    // ✅ 移除旧的硬编码 AWAKENING 判定
    // ED-22 觉醒者结局通过正常的 52 周结局判定流程触发
    // 条件：minInsight: 100, requiredPoints: {red: 50}, hasArchive: "ARCHIVE_COUNT_35"
    
    // ===== 步骤5: 通知玩家 =====
    if (state.addNotification) {
      if (decay.level === 'CRITICAL') {
        state.addNotification('⚠️ 生命危险！环境极度恶劣', 'error');
      } else if (decay.level === 'DANGER') {
        state.addNotification('⚠️ 健康状况堪忧', 'warning');
      }
    }
    
    // ===== 步骤6: 刷新商店库存 =====
    // 异步执行，确保在状态更新后刷新（使用全局定时器管理器）
    globalTimerManager.setTimeout(() => {
      const store = get() as any;
      if (store.refreshShopInventory) {
        store.refreshShopInventory();
      }
    }, 0);

    // ✅ 处理延迟医疗账单（达摩克利斯之剑）
    const pendingBills = state.vitality.pendingMedicalBills || [];
    const currentTurn = state.vitality.time.currentTurn + 1; // 新回合
    const triggeredBills: any[] = [];
    const remainingBills: any[] = [];

    for (const bill of pendingBills) {
      if (bill.triggerTurn <= currentTurn) {
        // 账单到期，触发扣款
        triggeredBills.push(bill);
      } else {
        remainingBills.push(bill);
      }
    }

    // 处理触发的账单
    let totalBillAmount = 0;
    const billMessages: string[] = [];
    
    for (const bill of triggeredBills) {
      totalBillAmount += bill.deferredAmount;
      
      if (state.addNotification) {
        const surprisePrefix = bill.isSurprise ? "【惊喜账单】" : "【医疗账单】";
        state.addNotification(
          `${surprisePrefix} 收到${bill.description}账单 $${bill.deferredAmount}`,
          'warning'
        );
      }
      
      billMessages.push(`${bill.description}: $${bill.deferredAmount}`);
    }

    // 扣款或进入催收
    if (triggeredBills.length > 0) {
      const currentGold = updates.metrics?.gold ?? state.vitality.metrics.gold;
      
      if (currentGold >= totalBillAmount) {
        // 有足够资金，直接扣款
        updates.metrics = {
          ...updates.metrics,
          gold: currentGold - totalBillAmount
        };
        
        // 添加交易记录
        if (state.addTransaction) {
          state.addTransaction('MEDICAL', -totalBillAmount, `延迟医疗账单: ${billMessages.join(', ')}`);
        }
        
        if (state.addNotification) {
          state.addNotification(`已自动扣除医疗账单 $${totalBillAmount}`, 'info');
        }
      } else {
        // 资金不足，进入催收流程
        const shortfall = totalBillAmount - currentGold;
        
        // 扣光所有钱
        updates.metrics = {
          ...updates.metrics,
          gold: 0
        };
        
        // 添加催收Debuff
        const collectionBuff = {
          id: `buff_medical_collection_${Date.now()}`,
          name: '医疗债务催收',
          description: `未支付的医疗账单$${shortfall}已进入催收程序。信用评分严重受损，无法申请贷款或购买中产房产。`,
          duration: 999,
          maxDuration: 999,
          effects: {
            perTurn: {},
            onApply: {
              clearStatus: []
            }
          },
          source: 'medical_debt',
          stackable: true,
          maxStacks: 3,
          stacks: 1,
          data: {
            creditScoreModifier: -200,
            loanBlacklist: true,
            housingBlacklist: ['MIDDLE', 'CAPITALIST'],
          }
        };
        
        get().addSurvivalBuff(collectionBuff);
        
        if (state.addNotification) {
          state.addNotification(
            `⚠️ 医疗账单$${totalBillAmount}无法支付！已进入催收程序。信用受损，阶级跃迁通道已关闭。`,
            'error'
          );
        }
        
        // 触发催收事件Buff
        get().applyEventBuff('MEDICAL_DEBT_COLLECTIONS');
      }
    }

    // 更新延迟账单列表
    updates.pendingMedicalBills = remainingBills;

    // ✅ 处理到期的医疗预约
    const appointments = state.vitality.medicalAppointments || [];
    const dueAppointments: any[] = [];
    const remainingAppointments: any[] = [];

    for (const appt of appointments) {
      if (appt.scheduledTurn <= currentTurn) {
        dueAppointments.push(appt);
      } else {
        remainingAppointments.push(appt);
      }
    }

    // 执行到期的预约（自动进行手术）
    for (const appt of dueAppointments) {
      const apptService = (hospitalData as any[]).find((s: any) => s.id === appt.serviceId);
      if (apptService) {
        const serviceEffects = apptService.effects || {};
        const currentMetrics = updates.metrics || state.vitality.metrics;
        
        // ✅ 检查是否有延迟账单配置
        const hasDeferredPayment = apptService.deferredPayment;
        
        if (state.addNotification) {
          if (hasDeferredPayment) {
            state.addNotification(
              `🏥 预约手术时间到：${appt.serviceName}。手术已完成，延迟账单将在后续回合到达。`,
              'info'
            );
          } else {
            // 无延迟账单，直接扣除尾款
            const remainingCost = apptService.baseCost - appt.depositPaid;
            if (remainingCost > 0) {
              state.addNotification(
                `🏥 预约手术时间到：${appt.serviceName}。需支付尾款 $${remainingCost}`,
                'info'
              );
            }
          }
        }
        
        // ✅ 完整应用治疗效果
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
        
        // ✅ 处理治愈疾病
        if (serviceEffects.cureDisease || serviceEffects.cureDiseases) {
          const diseasesToCure = serviceEffects.cureDiseases || [serviceEffects.cureDisease];
          const currentDiseases = updates.activeDiseases || state.vitality.activeDiseases || [];
          updates.activeDiseases = currentDiseases.filter((d: string) => !diseasesToCure.includes(d));
        }
        
        updates.metrics = newMetrics;
        
        // ✅ 无延迟账单时，才直接扣除尾款
        if (!hasDeferredPayment) {
          const remainingCost = apptService.baseCost - appt.depositPaid;
          if (remainingCost > 0) {
            // 检查资金是否充足
            const currentGold = updates.metrics?.gold ?? state.vitality.metrics.gold;
            if (currentGold < remainingCost) {
              // 资金不足，手术失败
              if (state.addNotification) {
                state.addNotification(
                  `❌ 手术失败：${appt.serviceName}。你无法支付尾款 $${remainingCost}，医院拒绝进行手术。`,
                  'error'
                );
              }
              // 扣除违约金（定金不退）
              continue;
            }
            
            const txResult = state.addTransaction?.('MEDICAL', -remainingCost, `手术尾款: ${appt.serviceName}`);
            if (txResult?.success !== false) {
              updates.metrics = {
                ...updates.metrics,
                gold: Math.max(0, (updates.metrics?.gold ?? state.vitality.metrics.gold) - remainingCost)
              };
            }
          }
        }
        
        if (state.addNotification) {
          state.addNotification(
            `✅ 手术完成：${appt.serviceName}。${apptService.flavorText || ''}`,
            'success'
          );
        }
      }
    }

    // 更新预约列表
    updates.medicalAppointments = remainingAppointments;

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
  })),

  // ==========================================
  // 医疗排期管理
  // ==========================================
  
  scheduleAppointment: (serviceId, deposit) => {
    const state = get() as StoreState;
    const { vitality } = state;
    const { metrics, time } = vitality;
    
    const service = (hospitalData as any[]).find((s: any) => s.id === serviceId);
    if (!service) return { success: false, msg: "服务不可用" };
    
    // 检查是否已有相同预约
    const existingAppointment = vitality.medicalAppointments.find(
      (appt: any) => appt.serviceId === serviceId
    );
    if (existingAppointment) {
      return { 
        success: false, 
        msg: `您已经预约了${service.name}，预计${existingAppointment.scheduledTurn - time.currentTurn}回合后进行。` 
      };
    }
    
    // 检查资金
    if (metrics.gold < deposit) {
      return { success: false, msg: `需要支付$${deposit}定金才能预约。` };
    }
    
    // 扣除定金
    const txResult = state.addTransaction('MEDICAL', -deposit, `预约定金: ${service.name}`);
    if (!txResult.success) {
      return { success: false, msg: "资金不足以支付预约定金" };
    }
    
    // 计算等待时间
    const waitTurnsConfig = service.requirements?.waitTurns || [1, 2];
    const [minWait, maxWait] = waitTurnsConfig;
    const actualWait = Math.floor(Math.random() * (maxWait - minWait + 1)) + minWait;
    
    // 创建预约
    const appointment = {
      id: `APPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceId: service.id,
      serviceName: service.name,
      scheduledTurn: time.currentTurn + actualWait,
      depositPaid: deposit,
      canCancel: true,
      refundRate: 0.5,
    };
    
    set((state: any) => ({
      vitality: {
        ...state.vitality,
        medicalAppointments: [...state.vitality.medicalAppointments, appointment]
      }
    }));
    
    return { 
      success: true, 
      msg: `预约成功！${service.name} 已排到 ${actualWait} 回合后。已支付定金 $${deposit}。` 
    };
  },
  
  cancelAppointment: (appointmentId) => {
    const state = get() as StoreState;
    const { vitality } = state;
    
    const appointment = vitality.medicalAppointments.find((appt: any) => appt.id === appointmentId);
    if (!appointment) {
      return { success: false, msg: "未找到该预约", refund: 0 };
    }
    
    if (!appointment.canCancel) {
      return { success: false, msg: "该预约无法取消", refund: 0 };
    }
    
    // 计算退款
    const refund = Math.floor(appointment.depositPaid * appointment.refundRate);
    
    // 退还定金
    if (refund > 0) {
      state.addTransaction('MEDICAL', refund, `取消预约退款: ${appointment.serviceName}`);
      state.modifyStats({ gold: (state.vitality?.metrics?.gold || 0) + refund });
    }
    
    // ✅ 同时取消相关的延迟账单（如果存在）
    const relatedBillIndex = vitality.pendingMedicalBills.findIndex(
      (bill: any) => bill.originalServiceId === appointment.serviceId && bill.triggerTurn > vitality.time.currentTurn
    );
    
    if (relatedBillIndex >= 0) {
      set((state: any) => ({
        vitality: {
          ...state.vitality,
          medicalAppointments: state.vitality.medicalAppointments.filter((appt: any) => appt.id !== appointmentId),
          pendingMedicalBills: state.vitality.pendingMedicalBills.filter((_: any, index: number) => index !== relatedBillIndex)
        }
      }));
      
      return { 
        success: true, 
        msg: `已取消${appointment.serviceName}的预约及相关延迟账单。退还定金$${refund}（扣除50%手续费）。`,
        refund 
      };
    }
    
    // 移除预约
    set((state: any) => ({
      vitality: {
        ...state.vitality,
        medicalAppointments: state.vitality.medicalAppointments.filter((appt: any) => appt.id !== appointmentId)
      }
    }));
    
    return { 
      success: true, 
      msg: `已取消${appointment.serviceName}的预约。退还定金$${refund}（扣除50%手续费）。`,
      refund 
    };
  },

  // ==========================================
  // Buff管理方法
  // ==========================================
  
  addSurvivalBuff: (buff: SurvivalBuff) => {
    // 先处理 onApply 效果（需要在状态更新前执行）
    
    if (buff.effects?.onApply?.clearStatus) {
      // 处理清除状态（如止血胶带清除流血）
      const statusesToClear = buff.effects.onApply.clearStatus;
      // TODO: 当游戏中实现了具体的状态系统后，这里应该清除相应状态
      console.log(`[SurvivalBuff] 清除状态: ${statusesToClear.join(', ')}`);
    }
    
    set((state: any) => {
      const existingBuffs = state.vitality.activeBuffs || [];
      const buffBaseId = buff.id.split('_')[0];
      
      // 查找同类型Buff
      const existingIndex = existingBuffs.findIndex((b: SurvivalBuff) => 
        b.id.split('_')[0] === buffBaseId
      );
      
      // 计算MaxHP变化（用于maxHpBonus首次应用）
      let maxHpChange = 0;
      
      // 不可堆叠：刷新持续时间
      if (!buff.stackable && existingIndex >= 0) {
        return {
          vitality: {
            ...state.vitality,
            activeBuffs: existingBuffs.map((b: SurvivalBuff, idx: number) => 
              idx === existingIndex ? { ...b, duration: buff.maxDuration } : b
            )
          }
        };
      }
      
      // 可堆叠：增加层数（不超过maxStacks）
      if (buff.stackable && existingIndex >= 0) {
        const existing = existingBuffs[existingIndex];
        const maxStacks = buff.maxStacks || 1;
        const newStacks = Math.min((existing.stacks || 1) + 1, maxStacks);
        
        return {
          vitality: {
            ...state.vitality,
            activeBuffs: existingBuffs.map((b: SurvivalBuff, idx: number) => 
              idx === existingIndex ? { 
                ...b, 
                stacks: newStacks,
                duration: buff.maxDuration // 同时刷新持续时间
              } : b
            )
          }
        };
      }
      
      // 新Buff：初始化层数为1，并应用maxHpBonus
      const newBuff = { ...buff, stacks: buff.stackable ? 1 : undefined };
      
      // 应用maxHpBonus（如果有）
      const buffEffects = buff.effects as any;
      if (buffEffects?.maxHpBonus) {
        maxHpChange = buffEffects.maxHpBonus;
      }
      
      const currentMetrics = state.vitality.metrics;
      const newMaxHp = Math.max(10, (currentMetrics.maxHp || 100) + maxHpChange);
      
      return {
        vitality: {
          ...state.vitality,
          metrics: {
            ...currentMetrics,
            maxHp: newMaxHp
          },
          activeBuffs: [...existingBuffs, newBuff]
        }
      };
    });
  },

  removeSurvivalBuff: (buffId: string) => set((state: any) => ({
    vitality: {
      ...state.vitality,
      activeBuffs: (state.vitality.activeBuffs || []).filter((b: SurvivalBuff) => b.id !== buffId)
    }
  })),

  processBuffs: () => {
    const state = get();
    const buffs = state.vitality.activeBuffs || [];
    
    let hpChange = 0;
    let insightChange = 0;
    let maxHpChange = 0;
    const expiredBuffs: string[] = [];
    const remainingBuffs: SurvivalBuff[] = [];
    
    for (const buff of buffs) {
      // 应用每回合效果（考虑层数倍率）
      if (buff.effects.perTurn) {
        const stacks = buff.stacks || 1;
        const baseHp = buff.effects.perTurn.hp || 0;
        const baseInsight = buff.effects.perTurn.insight || 0;
        
        // 如果有stackMultiplier，每层额外增加效果
        const multiplier = buff.effects.perTurn.stackMultiplier || 1;
        const effectiveStacks = stacks > 1 ? 1 + (stacks - 1) * (multiplier - 1) : 1;
        
        hpChange += baseHp * effectiveStacks;
        insightChange += baseInsight * effectiveStacks;
      }
      
      // 减少持续时间（-1表示永久）
      const newDuration = buff.duration > 0 ? buff.duration - 1 : buff.duration;
      
      if (newDuration === 0) {
        // Buff过期
        expiredBuffs.push(buff.id);
        if (buff.effects.onExpire) {
          hpChange += buff.effects.onExpire.hp || 0;
          insightChange += buff.effects.onExpire.insight || 0;
          
          // 处理MaxHP恢复（maxHpBonus设为0表示恢复）
          const expireEffects = buff.effects.onExpire as any;
          const buffEffects = buff.effects as any;
          if (expireEffects?.maxHpBonus !== undefined) {
            const currentMaxHpBonus = buffEffects?.maxHpBonus || 0;
            const expireMaxHpBonus = expireEffects.maxHpBonus;
            // 恢复：减去Buff提供的加成，加上过期设定的值（通常为0）
            maxHpChange += expireMaxHpBonus - currentMaxHpBonus;
          }
          
          // 触发过期事件（如戒断反应）- 添加循环检测
          if (buff.effects.onExpire.trigger) {
            const triggerId = buff.effects.onExpire.trigger;
            if (!processingTriggers.has(triggerId)) {
              processingTriggers.add(triggerId);
              get().applyEventBuff(triggerId);
              processingTriggers.delete(triggerId);
            } else {
              console.warn(`[SurvivalBuff] 检测到循环触发，已阻止: ${triggerId}`);
            }
          }
        }
      } else {
        remainingBuffs.push({ ...buff, duration: newDuration });
      }
    }
    
    // 更新状态（包括可能的MaxHP变化）
    set((state: any) => {
      const currentMetrics = state.vitality.metrics;
      const newMaxHp = Math.max(10, (currentMetrics.maxHp || 100) + maxHpChange);
      // 调整当前HP不超过新的MaxHP
      const newHp = Math.min(newMaxHp, currentMetrics.hp);
      
      return {
        vitality: {
          ...state.vitality,
          metrics: {
            ...currentMetrics,
            hp: newHp,
            maxHp: newMaxHp
          },
          activeBuffs: remainingBuffs
        }
      };
    });
    
    // 方法返回值保持为 sanChange 以保持接口兼容性，但内部使用 insightChange
    return { hpChange, insightChange, expiredBuffs };
  },

  applyEventBuff: (eventId: string) => {
    const mapping = (buffConfig as any).eventMappings[eventId];
    if (!mapping) return; // 该事件无Buff映射
    
    // 检查概率
    if (Math.random() > mapping.probability) return;
    
    const buffTemplate = (buffConfig as any).buffs[mapping.buffId];
    if (!buffTemplate) {
      console.warn(`[SurvivalBuff] 未找到Buff定义: ${mapping.buffId}`);
      return;
    }
    
    // 创建Buff实例（支持overrideDuration覆盖默认持续时间）
    const duration = mapping.overrideDuration !== undefined 
      ? mapping.overrideDuration 
      : buffTemplate.duration;
    
    const buff: SurvivalBuff = {
      id: `${mapping.buffId}_${Date.now()}`,
      name: buffTemplate.name,
      description: buffTemplate.description,
      duration: duration,
      maxDuration: duration,
      effects: buffTemplate.effects,
      source: eventId,
      stackable: buffTemplate.stackable,
      maxStacks: buffTemplate.maxStacks,
      icon: buffTemplate.icon
    };
    
    get().addSurvivalBuff(buff);
    
    // 通知玩家
    const state = get() as any;
    if (state.addNotification) {
      state.addNotification(`获得状态: ${buff.name}`, 'info');
    }
  },

  // 新增：从物品效果应用Buff
  applyItemBuff: (buffId: string, customDuration?: number) => {
    const buffTemplate = (buffConfig as any).buffs[buffId];
    if (!buffTemplate) {
      console.warn(`[SurvivalBuff] 未找到Buff定义: ${buffId}`);
      return;
    }
    
    const duration = customDuration !== undefined ? customDuration : buffTemplate.duration;
    
    // 创建Buff实例
    const buff: SurvivalBuff = {
      id: `${buffId}_${Date.now()}`,
      name: buffTemplate.name,
      description: buffTemplate.description,
      duration: duration,
      maxDuration: duration,
      effects: buffTemplate.effects,
      source: 'ITEM',
      stackable: buffTemplate.stackable,
      maxStacks: buffTemplate.maxStacks,
      icon: buffTemplate.icon
    };
    
    get().addSurvivalBuff(buff);
    
    // 通知玩家
    const state = get() as any;
    if (state.addNotification) {
      const stackMsg = buffTemplate.stackable ? ' (可堆叠)' : '';
      state.addNotification(`获得状态: ${buff.name}${stackMsg}`, 'info');
    }
  }
});