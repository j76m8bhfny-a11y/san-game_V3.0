import { GameSystem, SystemResult } from '../types';
import { checkDailyDisease } from '@/logic/health';

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
    const inventory = state.inventory || [];

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

        // 计算新的 HP
        const currentHpLoss = (vitMetrics.hp !== undefined) 
            ? (metrics.hp - vitMetrics.hp) 
            : 0;
            
        vitMetrics.hp = Math.max(0, metrics.hp - baseMetabolismCost);
        
        result.logs.push(`基础代谢: HP -${baseMetabolismCost}`);
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