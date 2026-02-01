import { GameSystem, SystemResult } from '../types';

export const StatRuleSystem: GameSystem = {
  id: 'STAT_RULES',

  // ✅ 修复: 改为 processTurn
  processTurn: ({ state }) => {
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    const { metrics } = state.vitality; // ✅ 正确访问路径

    // 1. 饥饿/生存消耗 (每周自动扣除)
    // 假设基础消耗是 5 HP
    const baseSurvivalCost = 5;
    
    // 检查是否有食物 (简单示例: 检查 inventory)
    // ✅ 修复: 给 itemId 指定类型 string
    const hasFood = state.inventory.some((itemId: string) => itemId.includes('FOOD'));
    
    let hpLoss = baseSurvivalCost;
    if (hasFood) {
      hpLoss = 0; // 有食物不扣血，或者扣得少
      // 这里应该消耗食物，但 System 通常不直接修改 inventory 数组（除非逻辑很明确）
      // 建议在 dailySettlement 或专门的 SurvivalSystem 里做
    }

    // 2. 只有当确实有变化时才写入 updates
    if (hpLoss > 0) {
        // ✅ 修复: 构造完整的更新对象
        result.updates.vitality = {
            metrics: {
                hp: Math.max(0, metrics.hp - hpLoss)
            }
        } as any;
        result.logs.push(`饥饿消耗: HP -${hpLoss}`);
    }

    // 3. SAN 值过低导致的幻觉/自残
    if (metrics.san < 20) {
        const selfHarm = 5;
        // 如果上面已经定义了 updates.vitality，需要合并
        const currentHpUpdate = (result.updates.vitality as any)?.metrics?.hp;
        const startHp = currentHpUpdate !== undefined ? currentHpUpdate : metrics.hp;
        
        result.updates.vitality = {
            metrics: {
                hp: Math.max(0, startHp - selfHarm)
            }
        } as any;
        result.notes.push("精神崩溃导致自残行为！");
    }

    return result;
  }
};