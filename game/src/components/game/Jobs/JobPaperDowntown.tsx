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

export const JobPaperDowntown: React.FC<Props> = ({
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
      flex flex-col p-6 rounded-lg border transition-all duration-300 bg-[url('/assets/job/downtown/stationery.png')] bg-cover
      ${isActive 
        ? 'border-amber-600 ring-2 ring-amber-600/30 shadow-xl' 
        : canApply 
          ? 'border-amber-800/30 hover:border-amber-600/50 hover:shadow-lg'
          : 'border-amber-900/20 opacity-70'}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className={`
          w-10 h-10 rounded flex items-center justify-center text-white font-pixel font-bold text-lg shadow-md border-2
          ${isActive ? 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-400' : 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600'}
        `}>
          {job.title?.[0] || '?'}
        </div>
        <span className={`px-2 py-1 text-[10px] font-pixel italic rounded border ${isActive ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
          {isActive ? 'Current Position' : 'Executive'}
        </span>
      </div>

      <h3 className="font-pixel font-bold text-slate-800 text-xl mb-1">{job.title}</h3>
      <p className="text-slate-600 text-sm mb-4 line-clamp-2 h-10 leading-5 italic">{job.description}</p>

      {!canApply && !isActive && (
        <div className="mb-2 px-3 py-1 bg-red-50/80 text-red-700 text-xs rounded border border-red-200 font-pixel">
          ✋ {t(lockReasonKey, lockReasonParams)}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-amber-900/10">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-pixel tracking-wider">Compensation</p>
          <p 
            className="font-pixel font-bold text-slate-800 text-lg cursor-help"
            title={`${efficiency.description} | ${t('job.expectedEarnings')}: $${Math.floor(job.baseSalary * efficiency.modifier)}/${t('common.week')}`}
          >
            ${job.baseSalary.toLocaleString()}
            {efficiency.modifier !== 1.0 && (
              <span className={`ml-1 text-xs ${efficiency.modifier > 1 ? 'text-green-600' : 'text-amber-600'}`}>
                ({Math.round(efficiency.modifier * 100)}%)
              </span>
            )}
          </p>
        </div>
        
        <button 
          onClick={onAction}
          disabled={!isActive && !canApply}
          className={`
            px-5 py-2 rounded text-xs font-bold transition-all font-pixel tracking-wide border
            ${isActive 
              ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100' 
              : canApply 
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 hover:shadow-lg hover:shadow-amber-900/20 hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'}
          `}
        >
          {isActive ? buttonLabels.active : canApply ? buttonLabels.canApply : buttonLabels.locked}
        </button>
      </div>
    </div>
  );
};
