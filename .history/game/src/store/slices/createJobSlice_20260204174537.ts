import { StateCreator } from 'zustand';
import { GameState, Job, JobType, PlayerClass, RegionID } from '@/types/schema';
import jobsData from '@/assets/data/jobs.json';
import jobRules from '@/assets/data/rules/jobRules.json';

export interface JobSlice {
  // Actions
  acceptJob: (jobId: string) => { success: boolean; message: string };
  quitJob: (jobId: string) => { success: boolean; message: string };
  
  // Helpers
  getJobSlotsUsed: () => number;
}

// 阶级权重，用于判断向下兼容
const CLASS_WEIGHT = {
  [PlayerClass.Homeless]: 0,
  [PlayerClass.Worker]: 1,
  [PlayerClass.Middle]: 2,
  [PlayerClass.Capitalist]: 3
};

export const createJobSlice: StateCreator<any, [], [], JobSlice> = (set, get) => ({

  getJobSlotsUsed: () => {
    const state = get() as GameState;
    const activeJobIds = state.vitality.activeJobs || [];
    let usedSlots = 0;
    
    activeJobIds.forEach(id => {
      const job = jobsData.find(j => j.id === id) as unknown as Job;
      if (job) {
        const cost = jobRules.settings.slotCosts[job.type] || 1; 
        usedSlots += cost;
      }
    });
    return usedSlots;
  },

  acceptJob: (jobId) => {
    const state = get() as GameState;
    const { vitality, activeHousing, inventory } = state;
    const job = jobsData.find(j => j.id === jobId) as unknown as Job;

    if (!job) return { success: false, message: "工作不存在" };

    // 1. 检查是否已经拥有该工作
    if (vitality.activeJobs.includes(jobId)) {
      return { success: false, message: "你已经在这份工作中了。" };
    }

    // 2. 检查槽位限制 (全职=2, 零工=1, 上限3)
    const currentSlots = get().getJobSlotsUsed();
    const requiredSlots = jobRules.settings.slotCosts[job.type] || 1;
    const maxSlots = jobRules.settings.maxSlotCapacity;
    
    if (currentSlots + requiredSlots > maxSlots) {
      return { success: false, message: `精力不足！当前占用 ${currentSlots}/${maxSlots}` };
    }

    // 3. 检查阶级 (向下兼容)
    const playerWeight = jobRules.classWeights[vitality.identity.currentClass] ?? 0;
    const jobWeight = jobRules.classWeights[job.requiredClass] ?? 99;
    
    if (playerWeight < jobWeight) {
      return { success: false, message: "你的阶级不够，HR直接把简历扔进了垃圾桶。" };
    }

    // 4. 检查房产 (必须在本地有房，流浪汉除外)
    if (job.requiresHousing) {
      if (!activeHousing) {
        return { success: false, message: "这份工作需要固定住址。" };
      }
      if (activeHousing.region !== job.region) {
        return { success: false, message: "你住得太远了，通勤不现实。" };
      }
    }

    // 5. 检查道具 (如车)
    if (job.requiredItem) {
      const hasItem = inventory.some(itemId => itemId === job.requiredItem || itemId.includes(job.requiredItem!));
      if (!hasItem) {
        return { success: false, message: `缺少必要工具: ${job.requiredItem}` };
      }
    }

    // 成功入职
    set((prev: GameState) => ({
      // ❌ 修复：不再设置 activeJob: job
      vitality: {
        ...prev.vitality,
        activeJobs: [...prev.vitality.activeJobs, jobId]
      }
    }));

    return { success: true, message: `入职成功: ${job.title}` };
  },

  quitJob: (jobId) => {
    set((state: GameState) => ({
      vitality: {
        ...state.vitality,
        activeJobs: state.vitality.activeJobs.filter(id => id !== jobId)
      }
    }));
    return { success: true, message: "你炒了老板鱿鱼。" };
  }
});