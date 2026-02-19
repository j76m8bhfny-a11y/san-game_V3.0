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
import { checkSurvival } from '@/logic/survivalCalculator';
import { SurvivalBuff } from '@/types/schema';
import buffConfig from '@/assets/data/rules/survival_buffs.json';
import { StoreState } from '@/types/store';

import hospitalData from '@/assets/data/hospital_services.json';
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';
import rules from '@/assets/data/rules/vitalityRules.json';
import medicalRules from '@/assets/data/rules/medicalRules.json';
import bankRules from '@/assets/data/rules/bankRules.json';

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
  
  // Buff管理方法
  addSurvivalBuff: (buff: SurvivalBuff) => void;
  removeSurvivalBuff: (buffId: string) => void;
  processBuffs: () => { hpChange: number; sanChange: number; expiredBuffs: string[] };
  applyEventBuff: (eventId: string) => void;
  applyItemBuff: (buffId: string, customDuration?: number) => void;
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
    activeBuffs: []
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
        activeJobs: [],
        activeBuffs: []
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
    
    // 🏪 初始化商店库存
    setTimeout(() => {
      const store = get() as any;
      if (store.refreshShopInventory) {
        store.refreshShopInventory();
      }
    }, 0);
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
      // 触发疾病Buff
      get().applyEventBuff('DISEASE_CONTRACTED');
    }

    // ===== 步骤1: 计算Vitality Decay（新逻辑）=====
    const { decay } = checkSurvival(state);
    
    // ===== 步骤2: 处理Buff效果（新逻辑）=====
    const { hpChange: buffHpChange, sanChange: buffSanChange } = get().processBuffs();
    
    // ===== 步骤3: 应用总变化 =====
    const currentMetrics = state.vitality.metrics;
    const totalHpChange = decay.hpDecay + buffHpChange;
    const totalSanChange = decay.sanDecay + buffSanChange;
    
    const newHp = Math.max(0, Math.min(currentMetrics.maxHp || 100, currentMetrics.hp + totalHpChange));
    const newSan = Math.max(0, Math.min(currentMetrics.maxSan || 100, currentMetrics.san + totalSanChange));
    
    updates.metrics = {
      ...currentMetrics,
      hp: newHp,
      san: newSan
    };
    
    // ===== 步骤4: 死亡判定 =====
    if (newHp <= 0) {
      if (state.triggerEnding) {
        state.triggerEnding('DEATH', `在${decay.level}环境下生命耗尽`);
      }
    }
    if (newSan <= 0) {
      if (state.triggerEnding) {
        state.triggerEnding('MADNESS', `精神崩溃于${decay.level}环境`);
      }
    }
    
    // ===== 步骤5: 通知玩家 =====
    if (state.addNotification) {
      if (decay.level === 'CRITICAL') {
        state.addNotification('⚠️ 生命危险！环境极度恶劣', 'error');
      } else if (decay.level === 'DANGER') {
        state.addNotification('⚠️ 健康状况堪忧', 'warning');
      }
    }
    
    // ===== 步骤6: 刷新商店库存 =====
    // 异步执行，确保在状态更新后刷新
    setTimeout(() => {
      const store = get() as any;
      if (store.refreshShopInventory) {
        store.refreshShopInventory();
      }
    }, 0);

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
    let sanChange = 0;
    let maxHpChange = 0;
    const expiredBuffs: string[] = [];
    const remainingBuffs: SurvivalBuff[] = [];
    
    for (const buff of buffs) {
      // 应用每回合效果（考虑层数倍率）
      if (buff.effects.perTurn) {
        const stacks = buff.stacks || 1;
        const baseHp = buff.effects.perTurn.hp || 0;
        const baseSan = buff.effects.perTurn.san || 0;
        
        // 如果有stackMultiplier，每层额外增加效果
        const multiplier = buff.effects.perTurn.stackMultiplier || 1;
        const effectiveStacks = stacks > 1 ? 1 + (stacks - 1) * (multiplier - 1) : 1;
        
        hpChange += baseHp * effectiveStacks;
        sanChange += baseSan * effectiveStacks;
      }
      
      // 减少持续时间（-1表示永久）
      const newDuration = buff.duration > 0 ? buff.duration - 1 : buff.duration;
      
      if (newDuration === 0) {
        // Buff过期
        expiredBuffs.push(buff.id);
        if (buff.effects.onExpire) {
          hpChange += buff.effects.onExpire.hp || 0;
          sanChange += buff.effects.onExpire.san || 0;
          
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
    
    return { hpChange, sanChange, expiredBuffs };
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