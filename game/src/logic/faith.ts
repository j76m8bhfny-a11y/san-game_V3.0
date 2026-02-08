import { FaithID, FaithData, GameState } from '../types/schema';
import faithRules from '@/assets/data/rules/faithRules.json';

/**
 * 检查是否满足入教条件
 * @param faith 目标信仰数据
 * @param state 当前游戏状态
 */
export const checkJoinCondition = (
  faith: FaithData, 
  state: GameState
): { success: boolean; message: string } => {
  const { metrics } = state.vitality;
  const { inventory } = state;
  const cost = faith.joinCost;

  // 1. 基础金钱检查
  if (cost.gold && metrics.gold < cost.gold) {
    return { success: false, message: `需要 $${cost.gold} 奉献金。` };
  }

  // 2. 违禁品检查 (数值清洗完成)
  if (cost.cleanInventory) {
    const hasDirty = inventory.some(id => 
      faithRules.constraints.forbiddenItemIds.includes(id)
    );
    
    if (hasDirty) {
      return { 
        success: false, 
        message: faithRules.constraints.checkCleanInventoryMessage 
      };
    }
  }

  // 3. 属性阈值检查
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
 * 计算 HP/SAN/Gold 的最终变动，不直接修改 Store
 */
export const calculateRiteOutcome = (
  faith: FaithData,
  state: GameState
): { 
  success: boolean; 
  message: string; 
  updates?: any; 
  goldChange: number; 
} => {
  const { metrics, identity } = state.vitality;
  const rite = faith.rite;
  
  // 初始化更新对象结构
  // 注意：updates 将包含 "目标值" (Target Value) 而非差值，除了 Gold
  const updates: any = {
    vitality: { 
      metrics: {},
      identity: { points: {} } // 预备更新阵营点数
    }
  };
  
  let resultMsg = "";
  let goldChange = 0;

  // ==========================
  // 1. 消耗判定 (Pre-check)
  // ==========================
  if (rite.hpCost && metrics.hp < rite.hpCost) {
    return { success: false, message: "体力不足，无法进行仪式。", goldChange: 0 };
  }
  if (rite.sanCost && metrics.san < rite.sanCost) {
    return { success: false, message: "精神状态不佳，无法集中精力。", goldChange: 0 };
  }

  // ==========================
  // 2. 特殊逻辑：什一税 (Tithe)
  // ==========================
  // 判定是否触发什一税逻辑 (根据配置ID)
  if (faith.id === faithRules.mechanics.tithe.targetFaithId) {
    const { rate, minAmount, description } = faithRules.mechanics.tithe;
    
    // 动态计算：最大值(保底, 当前金钱 * 税率)
    const tithe = Math.max(minAmount, Math.floor(metrics.gold * rate));
    
    if (metrics.gold < tithe) {
        return { 
          success: false, 
          message: faithRules.text.insufficientGold.replace('${amount}', tithe.toString()), 
          goldChange: 0 
        };
    }
    
    goldChange = -tithe; // 负数代表扣款
    resultMsg += description.replace('${amount}', tithe.toString()) + " ";
  }

  // ==========================
  // 3. 计算属性变更 (Updates)
  // ==========================

  // --- 消耗计算 (HP/SAN) ---
  // 计算基于当前的快照值
  let newHp = metrics.hp;
  let newSan = metrics.san;

  if (rite.hpCost) newHp -= rite.hpCost;
  if (rite.sanCost) newSan -= rite.sanCost;

  // --- 奖励计算 (HP/SAN) ---
  if (rite.baseSanReward) {
    newSan = Math.min(metrics.maxSan, newSan + rite.baseSanReward);
    resultMsg += `理智 +${rite.baseSanReward}。`;
  }
  
  if (rite.baseHpReward) {
    newHp = Math.min(metrics.maxHp, newHp + rite.baseHpReward);
    resultMsg += `健康 +${rite.baseHpReward}。`;
  }

  // --- 写入 HP/SAN 更新 ---
  // 只有当值发生变化时才写入 update 对象
  if (newHp !== metrics.hp) updates.vitality.metrics.hp = newHp;
  if (newSan !== metrics.san) updates.vitality.metrics.san = newSan;

  // --- 奖励计算 (Gold) ---
  if (rite.goldReward) {
    goldChange += rite.goldReward;
    resultMsg += `获得资金 $${rite.goldReward}。`;
  }

  // --- 奖励计算 (Points - 政治倾向) ---
  // 支持 Schema 中的 redPointReward
  if (rite.redPointReward) {
    const currentRed = identity.points.red || 0;
    const newRed = currentRed + rite.redPointReward;
    
    updates.vitality.identity.points = {
        ...updates.vitality.identity.points,
        red: newRed
    };
    // 如果需要其他点数 (wolf, old)，可在此扩展
    resultMsg += ` 红色倾向 +${rite.redPointReward}。`;
  }

  return { success: true, message: resultMsg, updates, goldChange };
};