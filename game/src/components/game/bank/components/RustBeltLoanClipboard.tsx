import React from 'react';
import { LoanProduct } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  product: LoanProduct;
  creditScore: number;
  onSign: () => void;
}

export const RustBeltLoanClipboard: React.FC<Props> = ({ product, creditScore, onSign }) => {
  const { t } = useI18n();
  const canAfford = creditScore >= product.minScore;
  
  return (
    <div 
      onClick={canAfford ? onSign : undefined}
      className={`
        relative w-full h-40 bg-[#5c4033] rounded-t-lg shadow-pixel-sm cursor-pointer transition-transform duration-200 group
        ${canAfford ? 'hover:-translate-y-2' : 'opacity-60 grayscale cursor-not-allowed'}
      `}
    >
      {/* 夹子 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-6 bg-gray-400 rounded-b-md shadow-sm z-20 flex items-center justify-center">
        <div className="w-12 h-1 bg-black/20" />
      </div>

      {/* 纸张 */}
      <div className="absolute top-2 left-2 right-2 bottom-2 bg-white shadow-inner p-3 font-pixel text-gray-800 flex flex-col z-10">
        <div className="text-center border-b-2 border-black pb-1 mb-1">
          <h3 className="font-bold text-sm uppercase">{t('bank.loan.title')}</h3>
        </div>
        
        <div className="flex-1 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>{t('bank.loan.amount')}:</span>
            <span className="font-mono font-bold">${product.maxAmount}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('bank.loan.interest')}:</span>
            <span className="font-mono text-red-700">{(product.weeklyRate * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>{t('bank.loan.term')}:</span>
            <span className="font-mono">{product.termTurns} {t('bank.turns')}</span>
          </div>
          
          {!canAfford && (
            <div className="text-red-600 font-bold text-center mt-1">
              {t('bank.loan.creditRequired', { score: product.minScore })}
            </div>
          )}
          
          <div className="mt-2 text-[8px] text-gray-500 leading-tight text-justify">
            {t('bank.loan.wageGarnishment')}
          </div>
        </div>

        {/* 签字区 */}
        <div className="mt-auto border-t border-gray-300 pt-1 flex justify-between items-end">
          <div className="text-[8px] text-gray-400">x_________________</div>
          
          {/* 按钮/印章 */}
          <div className={`
            px-2 py-0.5 text-[10px] font-bold border-2 transform -rotate-3
            ${canAfford ? 'border-blue-800 text-blue-800 group-hover:bg-blue-50' : 'border-gray-400 text-gray-400'}
          `}>
            {canAfford ? t('common.signHere') : t('common.ineligible')}
          </div>
        </div>
      </div>
    </div>
  );
};
