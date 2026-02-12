import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';
import { Insurance } from '@/types/schema';

export const SlumsInsuranceFlyer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { signInsurance, cancelInsurance, vitality } = useGameStore();
  const { playSfx } = useAudioStore();

  // 筛选贫民窟保险
  const plans = (insuranceData as any[]).filter(i => i.allowedClasses.includes('HOMELESS'));
  const activePlanId = vitality.activeInsurance?.id;

  const handleAction = (plan: any) => {
    if (activePlanId === plan.id) {
      playSfx('sfx_paper_tear'); // 撕纸声
      cancelInsurance();
    } else {
      playSfx('sfx_ui_impact'); // 沉重的打击声
      signInsurance(plan.id);
    }
  };

  return (
    <div className="relative w-[340px] h-[500px] bg-[#e3dac9] shadow-[10px_10px_30px_rgba(0,0,0,0.8)] rotate-1 transform transition-transform hover:scale-105 hover:rotate-0">
      {/* 胶带 */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-red-800/80 opacity-90 rotate-2 clip-tape shadow-sm z-20" />

      <div className="p-6 h-full flex flex-col bg-[url('https://www.transparenttextures.com/patterns/crinkled-paper.png')]">
        
        {/* 标题 */}
        <h2 className="font-marker text-5xl text-red-600 text-center -rotate-3 mt-4 leading-none drop-shadow-sm">
          FAST <br/><span className="text-black">CASH & AID</span>
        </h2>
        
        <div className="mt-2 text-center font-handwriting text-gray-800 font-bold text-lg -rotate-1">
          No Credit Check! No ID!
        </div>

        {/* 列表 */}
        <div className="mt-6 space-y-6 flex-1">
          {plans.map((plan: any) => {
            const isActive = activePlanId === plan.id;
            return (
              <div key={plan.id} className="relative border-2 border-dashed border-gray-400 p-2 rotate-1">
                <div className="flex justify-between items-end">
                  <span className="font-marker text-2xl">{plan.name}</span>
                  <span className="font-marker text-3xl text-red-600">${plan.weeklyCost}</span>
                </div>
                <p className="font-handwriting text-sm leading-tight mt-1 text-gray-700">
                  {plan.flavorText}
                </p>
                
                {/* 风险提示 (用极小的字) */}
                <p className="text-[8px] text-gray-400 mt-1 scale-75 origin-left">
                  * {plan.description || "Not responsible for death."}
                </p>

                {/* 签字按钮 */}
                <button
                  onClick={() => handleAction(plan)}
                  className={`
                    absolute -right-4 -bottom-4 w-16 h-16 rounded-full border-4 
                    flex items-center justify-center font-marker text-sm transition-all
                    ${isActive 
                      ? 'bg-red-700 border-red-900 text-white rotate-12 scale-110 shadow-xl' 
                      : 'bg-white border-red-600 text-red-600 -rotate-12 hover:scale-110 hover:bg-red-50'}
                  `}
                >
                  {isActive ? 'VOID' : 'SIGN'}
                </button>
              </div>
            );
          })}
        </div>

        {/* 底部涂鸦 */}
        <div className="mt-auto text-center">
          <button onClick={onClose} className="font-marker text-2xl text-gray-400 hover:text-black hover:underline decoration-wavy">
            (Leave)
          </button>
        </div>
      </div>
    </div>
  );
};