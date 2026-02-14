import React from 'react';
import { LoanProduct } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  product: LoanProduct;
  creditScore: number;
  onSign: () => void;
}

export const DowntownLedger: React.FC<Props> = ({ product, creditScore, onSign }) => {
  const { t } = useI18n();
  const canAfford = creditScore >= product.minScore;
  
  return (
    <div 
      onClick={canAfford ? onSign : undefined}
      className={`
        relative w-full h-32 bg-[#fdf5e6] shadow-md border-l-4 border-[#8b4513] mb-4 cursor-pointer group transition-all duration-300 hover:pl-2 overflow-hidden
        ${!canAfford ? 'opacity-50 grayscale' : ''}
      `}
    >
      {/* 纸张纹理 */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50" />
      
      <div className="relative z-10 p-4 flex justify-between items-center h-full">
        <div className="flex flex-col justify-center">
          <h3 className="font-serif text-xl text-[#2a2a2a] font-bold italic group-hover:text-[#8b4513] transition-colors">
            {product.name}
          </h3>
          <div className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wide">
            {t('bank.liquidityInjection')}
          </div>
          {!canAfford && (
            <div className="text-xs text-red-600 font-bold mt-1">
              {t('bank.creditRequired', { score: product.minScore })}
            </div>
          )}
        </div>

        <div className="flex gap-8 text-right font-mono">
          <div>
            <div className="text-[10px] text-gray-400 uppercase">{t('bank.capital')}</div>
            <div className="text-lg font-bold text-[#2a2a2a]">${product.maxAmount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">{t('bank.interestRate')}</div>
            <div className="text-lg font-bold text-[#8b4513]">{(product.weeklyRate * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* 签字区域 (Hover显示) */}
        <div className={`absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#d4af37]/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${!canAfford ? '!opacity-0' : ''}`}>
           <span className="font-handwriting text-2xl text-[#8b4513] -rotate-12">{t('bank.signHere')}</span>
        </div>
        
        {/* 不可用时显示锁 */}
        {!canAfford && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#d4af37] opacity-30" />
    </div>
  );
};
