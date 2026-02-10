import React, { useState } from 'react';
import { LoanProduct, ActiveLoan } from '@/types/schema';
import { SlumsLoanPaper } from './SlumsLoanPaper';

interface Props {
  gold: number;
  products: LoanProduct[]; // 可申请的贷款
  activeLoans: ActiveLoan[]; // 已有的贷款
  onTakeLoan: (productId: string) => void;
  onRepayLoan: (loanId: string) => void;
  onClose: () => void;
}

export const SlumsBankInterior: React.FC<Props> = ({ 
  gold, products, activeLoans, onTakeLoan, onRepayLoan, onClose 
}) => {
  const [transactionAnim, setTransactionAnim] = useState<'NONE' | 'TAKE' | 'GIVE'>('NONE');

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
              canAfford={true} // 贫民窟默认都有资格，或者按剧情解锁
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
            activeLoans.map(loan => (
              <div key={loan.id} className="bg-white p-3 rotate-1 w-full max-w-[200px] shadow-lg border border-gray-300 relative group">
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full" />
                <div className="text-xs font-bold text-gray-800">DUE: ${loan.amountRemaining}</div>
                <div className="text-[10px] text-red-600 font-bold">
                  {loan.daysOverdue > 0 ? `OVERDUE ${loan.daysOverdue} DAYS!` : `${loan.daysRemaining} days left`}
                </div>
                <button 
                  onClick={() => handleRepay(loan.id)}
                  disabled={gold < loan.amountRemaining}
                  className="mt-2 w-full bg-green-700 hover:bg-green-600 text-white text-[10px] font-bold py-1 disabled:opacity-50 disabled:bg-gray-500"
                >
                  PAY OFF
                </button>
              </div>
            ))
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