import React from 'react';
import { useI18n } from '@/i18n';
import { Job } from '@/types/schema';
import { 
  JOB_BUTTON_LABELS, 
  PAY_CYCLE_LABELS, 
  getEfficiencyLevel,
  JobTheme 
} from '@/config/jobUIConfig';

interface JobPaperProps {
  job: Job;
  theme: JobTheme;
  isActive: boolean;
  canApply: boolean;
  lockReason?: string;
  onAction: () => void;
  currentInsight?: number; // 当前 Insight 值，用于显示效率
}

export const JobPaper: React.FC<JobPaperProps> = ({ 
  job, 
  theme, 
  isActive, 
  canApply, 
  lockReason, 
  onAction,
  currentInsight = 50, // 默认正常状态
}) => {
  const { t } = useI18n();
  
  // 获取当前主题的按钮文案
  const buttonLabels = JOB_BUTTON_LABELS[theme];
  
  // 获取当前效率等级
  const efficiency = getEfficiencyLevel(currentInsight);
  const expectedEarnings = Math.floor(job.baseSalary * efficiency.modifier);

  // --- 风格 1: 贫民窟 (电线杆上的小广告) ---
  if (theme === 'SLUMS') {
    return (
      <div className={`
        relative group w-full sm:w-64 p-4 transition-transform duration-300 hover:z-10
        ${isActive ? 'bg-green-50 rotate-1 scale-105' : 'bg-[#fdfbf7] -rotate-1 hover:scale-105 hover:rotate-1'}
        shadow-[3px_3px_5px_rgba(0,0,0,0.3)] select-none
      `}>
        {/* 顶部胶带效果 */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-red-600/80 rotate-2 opacity-90 shadow-sm clip-tape pointer-events-none"></div>

        <h3 className="font-marker text-2xl text-black leading-none mb-2 mt-2 break-words">
          {job.title}
        </h3>
        
        <div className="min-h-[60px]">
           <p className="font-handwriting text-gray-800 text-lg leading-5 line-clamp-3">
            {job.description}
          </p>
        </div>

        {/* 撕下来的条子区域 (Action Area) */}
        <div className="border-t-2 border-dashed border-gray-400 pt-2 flex justify-between items-end mt-2">
          <div className="flex flex-col">
            <span 
              className="font-marker text-xl text-green-800 cursor-help"
              title={`${t('job.expectedEarnings')}: $${expectedEarnings}/${t('common.week')} (${t('common.efficiency')}: ${Math.round(efficiency.modifier * 100)}%)`}
            >
              ${job.baseSalary}{PAY_CYCLE_LABELS[job.payCycle || 'WEEKLY']}
            </span>
            <span className="text-[10px] font-sans text-gray-500 transform -rotate-2">CASH ONLY</span>
          </div>
          
          <button 
            onClick={onAction}
            disabled={!isActive && !canApply}
            className={`
              px-2 py-1 font-marker text-lg border-2 transition-all
              ${isActive 
                ? 'border-red-600 text-red-600 rotate-2 hover:bg-red-50' 
                : canApply 
                  ? 'border-black text-black -rotate-2 hover:bg-black hover:text-white hover:scale-110'
                  : 'border-gray-300 text-gray-400 cursor-not-allowed'}
            `}
          >
            {isActive ? buttonLabels.active : canApply ? buttonLabels.canApply : buttonLabels.locked}
          </button>
        </div>

        {/* 锁定提示（手写红字） */}
        {!canApply && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-marker text-red-600/80 text-3xl border-4 border-red-600/80 px-2 py-1 -rotate-12 bg-white/50 backdrop-blur-[1px]">
              {lockReason || t('job.locked')}
            </span>
          </div>
        )}
      </div>
    );
  }

  // --- 风格 2: 工厂区 (生锈的打卡排班表) ---
  if (theme === 'RUST_BELT') {
    return (
      <div className={`
        relative flex items-center justify-between p-3 border-l-4 transition-all duration-200 group
        ${isActive 
          ? 'bg-[#2a2a2a] border-green-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]' 
          : 'bg-[#1a1a1a] border-stone-600 hover:bg-[#252525]'}
      `}>
        <div className="flex items-center gap-4 flex-1">
          {/* 打孔卡片图标 */}
          <div className={`
            w-12 h-16 rounded-sm flex flex-col items-center justify-center shadow-inner relative overflow-hidden shrink-0
            ${isActive ? 'bg-green-900/40 text-green-400' : 'bg-[#eaddcf] text-stone-800'}
          `}>
             <div className="w-3 h-3 bg-[#1a1a1a] rounded-full absolute -top-1.5"></div>
             <span className="font-mono font-bold text-2xl tracking-tighter">
                {job.title?.substring(0, 2).toUpperCase() || '??'}
             </span>
          </div>

          <div className="flex-1">
             <div className="flex items-center gap-2">
                <h3 className={`font-mono font-bold text-lg tracking-wide uppercase ${isActive ? 'text-green-400' : 'text-stone-300'}`}>
                  {job.title} 
                </h3>
                {/* 需求标签 */}
                {!canApply && !isActive && (
                   <span className="bg-red-900/50 text-red-400 text-[10px] px-1 py-0.5 border border-red-800 font-mono">
                     {t('job.requirement')}: {lockReason}
                   </span>
                )}
             </div>
             
             <div className="flex gap-4 text-xs font-mono text-stone-500 mt-1">
               <span className="flex items-center gap-1">{t('common.hp')}:<span className="text-red-400">-{job.hpCost}</span></span>
               <span 
                 className="flex items-center gap-1 cursor-help"
                 title={`${t('common.efficiency')}: ${efficiency.label} (${Math.round(efficiency.modifier * 100)}%) | ${t('job.expected')}: $${expectedEarnings}/${t('common.week')}`}
               >
                 {t('job.salary')}:<span className="text-yellow-600">${job.baseSalary}</span>
                 <span className="text-stone-600">{PAY_CYCLE_LABELS[job.payCycle || 'WEEKLY']}</span>
               </span>
               {job.requiresHousing && <span>🏠 {t('job.housingRequired')}</span>}
             </div>
          </div>
        </div>

        <button 
          onClick={onAction}
          disabled={!isActive && !canApply}
          className={`
            ml-4 h-10 px-4 font-mono text-sm tracking-wider border transition-colors shrink-0
            ${isActive 
              ? 'bg-transparent text-red-500 border-red-900 hover:bg-red-900/20' 
              : canApply 
                ? 'bg-stone-700 text-stone-300 border-stone-600 hover:bg-stone-600 hover:text-white hover:border-stone-400'
                : 'bg-transparent text-stone-700 border-stone-800 cursor-not-allowed'}
          `}
        >
          {isActive ? buttonLabels.active : canApply ? buttonLabels.canApply : buttonLabels.locked}
        </button>
      </div>
    );
  }

  // --- 风格 3: 中产/办公区 (现代招聘网站卡片) ---
  // Default to DOWNTOWN style
  return (
    <div className={`
      flex flex-col p-5 bg-white rounded-xl border transition-all duration-300
      ${isActive 
        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' 
        : canApply 
          ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          : 'border-slate-100 opacity-60 grayscale-[0.5]'}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className={`
          w-10 h-10 rounded flex items-center justify-center text-white font-bold text-lg shadow-sm
          ${isActive ? 'bg-blue-600' : 'bg-slate-700'}
        `}>
           {job.title?.[0] || '?'}
        </div>
        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
          {isActive ? t('job.current') : t('job.fullTime')}
        </span>
      </div>

      <h3 className="font-sans font-bold text-slate-800 text-lg mb-1">{job.title}</h3>
      <p className="text-slate-500 text-xs mb-4 line-clamp-2 h-8 leading-4">{job.description}</p>

      {/* 限制条件提示 */}
      {!canApply && !isActive && (
        <div className="mb-2 px-2 py-1 bg-red-50 text-red-600 text-[10px] rounded border border-red-100">
           ⚠️ {lockReason}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
         <div>
           <p className="text-[10px] text-slate-400 uppercase font-bold">{t('job.salary')}</p>
           <p 
             className="font-sans font-bold text-slate-900 cursor-help"
             title={`${efficiency.description} | ${t('job.expectedEarnings')}: $${expectedEarnings}/${t('common.week')}`}
           >
             ${job.baseSalary.toLocaleString()}
             {efficiency.modifier !== 1.0 && (
               <span className={`ml-1 text-xs ${efficiency.modifier > 1 ? 'text-green-500' : 'text-orange-500'}`}>
                 ({Math.round(efficiency.modifier * 100)}%)
               </span>
             )}
           </p>
         </div>
         
         <button 
           onClick={onAction}
           disabled={!isActive && !canApply}
           className={`
             px-4 py-2 rounded-lg text-xs font-bold transition-all
             ${isActive 
               ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-inner' 
               : canApply 
                 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-blue-200 hover:-translate-y-0.5'
                 : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
           `}
         >
           {isActive ? buttonLabels.active : canApply ? buttonLabels.canApply : buttonLabels.locked}
         </button>
      </div>
    </div>
  );
};
