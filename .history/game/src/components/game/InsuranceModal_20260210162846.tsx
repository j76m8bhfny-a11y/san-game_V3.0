import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Insurance, ActiveInsuranceState } from '@/types/schema';
import { Shield, Check, AlertTriangle, ChevronRight, Clock, X } from 'lucide-react';
// 引入配置
import bankRules from '@/assets/data/rules/bankRules.json';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// 格式化金额显示
const formatGold = (amount: number) => `$${amount.toLocaleString()}`;

export const InsuranceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    gameDataCache,
    vitality,
    activeInsurance,
    setInsurance,
    addNotification,
    addTransaction,
  } = useGameStore();

  const { playSfx } = useAudioStore();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const insurances = gameDataCache?.insurance || [];
  const currentClass = vitality?.identity?.currentClass ?? 'HOMELESS';
  const currentTurn = vitality?.time?.currentTurn ?? 1;
  const currentGold = vitality?.metrics?.gold ?? 0;

  const handleSignInsurance = async (plan: Insurance) => {
    if (processingId === plan.id) return;
    
    // 检查阶级准入
    if (!plan.allowedClasses?.includes(currentClass)) {
      playSfx('sfx_deny');
      addNotification("您的社会信用阶级不符合该保险的准入要求。", "error");
      return;
    }

    // 检查是否已有保险
    if (activeInsurance) {
      playSfx('sfx_deny');
      addNotification(`您已签约 ${activeInsurance.name}，请先解约或等待到期。`, "error");
      return;
    }

    // 检查金币
    if (currentGold < plan.weeklyCost) {
      playSfx('sfx_deny');
      addNotification(`资金不足，签约 ${plan.name} 需要首期保费 ${formatGold(plan.weeklyCost)}`, "error");
      return;
    }

    setProcessingId(plan.id);

    try {
      // 扣除首期保费
      const txResult = addTransaction('MEDICAL', -plan.weeklyCost, `保险首期: ${plan.name}`);
      if (!txResult.success) {
        addNotification("资金不足以支付保险费用", "error");
        return;
      }

      playSfx('sfx_cash'); // 这里可以用签字声 'sfx_pen_scratch'
      
      const contractDuration = bankRules.insurance.contractDuration;

      const newInsurance: ActiveInsuranceState = {
        id: plan.id,
        name: plan.name,
        type: 'MEDICAL', 
        coverage: plan.coverage, 
        premium: plan.weeklyCost,
        renewalTurn: currentTurn + contractDuration 
      };

      setInsurance(newInsurance);
      addNotification(`已签约: ${plan.name} (保障期 ${contractDuration} 周)`, "success");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#0f172a] border border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <Shield size={24} />
            <h2 className="text-xl font-bold font-mono tracking-widest">INSURANCE MARKET</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          {/* 当前状态 */}
          <div className="p-5 bg-gradient-to-br from-emerald-900/20 to-gray-900 border border-emerald-500/30 rounded-lg">
            <h3 className="text-emerald-400 font-bold mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
              <Shield size={14} /> Current Policy
            </h3>
            {activeInsurance ? (
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-black text-white mb-1">{activeInsurance.name}</div>
                    {(() => {
                      const weeksLeft = activeInsurance.renewalTurn - currentTurn;
                      const isExpired = weeksLeft <= 0;
                      return (
                        <div className={`text-xs font-mono ${isExpired ? 'text-red-400' : 'text-emerald-300/70'}`}>
                          {isExpired ? (
                            <span className="flex items-center gap-1"><AlertTriangle size={12} /> EXPIRED</span>
                          ) : (
                            <span className="flex items-center gap-1"><Clock size={12} /> RENEWAL IN {weeksLeft} WEEKS</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Premium</div>
                    <div className="text-xl font-mono text-emerald-400">{formatGold(activeInsurance.premium)}/w</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-500/20 grid grid-cols-2 gap-4">
                  <div className="text-xs text-gray-400">
                    Copay: <span className="text-white">{(activeInsurance.coverage.copayModifier * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Status: <span className="text-emerald-400">ACTIVE</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-500 py-2">
                <AlertTriangle size={20} className="text-amber-500" />
                <span className="text-sm">You are currently uninsured. Any medical emergency could bankrupt you.</span>
              </div>
            )}
          </div>

          {/* 市场列表 */}
          <div className="space-y-4">
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest px-1">Available Plans</h4>
            {insurances.map((plan) => {
              const isCurrent = activeInsurance?.id === plan.id;
              const isLocked = !plan.allowedClasses?.includes(currentClass);

              return (
                <div key={plan.id} className={`
                  relative border rounded-lg transition-all duration-300 overflow-hidden
                  ${isCurrent ? 'border-emerald-500 bg-emerald-900/10' : 
                    isLocked ? 'border-gray-800 bg-gray-900/50 opacity-60' : 
                    'border-gray-700 bg-gray-800/50 hover:border-gray-500'}
                `}>
                  <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-white">{plan.name}</span>
                        {isCurrent && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-bold uppercase">Active</span>}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{plan.description}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-300">
                        <span className="flex items-center gap-1"><Check size={10} className="text-emerald-500"/> Copay {plan.coverage.copayModifier * 100}%</span>
                        <span className={`flex items-center gap-1 ${plan.coverage.emergencyCovered ? 'text-gray-300' : 'text-gray-600 line-through'}`}>Emergency</span>
                        <span className={`flex items-center gap-1 ${plan.coverage.mentalCovered ? 'text-gray-300' : 'text-gray-600 line-through'}`}>Mental Health</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <div className="text-lg font-mono font-bold text-emerald-400">{formatGold(plan.weeklyCost)}</div>
                        <div className="text-[10px] text-gray-500">per week</div>
                      </div>

                      {!isCurrent && !isLocked && (
                        <button
                          onClick={() => handleSignInsurance(plan)}
                          disabled={processingId === plan.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {processingId === plan.id ? '...' : 'Sign'} <ChevronRight size={14} />
                        </button>
                      )}
                      {isLocked && (
                        <div className="px-3 py-1 border border-gray-600 text-gray-500 text-xs rounded">Locked</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};