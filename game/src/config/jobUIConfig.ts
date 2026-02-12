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

// 效率曲线配置
export interface EfficiencyLevel {
  maxSan: number;
  modifier: number;
  label: string;
  description: string;
}

export const EFFICIENCY_LEVELS: EfficiencyLevel[] = [
  {
    maxSan: 20,
    modifier: 1.2,
    label: '麻木',
    description: 'SAN值极低，你已麻木，工作效率异常提升',
  },
  {
    maxSan: 50,
    modifier: 1.0,
    label: '稳定',
    description: 'SAN值正常，工作效率稳定',
  },
  {
    maxSan: 80,
    modifier: 0.6,
    label: '分心',
    description: 'SAN值偏高，你开始听到低语，效率下降',
  },
  {
    maxSan: 100,
    modifier: 0.2,
    label: '灵视干扰',
    description: 'SAN值过高，现实开始扭曲，几乎无法工作',
  },
];

// 获取当前 SAN 值对应的效率等级
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
