import { FaithID, FaithData, GameState } from '../types/schema';

// 违禁品列表 (建议也可以提取到配置)
const FORBIDDEN_ITEMS = ['I02', 'I03', 'I06']; 

/**
 * 检查是否满足入教条件
 */
export const checkJoinCondition = (
  faith: FaithData, 
  state: GameState
): { success: boolean; message: string } => {
  // ✅ 路径修复：从 vitality 模块获取数值
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
     return { success: false, message: "你需要清醒的头脑。" };
  }

  return { success: true, message: "欢迎加入。" };
};

/**
 * 计算仪式结果
 */
export const calculateRiteOutcome = (
  faith: FaithData,
  state: GameState
) => {
  // ✅ 路径修复：从 vitality 模块获取数值
  const { metrics, identity } = state.vitality;
  const { inventory } = state;
  const rite = faith.rite;
  
  let updates: any = {
    vitality: {
      metrics: {},
      identity: {}
    }
  };
  let resultMsg = "";

  // 1. 检查消耗
  if (rite.hpCost && metrics.hp <= rite.hpCost) return { success: false, message: "生命值不足。" };
  if (rite.sanCost && metrics.san < rite.sanCost) return { success: false, message: "理智不足。" };
  
  // 特殊逻辑：互助会检查
  if (faith.id === FaithID.BROTHERHOOD) {
     const hasDirty = inventory.some(id => FORBIDDEN_ITEMS.includes(id));
     if (hasDirty) {
       return { 
         success: false, 
         message: "仪式中被发现违禁品！被驱逐！", 
         updates: { 
           vitality: { 
             metrics: { san: Math.max(0, metrics.san - 10) } 
           } 
         } 
       };
     }
  }

  // 特殊逻辑：什一税动态计算
  let goldCost = 0;
  if (faith.id === FaithID.CHURCH) {
    goldCost = Math.max(20, Math.floor(metrics.gold * 0.1));
    if (metrics.gold < goldCost) return { success: false, message: `钱不够 (需 $${goldCost})` };
    updates.vitality.metrics.gold = metrics.gold - goldCost;
    resultMsg += `缴纳 $${goldCost} 什一税。`;
  }

  // 2. 应用固定消耗
  if (rite.hpCost) updates.vitality.metrics.hp = metrics.hp - rite.hpCost;
  if (rite.sanCost) updates.vitality.metrics.san = metrics.san - rite.sanCost;

  // 3. 应用奖励
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
  if (rite.goldReward) {
    const currentGold = updates.vitality.metrics.gold ?? metrics.gold;
    updates.vitality.metrics.gold = currentGold + rite.goldReward;
    resultMsg += `获得 $${rite.goldReward}。`;
  }
  if (rite.redPointReward) {
    updates.vitality.identity.points = { 
      ...identity.points, 
      red: (identity.points.red || 0) + rite.redPointReward 
    };
    resultMsg += `革命信念 +${rite.redPointReward}。`;
  }

  return { success: true, message: resultMsg || "仪式完成。", updates };
};