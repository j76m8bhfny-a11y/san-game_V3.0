import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';
import { ChevronLeft, Heart, Car } from 'lucide-react';
import { useI18n } from '@/i18n';

export const DowntownInsuranceApp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const { signInsurance, cancelInsurance, vitality } = useGameStore();
  const { playSfx } = useAudioStore();

  const { inventory } = useGameStore();
  const allPlans = (insuranceData as any[]).filter(i => 
    i.allowedClasses.includes('MIDDLE') || i.allowedClasses.includes('CAPITALIST')
  );
  const medicalPlans = allPlans.filter(p => p.type === 'MEDICAL');
  const autoPlans = allPlans.filter(p => p.type === 'AUTO');
  
  const activeInsurances = vitality.activeInsurances || [];
  const getIsActive = (planId: string) => activeInsurances.some((ins: any) => ins.id === planId);
  const hasVehicle = inventory.some((id: string) => id.startsWith('CAR_') || id === 'KEY_CAR');

  const handleToggle = (planId: string) => {
    playSfx('sfx_click');
    const isActive = getIsActive(planId);
    if (isActive) {
      cancelInsurance(planId);
    } else {
      signInsurance(planId);
    }
  };

  const renderPlanCard = (plan: any) => {
    const isActive = getIsActive(plan.id);
    const isAuto = plan.type === 'AUTO';
    
    return (
      <div 
        key={plan.id}
        className={`p-4 rounded-sm transition-all duration-300 border ${isActive ? 'bg-white border-blue-200 shadow-pixel-sm shadow-blue-100' : 'bg-white border-slate-100 shadow-sm'}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${isAuto ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            {isAuto ? <Car size={20} /> : <Heart size={20} />}
          </div>
          <div className={`text-sm font-bold px-3 py-1 rounded-sm ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {isActive ? t('insurance.enroll') : t('insurance.cancel')}
          </div>
        </div>

        <h3 className="font-bold text-lg text-slate-800">{plan.name}</h3>
        <span className="text-xs text-gray-400">{isAuto ? t('insurance.type.auto') : t('insurance.type.medical')}</span>
        <div className="text-slate-500 text-xs mb-4 mt-1">{plan.flavorText}</div>

        {/* Benefits Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {plan.coverage.mentalCovered && <span className="text-[10px] px-2 py-1 bg-purple-50 text-purple-600 rounded-md font-bold">{t('insurance.coverage.mental')}</span>}
          {plan.coverage.emergencyCovered && <span className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded-md font-bold">{t('insurance.coverage.emergency')}</span>}
          {isAuto && plan.coverage.autoCovered && <span className="text-[10px] px-2 py-1 bg-orange-50 text-orange-600 rounded-md font-bold">{t('insurance.coverage.auto')}</span>}
          <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-bold">{t('insurance.coverage.copay')} {(plan.coverage.copayModifier * 100).toFixed(0)}%</span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="text-lg font-bold text-slate-900">${plan.weeklyCost}</span>
            <span className="text-slate-400 text-xs">/{t('insurance.weekly')}</span>
          </div>
          
          {/* iOS Style Toggle Switch */}
          <button 
            onClick={() => handleToggle(plan.id)}
            className={`w-12 h-7 rounded-sm transition-colors relative ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-sm shadow-sm transition-transform duration-300 ${isActive ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[375px] h-[667px] bg-white rounded-[3rem] border-8 border-gray-900 shadow-pixel-sm overflow-hidden flex flex-col relative">
      {/* 状态栏模拟 */}
      <div className="h-6 bg-white flex justify-between px-6 items-center text-[10px] font-pixel font-bold text-gray-800 pt-2">
        <span>9:41</span>
        <div className="flex gap-1">
          <span>5G</span>
          <div className="w-4 h-2 bg-gray-800 rounded-[1px]"></div>
        </div>
      </div>

      {/* App Header */}
      <div className="px-6 pt-4 pb-2">
        <button onClick={onClose} className="text-blue-500 flex items-center gap-1 text-sm mb-4">
          <ChevronLeft size={16} /> {t('common.close')}
        </button>
        <h1 className="text-3xl font-bold text-slate-900">{t('insurance.title')}</h1>
        <p className="text-slate-500 text-sm">{t('insurance.coverage.title')}</p>
      </div>

      {/* Plans List */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-6 bg-slate-50 pt-4">
        {/* 医疗保险 */}
        <div>
          <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
            <Heart size={16} />
            {t('insurance.medical.title')}
          </h3>
          <div className="space-y-3">
            {medicalPlans.map(renderPlanCard)}
          </div>
        </div>

        {/* 车险 */}
        <div>
          <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Car size={16} />
            {t('insurance.auto.title')}
          </h3>
          {hasVehicle ? (
            <div className="space-y-3">
              {autoPlans.map(renderPlanCard)}
            </div>
          ) : (
            <div className="bg-slate-100 rounded-sm p-4 text-center">
              <p className="text-sm text-slate-400">{t('insurance.auto.needVehicle')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-1 bg-black w-1/3 mx-auto mb-2 rounded-sm opacity-20"></div>
    </div>
  );
};
