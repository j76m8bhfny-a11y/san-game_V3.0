import React from 'react';
import { Housing } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  house: Housing;
  gold: number;
  onRent: () => void;
  onClose: () => void;
}

export const SlumsExterior: React.FC<Props> = ({ house, gold, onRent, onClose }) => {
  const { t } = useI18n();
  const cost = house.rentConfig?.deposit || 0;
  const canAfford = gold >= cost;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none">
      {/* 1. 场景：肮脏的街角背景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/housing/slums_exterior_bg.jpg')",
          filter: 'contrast(1.2) brightness(0.8)'
        }}
      >
        <div className="absolute inset-0 bg-black/40" /> {/* 压暗遮罩 */}
      </div>

      {/* 2. 顶部：环境描述 */}
      <div className="relative z-10 bg-black/70 p-4 border-l-4 border-red-800 max-w-md transform -rotate-1">
        <h2 className="text-2xl font-black text-gray-200 font-serif tracking-widest uppercase mb-1">
          EMPTY LOT
        </h2>
        <p className="text-sm text-gray-400 font-mono leading-relaxed">
          It's dirty, wet, and smells like urine. But it's out of the wind.
          You can set up a tent here... if you bribe the local gang.
        </p>
      </div>

      {/* 3. 交互区：地上的纸板箱按钮 */}
      <div className="relative z-10 flex flex-col items-center mt-auto mb-8">
        
        {/* 搭建按钮：模拟一块撕下来的瓦楞纸板 */}
        <button
          onClick={canAfford ? onRent : undefined}
          disabled={!canAfford}
          className={`
            group relative w-64 h-40 transition-transform duration-300
            ${canAfford ? 'hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed grayscale'}
          `}
        >
          {/* 纸板贴图 */}
          <img 
            src="/assets/housing/ui_cardboard_sign.png" 
            className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl" 
            alt="Sign"
          />
          
          {/* 纸板上的手写字 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 rotate-2">
            <span className="font-marker text-3xl text-[#2a2a2a] font-bold">
              SETUP CAMP
            </span>
            <span className={`font-marker text-xl font-black mt-1 ${canAfford ? 'text-red-700' : 'text-gray-500 line-through'}`}>
              ${cost}
            </span>
            {!canAfford && (
              <span className="text-xs text-red-600 font-bold bg-white/80 px-1 mt-1 -rotate-2">
                {t('common.price')}
              </span>
            )}
          </div>
        </button>

        <button 
          onClick={onClose}
          className="mt-6 text-gray-400 hover:text-white text-xs font-mono uppercase tracking-widest hover:underline"
        >
          [ {t('common.close')} ]
        </button>
      </div>

      {/* 氛围特效：雨/尘埃 */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/assets/fx/noise_grain.png')] opacity-20 mix-blend-overlay" />
    </div>
  );
};