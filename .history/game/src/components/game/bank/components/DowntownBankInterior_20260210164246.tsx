import React, { useState } from 'react';
import { LoanProduct, ActiveLoan } from '@/types/schema';
import { DowntownLedger } from './DowntownLedger';

interface Props {
  gold: number;
  products: LoanProduct[];
  activeLoans: ActiveLoan[];
  onTakeLoan: (productId: string) => void;
  onRepayLoan: (loanId: string) => void;
  onClose: () => void;
}

export const DowntownBankInterior: React.FC<Props> = ({ 
  gold, products, activeLoans, onTakeLoan, onRepayLoan, onClose 
}) => {
  const [signAnim, setSignAnim] = useState(false);

  const handleSign = (id: string) => {
    setSignAnim(true);
    setTimeout(() => {
      onTakeLoan(id);
      setSignAnim(false);
    }, 1000); // 签字动画时间
  };

  // 根据金钱数量决定金条堆的图片
  const getGoldStackImage = () => {
    if (gold > 100000) return '/assets/bank/ui_gold_large.png';
    if (gold > 10000) return '/assets/bank/ui_gold_medium.png';
    if (gold > 1000) return '/assets/bank/ui_gold_small.png';
    return null; // 穷光蛋没有金条
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
          <div className="absolute top-10 right-0 w-80 bg-black/60 backdrop-blur-md border border-[#d4af37]/30 p-6 rounded-sm">
             <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-4">Liabilities</h3>
             
             {activeLoans.length === 0 ? (
               <div className="text-[#d4af37] text-sm italic">Clean Balance Sheet</div>
             ) : (
               <div className="space-y-4">
                 {activeLoans.map(loan => (
                   <div key={loan.id} className="flex justify-between items-center border-b border-white/10 pb-2">
                     <div>
                       <div className="text-white font-serif">{loan.productId}</div>
                       <div className="text-[10px] text-gray-500">Due: {loan.daysRemaining} days</div>
                     </div>
                     <div className="text-right">
                       <div className="text-[#d4af37] font-bold font-mono">${loan.amountRemaining.toLocaleString()}</div>
                       <button 
                         onClick={() => onRepayLoan(loan.id)}
                         disabled={gold < loan.amountRemaining}
                         className="text-[10px] text-gray-400 hover:text-white underline mt-1 disabled:opacity-30"
                       >
                         LIQUIDATE
                       </button>
                     </div>
                   </div>
                 ))}
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