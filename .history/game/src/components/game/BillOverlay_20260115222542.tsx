import React, { useEffect, useState } from 'react';
import { Bill } from '@/types/schema';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

interface BillOverlayProps {
  bill: Bill;
  onPay?: () => void;
}

export const BillOverlay: React.FC<BillOverlayProps> = ({ bill }) => {
  const resolveBill = useGameStore(s => s.resolveBill);
  const [isExiting, setIsExiting] = useState(false);

  const isPositive = bill.amount > 0;
  
  // 处理点击：先播放离场动画，再结算
  const handleResolve = () => {
    setIsExiting(true);
    setTimeout(() => {
      resolveBill();
    }, 500); // 等待撕纸动画播放完毕
  };

  // 生成随机的“条形码”线条
  const barcodeLines = Array.from({ length: 24 }).map((_, i) => (
    <div 
      key={i} 
      className="h-full bg-black" 
      style={{ 
        width: Math.random() > 0.5 ? '4px' : '1px',
        opacity: Math.random() > 0.8 ? 0.5 : 1
      }} 
    />
  ));

  return (
    <div className="fixed inset-0 z-[6000] bg-black/80 flex items-start justify-center pt-20 backdrop-blur-[2px]">
      <AnimatePresence>
        {!isExiting && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0, rotate: 5, scale: 0.95 }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
            className="relative w-80 filter drop-shadow-2xl"
          >
            {/* --- 票据主体 --- */}
            <div 
              className="w-full bg-[#f0f0f0] text-black font-mono relative pt-8 pb-4 px-5 shadow-lg"
              style={{
                // 使用 mask-image 或 clip-path 制作上下锯齿
                // 这里用一个简化的 CSS技巧：利用多重渐变背景模拟锯齿，或者直接用 clip-path
                clipPath: `polygon(0% 0%, 5% 2%, 10% 0%, 15% 2%, 20% 0%, 25% 2%, 30% 0%, 35% 2%, 40% 0%, 45% 2%, 50% 0%, 55% 2%, 60% 0%, 65% 2%, 70% 0%, 75% 2%, 80% 0%, 85% 2%, 90% 0%, 95% 2%, 100% 0%, 100% 100%, 95% 98%, 90% 100%, 85% 98%, 80% 100%, 75% 98%, 70% 100%, 65% 98%, 60% 100%, 55% 98%, 50% 100%, 45% 98%, 40% 100%, 35% 98%, 30% 100%, 25% 98%, 20% 100%, 15% 98%, 10% 100%, 5% 98%, 0% 100%)`
              }}
            >
              {/* 纸张纹理叠加层 */}
              <div className="absolute inset-0 opacity-10 bg-[url('/assets/textures/noise.svg')] pointer-events-none mix-blend-multiply" />
              
              {/* 顶部 Logo */}
              <div className="text-center border-b-2 border-dashed border-black/20 pb-4 mb-4 select-none">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center">
                    <span className="font-black text-lg">AI</span>
                  </div>
                </div>
                <h2 className="text-xl font-black tracking-tighter">AMERICAN INSIGHT</h2>
                <div className="text-[10px] text-gray-500 mt-1 uppercase">
                  Terminal ID: #8841-A<br/>
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* 账单明细 */}
              <div className="space-y-4 mb-8 relative z-10">
                <div className="flex justify-between items-baseline border-b border-black/10 pb-2">
                  <span className="font-bold text-lg uppercase break-words max-w-[60%] leading-tight">
                    {bill.name}
                  </span>
                  <span className={`text-2xl font-bold tracking-tighter ${isPositive ? 'text-black' : 'text-red-700'}`}>
                    {isPositive ? '+' : ''}{bill.amount}
                  </span>
                </div>
                
                <div className="bg-gray-200/50 p-3 text-xs leading-relaxed font-serif italic text-gray-700">
                  "{bill.flavorText}"
                </div>

                <div className="flex justify-between text-[10px] text-gray-400 font-sans">
                  <span>TAX (0%):</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-sans">
                  <span>SERVICE FEE:</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t-2 border-black border-double pt-1 flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>${Math.abs(bill.amount)}</span>
                </div>
              </div>

              {/* 底部条形码 */}
              <div className="flex flex-col items-center gap-1 opacity-80 mb-6 select-none">
                <div className="h-10 w-4/5 flex justify-between gap-[1px] overflow-hidden">
                  {barcodeLines}
                </div>
                <span className="text-[10px] tracking-[0.2em]">{bill.id}</span>
              </div>

              {/* 按钮区域 */}
              <button
                onClick={handleResolve}
                className="group relative w-full overflow-hidden border-2 border-black bg-white py-3 font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                <span className="relative z-10 group-hover:text-white transition-colors">
                  {isPositive ? 'RECEIVE' : 'AUTHORIZE'}
                </span>
                <div className="absolute inset-0 bg-black transform translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
              </button>
              
              <div className="text-center mt-3 text-[10px] text-gray-400">
                * THANK YOU FOR YOUR COOPERATION *
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};