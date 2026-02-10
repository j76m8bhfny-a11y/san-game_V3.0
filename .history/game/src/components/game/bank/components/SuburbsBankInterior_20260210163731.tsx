import React, { useState } from 'react';
import { LoanProduct, ActiveLoan } from '@/types/schema';
import { useAudioStore } from '@/store/useAudioStore';

interface Props {
  gold: number;
  creditScore: number;
  products: LoanProduct[];
  activeLoans: ActiveLoan[];
  onTakeLoan: (productId: string) => void;
  onRepayLoan: (loanId: string) => void;
  onClose: () => void;
}

type ScreenView = 'MENU' | 'LOANS' | 'DEBT';

export const SuburbsBankInterior: React.FC<Props> = ({ 
  gold, creditScore, products, activeLoans, onTakeLoan, onRepayLoan, onClose 
}) => {
  const [view, setView] = useState<ScreenView>('MENU');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [receiptAnim, setReceiptAnim] = useState(false);
  const { playSfx } = useAudioStore();

  // 根据信用分计算评级
  const getCreditRating = (score: number) => {
    if (score >= 750) return { label: 'EXCELLENT', color: 'text-green-400' };
    if (score >= 650) return { label: 'GOOD', color: 'text-blue-400' };
    if (score >= 550) return { label: 'FAIR', color: 'text-yellow-400' };
    return { label: 'POOR', color: 'text-red-500 animate-pulse' };
  };

  const rating = getCreditRating(creditScore);

  const handleAction = (action: () => void, isTakingLoan = false) => {
    setProcessingId('global');
    playSfx('sfx_click'); // 键盘声
    
    setTimeout(() => {
      action();
      setProcessingId(null);
      if (isTakingLoan) {
        setReceiptAnim(true);
        setTimeout(() => setReceiptAnim(false), 2000); // 收据动画时长
      }
    }, 1000); // 模拟网络延迟
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none bg-[#111] overflow-hidden">
      
      {/* 1. 背景：ATM 机外壳 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/bank/suburbs_bank_interior.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* 2. 屏幕容器 (CRT 效果) */}
      <div className="relative z-10 w-[640px] h-[480px] bg-[#004080] border-[16px] border-gray-300 rounded-lg shadow-[0_0_50px_rgba(0,100,255,0.2)] overflow-hidden">
        
        {/* CRT 扫描线与发光 */}
        <div className="absolute inset-0 bg-[url('/assets/fx/scanlines.png')] opacity-20 pointer-events-none z-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-50" />
        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] pointer-events-none z-50" />

        {/* 屏幕内容 */}
        <div className="p-8 h-full flex flex-col font-mono text-white relative">
          
          {/* Header */}
          <div className="flex justify-between items-end border-b-2 border-white/30 pb-2 mb-6">
            <div>
              <div className="text-2xl font-bold tracking-widest">CITIZEN BANK</div>
              <div className="text-xs text-blue-300">ATM TERMINAL V4.2</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-300">BALANCE</div>
              <div className="text-xl font-bold">${gold.toLocaleString()}</div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
            
            {/* Loading Overlay */}
            {processingId && (
              <div className="absolute inset-0 bg-[#004080]/90 z-40 flex flex-col items-center justify-center">
                <div className="text-green-400 font-bold text-xl animate-pulse">PROCESSING...</div>
                <div className="text-xs text-blue-300 mt-2">DO NOT REMOVE CARD</div>
              </div>
            )}

            {view === 'MENU' && (
              <div className="grid grid-cols-2 gap-6 h-full content-center">
                {/* 信用分展示 (核心) */}
                <div className="col-span-2 bg-[#002b55] border-2 border-blue-500/50 p-4 rounded flex items-center justify-between">
                  <div>
                    <div className="text-xs text-blue-300">CREDIT SCORE</div>
                    <div className={`text-4xl font-black ${rating.color}`}>{creditScore}</div>
                  </div>
                  <div className={`text-xl font-bold border-2 px-3 py-1 ${rating.color} border-current`}>
                    {rating.label}
                  </div>
                </div>

                <button 
                  onClick={() => setView('LOANS')}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-4 border-b-4 border-blue-800 active:border-0 active:translate-y-1 transition-all text-left"
                >
                  <div className="text-xs opacity-70">GET CASH</div>
                  <div className="font-bold text-lg">APPLY LOAN</div>
                </button>

                <button 
                  onClick={() => setView('DEBT')}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-4 border-b-4 border-blue-800 active:border-0 active:translate-y-1 transition-all text-left"
                >
                  <div className="text-xs opacity-70">MANAGE</div>
                  <div className="font-bold text-lg">MY DEBTS</div>
                </button>
              </div>
            )}

            {view === 'LOANS' && (
              <div className="space-y-4">
                <h3 className="text-blue-300 border-b border-blue-300/30 pb-1 mb-2">AVAILABLE OFFERS</h3>
                {products.map(p => (
                  <div key={p.id} className="bg-[#003366] p-3 border border-blue-400/30 flex justify-between items-center hover:bg-[#004080] transition-colors">
                    <div>
                      <div className="font-bold text-yellow-300">{p.name}</div>
                      <div className="text-xs text-blue-200">
                        ${p.amount.toLocaleString()} @ {(p.interestRate * 100).toFixed(1)}% / {p.termDays} Days
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Min. Score: {p.requiredCreditScore}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAction(() => onTakeLoan(p.id), true)}
                      disabled={creditScore < p.requiredCreditScore}
                      className="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 text-sm font-bold"
                    >
                      ACCEPT
                    </button>
                  </div>
                ))}
                {products.length === 0 && <div className="text-center text-gray-400 py-4">NO OFFERS AVAILABLE</div>}
              </div>
            )}

            {view === 'DEBT' && (
              <div className="space-y-4">
                <h3 className="text-blue-300 border-b border-blue-300/30 pb-1 mb-2">OUTSTANDING DEBTS</h3>
                {activeLoans.map(l => (
                  <div key={l.id} className="bg-[#003366] p-3 border border-blue-400/30">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{l.productId}</span>
                      <span className="text-red-400 font-bold">${l.amountRemaining.toLocaleString()}</span>
                    </div>
                    {l.daysOverdue > 0 ? (
                      <div className="text-xs text-red-500 font-bold bg-red-900/30 p-1 mb-2 text-center animate-pulse">
                        ⚠️ OVERDUE BY {l.daysOverdue} DAYS
                      </div>
                    ) : (
                      <div className="text-xs text-blue-200 mb-2">Due in {l.daysRemaining} days</div>
                    )}
                    <button 
                      onClick={() => handleAction(() => onRepayLoan(l.id))}
                      disabled={gold < l.amountRemaining}
                      className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white py-1 text-xs font-bold"
                    >
                      PAY OFF FULL AMOUNT
                    </button>
                  </div>
                ))}
                {activeLoans.length === 0 && <div className="text-center text-green-400 py-4">NO ACTIVE DEBTS</div>}
              </div>
            )}

          </div>

          {/* Footer Navigation */}
          <div className="mt-6 flex justify-between items-center text-xs">
            {view !== 'MENU' ? (
              <button onClick={() => setView('MENU')} className="text-yellow-400 hover:text-white flex items-center gap-1">
                &lt; BACK TO MENU
              </button>
            ) : (
              <div className="text-blue-400">SELECT SERVICE</div>
            )}
            <button onClick={onClose} className="text-red-400 hover:text-white">
              EJECT CARD [X]
            </button>
          </div>
        </div>
      </div>

      {/* 3. 打印凭条动画 (Loan Receipt) */}
      <div className={`
        absolute bottom-0 left-1/2 -translate-x-1/2 w-48 bg-white text-black p-4 font-mono text-[10px] shadow-xl transform transition-transform duration-1000 z-40
        ${receiptAnim ? 'translate-y-[-10%]' : 'translate-y-[110%]'}
      `}>
        <div className="text-center border-b border-black pb-1 mb-2">TRANSACTION RECEIPT</div>
        <div>TYPE: LOAN DISBURSEMENT</div>
        <div>DATE: {new Date().toLocaleDateString()}</div>
        <div className="my-2 border-t border-b border-dashed border-black py-1 text-center font-bold text-lg">
          APPROVED
        </div>
        <div className="text-center italic">Thank you for banking with Citizen.</div>
        {/* 锯齿边缘 */}
        <div className="absolute -top-2 left-0 w-full h-2 bg-[radial-gradient(circle,transparent_50%,white_50%)] bg-[length:10px_10px] rotate-180" />
      </div>

    </div>
  );
};