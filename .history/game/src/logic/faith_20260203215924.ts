import { FaithID, FaithData, GameState } from '../types/schema';

// 违禁品列表
const FORBIDDEN_ITEMS = ['I02', 'I03', 'I06']; 

/**
 * 检查是否满足入教条件
 */
export const checkJoinCondition = (
  faith: FaithData, 
  state: GameState
): { success: boolean; message: string } => {
  const { metrics } = state.vitality;
  const { inventory } = state;
  const cost = faith.joinCost;

  if (cost.gold && metrics.gold < cost.gold) {
    return { success: false, message: `需要 $${cost.gold} 奉献金。` };
  }

  if (cost.cleanInventory) {
    const hasDirty = inventory.some(id => FORBIDDEN_ITEMS.includes(id));
    if (hasDirty) return { success: false, message: "身带违禁品，无法入会。" };
  }

  if (cost.maxSan && metrics.san > cost.maxSan) {
    return { success: false, message: "你的意志太坚强，无法聆听低语。" };
  }

  if (cost.minHp && metrics.hp < cost.minHp) {
    return { success: false, message: "虚弱的身体无法承担革命重任。" };
  }
  
  if (cost.minSan && metrics.san < cost.minSan) {
     return { success: false, message: "你需要清醒的头脑来理解教义。" };
  }

  return { success: true, message: "条件满足。" };
};

/**
 * 计算仪式结果 (纯函数)
 * ✅ 修复: 不再直接修改 gold，而是返回 goldChange
 */
export const calculateRiteOutcome = (
  faith: FaithData,
  state: GameState
): { 
  success: boolean; 
  message: string; 
  updates?: any; 
  goldChange: number; // ✅ 新增：明确的金钱变动
} => {
  const { metrics } = state.vitality;
  const rite = faith.rite;
  
  // 初始化更新对象 (仅处理 HP/SAN)
  const updates: any = {
    vitality: { metrics: {} }
  };
  
  let resultMsg = "";
  let goldChange = 0; // 默认为 0

  // 1. 消耗判定 (HP/SAN)
  if (rite.hpCost && metrics.hp <= rite.hpCost) {
    return { success: false, message: "体力不足，无法进行仪式。", goldChange: 0 };
  }
  if (rite.sanCost && metrics.san <= rite.sanCost) {
    return { success: false, message: "精神状态不佳，无法集中精力。", goldChange: 0 };
  }

  // 2. 特殊逻辑：什一税动态计算 (金钱消耗)
  if (faith.id === FaithID.CHURCH) {
    const tithe = Math.max(20, Math.floor(metrics.gold * 0.1));
    if (metrics.gold < tithe) {
        return { success: false, message: `无法支付什一税 (需 $${tithe})`, goldChange: 0 };
    }
    goldChange = -tithe; // 负数代表扣款
    resultMsg += `缴纳 $${tithe} 什一税。`;
  }

  // 3. 应用固定消耗 (HP/SAN)
  // 注意：这里我们计算的是“新值”还是“差值”？
  // 为了方便 Slice 合并，建议计算出最终值，或者让 Slice 处理差值。
  // 这里我们计算最终值。
  if (rite.hpCost) {
      updates.vitality.metrics.hp = metrics.hp - rite.hpCost;
  }
  if (rite.sanCost) {
      updates.vitality.metrics.san = metrics.san - rite.sanCost;
  }

  // 4. 应用奖励
  if (rite.baseSanReward) {
    const currentSan = updates.vitality.metrics.san ?? metrics.san;
    updates.vitality.metrics.san = Math.min(metrics.maxSan, currentSan + rite.baseSanReward);
    resultMsg += `理智 +${rite.baseSanReward}。`;
  }
  if (rite.baseHpReward) {
    const currentHp = updates.vitality.metrics.hp ?? metrics.hp;
    updates.vitality.metrics.hp = Math.min(metrics.maxHp, currentHp + rite.baseHpReward);
    resultMsg += `健康 +${rite.baseHpReward}。`;
  }
  
  // 奖励金钱
  if (rite.goldReward) {
    goldChange += rite.goldReward;
    resultMsg += `获得资金 $${rite.goldReward}。`;
  }

  return { success: true, message: resultMsg, updates, goldChange };
};