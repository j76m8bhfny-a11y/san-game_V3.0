import React from 'react';
import { LoanProduct } from '@/types/schema';

interface Props {
  product: LoanProduct;
  onSign: () => void;
}

export const DowntownLedger: React.FC<Props> = ({ product, onSign }) => {
  return (
    <div 
      onClick={onSign}
      className="relative w-full h-32 bg-[#fdf5e6] shadow-md border-l-4 border-[#8b4513] mb-4 cursor-pointer group transition-all duration-300 hover:pl-2 overflow-hidden"
    >
      {/* 纸张纹理 */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50" />
      
      <div className="relative z-10 p-4 flex justify-between items-center h-full">
        <div className="flex flex-col justify-center">
          <h3 className="font-serif text-xl text-[#2a2a2a] font-bold italic group-hover:text-[#8b4513] transition-colors">
            {product.name}
          </h3>
          <div className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wide">
            Liquidity Injection
          </div>
        </div>

        <div className="flex gap-8 text-right font-mono">
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Capital</div>
            <div className="text-lg font-bold text-[#2a2a2a]">${product.amount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Interest</div>
            <div className="text-lg font-bold text-[#8b4513]">{(product.interestRate * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* 签字区域 (Hover显示) */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#d4af37]/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <span className="font-handwriting text-2xl text-[#8b4513] -rotate-12">Sign Here</span>
        </div>
      </div>
      
      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#d4af37] opacity-30" />
    </div>
  );
};