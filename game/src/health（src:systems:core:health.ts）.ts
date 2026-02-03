// src/logic/health.ts
import { GameState, PlayerClass, RegionID, Disease } from '@/types/schema';

// 基础感染率配置 (可移至 JSON)
const ENV_RISK: Record<RegionID, number> = {
  [RegionID.Slums]: 0.15,     // 15% 基础致病率
  [RegionID.RustBelt]: 0.10,
  [RegionID.Suburbs]: 0.05,
  [RegionID.Downtown]: 0.02
};

// 特定环境对应的疾病池
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
  const { currentRegion, vitality, activeHousing, activeJob } = state;
  const { metrics, identity } = vitality;
  
  // 1. 已经有急性病，不再触发新病 (避免暴毙)
  const hasAcute = vitality.activeDiseases.some(dId => dId.includes('ACUTE'));
  if (hasAcute) return null;

  // 2. 计算综合感染率
  let risk = ENV_RISK[currentRegion] || 0.05;

  // -- 修正因子 A: 房产保护 --
  // 如果有房产，降低风险；流浪汉(无房)风险加倍
  if (activeHousing) {
    risk *= 0.6; // 住在房子里比露宿街头安全
  } else {
    risk *= 1.5;
  }

  // -- 修正因子 B: 职业危害 --
  // 如果工作是高危类型 (假设 Job 数据里有 dangerLevel，这里简化判断)
  if (activeJob && ['MINER', 'TEST_SUBJECT'].includes(activeJob.id)) {
    risk += 0.05;
  }

  // -- 修正因子 C: 身体素质 (抵抗力) --
  // resistance 越高，得病概率越低 (100 resistance = 免役一半概率)
  risk *= (1 - metrics.resistance / 200);

  // -- 修正因子 D: 状态虚弱 --
  // HP 或 SAN 过低时，免疫系统崩溃
  if (metrics.hp < metrics.maxHp * 0.3) risk *= 1.5;
  if (metrics.san < metrics.maxSan * 0.2) risk *= 1.2;

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