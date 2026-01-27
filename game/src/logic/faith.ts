import { FaithID, FaithData } from '../types/schema';
import { GameState } from '../types/schema';

// 违禁品列表 (建议也可以提取到配置)
const FORBIDDEN_ITEMS = ['I02', 'I03', 'I06']; 

/**
 * 检查是否满足入教条件
 */
export const checkJoinCondition = (
  faith: FaithData, 
  state: GameState
): { success: boolean; message: string } => {
  const { gold, hp, san, inventory } = state;
  const cost = faith.joinCost;

  if (cost.gold && gold < cost.gold) {
    return { success: false, message: `需要 $${cost.gold} 奉献金。` };
  }

  if (cost.cleanInventory) {
    const hasDirty = inventory.some(id => FORBIDDEN_ITEMS.includes(id));
    if (hasDirty) return { success: false, message: "身带违禁品，无法入会。" };
  }

  if (cost.maxSan && san > cost.maxSan) {
    return { success: false, message: "你的意志太坚强，无法聆听低语。" };
  }

  if (cost.minHp && hp < cost.minHp) {
    return { success: false, message: "虚弱的身体无法承担革命重任。" };
  }
  
  if (cost.minSan && san < cost.minSan) {
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
  const { gold, hp, san, inventory, points } = state;
  const rite = faith.rite;
  
  let updates: any = {};
  let resultMsg = "";
  let success = true;

  // 1. 检查消耗
  if (rite.hpCost && hp <= rite.hpCost) return { success: false, message: "生命值不足。" };
  if (rite.sanCost && san < rite.sanCost) return { success: false, message: "理智不足。" };
  
  // 特殊逻辑：互助会检查
  if (faith.id === FaithID.BROTHERHOOD) {
     const hasDirty = inventory.some(id => FORBIDDEN_ITEMS.includes(id));
     if (hasDirty) {
       return { 
         success: false, 
         message: "仪式中被发现违禁品！被驱逐！", 
         updates: { san: Math.max(0, san - 10) } 
       };
     }
  }

  // 特殊逻辑：什一税动态计算
  let goldCost = 0;
  if (faith.id === FaithID.CHURCH) {
    goldCost = Math.max(20, Math.floor(gold * 0.1));
    if (gold < goldCost) return { success: false, message: `钱不够 (需 $${goldCost})` };
    updates.gold = gold - goldCost;
    resultMsg += `缴纳 $${goldCost} 什一税。`;
  }

  // 2. 应用固定消耗
  if (rite.hpCost) updates.hp = hp - rite.hpCost;
  if (rite.sanCost) updates.san = san - rite.sanCost;

  // 3. 应用奖励
  if (rite.baseSanReward) {
    updates.san = Math.min(100, (updates.san ?? san) + rite.baseSanReward);
    resultMsg += `理智 +${rite.baseSanReward}。`;
  }
  if (rite.baseHpReward) {
    updates.hp = Math.min(state.maxHp, (updates.hp ?? hp) + rite.baseHpReward);
    resultMsg += `健康 +${rite.baseHpReward}。`;
  }
  if (rite.goldReward) {
    updates.gold = (updates.gold ?? gold) + rite.goldReward;
    resultMsg += `获得 $${rite.goldReward}。`;
  }
  if (rite.redPointReward) {
    updates.points = { ...points, red: (points.red || 0) + rite.redPointReward };
    resultMsg += `革命信念 +${rite.redPointReward}。`;
  }

  return { success: true, message: resultMsg || "仪式完成。", updates };
};