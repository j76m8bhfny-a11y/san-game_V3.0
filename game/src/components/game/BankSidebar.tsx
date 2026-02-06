import React, { useState } from 'react'; 
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Insurance, ActiveInsuranceState, ActiveLoan } from '@/types/schema';
import { Landmark, Shield, AlertTriangle, Check, ChevronRight, Clock, Skull } from 'lucide-react';
// ✅ 引入规则配置，替代硬编码
import bankRules from '@/assets/data/rules/bankRules.json';

// 格式化金额显示（千分位）
const formatGold = (amount: number) => `$${amount.toLocaleString()}`;

// 获取贷款状态配置
const getLoanStatus = (loan: ActiveLoan, currentTurn: number) => {
  const weeksLeft = loan.dueTurn - currentTurn;
  const isOverdue = weeksLeft < 0;
  const overdueWeeks = isOverdue ? Math.abs(weeksLeft) : 0;
  
  if (isOverdue) {
    // 逾期阶段判断
    const { collection, mortgage } = bankRules;
    if (loan.isMortgage && overdueWeeks >= mortgage.foreclosureTurns) {
      return { 
        label: '即将收房', 
        color: 'text-red-500', 
        bgColor: 'bg-red-900/20', 
        borderColor: 'border-red-500/50',
        icon: Skull 
      };
    }
    if (overdueWeeks <= collection.warning.turn) {
      return { 
        label: `逾期 ${overdueWeeks} 周`, 
        color: 'text-yellow-500', 
        bgColor: 'bg-yellow-900/20', 
        borderColor: 'border-yellow-500/50',
        icon: AlertTriangle 
      };
    }
    if (overdueWeeks <= collection.violence.maxTurn) {
      return { 
        label: `暴力催收中`, 
        color: 'text-orange-500', 
        bgColor: 'bg-orange-900/20', 
        borderColor: 'border-orange-500/50',
        icon: AlertTriangle 
      };
    }
    return { 
      label: `强制划扣风险`, 
      color: 'text-red-500', 
      bgColor: 'bg-red-900/20', 
      borderColor: 'border-red-500/50',
      icon: Skull 
    };
  }
  
  // 未逾期
  if (weeksLeft <= 2) {
    return { 
      label: `${weeksLeft} 周后到期`, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-900/10', 
      borderColor: 'border-amber-500/30',
      icon: Clock 
    };
  }
  return { 
    label: `${weeksLeft} 周后到期`, 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-900', 
    borderColor: 'border-gray-700',
    icon: Clock 
  };
};

// 获取暂不还款的警告提示
const getSkipWarning = (loan: ActiveLoan, currentTurn: number) => {
  const weeksLeft = loan.dueTurn - currentTurn;
  const isOverdue = weeksLeft < 0;
  const overdueWeeks = isOverdue ? Math.abs(weeksLeft) : 0;
  const { collection, mortgage } = bankRules;
  
  if (loan.isMortgage) {
    const weeksToForeclosure = mortgage.foreclosureTurns - overdueWeeks;
    if (weeksToForeclosure > 0) {
      return `⚠️ 房贷逾期中！${weeksToForeclosure}周后将强制收房，阶级跌落为流浪汉！`;
    }
    return '❌ 房屋即将被法拍！立即结清或失去房产！';
  }
  
  if (!isOverdue) {
    return `⚠️ 跳过还款将进入逾期状态，每周将产生复利利息，信用分下降${collection.warning.scorePenalty}分`;
  }
  
  if (overdueWeeks <= collection.warning.turn) {
    return `⚠️ 警告阶段：信用分-${collection.warning.scorePenalty}分。下阶段将遭遇暴力催收（扣HP/SAN）`;
  }
  if (overdueWeeks <= collection.violence.maxTurn) {
    return `❌ 暴力催收中！每回合扣${collection.violence.hpDamage}HP/${collection.violence.sanDamage}SAN，信用分-${collection.violence.scorePenalty}分`;
  }
  if (overdueWeeks <= collection.seizure.maxTurn) {
    return `❌ 强制划扣阶段！银行将直接扣除你最多$${collection.seizure.limit.toLocaleString()}金币！`;
  }
  return `❌ 即将入狱！${collection.jail.sentenceTurns}周刑期，信用分-${collection.jail.scorePenalty}分！`;
};

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
    addTransaction,
  } = useGameStore();

  const { playSfx } = useAudioStore();
  const [activeTab, setActiveTab] = useState<Tab>('LOANS');
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null);
  const [processingInsuranceId, setProcessingInsuranceId] = useState<string | null>(null);
  const [skipLoan, setSkipLoan] = useState<{ id: string; message: string } | null>(null);

  const insurances = gameDataCache?.insurance || [];
  const currentClass = vitality?.identity?.currentClass ?? 'HOMELESS';
  const currentTurn = vitality?.time?.currentTurn ?? 1;
  const currentGold = vitality?.metrics?.gold ?? 0;

  const handleSignInsurance = async (plan: Insurance) => {
    // 防止重复点击
    if (processingInsuranceId === plan.id) return;
    
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

    // 检查金币是否足够支付首期保费
    if (currentGold < plan.weeklyCost) {
      playSfx('sfx_deny');
      addNotification(`资金不足，签约 ${plan.name} 需要首期保费 ${formatGold(plan.weeklyCost)}`, "error");
      return;
    }

    setProcessingInsuranceId(plan.id);

    try {
      // 扣除首期保费
      addTransaction('MEDICAL', -plan.weeklyCost, `保险首期: ${plan.name}`);

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
    } finally {
      setProcessingInsuranceId(null);
    }
  };

  const handleSkipRepay = (loan: ActiveLoan, warningMessage: string) => {
    playSfx('sfx_glitch');
    setSkipLoan({ id: loan.id, message: warningMessage });
  };

  const handleRepay = async (loan: ActiveLoan) => {
    // 防止重复点击
    if (processingLoanId === loan.id) return;
    
    const totalDebt = loan.principal + loan.interest;
    
    // 必须有足够金币才能全额还款
    if (currentGold < totalDebt) {
      playSfx('sfx_deny');
      addNotification(`资金不足，需要 ${formatGold(totalDebt)} 才能结清贷款`, "error");
      return;
    }

    // 二次确认
    if (!confirm(`确认结清贷款 ${loan.productId}？
需支付: ${formatGold(totalDebt)}
(本金 ${formatGold(loan.principal)} + 利息 ${formatGold(loan.interest)})`)) {
      return;
    }

    setProcessingLoanId(loan.id);

    try {
      const result = makeInstallment(loan.id, totalDebt);

      if (result.success) {
        playSfx('sfx_cash'); 
        addNotification(result.message, "success");
      } else {
        playSfx('sfx_deny');
        addNotification(result.message, "error");
      }
    } finally {
      setProcessingLoanId(null);
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

      {/* Skip Repay Modal */}
      {skipLoan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSkipLoan(null)} />
          <div className="relative bg-gray-900 border border-yellow-600/50 rounded-lg p-6 max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-yellow-500" size={24} />
              <h3 className="text-lg font-bold text-white">已跳过本期还款</h3>
            </div>
            <div className="text-sm text-gray-300 mb-4 space-y-2">
              <p className="text-yellow-500/80">{skipLoan.message}</p>
              <div className="border-t border-gray-700 pt-2 mt-2">
                <p className="text-xs text-gray-500">本期未还款将导致：</p>
                <ul className="text-xs text-gray-400 mt-1 space-y-1 list-disc list-inside">
                  <li>利息继续累积（复利计算）</li>
                  <li>逾期周数 +1</li>
                  <li>信用分下降</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setSkipLoan(null)}
              className="w-full py-2 bg-yellow-600/20 border border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/30 rounded transition-colors"
            >
              知道了
            </button>
          </div>
        </div>
      )}

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
                  {(() => {
                    const weeksLeft = activeInsurance.renewalTurn - currentTurn;
                    const isExpired = weeksLeft <= 0;
                    return (
                      <div className={`text-xs mt-1 ${isExpired ? 'text-red-400 font-bold' : 'text-emerald-300/70'}`}>
                        {isExpired ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} /> 保险已过期！请立即续约
                          </span>
                        ) : weeksLeft <= 2 ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Clock size={12} /> 即将过期：剩余 {weeksLeft} 周
                          </span>
                        ) : (
                          <>续费倒计时: {weeksLeft} 周</>
                        )}
                      </div>
                    );
                  })()}
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-1 bg-black/40 rounded text-[10px] text-gray-400">
                      自付比例: {(activeInsurance.coverage.copayModifier * 100).toFixed(0)}%
                    </span>
                    <span className="px-2 py-1 bg-black/40 rounded text-[10px] text-gray-400">
                      周费: {formatGold(activeInsurance.premium)}
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
                const isLocked = !plan.allowedClasses?.includes(currentClass);

                return (
                  <div key={plan.id} className={`relative group border transition-all duration-300 ${
                    isCurrent ? 'border-emerald-500 bg-emerald-900/5' : 
                    isLocked ? 'border-gray-800 bg-gray-900/50 opacity-50' : 
                    'border-gray-700 bg-gray-900 hover:border-gray-500'
                  }`}>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-lg font-bold text-white">{plan.name}</div>
                        <div className="text-emerald-400 font-mono font-bold">{formatGold(plan.weeklyCost)}<span className="text-xs text-gray-500">/W</span></div>
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
                          disabled={processingInsuranceId === plan.id}
                          className="w-full py-3 bg-white/5 hover:bg-white/10 border-t border-white/5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingInsuranceId === plan.id ? (
                            <>处理中...</>
                          ) : (
                            <>签约此计划 <ChevronRight size={14} /></>
                          )}
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
             {bank?.activeLoans?.length === 0 ? (
                <div className="text-center text-gray-500 py-10">无活跃贷款</div>
            ) : (
                bank.activeLoans.map(loan => {
                    const totalDebt = loan.principal + loan.interest;
                    const canClear = currentGold >= totalDebt;
                    const status = getLoanStatus(loan, currentTurn);
                    const skipWarning = getSkipWarning(loan, currentTurn);
                    const StatusIcon = status.icon;
                    
                    return (
                        <div key={loan.id} className={`p-4 border rounded-lg ${status.bgColor} ${status.borderColor}`}>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-amber-500">{loan.productId}</span>
                                    {loan.isMortgage && (
                                        <span className="ml-2 px-2 py-0.5 bg-purple-900/30 text-purple-400 text-[10px] rounded">房贷</span>
                                    )}
                                </div>
                                <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                                    <StatusIcon size={12} />
                                    {status.label}
                                </div>
                            </div>
                            
                            {/* 利率 */}
                            <div className="text-xs text-gray-500 mb-2">利率: {(loan.rate * 100).toFixed(1)}%</div>
                            
                            {/* 债务详情 */}
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">本金: <span className="text-white">{formatGold(loan.principal)}</span></span>
                                <span className="text-gray-400">利息: <span className="text-red-400">{formatGold(loan.interest)}</span></span>
                            </div>
                            
                            {/* 应还总额 */}
                            <div className="mb-3 p-2 bg-black/30 rounded text-center">
                                <span className="text-xs text-gray-500">本期应还总额</span>
                                <div className="text-lg font-bold text-white">{formatGold(totalDebt)}</div>
                            </div>
                            
                            {/* 操作按钮 */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleRepay(loan)}
                                    disabled={!canClear || processingLoanId === loan.id}
                                    className={`flex-1 py-2 border rounded transition-colors ${
                                        processingLoanId === loan.id
                                            ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-wait'
                                            : canClear 
                                                ? 'bg-blue-900/30 border-blue-500/50 text-blue-400 hover:bg-blue-900/50' 
                                                : 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    {processingLoanId === loan.id ? (
                                        '处理中...'
                                    ) : canClear ? (
                                        '结清贷款'
                                    ) : (
                                        `需 ${formatGold(totalDebt)}`
                                    )}
                                </button>
                                <button 
                                    onClick={() => handleSkipRepay(loan, skipWarning)}
                                    className="flex-1 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-yellow-400 transition-colors rounded text-xs"
                                >
                                    暂不还款
                                </button>
                            </div>
                            
                            {/* 警告提示 */}
                            <div className="mt-2 text-[10px] text-yellow-600/80 leading-tight">
                                {skipWarning}
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        )}

      </div>
    </div>
    </>
  );
};