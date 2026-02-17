import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';
import { Shield, Check, Info, Heart, Car } from 'lucide-react';
import { useI18n } from '@/i18n';

export const SuburbsInsuranceEnroll: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const { signInsurance, cancelInsurance, vitality, hasInsurance } = useGameStore();
  const { playSfx } = useAudioStore();

  const { inventory } = useGameStore();
  const allPlans = (insuranceData as any[]).filter(i => 
    i.allowedClasses.includes('MIDDLE') || i.allowedClasses.includes('CAPITALIST')
  );
  const medicalPlans = allPlans.filter(p => p.type === 'MEDICAL');
  const autoPlans = allPlans.filter(p => p.type === 'AUTO');
  
  const activeInsurances = vitality.activeInsurances || [];
  const getIsActive = (planId: string) => activeInsurances.some((ins: any) => ins.id === planId);
  const hasVehicle = inventory.some((id: string) => id.startsWith('VEH_'));

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
        className={`border-2 rounded-lg p-4 transition-all ${
          isActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-300 bg-white'
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {isAuto ? <Car size={18} className="text-blue-600" /> : <Heart size={18} className="text-red-600" />}
            <div>
              <h3 className="font-bold text-blue-900">{plan.name}</h3>
              <span className="text-xs text-gray-400">{isAuto ? t('insurance.type.auto') : t('insurance.type.medical')}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-blue-900">${plan.weeklyCost}</span>
            <span className="text-gray-400 text-xs">/{t('insurance.weekly')}</span>
          </div>
        </div>

        <p className="text-gray-500 text-xs mb-3">{plan.flavorText}</p>

        {/* 保障范围 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {plan.coverage.emergencyCovered && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-full">
              <Check size={10} /> {t('insurance.coverage.emergency')}
            </span>
          )}
          {plan.coverage.mentalCovered && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              <Check size={10} /> {t('insurance.coverage.mental')}
            </span>
          )}
          {plan.coverage.addictionCovered && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              <Check size={10} /> {t('insurance.coverage.addiction')}
            </span>
          )}
          {isAuto && plan.coverage.autoCovered && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
              <Check size={10} /> {t('insurance.coverage.auto')}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            <Info size={10} /> {t('insurance.coverage.copay')} {(plan.coverage.copayModifier * 100).toFixed(0)}%
          </span>
        </div>

        {/* 操作按钮 */}
        <button
          onClick={() => handleToggle(plan.id)}
          className={`w-full py-2 rounded-md font-bold text-sm transition-all ${
            isActive
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isActive ? t('insurance.cancel') : t('insurance.enroll')}
        </button>
      </div>
    );
  };

  return (
    <div className="w-[420px] bg-gradient-to-br from-blue-50 to-white rounded-lg border-2 border-blue-200 shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
      {/* 头部 */}
      <div className="bg-blue-900 text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-300" />
          <h2 className="text-2xl font-bold tracking-wide">{t('insurance.title')}</h2>
        </div>
        <p className="text-blue-200 text-sm">Protecting your family's future since 1985</p>
      </div>

      {/* 计划列表 */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* 医疗保险 */}
        <div>
          <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2 border-b border-red-200 pb-2">
            <Heart size={20} />
            {t('insurance.medical.title')}
          </h3>
          <div className="space-y-3">
            {medicalPlans.map(renderPlanCard)}
          </div>
        </div>

        {/* 车险 */}
        <div>
          <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2 border-b border-blue-200 pb-2">
            <Car size={20} />
            {t('insurance.auto.title')}
            {!hasVehicle && (
              <span className="text-xs text-gray-500 font-normal ml-2">
                ({t('insurance.auto.noVehicle')})
              </span>
            )}
          </h3>
          {hasVehicle ? (
            <div className="space-y-3">
              {autoPlans.map(renderPlanCard)}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded">
              {t('insurance.auto.needVehicle')}
            </p>
          )}
        </div>
      </div>

      {/* 底部 */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-gray-400">
            * Subject to terms and conditions. Premiums subject to change.
          </p>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
