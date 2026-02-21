/**
 * Global Progress Slice - 跨运行全局进度 (Zustand版本)
 * 
 * 原 Redux slice 的 Zustand 适配版本
 */

import { StateCreator } from 'zustand';
import type { StoreState } from '@/types/store';
import { calculateGazeIntensity } from '@/logic/systemGaze';

// ==========================================
// 类型定义
// ==========================================

export interface ArchiveMilestone {
  type: 'linear' | 'unlock';
  count: number;
  description: string;
  rewards: MilestoneReward[];
}

export interface MilestoneReward {
  type: 'narrative' | 'mechanic' | 'hint';
  content: string;
}

export interface DarkWebEchoes {
  revealedMemories: string[];
  unlockedMilestones: number[];
  narrativeFragments: string[];
}

export interface SystemGazeState {
  currentIntensity: number;
  nextThreshold: number;
  exclusiveEventsSeen: string[];
}

export interface GlobalProgressState {
  // 档案系统
  unlockedArchives: string[];
  archiveUnlockDates: Record<string, string>;
  
  // 结局
  achievedEndings: string[];
  endingUnlockDates: Record<string, string>;
  
  // 统计
  totalDeaths: number;
  totalPlayTime: number;
  totalRuns: number;
  longestSurvival: number;
  
  // 暗网回响
  darkWebEchoes: DarkWebEchoes;
  
  // 系统凝视
  systemGaze: SystemGazeState;
  
  // UI状态
  showMilestoneModal: boolean;
  pendingMilestone: ArchiveMilestone | null;
  
  // Actions
  unlockArchive: (archiveId: string, triggerEventId?: string) => void;
  unlockEnding: (endingId: string) => void;
  recordDeath: (survivedWeeks: number) => void;
  addPlayTime: (minutes: number) => void;
  startNewRun: () => void;
  addDarkWebEcho: (memoryId: string, narrativeFragment: string) => void;
  recordGazeEvent: (eventId: string) => void;
  dismissMilestone: () => void;
  resetProgress: () => void;
  
  // Selectors
  getTotalArchives: () => number;
  getArchiveCountsByClass: () => { homeless: number; worker: number; middle: number; capitalist: number; total: number };
  getGazeIntensity: () => number;
  getDOptionPenaltyReduction: () => number;
  hasUnlockedClass: (className: string) => boolean;
}

// ==========================================
// 初始状态
// ==========================================

const initialGlobalProgress = {
  unlockedArchives: [],
  archiveUnlockDates: {},
  achievedEndings: [],
  endingUnlockDates: {},
  totalDeaths: 0,
  totalPlayTime: 0,
  totalRuns: 0,
  longestSurvival: 0,
  darkWebEchoes: {
    revealedMemories: [],
    unlockedMilestones: [],
    narrativeFragments: []
  },
  systemGaze: {
    currentIntensity: 0,
    nextThreshold: 20,
    exclusiveEventsSeen: []
  },
  showMilestoneModal: false,
  pendingMilestone: null
};

// ==========================================
// 辅助函数
// ==========================================

function checkMilestone(
  archiveCount: number,
  darkWebEchoes: DarkWebEchoes
): ArchiveMilestone | null {
  // 线性奖励：每3个
  if (archiveCount % 3 === 0 && !darkWebEchoes.unlockedMilestones.includes(archiveCount)) {
    const reduction = Math.min(0.67, 1 - 1 / (1 + archiveCount / 20));
    return {
      type: 'linear',
      count: archiveCount,
      description: `已解锁 ${archiveCount} 份档案`,
      rewards: [{
        type: 'mechanic',
        content: `D选项惩罚减少 ${(reduction * 100).toFixed(0)}%`
      }]
    };
  }
  
  // 解锁里程碑：10, 25, 40
  const unlockMilestones = [10, 25, 40];
  for (const threshold of unlockMilestones) {
    if (archiveCount === threshold && !darkWebEchoes.unlockedMilestones.includes(threshold)) {
      return {
        type: 'unlock',
        count: threshold,
        description: `里程碑：${threshold} 份档案解锁`,
        rewards: getUnlockRewards(threshold)
      };
    }
  }
  
  return null;
}

function getUnlockRewards(threshold: number): MilestoneReward[] {
  const rewards: Record<number, MilestoneReward[]> = {
    10: [
      { type: 'narrative', content: '你感觉到有什么东西在观察你...' },
      { type: 'mechanic', content: '解锁 Worker 阶级专属事件' }
    ],
    25: [
      { type: 'narrative', content: '系统的目光更加强烈了。' },
      { type: 'mechanic', content: '解锁 Middle 阶级专属事件' },
      { type: 'mechanic', content: 'D选项惩罚减少 40%' }
    ],
    40: [
      { type: 'narrative', content: '你已经看到了太多。系统开始反击。' },
      { type: 'mechanic', content: '解锁 Capitalist 阶级专属事件' },
      { type: 'mechanic', content: '解锁 "凝视" 专属事件池' },
      { type: 'hint', content: '某些事件只在系统凝视强度足够时才会出现...' }
    ]
  };
  return rewards[threshold] || [];
}

// ==========================================
// Slice Creator
// ==========================================

export const createGlobalProgressSlice: StateCreator<
  StoreState,
  [],
  [],
  GlobalProgressState
> = (set, get) => ({
  ...initialGlobalProgress,

  // 解锁档案
  unlockArchive: (archiveId: string, _triggerEventId?: string) => {
    const state = get();
    const currentArchives = state.unlockedArchives;
    
    if (!currentArchives.includes(archiveId)) {
      const newArchives = [...currentArchives, archiveId];
      const newCount = newArchives.length;
      
      // 更新暗网回响
      const newDarkWebEchoes = { ...state.darkWebEchoes };
      
      // 检查里程碑
      const milestone = checkMilestone(newCount, newDarkWebEchoes);
      if (milestone) {
        newDarkWebEchoes.unlockedMilestones = [...newDarkWebEchoes.unlockedMilestones, newCount];
      }
      
      set({
        unlockedArchives: newArchives,
        archiveUnlockDates: {
          ...state.archiveUnlockDates,
          [archiveId]: new Date().toISOString()
        },
        systemGaze: {
          ...state.systemGaze,
          currentIntensity: calculateGazeIntensity(newCount)
        },
        darkWebEchoes: newDarkWebEchoes,
        showMilestoneModal: !!milestone,
        pendingMilestone: milestone
      });
    }
  },

  // 解锁结局
  unlockEnding: (endingId: string) => {
    const state = get();
    if (!state.achievedEndings.includes(endingId)) {
      set({
        achievedEndings: [...state.achievedEndings, endingId],
        endingUnlockDates: {
          ...state.endingUnlockDates,
          [endingId]: new Date().toISOString()
        }
      });
    }
  },

  // 记录死亡
  recordDeath: (survivedWeeks: number) => {
    const state = get();
    set({
      totalDeaths: state.totalDeaths + 1,
      totalRuns: state.totalRuns + 1,
      longestSurvival: Math.max(state.longestSurvival, survivedWeeks)
    });
  },

  // 增加游戏时间
  addPlayTime: (minutes: number) => {
    const state = get();
    set({ totalPlayTime: state.totalPlayTime + minutes });
  },

  // 开始新游戏
  startNewRun: () => {
    const state = get();
    set({ totalRuns: state.totalRuns + 1 });
  },

  // 添加暗网回响
  addDarkWebEcho: (memoryId: string, narrativeFragment: string) => {
    const state = get();
    const echoes = state.darkWebEchoes;
    
    if (!echoes.revealedMemories.includes(memoryId)) {
      set({
        darkWebEchoes: {
          ...echoes,
          revealedMemories: [...echoes.revealedMemories, memoryId],
          narrativeFragments: [...echoes.narrativeFragments, narrativeFragment]
        }
      });
    }
  },

  // 记录System Gaze事件
  recordGazeEvent: (eventId: string) => {
    const state = get();
    if (!state.systemGaze.exclusiveEventsSeen.includes(eventId)) {
      set({
        systemGaze: {
          ...state.systemGaze,
          exclusiveEventsSeen: [...state.systemGaze.exclusiveEventsSeen, eventId]
        }
      });
    }
  },

  // 关闭里程碑弹窗
  dismissMilestone: () => {
    set({ showMilestoneModal: false, pendingMilestone: null });
  },

  // 重置进度
  resetProgress: () => {
    set(initialGlobalProgress);
  },

  // ==========================================
  // Selectors
  // ==========================================

  getTotalArchives: () => get().unlockedArchives.length,

  getArchiveCountsByClass: () => {
    const archives = get().unlockedArchives;
    return {
      homeless: archives.filter(id => id.includes('H') || /^No\.0[1-9]/.test(id)).length,
      worker: archives.filter(id => id.includes('W')).length,
      middle: archives.filter(id => id.includes('M')).length,
      capitalist: archives.filter(id => id.includes('C')).length,
      total: archives.length
    };
  },

  getGazeIntensity: () => calculateGazeIntensity(get().unlockedArchives.length),

  getDOptionPenaltyReduction: () => {
    const total = get().unlockedArchives.length;
    return Math.min(0.67, 1 - 1 / (1 + total / 20));
  },

  hasUnlockedClass: (className: string) => {
    const archives = get().unlockedArchives;
    switch (className.toUpperCase()) {
      case 'WORKER': return archives.length >= 10;
      case 'MIDDLE': return archives.length >= 25;
      case 'CAPITALIST': return archives.length >= 40;
      default: return true;
    }
  }
});
