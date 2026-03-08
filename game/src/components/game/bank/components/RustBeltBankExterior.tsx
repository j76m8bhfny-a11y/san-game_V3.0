import React, { useState } from 'react';
import { useI18n } from '@/i18n';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const RustBeltBankExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-pixel">
      
      {/* 1. 场景：老旧信用社外观 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: "url('/assets/bank/rust_bank_exterior.jpg')",
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          filter: isHovered ? 'sepia(0.2) contrast(1.1)' : 'sepia(0.4) contrast(1)'
        }}
      >
        <div className="absolute inset-0 bg-gray-900/20 mix-blend-multiply" />
      </div>

      {/* 2. 招牌 */}
      <div className="absolute top-10 left-10 bg-white/90 px-4 py-2 border-l-4 border-blue-800 shadow-md transform -rotate-1">
        <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">
          COMMUNITY <span className="text-red-700">UNION</span>
        </h1>
        <div className="text-[10px] font-bold text-gray-600 flex gap-4 mt-1">
          <span>CHECK CASHING</span>
          <span>•</span>
          <span>PAYDAY ADVANCE</span>
        </div>
      </div>

      {/* 3. 交互区：推门 */}
      <div 
        className="absolute inset-0 top-1/3 flex items-center justify-center z-10 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEnter}
      >
        <div className={`
          relative w-64 h-80 border-8 border-gray-300 backdrop-solid-dark
          transition-all duration-500 flex flex-col items-center justify-center
          ${isHovered ? 'border-blue-500 bg-blue-900/20' : ''}
        `}>
          {/* 门把手 */}
          <div className="absolute right-4 top-1/2 h-16 w-2 bg-gray-400 rounded shadow-sm" />
          
          {/* 营业时间贴纸 */}
          <div className="bg-white/80 p-2 text-center transform rotate-2 shadow-sm">
            <div className="text-xs font-bold text-black border-b border-black mb-1">{t('housing.open')}</div>
            <div className="text-[10px] font-mono">9:00 - 17:00</div>
          </div>
          
          <div className={`
            mt-10 bg-blue-800 text-white px-4 py-1 text-xs font-bold uppercase tracking-widest
            transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}>
            {t('common.enter')}
          </div>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto bg-black/60 text-gray-300 hover:text-white px-4 py-2 text-xs font-mono uppercase border border-gray-600"
      >
        {t('common.close')}
      </button>
    </div>
  );
};