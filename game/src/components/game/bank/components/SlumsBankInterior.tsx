import React, { useState } from 'react';
import { LoanProduct, ActiveLoan } from '@/types/schema';
import { SlumsLoanPaper } from './SlumsLoanPaper';

interface Props {
  gold: number;
  products: LoanProduct[];
  activeLoans: ActiveLoan[];
  currentTurn: number;
  onTakeLoan: (productId: string) => void;
  onRepayLoan: (loanId: string) => void;
  onMakeInstallment: (loanId: string, amount: number) => { success: boolean; message: string; };
  onClose: () => void;
}

export const SlumsBankInterior: React.FC<Props> = ({ 
  gold, products, activeLoans, currentTurn, onTakeLoan, onRepayLoan, onMakeInstallment, onClose 
}) => {
  const [transactionAnim, setTransactionAnim] = useState<'NONE' | 'TAKE' | 'GIVE'>('NONE');
  const [repayAmount, setRepayAmount] = useState<Record<string, number>>({});

  const handleTake = (id: string) => {
    setTransactionAnim('TAKE');
    setTimeout(() => {
      onTakeLoan(id);
      setTransactionAnim('NONE');
    }, 1000);
  };

  const handleRepay = (id: string) => {
    setTransactionAnim('GIVE');
    setTimeout(() => {
      onRepayLoan(id);
      setTransactionAnim('NONE');
    }, 1000);
  };

  // 获取贷款状态
  const getLoanStatus = (loan: ActiveLoan) => {
    const weeksLeft = loan.dueTurn - currentTurn;
    const isOverdue = weeksLeft < 0;
    const overdueWeeks = isOverdue ? Math.abs(weeksLeft) : 0;
    
    if (isOverdue) {
      if (overdueWeeks <= 1) return { label: `逾期 ${overdueWeeks} 周`, color: 'text-yellow-500', bgColor: 'bg-yellow-900', borderColor: 'border-yellow-600' };
      if (overdueWeeks <= 3) return { label: '暴力催收中', color: 'text-orange-500', bgColor: 'bg-orange-900', borderColor: 'border-orange-600' };
      return { label: '强制划扣风险', color: 'text-red-500', bgColor: 'bg-red-900', borderColor: 'border-red-600' };
    }
    if (weeksLeft <= 2) return { label: `${weeksLeft} 周后到期`, color: 'text-amber-500', bgColor: 'bg-amber-900', borderColor: 'border-amber-600' };
    return { label: `${weeksLeft} 周后到期`, color: 'text-gray-400', bgColor: 'bg-gray-800', borderColor: 'border-gray-600' };
  };

  // 获取逾期警告文本
  const getSkipWarning = (loan: ActiveLoan) => {
    const weeksLeft = loan.dueTurn - currentTurn;
    const isOverdue = weeksLeft < 0;
    const overdueWeeks = isOverdue ? Math.abs(weeksLeft) : 0;
    
    if (!isOverdue) {
      if (weeksLeft === 0) return '⚠️ 今天到期！';
      if (weeksLeft <= 2) return `⚠️ 还剩 ${weeksLeft} 周`;
      return null;
    }
    
    if (overdueWeeks >= 8) return '🔴 弟兄们正在找你...';
    if (overdueWeeks >= 4) return '🟠 老板很不高兴！';
    if (overdueWeeks >= 2) return '🟠 有人要挨揍了！';
    return '🟡 别躲了，出来谈谈';
  };

  // 处理部分还款
  const handlePartialRepay = (loan: ActiveLoan) => {
    const amount = repayAmount[loan.id] || 0;
    if (amount <= 0) return;
    setTransactionAnim('GIVE');
    setTimeout(() => {
      const result = onMakeInstallment(loan.id, amount);
      if (result.success) {
        setRepayAmount(prev => ({ ...prev, [loan.id]: 0 }));
      }
      setTransactionAnim('NONE');
    }, 800);
  };

  // 计算总欠款
  const getTotalOwed = (loan: ActiveLoan) => loan.principal + loan.interest;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-black overflow-hidden">
      
      {/* 1. 背景：防弹玻璃柜台 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/bank/slums_bank_interior.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-yellow-900/10" />
      </div>

      {/* 2. 店员剪影 (模糊且有威胁感) */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-64 h-64 bg-black/80 blur-xl rounded-full opacity-80 animate-pulse-slow" />

      {/* 3. 防弹玻璃层 (前景) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* 玻璃划痕 */}
        <div className="absolute inset-0 bg-[url('/assets/fx/scratched_glass.png')] opacity-30 mix-blend-screen" />
        {/* 贴纸 */}
        <div className="absolute top-10 right-20 rotate-12 bg-red-600 text-white font-bold p-2 text-xs border border-white">
          NO REFUNDS
        </div>
      </div>

      {/* 4. 交易槽 (Tray) - 核心交互区 */}
      <div className="absolute bottom-0 w-full h-1/3 bg-[#2a2a2a] border-t-8 border-[#1a1a1a] shadow-inner flex items-center justify-center z-20">
        
        {/* 交易动画区域 */}
        <div className="relative w-96 h-32 bg-[#111] rounded-lg border-4 border-[#333] shadow-[inset_0_0_20px_black] overflow-hidden flex items-center justify-center">
          
          {transactionAnim === 'NONE' && (
            <div className="text-gray-600 font-mono text-xs animate-pulse">
              INSERT CASH OR CONTRACT
            </div>
          )}

          {/* 拿钱动画 */}
          {transactionAnim === 'TAKE' && (
            <div className="animate-slide-in-down">
              <img src="/assets/bank/ui_money_roll.png" className="w-32 drop-shadow-xl" />
            </div>
          )}

          {/* 还钱动画 */}
          {transactionAnim === 'GIVE' && (
            <div className="animate-slide-out-up">
              <img src="/assets/bank/ui_money_stack.png" className="w-32 drop-shadow-xl" />
            </div>
          )}
        </div>
      </div>

      {/* 5. 左右侧面板：贷款选项与还款选项 */}
      <div className="absolute inset-0 z-30 flex justify-between p-12 pointer-events-none">
        
        {/* 左侧：申请贷款 (墙上的广告) */}
        <div className="w-1/3 pointer-events-auto flex flex-col gap-4 overflow-y-auto custom-scrollbar max-h-[60%]">
          <h3 className="text-yellow-500 font-black uppercase text-shadow-black mb-2">Need Cash?</h3>
          {products.map(product => (
            <SlumsLoanPaper
              key={product.id}
              product={product}
              canAfford={true}
              onSign={() => handleTake(product.id)}
            />
          ))}
        </div>

        {/* 右侧：还款 (手中的欠条) */}
        <div className="w-1/3 pointer-events-auto flex flex-col gap-4 items-end overflow-y-auto custom-scrollbar max-h-[60%]">
          <h3 className="text-red-500 font-black uppercase text-shadow-black mb-2">You Owe Us</h3>
          
          {activeLoans.length === 0 ? (
            <div className="text-gray-500 text-xs font-mono bg-black/50 p-2">No debts... yet.</div>
          ) : (
            activeLoans.map(loan => {
              const status = getLoanStatus(loan);
              const warning = getSkipWarning(loan);
              const totalOwed = getTotalOwed(loan);
              return (
                <div key={loan.id} className={`${status.bgColor} border ${status.borderColor} p-3 w-full max-w-[240px] shadow-lg relative group rotate-1 hover:rotate-0 transition-transform`}>
                  {/* 钉子效果 */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full" />
                  
                  {/* 头部：金额和状态 */}
                  <div className="flex justify-between items-start mb-1">
                    <div className={`text-xs font-bold ${status.color}`}>{status.label}</div>
                    <div className="text-xs font-bold text-white">${totalOwed.toLocaleString()}</div>
                  </div>
                  
                  {/* 本金利息明细 */}
                  <div className="text-[10px] text-gray-400 mb-2">
                    本金: ${loan.principal.toLocaleString()} | 利息: ${loan.interest.toLocaleString()}
                  </div>
                  
                  {/* 警告提示 */}
                  {warning && (
                    <div className="text-[10px] text-red-400 mb-2 bg-black/40 p-1">
                      {warning}
                    </div>
                  )}
                  
                  {/* 部分还款输入 */}
                  <div className="flex gap-1 mb-2">
                    <input
                      type="number"
                      value={repayAmount[loan.id] || ''}
                      onChange={(e) => setRepayAmount(prev => ({ ...prev, [loan.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      placeholder="金额"
                      className="flex-1 bg-black/50 border border-gray-600 text-white text-xs px-2 py-1 focus:outline-none focus:border-yellow-500"
                    />
                    <button
                      onClick={() => setRepayAmount(prev => ({ ...prev, [loan.id]: Math.min(gold, totalOwed) }))}
                      className="text-[10px] text-yellow-500 hover:text-white underline px-1"
                    >
                      MAX
                    </button>
                  </div>
                  
                  {/* 还款按钮 */}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handlePartialRepay(loan)}
                      disabled={gold < (repayAmount[loan.id] || 0) || (repayAmount[loan.id] || 0) <= 0}
                      className="flex-1 bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 disabled:bg-gray-600 text-white text-[10px] font-bold py-1"
                    >
                      还部分
                    </button>
                    <button 
                      onClick={() => handleRepay(loan.id)}
                      disabled={gold < totalOwed}
                      className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-600 text-white text-[10px] font-bold py-1"
                    >
                      全还清
                    </button>
                  </div>
                  
                  {/* 暂不还款选项 - 逾期时显示 */}
                  {(loan.dueTurn - currentTurn) < 0 && (
                    <button 
                      onClick={onClose}
                      className="mt-2 w-full bg-red-900/50 hover:bg-red-800/50 text-red-400 text-[10px] py-1 border border-red-700"
                    >
                      暂时不还 (逃跑)
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-4 right-8 text-gray-400 hover:text-white text-xs font-mono z-50 pointer-events-auto"
      >
        [ LEAVE SHOP ]
      </button>

    </div>
  );
};
