import React, { useEffect, useState } from 'react';
import { Bill } from '@/types/schema';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { motion, AnimatePresence } from 'framer-motion';

export const BillOverlay: React.FC<{ bill: Bill }> = ({ bill }) => {
  const resolveBill = useGameStore(s => s.resolveBill);
  const { playSfx } = useAudioStore();
  const [isPaying, setIsPaying] = useState(false);

  // 进场音效
  useEffect(() => {
    playSfx('sfx_paper'); 
  }, [playSfx]);

  const handlePay = () => {
    setIsPaying(true);
    playSfx('sfx_cash'); // 这里的 cash 音效可以理解为盖章声或签字声
    setTimeout(() => {
      resolveBill();
    }, 800); // 等待盖章动画播放完毕
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 1.5, opacity: 0, rotate: Math.random() * 20 - 10, y: -200 }}
        animate={{ scale: 1, opacity: 1, rotate: Math.random() * 6 - 3, y: 0 }} 
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="relative w-full max-w-sm"
      >
        {/* 纸张主体 */}
        <div className="bg-[#Fdfbf7] text-black p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden transform" 
             style={{ clipPath: 'polygon(1% 1%, 99% 0%, 100% 98%, 2% 100%)' }}> 
          
          {/* 纹理噪点 */}
          <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-10 pointer-events-none mix-blend-multiply" />
          
          {/* 咖啡渍 */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full border-[15px] border-[#e8dcc5] opacity-40 pointer-events-none blur-sm" />

          {/* 头部 */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start relative z-10">
            <div className="flex flex-col">
               <span className="font-black text-3xl tracking-tighter uppercase font-serif">INVOICE</span>
               <span className="text-[10px] text-gray-500 font-mono mt-1">REF: {bill.id}-{Math.floor(Math.random()*9999)}</span>
            </div>
            <div className="w-14 h-14 border-4 border-black rounded-full flex items-center justify-center font-serif font-bold italic rotate-12">
               US
            </div>
          </div>

          {/* 内容 */}
          <div className="mb-8 font-mono text-sm space-y-4 relative z-10">
            <div className="flex justify-between font-bold items-end border-b border-gray-300 pb-2">
              <span className="text-gray-600 text-xs">PAYABLE TO:</span>
              <span className="text-base">{bill.name}</span>
            </div>
            
            <div className="py-4 bg-gray-100/50 -mx-2 px-2 rounded border border-gray-200">
               <div className="flex justify-between text-red-600 font-black text-2xl items-center">
                 <span>DUE:</span>
                 <span>${Math.abs(bill.amount)}</span>
               </div>
            </div>

            <p className="text-xs text-gray-500 italic leading-relaxed font-serif">
              "{bill.flavorText}"
            </p>
          </div>

          {/* 动态盖章动画 */}
          <AnimatePresence>
            {isPaying && (
              <motion.div 
                initial={{ scale: 2, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: -15 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 border-8 border-blue-600 text-blue-600 font-black text-5xl p-4 mix-blend-multiply"
              >
                ACCEPTED
              </motion.div>
            )}
          </AnimatePresence>

          {/* 签字按钮 */}
          {!isPaying && (
            <button 
              onClick={handlePay}
              className="w-full bg-black text-white font-mono py-4 text-sm hover:bg-gray-900 active:scale-[0.98] transition-all relative overflow-hidden group shadow-lg"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-bold">
                <span className="animate-pulse">✍️</span> 
                {bill.amount > 0 ? 'CLAIM REWARD' : 'AUTHORIZE PAYMENT'}
              </span>
              <div className="absolute inset-0 bg-red-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
            </button>
          )}
          
          <div className="text-center mt-3 text-[9px] text-gray-400 font-sans tracking-tight">
            Failure to pay constitutes a violation of Federal Statute 8841-B.
          </div>
        </div>
      </motion.div>
    </div>
  );
};