import { PlayerClass } from '../types/schema';
import prisonRules from '@/assets/data/rules/prisonRules.json';

interface JailEffect {
  hp: number;
  san: number;
  log: string;
}

/**
 * 计算每日坐牢的生理与心理影响
 * 逻辑：根据玩家阶级读取配置文件中的每日例程 (dailyRoutine)
 */
export const calculateDailyJailEffect = (currentClass: PlayerClass): JailEffect => {
  const { default: defaultEffect, classOverrides } = prisonRules.dailyRoutine;
  
  // 1. 获取该阶级的配置
  // 使用类型断言访问 JSON 对象，获取对应阶级的配置
  const config = (classOverrides as Record<string, any>)[currentClass];

  // 2. 检查配置类型
  // 如果配置存在且是一个对象（说明有特殊待遇），则应用该配置
  if (config && typeof config === 'object') {
    return {
      hp: config.hpChange,
      san: config.sanChange,
      log: config.log
    };
  }

  // 3. 默认回退逻辑
  // 如果配置是 "default" 字符串、未定义、或格式不匹配，则应用默认惩罚 (人间地狱模式)
  return {
    hp: defaultEffect.hpChange,
    san: defaultEffect.sanChange,
    log: defaultEffect.log
  };
};