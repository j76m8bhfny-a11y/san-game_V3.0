import React, { useState } from 'react';
import { LoanProduct, ActiveLoan } from '@/types/schema';
import { RustBeltLoanClipboard } from './RustBeltLoanClipboard';

interface Props {
  gold: number;
  products: LoanProduct[];
  activeLoans: ActiveLoan[];
  onTakeLoan: (productId: string) => void;
  onRepayLoan: (loanId: string) => void;
  onClose: () => void;
}

export const RustBeltBankInterior: React.FC<Props> = ({ 
  gold, products, activeLoans, onTakeLoan, onRepayLoan, onClose 
}) => {
  const [stampAnim, setStampAnim] = useState(false);
  const [cashAnim, setCashAnim] = useState(false);

  const handleSign = (id: string) => {
    setStampAnim(true);
    // 播放盖章动画后触发逻辑
    setTimeout(() => {
      onTakeLoan(id);
      setStampAnim(false);
    }, 600);
  };

  const handleRepay = (id: string) => {
    setCashAnim(true);
    setTimeout(() => {
      onRepayLoan(id);
      setCashAnim(false);
    }, 800);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-[#e5e7eb] overflow-hidden">
      
      {/* 1. 背景：柜台 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/bank/rust_bank_interior.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/20" />
      </div>

      {/* 2. 柜台玻璃隔断 */}
      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10" />

      {/* 3. 核心交互区：两个窗口 */}
      <div className="relative z-20 w-full max-w-5xl h-full flex pt-20 px-10 gap-20">
        
        {/* 左侧：申请区 (Forms) */}
        <div className="flex-1 flex flex-col">
          <div className="bg-blue-900 text-white px-4 py-2 w-fit mb-4 shadow-md font-bold text-sm transform -rotate-1">
            LOAN APPLICATIONS
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4 pb-20">
            {products.map(product => (
              <RustBeltLoanClipboard
                key={product.id}
                product={product}
                canAfford={true} // 工人阶级通常允许申请，但额度有限
                onSign={() => handleSign(product.id)}
              />
            ))}
          </div>
        </div>

        {/* 右侧：还款区 (Teller Window) */}
        <div className="flex-1 flex flex-col items-end">
          <div className="bg-red-800 text-white px-4 py-2 w-fit mb-4 shadow-md font-bold text-sm transform rotate-1">
            PAYMENTS & TELLER
          </div>

          <div className="w-full bg-white/80 backdrop-blur-sm border-4 border-gray-300 p-4 rounded-lg shadow-xl h-[60%] overflow-y-auto custom-scrollbar relative">
             <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-300 pb-1">
               Outstanding Debts
             </h3>
             
             {activeLoans.length === 0 ? (
               <div className="text-center text-gray-400 mt-10 text-sm">No active debts.</div>
             ) : (
               <div className="space-y-3">
                 {activeLoans.map(loan => (
                   <div key={loan.id} className="bg-yellow-50 border border-yellow-200 p-3 shadow-sm relative">
                     <div className="flex justify-between font-mono text-sm font-bold text-gray-800">
                       <span>{loan.productId}</span>
                       <span>${loan.amountRemaining}</span>
                     </div>
                     <div className="text-[10px] text-gray-500 mt-1">
                       {loan.daysOverdue > 0 
                         ? <span className="text-red-600 font-bold">LATE FEE APPLIED</span>
                         : `Due: ${loan.daysRemaining} days`}
                     </div>
                     <button
                       onClick={() => handleRepay(loan.id)}
                       disabled={gold < loan.amountRemaining}
                       className="mt-2 w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-400 text-white text-[10px] font-bold py-1 uppercase"
                     >
                       Pay Cash
                     </button>
                   </div>
                 ))}
               </div>
             )}
             
             {/* 现金放入动画 */}
             {cashAnim && (
               <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50">
                 <img src="/assets/bank/ui_money_hand.png" className="w-32 animate-slide-out-up" />
               </div>
             )}
          </div>
        </div>
      </div>

      {/* 4. 全局动画层 (印章) */}
      {stampAnim && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-red-600 font-black text-6xl border-8 border-red-600 px-8 py-4 transform -rotate-12 opacity-0 animate-stamp">
            APPROVED
          </div>
        </div>
      )}

      {/* 5. 底部栏 */}
      <div className="absolute bottom-0 w-full h-16 bg-[#333] border-t-4 border-gray-500 flex items-center justify-between px-8 z-30">
        <div className="text-white font-mono text-xs">
          WALLET: <span className="text-green-400">${gold}</span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xs font-bold uppercase"
        >
          Exit Lobby
        </button>
      </div>

    </div>
  );
};