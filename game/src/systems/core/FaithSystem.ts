import { GameSystem } from '../types';
import { FaithDebuff } from '@/types/schema';

export const FaithSystem: GameSystem = {
  id: 'FAITH_SYSTEM',
  priority: 50, // 优先级较低

  processTurn: ({ state }) => {
    const updates: any = {};
    const logs: string[] = [];
    const notes: string[] = [];
    
    // 1. 每周重置仪式状态，允许玩家再次进行仪式
    if (state.faith && state.faith.hasPerformedRite) {
        updates.faith = {
            ...state.faith,
            hasPerformedRite: false
        };
    }
    
    // 2. ✅ 修复：结算信仰 Debuff 剩余回合
    if (state.faith?.debuffs && state.faith.debuffs.length > 0) {
      const currentDebuffs = state.faith.debuffs;
      
      // 2.1 结算Debuff的周期性效果（hpDrain/insightDrain）
      let totalHpDrain = 0;
      let totalInsightDrain = 0;
      
      currentDebuffs.forEach((debuff: FaithDebuff) => {
        if (debuff.effect.hpDrain) totalHpDrain += debuff.effect.hpDrain;
        if (debuff.effect.insightDrain) totalInsightDrain += debuff.effect.insightDrain;
      });
      
      if (totalHpDrain > 0 || totalInsightDrain > 0) {
        updates.vitality = {
          ...(updates.vitality || {}),
          metrics: {
            ...(updates.vitality?.metrics || {}),
            hp: Math.max(0, state.vitality.metrics.hp - totalHpDrain),
            insight: Math.max(0, state.vitality.metrics.insight + totalInsightDrain)
          }
        };
        if (totalHpDrain > 0) logs.push(`信仰惩罚: HP -${totalHpDrain}`);
        if (totalInsightDrain > 0) notes.push(`被迫清醒: Insight +${totalInsightDrain}`);
      }
      
      // 2.2 减少剩余回合
      const updatedDebuffs = currentDebuffs
        .map((debuff: FaithDebuff) => ({
          ...debuff,
          remainingTurns: debuff.remainingTurns - 1
        }))
        .filter((debuff: FaithDebuff) => debuff.remainingTurns > 0);
      
      // 检查是否有 Debuff 到期
      const expiredCount = currentDebuffs.length - updatedDebuffs.length;
      if (expiredCount > 0) {
        notes.push(`${expiredCount} 个信仰惩罚已解除`);
      }
      
      updates.faith = {
        ...(updates.faith || state.faith),
        debuffs: updatedDebuffs
      };
    }

    return {
      updates,
      newTransactions: [],
      logs,
      notes
    };
  }
};
