import { GameSystem, SystemResult } from '../types';

export const StatRuleSystem: GameSystem = {
  id: 'STAT_RULES',

  processDay: ({ state }) => {
    const { san, hp, gold, inventory } = state;
    const result: SystemResult = {
      updates: {},
      logs: [],
      notes: []
    };

    let hpChange = 0;
    let sanChange = 0;

    // --- 规则 1: 精神崩溃导致的生理伤害 ---
    // 逻辑：当 SAN 值过低，玩家会自残或免疫力下降
    if (san < 20) {
      const dmg = 5;
      hpChange -= dmg;
      result.logs.push(`精神崩溃自残: HP -${dmg}`);
      result.notes.push(`[警告] 你的精神处于崩溃边缘，身体正在遭受不可逆的损伤。`);
    }

    // --- 规则 2: 极度贫困导致的压力 ---
    // 逻辑：负债过高会持续掉 SAN
    if (gold < -1000) {
      const stress = 2;
      sanChange -= stress;
      result.logs.push(`债务压力: SAN -${stress}`);
    }

    // --- 规则 3: 饥饿/温饱判定 (基于库存) ---
    // 逻辑：如果包里没有食物 (假设食物 ID 是 "FOOD_STD")，扣 HP
    // 这只是个示例，你可以根据 items.json 的实际 ID 修改
    const hasFood = inventory.some(itemId => itemId.startsWith('FOOD_')); 
    // 这里假设食物 ID 前缀是 FOOD_，如果没有食物系统可忽略此段
    
    /* if (!hasFood && gold < 10) {
       hpChange -= 10;
       result.logs.push(`饥饿: HP -10`);
       result.notes.push(`你今天没吃东西，也买不起食物。`);
    }
    */

    // --- 规则 4: 濒死体验 ---
    if (hp < 15 && hp > 0) {
      // 没有任何数值变化，只是给个警告
      result.notes.push(`身体状况极差，建议立即就医。`);
    }

    // --- 应用所有数值变更 ---
    if (hpChange !== 0 || sanChange !== 0) {
      // 确保不会加上 undefined
      result.updates.hp = hp + hpChange;
      result.updates.san = san + sanChange;
    }

    return result;
  }
};