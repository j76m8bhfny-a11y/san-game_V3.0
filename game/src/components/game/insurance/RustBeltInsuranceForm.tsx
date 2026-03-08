import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';
import { useI18n } from '@/i18n';
import { Car, Heart } from 'lucide-react';

export const RustBeltInsuranceForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const { signInsurance, cancelInsurance, vitality } = useGameStore();
  const { playSfx } = useAudioStore();

  const { inventory } = useGameStore();
  const allPlans = (insuranceData as any[]).filter(i => i.allowedClasses.includes('WORKER'));
  const medicalPlans = allPlans.filter(p => p.type === 'MEDICAL');
  const autoPlans = allPlans.filter(p => p.type === 'AUTO');
  
  const activeInsurances = vitality.activeInsurances || [];
  const getIsActive = (planId: string) => activeInsurances.some((ins: any) => ins.id === planId);
  const hasVehicle = inventory.some((id: string) => id.startsWith('CAR_') || id === 'KEY_CAR');

  const handleToggle = (plan: any) => {
    const isActive = getIsActive(plan.id);
    if (isActive) {
      playSfx('sfx_click');
      cancelInsurance(plan.id);
    } else {
      playSfx('sfx_click');
      signInsurance(plan.id);
    }
  };

  const renderPlanTable = (plans: any[], title: string, icon: React.ReactNode, type: 'medical' | 'auto') => (
    <div className="mb-6">
      <h3 className="text-lg font-bold border-b border-black pb-1 mb-3 flex items-center gap-2">
        {icon}
        {title}
        {type === 'auto' && !hasVehicle && (
          <span className="text-xs text-gray-500 font-normal ml-2">
            ({t('insurance.auto.noVehicle')})
          </span>
        )}
      </h3>
      
      {type === 'auto' && !hasVehicle ? (
        <p className="text-sm text-gray-500 italic py-4 text-center">
          {t('insurance.auto.needVehicle')}
        </p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">{t('insurance.coverage.title')}</th>
              <th className="text-left py-1">{t('insurance.weekly')}</th>
              <th className="text-left py-1">{t('common.confirm')}</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan: any) => {
              const isActive = getIsActive(plan.id);
              return (
                <tr key={plan.id} className="border-b border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer" onClick={() => handleToggle(plan)}>
                  <td className="py-3 font-bold">{plan.name}</td>
                  <td className="py-3 text-red-700">-${plan.weeklyCost}/{t('insurance.weekly')}</td>
                  <td className="py-3 relative">
                     <div className={`w-5 h-5 border-2 border-black flex items-center justify-center ${isActive ? 'bg-black' : 'bg-white'}`}>
                        {isActive && <span className="text-white text-xs">✓</span>}
                     </div>
                     {isActive && (
                       <div className="absolute -top-2 -right-4 border-2 border-red-700 text-red-700 px-1 text-[10px] font-bold rotate-12 opacity-80 mix-blend-multiply pointer-events-none">
                         {t('insurance.enroll')}
                       </div>
                     )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="w-[500px] bg-[#d4d4d8] rounded-sm shadow-pixel-sm flex flex-col relative overflow-hidden">
      {/* 金属夹子顶部 */}
      <div className="h-16 bg-[#27272a] flex items-center justify-center shadow-md relative z-20">
        <div className="w-32 h-8 bg-[#52525b] rounded-b-lg border-b-4 border-[#3f3f46]"></div>
        <div className="absolute right-4 text-[#71717a] font-mono text-xs">FORM 109-B</div>
      </div>

      <div className="p-8 bg-[#f4f4f5] flex-1 font-mono text-[#18181b]">
        <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-4 tracking-tighter">
          {t('insurance.title')}
        </h2>

        {/* 医疗保险 */}
        {renderPlanTable(medicalPlans, t('insurance.medical.title'), <Heart size={18} className="text-red-600" />, 'medical')}

        {/* 车险 */}
        {renderPlanTable(autoPlans, t('insurance.auto.title'), <Car size={18} className="text-blue-600" />, 'auto')}

        <div className="text-xs text-gray-500 mb-6 border-l-2 border-gray-400 pl-2">
          NOTICE: Mental health services are currently suspended due to budget cuts. 
          Emergency room visits require pre-authorization form 22-A.
        </div>

        <div className="flex justify-between items-center border-t-2 border-dashed border-gray-400 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase">Employee Signature</span>
            <div className="font-handwriting text-xl text-blue-900">
              {activeInsurances.length > 0 ? "John Doe" : "___________"}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1 border border-black hover:bg-black hover:text-white transition-colors text-xs uppercase"
          >
            {t('common.confirm')} & {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
