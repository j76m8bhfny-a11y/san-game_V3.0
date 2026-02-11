import React, { useState } from 'react';
import { LoanProduct, ActiveLoan } from '@/types/schema';
import { DowntownLedger } from './DowntownLedger';
import { useBankUI } from '../hooks/useBankUI';

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

export const DowntownBankInterior: React.FC<Props> = ({ 
  gold, creditScore, products, activeLoans, currentTurn, onTakeLoan, onRepayLoan, onMakeInstallment, onClose 
}) => {
  const [signAnim, setSignAnim] = useState(false);
  const { 
    getLoanStatus, 
    getSkipWarning, 
    getTotalOwed, 
    repayAmount, 
    setRepayAmount, 
    handlePartialRepay 
  } = useBankUI();

  const handleSign = (id: string) => {
    setSignAnim(true);
    setTimeout(() => {
      onTakeLoan(id);
      setSignAnim(false);
    }, 1000);
  };

  // 根据金钱数量决定金条堆的图片
  const getGoldStackImage = () => {
    if (gold > 100000) return '/assets/bank/ui_gold_large.png';
    if (gold > 10000) return '/assets/bank/ui_gold_medium.png';
    if (gold > 1000) return '/assets/bank/ui_gold_small.png';
    return null;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none bg-[#0a0a0a] overflow-hidden">
      
      {/* 1. 背景：私人金库 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/bank/downtown_bank_interior.jpg')" }}
      >
        {/* 动态光照：金条的反光 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#d4af37]/5 blur-3xl animate-pulse-slow" />
      </div>

      {/* 2. 桌面层 */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent z-10" />
      
      <div className="relative z-20 w-full max-w-6xl h-full flex pt-10 px-8 gap-12">
        
        {/* 左侧：资产负债表 (贷款) */}
        <div className="w-1/2 flex flex-col h-[80%] self-center">
          <h2 className="text-[#d4af37] font-serif text-2xl italic mb-6 border-b border-[#d4af37]/30 pb-2">
            The Ledger
          </h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
            {products.map(product => (
              <DowntownLedger
                key={product.id}
                product={product}
                creditScore={creditScore}
                onSign={() => handleSign(product.id)}
              />
            ))}
          </div>
        </div>

        {/* 右侧：资产堆积 (视觉反馈) & 债务管理 */}
        <div className="w-1/2 flex flex-col h-full relative">
          
          {/* 金条/现金堆 (Visual Wealth) */}
          <div className="absolute bottom-10 right-0 w-full h-1/2 flex items-end justify-end pointer-events-none">
             {getGoldStackImage() && (
               <img src={getGoldStackImage()!} className="max-w-full max-h-full object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-float-slow" />
             )}
          </div>

          {/* 债务清单 (悬浮在金条上方) */}
          <div className="absolute top-10 right-0 w-96 bg-black/70 backdrop-blur-md border border-[#d4af37]/30 p-6 rounded-sm max-h-[70%] overflow-y-auto custom-scrollbar">
             <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-4">Liabilities</h3>
             
             {activeLoans.length === 0 ? (
               <div className="text-[#d4af37] text-sm italic">Clean Balance Sheet</div>
             ) : (
               <div className="space-y-4">
                 {activeLoans.map(loan => {
                   const status = getLoanStatus(loan, currentTurn);
                   const warning = getSkipWarning(loan, currentTurn);
                   const totalOwed = getTotalOwed(loan);
                   return (
                     <div key={loan.id} className={`border ${status.borderColor} ${status.bgColor} p-3 rounded`}>
                       {/* 头部：产品名称和状态 */}
                       <div className="flex justify-between items-start mb-2">
                         <div>
                           <div className="text-white font-serif">{loan.productId}</div>
                           <div className={`text-xs ${status.color} font-mono`}>{status.label}</div>
                         </div>
                         <div className="text-right">
                           <div className="text-[#d4af37] font-bold font-mono">${totalOwed.toLocaleString()}</div>
                           <div className="text-[10px] text-gray-500">
                             本金: ${loan.principal.toLocaleString()} | 利息: ${loan.interest.toLocaleString()}
                           </div>
                         </div>
                       </div>
                       
                       {/* 警告提示 */}
                       {warning && (
                         <div className="text-[10px] text-red-400 mb-2 bg-red-900/20 p-1.5 rounded">
                           {warning}
                         </div>
                       )}
                       
                       {/* 部分还款输入 */}
                       <div className="flex gap-2 mb-2">
                         <input
                           type="number"
                           value={repayAmount[loan.id] || ''}
                           onChange={(e) => setRepayAmount(prev => ({ ...prev, [loan.id]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                           placeholder="还款金额"
                           className="flex-1 bg-black/50 border border-[#d4af37]/30 text-white text-xs px-2 py-1.5 rounded focus:outline-none focus:border-[#d4af37]"
                         />
                         <button
                           onClick={() => setRepayAmount(prev => ({ ...prev, [loan.id]: Math.min(gold, totalOwed) }))}
                           className="text-[10px] text-[#d4af37] hover:text-white underline whitespace-nowrap"
                         >
                           全额
                         </button>
                       </div>
                       
                       {/* 还款按钮 */}
                       <div className="flex gap-2">
                         <button 
                           onClick={() => handlePartialRepay(loan, repayAmount[loan.id] || 0, onMakeInstallment)}
                           disabled={gold < (repayAmount[loan.id] || 0) || (repayAmount[loan.id] || 0) <= 0}
                           className="flex-1 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 disabled:opacity-30 disabled:cursor-not-allowed text-[#d4af37] text-xs font-mono py-1.5 rounded border border-[#d4af37]/50"
                         >
                           还款
                         </button>
                         <button 
                           onClick={() => onRepayLoan(loan.id)}
                           disabled={gold < totalOwed}
                           className="flex-1 bg-[#d4af37] hover:bg-[#c4a030] disabled:opacity-30 disabled:cursor-not-allowed text-black text-xs font-bold py-1.5 rounded"
                         >
                           全额结清
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>

        </div>
      </div>

      {/* 3. 签字动画层 */}
      {signAnim && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-[2px]">
          <div className="text-6xl font-handwriting text-[#d4af37] animate-signature">
            Approved.
          </div>
        </div>
      )}

      {/* 4. 底部信息 */}
      <div className="absolute bottom-6 left-8 text-[#d4af37] font-mono text-xs z-30 opacity-70">
        NET WORTH: ${(gold * 1.5).toLocaleString()} (EST.)
      </div>
      
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-gray-600 hover:text-[#d4af37] text-xs font-serif italic z-50"
      >
        Close Vault
      </button>

    </div>
  );
};
