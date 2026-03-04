import { StateCreator } from 'zustand';
import { GameState, Job } from '@/types/schema';
import { StoreState } from '@/types/store';
import jobsData from '@/assets/data/jobs.json';
import jobRules from '@/assets/data/rules/job_rules.json';

// 错误类型枚举
export type JobRejectReason = 
  | { type: 'JOB_NOT_FOUND' }
  | { type: 'ALREADY_EMPLOYED' }
  | { type: 'SLOT_FULL'; current: number; max: number }
  | { type: 'CLASS_MISMATCH'; required: string; current: string }
  | { type: 'FELONY_RECORD' }
  | { type: 'BLACKLISTED'; remainingTurns: number }
  | { type: 'HOUSING_REQUIRED'; region: string }
  | { type: 'ITEM_REQUIRED'; item: string }
  | { type: 'UNKNOWN' };

export interface JobCheckResult {
  ok: boolean;
  reason?: JobRejectReason;
}

export interface JobSlice {
  // Actions
  acceptJob: (jobId: string) => { success: boolean; message: string };
  quitJob: (jobId: string) => { success: boolean; message: string };
  
  // 预检查接口（返回结构化错误）
  canAcceptJob: (jobId: string) => JobCheckResult;
  
  // Helpers
  getJobSlotsUsed: () => number;
}



export const createJobSlice: StateCreator<StoreState, [], [], JobSlice> = (set, get) => ({

  getJobSlotsUsed: () => {
    const state = get() as GameState;
    const activeJobIds = state.vitality.activeJobs || [];
    let usedSlots = 0;
    
    activeJobIds.forEach(id => {
      const job = jobsData.find((j: any) => j.id === id) as Job | undefined;
      if (job) {
        const cost = (jobRules.settings.slotCosts as Record<string, number>)[job.type] || 1; 
        usedSlots += cost;
      }
    });
    return usedSlots;
  },

  // 统一的资格检查逻辑（UI预检 & 实际申请共用）
  canAcceptJob: (jobId) => {
    const state = get() as GameState;
    const { vitality, activeHousing, inventory } = state;
    const job = jobsData.find((j: any) => j.id === jobId) as Job | undefined;

    if (!job) return { ok: false, reason: { type: 'JOB_NOT_FOUND' } };
    if (vitality.activeJobs.includes(jobId)) return { ok: false, reason: { type: 'ALREADY_EMPLOYED' } };

    // 1. 检查槽位限制
    const currentSlots = get().getJobSlotsUsed();
    const requiredSlots = (jobRules.settings.slotCosts as Record<string, number>)[job.type] || 1;
    const maxSlots = jobRules.settings.maxSlotCapacity;
    if (currentSlots + requiredSlots > maxSlots) {
      return { ok: false, reason: { type: 'SLOT_FULL', current: currentSlots, max: maxSlots } };
    }

    // 2. 检查阶级
    const playerClass = vitality.identity.currentClass;
    const playerWeight = jobRules.classWeights[playerClass as keyof typeof jobRules.classWeights] ?? 0;
    const jobWeight = jobRules.classWeights[job.requiredClass as keyof typeof jobRules.classWeights] ?? 99;
    if (playerWeight < jobWeight) {
      return { ok: false, reason: { type: 'CLASS_MISMATCH', required: job.requiredClass, current: playerClass } };
    }

    // 3. 重罪记录检查
    const hasFelonyRecord = vitality.flags?.hasFelonyRecord;
    if (hasFelonyRecord && (job.requiredClass === 'MIDDLE' || job.requiredClass === 'CAPITALIST')) {
      return { ok: false, reason: { type: 'FELONY_RECORD' } };
    }

    // 4. 职场黑名单
    const blacklistBuff = vitality.activeBuffs?.find((b: any) => 
      b.id.startsWith('buff_job_blacklist') && b.duration > 0
    );
    if (blacklistBuff && blacklistBuff.data?.originalClass === job.requiredClass) {
      return { ok: false, reason: { type: 'BLACKLISTED', remainingTurns: blacklistBuff.duration } };
    }

    // 5. 检查房产
    if (job.requiresHousing) {
      if (!activeHousing || activeHousing.region !== job.region) {
        return { ok: false, reason: { type: 'HOUSING_REQUIRED', region: job.region } };
      }
    }

    // 6. 检查道具
    const requiredItemsList = job.requiredItems || (job.requiredItem ? [job.requiredItem] : []);
    if (requiredItemsList.length > 0) {
      const gameData = (get() as StoreState).gameDataCache;
      const itemMap = gameData?.itemMap;
      for (const required of requiredItemsList) {
        const hasItem = inventory.some(itemId => {
          if (itemId === required) return true;
          const item = itemMap?.get(itemId);
          return item?.tags?.includes(required);
        });
        if (!hasItem) return { ok: false, reason: { type: 'ITEM_REQUIRED', item: required } };
      }
    }

    return { ok: true };
  },

  acceptJob: (jobId) => {
    const job = jobsData.find((j: any) => j.id === jobId) as Job | undefined;
    
    if (!job) return { success: false, message: "工作不存在" };
    
    // 复用 canAcceptJob 进行最终校验
    const check = get().canAcceptJob(jobId);
    if (!check.ok) {
      // 将结构化错误转换为可读消息（兼容现有接口）
      const message = formatRejectReason(check.reason!);
      return { success: false, message };
    }

    // 成功入职
    set((prev: GameState) => ({
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

// 辅助函数：将结构化错误转换为可读消息
function formatRejectReason(reason: JobRejectReason): string {
  switch (reason.type) {
    case 'JOB_NOT_FOUND':
      return "工作不存在";
    case 'ALREADY_EMPLOYED':
      return "你已经在这份工作中了";
    case 'SLOT_FULL':
      return `精力不足！当前占用 ${reason.current}/${reason.max}`;
    case 'CLASS_MISMATCH':
      return `需要阶级: ${reason.required}`;
    case 'FELONY_RECORD':
      return "背景调查未通过";
    case 'BLACKLISTED':
      return `职场黑名单: ${reason.remainingTurns}回合后解除`;
    case 'HOUSING_REQUIRED':
      return `需要在${reason.region}有固定住址`;
    case 'ITEM_REQUIRED':
      return `需要: ${reason.item}`;
    default:
      return "不符合要求";
  }
}