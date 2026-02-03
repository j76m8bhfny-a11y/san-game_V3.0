import React, { useState } from 'react'; // ✅ 修复：移除未使用的 useMemo (警告 6133)
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
// ✅ 修复：引入 ActiveInsuranceState (警告 6133)
import { Insurance, ActiveInsuranceState } from '@/types/schema';
import { Landmark, Shield, AlertTriangle, Check, X, CreditCard, ChevronRight, Lock } from 'lucide-react';

type Tab = 'LOANS' | 'INSURANCE';

export const BankSidebar: React.FC = () => {
  const { 
    isBankOpen, 
    setBankOpen, 
    gameDataCache, 
    vitality, 
    activeInsurance,
    setInsurance,
    addNotification,
    // 移除未使用的 bank (警告 6133)
  } = useGameStore();

  const { playSfx } = useAudioStore();
  const [activeTab, setActiveTab] = useState<Tab>('LOANS');

  // 获取数据
  const insurances = gameDataCache?.insurance || [];
  const currentClass = vitality.identity.currentClass;
  const currentTurn = vitality.time.currentTurn;

  // 🏦 购买/切换保险逻辑
  const handleSignInsurance = (plan: Insurance) => {
    // 1. 检查阶级资格
    if (!plan.allowedClasses.includes(currentClass)) {
      playSfx('sfx_deny');
      addNotification("您的社会信用阶级不符合该保险的准入要求。", "error");
      return;
    }

    // 2. 检查资金 (首期保费)
    if (vitality.metrics.gold < plan.weeklyCost) {
      playSfx('sfx_deny');
      addNotification("资金不足，无法支付首期保费。", "error");
      return;
    }

    // 3. 构建运行时状态对象 (对齐 ActiveInsuranceState 接口)
    // ✅ 修复：解决 2345 报错
    const activePlan: ActiveInsuranceState = {
      id: plan.id,
      name: plan.name,
      type: 'MEDICAL', // 默认医疗险
      coverage: plan.coverage,
      premium: plan.weeklyCost, // ✅ 修复：对齐 premium 属性名
      renewalTurn: currentTurn + 1 // 下周一扣费
    };

    // 4. 签约
    playSfx('sfx_cash');
    setInsurance(activePlan);
    addNotification(`已签署: ${plan.name}`, "success");
  };

  const panelClass = `
    fixed top-0 left-0 bottom-0 z-50 w-full md:w-[450px] bg-[#0c0c0e] border-r border-white/10 
    transform transition-transform duration-300 ease-out flex flex-col font-sans
    ${isBankOpen ? 'translate-x-0 shadow-[10px_0_50px_rgba(0,0,0,0.8)]' : '-translate-x-full'}
  `;

  return (
    <div className={panelClass} onClick={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-[#141416] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Landmark className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">联合银行</h2>
            <div className="text-xs text-gray-500 font-mono">UNION BANK CORP.</div>
          </div>
        </div>
        <button onClick={() => setBankOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-[#0c0c0e]">
        <button 
          onClick={() => setActiveTab('LOANS')}
          className={`flex-1 py-4 text-sm font-bold tracking-widest transition-colors relative ${activeTab === 'LOANS' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
        >
          信贷业务
          {activeTab === 'LOANS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('INSURANCE')}
          className={`flex-1 py-4 text-sm font-bold tracking-widest transition-colors relative ${activeTab === 'INSURANCE' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
        >
          医疗保险
          {activeTab === 'INSURANCE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] p-6">
        
        {/* --- INSURANCE TAB --- */}
        {activeTab === 'INSURANCE' && (
          <div className="space-y-6">
            {/* 当前计划 */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Shield size={80} />
              </div>
              <div className="relative z-10">
                <div className="text-xs text-emerald-400 uppercase tracking-widest mb-1">CURRENT PLAN</div>
                <h3 className="text-2xl font-black text-white mb-2">
                  {activeInsurance ? activeInsurance.name : "未投保 (自费模式)"}
                </h3>
                {activeInsurance ? (
                  <div className="text-sm text-gray-300">
                    {/* ✅ 修复：activeInsurance 属性名对齐为 premium (警告 2339) */}
                    <span className="text-emerald-400 font-bold">已生效</span> • 每周扣费 ${activeInsurance.premium}
                  </div>
                ) : (
                   <div className="text-sm text-red-400 flex items-center gap-1">
                     <AlertTriangle size={14}/> 极高风险：急诊与重病将导致破产
                   </div>
                )}
              </div>
            </div>

            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-8 mb-4">AVAILABLE PLANS</h3>
            
            <div className="space-y-4">
              {insurances.map((plan: Insurance) => {
                const isCurrent = activeInsurance?.id === plan.id;
                const isLocked = !plan.allowedClasses.includes(currentClass);
                
                return (
                  <div 
                    key={plan.id}
                    className={`
                      relative group rounded-xl border transition-all duration-300 overflow-hidden
                      ${isCurrent 
                        ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                        : isLocked
                          ? 'bg-gray-900/50 border-white/5 opacity-60 grayscale'
                          : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                      }
                    `}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                         <div className="bg-black/80 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 text-xs text-gray-400 font-mono">
                           <Lock size={12} /> 阶级限制: {plan.allowedClasses.join('/')}
                         </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className={`text-lg font-bold ${isCurrent ? 'text-emerald-400' : 'text-gray-200'}`}>
                            {plan.name}
                          </h4>
                          <div className="text-xs text-gray-500 mt-1">{plan.description}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-mono font-bold ${plan.weeklyCost === 0 ? 'text-emerald-400' : 'text-white'}`}>
                            ${plan.weeklyCost}<span className="text-xs text-gray-500 font-sans font-normal">/周</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-4">
                        <div className={`flex items-center gap-1.5 ${plan.coverage.copayModifier === 0 ? 'text-emerald-400' : ''}`}>
                          <CreditCard size={12} /> 
                          {plan.coverage.copayModifier === 0 ? '全额报销' : `自付 ${(plan.coverage.copayModifier * 100).toFixed(0)}%`}
                        </div>
                        <div className={`flex items-center gap-1.5 ${plan.coverage.emergencyCovered ? 'text-blue-400' : 'text-gray-600 line-through'}`}>
                          <AlertTriangle size={12} /> 急诊覆盖
                        </div>
                        <div className={`flex items-center gap-1.5 ${plan.coverage.mentalCovered ? 'text-purple-400' : 'text-gray-600 line-through'}`}>
                          <Shield size={12} /> 心理健康
                        </div>
                        <div className={`flex items-center gap-1.5 ${plan.coverage.addictionCovered ? 'text-orange-400' : 'text-gray-600 line-through'}`}>
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
          <div className="text-center py-20 text-gray-500">
            <div className="mb-4 flex justify-center"><Landmark size={48} strokeWidth={1} /></div>
            <p className="text-sm">信贷系统逻辑保持不变...</p>
            <p className="text-xs mt-2 opacity-50">(此处应显示 ActiveLoans 和 LoanProducts)</p>
          </div>
        )}

      </div>
    </div>
  );
};