import React, { useState, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { placeholderBackgrounds, placeholderIcons, placeholderEffects } from '../utils/placeholderAssets';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const SlumsShrineExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-pixel">
      
      {/* 1. 场景：肮脏的街角 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          background: placeholderBackgrounds.slums_shrine_exterior,
          filter: isHovered ? 'brightness(1.1) contrast(1.2)' : 'brightness(0.6) sepia(0.5)'
        }}
      >
        <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
      </div>

      {/* 2. 交互区：祭坛主体 */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer group"
        onMouseEnter={useCallback(() => setIsHovered(true), [])}
        onMouseLeave={useCallback(() => setIsHovered(false), [])}
        onClick={onEnter}
      >
        {/* 烛光特效 (Hover时变强) */}
        <div className={`
          absolute bottom-[20%] left-[50%] -translate-x-1/2 w-[30%] h-[30%]
          bg-orange-500/20 mix-blend-screen blur-[50px] rounded-full
          transition-all duration-700 animate-pulse
          ${isHovered ? 'opacity-100 scale-150' : 'opacity-40 scale-100'}
        `} />

        {/* 墙上的涂鸦 (Hover时显现) */}
        <div className={`
          absolute top-[30%] left-[50%] -translate-x-1/2 w-64 opacity-0 transition-opacity duration-1000
          ${isHovered ? 'opacity-80' : 'opacity-0'}
        `}>
          <div className="text-8xl text-center drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
            {placeholderIcons.graffiti_eye}
          </div>
        </div>

        {/* 提示文字 */}
        <div className={`
          absolute bottom-32 text-center transition-all duration-500
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <h2 className="text-orange-100 font-marker text-2xl mb-1 text-shadow-black tracking-widest">
            {t('faith.offer')}
          </h2>
          <p className="text-gray-400 font-mono text-xs bg-black/80 px-2 py-1 inline-block">
            The spirits are hungry...
          </p>
        </div>
      </div>

      {/* 氛围粒子：漂浮的尘埃 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 animate-float"
        style={{ backgroundImage: placeholderEffects.dust_particles, backgroundSize: '30px 30px' }}
      />

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto text-gray-500 hover:text-white text-xs font-mono uppercase tracking-widest"
      >
        [ {t('faith.leave')} ]
      </button>
    </div>
  );
};
