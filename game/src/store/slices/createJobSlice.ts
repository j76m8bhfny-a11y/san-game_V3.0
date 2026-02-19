import { StateCreator } from 'zustand';
import { GameState, Job, JobType, PlayerClass, RegionID } from '@/types/schema';
import { StoreState } from '@/types/store';
import jobsData from '@/assets/data/jobs.json';
import jobRules from '@/assets/data/rules/jobRules.json';

export interface JobSlice {
  // Actions
  acceptJob: (jobId: string) => { success: boolean; message: string };
  quitJob: (jobId: string) => { success: boolean; message: string };
  
  // Helpers
  getJobSlotsUsed: () => number;
}



export const createJobSlice: StateCreator<StoreState, [], [], JobSlice> = (set, get) => ({

  getJobSlotsUsed: () => {
    const state = get() as GameState;
    const activeJobIds = state.vitality.activeJobs || [];
    let usedSlots = 0;
    
    activeJobIds.forEach(id => {
      const job = jobsData.find((j): j is Job => j.id === id);
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
    const job = jobsData.find((j): j is Job => j.id === jobId);

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
    const playerClass = vitality.identity.currentClass;
    const playerWeight = jobRules.classWeights[playerClass as keyof typeof jobRules.classWeights] ?? 0;
    const jobWeight = jobRules.classWeights[job.requiredClass as keyof typeof jobRules.classWeights] ?? 99;
    
    if (playerWeight < jobWeight) {
      return { success: false, message: "你的阶级不够，HR直接把简历扔进了垃圾桶。" };
    }

    // 3.5 检查"职场黑名单"Buff（辞退后4回合内无法申请同阶级工作）
    const blacklistBuff = vitality.activeBuffs?.find((b: any) => 
      b.id.startsWith('buff_job_blacklist') && b.duration > 0
    );
    if (blacklistBuff && blacklistBuff.data?.originalClass === job.requiredClass) {
      return { 
        success: false, 
        message: `【职场黑名单】你被列入了${job.requiredClass}阶级的招聘黑名单，还剩${blacklistBuff.duration}回合才能申请。` 
      };
    }

    // 4. 检查房产 (必须有房且在该区域，流浪汉除外)
    if (job.requiresHousing) {
      if (!activeHousing || activeHousing.region !== job.region) {
        return { success: false, message: `这份工作需要你在${job.region}有固定住址。` };
      }
    }

    // 5. 检查道具 (如车、文凭) - 基于标签匹配
    const requiredItemsList = job.requiredItems || (job.requiredItem ? [job.requiredItem] : []);
    if (requiredItemsList.length > 0) {
      const gameData = (get() as StoreState).gameDataCache;
      const itemMap = gameData?.itemMap;
      
      for (const required of requiredItemsList) {
        const hasItem = inventory.some(itemId => {
          // 精确匹配道具ID（兼容性）
          if (itemId === required) return true;
          
          // 标签匹配：required 作为标签名，如 "VEHICLE"
          const item = itemMap?.get(itemId);
          return item?.tags?.includes(required);
        });
        
        if (!hasItem) {
          return { success: false, message: `缺少必要工具: ${required}` };
        }
      }
    }

    // 成功入职
    set((prev: GameState) => ({
      // 成功入职
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