import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Job } from '@/types/schema';

interface JobBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobBoardModal: React.FC<JobBoardModalProps> = ({ isOpen, onClose }) => {
  const { 
    gameDataCache, 
    currentRegion, 
    activeJob, 
    activeHousing, 
    inventory, 
    setJob,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  if (!isOpen || !gameDataCache) return null;

  // 1. 筛选当前区域的工作
  const availableJobs = (gameDataCache.jobs || []).filter(
    (job: Job) => job.region === currentRegion
  );

  // 辅助: 检查申请条件
  const checkRequirements = (job: Job) => {
    // A. 检查房产
    if (job.requiresAddress && !activeHousing) {
      return { ok: false, reason: "需要固定住所 (Housing)" };
    }
    
    // B. 检查载具
    if (job.requiredVehicle) {
      // 遍历背包，看是否有物品包含所需的载具Tag
      const hasVehicle = inventory.some(itemId => {
        const item = gameDataCache.itemMap.get(itemId);
        return item?.tags.includes(job.requiredVehicle!);
      });
      if (!hasVehicle) {
        return { ok: false, reason: `需要特定载具 (${job.requiredVehicle})` };
      }
    }

    // C. 检查阶级 (可选，如果JSON里配了的话)
    // if (job.requiredClass && currentClass !== job.requiredClass) ...

    return { ok: true };
  };

  const handleApply = (job: Job) => {
    const check = checkRequirements(job);
    if (!check.ok) {
      playSfx('sfx_deny'); // 假设有拒绝音效
      addNotification(check.reason || "条件不满足", 'error');
      return;
    }

    playSfx('sfx_click');
    setJob(job);
    addNotification(`入职成功: ${job.title}`, 'success');
    onClose();
  };

  const handleQuit = () => {
    playSfx('sfx_click');
    setJob(null);
    addNotification("已离职", 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-3xl bg-[#1a1a1a] border border-gray-700 shadow-2xl overflow-hidden flex flex-col font-mono text-white relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-[#111] flex justify-between items-center">
          <div>
            <div className="text-xs text-amber-500 font-bold tracking-widest mb-1">REGION: {currentRegion}</div>
            <h2 className="text-2xl font-black font-pixel text-white">JOB OPPORTUNITIES</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">[ ESC ]</button>
        </div>

        {/* List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {availableJobs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              本区域暂无招工信息。<br/>请尝试前往其他区域。
            </div>
          ) : (
            availableJobs.map((job: Job) => {
              const isCurrent = activeJob?.id === job.id;
              const { ok, reason } = checkRequirements(job);

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
                    </h3>
                    <div className="text-right">
                       <div className="text-amber-400 font-bold text-lg">${job.salary}<span className="text-xs text-gray-500">/Day</span></div>
                       {job.sanCost > 0 && (
                         <div className="text-xs text-purple-400">SAN -{job.sanCost}/Day</div>
                       )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4 border-l-2 border-gray-600 pl-3">
                    {job.description}
                  </p>

                  {/* Requirements Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiresAddress && (
                      <span className={`text-[10px] px-2 py-1 rounded border ${!activeHousing ? 'border-red-800 text-red-500' : 'border-gray-600 text-gray-400'}`}>
                        {activeHousing ? '✅ 有固定住所' : '❌ 需要固定住所'}
                      </span>
                    )}
                    {job.requiredVehicle && (
                      <span className="text-[10px] px-2 py-1 rounded border border-gray-600 text-gray-400">
                         需载具: {job.requiredVehicle}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end">
                    {isCurrent ? (
                      <button 
                        onClick={handleQuit}
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
                            ? 'bg-amber-600 text-black hover:bg-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
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