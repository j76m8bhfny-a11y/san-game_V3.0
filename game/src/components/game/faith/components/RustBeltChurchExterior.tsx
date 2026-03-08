import React, { useState, useCallback } from 'react';
import { placeholderBackgrounds } from '../utils/placeholderAssets';
import { useI18n } from '@/i18n';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const RustBeltChurchExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-pixel">
      
      {/* 1. 场景：路边福音堂 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          background: placeholderBackgrounds.rust_church_exterior,
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.1)' : 'brightness(0.8) sepia(0.3)'
        }}
      >
        <div className="absolute inset-0 bg-purple-900/20 mix-blend-overlay" />
      </div>

      {/* 2. 霓虹灯十字架 (核心视觉点) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-10">
        <div className={`
          relative text-red-500 text-[150px] font-black leading-none drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]
          transition-all duration-100
          ${isHovered ? 'opacity-100 scale-105' : 'opacity-90 animate-flicker'}
        `}>
          ✝
          {/* 光晕效果 */}
          <div className="absolute inset-0 bg-red-500/30 blur-3xl rounded-sm mix-blend-screen animate-pulse-fast" />
        </div>
      </div>

      {/* 3. 橱窗贴纸 */}
      <div className="absolute bottom-1/3 left-10 opacity-70 rotate-2">
        <div className="bg-white p-2 text-black font-marker text-sm w-32 text-center shadow-pixel-sm transform origin-top-left animate-swing">
          {t('faith.signage')}
        </div>
      </div>

      {/* 4. 交互区：大门 */}
      <div 
        className="absolute inset-0 top-1/3 flex items-center justify-center z-20 cursor-pointer group"
        onMouseEnter={useCallback(() => setIsHovered(true), [])}
        onMouseLeave={useCallback(() => setIsHovered(false), [])}
        onClick={onEnter}
      >
        <div className={`
          backdrop-solid-dark border-2 border-white/20 px-6 py-3
          text-white font-mono text-xl tracking-widest uppercase
          transition-all duration-300
          ${isHovered ? 'bg-red-900/80 border-red-500 scale-110' : 'hover:bg-black/80'}
        `}>
          {t('faith.join')}
        </div>
      </div>

      {/* 声音可视化 (模拟里面传出的震动) */}
      <div className="absolute inset-0 border-[20px] border-transparent transition-all duration-100"
           style={{ borderColor: isHovered ? 'rgba(239,68,68,0.1)' : 'transparent' }}>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto text-gray-400 hover:text-white text-xs font-mono uppercase tracking-widest"
      >
        {t('common.close')}
      </button>
    </div>
  );
};
