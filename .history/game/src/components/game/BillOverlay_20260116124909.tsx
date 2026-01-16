import React from 'react';
import { Bill } from '@/types/schema';
import { useGameStore } from '@/store/useGameStore';
import { motion } from 'framer-motion';

export const BillOverlay: React.FC<{ bill: Bill }> = ({ bill }) => {
  const resolveBill = useGameStore(s => s.resolveBill);

  return (
    <div className="fixed inset-0 z-[6000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }} // 拍在桌子上
        transition={{ type: 'spring', damping: 12 }}
        className="relative w-full max-w-sm"
      >
        {/* 纸张主体 */}
        <div className="bg-[#Fdfbf7] text-black p-8 shadow-2xl transform rotate-1 relative overflow-hidden" 
             style={{ clipPath: 'polygon(2% 0, 100% 0, 99% 98%, 0% 100%)' }}> {/* 模拟不规则纸张 */}
          
          {/* 咖啡渍装饰 */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full border-[10px] border-[#e8dcc5] opacity-30 pointer-events-none blur-sm" />

          {/* 机构 Logo */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
            <div className="flex flex-col">
               <span className="font-black text-2xl tracking-tighter uppercase">INVOICE</span>
               <span className="text-[10px] text-gray-500">REF: {bill.id}</span>
            </div>
            <div className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center font-serif font-bold italic">
               US
            </div>
          </div>

          <div className="mb-8 font-mono text-sm space-y-2">
            <div className="flex justify-between font-bold">
              <span>ITEM:</span>
              <span>{bill.name}</span>
            </div>
            <div className="flex justify-between text-red-600 font-black text-xl border-y border-dashed border-gray-300 py-2 my-2">
              <span>AMOUNT DUE:</span>
              <span>${Math.abs(bill.amount)}</span>
            </div>
            <p className="text-xs text-gray-500 italic leading-relaxed pt-2">
              "{bill.flavorText}"
            </p>
          </div>

          {/* 盖章 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-500 text-red-500 font-black text-4xl p-2 opacity-20 -rotate-12 pointer-events-none">
            UNPAID
          </div>

          {/* 签字支付区 */}
          <button 
            onClick={resolveBill}
            className="w-full bg-black text-white font-mono py-4 text-sm hover:bg-gray-900 active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="animate-pulse">✍️</span> SIGN & PAY
            </span>
          </button>

          <div className="text-center mt-2 text-[10px] text-gray-400">
            Failure to pay will result in credit score termination.
          </div>
        </div>
      </motion.div>
    </div>
  );
};