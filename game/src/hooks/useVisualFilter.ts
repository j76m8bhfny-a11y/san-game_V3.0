import { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import vitalityRules from '@/assets/data/rules/vitalityRules.json';

/**
 * 视觉滤镜 Hook
 * 
 * 根据灵视值返回不同的视觉风格：
 * - 低灵视 (0-30): 蒙昧状态，正常滤镜（被体制规训的视角）
 * - 中灵视 (31-70): 初觉状态，轻微滤镜（开始看到异常）
 * - 高灵视 (71+): 觉醒状态，金色辉光（看到真相）
 */
export const useVisualFilter = () => {
  const san = useGameStore((state) => state.vitality.metrics.insight);
  const phases = vitalityRules.visuals.phases;

  return useMemo(() => {
    const mundaneMax = phases.mundaneMax ?? 30;
    const awakenMin = phases.awakenMin ?? 71;

    // Phase 1: 蒙昧 - 正常视角（被规训的状态）
    if (san <= mundaneMax) {
      return {
        className: 'theme-mundane',
        style: { filter: 'none' },
        fontClass: 'font-sans',
        description: 'mundane'
      };
    }
    
    // Phase 2: 初觉 - 看到裂痕（过渡期）
    if (san < awakenMin) {
      return {
        className: 'theme-awakening',
        style: { 
          filter: 'sepia(0.2) contrast(1.05)', // 轻微老旧感
          transition: 'filter 2s ease'
        },
        fontClass: 'font-sans',
        description: 'awakening'
      };
    }

    // Phase 3: 觉醒 - 看到真相（金色辉光）
    return {
      className: 'theme-awakened',
      style: {
        filter: 'contrast(1.1) saturate(1.1)', // 更鲜艳
        textShadow: '0 0 20px rgba(251, 191, 36, 0.3)', // 微弱金色辉光
        transition: 'filter 1s ease',
      },
      fontClass: 'font-medium',
      description: 'awakened'
    };
  }, [san, phases.mundaneMax, phases.awakenMin]);
};
