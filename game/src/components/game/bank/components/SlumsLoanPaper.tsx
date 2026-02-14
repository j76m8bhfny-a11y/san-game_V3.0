import React from 'react';
import { LoanProduct } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  product: LoanProduct;
  creditScore: number;
  onSign: () => void;
}

export const SlumsLoanPaper: React.FC<Props> = ({ product, creditScore, onSign }) => {
  const { t } = useI18n();
  const canAfford = creditScore >= product.minScore;
  
  return (
    <div 
      onClick={canAfford ? onSign : undefined}
      className={`
        relative w-full h-32 bg-[#f3e5ab] shadow-md transform rotate-1 cursor-pointer transition-all duration-200 group
        ${canAfford ? 'hover:scale-105 hover:-rotate-1 hover:shadow-xl' : 'opacity-60 grayscale cursor-not-allowed'}
      `}
    >
      {/* 纸张污渍 */}
      <div className="absolute top-2 right-4 w-8 h-8 bg-yellow-900/10 rounded-full blur-md" />
      <div className="absolute bottom-4 left-10 w-12 h-4 bg-black/5 rotate-3" />

      {/* 胶带固定 */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-yellow-600/50 rotate-2" />

      <div className="p-3 font-mono text-xs text-gray-800 flex flex-col h-full justify-between">
        <div className="border-b-2 border-black pb-1 mb-1 flex justify-between items-center">
          <span className="font-bold uppercase text-red-800">{t('bank.quickCash')}</span>
          <span className="bg-black text-white px-1 text-[8px]">INSTANT</span>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-gray-600">{t('bank.loan.get')}</div>
          <div className="text-2xl font-black text-green-800 leading-none">${product.maxAmount}</div>
        </div>

        <div className="flex justify-between items-end mt-1 text-[9px] leading-tight">
          <div>
            <div>{t('bank.loan.payBack')}: <span className="font-bold text-red-700">${Math.ceil(product.maxAmount * (1 + product.weeklyRate * product.termTurns))}</span></div>
            <div className="text-gray-500">{t('bank.loan.inTurns', { turns: product.termTurns })}</div>
            {!canAfford && (
              <div className="text-red-600 font-bold mt-1">{t('bank.loan.creditRequired', { score: product.minScore })}</div>
            )}
          </div>
          <div className={`
            font-bold px-2 py-1 border border-black transform -rotate-6
            ${canAfford ? 'bg-red-600 text-white group-hover:bg-red-500' : 'bg-gray-400 text-gray-200'}
          `}>
            {canAfford ? t('bank.loan.apply') : t('common.denied')}
          </div>
        </div>
      </div>
    </div>
  );
};
