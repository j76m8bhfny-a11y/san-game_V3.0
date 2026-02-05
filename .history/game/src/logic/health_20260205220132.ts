// src/logic/health.ts

import { GameState, Disease } from '@/types/schema';
// ✅ 引入数值配置文件
import vitalityRules from '@/assets/data/rules/vitalityRules.json';

/**
 * 每日健康检查 (Daily Checkup)
 * 逻辑流：计算感染率 -> 判定是否通过 -> 从区域池中随机选择疾病
 * * @param state 当前游戏状态
 * @param allDiseases 所有的疾病定义缓存 (用于查找疾病类型，判断是否为急性病)
 * @returns 触发的疾病 ID (如果没有则返回 null)
 */
export const checkDailyDisease = (state: GameState, allDiseases: Disease[] = []): string | null => {
  const { currentRegion, vitality, activeHousing } = state;
  
  const { metrics } = vitality;

  // ✅ 1. 解构配置项
  // 注意：distribution 需要在 vitalityRules.json 的 disease 字段下配置
  // 使用 as any 绕过类型检查，或者更新 vitalityRules 的类型定义
  const { infectionRates, modifiers, highRiskJobs, distribution } = vitalityRules.disease as any;
  
  // 2. 检查是否已有急性病 (防暴毙保护)
  // 逻辑：如果玩家已经患有 ACUTE (急性) 类型的病，通常不再触发新病，以免连续高额扣血导致无法挽回
  const hasAcute = vitality.activeDiseases.some(dId => {
    // 优先查表判断 type
    const def = allDiseases.find(d => d.id === dId);
    if (def) {
      return def.type === 'ACUTE';
    }
    // 兜底兼容：如果没传 definitions，退化为 ID 字符串匹配
    return dId.includes('ACUTE') || dId === 'SEPSIS';
  });

  if (hasAcute) return null;

  // 3. 计算综合感染率
  // 从 JSON 读取各区域基础概率
  const regionKey = currentRegion as string;
  let risk = (infectionRates as Record<string, number>)[regionKey] || 0.05;

  // -- 修正因子 A: 房产保护 --
  if (activeHousing) {
    risk *= modifiers.housingBonus; 
  } else {
    risk *= modifiers.homelessPenalty;
  }

  // -- 修正因子 B: 职业危害 --
  const hasHighRiskJob = vitality.activeJobs.some(id => highRiskJobs.includes(id));
  if (hasHighRiskJob) {
    risk += modifiers.jobRiskAdd;
  }

  // -- 修正因子 C: 身体素质 (抵抗力) --
  // resistance 越高，得病概率越低 (resistanceDivisor 通常为 200 或更高)
  risk *= (1 - metrics.resistance / modifiers.resistanceDivisor);

  // -- 修正因子 D: 状态虚弱 --
  const isWeakBody = metrics.hp < metrics.maxHp * modifiers.weakBodyThresholdPct;
  const isWeakMind = metrics.san < metrics.maxSan * modifiers.weakSanThresholdPct;

  if (isWeakBody) risk *= modifiers.weakBodyMultiplier;
  if (isWeakMind) risk *= modifiers.weakSanMultiplier;

  // 4. 掷骰子 (Risk Check)
  if (Math.random() > risk) return null;

  // 5. 选择疾病
  // ✅ 重构：从 JSON 配置读取当前区域的疾病分布
  const pool = (distribution as Record<string, string[]>)[regionKey];
  
  // 如果该区域没有配置疾病池，或者池子为空，则安全返回
  if (!pool || !Array.isArray(pool) || pool.length === 0) {
    return null;
  }
  
  // 过滤掉已经得过的病 (activeDiseases)
  const availableDiseases = pool.filter(id => !vitality.activeDiseases.includes(id));
  
  if (availableDiseases.length === 0) return null;
  
  // 随机取一个
  const diseaseId = availableDiseases[Math.floor(Math.random() * availableDiseases.length)];
  return diseaseId;
};