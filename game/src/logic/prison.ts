import { PlayerClass } from '../types/schema';
import { DailyEffect, isDailyEffect } from '../types/prisonRules';
import prisonRules from '@/assets/data/rules/prisonRules.json';

/**
 * 计算每日坐牢的生理与心理影响
 * 逻辑：根据玩家阶级读取配置文件中的每日例程 (dailyRoutine)
 */
export const calculateDailyJailEffect = (currentClass: PlayerClass): DailyEffect => {
  // ✅ 防御性编程：使用可选链和默认配置兜底
  const dailyRoutine = prisonRules?.dailyRoutine;
  const defaultEffect = dailyRoutine?.default ?? { hpChange: -20, sanChange: -25, log: '这是地狱。' };
  const classOverrides = dailyRoutine?.classOverrides ?? {};
  
  // 1. 获取该阶级的配置
  const config = classOverrides[currentClass];

  // 2. 检查配置类型 - 使用类型守卫
  if (isDailyEffect(config)) {
    return config;
  }

  // 3. 默认回退逻辑
  // 如果配置是 "default" 字符串、未定义、或格式不匹配，则应用默认惩罚 (人间地狱模式)
  return defaultEffect;
};