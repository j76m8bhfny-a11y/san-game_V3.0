import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

import loansData from '../../assets/data/loans.json';
import { getCreditRating, calculateMaxBorrow } from '../../logic/bank';
import { AnimatePresence, motion } from 'framer-motion';

const BankSidebar: React.FC = () => {
  const { 
    isBankOpen, 
    setBankOpen, 
    bank, 
    day, 
    takeLoan, 
    repayLoan 
  } = useGameStore();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  if (!isBankOpen) return null;

  const rating = getCreditRating(bank.creditScore);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[#0a0f1c] border-l border-blue-900/30 p-6 z-50 text-white overflow-y-auto font-sans shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-widest text-blue-400">CITI-LINK BANK</h2>
        <button onClick={() => setBankOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
      </div>

      {/* Credit Score Dashboard */}
      <div className="bg-gradient-to-br from-blue-900/40 to-black border border-blue-800/50 rounded-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl">💳</div>
        <div className="text-xs text-blue-300 uppercase tracking-widest mb-1">FICO® Score 8</div>
        <div className={`text-5xl font-bold ${rating.color} mb-2`}>{bank.creditScore}</div>
        <div className="flex items-center gap-2">
           <span className={`text-sm font-bold ${rating.color} px-2 py-0.5 border border-current rounded`}>{rating.label}</span>
           <span className="text-xs text-zinc-500">Updated: Day {day}</span>
        </div>
        
        {/* Simple Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 mt-4 rounded-full overflow-hidden">
           <div 
             className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" 
             style={{ width: `${((bank.creditScore - 300) / 550) * 100}%` }}
           />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
          <span>300</span><span>850</span>
        </div>
      </div>

      {/* Existing Loans (Debts) */}
      {bank.activeLoans.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm text-zinc-400 mb-3 uppercase tracking-wider">Active Debts ({bank.activeLoans.length})</h3>
          <div className="space-y-3">
            {bank.activeLoans.map(loan => {
               const product = loansData.find(p => p.id === loan.productId);
               const totalDue = Math.floor(loan.principal + loan.interest);
               return (
                 <div key={loan.id} className="bg-red-900/10 border border-red-900/30 p-3 rounded hover:bg-red-900/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <div className="font-bold text-red-400">{product?.name}</div>
                         <div className="text-[10px] text-red-300/60">Due: Day {loan.dueDate} {loan.isOverdue && <span className="text-red-500 font-bold">(OVERDUE)</span>}</div>
                       </div>
                       <div className="text-right">
                         <div className="font-mono text-lg">${totalDue}</div>
                         <div className="text-[10px] text-zinc-500">Prin: ${loan.principal}</div>
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        const res = repayLoan(loan.id);
                        if(!res.success) alert(res.message); // Replace with Toast later
                      }}
                      className="w-full py-1.5 bg-red-900/20 text-red-400 text-xs border border-red-900/50 hover:bg-red-500 hover:text-white transition-all"
                    >
                      PAY OFF DEBT
                    </button>
                 </div>
               );
            })}
          </div>
        </div>
      )}

      {/* Loan Offers */}
      <div>
        <h3 className="text-sm text-zinc-400 mb-3 uppercase tracking-wider">Loan Offers</h3>
        <div className="space-y-4">
          {loansData.map(product => {
            const maxLimit = calculateMaxBorrow(product as any, bank.creditScore);
            const isEligible = maxLimit > 0;
            const isSelected = selectedProduct === product.id;

            return (
              <div key={product.id} className={`border rounded-lg transition-all duration-300 ${isSelected ? 'bg-blue-900/20 border-blue-500' : 'bg-black border-zinc-800 opacity-80'}`}>
                
                {/* Card Header */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedProduct(isSelected ? null : product.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-bold ${product.color}`}>{product.name}</h4>
                      <p className="text-[10px] text-zinc-500">{product.provider}</p>
                    </div>
                    {isEligible ? (
                       <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50">Pre-Approved</span>
                    ) : (
                       <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded">Denied</span>
                    )}
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-900/50 p-1 rounded">
                       <div className="text-[10px] text-zinc-500">Daily Rate</div>
                       <div className="text-xs font-mono">{(product.dailyRate * 100).toFixed(1)}%</div>
                    </div>
                    <div className="bg-zinc-900/50 p-1 rounded">
                       <div className="text-[10px] text-zinc-500">Limit</div>
                       <div className="text-xs font-mono">${maxLimit}</div>
                    </div>
                    <div className="bg-zinc-900/50 p-1 rounded">
                       <div className="text-[10px] text-zinc-500">Min Score</div>
                       <div className="text-xs font-mono">{product.minScore}</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Action Area */}
                <AnimatePresence>
                  {isSelected && isEligible && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 pt-0"
                    >
                      <div className="text-[10px] text-zinc-400 mb-3 italic border-l-2 border-zinc-700 pl-2">
                        "{product.description}"
                      </div>
                      <button 
                        onClick={() => {
                          const res = takeLoan(product.id, maxLimit); // 目前默认借最大额度，后续可加 Slider
                          if(res.success) {
                            alert(res.message);
                            setSelectedProduct(null);
                          } else {
                            alert(res.message);
                          }
                        }}
                        className={`w-full py-2 font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg shadow-blue-900/50 transition-all`}
                      >
                         ACCEPT ${maxLimit}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BankSidebar;