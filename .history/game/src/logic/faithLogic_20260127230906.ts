import { FaithID, FaithConfig } from '../types/schema';

// 检查是否满足入教条件
export const checkJoinRequirements = (
  config: FaithConfig,
  playerState: { gold: number; hp: number; san: number; inventory: string[] }
): { allowed: boolean; reason?: string } => {
  const req = config.requirements;

  if (req.gold && playerState.gold < req.gold) {
    return { allowed: false, reason: `需要奉献金 $${req.gold}` };
  }

  if (req.maxSan && playerState.san > req.maxSan) {
    return { allowed: false, reason: `你的意志太清醒了 (San需<${req.maxSan})` };
  }

  if (req.minHp && playerState.hp < req.minHp) {
    return { allowed: false, reason: `身体太虚弱 (Hp需>${req.minHp})` };
  }

  if (req.minSan && playerState.san < req.minSan) {
    return { allowed: false, reason: `意志太薄弱 (San需>${req.minSan})` };
  }

  if (req.noContraband) {
    // 这里硬编码违禁品ID，或者后续也可以做成配置
    const contrabandIds = ['I02', 'I03', 'I06']; 
    const hasContraband = playerState.inventory.some(id => contrabandIds.includes(id));
    if (hasContraband) {
      return { allowed: false, reason: "必须清除身上的违禁品 (酒精/药物)" };
    }
  }

  return { allowed: true };
};

// 执行仪式逻辑，返回数值变更 Diff
export const calculateRiteEffects = (
  config: FaithConfig,
  playerState: { gold: number; hp: number; san: number; maxHp: number; points: any }
) => {
  const updates: any = {};
  const action = config.action;
  let successMessage = action.flavor;

  // 1. 计算消耗
  switch (action.costType) {
    case 'GOLD_PERCENT':
      const cost = Math.max(action.minCost || 0, Math.floor(playerState.gold * (action.costValue || 0)));
      if (playerState.gold < cost) throw new Error(`金钱不足 (需 $${cost})`);
      updates.gold = playerState.gold - cost;
      successMessage = `支付了 $${cost}。${successMessage}`;
      break;
    
    case 'HP_FIXED':
      const hpCost = action.costValue || 0;
      if (playerState.hp <= hpCost) throw new Error("生命值不足以支付代价");
      updates.hp = playerState.hp - hpCost;
      break;

    case 'SAN_FIXED':
      const sanCost = action.costValue || 0;
      if (playerState.san < sanCost) throw new Error("理智不足");
      updates.san = playerState.san - sanCost;
      break;
  }

  // 2. 计算收益
  switch (action.effectType) {
    case 'RESTORE_SAN':
      updates.san = Math.min(100, (updates.san ?? playerState.san) + (action.effectValue || 0));
      break;
      
    case 'GAIN_GOLD':
      updates.gold = (updates.gold ?? playerState.gold) + (action.effectValue || 0);
      break;

    case 'GAIN_RED_POINT':
      updates.points = {
        ...playerState.points,
        red: (playerState.points.red || 0) + (action.effectValue || 0)
      };
      // 稍微回点血作为奖励
      updates.hp = Math.min(playerState.maxHp, (updates.hp ?? playerState.hp) + 5);
      break;

    case 'RANDOM_BENEFIT':
      // 互助会特殊逻辑
      updates.hp = Math.min(playerState.maxHp, playerState.hp + 10);
      updates.san = Math.min(100, playerState.san + 5);
      successMessage = "获得食物和慰藉 (+10HP, +5SAN)";
      break;
  }

  return { success: true, message: successMessage, updates };
};