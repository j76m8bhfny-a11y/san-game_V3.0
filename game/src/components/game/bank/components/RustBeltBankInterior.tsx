import React, { useState } from 'react';
import { LoanProduct, ActiveLoan } from '@/types/schema';
import { RustBeltLoanClipboard } from './RustBeltLoanClipboard';
import { useBankUI } from '../hooks/useBankUI';
import { useI18n } from '@/i18n';

interface Props {
  gold: number;
  creditScore: number;
  products: LoanProduct[];
  activeLoans: ActiveLoan[];
  currentTurn: number;
  onTakeLoan: (productId: string) => void;
  onRepayLoan: (loanId: string) => void;
  onMakeInstallment: (loanId: string, amount: number) => { success: boolean; message: string; };
  onClose: () => void;
}

export const RustBeltBankInterior: React.FC<Props> = ({ 
  gold, creditScore, products, activeLoans, currentTurn, onTakeLoan, onRepayLoan, onMakeInstallment, onClose 
}) => {
  const { t } = useI18n();
  const [stampAnim, setStampAnim] = useState(false);
  const [cashAnim, setCashAnim] = useState(false);
  const { 
    getLoanStatus, 
    getSkipWarning, 
    getTotalOwed, 
    repayAmount, 
    setRepayAmount, 
    handlePartialRepay 
  } = useBankUI();

  const handleSign = (id: string) => {
    setStampAnim(true);
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

  const onPartialRepay = (loan: ActiveLoan) => {
    const amount = repayAmount[loan.id] || 0;
    if (amount <= 0) return;
    setCashAnim(true);
    setTimeout(() => {
      handlePartialRepay(loan, amount, onMakeInstallment);
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
      <div className="absolute bottom-0 w-full h-1/2 bg-black/5 pointer-events-none z-10" />

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
                creditScore={creditScore}
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

          <div className="w-full backdrop-solid-light border-4 border-gray-300 p-4 rounded-sm shadow-pixel-sm h-[60%] overflow-y-auto custom-scrollbar relative">
             <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-300 pb-1">
               {t('bank.outstandingDebts')}
             </h3>
             
             {activeLoans.length === 0 ? (
               <div className="text-center text-gray-400 mt-10 text-sm">{t('bank.noActiveDebts')}</div>
             ) : (
               <div className="space-y-3">
                 {activeLoans.map(loan => {
                   const status = getLoanStatus(loan, currentTurn);
                   const warning = getSkipWarning(loan, currentTurn);
                   const totalOwed = getTotalOwed(loan);
                   return (
                     <div key={loan.id} className={`${status.bgColor} border ${status.borderColor} p-3 shadow-sm relative`}>
                       {/* 头部：产品名称、状态和金额 */}
                       <div className="flex justify-between font-mono text-sm font-bold text-gray-800">
                         <span>{loan.productId}</span>
                         <span>${totalOwed.toLocaleString()}</span>
                       </div>
                       
                       {/* 状态标签 */}
                       <div className={`text-[10px] ${status.color} mt-1 font-bold`}>
                         {status.label}
                       </div>
                       
                       {/* 本金利息明细 */}
                       <div className="text-[10px] text-gray-500 mt-1">
                         {t('bank.principal')}: ${loan.principal.toLocaleString()} | {t('bank.interest')}: ${loan.interest.toLocaleString()}
                       </div>
                       
                       {/* 警告提示 */}
                       {warning && (
                         <div className="text-[10px] text-red-600 mt-2 bg-red-50 p-1.5 border border-red-200">
                           {warning}
                         </div>
                       )}
                       
                       {/* 部分还款输入 */}
                       <div className="flex gap-2 mt-2">
                         <input
                           type="number"
                           value={repayAmount[loan.id] || ''}
                           onChange={(e) => setRepayAmount(prev => ({ ...prev, [loan.id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                           placeholder={t('bank.loan.amount')}
                           className="flex-1 bg-white border border-gray-300 text-gray-800 text-xs px-2 py-1 focus:outline-none focus:border-blue-500 font-mono"
                         />
                         <button
                           onClick={() => setRepayAmount(prev => ({ ...prev, [loan.id]: Math.min(gold, totalOwed) }))}
                           className="text-[10px] text-blue-600 hover:text-blue-800 underline font-bold px-1"
                         >
                           {t('common.max')}
                         </button>
                       </div>
                       
                       {/* 还款按钮 */}
                       <div className="flex gap-2 mt-2">
                         <button
                           onClick={() => onPartialRepay(loan)}
                           disabled={gold < (repayAmount[loan.id] || 0) || (repayAmount[loan.id] || 0) <= 0}
                           className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-400 text-white text-[10px] font-bold py-1 uppercase"
                         >
                           {t('bank.repayPartial')}
                         </button>
                         <button
                           onClick={() => handleRepay(loan.id)}
                           disabled={gold < totalOwed}
                           className="flex-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-400 text-white text-[10px] font-bold py-1 uppercase"
                         >
                           {t('bank.repayFull')}
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
             
             {/* 现金放入动画 */}
             {cashAnim && (
               <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50">
                 <img src="/assets/bank/ui_money_hand.png" className="w-32 animate-slide-out-up render-pixelated" />
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
          {t('bank.wallet')}: <span className="text-green-400">${gold}</span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xs font-bold uppercase"
        >
          {t('common.close')}
        </button>
      </div>

    </div>
  );
};
