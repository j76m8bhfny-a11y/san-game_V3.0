import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Job, PlayerClass } from '@/types/schema';
// ✅ 引入新配置 (确保你已创建 src/assets/data/rules/jobRules.json)
import jobRules from '@/assets/data/rules/jobRules.json';

interface JobBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobBoardModal: React.FC<JobBoardModalProps> = ({ isOpen, onClose }) => {
  const { 
    gameDataCache, 
    currentRegion, 
    vitality, 
    activeHousing, 
    inventory, 
    acceptJob, 
    quitJob,   
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // ✅ [New] 动态计算当前已使用的精力槽位
  const currentUsedSlots = useMemo(() => {
    if (!gameDataCache?.events) return 0;
    return vitality.activeJobs.reduce((total, jobId) => {
      const job = gameDataCache.events.find((j: Job) => j.id === jobId);
      if (!job) return total;
      // 从配置读取消耗，默认为 1
      const cost = jobRules.settings.slotCosts[job.type as keyof typeof jobRules.settings.slotCosts] || 1; 
      return total + cost;
    }, 0);
  }, [vitality.activeJobs, gameDataCache]);

  if (!isOpen || !gameDataCache) return null;

  // 1. 筛选当前区域的工作
  const availableJobs = (gameDataCache.events || []).filter(
    (job: Job) => job.region === currentRegion
  );

  // 辅助: 检查申请条件
  const checkRequirements = (job: Job) => {
    // A. 检查房产 (原有逻辑)
    if (job.requiresHousing && !activeHousing) {
      return { ok: false, reason: "需要固定住所" };
    }
    
    // B. 检查载具/道具 (原有逻辑)
    if (job.requiredItem) {
      const hasItem = inventory.some(itemId => {
        const item = gameDataCache.itemMap?.get(itemId);
        return item?.tags.includes(job.requiredItem!);
      });
      if (!hasItem) {
        return { ok: false, reason: `需道具: ${job.requiredItem}` };
      }
    }

    // ✅ [New] C. 检查阶级兼容性 (Class Weights)
    const currentWeight = jobRules.classWeights[vitality.identity.currentClass as keyof typeof jobRules.classWeights] || 0;
    const requiredWeight = jobRules.classWeights[job.requiredClass as keyof typeof jobRules.classWeights] || 0;
    
    if (currentWeight < requiredWeight) {
      return { ok: false, reason: `阶级不足 (${job.requiredClass})` };
    }

    // ✅ [New] D. 检查精力槽位 (Slot Capacity)
    // 只有在"申请新工作"时检查，"已拥有"的工作在外部判断
    const isCurrent = vitality.activeJobs.includes(job.id);
    if (!isCurrent) {
        const jobCost = jobRules.settings.slotCosts[job.type as keyof typeof jobRules.settings.slotCosts] || 1;
        if (currentUsedSlots + jobCost > jobRules.settings.maxSlotCapacity) {
            return { ok: false, reason: `精力不足 (需 ${jobCost} 槽位)` };
        }
    }

    return { ok: true };
  };

  const handleApply = (job: Job) => {
    const check = checkRequirements(job);
    if (!check.ok) {
      playSfx('sfx_deny'); 
      addNotification(check.reason || "条件不满足", 'error');
      return;
    }

    const result = acceptJob(job.id);
    
    if (result.success) {
        playSfx('sfx_click');
        addNotification(result.message, 'success');
        onClose();
    } else {
        playSfx('sfx_deny');
        addNotification(result.message, 'error');
    }
  };

  const handleQuit = (jobId: string) => {
    playSfx('sfx_click');
    const result = quitJob(jobId);
    addNotification(result.message, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-full max-w-3xl bg-[#1a1a1a] border border-gray-700 shadow-2xl overflow-hidden flex flex-col font-mono text-white relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-[#111] flex justify-between items-center">
          <div>
            <div className="text-xs text-amber-500 font-bold tracking-widest mb-1">REGION: {currentRegion}</div>
            <h2 className="text-2xl font-black text-white">JOB OPPORTUNITIES</h2>
          </div>
          
          {/* ✅ [New] 显示精力槽位状态 */}
          <div className="text-right">
             <div className="text-[10px] text-gray-500 tracking-wider">ENERGY SLOTS</div>
             <div className={`text-xl font-bold ${currentUsedSlots >= jobRules.settings.maxSlotCapacity ? 'text-red-500' : 'text-green-400'}`}>
                {currentUsedSlots} <span className="text-gray-600 text-sm">/ {jobRules.settings.maxSlotCapacity}</span>
             </div>
          </div>

          <button onClick={onClose} className="text-gray-500 hover:text-white ml-4">[ ESC ]</button>
        </div>

        {/* List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {availableJobs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              本区域暂无招工信息。<br/>请尝试前往其他区域。
            </div>
          ) : (
            availableJobs.map((job: Job) => {
              const isCurrent = vitality.activeJobs.includes(job.id);
              const { ok, reason } = checkRequirements(job);
              
              // ✅ [New] 获取该工作消耗的槽位
              const slotCost = jobRules.settings.slotCosts[job.type as keyof typeof jobRules.settings.slotCosts] || 1;

              return (
                <div 
                  key={job.id} 
                  className={`
                    relative p-5 border-2 transition-all group
                    ${isCurrent ? 'border-green-500 bg-green-900/10' : 'border-gray-700 bg-[#222] hover:border-gray-500'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-xl font-bold ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                      {job.title}
                      {/* ✅ [New] 显示工作类型和槽位消耗 */}
                      <span className="ml-2 text-[10px] border border-gray-600 px-1.5 py-0.5 rounded text-gray-400 align-middle font-normal tracking-wide">
                        {job.type} • {slotCost}⚡
                      </span>
                    </h3>
                    <div className="text-right">
                       <div className="text-amber-400 font-bold text-lg">${job.baseSalary}<span className="text-xs text-gray-500">/Turn</span></div>
                       {job.sanCost > 0 && (
                         <div className="text-xs text-purple-400">SAN -{job.sanCost}</div>
                       )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4 border-l-2 border-gray-600 pl-3">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* ✅ [New] 阶级要求显示 (带颜色状态) */}
                    {job.requiredClass && (
                      <span className={`text-[10px] px-2 py-1 rounded border ${
                        (jobRules.classWeights[vitality.identity.currentClass as PlayerClass] || 0) < (jobRules.classWeights[job.requiredClass as PlayerClass] || 0)
                          ? 'border-red-800 text-red-500' 
                          : 'border-gray-600 text-gray-400'
                      }`}>
                        {job.requiredClass} LEVEL+
                      </span>
                    )}

                    {job.requiresHousing && (
                      <span className={`text-[10px] px-2 py-1 rounded border ${!activeHousing ? 'border-red-800 text-red-500' : 'border-gray-600 text-gray-400'}`}>
                        {activeHousing ? '✅ 有固定住所' : '❌ 需要固定住所'}
                      </span>
                    )}
                    {job.requiredItem && (
                      <span className="text-[10px] px-2 py-1 rounded border border-gray-600 text-gray-400">
                         需持有: {job.requiredItem}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end">
                    {isCurrent ? (
                      <button 
                        onClick={() => handleQuit(job.id)}
                        className="px-6 py-2 bg-red-900/20 text-red-500 border border-red-900 hover:bg-red-900/40 text-sm font-bold tracking-wider"
                      >
                        RESIGN (离职)
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApply(job)}
                        disabled={!ok}
                        className={`
                          px-8 py-2 text-sm font-bold tracking-wider transition-all
                          ${ok 
                            ? 'bg-amber-600 text-black hover:bg-amber-500' 
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}
                        `}
                      >
                        {ok ? 'APPLY NOW' : reason || 'LOCKED'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};