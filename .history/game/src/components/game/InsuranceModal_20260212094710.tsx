import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Insurance, RegionID } from '@/types/schema';
import { INSURANCE_THEMES, InsuranceTheme } from '@/config/insuranceUIConfig';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InsuranceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { 
    getAvailableInsurance, 
    signInsurance, 
    cancelInsurance, 
    vitality, 
    currentRegion 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const availablePlans = useMemo(() => getAvailableInsurance(), [getAvailableInsurance]);
  const activePlan = vitality.activeInsurance;

  if (!isOpen) return null;

  // 1. 确定当前主题
  const themeMap: Record<RegionID, InsuranceTheme> = {
    [RegionID.Slums]: 'SLUMS',
    [RegionID.RustBelt]: 'RUST_BELT',
    [RegionID.Downtown]: 'DOWNTOWN',
    [RegionID.Suburbs]: 'DOWNTOWN', // 郊区暂时共用中产
    // [RegionID.GlobalHQ]: 'GLOBAL',
  };
  
  const currentThemeKey = themeMap[currentRegion] || 'SLUMS';
  const theme = INSURANCE_THEMES[currentThemeKey];

  // 2. 处理点击
  const handleAction = (planId: string) => {
    if (activePlan?.id === planId) {
      playSfx('sfx_paper_tear'); // 不同的音效
      cancelInsurance();
    } else {
      playSfx('sfx_stamp'); // 不同的音效
      signInsurance(planId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      
      {/* 动态容器 */}
      <div className={`relative w-full max-w-2xl overflow-hidden transition-all ${theme.containerClass}`}>
        
        {/* 头部 */}
        <div className="p-6 pb-2 flex justify-between items-start">
          <h2 className={theme.titleClass}>
            {currentThemeKey === 'SLUMS' ? 'INSURANCE??' : 
             currentThemeKey === 'RUST_BELT' ? 'UNION BENEFITS' : 
             'Health Coverage'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* 列表区域 */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {availablePlans.length === 0 ? (
            <div className="text-center opacity-50 py-10">No plans available for your class.</div>
          ) : (
            availablePlans.map((plan: any) => { // plan 类型实际是 Insurance & JSON扩展字段
              const isActive = activePlan?.id === plan.id;
              
              return (
                <div 
                  key={plan.id}
                  className={`
                    relative p-4 transition-all
                    ${currentThemeKey === 'SLUMS' ? 'bg-[#fdfbf7] -rotate-1 shadow-md border-dashed border-2 border-gray-400' : ''}
                    ${currentThemeKey === 'RUST_BELT' ? 'bg-[#333] border border-stone-600' : ''}
                    ${currentThemeKey === 'DOWNTOWN' ? 'bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md' : ''}
                  `}
                >
                  {/* 已激活标记 (印章) */}
                  {isActive && (
                    <div className="absolute top-2 right-2 opacity-80 pointer-events-none transform rotate-12 border-4 border-green-600 text-green-600 font-black text-xs px-2 py-1 z-10">
                      ACTIVE
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`font-bold ${currentThemeKey === 'SLUMS' ? 'font-marker text-xl' : 'text-lg'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-xs mt-1 ${currentThemeKey === 'SLUMS' ? 'font-handwriting text-gray-600' : 'text-gray-400'}`}>
                        {plan.flavorText}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${currentThemeKey === 'SLUMS' ? 'text-red-600 font-marker text-xl' : 'text-emerald-500'}`}>
                        ${plan.weeklyCost}
                      </div>
                      <div className="text-[10px] opacity-50 uppercase">{theme.labels.weekly}</div>
                    </div>
                  </div>

                  {/* 详细条款 */}
                  <div className={`mt-3 pt-3 border-t ${currentThemeKey === 'SLUMS' ? 'border-dashed border-gray-300' : 'border-gray-700/20'}`}>
                    <div className="flex gap-4 text-xs opacity-80">
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={12} />
                        Copay: {(plan.coverage.copayModifier * 100).toFixed(0)}%
                      </div>
                      {plan.coverage.mentalCovered && (
                        <div className="flex items-center gap-1 text-purple-500">
                          <span>🧠</span> Mental
                        </div>
                      )}
                      {plan.coverage.emergencyCovered && (
                        <div className="flex items-center gap-1 text-red-500">
                          <span>🚑</span> ER
                        </div>
                      )}
                    </div>
                    
                    {/* 贫民窟风险提示 */}
                    {plan.riskDescription && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-red-500/80 font-mono">
                         <AlertCircle size={10} /> {plan.riskDescription}
                      </div>
                    )}
                  </div>

                  {/* 按钮 */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleAction(plan.id)}
                      className={`
                        px-6 py-2 transition-all
                        ${theme.buttonClass}
                        ${isActive ? 'opacity-70 hover:opacity-100 hover:line-through' : ''}
                      `}
                    >
                      {isActive ? theme.labels.cancel : theme.labels.sign}
                    </button>
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