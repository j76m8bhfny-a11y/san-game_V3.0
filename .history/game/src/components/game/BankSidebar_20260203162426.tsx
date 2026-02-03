import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Insurance, ActiveLoan } from '@/types/schema';
import { Landmark, Shield, AlertTriangle, Check, ChevronRight, Lock, DollarSign, X, CreditCard } from 'lucide-react';

type Tab = 'LOANS' | 'INSURANCE';

export const BankSidebar: React.FC = () => {
  const { 
    isBankOpen, 
    setBankOpen, 
    gameDataCache, 
    vitality, 
    bank, // ✅ 恢复引入 bank 状态
    activeInsurance,
    setInsurance,
    makeInstallment, // ✅ 引入原子还款 Action
    addNotification,
  } = useGameStore();

  const { playSfx } = useAudioStore();
  const [activeTab, setActiveTab] = useState<Tab>('LOANS');

  // 获取数据
  const insurances = gameDataCache?.insurance || [];
  const currentClass = vitality.identity.currentClass;
  
  if (!isBankOpen) return null;

  // ----------------------------------------------------------------
  // 🏥 保险业务逻辑
  // ----------------------------------------------------------------
  const handleSignInsurance = (plan: Insurance) => {
    // 1. 检查阶级资格
    if (!plan.allowedClasses.includes(currentClass)) {
      playSfx('sfx_deny');
      addNotification("您的社会信用阶级不符合该保险的准入要求。", "error");
      return;
    }

    // 2. 检查是否有旧保险
    if (activeInsurance) {
       // 简单处理：覆盖旧保险 (实际项目可能需要退保逻辑)
       // addNotification(`已自动退订旧保险: ${activeInsurance.name}`, "info");
    }

    // 3. 签约
    setInsurance({
      id: plan.id,
      name: plan.name,
      type: 'MEDICAL', // 简化假设
      coverage: plan.coverage,
      premium: plan.weeklyCost,
      renewalTurn: vitality.time.currentTurn + 4 // 假设一签4周
    });

    playSfx('sfx_buy');
    addNotification(`签约成功: ${plan.name}`, "success");
  };

  // ----------------------------------------------------------------
  // 💰 信贷还款逻辑 (Core Fix)
  // ----------------------------------------------------------------
  const handleRepay = (loan: ActiveLoan) => {
    // 计算本次还款额：取 (本息总额) 和 (玩家现金) 的较小值
    const totalDebt = loan.principal + loan.interest;
    const affordable = Math.min(totalDebt, vitality.metrics.gold);

    if (affordable <= 0) {
      playSfx('sfx_deny');
      addNotification("你身无分文，无法还款。", "error");
      return;
    }

    // ✅ 调用原子 Action，不再手动 addTransaction
    const result = makeInstallment(loan.id, affordable);

    if (result.success) {
      playSfx('sfx_coins');
      addNotification(result.message, "success");
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, "error");
    }
  };

  // ----------------------------------------------------------------
  // 渲染
  // ----------------------------------------------------------------
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0a0a0a] border-l border-gray-800 shadow-2xl flex flex-col z-50 font-mono text-white slide-in-right">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-[#111] flex justify-between items-center">
        <div className="flex items-center gap-2 text-amber-500">
          <Landmark size={20} />
          <h2 className="font-bold tracking-widest">IRON BANK</h2>
        </div>
        <button 
          onClick={() => setBankOpen(false)}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('LOANS')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'LOANS' ? 'bg-amber-900/20 text-amber-500 border-b-2 border-amber-500' : 'text-gray-500 hover:bg-white/5'
          }`}
        >
          <CreditCard size={14} /> LOANS & DEBT
        </button>
        <button
          onClick={() => setActiveTab('INSURANCE')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'INSURANCE' ? 'bg-emerald-900/20 text-emerald-500 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-white/5'
          }`}
        >
          <Shield size={14} /> INSURANCE
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        
        {/* === INSURANCE TAB === */}
        {activeTab === 'INSURANCE' && (
          <div className="space-y-4">
            <div className="text-xs text-gray-500 mb-4 px-2 border-l-2 border-emerald-500">
              医疗保险可报销大部分医疗账单。不同阶级可购买的保险计划不同。
            </div>

            {insurances.map(plan => {
              const isLocked = !plan.allowedClasses.includes(currentClass);
              const isCurrent = activeInsurance?.id === plan.id;

              return (
                <div 
                  key={plan.id}
                  className={`relative border rounded-lg overflow-hidden transition-all ${
                    isCurrent ? 'border-emerald-500 bg-emerald-900/10' : 
                    isLocked ? 'border-gray-800 bg-gray-900/50 opacity-60' : 
                    'border-gray-700 bg-gray-900 hover:border-gray-500'
                  }`}
                >
                  {/* Header */}
                  <div className="p-3 border-b border-white/5 flex justify-between items-start">
                    <div>
                      <h3 className={`font-bold ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>{plan.name}</h3>
                      <div className="text-[10px] text-gray-400 mt-1">{plan.description}</div>
                    </div>
                    {isLocked && <Lock size={14} className="text-gray-600" />}
                  </div>

                  {/* Stats */}
                  <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500">周费</span>
                      <span className="text-amber-400 font-bold">${plan.weeklyCost}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">报销比例</span>
                      <span className="text-white">{(1 - plan.coverage.copayModifier) * 100}%</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="px-3 pb-3 flex flex-wrap gap-1">
                    {plan.coverage.emergencyCovered && (
                      <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 text-[10px] rounded border border-red-900/50">急诊</span>
                    )}
                    {plan.coverage.mentalCovered && (
                      <span className="px-1.5 py-0.5 bg-purple-900/30 text-purple-400 text-[10px] rounded border border-purple-900/50">精神科</span>
                    )}
                  </div>

                  {/* Actions */}
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
              );
            })}
          </div>
        )}

        {/* === LOANS TAB === */}
        {activeTab === 'LOANS' && (
          <div className="space-y-4">
            {/* 信用分概览 */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex justify-between items-center mb-6">
               <div>
                  <div className="text-xs text-gray-500 uppercase">Credit Score</div>
                  <div className={`text-2xl font-black ${
                      vitality.metrics.creditScore >= 700 ? 'text-green-500' : 
                      vitality.metrics.creditScore >= 500 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {vitality.metrics.creditScore}
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase">Total Debt</div>
                  <div className="text-xl font-bold text-red-400">
                    ${bank.activeLoans.reduce((sum, l) => sum + l.principal + l.interest, 0).toLocaleString()}
                  </div>
               </div>
            </div>

            {/* 贷款列表 */}
            {bank.activeLoans.length === 0 ? (
                <div className="text-center text-gray-500 py-10 border border-dashed border-gray-800 rounded-lg">
                   <Check className="mx-auto mb-2 opacity-50" />
                   <div>无活跃贷款</div>
                   <div className="text-xs opacity-50 mt-1">您当前的财务状况良好</div>
                </div>
            ) : (
                bank.activeLoans.map(loan => {
                    const totalDue = loan.principal + loan.interest;
                    const isOverdue = loan.overdueTurns > 0;

                    return (
                        <div key={loan.id} className={`p-4 bg-gray-900 border rounded-lg transition-all ${isOverdue ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-gray-700'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-amber-500 block">{loan.productId}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{loan.id.toUpperCase()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 block">利率</span>
                                    <span className="font-mono text-amber-300">{(loan.rate * 100).toFixed(1)}%</span>
                                </div>
                            </div>

                            {/* 逾期警告 */}
                            {isOverdue && (
                                <div className="mb-3 px-2 py-1 bg-red-900/20 text-red-400 text-xs flex items-center gap-2 rounded border border-red-900/30">
                                    <AlertTriangle size={12} />
                                    <span>已逾期 {loan.overdueTurns} 周 - 信用受损中</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm mb-4 pt-2 border-t border-gray-800">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-xs">剩余本金</span>
                                    <span>${loan.principal.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-gray-500 text-xs">累积利息</span>
                                    <span className="text-red-300">${loan.interest.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            {/* 还款按钮 */}
                            <button 
                                onClick={() => handleRepay(loan)}
                                className="w-full py-2 bg-blue-900/20 border border-blue-500/30 text-blue-400 hover:bg-blue-900/40 hover:border-blue-500 transition-all rounded text-sm font-bold flex items-center justify-center gap-2 group"
                            >
                                <DollarSign size={14} className="group-hover:text-white transition-colors"/>
                                还款 (最大额)
                            </button>
                            <div className="text-center mt-1">
                                <span className="text-[10px] text-gray-600">优先偿还利息，后偿还本金</span>
                            </div>
                        </div>
                    );
                })
            )}

            {/* 提示信息 */}
            <div className="mt-6 p-3 bg-gray-900/50 rounded text-[10px] text-gray-500 leading-relaxed border border-gray-800">
                <p>💡 提示：</p>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>按时还款可提升信用评分。</li>
                    <li>逾期超过 3 周将触发暴力催收。</li>
                    <li>逾期超过 8 周将导致资产冻结或入狱。</li>
                </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};