/**
 * 工作板业务逻辑 Hook
 * 将数据查询、主题判断、操作封装从 UI 组件中抽离
 */

import { useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Job, RegionID } from '@/types/schema';
import { JobTheme } from '@/config/jobUIConfig';
import { JobCheckResult, JobRejectReason } from '@/store/slices/createJobSlice';

// 映射 Region 到主题（四区域独立设计）
const THEME_MAP: Record<RegionID, JobTheme> = {
  [RegionID.Slums]: 'SLUMS',
  [RegionID.RustBelt]: 'RUST_BELT',
  [RegionID.Suburbs]: 'SUBURBS',
  [RegionID.Downtown]: 'DOWNTOWN',
};

export interface JobBoardState {
  // 数据
  jobs: Job[];
  activeJobIds: string[];
  currentInsight: number;
  
  // 主题
  theme: JobTheme;
  isSlums: boolean;
  isFactory: boolean;
  isSuburbs: boolean;
  isDowntown: boolean;
  
  // 方法
  checkRequirements: (job: Job) => JobCheckResult;
  getReasonTranslation: (reason: JobRejectReason) => { key: string; params?: Record<string, string | number> } | { key: string };
  handleApply: (job: Job) => void;
  handleQuit: (jobId: string) => void;
  isJobActive: (jobId: string) => boolean;
}

export const useJobBoard = (): JobBoardState => {
  const { 
    gameDataCache, 
    currentRegion, 
    vitality,
    canAcceptJob,
    acceptJob, 
    quitJob,   
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 1. 主题判断
  const theme = useMemo(() => THEME_MAP[currentRegion] || 'SLUMS', [currentRegion]);
  const isSlums = theme === 'SLUMS';
  const isFactory = theme === 'RUST_BELT';
  const isSuburbs = theme === 'SUBURBS';
  const isDowntown = theme === 'DOWNTOWN';

  // 2. 获取当前区域的所有工作
  const jobs = useMemo(() => {
    if (!gameDataCache?.jobs) return [];
    return gameDataCache.jobs.filter((job: Job) => job.region === currentRegion);
  }, [gameDataCache, currentRegion]);

  // 3. 检查工作申请资格（复用 store 中的统一逻辑）
  const checkRequirements = useCallback((job: Job) => {
    return canAcceptJob(job.id);
  }, [canAcceptJob]);

  // 4. 将结构化错误转换为翻译 key（替代之前的字符串解析）
  const getReasonTranslation = useCallback((reason: JobRejectReason): { key: string; params?: Record<string, string | number> } => {
    switch (reason.type) {
      case 'JOB_NOT_FOUND':
        return { key: 'job.error.notFound' };
      case 'ALREADY_EMPLOYED':
        return { key: 'job.alreadyEmployed' };
      case 'SLOT_FULL':
        return { key: 'job.requirement.slots', params: { current: String(reason.current), max: String(reason.max) } };
      case 'CLASS_MISMATCH':
        return { key: 'job.requirement.class', params: { class: reason.required } };
      case 'FELONY_RECORD':
        return { key: 'job.requirement.felony' };
      case 'BLACKLISTED':
        return { key: 'job.requirement.blacklist', params: { turns: String(reason.remainingTurns) } };
      case 'HOUSING_REQUIRED':
        return { key: 'job.requirement.housing', params: { region: reason.region } };
      case 'ITEM_REQUIRED':
        return { key: 'job.requirement.item', params: { item: reason.item } };
      default:
        return { key: 'job.requirement.default' };
    }
  }, []);

  // 5. 处理申请
  const handleApply = useCallback((job: Job) => {
    playSfx('sfx_paper');
    const result = acceptJob(job.id);
    if (result.success) {
      addNotification(`已申请: ${job.title}`, 'success');
    } else {
      // 错误消息直接显示（已经过 canAcceptJob 校验，理论上不会失败）
      addNotification(result.message, 'error');
    }
  }, [acceptJob, addNotification, playSfx]);

  // 6. 处理辞职
  const handleQuit = useCallback((jobId: string) => {
    playSfx('sfx_click');
    const result = quitJob(jobId);
    if (result.success) {
      addNotification('已辞职', 'info');
    }
  }, [quitJob, addNotification, playSfx]);

  // 7. 检查工作是否已激活
  const isJobActive = useCallback((jobId: string) => {
    return vitality.activeJobs.includes(jobId);
  }, [vitality.activeJobs]);

  return {
    jobs,
    activeJobIds: vitality.activeJobs,
    currentInsight: vitality.metrics.insight,
    theme,
    isSlums,
    isFactory,
    isSuburbs,
    isDowntown,
    checkRequirements,
    getReasonTranslation,
    handleApply,
    handleQuit,
    isJobActive,
  };
};
