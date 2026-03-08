import React, { useState, useCallback } from 'react';
import { placeholderBackgrounds, placeholderEffects } from '../utils/placeholderAssets';
import { useI18n } from '@/i18n';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const SuburbsChurchExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-pixel">
      
      {/* 1. 场景：现代社区教堂 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          background: placeholderBackgrounds.suburbs_church_exterior,
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.05)' : 'brightness(1)'
        }}
      >
        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
      </div>

      {/* 2. 巨型 LED 屏幕 (动态内容) */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[40%] h-[25%] transform -skew-x-12 opacity-90 overflow-hidden shadow-pixel border-4 border-gray-800 bg-black">
        {/* 屏幕内容循环 */}
        <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">{t('faith.welcome_title')}</h1>
            <p className="text-xs text-gray-300 mt-1 uppercase tracking-widest">{t('faith.welcome_subtitle')}</p>
          </div>
        </div>
        {/* 扫描线效果 */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: placeholderEffects.scanlines, backgroundSize: '100% 4px' }}
        />
      </div>

      {/* 3. 品牌 Logo */}
      <div className="relative z-10 mt-4 ml-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-sm flex items-center justify-center text-white text-2xl font-bold shadow-pixel-sm">
            G
          </div>
          <div className="text-gray-800 bg-white/90 px-3 py-1 rounded shadow-sm backdrop-solid-light">
            <h2 className="font-bold text-lg leading-none">{t('faith.brand_name')}</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t('faith.brand_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* 4. 交互区：自动感应玻璃门 */}
      <div 
        className="absolute inset-0 top-1/3 flex items-center justify-center z-20 cursor-pointer group"
        onMouseEnter={useCallback(() => setIsHovered(true), [])}
        onMouseLeave={useCallback(() => setIsHovered(false), [])}
        onClick={onEnter}
      >
        <div className={`
          relative px-8 py-3 backdrop-solid-light rounded-sm shadow-pixel-sm
          text-blue-600 font-bold text-sm uppercase tracking-widest
          transition-all duration-300 border border-white
          ${isHovered ? 'scale-110 shadow-blue-500/30' : 'hover:bg-white'}
        `}>
          {t('faith.join')}
          
          {/* 装饰性光效 */}
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 animate-ping rounded-sm" />
        </div>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto bg-gray-900/80 text-white px-6 py-2 rounded-sm text-xs font-bold uppercase hover:bg-black transition-colors"
      >
        {t('common.close')}
      </button>
    </div>
  );
};
