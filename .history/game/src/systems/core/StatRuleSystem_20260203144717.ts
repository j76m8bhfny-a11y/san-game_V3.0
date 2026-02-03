import { GameSystem, SystemResult } from '../types';
import { checkDailyDisease } from '@/logic/health';
import diseasesData from '@/assets/data/diseases.json';

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

    // =================================================================
    // 1. 基础代谢 (Hunger/Survival)
    // =================================================================
    const baseMetabolismCost = 5; 
    
    if (baseMetabolismCost > 0) {
        // ✅ 类型安全修复: 使用辅助函数或手动初始化
        if (!result.updates.vitality) {
            result.updates.vitality = { metrics: {} };
        }
        // 再次确保 metrics 存在 (尽管上面已经初始化，但为了通过严格模式)
        if (!result.updates.vitality.metrics) {
            result.updates.vitality.metrics = {};
        }

        // 使用局部变量引用，TS 就能确认它非空
        const vitMetrics = result.updates.vitality.metrics;

        // =================================================================
        // 1. ✅ 饥饿循环 (Hunger Cycle)
        // =================================================================
    
        // 配置参数
        const HUNGER_DECAY_PER_TURN = 20; // 每周消耗20点 (5周不吃必死)
        const STARVATION_DAMAGE = 15;     // 饥饿度为0时的扣血量

        // 获取当前值 (优先取 metrics 中的原始值)
        const currentHunger = metrics.hunger ?? 100;
        const currentHp = metrics.hp;

        // 计算新饥饿值 (钳制在 0 附近，不为负)
        let newHunger = Math.max(0, currentHunger - HUNGER_DECAY_PER_TURN);
        let hpLoss = 0;

        if (newHunger === 0) {
            // 如果已经是0，或者扣减后变成了0 -> 触发饥饿伤害
            hpLoss = STARVATION_DAMAGE;
            result.logs.push(`⚠️ 极度饥饿: 生命流失 -${hpLoss}`);
            result.notes.push("你快饿死了，快去买点吃的！");
        } else {
            result.logs.push(`饱腹感下降: -${HUNGER_DECAY_PER_TURN} (剩余: ${newHunger})`);
        }

        // 写入更新
        vitMetrics.hunger = newHunger;
        if (hpLoss > 0) {
            vitMetrics.hp = Math.max(0, currentHp - hpLoss);
        }
    }


    // =================================================================
    // 2.1 [新增] 现有疾病症状发作 (Ongoing Disease Effects)
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
        // 初始化 metrics 容器 (复用你写的防御性逻辑)
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
    // 2. 疾病检查 (Disease Check)
    // =================================================================
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
    if (metrics.san < 20) {
        // 初始化
        if (!result.updates.vitality) result.updates.vitality = { metrics: {} };
        if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
        
        const vitMetrics = result.updates.vitality.metrics;

        // ✅ 安全地基于“可能是上一步修改过的值”进行计算
        // 如果上面代谢扣了血，vitMetrics.hp 会有值；否则用当前的 metrics.hp
        let tempHp = vitMetrics.hp ?? metrics.hp;
        
        tempHp = Math.max(0, tempHp - 10);
        vitMetrics.hp = tempHp;

        result.logs.push("严重精神崩溃: 发生自残行为 (HP -10)");
    }

    return result;
  }
};