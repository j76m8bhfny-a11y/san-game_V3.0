import React from 'react';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';
import { Heart, Car } from 'lucide-react';

export const CapitalistInsuranceCard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const { signInsurance, cancelInsurance, vitality, hasInsurance } = useGameStore();
  const { playSfx } = useAudioStore();

  const { inventory } = useGameStore();
  // VIP医疗保险
  const medicalPlan = (insuranceData as any[]).find(i => i.id === 'INS_GLOBAL_VIP');
  // 标准车险（资本家也用车险）
  const autoPlan = (insuranceData as any[]).find(i => i.id === 'INS_AUTO_STANDARD');
  
  const activeInsurances = vitality.activeInsurances || [];
  const hasMedicalInsurance = hasInsurance('MEDICAL');
  const hasAutoInsurance = hasInsurance('AUTO');
  const hasVehicle = inventory.some((id: string) => id.startsWith('CAR_') || id === 'KEY_CAR');

  const handleSign = (plan: any) => {
    if (!plan) return;
    const isActive = activeInsurances.some((ins: any) => ins.id === plan.id);
    if (isActive) {
      cancelInsurance(plan.id);
    } else {
      playSfx('sfx_click');
      signInsurance(plan.id);
    }
  };

  return (
    <div className="relative w-[600px] bg-[#0a0a0a] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-[#333] flex flex-col p-8 overflow-hidden group">
      {/* 背景纹理 */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')] opacity-80" />
      
      {/* 装饰金边 */}
      <div className="absolute inset-4 border border-[#d4af37] opacity-30 rounded-lg pointer-events-none" />
      
      {/* 内容层 */}
      <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
        {/* 头部 */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[#d4af37] font-pixel text-3xl tracking-[0.2em] uppercase">Apex <span className="text-white/20">Biosciences</span></h2>
            <p className="text-[#d4af37]/60 font-pixel text-xs tracking-widest mt-1">PREMIUM INSURANCE SERVICES</p>
          </div>
          <div className="w-12 h-12 border border-[#d4af37] rounded-full flex items-center justify-center opacity-50">
            <span className="text-[#d4af37] font-pixel text-2xl">A</span>
          </div>
        </div>

        {/* VIP医疗保险卡 */}
        {medicalPlan && (
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-[#d4af37]/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="text-red-500" size={24} />
              <h3 className="text-[#d4af37] font-pixel text-xl">{medicalPlan.name}</h3>
              <span className="text-xs text-gray-500 ml-auto">{t('insurance.type.medical')}</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">{medicalPlan.flavorText}</p>
            <div className="flex items-center justify-between">
              <div className="font-mono text-[#d4af37] text-lg">
                ${medicalPlan.weeklyCost}/{t('insurance.weekly')}
              </div>
              <button
                onClick={() => handleSign(medicalPlan)}
                className={`px-6 py-2 rounded border transition-all ${
                  hasMedicalInsurance 
                    ? 'border-red-500 text-red-500 hover:bg-red-500/10' 
                    : 'border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10'
                }`}
              >
                {hasMedicalInsurance ? t('insurance.cancel') : t('insurance.enroll')}
              </button>
            </div>
          </div>
        )}

        {/* 车险卡 */}
        {autoPlan && hasVehicle && (
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Car className="text-blue-500" size={24} />
              <h3 className="text-blue-400 font-pixel text-xl">{autoPlan.name}</h3>
              <span className="text-xs text-gray-500 ml-auto">{t('insurance.type.auto')}</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">{autoPlan.flavorText}</p>
            <div className="flex items-center justify-between">
              <div className="font-mono text-blue-400 text-lg">
                ${autoPlan.weeklyCost}/{t('insurance.weekly')}
              </div>
              <button
                onClick={() => handleSign(autoPlan)}
                className={`px-6 py-2 rounded border transition-all ${
                  hasAutoInsurance 
                    ? 'border-red-500 text-red-500 hover:bg-red-500/10' 
                    : 'border-blue-500 text-blue-500 hover:bg-blue-500/10'
                }`}
              >
                {hasAutoInsurance ? t('insurance.cancel') : t('insurance.enroll')}
              </button>
            </div>
          </div>
        )}

        {!hasVehicle && (
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6 text-center">
            <Car className="text-gray-600 mx-auto mb-2" size={32} />
            <p className="text-gray-500 text-sm">{t('insurance.auto.needVehicle')}</p>
          </div>
        )}

        {/* 底部 */}
        <div className="flex justify-between items-end border-t border-[#d4af37]/20 pt-6">
          <div>
             <p className="text-[#888] text-[8px] uppercase tracking-widest mb-1">{t('insurance.memberSignature')}</p>
             <p className="font-handwriting text-2xl text-white/90 min-w-[200px]">
                {activeInsurances.length > 0 ? t('insurance.signed') : t('insurance.signHere')}
             </p>
          </div>

          <div className="text-right">
            <p className="text-[#d4af37] font-pixel text-lg">
              {activeInsurances.length > 0 ? t('insurance.active') : t('insurance.invitationOnly')}
            </p>
            <button onClick={onClose} className="text-[#555] text-[10px] hover:text-white uppercase mt-2 tracking-widest">
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>

      {/* 光效扫光 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </div>
  );
};
