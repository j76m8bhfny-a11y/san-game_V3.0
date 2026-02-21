/**
 * 档案增益中间件系统 (Dark Web Echoes)
 * 
 * 核心理念：
 * - 档案是跨周目继承的"系统漏洞说明书"
 * - 解锁档案永久降低游戏难度（但保留张力）
 * - 使用装饰器模式，零侵入现有计算逻辑
 */

import { StoreState } from '@/types/store';
import { PlayerClass } from '@/types/schema';

// ==========================================
// 1. 类型定义
// ==========================================

/**
 * 各阶级档案计数
 */
export interface ArchiveCounts {
  total: number;           // 总解锁数
  homeless: number;        // 流浪汉系列 (No.01-60)
  worker: number;          // 工人系列 (No.W01-60)
  middle: number;          // 中产系列 (No.M01-60)
  capitalist: number;      // 资本家系列 (No.C01-60)
}

/**
 * 档案里程碑奖励
 */
export interface MilestoneReward {
  type: 'PASSIVE' | 'UNLOCK_EVENT' | 'UNLOCK_JOB' | 'UNLOCK_ENDING' | 'IMMUNITY';
  description: string;
  value?: number;
  unlockId?: string;
}

// ==========================================
// 2. 档案计数解析
// ==========================================

/**
 * 解析档案ID获取分类计数
 * 
 * ID格式规则：
 * - HOMELESS: No.01-60 或 HOMELESS_xxx
 * - WORKER: No.W01-60 或 WORKER_xxx
 * - MIDDLE: No.M01-60 或 MIDDLE_xxx
 * - CAPITALIST: No.C01-60 或 CAPITALIST_xxx
 */
export function getArchiveCounts(archives: string[]): ArchiveCounts {
  return {
    total: archives.length,
    
    homeless: archives.filter(id => 
      id.match(/^No\.(0[1-9]|[1-5][0-9]|60)_/) || // No.01-60
      id.startsWith('HOMELESS_')
    ).length,
    
    worker: archives.filter(id => 
      id.match(/^No\.W(0[1-9]|[1-5][0-9]|60)_/) || // No.W01-W60
      id.startsWith('WORKER_')
    ).length,
    
    middle: archives.filter(id => 
      id.match(/^No\.M(0[1-9]|[1-5][0-9]|60)_/) || // No.M01-M60
      id.startsWith('MIDDLE_')
    ).length,
    
    capitalist: archives.filter(id => 
      id.match(/^No\.C(0[1-9]|[1-5][0-9]|60)_/) || // No.C01-C60
      id.startsWith('CAPITALIST_')
    ).length
  };
}

// ==========================================
// 3. 核心装饰器工厂
// ==========================================

/**
 * 通用档案增益装饰器
 * 
 * 使用示例：
 * const calculateHomelessPenalty = withArchiveBonus(
 *   baseCalculator,
 *   (baseResult, counts, state) => modifiedResult
 * );
 */
export function withArchiveBonus<
  T extends (state: StoreState, ...args: any[]) => any
>(
  baseCalculator: T,
  modifier: (
    baseResult: ReturnType<T>,
    counts: ArchiveCounts,
    state: StoreState
  ) => ReturnType<T>
): T {
  return ((state: StoreState, ...args: any[]) => {
    const baseResult = baseCalculator(state, ...args);
    const counts = getArchiveCounts(state.unlockedArchives || []);
    return modifier(baseResult, counts, state);
  }) as T;
}

// ==========================================
// 4. D选项减免计算（全局）
// ==========================================

/**
 * 计算D选项惩罚减免率
 * 
 * 公式：减免率 = Math.min(0.67, 1 - 1 / (1 + totalArchives / 20))
 * 
 * 体验曲线：
 * - 0个档案：0%减免（-18 HP）
 * - 10个档案：33%减免（-12 HP）
 * - 20个档案：50%减免（-9 HP）
 * - 40个档案：67%减免（-6 HP，上限）
 */
export function calculateDOptionReduction(totalArchives: number): number {
  return Math.min(0.67, 1 - 1 / (1 + totalArchives / 20));
}

/**
 * 获取D选项实际HP惩罚
 */
export const calculateDOptionHpCost = withArchiveBonus(
  (_state: StoreState, baseHpCost: number) => baseHpCost,
  (baseHpCost, counts) => {
    const reduction = calculateDOptionReduction(counts.total);
    return Math.round(baseHpCost * (1 - reduction));
  }
);

// ==========================================
// 5. HOMELESS系列奖励
// ==========================================

/**
 * 计算流浪汉惩罚减免
 * 
 * 每3个档案：homelessPenalty.physicalDefense 降低 5%
 * 最多降低 50%（解锁30个时达到上限）
 */
export const getEffectiveHomelessPenalty = withArchiveBonus(
  (_state: StoreState, basePenalty: number) => basePenalty,
  (basePenalty, counts) => {
    const reductionSteps = Math.floor(counts.homeless / 3);
    const reductionPercent = Math.min(0.50, reductionSteps * 0.05);
    return basePenalty * (1 - reductionPercent);
  }
);

/**
 * 检查是否解锁：无家可归信用惩罚免疫
 * 需要25个HOMELESS档案
 */
export const hasHomelessCreditImmunity = withArchiveBonus(
  (_state: StoreState) => false,
  (_, counts) => counts.homeless >= 25
);

/**
 * 检查是否解锁：黑市诊所
 * 需要10个HOMELESS档案
 */
export const hasUnlockedBlackMarketClinic = withArchiveBonus(
  (_state: StoreState) => false,
  (_, counts) => counts.homeless >= 10
);

// ==========================================
// 6. WORKER系列奖励
// ==========================================

/**
 * 计算工人工作HP消耗减免
 * 
 * 每3个档案：hpCost 减 1点
 * 最多减 10点
 * 下限保护：不低于基础值的20%或绝对值1
 */
export const getEffectiveWorkerHpCost = (
  params: { baseHpCost: number; jobClass?: PlayerClass },
  totalArchives?: number
): number => {
  const { baseHpCost, jobClass } = params;
  
  // 仅对工人阶级工作生效
  if (jobClass && jobClass !== 'WORKER') {
    return baseHpCost;
  }
  
  const workerCount = totalArchives ? Math.floor(totalArchives * 0.25) : 0; // 估算worker数量
  const reduction = Math.min(10, Math.floor(workerCount / 3));
  const minCost = Math.max(baseHpCost * 0.2, 1);
  return Math.max(minCost, baseHpCost - reduction);
};

/**
 * 计算成瘾衰退速度倍率
 * 
 * 10个档案：x1.5倍
 * 线性增长：每10个档案+0.5倍，最高x3.0倍
 */
export const getAddictionDecayMultiplier = withArchiveBonus(
  (_state: StoreState) => 1.0,
  (_, counts) => {
    const baseMultiplier = 1.0;
    const bonus = Math.min(2.0, Math.floor(counts.worker / 10) * 0.5);
    return baseMultiplier + bonus;
  }
);

/**
 * 检查是否免疫工伤事件
 * 需要25个WORKER档案
 */
export const hasInjuryEventImmunity = withArchiveBonus(
  (_state: StoreState) => false,
  (_, counts) => counts.worker >= 25
);

/**
 * 检查是否解锁：黑市工会组织者职业
 * 需要40个WORKER档案
 */
export const hasUnlockedUnionOrganizer = withArchiveBonus(
  (_state: StoreState) => false,
  (_, counts) => counts.worker >= 40
);

// ==========================================
// 7. MIDDLE系列奖励
// ==========================================

/**
 * 计算贷款利率减免
 * 
 * 每3个档案：利率降低 2%（乘法）
 * 最多降低 30%
 * 绝对下限：3%
 */
export const getEffectiveInterestRate = withArchiveBonus(
  (_state: StoreState, baseRate: number) => baseRate,
  (baseRate, counts) => {
    const reductionSteps = Math.floor(counts.middle / 3);
    const reductionPercent = Math.min(0.30, reductionSteps * 0.02);
    const reducedRate = baseRate * (1 - reductionPercent);
    return Math.max(0.03, reducedRate); // 最低3%
  }
);

/**
 * 检查中产10件套效果：
 * 当灵视>50时，中产工作无SAN消耗
 */
export const hasMiddleSanImmunity = withArchiveBonus(
  (state: StoreState) => {
    const insight = state.vitality?.metrics?.insight ?? 0;
    return insight > 50;
  },
  (hasHighInsight, counts) => {
    return counts.middle >= 10 && hasHighInsight;
  }
);

/**
 * 检查是否免疫HOA罚单
 * 需要25个MIDDLE档案
 */
export const hasHoaImmunity = withArchiveBonus(
  (_state: StoreState) => false,
  (_, counts) => counts.middle >= 25
);

/**
 * 检查是否解锁：FIRE结局
 * 需要40个MIDDLE档案
 */
export const hasUnlockedFireEnding = withArchiveBonus(
  (_state: StoreState) => false,
  (_, counts) => counts.middle >= 40
);

// ==========================================
// 8. CAPITALIST系列奖励
// ==========================================

/**
 * 计算开局信用分加成
 * 
 * 每2个档案：+25分
 * 最多+200分（从500到700）
 */
export const getCapitalistStartingCredit = withArchiveBonus(
  (_state: StoreState) => 500, // 基础值
  (baseCredit, counts) => {
    const bonus = Math.min(200, Math.floor(counts.capitalist / 2) * 25);
    return baseCredit + bonus;
  }
);

/**
 * 计算加密交易手续费倍率
 * 
 * 5个档案：手续费减半（x0.5）
 */
export const getCryptoFeeMultiplier = withArchiveBonus(
  (_state: StoreState) => 1.0,
  (_, counts) => {
    if (counts.capitalist >= 5) return 0.5;
    return 1.0;
  }
);

/**
 * 检查是否解锁：做空美利坚事件链
 * 需要10个CAPITALIST档案
 */
export const hasUnlockedShortAmerica = withArchiveBonus(
  (_state: StoreState) => false,
  (_, counts) => counts.capitalist >= 10
);

/**
 * 检查是否解锁：真结局前提
 * 需要15个CAPITALIST档案
 */
export const hasUnlockedTrueEnding = withArchiveBonus(
  (_state: StoreState) => false,
  (_, counts) => counts.capitalist >= 15
);

// ==========================================
// 9. 里程碑汇总查询
// ==========================================

/**
 * 获取所有已解锁的里程碑奖励（用于UI展示）
 */
export function getUnlockedMilestones(counts: ArchiveCounts): {
  category: string;
  count: number;
  milestones: { threshold: number; reward: string }[];
}[] {
  return [
    {
      category: 'HOMELESS',
      count: counts.homeless,
      milestones: [
        { threshold: 3, reward: '街头惩罚 -5%' },
        { threshold: 10, reward: '解锁黑市诊所' },
        { threshold: 25, reward: '免疫信用惩罚' },
        { threshold: 40, reward: '解锁结局：地下市长' }
      ].filter(m => counts.homeless >= m.threshold)
    },
    {
      category: 'WORKER',
      count: counts.worker,
      milestones: [
        { threshold: 3, reward: '工作HP消耗 -1' },
        { threshold: 10, reward: '成瘾衰退 x1.5' },
        { threshold: 25, reward: '免疫工伤事件' },
        { threshold: 40, reward: '解锁职业：工会组织者' }
      ].filter(m => counts.worker >= m.threshold)
    },
    {
      category: 'MIDDLE',
      count: counts.middle,
      milestones: [
        { threshold: 3, reward: '贷款利率 -2%' },
        { threshold: 10, reward: '高灵视工作无惩罚' },
        { threshold: 25, reward: '免疫HOA罚单' },
        { threshold: 40, reward: '解锁结局：FIRE' }
      ].filter(m => counts.middle >= m.threshold)
    },
    {
      category: 'CAPITALIST',
      count: counts.capitalist,
      milestones: [
        { threshold: 2, reward: '开局信用 +25' },
        { threshold: 5, reward: '加密手续费减半' },
        { threshold: 10, reward: '解锁事件：做空美利坚' },
        { threshold: 15, reward: '解锁真结局前提' }
      ].filter(m => counts.capitalist >= m.threshold)
    }
  ];
}

// ==========================================
// 10. 调试工具
// ==========================================

/**
 * 打印当前档案增益状态（调试用）
 */
export function printArchiveStatus(state: StoreState): string {
  const counts = getArchiveCounts(state.unlockedArchives || []);
  const dReduction = calculateDOptionReduction(counts.total);
  
  let output = '\n╔══════════════════════════════════════════════════════════╗\n';
  output += '║              暗网回声 (Dark Web Echoes)                   ║\n';
  output += '╚══════════════════════════════════════════════════════════╝\n\n';
  
  output += `📊 档案收集统计:\n`;
  output += `   总计: ${counts.total} | 流浪: ${counts.homeless} | 工人: ${counts.worker} | 中产: ${counts.middle} | 资本: ${counts.capitalist}\n\n`;
  
  output += `💀 D选项减免率: ${(dReduction * 100).toFixed(1)}%\n`;
  output += `   基础惩罚: -18 HP → 实际惩罚: ${Math.round(-18 * (1 - dReduction))} HP\n\n`;
  
  const milestones = getUnlockedMilestones(counts);
  output += `🏆 已解锁里程碑:\n`;
  milestones.forEach(cat => {
    if (cat.milestones.length > 0) {
      output += `   [${cat.category}] ${cat.count}个:\n`;
      cat.milestones.forEach(m => {
        output += `      ✓ ${m.threshold}个: ${m.reward}\n`;
      });
    }
  });
  
  return output;
}
