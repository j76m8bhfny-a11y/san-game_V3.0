import { GameSystem, SystemResult } from '../types';
import employmentRules from '@/assets/data/employment_bills.json';

/**
 * 就业系统
 * 处理：
 * 1. 工人/中产阶级的随机辞退
 * 2. 辞退后添加"职场黑名单"Buff（4回合内无法申请同阶级工作）
 */
export const EmploymentSystem: GameSystem = {
  id: 'EMPLOYMENT',

  processTurn: ({ state }): SystemResult => {
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    const { vitality } = state;
    const currentClass = vitality.identity.currentClass;
    const activeJobs = vitality.activeJobs || [];

    // =================================================================
    // 1. 辞退检查（仅针对有工作的工人/中产阶级）
    // =================================================================
    if (activeJobs.length > 0 && (currentClass === 'WORKER' || currentClass === 'MIDDLE')) {
      const layoffConfig = employmentRules.layoffs.find(
        (l: any) => l.targetClass === currentClass
      );

      if (layoffConfig) {
        // 随机判定是否被辞退
        const roll = Math.random();
        if (roll < layoffConfig.baseChance) {
          // 触发辞退：移除所有工作
          result.updates.vitality = {
            ...result.updates.vitality,
            activeJobs: []
          } as any;

          result.logs.push(`【辞退】${layoffConfig.name}: ${layoffConfig.description}`);
          result.notes.push(layoffConfig.roast);

          // 应用SAN惩罚
          if (layoffConfig.effects?.insight) {
            const newInsight = Math.max(0, vitality.metrics.insight + layoffConfig.effects.insight);
            (result.updates.vitality as any).metrics = {
              ...((result.updates.vitality as any)?.metrics || {}),
              insight: newInsight
            };
          }

          // 添加"职场黑名单"Buff（4回合内无法申请同阶级工作）
          const blacklistBuff = employmentRules.blacklistBuff;
          const existingBuffs = vitality.activeBuffs || [];
          
          // 移除旧的同类型Buff（如果有）
          const filteredBuffs = existingBuffs.filter((b: any) => b.id !== blacklistBuff.id);
          
          (result.updates.vitality as any).activeBuffs = [
            ...filteredBuffs,
            {
              ...blacklistBuff,
              id: `${blacklistBuff.id}_${Date.now()}`,
              duration: blacklistBuff.duration,
              maxDuration: blacklistBuff.duration,
              source: 'layoff',
              // 记录被辞退时的阶级，用于判断
              data: { originalClass: currentClass }
            }
          ];

          result.notes.push(`【职场黑名单】未来${blacklistBuff.duration}回合内，你无法申请${currentClass}阶级的工作，只能向下兼容！`);

          return result;
        }
      }
    }

    return result;
  }
};
