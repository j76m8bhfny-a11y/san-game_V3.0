import React from 'react';
import { Bill } from '@/types/schema';
import { useGameStore } from '@/store/useGameStore';
import { motion } from 'framer-motion';

interface BillOverlayProps {
  bill: Bill;
  onPay?: () => void; // 兼容性 Props
}

export const BillOverlay: React.FC<BillOverlayProps> = ({ bill }) => {
  const resolveBill = useGameStore(s => s.resolveBill);

  const isPositive = bill.amount > 0; // 是收入还是支出

  return (
    <div className="fixed inset-0 z-[6000] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-white text-black p-6 shadow-[0_0_50px_rgba(255,255,255,0.2)] font-mono rotate-1"
      >
        {/* 票据头部 */}
        <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
          <h2 className="text-xl font-black uppercase tracking-widest">
            {isPositive ? 'INCOME RECEIPT' : 'PAYMENT NOTICE'}
          </h2>
          <div className="text-xs mt-1">{new Date().toLocaleDateString()} // AUTO-GENERATED</div>
        </div>

        {/* 票据内容 */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-end">
            <span className="font-bold">{bill.name}</span>
            <span className={`text-xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
              {isPositive ? '+' : ''}{bill.amount}
            </span>
          </div>
          
          <p className="text-sm italic opacity-70 border-l-2 border-black pl-2 leading-relaxed">
            "{bill.flavorText}"
          </p>
        </div>

        {/* 按钮：点击后调用 Store 的 resolveBill */}
        <button
          onClick={() => resolveBill()}
          className="w-full bg-black text-white py-3 font-bold hover:bg-red-600 transition-colors uppercase tracking-widest"
        >
          {isPositive ? '[ CLAIM ]' : '[ ACKNOWLEDGE ]'}
        </button>

        {/* 底部装饰 */}
        <div className="mt-6 pt-2 border-t border-black flex justify-between items-end opacity-50">
          <span className="text-[10px]">ID: {bill.id}</span>
          <span className="text-[10px]">AMERICAN INSIGHT CORP.</span>
        </div>

      </motion.div>
    </div>
  );
};