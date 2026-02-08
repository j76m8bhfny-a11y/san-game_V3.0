/**
 * 随机数生成器工具
 * 支持依赖注入，便于测试时使用固定种子
 */

export type RandomGenerator = () => number;

/**
 * 创建种子随机数生成器
 * 使用简单的线性同余算法 (LCG)
 */
export const createSeededRandom = (seed: number): RandomGenerator => {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

/**
 * 默认随机数生成器（使用 Math.random）
 */
export const defaultRandom: RandomGenerator = () => Math.random();

/**
 * 随机数生成器实例（可被替换）
 */
let currentRandom: RandomGenerator = defaultRandom;

/**
 * 设置随机数生成器（用于测试）
 */
export const setRandomGenerator = (generator: RandomGenerator) => {
  currentRandom = generator;
};

/**
 * 获取当前随机数生成器
 */
export const getRandomGenerator = (): RandomGenerator => currentRandom;

/**
 * 生成 [0, 1) 范围内的随机数
 */
export const random = (): number => currentRandom();

/**
 * 生成 [min, max) 范围内的随机数
 */
export const randomRange = (min: number, max: number): number => {
  return min + random() * (max - min);
};

/**
 * 从数组中随机选择一个元素
 */
export const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(random() * array.length)];
};

/**
 * 加权随机选择
 * @param items 带权重的项目数组
 * @param getWeight 获取权重的函数
 */
export const weightedRandom = <T>(
  items: T[],
  getWeight: (item: T) => number
): T | null => {
  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
  if (totalWeight === 0) return null;
  
  let randomValue = random() * totalWeight;
  
  for (const item of items) {
    randomValue -= getWeight(item);
    if (randomValue <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1];
};
