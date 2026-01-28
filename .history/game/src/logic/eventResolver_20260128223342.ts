import { GameState, EventOption, ScalingMode, PlayerClass } from '@/types/schema';
import { calcPressure, calcDynamicGold, clamp } from '@/logic/core';
import { resolveEnding } from '@/logic/endings';

// 需要的数据
import globalData from '@/assets/data/global.json';
import classData from '@/assets/data/classes.json';
import endingsData from '@/assets/data/endings.json';

interface ResolveResult {
  updates: Partial<GameState>;
  logs: string[];
  endingId?: string;
}

export const resolveOption = (
  state: GameState,
  optionId: string,
  optionConfig: EventOption
): ResolveResult => {
  const { san, currentClass, hp, maxHp, gold } = state;
  const globalRules = globalData.gameRules;

  // 1. 确定 Scaling Mode (数值缩放模式)
  let mode = optionConfig.effects.scaling;
  if (!mode) {
    if (optionId === 'A') mode = ScalingMode.CLASS_LEVERAGE;
    else if (optionId === 'B') mode = ScalingMode.FIXED;
    else if (optionId === 'C' || optionId === 'D') mode = ScalingMode.INCOME_RATIO;
  }

  // 2. 计算压力系数
  const P = calcPressure(san, globalRules.pressureDivisor);

  // 3. 计算动态金币变动
  let deltaGold = calcDynamicGold(
    optionConfig.effects.gold || 0,
    mode || ScalingMode.FIXED,
    currentClass,
    classData as any // Map需要在loader里处理，这里简化演示
  );

  // 4. 计算 HP/SAN 变动 (含压力惩罚)
  let deltaHp = optionConfig.effects.hp || 0;
  let deltaSan = optionConfig.effects.san || 0;

  if ((optionId === 'A' || optionId === 'D') && deltaHp < 0) {
    deltaHp = Math.floor(deltaHp * P); // 压力越大，扣血越多
  }

  // 5. 计算最终数值
  const finalHp = clamp(hp + Math.floor(deltaHp), 0, maxHp);
  const finalSan = clamp(san + deltaSan, 0, 100);
  const finalGold = gold + Math.floor(deltaGold);

  // 6. 处理物品/档案 (简单处理，复杂建议走 ActionExecutor)
  let newInventory = [...state.inventory];
  // ... (省略物品增删逻辑，建议后续由 ActionExecutor 接管)

  const updates: Partial<GameState> = {
    hp: finalHp,
    san: finalSan,
    gold: finalGold,
    inventory: newInventory,
    currentEvent: optionConfig.roast ? state.currentEvent : null, // 如果有吐槽，保留事件界面显示吐槽
    currentRoast: optionConfig.roast || null,
  };

  const logs = [`Option ${optionId}: HP${deltaHp.toFixed(1)} SAN${deltaSan} $${deltaGold}`];

  // 7. 结局判定
  let endingId: string | undefined;

  // 7.1 HP < 0 死亡
  if (finalHp <= 0) {
    endingId = resolveEnding({ ...state, ...updates } as GameState, endingsData as any, globalRules.maxDays, 'HP');
  } 
  // 7.2 特殊死亡 (剧情杀)
  else if (optionConfig.effects.deathReason) {
    endingId = resolveEnding({ ...state, ...updates } as GameState, endingsData as any, globalRules.maxDays, optionConfig.effects.deathReason);
  }
  // 7.3 常规结局 (通关/变异)
  else {
    endingId = resolveEnding({ ...state, ...updates } as GameState, endingsData as any, globalRules.maxDays);
  }

  return { updates, logs, endingId };
};