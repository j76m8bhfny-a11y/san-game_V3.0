// src/systems/StatRuleSystem.ts

import { GameSystem, SystemResult } from '../types';
import { checkDailyDisease } from '@/logic/health';
import { checkClassUpdate } from '@/logic/core';
import diseasesData from '@/assets/data/diseases.json';
import { Disease } from '@/types/schema';
import vitalityRules from '@/assets/data/rules/vitality_rules.json';
import classesData from '@/assets/data/classes.json';
import vehicleRules from '@/assets/data/rules/vehicle_rules.json';
import foodRules from '@/assets/data/rules/food_rules.json';

export const StatRuleSystem: GameSystem = {
  id: 'STAT_RULES',

  processTurn: ({ state }) => {
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    const { metrics, activeDiseases, activeInsurances } = state.vitality;

    // 解构配置项（带防御性默认值）
    const metabolism = vitalityRules.metabolism || {
      baseCost: 5,
      hungerDecayPerTurn: 20,
      starvationDamage: 15
    };
    // 注：原 sanity 配置已改为 insight（灵视值系统）
    // 灵视值不再直接导致身体伤害，其影响体现在工作效率和事件触发上

    // 饮食系统配置
    const hungerConfig = foodRules.hungerSystem;
    const dietTrackerConfig = foodRules.dietTracker;

    // =================================================================
    // 0. 保险费扣除 (Insurance Premium)
    // =================================================================
    for (const insurance of activeInsurances) {
      if (insurance.weeklyCost > 0) {
        result.newTransactions!.push({
          id: Math.random().toString(),
          turn: state.vitality.time.currentTurn,
          category: insurance.type === 'MEDICAL' ? 'MEDICAL' : 'MISC',
          amount: -insurance.weeklyCost,
          description: `${insurance.name} - 周费`,
          timestamp: Date.now()
        });
      }
    }

    // =================================================================
    // 0.5 车辆相关系统处理
    // =================================================================
    if (state.dmvQueue) {
      const { processDMVQueueTurn, completeDMVQueue } = state as any;
      const queueResult = processDMVQueueTurn();
      
      if (queueResult.isComplete) {
        const completeResult = completeDMVQueue();
        result.logs.push(`DMV: ${completeResult.message}`);
        if (completeResult.success) {
          result.notes.push('驾照办理完成！');
        }
      } else {
        result.logs.push(`DMV排队: ${queueResult.message}`);
      }
    }
    
    if (state.activeLease) {
      const { processLeaseTurn } = state as any;
      const leaseResult = processLeaseTurn();
      
      if (leaseResult.paymentSuccess) {
        result.logs.push(`租赁: ${leaseResult.message}`);
        if (leaseResult.isExpired) {
          result.notes.push('租赁期已满，请归还车辆');
        }
        
        const lease = state.activeLease;
        if (lease) {
          const mileageIncrease = Math.floor(Math.random() * 100) + 50;
          const newMileageUsed = (lease.mileageUsed || 0) + mileageIncrease;
          const wearIncrease = (Math.random() * 0.03) + 0.02;
          const newWearAndTear = Math.min(1, (lease.wearAndTear || 0) + wearIncrease);
          
          if (!result.updates.activeLease) {
            result.updates.activeLease = { ...lease };
          }
          result.updates.activeLease.mileageUsed = newMileageUsed;
          result.updates.activeLease.wearAndTear = newWearAndTear;
          
          if (newMileageUsed > lease.mileageLimit) {
            const overage = newMileageUsed - lease.mileageLimit;
            result.logs.push(`租赁警告: 已超里程 ${overage} 单位`);
          }
        }
      } else {
        result.logs.push(`租赁违约: ${leaseResult.message}`);
        result.notes.push('无法支付租赁费用，车辆已被收回');
      }
    }
    
    const vehicleEffects = (vehicleRules as any).vehicleEffects;
    if (vehicleEffects?.applyFrequency === 'TURN_START') {
      const { processVehicleEffects } = state as any;
      const effects = processVehicleEffects();
      
      if (effects.hpChange !== 0 || effects.insightChange !== 0 || effects.addictionChange !== 0) {
        if (!result.updates.vitality) result.updates.vitality = { metrics: {} };
        if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
        
        const vitMetrics = result.updates.vitality.metrics;
        const currentHp = vitMetrics.hp ?? metrics.hp;
        const currentInsight = vitMetrics.insight ?? metrics.insight;
        const currentAddiction = vitMetrics.addiction ?? metrics.addiction;
        
        vitMetrics.hp = Math.max(0, currentHp + effects.hpChange);
        vitMetrics.insight = Math.max(0, Math.min(100, currentInsight + effects.insightChange));
        vitMetrics.addiction = Math.max(0, Math.min(100, currentAddiction + effects.addictionChange));
        
        const effectDesc = [];
        if (effects.hpChange !== 0) effectDesc.push(`HP ${effects.hpChange > 0 ? '+' : ''}${effects.hpChange}`);
        if (effects.insightChange !== 0) effectDesc.push(`SAN ${effects.insightChange > 0 ? '+' : ''}${effects.insightChange}`);
        if (effects.addictionChange !== 0) effectDesc.push(`成瘾 ${effects.addictionChange > 0 ? '+' : ''}${effects.addictionChange}`);
        
        result.logs.push(`车辆效果: ${effectDesc.join(', ')}`);
      }
    }

    // =================================================================
    // 1. 基础代谢 (Hunger/Survival)
    // =================================================================
    if (metabolism.baseCost > 0) {
        if (!result.updates.vitality) {
            result.updates.vitality = { metrics: {} };
        }
        if (!result.updates.vitality.metrics) {
            result.updates.vitality.metrics = {};
        }

        const vitMetrics = result.updates.vitality.metrics;
        const currentHunger = metrics.hunger ?? hungerConfig.maxHunger;
        const currentHp = metrics.hp;

        let newHunger = Math.max(0, currentHunger - metabolism.hungerDecayPerTurn);
        let hpLoss = 0;

        if (newHunger === 0) {
            hpLoss = metabolism.starvationDamage;
            result.logs.push(`⚠️ 极度饥饿: 生命流失 -${hpLoss}`);
            result.notes.push("你快饿死了，快去买点吃的！");
        } else if (newHunger < hungerConfig.thresholds.hungry) {
            result.logs.push(`饥饿警告: 饱腹感仅剩 ${newHunger}`);
            result.notes.push("你的胃在抗议，工作效率下降了。");
        } else {
            result.logs.push(`饱腹感下降: -${metabolism.hungerDecayPerTurn} (剩余: ${newHunger})`);
        }

        vitMetrics.hunger = newHunger;
        if (hpLoss > 0) {
            vitMetrics.hp = Math.max(0, currentHp - hpLoss);
        }
    }

    // =================================================================
    // 1.5 饮食追踪系统 (Diet Tracker)
    // =================================================================
    if (dietTrackerConfig.enabled) {
        const dietState = (state as any).dietState || {
            junkFoodPoints: 0,
            healthyPoints: 0,
            consecutiveJunkDays: 0,
            consecutiveHealthyDays: 0,
            sodiumIntake: 0,
            sugarIntake: 0,
            redMeatPoints: 0,
            noFreshFoodDays: 0
        };

        // 衰减计算 (所有摄入指标都会随时间衰减)
        const decayedJunkPoints = Math.max(0, dietState.junkFoodPoints - dietTrackerConfig.junkFoodPoints.decayPerTurn);
        const decayedHealthyPoints = Math.max(0, dietState.healthyPoints - dietTrackerConfig.healthyPoints.decayPerTurn);
        const decayedSodium = Math.max(0, dietState.sodiumIntake - 5); // 钠每天衰减5
        const decayedSugar = Math.max(0, dietState.sugarIntake - 3);   // 糖每天衰减3
        const decayedRedMeat = Math.max(0, dietState.redMeatPoints - 2); // 红肉每天衰减2

        let newDietState = {
            ...dietState,
            junkFoodPoints: decayedJunkPoints,
            healthyPoints: decayedHealthyPoints,
            sodiumIntake: decayedSodium,
            sugarIntake: decayedSugar,
            redMeatPoints: decayedRedMeat
        };

        // 检查饮食相关疾病触发
        const dietDiseases = foodRules.dietRelatedDiseases.triggers;
        
        // Type 2 Diabetes 检查
        if (!activeDiseases.includes('TYPE_2_DIABETES') && 
            dietState.junkFoodPoints >= dietDiseases.type2_diabetes.junkFoodPoints &&
            dietState.consecutiveJunkDays >= dietDiseases.type2_diabetes.consecutiveJunkDays) {
            if (Math.random() < dietDiseases.type2_diabetes.baseChance) {
                if (!result.updates.vitality) result.updates.vitality = {};
                result.updates.vitality.activeDiseases = [...activeDiseases, 'TYPE_2_DIABETES'];
                result.notes.push('【健康警报】你感到异常口渴和疲劳... (患上II型糖尿病)');
                result.logs.push('染上疾病: TYPE_2_DIABETES');
            }
        }

        // Metabolic Syndrome 检查
        if (!activeDiseases.includes('METABOLIC_SYNDROME') && 
            dietState.junkFoodPoints >= dietDiseases.metabolic_syndrome.junkFoodPoints &&
            Math.random() < (dietDiseases.metabolic_syndrome.baseChance || 0.35)) {
            if (!result.updates.vitality) result.updates.vitality = {};
            // 添加疾病
            result.updates.vitality.activeDiseases = [...activeDiseases, 'METABOLIC_SYNDROME'];
            // 应用永久MaxHP减少
            if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
            const currentMaxHp = result.updates.vitality.metrics.maxHp ?? metrics.maxHp;
            result.updates.vitality.metrics.maxHp = Math.max(20, currentMaxHp - dietDiseases.metabolic_syndrome.permanentMaxHpReduction);
            result.notes.push('【健康警报】你的腰围在增加，体检报告亮起了红灯... (患上代谢综合征)');
            result.logs.push('染上疾病: METABOLIC_SYNDROME (MaxHP -5)');
        }

        // Hypertension 检查
        if (!activeDiseases.includes('HYPERTENSION') && 
            dietState.sodiumIntake >= dietDiseases.hypertension.sodiumIntakeThreshold &&
            Math.random() < (dietDiseases.hypertension.baseChance || 0.4)) {
            if (!result.updates.vitality) result.updates.vitality = {};
            // 添加疾病
            result.updates.vitality.activeDiseases = [...activeDiseases, 'HYPERTENSION'];
            if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
            const currentMaxHp = result.updates.vitality.metrics.maxHp ?? metrics.maxHp;
            result.updates.vitality.metrics.maxHp = Math.max(20, currentMaxHp - dietDiseases.hypertension.maxHpReduction);
            result.notes.push('【健康警报】你经常感到头晕目眩... (患上高血压)');
            result.logs.push('染上疾病: HYPERTENSION (MaxHP -10)');
        }

        // Heart Disease 检查
        if (!activeDiseases.includes('HEART_DISEASE') && 
            dietState.junkFoodPoints >= dietDiseases.heart_disease.junkFoodPoints &&
            Math.random() < (dietDiseases.heart_disease.baseChance || 0.25)) {
            if (!result.updates.vitality) result.updates.vitality = {};
            // 添加疾病
            result.updates.vitality.activeDiseases = [...activeDiseases, 'HEART_DISEASE'];
            if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
            const currentMaxHp = result.updates.vitality.metrics.maxHp ?? metrics.maxHp;
            result.updates.vitality.metrics.maxHp = Math.max(20, currentMaxHp - dietDiseases.heart_disease.maxHpReduction);
            result.notes.push('【健康警报】你的心脏发出警告... (患上心脏病，需要$50,000手术费)');
            result.logs.push('染上疾病: HEART_DISEASE (MaxHP -20)');
        }

        // Scurvy 检查
        if (!activeDiseases.includes('SCURVY') && 
            dietState.noFreshFoodDays >= dietDiseases.scurvy.noFreshFoodDays &&
            Math.random() < (dietDiseases.scurvy.baseChance || 0.5)) {
            if (!result.updates.vitality) result.updates.vitality = {};
            result.notes.push('【健康警报】你的牙龈开始出血... (患上坏血病，需要维生素C)');
            result.logs.push('染上疾病: SCURVY');
        }

        // 增加无新鲜食物天数
        newDietState.noFreshFoodDays = dietState.noFreshFoodDays + 1;

        // 保存饮食状态
        if (!result.updates.dietState) {
            result.updates.dietState = newDietState;
        }

        // 饮食警告
        if (newDietState.junkFoodPoints >= dietTrackerConfig.junkFoodPoints.thresholds.critical) {
            result.notes.push('⚠️ 你的饮食极其不健康，慢性疾病风险极高！');
        } else if (newDietState.junkFoodPoints >= dietTrackerConfig.junkFoodPoints.thresholds.danger) {
            result.notes.push('⚠️ 长期食用垃圾食品正在损害你的健康...');
        }
    }

    // =================================================================
    // 2.1 现有疾病症状发作
    // =================================================================
    const currentDiseases = state.vitality.activeDiseases || [];
    let diseaseHpLoss = 0;
    let diseaseSanLoss = 0;

    // 疾病治疗费用检查（从账本判断是否已支付）
    const diseaseTreatment = foodRules.diseaseTreatment;
    const ledgerHistory = state.vitality.ledger.history;
    
    currentDiseases.forEach(diseaseId => {
        const diseaseDef = diseasesData.find((d: any) => d.id === diseaseId);
        
        if (diseaseDef && diseaseDef.effects) {
            if (diseaseDef.effects.hpDrain) diseaseHpLoss += diseaseDef.effects.hpDrain;
            if (diseaseDef.effects.insightGain) diseaseSanLoss -= diseaseDef.effects.insightGain;  // insightGain正值=增加灵视(对系统来说是"损失"，因为灵视越高越痛苦)
        }

        // 心脏病随机发作
        if (diseaseId === 'HEART_DISEASE') {
            const heartDiseaseConfig = foodRules.dietRelatedDiseases.triggers.heart_disease;
            if (Math.random() < heartDiseaseConfig.randomEvent.chest_pain.chancePerTurn) {
                diseaseHpLoss += heartDiseaseConfig.randomEvent.chest_pain.hpDamage;
                result.notes.push(`💔 ${heartDiseaseConfig.randomEvent.chest_pain.message || '胸口突然剧痛，像被大象踩住...'}`);
            }
        }
        
        // 未治疗疾病额外扣血
        const treatmentConfig = (diseaseTreatment as any)[diseaseId.toLowerCase()];
        if (treatmentConfig && treatmentConfig.untreatedHpDrain) {
            // 检查本周是否已支付治疗费用（通过账本检查）
            const hasPaidTreatment = ledgerHistory.some((r: any) => 
                r.category === 'MEDICAL' && 
                r.amount < 0 && 
                (r.description.includes(diseaseId) || r.description.includes('治疗') || r.description.includes('胰岛素') || r.description.includes('降压药'))
            );
            
            if (!hasPaidTreatment) {
                diseaseHpLoss += treatmentConfig.untreatedHpDrain;
                result.notes.push(`⚠️ ${diseaseId}: 未支付治疗费用，病情恶化 (HP -${treatmentConfig.untreatedHpDrain})`);
            }
        }
    });

    if (diseaseHpLoss > 0 || diseaseSanLoss > 0) {
        if (!result.updates.vitality) result.updates.vitality = { metrics: {} };
        if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
        
        const vitMetrics = result.updates.vitality.metrics;
        const currentHp = vitMetrics.hp ?? metrics.hp;
        const currentInsight = vitMetrics.insight ?? metrics.insight;

        vitMetrics.hp = Math.max(0, currentHp - diseaseHpLoss);
        vitMetrics.insight = Math.max(0, currentInsight - diseaseSanLoss);

        result.logs.push(`疾病折磨: HP -${diseaseHpLoss}${diseaseSanLoss > 0 ? `, SAN -${diseaseSanLoss}` : ''}`);
    }

    // =================================================================
    // 2.5 Buff效果处理
    // =================================================================
    const activeBuffs = (state as any).activeBuffs || [];
    const currentTurn = state.vitality.time.currentTurn;
    let buffHpGain = 0;
    let buffMaxHpBonus = 0;
    let expiredBuffs: string[] = [];

    activeBuffs.forEach((buff: any) => {
        if (buff.endTurn <= currentTurn) {
            expiredBuffs.push(buff.id);
            result.logs.push(`Buff结束: ${buff.name}`);
        } else {
            // 应用Buff效果
            if (buff.effects.hpRegenBonus) {
                buffHpGain += buff.effects.hpRegenBonus;
            }
            if (buff.effects.maxHpBonus) {
                buffMaxHpBonus += buff.effects.maxHpBonus;
            }
            result.logs.push(`Buff生效: ${buff.name}`);
        }
    });

    if (buffHpGain > 0 || buffMaxHpBonus > 0) {
        if (!result.updates.vitality) result.updates.vitality = { metrics: {} };
        if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
        
        const vitMetrics = result.updates.vitality.metrics;
        const currentHp = vitMetrics.hp ?? metrics.hp;
        const currentMaxHp = vitMetrics.maxHp ?? metrics.maxHp;
        
        vitMetrics.hp = Math.min(currentMaxHp + buffMaxHpBonus, currentHp + buffHpGain);
        if (buffMaxHpBonus > 0) {
            vitMetrics.maxHp = currentMaxHp + buffMaxHpBonus;
        }
        
        result.logs.push(`Buff恢复: HP +${buffHpGain}${buffMaxHpBonus > 0 ? `, MaxHP +${buffMaxHpBonus}` : ''}`);
    }

    // 移除过期Buff
    if (expiredBuffs.length > 0) {
        const newBuffs = activeBuffs.filter((b: any) => !expiredBuffs.includes(b.id));
        if (!result.updates.activeBuffs) {
            result.updates.activeBuffs = newBuffs;
        }
    }

    // =================================================================
    // 2.2 常规疾病检查
    // =================================================================
    const newDiseaseId = checkDailyDisease(state, diseasesData as Disease[]);

    if (newDiseaseId) {
        if (!currentDiseases.includes(newDiseaseId)) {
            if (!result.updates.vitality) result.updates.vitality = {};
            result.updates.vitality.activeDiseases = [...currentDiseases, newDiseaseId];
            
            result.notes.push(`【健康警报】你感到身体不适... (检测到: ${newDiseaseId})`);
            result.logs.push(`染上疾病: ${newDiseaseId}`);
        }
    }

    // =================================================================
    // 3. 灵视值机制 (Insight System)
    // =================================================================
    // 灵视值不再直接造成身体伤害，其影响体现在：
    // - 低灵视 (<30): 蒙昧状态，被体制规训，工作效率正常
    // - 中灵视 (30-70): 初觉状态，开始质疑，工作效率略微下降
    // - 高灵视 (>70): 觉醒状态，看到真相，工作效率明显下降，被当作疯子
    // 具体效率计算在 JobSystem.ts 中处理
    // 
    // 注：原"低SAN自残"机制已移除，因为低灵视代表"正常人"状态

    // =================================================================
    // 4. 阶级/身份检查
    // =================================================================
    const currentGold = metrics.gold; 
    const newClassId = checkClassUpdate(currentGold, classesData);
    
    if (newClassId !== state.vitality.identity.currentClass) {
        if (!result.updates.vitality) result.updates.vitality = {};
        
        result.updates.vitality.identity = {
            ...state.vitality.identity,
            currentClass: newClassId
        };
        
        const classDef = classesData.find((c: any) => c.id === newClassId);
        result.logs.push(`⚠️ 阶级变动: 你的身份已更新为【${classDef?.name || newClassId}】`);
        
        if (newClassId === 'HOMELESS') {
            result.notes.push("资产已为负数，你失去了所有体面，沦为了流浪汉。");
        }
    }

    return result;
  }
};
