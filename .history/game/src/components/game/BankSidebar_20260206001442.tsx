import React, { useState } from 'react'; 
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Insurance, ActiveInsuranceState, ActiveLoan } from '@/types/schema';
import { Landmark, Shield, AlertTriangle, Check, ChevronRight } from 'lucide-react';
// ✅ 引入规则配置，替代硬编码
import bankRules from '@/assets/data/rules/bankRules.json';

type Tab = 'LOANS' | 'INSURANCE';

export const BankSidebar: React.FC = () => {
  const {
    bank,
    gameDataCache,
    vitality,
    activeInsurance,
    setInsurance,
    makeInstallment,
    addNotification,
    isBankOpen,
    setBankOpen,
  } = useGameStore();

  const { playSfx } = useAudioStore();
  const [activeTab, setActiveTab] = useState<Tab>('LOANS');

  const insurances = gameDataCache?.insurance || [];
  const currentClass = vitality.identity.currentClass;
  const currentTurn = vitality.time.currentTurn;

  const handleSignInsurance = (plan: Insurance) => {
    // 检查阶级准入
    if (!plan.allowedClasses.includes(currentClass)) {
      playSfx('sfx_deny');
      addNotification("您的社会信用阶级不符合该保险的准入要求。", "error");
      return;
    }

    playSfx('sfx_cash'); 
    
    // ✅ Refactor: 从 JSON 配置读取签约时长
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
  };

  const handleRepay = (loan: ActiveLoan) => {
    const totalDebt = loan.principal + loan.interest;
    const affordable = Math.min(totalDebt, vitality.metrics.gold);

    if (affordable <= 0) {
      playSfx('sfx_deny');
      addNotification("你身无分文，无法还款。", "error");
      return;
    }

    const result = makeInstallment(loan.id, affordable);

    if (result.success) {
      playSfx('sfx_cash'); 
      addNotification(result.message, "success");
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, "error");
    }
  };

  if (!isBankOpen) return null;

  return (
    <>
      {/* 遮罩层 - 点击关闭 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => setBankOpen(false)}
      />
      
      {/* 银行面板 */}
      <div className="fixed right-4 top-24 bottom-12 w-2/3 bg-[#0a0a0a] text-white font-mono border border-gray-800 z-50 rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('LOANS')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors rounded ${
              activeTab === 'LOANS' ? 'bg-amber-900/20 text-amber-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Landmark size={16} /> LOANS
          </button>
          <button
            onClick={() => setActiveTab('INSURANCE')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors rounded ${
              activeTab === 'INSURANCE' ? 'bg-emerald-900/20 text-emerald-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Shield size={16} /> INSURANCE
          </button>
        </div>
        <button
          onClick={() => setBankOpen(false)}
          className="text-gray-500 hover:text-white transition-colors p-1"
        >
          ✕
        </button>
      </div>
        <button
          onClick={() => setActiveTab('LOANS')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'LOANS' ? 'bg-amber-900/20 text-amber-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Landmark size={16} /> LOANS
        </button>
        <button
          onClick={() => setActiveTab('INSURANCE')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'INSURANCE' ? 'bg-emerald-900/20 text-emerald-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Shield size={16} /> INSURANCE
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        
        {/* --- INSURANCE TAB --- */}
        {activeTab === 'INSURANCE' && (
          <div className="space-y-6">
            {/* 当前状态卡片 */}
            <div className="p-4 bg-emerald-900/10 border border-emerald-500/30 rounded-lg">
              <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                <Shield size={18} /> 当前生效保险
              </h3>
              {activeInsurance ? (
                <div>
                  <div className="text-xl font-black text-white">{activeInsurance.name}</div>
                  <div className="text-xs text-emerald-300/70 mt-1">
                    续费倒计时: {Math.max(0, activeInsurance.renewalTurn - currentTurn)} 周
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-1 bg-black/40 rounded text-[10px] text-gray-400">
                      自付比例: {(activeInsurance.coverage.copayModifier * 100).toFixed(0)}%
                    </span>
                    <span className="px-2 py-1 bg-black/40 rounded text-[10px] text-gray-400">
                      周费: ${activeInsurance.premium}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  <AlertTriangle className="inline mb-1 mr-1" size={14}/> 
                  您当前处于裸奔状态 (无医保)
                </div>
              )}
            </div>

            {/* 保险列表 */}
            <div className="space-y-3">
              <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Available Plans</h4>
              {insurances.map((plan: Insurance) => {
                const isCurrent = activeInsurance?.id === plan.id;
                const isLocked = !plan.allowedClasses.includes(currentClass);

                return (
                  <div key={plan.id} className={`relative group border transition-all duration-300 ${
                    isCurrent ? 'border-emerald-500 bg-emerald-900/5' : 
                    isLocked ? 'border-gray-800 bg-gray-900/50 opacity-50' : 
                    'border-gray-700 bg-gray-900 hover:border-gray-500'
                  }`}>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-lg font-bold text-white">{plan.name}</div>
                        <div className="text-emerald-400 font-mono font-bold">${plan.weeklyCost}<span className="text-xs text-gray-500">/W</span></div>
                      </div>
                      <p className="text-xs text-gray-400 mb-4 h-8 overflow-hidden">{plan.description}</p>
                      
                      {/* Coverage Badges */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300 mb-4">
                        <div className="flex items-center gap-1">
                          <Check size={12} className="text-emerald-500"/> 
                          自付 {plan.coverage.copayModifier * 100}%
                        </div>
                        <div className={`flex items-center gap-1 ${plan.coverage.emergencyCovered ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                          <Check size={12} /> 急诊覆盖
                        </div>
                        <div className={`flex items-center gap-1 ${plan.coverage.mentalCovered ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                          <Check size={12} /> 精神科
                        </div>
                        <div className={`flex items-center gap-1 ${plan.coverage.addictionCovered ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                          <Check size={12} /> 成瘾治疗
                        </div>
                      </div>

                      {!isLocked && !isCurrent && (
                        <button
                          onClick={() => handleSignInsurance(plan)}
                          className="w-full py-3 bg-white/5 hover:bg-white/10 border-t border-white/5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
                        >
                          签约此计划 <ChevronRight size={14} />
                        </button>
                      )}
                      
                      {isCurrent && (
                        <div className="w-full py-3 bg-emerald-500/10 border-t border-emerald-500/20 text-emerald-500 text-xs font-bold text-center flex items-center justify-center gap-2">
                          <Check size={14}/> 当前生效中
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- LOANS TAB --- */}
        {activeTab === 'LOANS' && (
          <div className="space-y-4">
             {bank.activeLoans.length === 0 ? (
                <div className="text-center text-gray-500 py-10">无活跃贷款</div>
            ) : (
                bank.activeLoans.map(loan => (
                    <div key={loan.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-amber-500">{loan.productId}</span>
                            <span className="text-xs text-gray-400">利率: {(loan.rate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm mb-4">
                            <span>本金: ${loan.principal}</span>
                            <span>利息: ${loan.interest}</span>
                        </div>
                        <button 
                            onClick={() => handleRepay(loan)}
                            className="w-full py-2 bg-blue-900/30 border border-blue-500/50 text-blue-400 hover:bg-blue-900/50 transition-colors rounded"
                        >
                            还款 (最大额)
                        </button>
                    </div>
                ))
            )}
          </div>
        )}

      </div>
    </div>
    </>
  );
};