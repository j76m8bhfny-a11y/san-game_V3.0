import React from 'react';
import { Housing } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  house: Housing;
  gold: number;
  onRent: () => void;
  onClose: () => void;
}

export const RustBeltExterior: React.FC<Props> = ({ house, gold, onRent, onClose }) => {
  const { t } = useI18n();
  const deposit = house.rentConfig?.deposit || 0;
  const weekly = house.rentConfig?.weeklyCosts?.[0]?.baseAmount || 0;
  const totalUpfront = deposit + weekly;
  const canAfford = gold >= totalUpfront;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-sans">
      
      {/* 1. 场景：Motel 走廊夜景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/housing/rust_exterior_bg.jpg')",
        }}
      >
        {/* 霓虹灯光污染效果 */}
        <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay animate-pulse-slow" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* 2. 顶部：招牌 */}
      <div className="relative z-10 self-end mt-4 mr-4">
        <div className="border-4 border-red-900 bg-black/80 p-4 shadow-[0_0_30px_rgba(220,38,38,0.5)] transform rotate-2">
          <h1 className="text-4xl font-black text-red-500 tracking-widest uppercase italic font-mono drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
            NO-TELL<br/>MOTEL
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-300 font-mono text-sm tracking-widest">{t('housing.vacancy')}</span>
          </div>
        </div>
      </div>

      {/* 3. 交互区：挂在门把手上的登记板 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full mt-10">
        
        <button
          onClick={canAfford ? onRent : undefined}
          disabled={!canAfford}
          className={`
            group relative w-80 h-96 transition-transform duration-300
            ${canAfford ? 'hover:scale-105 hover:-rotate-1 cursor-pointer' : 'opacity-80 grayscale cursor-not-allowed'}
          `}
        >
          {/* 写字板底图 */}
          <img 
            src="/assets/housing/ui_clipboard.png" 
            className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl" 
            alt="Check-in Clipboard"
          />
          
          {/* 写字板上的表单内容 */}
          <div className="absolute inset-0 flex flex-col pt-24 px-12 text-[#2a2a2a] rotate-[-2deg]">
            <h3 className="font-bold text-xl uppercase border-b-2 border-black/20 pb-1 mb-2">Guest Check-in</h3>
            
            <div className="space-y-3 font-mono text-xs font-bold">
              <div className="flex justify-between">
                <span>ROOM:</span>
                <span className="text-red-800">#204</span>
              </div>
              <div className="flex justify-between">
                <span>RATE:</span>
                <span>${weekly}/wk</span>
              </div>
              <div className="flex justify-between">
                <span>DEPOSIT:</span>
                <span>${deposit}</span>
              </div>
              <div className="border-t border-black/20 my-2" />
              <div className="flex justify-between text-lg">
                <span>TOTAL:</span>
                <span className={canAfford ? 'text-black' : 'text-red-600'}>${totalUpfront}</span>
              </div>
            </div>

            {/* 签字区域 (按钮) */}
            <div className="mt-auto mb-10 relative">
              <div className="border-b-2 border-black/50 h-8 flex items-end">
                <span className="text-gray-400 text-[10px] uppercase">x_Sign_Here_______</span>
              </div>
              {canAfford && (
                <div className="absolute top-0 left-4 text-blue-900 font-handwriting text-2xl transform -rotate-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  John Doe
                </div>
              )}
            </div>
            
            {!canAfford && (
              <div className="absolute bottom-20 left-10 rotate-12 border-4 border-red-600 text-red-600 font-black text-xl px-2 py-1 opacity-80 mask-stamp">
                DECLINED
              </div>
            )}
          </div>
        </button>

        <button 
          onClick={onClose}
          className="mt-8 bg-black/60 text-white px-6 py-2 border border-white/20 hover:bg-black/80 font-mono text-sm"
        >
          [ {t('common.close')} ]
        </button>
      </div>
    </div>
  );
};