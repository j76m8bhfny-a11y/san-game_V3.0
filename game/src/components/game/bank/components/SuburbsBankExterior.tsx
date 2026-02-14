import React, { useState } from 'react';
import { useI18n } from '@/i18n';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const SuburbsBankExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-sans">
      
      {/* 1. 场景：银行支行外观 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: "url('/assets/bank/suburbs_bank_exterior.jpg')",
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.05)' : 'brightness(1)'
        }}
      >
        {/* 玻璃反光滤镜 */}
        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
      </div>

      {/* 2. ATM 机器高亮区域 */}
      <div 
        className="absolute bottom-[20%] right-[15%] w-64 h-80 z-10 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEnter}
      >
        {/* 屏幕发光效果 */}
        <div className={`
          absolute top-10 left-10 w-40 h-32 bg-blue-400/30 blur-xl rounded-full
          transition-all duration-500
          ${isHovered ? 'opacity-100 scale-125' : 'opacity-40 animate-pulse-slow'}
        `} />

        {/* 交互提示 */}
        <div className={`
          absolute -top-12 left-1/2 -translate-x-1/2 bg-white/90 text-blue-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg
          transition-all duration-300 whitespace-nowrap
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {t('bank.insertCard')}
        </div>

        {/* 全息覆盖层 (装饰) */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/50 rounded-lg transition-colors" />
      </div>

      {/* 3. 银行 Logo */}
      <div className="absolute top-10 left-10 bg-white/90 p-3 rounded shadow-xl flex items-center gap-3">
        <div className="w-8 h-8 bg-[#004080] flex items-center justify-center text-white font-serif font-bold">
          $
        </div>
        <div>
          <h1 className="text-[#004080] font-bold text-lg leading-none">CITIZEN</h1>
          <p className="text-gray-500 text-[9px] tracking-widest uppercase">Financial Group</p>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto bg-gray-900/80 text-white px-6 py-2 rounded-full text-xs font-bold uppercase hover:bg-black transition-colors"
      >
        {t('common.close')}
      </button>
    </div>
  );
};