/**
 * useBurningConfig - 燃烧效果配置 Hook
 * 集中管理燃烧效果配置，避免重复定义
 */

import { useMemo } from 'react';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import type { BurningEffectConfig } from '@/types/narrative';

interface BurningConfigResult {
  config: BurningEffectConfig;
  enabled: boolean;
  getWhispers: (optionId: string) => string;
}

const DEFAULT_CONFIG: BurningEffectConfig = {
  enabled: true,
  grayscaleIntensity: 100,
  scaleReduction: 0.95,
  animationDuration: 0.8,
  ashOpacity: 0.4,
  whisperDuration: 2,
  whisperDelay: 0.3,
  ghostWhispers: {}
};

export function useBurningConfig(): BurningConfigResult {
  const config = useMemo((): BurningEffectConfig => {
    const burningConfig = (NARRATIVE_RULES as unknown as { burningEffect?: BurningEffectConfig }).burningEffect;
    
    if (!burningConfig) {
      return DEFAULT_CONFIG;
    }
    
    return {
      ...DEFAULT_CONFIG,
      ...burningConfig,
      ghostWhispers: burningConfig.ghostWhispers || {}
    };
  }, []);

  const getWhispers = useMemo(() => {
    return (optionId: string): string => {
      return config.ghostWhispers[optionId] || 
        config.ghostWhispers['default'] || 
        '那些被放弃的选择...';
    };
  }, [config]);

  return {
    config,
    enabled: config.enabled !== false,
    getWhispers
  };
}

export default useBurningConfig;
