/**
 * System Gaze 专属事件系统
 * 
 * 功能：
 * 1. 根据gaze强度触发专属高难事件
 * 2. 管理gaze事件的解锁和冷却
 * 3. 提供gaze效果的运行时计算
 */

import { GameState, GameEvent } from '@/types/schema';
import { calculateGazeIntensity, GAZE_EFFECTS } from './systemGaze';
import { checkCondition } from './eventResolver';
import { loadEventsByCategory } from '@/assets/data/events/index';

// 触发阈值
const GAZE_TRIGGER_THRESHOLD = 0.3; // 30%强度开始触发

/**
 * 检查是否应该触发System Gaze专属事件
 */
export function shouldTriggerGazeEvent(state: GameState): boolean {
  const totalArchives = state.unlockedArchives?.length || 0;
  const intensity = calculateGazeIntensity(totalArchives);
  
  // 强度不足不触发
  if (intensity < GAZE_TRIGGER_THRESHOLD) {
    return false;
  }
  
  // 基于强度计算触发概率
  const baseChance = (intensity - GAZE_TRIGGER_THRESHOLD) / (1 - GAZE_TRIGGER_THRESHOLD);
  const triggerChance = baseChance * 0.15; // 最大15%概率
  
  return Math.random() < triggerChance;
}

/**
 * 获取可用的System Gaze专属事件
 */
export async function getAvailableGazeEvents(
  state: GameState
): Promise<GameEvent[]> {
  const totalArchives = state.unlockedArchives?.length || 0;
  const intensity = calculateGazeIntensity(totalArchives);
  
  // 加载所有事件
  const allEvents = await loadEventsByCategory('COMMON');
  
  // 筛选gaze专属事件
  const gazeEvents = allEvents.filter(event => 
    event.id.startsWith('GAZE_') || 
    (event.conditions as any)?.requiredGazeIntensity !== undefined
  );
  
  // 根据强度筛选
  return gazeEvents.filter(event => {
    const requiredIntensity = (event.conditions as any)?.requiredGazeIntensity || 0;
    return intensity >= requiredIntensity && checkCondition(state, event.conditions);
  });
}

/**
 * 获取gaze效果的当前值
 */
export function getCurrentGazeEffects(state: GameState) {
  const totalArchives = state.unlockedArchives?.length || 0;
  const intensity = calculateGazeIntensity(totalArchives);
  
  return {
    intensity,
    effects: {
      irsAuditChance: GAZE_EFFECTS.irsAuditChance(intensity),
      gigPayLowerBound: GAZE_EFFECTS.gigPayLowerBound(intensity, 30),
      insuranceRejectionChance: GAZE_EFFECTS.insuranceRejectionChance(intensity),
      lifeCostIncrease: GAZE_EFFECTS.lifeCostIncrease(intensity),
      evasionDetectionBonus: GAZE_EFFECTS.evasionDetectionBonus(intensity),
      creditRatingImpact: GAZE_EFFECTS.creditRatingImpact(intensity)
    },
    // 是否解锁了特定功能
    unlocks: {
      workerClass: totalArchives >= 10,
      middleClass: totalArchives >= 25,
      capitalistClass: totalArchives >= 40,
      gazeEvents: intensity >= GAZE_TRIGGER_THRESHOLD
    }
  };
}

/**
 * 获取gaze叙事文本
 */
export function getGazeNarrative(intensity: number): string {
  if (intensity <= 0) return '';
  if (intensity < 0.2) return '你感觉有什么东西在注视着你...';
  if (intensity < 0.4) return '系统的目光正在聚焦。';
  if (intensity < 0.6) return '他们开始注意你了。';
  if (intensity < 0.8) return '你知道得太多了。';
  return '系统正在反击。';
}

/**
 * 应用gaze效果到游戏数值
 */
export function applyGazeModifiers(
  baseValue: number,
  type: 'gold' | 'hp' | 'insight',
  state: GameState
): number {
  const { intensity, effects } = getCurrentGazeEffects(state);
  
  if (intensity <= 0) return baseValue;
  
  let modified = baseValue;
  
  switch (type) {
    case 'gold':
      // 根据阶级应用不同效果
      const currentClass = state.vitality.identity.currentClass;
      if (currentClass === 'MIDDLE' && modified < 0) {
        // 中产：生活成本增加
        modified = modified * (1 + effects.lifeCostIncrease);
      } else if (currentClass === 'CAPITALIST' && modified < 0) {
        // 资本家：信用影响
        modified = modified * (1 + effects.creditRatingImpact);
      }
      break;
      
    case 'hp':
      // 流浪者：保险拒赔增加HP损失
      const currentClassHP = state.vitality.identity.currentClass;
      if (currentClassHP === 'HOMELESS') {
        if (Math.random() < effects.insuranceRejectionChance) {
          modified -= 5; // 额外损失
        }
      }
      break;
      
    case 'insight':
      // 高gaze会增加洞察消耗
      if (intensity > 0.5 && modified < 0) {
        modified = modified * (1 + intensity * 0.3);
      }
      break;
  }
  
  return Math.round(modified);
}

// Gaze事件定义（占位符，实际事件在JSON中定义）
export const GAZE_EVENT_TEMPLATES = [
  {
    id: 'GAZE_01_THE_WATCHER',
    title: '被注视',
    description: '你感觉有无数双眼睛在看着你。也许只是错觉？',
    requiredIntensity: 0.3
  },
  {
    id: 'GAZE_02_AUDIT_NOTICE', 
    title: '审计通知',
    description: 'IRS对你的财务状况产生了兴趣。',
    requiredIntensity: 0.4
  },
  {
    id: 'GAZE_03_BLACKLIST',
    title: '黑名单',
    description: '你的名字出现在某个清单上。',
    requiredIntensity: 0.5
  },
  {
    id: 'GAZE_04_MEMORY_HOLE',
    title: '记忆黑洞',
    description: '有些事情你记得，但所有记录都消失了。',
    requiredIntensity: 0.6
  },
  {
    id: 'GAZE_05_DIGITAL_GHOST',
    title: '数字幽灵',
    description: '你的数字身份开始出现异常。',
    requiredIntensity: 0.7
  },
  {
    id: 'GAZE_06_PATTERN_BREAK',
    title: '模式破裂',
    description: '你注意到了不该注意的模式。',
    requiredIntensity: 0.75
  },
  {
    id: 'GAZE_07_SYSTEM_ERROR',
    title: '系统错误',
    description: '现实出现了 glitch。',
    requiredIntensity: 0.85
  },
  {
    id: 'GAZE_08_FINAL_WARNING',
    title: '最终警告',
    description: '这是最后的提醒：停止挖掘。',
    requiredIntensity: 0.95
  }
];
