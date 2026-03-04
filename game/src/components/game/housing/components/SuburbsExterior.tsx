import React from 'react';
import { Housing } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  house: Housing;
  gold: number;
  onBuy: () => void;
  onClose: () => void;
}

export const SuburbsExterior: React.FC<Props> = ({ house, gold, onBuy, onClose }) => {
  const { t } = useI18n();
  // 假设中产阶级主要是买房 (Buy)，读取 buyConfig
  // 如果没有 buyConfig，则回退到租赁逻辑
  const isSale = !!house.buyConfig;
  const price = isSale ? house.buyConfig!.price : 0;
  const downPaymentRate = isSale ? house.buyConfig!.downPaymentRate : 0;
  const downPayment = Math.ceil(price * downPaymentRate);
  
  // 如果是租赁
  const rentCost = (house.rentConfig?.deposit || 0) + (house.rentConfig?.weeklyCosts?.[0]?.baseAmount || 0);
  
  const finalUpfrontCost = isSale ? downPayment : rentCost;
  const canAfford = gold >= finalUpfrontCost;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-pixel">
      
      {/* 1. 场景：完美的郊区房子 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/housing/suburbs_exterior_bg.jpg')",
        }}
      >
        {/* 阳光光晕特效 */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_70%)] mix-blend-screen pointer-events-none" />
      </div>

      {/* 2. 装饰：HOA 告示牌 */}
      <div className="absolute bottom-10 left-10 z-10 transform -rotate-2">
        <img 
          src="/assets/housing/prop_hoa_sign.png" 
          className="w-24 drop-shadow-xl hover:scale-105 transition-transform cursor-help" 
          title="HOA Rules: Grass must be 2 inches. No trash cans visible."
        />
      </div>

      {/* 3. 交互区：房地产售卖牌 (Real Estate Sign) */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full ml-auto w-1/2 mr-10">
        
        <button
          onClick={canAfford ? onBuy : undefined}
          disabled={!canAfford}
          className={`
            group relative w-72 h-96 transition-transform duration-500
            ${canAfford ? 'hover:scale-105 hover:rotate-1 cursor-pointer' : 'opacity-90 grayscale-[0.5] cursor-not-allowed'}
          `}
        >
          {/* 牌子柱子 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-full bg-white border border-gray-300 shadow-lg" />
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full h-4 bg-white border border-gray-300 shadow-lg" />

          {/* 挂着的牌子主体 */}
          <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-full bg-white border-4 border-[#1e3a8a] shadow-2xl p-4 text-center transform origin-top group-hover:rotate-1 transition-transform">
            <div className="bg-[#1e3a8a] text-white font-pixel font-bold py-1 uppercase tracking-widest mb-2">
              {isSale ? 'FOR SALE' : 'FOR LEASE'}
            </div>
            
            <h3 className="text-[#1e3a8a] font-pixel font-black text-2xl leading-none mb-1">
              Dream Home
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">
              3 Bed • 2 Bath • HOA Approved
            </p>

            <div className="border-t border-b border-gray-200 py-2 mb-2">
              <div className="text-xs text-gray-500 font-bold">DOWN PAYMENT</div>
              <div className={`text-3xl font-black ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                ${finalUpfrontCost.toLocaleString()}
              </div>
            </div>

            {isSale && (
              <div className="text-[10px] text-gray-400 italic">
                *Subject to credit approval
              </div>
            )}
            
            {/* 按钮伪装成挂在下面的小牌子 */}
            <div className={`
              absolute -bottom-16 left-1/2 -translate-x-1/2 w-[90%] 
              bg-[#d97706] text-white font-bold py-2 shadow-lg
              border-2 border-white flex items-center justify-center gap-2
              transform origin-top animate-swing
            `}>
              <span>{isSale ? 'SIGN MORTGAGE' : 'SIGN LEASE'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </div>
            
            {/* 挂钩 */}
            <div className="absolute -top-6 left-10 w-2 h-6 border-l-2 border-r-2 border-gray-400 rounded-full" />
            <div className="absolute -top-6 right-10 w-2 h-6 border-l-2 border-r-2 border-gray-400 rounded-full" />
          </div>

          {!canAfford && (
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 bg-red-600 text-white font-black px-4 py-1 rotate-[-10deg] shadow-lg whitespace-nowrap z-20">
              INSUFFICIENT FUNDS
            </div>
          )}
        </button>

        <button 
          onClick={onClose}
          className="mt-20 bg-white/80 hover:bg-white text-gray-600 px-6 py-2 rounded-full shadow-lg font-bold text-sm backdrop-blur-sm transition-all"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};