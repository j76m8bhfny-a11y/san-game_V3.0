import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';
import { Shield, ChevronLeft, Check, AlertCircle } from 'lucide-react';

export const DowntownInsuranceApp: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { signInsurance, cancelInsurance, vitality } = useGameStore();
  const { playSfx } = useAudioStore();

  const plans = (insuranceData as any[]).filter(i => i.allowedClasses.includes('MIDDLE') || i.allowedClasses.includes('CAPITALIST'));
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
    <div className="w-[375px] h-[667px] bg-white rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden flex flex-col relative">
      {/* 状态栏模拟 */}
      <div className="h-6 bg-white flex justify-between px-6 items-center text-[10px] font-sans font-bold text-gray-800 pt-2">
        <span>9:41</span>
        <div className="flex gap-1">
          <span>5G</span>
          <div className="w-4 h-2 bg-gray-800 rounded-[1px]"></div>
        </div>
      </div>

      {/* App Header */}
      <div className="px-6 pt-4 pb-2">
        <button onClick={onClose} className="text-blue-500 flex items-center gap-1 text-sm mb-4">
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Health+</h1>
        <p className="text-slate-500 text-sm">Choose your protection plan</p>
      </div>

      {/* Plans List */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 bg-slate-50 pt-4">
        {plans.map((plan: any) => {
          const isActive = activePlanId === plan.id;
          return (
            <div 
              key={plan.id}
              className={`p-4 rounded-2xl transition-all duration-300 border ${isActive ? 'bg-white border-blue-200 shadow-lg shadow-blue-100' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Shield size={20} />
                </div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <h3 className="font-bold text-lg text-slate-800">{plan.name}</h3>
              <div className="text-slate-500 text-xs mb-4">{plan.flavorText}</div>

              {/* Benefits Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {plan.coverage.mentalCovered && <span className="text-[10px] px-2 py-1 bg-purple-50 text-purple-600 rounded-md font-bold">Mental Health</span>}
                {plan.coverage.emergencyCovered && <span className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded-md font-bold">Emergency</span>}
                <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-bold">Copay {(plan.coverage.copayModifier * 100).toFixed(0)}%</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <span className="text-lg font-bold text-slate-900">${plan.weeklyCost}</span>
                  <span className="text-slate-400 text-xs">/week</span>
                </div>
                
                {/* iOS Style Toggle Switch */}
                <button 
                  onClick={() => handleToggle(plan.id)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isActive ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Bar */}
      <div className="h-1 bg-black w-1/3 mx-auto mb-2 rounded-full opacity-20"></div>
    </div>
  );
};