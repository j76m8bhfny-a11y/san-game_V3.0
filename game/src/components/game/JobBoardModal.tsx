import React from 'react';
import { useJobBoard } from '@/hooks/useJobBoard';
import { useI18n } from '@/i18n';
import { JobPaper } from './Jobs/JobPaper';

interface JobBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobBoardModal: React.FC<JobBoardModalProps> = ({ isOpen, onClose }) => {
  const {
    jobs,
    currentInsight,
    theme,
    isSlums,
    isFactory,
    isSuburbs,
    isDowntown,
    checkRequirements,
    getReasonTranslation,
    handleApply,
    handleQuit,
    isJobActive,
  } = useJobBoard();

  if (!isOpen) return null;

  // 动态背景遮罩
  const overlayClass = isSlums 
    ? "bg-black/60 backdrop-blur-[2px]" 
    : isFactory
    ? "bg-black/80 backdrop-grayscale"
    : isSuburbs
    ? "bg-white/20 backdrop-blur-sm"
    : "bg-slate-900/60 backdrop-blur-sm";

  // 主容器样式
  const containerClass = `
    relative w-full max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden
    transition-all duration-300 bg-cover bg-center
    ${isSlums ? "bg-[url('/assets/job/slums/wood_bg.jpg')] p-4 rotate-1 rounded-sm shadow-[20px_20px_60px_rgba(0,0,0,0.8)] border-4 border-[#3e2723]" : ""}
    ${isFactory ? "bg-[url('/assets/job/rust/metal_bg.jpg')] p-6 border-t-8 border-yellow-700 rounded-none shadow-2xl ring-1 ring-white/10" : ""}
    ${isSuburbs ? "bg-[url('/assets/job/suburbs/glass_bg.jpg')] p-8 rounded-2xl shadow-2xl border border-white/30" : ""}
    ${isDowntown ? "bg-[url('/assets/job/downtown/leather_bg.jpg')] p-6 rounded-lg shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-amber-900/50" : ""}
  `;

  // Header 背景
  const headerClass = `
    flex justify-between items-start mb-6 sticky top-0 z-20 px-2 pt-2
    ${isSuburbs ? 'bg-white/80 backdrop-blur rounded-lg pb-4' : ''}
    ${isDowntown ? 'bg-black/30 backdrop-blur pb-4 border-b border-amber-600/30' : ''}
  `;

  // 工作列表容器样式
  const gridClass = `
    min-h-[400px] p-2
    ${isSlums ? "flex flex-wrap content-start gap-6" : ""}
    ${isFactory ? "grid grid-cols-1 gap-2 bg-black/50 border border-white/10 p-4" : ""}
    ${isSuburbs ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-white/10 rounded-xl" : ""}
    ${isDowntown ? "grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-lg border border-amber-900/20" : ""}
  `;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClass} animate-in fade-in duration-200`}>
      
      <div className={containerClass} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={headerClass}>
          <HeaderContent 
            isSlums={isSlums} 
            isFactory={isFactory} 
            isSuburbs={isSuburbs} 
            isDowntown={isDowntown} 
          />
          <CloseButton 
            isSlums={isSlums} 
            isFactory={isFactory} 
            isSuburbs={isSuburbs} 
            isDowntown={isDowntown}
            onClose={onClose}
          />
        </div>

        {/* 工作列表 */}
        <div className={gridClass}>
          {jobs.length === 0 ? (
            <EmptyState isSlums={isSlums} isFactory={isFactory} isSuburbs={isSuburbs} isDowntown={isDowntown} />
          ) : (
            jobs.map((job) => {
              const active = isJobActive(job.id);
              const result = checkRequirements(job);
              const reasonTranslation = result.reason ? getReasonTranslation(result.reason) : null;
              
              return (
                <JobPaper 
                  key={job.id} 
                  job={job} 
                  theme={theme}
                  isActive={active}
                  canApply={result.ok}
                  lockReasonKey={reasonTranslation?.key || ''}
                  lockReasonParams={(reasonTranslation as any)?.params}
                  onAction={() => active ? handleQuit(job.id) : handleApply(job)}
                  currentInsight={currentInsight}
                />
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <Footer isSlums={isSlums} isFactory={isFactory} isSuburbs={isSuburbs} isDowntown={isDowntown} />
      </div>
      
      {/* 点击背景关闭 */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

// 子组件：Header 内容
const HeaderContent: React.FC<{ isSlums: boolean; isFactory: boolean; isSuburbs: boolean; isDowntown: boolean }> = ({
  isSlums, isFactory, isSuburbs, isDowntown
}) => {
  const { t } = useI18n();
  
  return (
    <div className="flex-1">
      {isSlums && (
        <div className="relative">
          <h2 className="font-marker text-5xl text-yellow-100 -rotate-2 drop-shadow-[4px_4px_0_#000] z-10 relative">
            {t('job.board')}
          </h2>
          <span className="font-marker text-red-500 text-2xl block mt-1 rotate-1 ml-4 bg-black/40 px-3 py-1 w-max">
            {t('job.slums.tagline')}
          </span>
          <div className="absolute -top-6 -left-4 text-4xl drop-shadow-lg">📌</div>
        </div>
      )}
      
      {isFactory && (
        <div className="flex flex-col border-l-4 border-yellow-600 pl-4">
          <span className="text-yellow-600/70 font-mono text-xs tracking-[0.5em] mb-1">
            {t('job.factory.systemVersion')}
          </span>
          <h2 className="font-mono text-3xl text-stone-200 tracking-tighter uppercase font-bold">
            {t('job.board')}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-stone-400 font-mono text-xs">{t('job.systemOnline')}</span>
          </div>
        </div>
      )}
      
      {isSuburbs && (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
            💼
          </div>
          <div>
            <h2 className="font-pixel text-2xl font-bold text-slate-700 tracking-tight">
              {t('job.board')}
            </h2>
            <p className="text-slate-500 text-sm">{t('job.suburbs.tagline')}</p>
          </div>
        </div>
      )}
      
      {isDowntown && (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center text-white text-2xl shadow-lg border border-amber-500">
            ✦
          </div>
          <div>
            <h2 className="font-pixel text-3xl font-bold text-amber-100 tracking-wide">
              {t('job.downtown.title')}
            </h2>
            <p className="text-amber-400/70 text-sm font-pixel italic">{t('job.downtown.tagline')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// 子组件：关闭按钮
const CloseButton: React.FC<{ 
  isSlums: boolean; isFactory: boolean; isSuburbs: boolean; isDowntown: boolean;
  onClose: () => void;
}> = ({ isSlums, isFactory, isSuburbs, isDowntown, onClose }) => {
  const { t } = useI18n();
  
  const buttonClass = `
    transition-all duration-200 z-50
    ${isSlums ? "w-10 h-10 bg-red-700 text-white font-marker text-xl rounded-sm border-2 border-white/80 shadow-lg rotate-3 hover:rotate-12 hover:scale-110" : ""}
    ${isFactory ? "px-4 py-2 bg-red-900/40 text-red-400 font-mono border border-red-700 hover:bg-red-900 hover:text-white" : ""}
    ${isSuburbs ? "w-8 h-8 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 flex items-center justify-center shadow" : ""}
    ${isDowntown ? "w-10 h-10 rounded bg-black/50 text-amber-400 border border-amber-600/50 hover:bg-amber-900/30 hover:text-amber-200 font-pixel" : ""}
  `;
  
  const buttonText = isSlums ? "X" : isFactory ? t('common.close.bracket') : "✕";
  
  return (
    <button onClick={onClose} className={buttonClass}>
      {buttonText}
    </button>
  );
};

// 子组件：空状态
const EmptyState: React.FC<{ isSlums: boolean; isFactory: boolean; isSuburbs: boolean; isDowntown: boolean }> = ({
  isSlums, isFactory, isSuburbs, isDowntown
}) => {
  const { t } = useI18n();
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center py-20 opacity-50">
      {isSlums && <span className="font-marker text-4xl text-white/30 rotate-12">{t('hud.status.unemployed')}</span>}
      {isFactory && <span className="font-mono text-xl text-stone-500 animate-pulse">NO_TASKS_QUEUED</span>}
      {isSuburbs && <span className="font-pixel text-slate-500">{t('hud.status.unemployed')}</span>}
      {isDowntown && <span className="font-pixel text-amber-200/50 italic">{t('job.downtown.empty')}</span>}
    </div>
  );
};

// 子组件：Footer
const Footer: React.FC<{ isSlums: boolean; isFactory: boolean; isSuburbs: boolean; isDowntown: boolean }> = ({
  isSlums, isFactory, isSuburbs, isDowntown
}) => {
  const { t } = useI18n();
  
  if (isSlums) {
    return (
      <div className="mt-8 text-center font-marker text-white/30 text-sm rotate-1">
        {t('job.slums.footer')}
      </div>
    );
  }
  
  if (isFactory) {
    return (
      <div className="mt-4 text-center font-mono text-stone-600 text-xs">
        {t('job.factory.footer')}
      </div>
    );
  }
  
  if (isSuburbs) {
    return (
      <div className="mt-4 text-center font-pixel text-slate-400 text-xs">
        {t('job.suburbs.footer')}
      </div>
    );
  }
  
  if (isDowntown) {
    return (
      <div className="mt-4 text-center font-pixel text-amber-600/50 text-xs italic">
        {t('job.downtown.footer')}
      </div>
    );
  }
  
  return null;
};
