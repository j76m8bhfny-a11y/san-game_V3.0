import React from 'react';
import { useI18n } from '@/i18n';
import { Job } from '@/types/schema';
import { JobButtonLabels, getEfficiencyLevel } from '@/config/jobUIConfig';

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

export const JobPaperSuburbs: React.FC<Props> = ({
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
      flex flex-col p-5 rounded-xl border transition-all duration-300 bg-[url('/assets/job/suburbs/card_clean.png')] bg-cover
      ${isActive 
        ? 'border-blue-400 ring-2 ring-blue-400/30 shadow-lg' 
        : canApply 
          ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          : 'border-slate-200 opacity-60 grayscale-[0.5]'}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm
          ${isActive ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-slate-600 to-slate-800'}
        `}>
          {job.title?.[0] || '?'}
        </div>
        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
          {isActive ? t('job.current') : t('job.fullTime')}
        </span>
      </div>

      <h3 className="font-pixel font-bold text-slate-700 text-lg mb-1">{job.title}</h3>
      <p className="text-slate-500 text-xs mb-4 line-clamp-2 h-8 leading-4">{job.description}</p>

      {!canApply && !isActive && (
        <div className="mb-2 px-2 py-1 bg-red-50 text-red-500 text-[10px] rounded border border-red-100">
          ⚠️ {t(lockReasonKey, lockReasonParams)}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold">{t('job.salary')}</p>
          <p 
            className="font-pixel font-bold text-slate-700 cursor-help"
            title={`${efficiency.description} | ${t('job.expectedEarnings')}: $${Math.floor(job.baseSalary * efficiency.modifier)}/${t('common.week')}`}
          >
            ${job.baseSalary.toLocaleString()}
            {efficiency.modifier !== 1.0 && (
              <span className={`ml-1 text-xs ${efficiency.modifier > 1 ? 'text-green-500' : 'text-orange-400'}`}>
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
              ? 'bg-red-50 text-red-500 hover:bg-red-100' 
              : canApply 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
          `}
        >
          {isActive ? buttonLabels.active : canApply ? buttonLabels.canApply : buttonLabels.locked}
        </button>
      </div>
    </div>
  );
};
