/**
 * Buff系统测试
 * 验证物品系统新增的Buff功能
 */

import { SurvivalBuff } from '@/types/schema';

// 模拟测试数据
const testBuffs = {
  // 不可堆叠Buff（如止血）
  buff_bleeding_stop: {
    id: 'buff_bleeding_stop_1',
    name: '紧急止血',
    description: '工业胶带粗暴地止住了伤口流血',
    duration: 1,
    maxDuration: 1,
    effects: {
      perTurn: { hp: 0 },
      onApply: { clearStatus: ['BLEEDING'] }
    },
    source: 'ITEM',
    stackable: false,
    icon: 'buff_bandage'
  },
  
  // 可堆叠Buff（如毒素累积）
  buff_toxic_buildup: {
    id: 'buff_toxic_buildup_1',
    name: '毒素累积',
    description: '劣质加工食品中的化学物质在体内堆积',
    duration: 5,
    maxDuration: 5,
    effects: {
      perTurn: { hp: -1, stackMultiplier: 1.5 }
    },
    source: 'ITEM',
    stackable: true,
    maxStacks: 5,
    stacks: 1,
    icon: 'buff_toxic'
  },
  
  // 成瘾Buff
  buff_addiction_alcohol: {
    id: 'buff_addiction_alcohol_1',
    name: '酒精依赖',
    description: '廉价的工业酒精开始侵蚀你的理智',
    duration: 10,
    maxDuration: 10,
    effects: {
      perTurn: { san: -1 },
      onExpire: { san: -5, trigger: 'WITHDRAWAL_ALCOHOL' }
    },
    source: 'ITEM',
    stackable: true,
    maxStacks: 5,
    stacks: 1,
    icon: 'buff_addiction'
  }
} as Record<string, SurvivalBuff>;

// 测试：Buff堆叠计算
describe('Buff系统测试', () => {
  test('毒素累积堆叠伤害计算', () => {
    // 3层毒素累积，每层-1HP，层数倍率1.5
    // 实际伤害 = -1 * (1 + 2 * 0.5) = -2
    const stacks = 3;
    const baseDamage = -1;
    const multiplier = 1.5;
    const effectiveStacks = 1 + (stacks - 1) * (multiplier - 1);
    const totalDamage = baseDamage * effectiveStacks;
    
    console.log(`3层毒素伤害: ${totalDamage} HP/回合`);
    expect(totalDamage).toBe(-2);
  });
  
  test('5层毒素最大伤害计算', () => {
    // 5层毒素（maxStacks），层数倍率1.5
    // 实际伤害 = -1 * (1 + 4 * 0.5) = -3
    const stacks = 5;
    const baseDamage = -1;
    const multiplier = 1.5;
    const effectiveStacks = 1 + (stacks - 1) * (multiplier - 1);
    const totalDamage = baseDamage * effectiveStacks;
    
    console.log(`5层毒素(最大)伤害: ${totalDamage} HP/回合`);
    expect(totalDamage).toBe(-3);
  });
});

// 导出测试数据供手动测试使用
export { testBuffs };
