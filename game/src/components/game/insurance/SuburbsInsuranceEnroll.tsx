import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';
import { Shield, Check, Info } from 'lucide-react';
import { useI18n } from '@/i18n';

export const SuburbsInsuranceEnroll: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const { signInsurance, cancelInsurance, vitality } = useGameStore();
  const { playSfx } = useAudioStore();

  // 中产阶级保险：MIDDLE 和 CAPITAlIST 都可购买
  const plans = (insuranceData as any[]).filter(i => 
    i.allowedClasses.includes('MIDDLE') || i.allowedClasses.includes('CAPITALIST')
  );
  const activePlanId = vitality.activeInsurance?.id;

  const handleToggle = (planId: string) => {
    playSfx('sfx_click');
    if (activePlanId === planId) {
      cancelInsurance();
    } else {
      signInsurance(planId);
    }
  };

  return (
    <div className="w-[420px] bg-gradient-to-br from-blue-50 to-white rounded-lg border-2 border-blue-200 shadow-xl overflow-hidden flex flex-col">
      {/* 头部：专业保险公司风格 */}
      <div className="bg-blue-900 text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-300" />
          <h2 className="text-2xl font-bold tracking-wide">{t('insurance.title')}</h2>
        </div>
        <p className="text-blue-200 text-sm">Protecting your family's future since 1985</p>
      </div>

      {/* 计划列表 */}
      <div className="p-6 space-y-4 flex-1">
        {plans.map((plan: any) => {
          const isActive = activePlanId === plan.id;
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
                <div>
                  <h3 className="font-bold text-blue-900">{plan.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">{plan.flavorText}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-900">${plan.weeklyCost}</span>
                  <span className="text-gray-400 text-xs">/{t('insurance.weekly')}</span>
                </div>
              </div>

              {/* 保障范围 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {plan.coverage.emergencyCovered && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    <Check size={10} /> {t('insurance.coverage.title')}
                  </span>
                )}
                {plan.coverage.mentalCovered && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    <Check size={10} /> {t('insurance.medical')}
                  </span>
                )}
                {plan.coverage.addictionCovered && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    <Check size={10} /> {t('insurance.medical')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  <Info size={10} /> {t('insurance.weekly')} {(plan.coverage.copayModifier * 100).toFixed(0)}%
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
        })}
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
