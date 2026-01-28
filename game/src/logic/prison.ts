import { PlayerClass } from '../types/schema';

interface JailEffect {
  hp: number;
  san: number;
  log: string;
}

export const calculateDailyJailEffect = (currentClass: PlayerClass): JailEffect => {
  // 🦅 资本家：度假式监狱 (Club Fed)
  if (currentClass === PlayerClass.Capitalist) {
    return {
      hp: 5,  // 打打网球，反而更健康了
      san: 5, // 写写回忆录，精神更好了
      log: "你在最低安保级别的‘度假村’里打了一天高尔夫，结识了几位参议员。"
    };
  }

  // 👷 中产：还能忍受
  if (currentClass === PlayerClass.Middle) {
    return {
      hp: -5,
      san: -10,
      log: "你在单人牢房里读了一整天书。隔壁的尖叫声让你有点神经衰弱。"
    };
  }

  // 🐀 底层：人间地狱 (Rikers Island)
  // Worker 和 Homeless
  return {
    hp: -20, // 每天被打
    san: -25, // 极度恶劣的环境
    log: "这是地狱。帮派分子抢走了你的饭，狱警对此视而不见。"
  };
};