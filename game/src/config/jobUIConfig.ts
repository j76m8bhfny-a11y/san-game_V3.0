/**
 * 工作系统 UI 配置
 * 统一管理工作按钮文案、提示信息等
 */

export type JobTheme = 'SLUMS' | 'RUST_BELT' | 'DOWNTOWN' | 'GLOBAL';

export interface JobButtonLabels {
  active: string;      // 已入职状态
  canApply: string;    // 可申请状态
  locked: string;      // 锁定状态
}

// 各主题按钮文案配置
export const JOB_BUTTON_LABELS: Record<JobTheme, JobButtonLabels> = {
  SLUMS: {
    active: 'QUIT!',
    canApply: 'CALL ME',
    locked: 'NO WAY',
  },
  RUST_BELT: {
    active: '[ PUNCH OUT ]',
    canApply: '[ PUNCH IN ]',
    locked: '[ ACCESS DENIED ]',
  },
  DOWNTOWN: {
    active: 'Resign',
    canApply: 'Apply Now',
    locked: 'Locked',
  },
  GLOBAL: {
    active: 'Leave',
    canApply: 'Join',
    locked: 'Unavailable',
  },
};

// 效率曲线配置 - 基于灵视值（Insight）
// 灵视值越高，越难融入世俗工作，效率越低
export interface EfficiencyLevel {
  maxSan: number;  // 最大灵视值阈值
  modifier: number;
  label: string;
  description: string;
}

export const EFFICIENCY_LEVELS: EfficiencyLevel[] = [
  {
    maxSan: 30,
    modifier: 1.0,
    label: '蒙昧',
    description: '灵视值低，被体制规训，工作效率正常',
  },
  {
    maxSan: 70,
    modifier: 0.8,
    label: '初觉',
    description: '灵视值中等，开始质疑现实，效率略微下降',
  },
  {
    maxSan: 85,
    modifier: 0.6,
    label: '觉醒',
    description: '灵视值高，难以融入世俗，效率明显下降',
  },
  {
    maxSan: 100,
    modifier: 0.4,
    label: '通透',
    description: '灵视值极高，被视为疯子，几乎无法工作',
  },
];

// 获取当前灵视值对应的效率等级
export function getEfficiencyLevel(currentSan: number): EfficiencyLevel {
  for (const level of EFFICIENCY_LEVELS) {
    if (currentSan <= level.maxSan) {
      return level;
    }
  }
  return EFFICIENCY_LEVELS[EFFICIENCY_LEVELS.length - 1];
}

// 薪资周期显示配置
export const PAY_CYCLE_LABELS: Record<string, string> = {
  DAILY: '/天',
  WEEKLY: '/周',
  MONTHLY: '/月',
};
