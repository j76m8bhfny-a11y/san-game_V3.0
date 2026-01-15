import { GameState } from '../types/schema';
import { PlayerClass } from '../types/schema';

export const resolveEnding = (state: GameState, deathReason?: string): string => {
  const { hp, san, gold, currentClass, points, hasRedBook, hasCryptoKey } = state;

  // --- 优先级 1: 死亡 ---
  if (hp <= 0 || deathReason) {
    if (deathReason === 'DISMANTLED') return 'ED-03';
    if (deathReason === 'COP') return 'ED-04';
    if (deathReason === 'SUICIDE' || (san > 80 && deathReason === 'HP')) return 'ED-05';
    if (currentClass === PlayerClass.Homeless) return 'ED-01';
    return 'ED-02';
  }
    if (points.red >= 5 && hp < 20 && state.day >= 38) {
    return 'ED-16'; 
  }
  if (state.day < 40) return '';

  // --- 优先级 2: UR ---
  const hasTrueInsight = 
    state.unlockedArchives.includes('No.16') && 
    state.unlockedArchives.includes('No.05') && 
    hasRedBook && 
    san >= 95;

  if (hasTrueInsight) return 'ED-20';

  // --- 优先级 3: 异化 ---
  const isMad = san < 10 || san > 90;
  if (isMad) {
    if (gold < 1000) return 'ED-10';
    return 'ED-11';
  }

  // --- 优先级 4: 立场 ---
  const { red, wolf, old } = points;
  if (old > 0 && old >= red && old >= wolf) return 'ED-15';
  if (red > 0 && (red > wolf || hasRedBook)) return 'ED-13';
  if (wolf > 0 && (wolf > red || hasCryptoKey)) return 'ED-14';

  // --- 优先级 5: 庸人 (生存) ---
  switch (currentClass) {
    case PlayerClass.Capitalist: return 'ED-09'; // 猪的快乐
    case PlayerClass.Middle: return 'ED-08'; // 中产噩梦
    case PlayerClass.Worker: 
      // [Fix #3] 细分逻辑：
      // Gold < 1000 -> ED-06 月光电池 (标准结局)
      // Gold >= 1000 -> ED-07 沉默的耗材 (虽然有钱但依然是底层，精神上已如流浪汉般麻木)
      return (gold < 1000) ? 'ED-06' : 'ED-07'; 
    case PlayerClass.Homeless: return 'ED-07'; // 沉默的耗材
    default: return 'ED-06';
  }
};
