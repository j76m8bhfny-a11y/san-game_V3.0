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

export const JobPaperSlums: React.FC<Props> = ({
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
      relative group w-full sm:w-64 p-4 transition-transform duration-300 hover:z-10
      bg-[url('/assets/job/slums/paper.png')] bg-cover bg-center
      ${isActive ? 'rotate-1 scale-105' : '-rotate-1 hover:scale-105 hover:rotate-1'}
      shadow-[3px_3px_10px_rgba(0,0,0,0.5)] select-none
    `}>
      {/* 胶带效果 */}
      <div 
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 rotate-2 pointer-events-none"
        style={{ backgroundImage: "url('/assets/job/slums/tape.png')", backgroundSize: 'cover' }}
      />

      <h3 className="font-marker text-2xl text-black leading-none mb-2 mt-2 break-words drop-shadow-sm">
        {job.title}
      </h3>
      
      <div className="min-h-[60px]">
        <p className="font-handwriting text-gray-800 text-base leading-5 line-clamp-3">
          {job.description}
        </p>
      </div>

      {/* 底部区域 */}
      <div className="border-t-2 border-dashed border-gray-500 pt-2 flex justify-between items-end mt-2">
        <div className="flex flex-col">
          <span 
            className="font-marker text-xl text-green-900 cursor-help drop-shadow-sm"
            title={`${t('job.expectedEarnings')}: $${Math.floor(job.baseSalary * efficiency.modifier)}/${t('common.week')}`}
          >
            ${job.baseSalary}{PAY_CYCLE_LABELS[job.payCycle || 'WEEKLY']}
          </span>
          <span className="text-[10px] font-pixel text-gray-600 transform -rotate-2 font-bold">
            {t('job.slums.cashOnly')}
          </span>
        </div>
        
        <button 
          onClick={onAction}
          disabled={!isActive && !canApply}
          className={`
            px-2 py-1 font-marker text-lg border-2 transition-all bg-white/50
            ${isActive 
              ? 'border-red-700 text-red-700 rotate-2 hover:bg-red-100' 
              : canApply 
                ? 'border-black text-black -rotate-2 hover:bg-black hover:text-white hover:scale-110'
                : 'border-gray-400 text-gray-400 cursor-not-allowed'}
          `}
        >
          {isActive ? buttonLabels.active : canApply ? buttonLabels.canApply : buttonLabels.locked}
        </button>
      </div>

      {/* 锁定提示 */}
      {!canApply && !isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/30">
          <span className="font-marker text-red-700 text-2xl border-4 border-red-700 px-3 py-1 -rotate-12 bg-white/80">
            {t(lockReasonKey, lockReasonParams)}
          </span>
        </div>
      )}
    </div>
  );
};
