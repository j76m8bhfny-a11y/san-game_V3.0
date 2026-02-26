import React, { useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { Job, RegionID } from '@/types/schema';
import { JobPaper } from './Jobs/JobPaper';
import { JobTheme } from '@/config/jobUIConfig';
import jobRules from '@/assets/data/rules/job_rules.json';

// 映射 Region 到主题
const THEME_MAP: Record<RegionID, JobTheme> = {
  [RegionID.Slums]: 'SLUMS',
  [RegionID.RustBelt]: 'RUST_BELT',
  [RegionID.Downtown]: 'DOWNTOWN',
  [RegionID.Suburbs]: 'DOWNTOWN', // 郊区暂时使用中产风格
  // 如果有 RegionID.GlobalHQ，可以在这里添加映射
};

interface JobBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobBoardModal: React.FC<JobBoardModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
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

  // 1. 获取当前区域的所有工作
  const availableJobs = useMemo(() => {
    if (!gameDataCache?.jobs) return [];
    return gameDataCache.jobs.filter((job: Job) => job.region === currentRegion);
  }, [gameDataCache, currentRegion]);

  // 2. 检查工作申请资格（与 createJobSlice 保持逻辑一致）
  const checkRequirements = useCallback((job: Job) => {
    // 检查阶级（向下兼容：高阶级可以做低阶级工作）
    const playerClass = vitality.identity.currentClass;
    const playerWeight = jobRules.classWeights[playerClass as keyof typeof jobRules.classWeights] ?? 0;
    const jobWeight = jobRules.classWeights[job.requiredClass as keyof typeof jobRules.classWeights] ?? 99;
    
    if (playerWeight < jobWeight) {
      return { ok: false, reason: t('job.requirement') + `: ${job.requiredClass}` };
    }

    // 检查"职场黑名单"Buff（辞退后4回合内无法申请同阶级工作）
    const blacklistBuff = vitality.activeBuffs?.find((b: any) => 
      b.id.startsWith('buff_job_blacklist') && b.duration > 0
    );
    if (blacklistBuff && blacklistBuff.data?.originalClass === job.requiredClass) {
      return { 
        ok: false, 
        reason: `职场黑名单: ${blacklistBuff.duration}回合后解除` 
      };
    }

    // 检查房产
    if (job.requiresHousing) {
      if (!activeHousing || activeHousing.region !== job.region) {
        return { ok: false, reason: t('job.requirement') };
      }
    }

    // 检查道具（支持ID匹配和标签匹配，支持多个要求）
    const requiredItemsList = job.requiredItems || (job.requiredItem ? [job.requiredItem] : []);
    for (const required of requiredItemsList) {
      const itemMap = gameDataCache?.itemMap;
      const hasItem = inventory.some(itemId => {
        // 精确匹配道具ID
        if (itemId === required) return true;
        // 标签匹配：如 VEHICLE
        const item = itemMap?.get(itemId);
        return item?.tags?.includes(required);
      });
      
      if (!hasItem) {
        return { ok: false, reason: `${t('job.requirement')}: ${required}` };
      }
    }

    return { ok: true, reason: '' };
  }, [vitality.identity.currentClass, activeHousing, inventory, gameDataCache, t]);

  // 3. 处理交互
  const handleApply = (job: Job) => {
    playSfx('sfx_paper'); // 播放音效
    const result = acceptJob(job.id);
    if (result.success) {
      addNotification(`${t('job.apply')}: ${job.title}`, 'success');
    } else {
      addNotification(result.message, 'error');
    }
  };

  const handleQuit = (jobId: string) => {
    playSfx('sfx_click');
    const result = quitJob(jobId);
    if (result.success) {
      addNotification(t('job.quit'), 'info');
    }
  };

  if (!isOpen) return null;

  // 4. 确定当前视觉主题
  const themeKey = THEME_MAP[currentRegion] || 'SLUMS';
  const isSlums = themeKey === 'SLUMS';
  const isFactory = themeKey === 'RUST_BELT';
  const isOffice = themeKey === 'DOWNTOWN';

  // 5. 动态背景遮罩
  const overlayClass = isSlums 
    ? "bg-black/60 backdrop-blur-[2px]" 
    : isFactory
    ? "bg-black/80 backdrop-grayscale"
    : "bg-slate-900/40 backdrop-blur-sm";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClass} animate-in fade-in duration-200`}>
      
      {/* --- 主容器 --- */}
      <div 
        className={`
          relative w-full max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden
          transition-all duration-300
          ${isSlums ? "bg-[#3e2723] p-2 rotate-1 rounded-sm shadow-[20px_20px_60px_rgba(0,0,0,0.8)] border-4 border-[#2d1b18]" : ""}
          ${isFactory ? "bg-[#121212] p-6 border-t-8 border-yellow-700 rounded-none shadow-2xl ring-1 ring-white/10" : ""}
          ${isOffice ? "bg-slate-50 rounded-2xl shadow-2xl border border-white/50" : ""}
        `}
        // 阻止点击冒泡，防止点击模态框内容时关闭
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* --- 装饰性头部 Header --- */}
        <div className={`flex justify-between items-start mb-6 sticky top-0 z-20 px-2 pt-2 ${isOffice ? 'bg-slate-50/90 backdrop-blur pb-4 border-b border-slate-200' : ''}`}>
          
          {/* Title Area */}
          <div className="flex-1">
            {isSlums && (
              <div className="relative">
                <h2 className="font-marker text-5xl text-yellow-100 -rotate-2 drop-shadow-[4px_4px_0_#000] z-10 relative">
                  {t('job.board')}
                </h2>
                <span className="font-marker text-red-500 text-2xl block mt-1 rotate-1 ml-4 bg-white/10 px-2 w-max">
                  CASH DAILY. NO Q's.
                </span>
                {/* 装饰图钉 */}
                <div className="absolute -top-6 -left-4 text-4xl drop-shadow-lg">📌</div>
              </div>
            )}
            {isFactory && (
              <div className="flex flex-col border-l-4 border-yellow-600 pl-4">
                <span className="text-yellow-600/50 font-mono text-xs tracking-[0.5em] mb-1">FACTORY_OS v9.2</span>
                <h2 className="font-mono text-3xl text-stone-200 tracking-tighter uppercase font-bold">
                  {t('job.board')}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-stone-500 font-mono text-xs">{t('job.systemOnline')}</span>
                </div>
              </div>
            )}
            {isOffice && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
                  💼
                </div>
                <div>
                  <h2 className="font-sans text-2xl font-bold text-slate-800 tracking-tight">
                    {t('job.board')}
                  </h2>
                  <p className="text-slate-400 text-sm">Find your purpose in the corporate machine.</p>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className={`
              transition-all duration-200 z-50
              ${isSlums ? "w-10 h-10 bg-red-600 text-white font-marker text-xl rounded-sm border-2 border-white shadow-lg rotate-3 hover:rotate-12 hover:scale-110" : ""}
              ${isFactory ? "px-4 py-2 bg-red-900/20 text-red-500 font-mono border border-red-800 hover:bg-red-900 hover:text-white" : ""}
              ${isOffice ? "w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center" : ""}
            `}
          >
            {isSlums ? "X" : isFactory ? "[ ESC ]" : "✕"}
          </button>
        </div>

        {/* --- 工作列表容器 Grid --- */}
        <div className={`
          min-h-[400px] p-2
          ${isSlums ? "flex flex-wrap content-start gap-6 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-blend-multiply rounded-sm" : ""}
          ${isFactory ? "grid grid-cols-1 gap-2 bg-black/40 border border-white/5 p-4" : ""}
          ${isOffice ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4" : ""}
        `}>
          
          {availableJobs.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center py-20 opacity-50">
              {isSlums && <span className="font-marker text-4xl text-white/30 rotate-12">{t('hud.status.unemployed')}</span>}
              {isFactory && <span className="font-mono text-xl text-stone-600 animate-pulse">NO_TASKS_QUEUED</span>}
              {isOffice && <span className="font-sans text-slate-400">{t('hud.status.unemployed')}</span>}
            </div>
          ) : (
            availableJobs.map((job) => {
              const isActive = vitality.activeJobs.includes(job.id);
              const { ok, reason } = checkRequirements(job);
              
              return (
                <JobPaper 
                  key={job.id} 
                  job={job} 
                  theme={themeKey}
                  isActive={isActive}
                  canApply={ok}
                  lockReason={reason}
                  onAction={() => isActive ? handleQuit(job.id) : handleApply(job)}
                  currentInsight={vitality.metrics.insight}
                />
              );
            })
          )}
        </div>
        
        {/* Footer / Decorative elements */}
        {isSlums && (
           <div className="mt-8 text-center font-marker text-white/20 text-sm rotate-1">
             Do not tear off if not interested.
           </div>
        )}
      </div>
      
      {/* 点击背景关闭 */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};
