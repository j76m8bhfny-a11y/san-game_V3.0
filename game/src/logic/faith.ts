import { 
  FaithData, 
  GameState,
  NoviceActionType 
} from '../types/schema';
import faithRulesUntyped from '@/assets/data/rules/faithRules.json';
import type { FaithRules } from '../types/faithRules';

// 类型断言：确保 JSON 符合 FaithRules 接口
const faithRules = faithRulesUntyped as FaithRules;

interface ActionOutcome {
  success: boolean;
  message: string;
  goldChange: number;
  updates: any; // 用于 modifyStats 的状态更新对象
  targetFaithId?: string; // 仅新手行为有此字段，用于 Slice 判断解锁
}

/**
 * 核心逻辑：计算新手基础行为的结果 (Novice Action)
 * 完全基于 JSON 配置驱动，拒绝硬编码
 * * @param actionType 行为类型 (DEDICATE | AID | SACRIFICE | REJECT)
 * @param state 当前游戏状态
 */
export const calculateNoviceActionOutcome = (
  actionType: NoviceActionType,
  state: GameState
): ActionOutcome => {
  const { metrics, identity } = state.vitality;
  const { inventory } = state;

  // 1. 从规则文件中读取配置
  // 使用 Optional Chaining 防止 JSON 结构未更新导致崩溃
  const mechanic = faithRules.noviceMechanics?.[actionType];

  if (!mechanic) {
    return { 
      success: false, 
      message: `系统错误: 未找到行为 ${actionType} 的配置`, 
      goldChange: 0, 
      updates: {} 
    };
  }

  // 2. 检查前置条件 (Requirements)
  
  // 2.1 道具检查 (例如: 拒绝行为可能需要持有“宣言”)
  if (mechanic.requiredItemId && !inventory.includes(mechanic.requiredItemId)) {
    return {
      success: false,
      message: "缺少必要物品，无法进行此行动。",
      goldChange: 0,
      updates: {}
    };
  }

  // 2.2 资源消耗检查 (Cost Check)
  // 金钱
  if (mechanic.cost?.gold && metrics.gold < mechanic.cost.gold) {
    return {
      success: false,
      message: `资金不足 (需要 $${mechanic.cost.gold})`,
      goldChange: 0,
      updates: {}
    };
  }
  // HP (不能自杀)
  if (mechanic.cost?.hp && metrics.hp <= mechanic.cost.hp) {
    return {
      success: false,
      message: "身体过于虚弱，无法承受代价。",
      goldChange: 0,
      updates: {}
    };
  }
  // SAN (不能发疯)
  if (mechanic.cost?.insight && metrics.insight <= mechanic.cost.insight) {
    return {
      success: false,
      message: "理智濒临崩溃，无法集中精神。",
      goldChange: 0,
      updates: {}
    };
  }

  // 3. 计算结果 (Results)
  
  const updates: any = {
    vitality: {
      metrics: {},
      identity: { points: {} }
    }
  };
  let goldChange = 0;
  let resultMsg = mechanic.successMessage || "行为已完成。";

  // --- 应用消耗 ---
  let newHp = metrics.hp;
  let newSan = metrics.insight;

  if (mechanic.cost?.gold) goldChange -= mechanic.cost.gold;
  if (mechanic.cost?.hp) newHp -= mechanic.cost.hp;
  if (mechanic.cost?.insight) newSan -= mechanic.cost.insight;

  // --- 应用奖励 ---
  if (mechanic.reward?.gold) goldChange += mechanic.reward.gold;
  if (mechanic.reward?.hp) newHp += mechanic.reward.hp;
  if (mechanic.reward?.insight) newSan += mechanic.reward.insight;

  // --- 应用阵营点数奖励 ---
  if (mechanic.reward?.points) {
    const currentPoints = identity.points;
    updates.vitality.identity.points = {
      red: (currentPoints.red || 0) + (mechanic.reward.points.red || 0),
      wolf: (currentPoints.wolf || 0) + (mechanic.reward.points.wolf || 0),
      old: (currentPoints.old || 0) + (mechanic.reward.points.old || 0),
    };
  }

  // --- 封装 Vitality 更新 ---
  // 注意：这里计算的是目标值 (Target Value)，modifyStats 会负责钳制上下限
  if (newHp !== metrics.hp) updates.vitality.metrics.hp = newHp;
  if (newSan !== metrics.insight) updates.vitality.metrics.insight = newSan;

  return {
    success: true,
    message: resultMsg,
    goldChange,
    updates,
    targetFaithId: mechanic.targetFaithId // 返回关联的信仰ID，供 Slice 判断连击解锁
  };
};

/**
 * 计算教徒仪式结果 (Rite Outcome)
 * 适用于已加入教派后的高级互动
 */
export const calculateRiteOutcome = (
  faith: FaithData,
  state: GameState
): ActionOutcome => {
  const { metrics, identity } = state.vitality;
  const rite = faith.rite;
  
  const updates: any = {
    vitality: { 
      metrics: {},
      identity: { points: {} }
    }
  };
  
  let resultMsg = "";
  let goldChange = 0;

  // ==========================
  // 1. 消耗判定 (Pre-check)
  // ==========================
  if (rite.hpCost && metrics.hp <= rite.hpCost) {
    return { success: false, message: "体力不足，无法进行仪式。", goldChange: 0, updates: {} };
  }
  if (rite.insightCost && metrics.insight <= rite.insightCost) {
    return { success: false, message: "灵视不足，无法感知仪式的真谛。", goldChange: 0, updates: {} };
  }

  // ==========================
  // 2. 特殊逻辑：什一税 (Tithe)
  // ==========================
  // 通过配置 ID 判断是否启用特殊逻辑 (保持配置化)
  if (faithRules.mechanics?.tithe?.enabled && faith.id === faithRules.mechanics.tithe.targetFaithId) {
    const { rate, minAmount, description } = faithRules.mechanics.tithe;
    
    // 动态计算：最大值(保底, 当前金钱 * 税率)
    const tithe = Math.max(minAmount, Math.floor(metrics.gold * rate));
    
    if (metrics.gold < tithe) {
        return { 
          success: false, 
          message: (faithRules.text.insufficientGold || '资金不足: ${amount}').replace('${amount}', tithe.toString()), 
          goldChange: 0,
          updates: {}
        };
    }
    
    goldChange -= tithe;
    resultMsg += description.replace('${amount}', tithe.toString()) + " ";
  }

  // ==========================
  // 3. 计算属性变更 (Updates)
  // ==========================

  let newHp = metrics.hp;
  let newSan = metrics.insight;

  // 消耗
  if (rite.hpCost) newHp -= rite.hpCost;
  if (rite.insightCost) newSan -= rite.insightCost;

  // 奖励 (灵视值/HP)
  if (rite.baseSanReward) {
    newSan += rite.baseSanReward;
    resultMsg += `灵视 +${rite.baseSanReward}。`;
  }
  
  if (rite.baseHpReward) {
    newHp += rite.baseHpReward;
    resultMsg += `健康 +${rite.baseHpReward}。`;
  }

  // 写入更新
  if (newHp !== metrics.hp) updates.vitality.metrics.hp = newHp;
  if (newSan !== metrics.insight) updates.vitality.metrics.insight = newSan;

  // 奖励 (Gold)
  if (rite.goldReward) {
    goldChange += rite.goldReward;
    resultMsg += `获得资金 $${rite.goldReward}。`;
  }

  // 奖励 (Points)
  if (rite.redPointReward) {
    const currentRed = identity.points.red || 0;
    updates.vitality.identity.points = {
        ...identity.points,
        red: currentRed + rite.redPointReward
    };
    resultMsg += ` 红色倾向 +${rite.redPointReward}。`;
  }

  return { success: true, message: resultMsg, updates, goldChange };
};