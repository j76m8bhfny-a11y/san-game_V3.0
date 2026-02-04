// src/logic/health.ts

import { GameState, RegionID } from '@/types/schema';
// ✅ 1. 导入数值配置文件
import vitalityRules from '@/assets/data/rules/vitalityRules.json';

// 特定环境对应的疾病池 (结构性数据保留在此，或后续移至 global_config.json)
const REGION_DISEASES: Record<RegionID, string[]> = {
  [RegionID.Slums]: ['FLU_LOW', 'SEPSIS', 'ACUTE_GASTRITIS'],
  [RegionID.RustBelt]: ['WORKER_LUNG', 'FRACTURE', 'TETANUS'],
  [RegionID.Suburbs]: ['INSOMNIA', 'ALLERGY'],
  [RegionID.Downtown]: ['VOID_PSYCHOSIS', 'GOUT']
};

/**
 * 每日健康检查 (Daily Checkup)
 * 返回：触发的疾病 ID (如果没有则返回 null)
 */
export const checkDailyDisease = (state: GameState): string | null => {
  const { currentRegion, vitality, activeHousing } = state;
  const { metrics } = vitality;

  // ✅ 2. 解构配置项，方便后续调用
  const { infectionRates, modifiers, highRiskJobs } = vitalityRules.disease;
  
  // 1. 已经有急性病，不再触发新病 (避免暴毙)
  const hasAcute = vitality.activeDiseases.some(dId => dId.includes('ACUTE'));
  if (hasAcute) return null;

  // 2. 计算综合感染率
  // ✅ 替换: 直接从 JSON 读取各区域基础概率
  // 注意：JSON key 是字符串，需要断言类型或确保匹配
  let risk = (infectionRates as Record<string, number>)[currentRegion] || 0.05;

  // -- 修正因子 A: 房产保护 --
  // ✅ 替换: 1.5 / 0.6 -> modifiers.homelessPenalty / housingBonus
  if (activeHousing) {
    risk *= modifiers.housingBonus; 
  } else {
    risk *= modifiers.homelessPenalty;
  }

  // -- 修正因子 B: 职业危害 --
  // ✅ 替换: 具体的职业 ID 列表移入 JSON
  const hasHighRiskJob = vitality.activeJobs.some(id => highRiskJobs.includes(id));

  if (hasHighRiskJob) {
    // ✅ 替换: 0.05 -> modifiers.jobRiskAdd
    risk += modifiers.jobRiskAdd;
  }

  // -- 修正因子 C: 身体素质 (抵抗力) --
  // ✅ 替换: / 200 -> / modifiers.resistanceDivisor
  // resistance 越高，得病概率越低
  risk *= (1 - metrics.resistance / modifiers.resistanceDivisor);

  // -- 修正因子 D: 状态虚弱 --
  // ✅ 替换: 阈值与惩罚倍率全部参数化
  const isWeakBody = metrics.hp < metrics.maxHp * modifiers.weakBodyThresholdPct;
  const isWeakMind = metrics.san < metrics.maxSan * modifiers.weakSanThresholdPct;

  if (isWeakBody) risk *= modifiers.weakBodyMultiplier;
  if (isWeakMind) risk *= modifiers.weakSanMultiplier;

  // 3. 掷骰子
  if (Math.random() > risk) return null;

  // 4. 选择疾病
  // 优先从当前区域疾病池中选
  const pool = REGION_DISEASES[currentRegion] || ['FLU_LOW'];
  
  // 过滤掉已经得过的病 (activeDiseases)
  const availableDiseases = pool.filter(id => !vitality.activeDiseases.includes(id));
  
  if (availableDiseases.length === 0) return null;
  
  // 随机取一个
  const diseaseId = availableDiseases[Math.floor(Math.random() * availableDiseases.length)];
  return diseaseId;
};