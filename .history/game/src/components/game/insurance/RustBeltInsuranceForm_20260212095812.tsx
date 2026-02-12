import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';

export const RustBeltInsuranceForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { signInsurance, cancelInsurance, vitality } = useGameStore();
  const { playSfx } = useAudioStore();

  const plans = (insuranceData as any[]).filter(i => i.allowedClasses.includes('WORKER'));
  const activePlanId = vitality.activeInsurance?.id;

  const handleToggle = (plan: any) => {
    if (activePlanId === plan.id) {
      playSfx('sfx_stamp'); // 假设有盖章声
      cancelInsurance();
    } else {
      playSfx('sfx_stamp');
      signInsurance(plan.id);
    }
  };

  return (
    <div className="w-[500px] bg-[#d4d4d8] rounded-sm shadow-2xl flex flex-col relative overflow-hidden">
      {/* 金属夹子顶部 */}
      <div className="h-16 bg-[#27272a] flex items-center justify-center shadow-md relative z-20">
        <div className="w-32 h-8 bg-[#52525b] rounded-b-lg border-b-4 border-[#3f3f46]"></div>
        <div className="absolute right-4 text-[#71717a] font-mono text-xs">FORM 109-B</div>
      </div>

      <div className="p-8 bg-[#f4f4f5] flex-1 font-mono text-[#18181b]">
        <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-4 tracking-tighter">
          UNION HEALTH BENEFIT ENROLLMENT
        </h2>

        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">PLAN CODE</th>
              <th className="text-left py-1">DEDUCTION</th>
              <th className="text-left py-1">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan: any) => {
              const isActive = activePlanId === plan.id;
              return (
                <tr key={plan.id} className="border-b border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer" onClick={() => handleToggle(plan)}>
                  <td className="py-3 font-bold">{plan.name}</td>
                  <td className="py-3 text-red-700">-${plan.weeklyCost}/wk</td>
                  <td className="py-3 relative">
                     <div className={`w-5 h-5 border-2 border-black flex items-center justify-center ${isActive ? 'bg-black' : 'bg-white'}`}>
                        {isActive && <span className="text-white text-xs">✓</span>}
                     </div>
                     {/* 盖章动画效果 */}
                     {isActive && (
                       <div className="absolute -top-2 -right-4 border-2 border-red-700 text-red-700 px-1 text-[10px] font-bold rotate-12 opacity-80 mix-blend-multiply pointer-events-none">
                         APPROVED
                       </div>
                     )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="text-xs text-gray-500 mb-8 border-l-2 border-gray-400 pl-2">
          NOTICE: Mental health services are currently suspended due to budget cuts. 
          Emergency room visits require pre-authorization form 22-A.
        </div>

        <div className="flex justify-between items-center border-t-2 border-dashed border-gray-400 pt-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase">Employee Signature</span>
            <div className="font-handwriting text-xl text-blue-900">{activePlanId ? "John Doe" : "___________"}</div>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1 border border-black hover:bg-black hover:text-white transition-colors text-xs uppercase"
          >
            Submit & Close
          </button>
        </div>
      </div>
    </div>
  );
};