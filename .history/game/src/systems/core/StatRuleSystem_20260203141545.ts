import { GameSystem, SystemResult } from '../types';
// ✅ 引入疾病检查函数
import { checkDailyDisease } from '@/logic/health';

export const StatRuleSystem: GameSystem = {
  id: 'STAT_RULES',

  processTurn: ({ state }) => {
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    const { metrics, activeDiseases } = state.vitality;
    
    // ✅ 防御性编程：防止 inventory 为 undefined 导致崩溃
    const inventory = state.inventory || [];

    // =================================================================
    // 1. 基础代谢 (Hunger/Survival)
    // =================================================================
    // 逻辑修正：不再自动检查背包里的食物。
    // 玩家必须手动吃东西。如果没吃，每周固定扣除 HP 作为代谢消耗。
    const baseMetabolismCost = 5; 
    
    // 只有当 HP 足够扣时才记录日志，避免大量重复的 "HP -0"
    if (baseMetabolismCost > 0) {
        // 初始化 metrics 更新对象
        if (!result.updates.vitality) result.updates.vitality = { metrics: {} };
        if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};
        
        // 累加扣血 (先计算，不直接覆盖，因为后面可能有其他逻辑也要扣血)
        const currentHpLoss = (result.updates.vitality.metrics.hp !== undefined) 
            ? (metrics.hp - result.updates.vitality.metrics.hp) // 这种写法比较绕，不如直接定义一个 hpChange 变量
            : 0;
            
        // 简化逻辑：直接基于当前 metrics 计算新值
        // 注意：SystemRegistry 会合并这些 updates
        result.updates.vitality.metrics.hp = Math.max(0, metrics.hp - baseMetabolismCost);
        
        result.logs.push(`基础代谢: HP -${baseMetabolismCost}`);
    }

    // =================================================================
    // 2. 疾病检查 (Disease Check) - 激活逻辑闭环
    // =================================================================
    // 调用 health.ts 中的逻辑，判断是否染上新病
    const newDiseaseId = checkDailyDisease(state);

    if (newDiseaseId) {
        // 检查是否已经得过这个病 (避免重复添加)
        const currentDiseases = activeDiseases || [];
        if (!currentDiseases.includes(newDiseaseId)) {
            // 更新 activeDiseases
            if (!result.updates.vitality) result.updates.vitality = {};
            
            // 注意：这里需要小心，不能覆盖掉上面可能存在的 updates.vitality
            // SystemRegistry 的 mergeVitality 会处理深度合并，所以我们这里只要提供这就够了
            result.updates.vitality.activeDiseases = [...currentDiseases, newDiseaseId];
            
            result.notes.push(`【健康警报】你感到身体不适... (检测到: ${newDiseaseId})`);
            result.logs.push(`染上疾病: ${newDiseaseId}`);
        }
    }

    // =================================================================
    // 3. SAN 值惩罚 (Mental Break)
    // =================================================================
    if (metrics.san < 20) {
        // 确保 updates.vitality 存在
        if (!result.updates.vitality) result.updates.vitality = { metrics: {} };
        if (!result.updates.vitality.metrics) result.updates.vitality.metrics = {};

        // 幻觉自残: 再扣 10 HP
        // 这里有一个状态合并的问题：如果上面代谢扣了 5 HP，这里再扣 10 HP
        // 我们需要基于 "上一步计算后的 HP" 或者 "原始 HP - 总扣除"
        
        // 更安全的做法是使用 delta 变量，最后一次性写入 updates
        // 但为了代码结构的局部性，我们这里假设 SystemRegistry 是串行合并属性的
        // 修正：为了安全，我们在本函数内部维护一个 tempHp
        
        let tempHp = result.updates.vitality.metrics.hp ?? metrics.hp;
        tempHp = Math.max(0, tempHp - 10);
        result.updates.vitality.metrics.hp = tempHp;

        result.logs.push("严重精神崩溃: 发生自残行为 (HP -10)");
    }

    return result;
  }
};