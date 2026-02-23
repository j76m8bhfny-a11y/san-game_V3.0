/**
 * DietSystem - 饮食健康系统
 * 
 * 处理：
 * 1. 长期饮食对健康的影响
 * 2. 垃圾食品成瘾惩罚
 * 3. 营养不良疾病
 * 4. 饮食相关 Buff
 */

import { GameSystem, SystemResult } from '../types';

// 健康惩罚阈值
const HEALTH_THRESHOLDS = {
  JUNK_7_DAYS: 7,      // 7天垃圾食品 → HP-5
  JUNK_14_DAYS: 14,    // 14天垃圾食品 → 肥胖风险
  JUNK_30_DAYS: 30,    // 30天垃圾食品 → 心脏病风险
  NO_FRESH_14_DAYS: 14, // 14天无新鲜食物 → 维生素缺乏
  SODIUM_1000: 1000,   // 钠摄入超1000 → 高血压
  SUGAR_500: 500       // 糖摄入超500 → 糖尿病风险
};

// 疾病风险概率（每周）
const DISEASE_CHANCES = {
  OBESITY: 0.1,     // 肥胖
  HEART_DISEASE: 0.05, // 心脏病
  DIABETES: 0.08,   // 糖尿病
  SCURVY: 0.15      // 维生素缺乏（坏血病）
};

export const DietSystem: GameSystem = {
  id: 'DIET_SYSTEM',
  priority: 92, // 在住房系统之后，金融系统之前

  processTurn: ({ state }): SystemResult => {
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    const dietState = state.dietState;
    if (!dietState) return result;

    const { metrics } = state.vitality;

    // 1. 连续垃圾食品惩罚
    if (dietState.consecutiveJunkDays >= HEALTH_THRESHOLDS.JUNK_7_DAYS) {
      // 7天垃圾食品：HP-5
      result.updates.vitality = {
        metrics: {
          hp: Math.max(0, metrics.hp - 5)
        }
      } as any;
      result.notes.push('🍔 连续7天吃垃圾食品，感觉身体状况下降');
      result.logs.push('不健康饮食导致HP-5');
    }

    if (dietState.consecutiveJunkDays >= HEALTH_THRESHOLDS.JUNK_14_DAYS) {
      // 14天垃圾食品：肥胖风险
      if (Math.random() < DISEASE_CHANCES.OBESITY) {
        const newDiseases = [...(state.vitality.activeDiseases || [])];
        if (!newDiseases.includes('RISK_OBESITY')) {
          newDiseases.push('RISK_OBESITY');
          result.updates.vitality = {
            ...result.updates.vitality,
            activeDiseases: newDiseases
          } as any;
          result.notes.push('⚠️ 肥胖风险警告：长期不健康饮食');
        }
      }
    }

    if (dietState.consecutiveJunkDays >= HEALTH_THRESHOLDS.JUNK_30_DAYS) {
      // 30天垃圾食品：心脏病风险
      if (Math.random() < DISEASE_CHANCES.HEART_DISEASE) {
        const newDiseases = [...(state.vitality.activeDiseases || [])];
        if (!newDiseases.includes('RISK_HEART_DISEASE')) {
          newDiseases.push('RISK_HEART_DISEASE');
          result.updates.vitality = {
            ...result.updates.vitality,
            activeDiseases: newDiseases
          } as any;
          result.notes.push('🫀 心脏病风险：极度不健康的饮食习惯');
        }
      }
    }

    // 2. 无新鲜食物惩罚
    if (dietState.noFreshFoodDays >= HEALTH_THRESHOLDS.NO_FRESH_14_DAYS) {
      if (Math.random() < DISEASE_CHANCES.SCURVY) {
        const newDiseases = [...(state.vitality.activeDiseases || [])];
        if (!newDiseases.includes('RISK_VITAMIN_DEFICIENCY')) {
          newDiseases.push('RISK_VITAMIN_DEFICIENCY');
          result.updates.vitality = {
            ...result.updates.vitality,
            activeDiseases: newDiseases,
            metrics: {
              ...result.updates.vitality?.metrics,
              hp: Math.max(0, (result.updates.vitality?.metrics?.hp ?? metrics.hp) - 10)
            }
          } as any;
          result.notes.push('🍊 维生素缺乏：没有新鲜蔬果摄入');
          result.logs.push('维生素缺乏导致HP-10');
        }
      }
    }

    // 3. 钠摄入过多（高血压风险）
    if (dietState.sodiumIntake >= HEALTH_THRESHOLDS.SODIUM_1000) {
      // 重置钠摄入计数（代表已经造成影响）
      result.updates.dietState = {
        ...dietState,
        sodiumIntake: 0
      };
      result.notes.push('🧂 钠摄入过多：血压上升，感觉头晕');
    }

    // 4. 糖摄入过多（糖尿病风险）
    if (dietState.sugarIntake >= HEALTH_THRESHOLDS.SUGAR_500) {
      if (Math.random() < DISEASE_CHANCES.DIABETES) {
        const newDiseases = [...(state.vitality.activeDiseases || [])];
        if (!newDiseases.includes('RISK_DIABETES')) {
          newDiseases.push('RISK_DIABETES');
          result.updates.vitality = {
            ...result.updates.vitality,
            activeDiseases: newDiseases
          } as any;
          result.notes.push('🍬 糖尿病风险：糖分摄入过量');
        }
      }
      // 重置糖摄入计数
      result.updates.dietState = {
        ...dietState,
        sugarIntake: 0
      };
    }

    // 5. 连续健康饮食奖励
    if (dietState.consecutiveHealthyDays >= 14) {
      // 14天健康饮食：HP上限临时+5
      // 这里通过添加 buff 实现
      const existingBuff = state.vitality.activeBuffs?.find(b => b.id === 'buff_healthy_diet');
      if (!existingBuff) {
        const newBuff = {
          id: 'buff_healthy_diet',
          name: '健康饮食',
          description: '连续14天健康饮食，身体状况改善',
          duration: 7,
          remainingTurns: 7,
          effects: {
            perTurn: { hp: 2 },
            maxHpBonus: 5
          },
          source: 'diet_system',
          stackable: false
        };
        result.updates.vitality = {
          ...result.updates.vitality,
          activeBuffs: [...(state.vitality.activeBuffs || []), newBuff]
        } as any;
        result.notes.push('🥗 健康饮食奖励：连续14天健康饮食，身体状况改善');
      }
    }

    return result;
  }
};

export default DietSystem;
