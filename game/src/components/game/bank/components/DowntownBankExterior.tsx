import React, { useState } from 'react';
import { useI18n } from '@/i18n';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const DowntownBankExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-pixel">
      
      {/* 1. 场景：金库大门 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: "url('/assets/bank/downtown_bank_exterior.jpg')",
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.1) contrast(1.1)' : 'brightness(0.8) sepia(0.2)'
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* 2. 交互区：转盘锁 */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEnter}
      >
        <div className={`
          relative w-96 h-96 rounded-sm border-[20px] border-[#8b7d6b] 
          shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-[#c4a030]
          flex items-center justify-center transition-transform duration-1000 ease-in-out
          ${isHovered ? 'rotate-180 scale-105' : 'rotate-0'}
        `}>
          {/* 锁盘纹理 */}
          <div className="absolute inset-0 rounded-sm border-4 border-black/20 opacity-50" />
          <div className="absolute w-full h-2 bg-black/20 rotate-0" />
          <div className="absolute w-full h-2 bg-black/20 rotate-90" />
          
          {/* 中心把手 */}
          <div className="w-32 h-32 bg-[#2a2a2a] rounded-sm shadow-inner flex items-center justify-center border-4 border-[#5c5c5c]">
             <div className="text-[#d4af37] font-mono text-xs tracking-widest opacity-80">
               THE VAULT
             </div>
          </div>

          {/* 开锁提示 */}
          <div className={`
            absolute -bottom-16 text-white font-mono text-sm tracking-[0.5em] uppercase
            transition-opacity duration-500
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}>
            {t('bank.accessGranted')}
          </div>
        </div>
      </div>

      {/* 3. 装饰文字 */}
      <div className="absolute top-10 left-10 text-[#d4af37] opacity-80">
        <h1 className="text-4xl font-thin tracking-[0.2em] uppercase">Sovereign</h1>
        <p className="text-xs text-white uppercase tracking-widest mt-1">Private Wealth Management</p>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto text-gray-400 hover:text-[#d4af37] text-xs font-mono uppercase tracking-[0.2em] transition-colors"
      >
        {t('common.close')}
      </button>
    </div>
  );
};