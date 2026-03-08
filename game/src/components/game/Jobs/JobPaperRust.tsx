import React from 'react';
import { useI18n } from '@/i18n';
import { Job } from '@/types/schema';
import { JobButtonLabels, PAY_CYCLE_LABELS, getEfficiencyLevel } from '@/config/jobUIConfig';

interface Props {
  job: Job;
  isActive: boolean;
  canApply: boolean;
  lockReasonKey: string;
  lockReasonParams?: Record<string, string | number>;
  onAction: () => void;
  currentInsight: number;
  buttonLabels: JobButtonLabels;
}

export const JobPaperRust: React.FC<Props> = ({
  job,
  isActive,
  canApply,
  lockReasonKey,
  lockReasonParams,
  onAction,
  currentInsight,
  buttonLabels,
}) => {
  const { t } = useI18n();
  const efficiency = getEfficiencyLevel(currentInsight);

  return (
    <div className={`
      relative flex items-center justify-between p-3 border-l-4 transition-all duration-200 group
      bg-[url('/assets/job/rust/punch_card.png')] bg-cover bg-center
      ${isActive 
        ? 'border-green-600 shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]' 
        : 'border-stone-500 hover:brightness-110'}
    `}>
      <div className="flex items-center gap-4 flex-1">
        {/* 打孔卡片图标 */}
        <div className={`
          w-12 h-16 rounded-sm flex flex-col items-center justify-center shadow-inner relative overflow-hidden shrink-0
          ${isActive ? 'bg-green-900/60 text-green-400' : 'bg-[#d4c4b0] text-stone-800'}
        `}>
          <div className="w-3 h-3 bg-[#1a1a1a] rounded-sm absolute -top-1.5" />
          <span className="font-mono font-bold text-2xl tracking-tighter">
            {job.title?.substring(0, 2).toUpperCase() || '??'}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-mono font-bold text-lg tracking-wide uppercase ${isActive ? 'text-green-700' : 'text-stone-800'}`}>
              {job.title} 
            </h3>
            {!canApply && !isActive && (
              <span className="bg-red-800/70 text-red-200 text-[10px] px-1 py-0.5 border border-red-700 font-mono">
                {t(lockReasonKey, lockReasonParams)}
              </span>
            )}
          </div>
          
          <div className="flex gap-4 text-xs font-mono text-stone-700 mt-1">
            <span className="flex items-center gap-1">
              {t('common.hp')}:<span className="text-red-700 font-bold">-{job.hpCost}</span>
            </span>
            <span 
              className="flex items-center gap-1 cursor-help"
              title={`${t('common.efficiency')}: ${efficiency.label} | ${t('job.expected')}: $${Math.floor(job.baseSalary * efficiency.modifier)}/${t('common.week')}`}
            >
              {t('job.salary')}:<span className="text-amber-800 font-bold">${job.baseSalary}</span>
              <span className="text-stone-600">{PAY_CYCLE_LABELS[job.payCycle || 'WEEKLY']}</span>
            </span>
            {job.requiresHousing && <span className="text-stone-700">🏠 {t('job.housingRequired')}</span>}
          </div>
        </div>
      </div>

      <button 
        onClick={onAction}
        disabled={!isActive && !canApply}
        className={`
          ml-4 h-10 px-4 font-mono text-sm tracking-wider border-2 transition-all shrink-0
          ${isActive 
            ? 'bg-red-900/20 text-red-700 border-red-800 hover:bg-red-900/40' 
            : canApply 
              ? 'bg-stone-700 text-stone-200 border-stone-600 hover:bg-stone-600 hover:text-white shadow-md'
              : 'bg-stone-400/50 text-stone-600 border-stone-500 cursor-not-allowed'}
        `}
      >
        {isActive ? buttonLabels.active : canApply ? buttonLabels.canApply : buttonLabels.locked}
      </button>
    </div>
  );
};
