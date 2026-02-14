import React, { useState, useCallback } from 'react';
import { placeholderBackgrounds } from '../utils/placeholderAssets';
import { useI18n } from '@/i18n';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const DowntownLodgeExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-serif">
      
      {/* 1. 场景：神秘会所外观 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          background: placeholderBackgrounds.downtown_lodge_exterior,
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          filter: isHovered ? 'brightness(0.8) contrast(1.2)' : 'brightness(0.6) sepia(0.2)'
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* 2. 核心视觉：全视之眼 (The Eye) */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10 cursor-pointer group"
        onMouseEnter={useCallback(() => setIsHovered(true), [])}
        onMouseLeave={useCallback(() => setIsHovered(false), [])}
        onClick={onEnter}
      >
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* 三角形边框 */}
          <div className={`
            absolute inset-0 border-[1px] border-[#d4af37] opacity-60 transition-all duration-700
            ${isHovered ? 'scale-110 opacity-100 rotate-180' : 'rotate-0'}
          `} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          
          <div className={`
            absolute inset-0 border-[4px] border-[#d4af37] transition-all duration-500
            ${isHovered ? 'scale-105 shadow-[0_0_50px_rgba(212,175,55,0.5)]' : ''}
          `} style={{ clipPath: 'polygon(50% 10%, 10% 90%, 90% 90%)' }} />

          {/* 眼睛 (Hover时睁开) */}
          <div className={`
            text-6xl transition-all duration-1000 transform
            ${isHovered ? 'scale-150 text-[#d4af37] drop-shadow-[0_0_20px_rgba(212,175,55,1)]' : 'scale-100 text-[#555]'}
          `}>
            {isHovered ? '👁️' : '─'}
          </div>
        </div>
        
        {/* 拉丁语铭文 */}
        <div className={`
          text-center mt-8 text-[#d4af37] font-serif text-sm tracking-[0.3em] transition-opacity duration-700
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}>
          NOVUS ORDO SECLORUM
        </div>
      </div>

      {/* 3. 氛围遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto text-gray-600 hover:text-[#d4af37] text-[10px] font-mono uppercase tracking-[0.2em] transition-colors"
      >
        {t('faith.withdraw')}
      </button>
    </div>
  );
};
