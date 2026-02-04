// src/systems/StatRuleSystem.ts

import { GameSystem, SystemResult } from '../types';
import { checkDailyDisease } from '@/logic/health';
import diseasesData from '@/assets/data/diseases.json';
import { ActiveInsuranceState } from '@/types/schema';
// ✅ 1. 引入数值配置文件
import vitalityRules from '@/assets/data/rules/vitalityRules.json';

export const StatRuleSystem: GameSystem = {
  id: 'STAT_RULES',

  processTurn: ({ state }) => {
    const result: SystemResult = {
      updates: {}, // 初始化为空对象
      newTransactions: [],
      logs: [],
      notes: []
    };

    const { metrics, activeDiseases } = state.vitality;
    const activeInsurance = state.activeInsurance as ActiveInsuranceState | null;

    // ✅ 2. 解构配置项
    const { metabolism, sanity } = vitalityRules;

    // =================================================================
    // 0. 保险费扣除 (Insurance Premium)
    // =================================================================
    // 只有在没坐牢的情况下才自动扣费 (坐牢时 SystemRegistry 已有拦截逻辑，或者允许欠费)
    if (activeInsurance && activeInsurance.premium > 0) {
        result.newTransactions!.push({
            id: Math.random().toString(),
            turn: state.vitality.time.currentTurn,
            category: 'MEDICAL',
            amount: -activeInsurance.premium,
            description: `保险续费: ${activeInsurance.name}`,
            timestamp: Date.now()
        });
    }

    // =================================================================
    // 1. 基础代谢 (Hunger/Survival)
    // =================================================================
    // ✅ Refactor: 使用配置中的基础消耗开关/阈值
    if (metabolism.baseCost > 0) {
        
        // 🛡️ 防御性初始化 updates 结构
        if (!result.updates.vitality) {
            result.updates.vitality = { metrics: {} };
        }
        if (!result.updates.vitality.metrics) {
            result.updates.vitality.metrics = {};
        }

        // 使用局部变量引用
        const vitMetrics = result.updates.vitality.metrics;

        // -----------------------------------------------------------------
        // 1.1 饥饿循环 (Hunger Cycle)
        // -----------------------------------------------------------------
    
        // 获取当前值 (优先取 metrics 中的原始值)
        const currentHunger = metrics.hunger ?? 100;
        const currentHp = metrics.hp;

        // ✅ Refactor: 使用配置中的衰减值 (原为 20)
        let newHunger = Math.max(0, currentHunger - metabolism.hungerDecayPerTurn);
        let hpLoss = 0;

        if (newHunger === 0) {
            // 如果已经是0，或者扣减后变成了0 -> 触发饥饿伤害
            // ✅ Refactor: 使用配置中的伤害值 (原为 15)
            hpLoss = metabolism.starvationDamage;
            result.logs.push(`⚠️ 极度饥饿: 生命流失 -${hpLoss}`);
            result.notes.push("你快饿死了，快去买点吃的！");
        } else {
            result.logs.push(`饱腹感下降: -${metabolism.hungerDecayPerTurn} (剩余: ${newHunger})`);
        }

        // 写入更新
        vitMetrics.hunger = newHunger;
        if (hpLoss > 0) {
            vitMetrics.hp = Math.max(0, currentHp - hpLoss);
        }
    }


    // =================================================================
    // 2.1 现有疾病症状发作 (Ongoing Disease Effects)
    // =================================================================
    const currentDiseases = state.vitality.activeDiseases || [];
    let diseaseHpLoss = 0;
    let diseaseSanLoss = 0;

    currentDiseases.forEach(diseaseId => {
        // 在静态数据中查找疾病详情
        const diseaseDef = diseasesData.find((d: any) => d.id === diseaseId);
        
        if (diseaseDef && diseaseDef.effects) {
            if (diseaseDef.effects.hpDrain) diseaseHpLoss += diseaseDef.effects.hpDrain;
            if (diseaseDef.effects.sanDrain) diseaseSanLoss += diseaseDef.effects.sanDrain;
        }
    });

    if (diseaseHpLoss > 0 || diseaseSanLoss > 0) {
        // 初始化 metrics 容器
        if (!result.updates.vitality) result.updates.vitality = { metrics: {} };
        if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
        
        const vitMetrics = result.updates.vitality.metrics;
        
        // 计算扣除 (基于之前步骤可能修改过的值)
        const currentHp = vitMetrics.hp ?? metrics.hp;
        const currentSan = vitMetrics.san ?? metrics.san;

        vitMetrics.hp = Math.max(0, currentHp - diseaseHpLoss);
        vitMetrics.san = Math.max(0, currentSan - diseaseSanLoss);

        result.logs.push(`疾病折磨: HP -${diseaseHpLoss}, SAN -${diseaseSanLoss}`);
    }

    // =================================================================
    // 2.2 疾病检查 (Disease Check)
    // =================================================================
    // checkDailyDisease 内部逻辑稍后也应连接到 rules，这里仅调用
    const newDiseaseId = checkDailyDisease(state);

    if (newDiseaseId) {
        const currentDiseases = activeDiseases || [];
        if (!currentDiseases.includes(newDiseaseId)) {
            // 初始化 vitality
            if (!result.updates.vitality) result.updates.vitality = {};
            
            // ✅ 直接赋值，无需担心覆盖 metrics (SystemRegistry 会处理合并)
            result.updates.vitality.activeDiseases = [...currentDiseases, newDiseaseId];
            
            result.notes.push(`【健康警报】你感到身体不适... (检测到: ${newDiseaseId})`);
            result.logs.push(`染上疾病: ${newDiseaseId}`);
        }
    }

    // =================================================================
    // 3. SAN 值惩罚 (Mental Break)
    // =================================================================
    // ✅ Refactor: 使用配置中的崩溃阈值 (原为 20)
    if (metrics.san < sanity.breakThreshold) {
        // 初始化
        if (!result.updates.vitality) result.updates.vitality = { metrics: {} };
        if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
        
        const vitMetrics = result.updates.vitality.metrics;

        // ✅ 安全地基于“可能是上一步修改过的值”进行计算
        const tempHp = vitMetrics.hp ?? metrics.hp;
        
        // ✅ Refactor: 使用配置中的自残伤害 (原为 10)
        vitMetrics.hp = Math.max(0, tempHp - sanity.selfHarmDamage);

        result.logs.push(`严重精神崩溃: 发生自残行为 (HP -${sanity.selfHarmDamage})`);
    }

    return result;
  }
};