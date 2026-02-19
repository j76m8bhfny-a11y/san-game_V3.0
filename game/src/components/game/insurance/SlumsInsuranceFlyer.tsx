import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';
import { useI18n } from '@/i18n';
import { Car, Heart } from 'lucide-react';

export const SlumsInsuranceFlyer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const { signInsurance, cancelInsurance, vitality, hasInsurance } = useGameStore();
  const { playSfx } = useAudioStore();

  // 筛选贫民窟保险
  const allPlans = (insuranceData as any[]).filter(i => i.allowedClasses.includes('HOMELESS'));
  const medicalPlans = allPlans.filter(p => p.type === 'MEDICAL');
  const autoPlans = allPlans.filter(p => p.type === 'AUTO');
  
  // 检查激活状态
  const activeInsurances = vitality.activeInsurances || [];
  const getIsActive = (planId: string) => activeInsurances.some((ins: any) => ins.id === planId);
  const hasAutoInsurance = hasInsurance('AUTO');
  const { inventory } = useGameStore();
  const hasVehicle = inventory.some((id: string) => id.startsWith('CAR_') || id === 'KEY_CAR');

  const handleAction = (plan: any) => {
    const isActive = getIsActive(plan.id);
    if (isActive) {
      playSfx('sfx_click');
      cancelInsurance(plan.id);
    } else {
      playSfx('sfx_click');
      signInsurance(plan.id);
    }
  };

  const renderPlanCard = (plan: any) => {
    const isActive = getIsActive(plan.id);
    const isAuto = plan.type === 'AUTO';
    
    return (
      <div key={plan.id} className="relative border-2 border-dashed border-gray-400 p-2 rotate-1">
        <div className="flex items-center gap-2 mb-1">
          {isAuto ? <Car size={16} className="text-blue-600" /> : <Heart size={16} className="text-red-600" />}
          <span className="font-marker text-xl">{plan.name}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-xs text-gray-500">{isAuto ? t('insurance.type.auto') : t('insurance.type.medical')}</span>
          <span className="font-marker text-2xl text-red-600">${plan.weeklyCost}/周</span>
        </div>
        <p className="font-handwriting text-sm leading-tight mt-1 text-gray-700">
          {plan.flavorText}
        </p>
        
        {/* 风险提示 */}
        <p className="text-[8px] text-gray-400 mt-1 scale-75 origin-left">
          * {plan.riskDescription || "Not responsible for death."}
        </p>

        {/* 按钮 */}
        <button
          onClick={() => handleAction(plan)}
          className={`
            absolute -right-3 -bottom-3 w-14 h-14 rounded-full border-4 
            flex items-center justify-center font-marker text-xs transition-all
            ${isActive 
              ? 'bg-red-700 border-red-900 text-white rotate-12 scale-110 shadow-xl' 
              : 'bg-white border-red-600 text-red-600 -rotate-12 hover:scale-110 hover:bg-red-50'}
          `}
        >
          {isActive ? t('insurance.cancel') : t('insurance.enroll')}
        </button>
      </div>
    );
  };

  return (
    <div className="relative w-[360px] h-[580px] bg-[#e3dac9] shadow-[10px_10px_30px_rgba(0,0,0,0.8)] rotate-1 transform transition-transform hover:scale-105 hover:rotate-0">
      {/* 胶带 */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-red-800/80 opacity-90 rotate-2 clip-tape shadow-sm z-20" />

      <div className="p-5 h-full flex flex-col bg-[url('https://www.transparenttextures.com/patterns/crinkled-paper.png')]">
        
        {/* 标题 */}
        <h2 className="font-marker text-4xl text-red-600 text-center -rotate-3 mt-2 leading-none drop-shadow-sm">
          FAST <br/><span className="text-black">CASH & AID</span>
        </h2>
        
        <div className="mt-1 text-center font-handwriting text-gray-800 font-bold text-sm -rotate-1">
          No Credit Check! No ID!
        </div>

        {/* 医疗保险区域 */}
        <div className="mt-4">
          <h3 className="font-marker text-lg text-red-800 border-b-2 border-red-800/30 pb-1 mb-2">
            {t('insurance.medical.title')}
          </h3>
          <div className="space-y-4">
            {medicalPlans.map(renderPlanCard)}
          </div>
        </div>

        {/* 车险区域 */}
        <div className="mt-4">
          <h3 className="font-marker text-lg text-blue-800 border-b-2 border-blue-800/30 pb-1 mb-2">
            {t('insurance.auto.title')}
            {!hasVehicle && (
              <span className="text-xs text-gray-500 ml-2 font-normal">
                ({t('insurance.auto.noVehicle')})
              </span>
            )}
          </h3>
          <div className="space-y-4">
            {hasVehicle ? (
              autoPlans.map(renderPlanCard)
            ) : (
              <p className="text-sm text-gray-500 italic">
                {t('insurance.auto.needVehicle')}
              </p>
            )}
          </div>
        </div>

        {/* 底部关闭 */}
        <div className="mt-auto text-center pt-2">
          <button onClick={onClose} className="font-marker text-xl text-gray-400 hover:text-black hover:underline decoration-wavy">
            ({t('common.close')})
          </button>
        </div>
      </div>
    </div>
  );
};
