import React, { useState } from 'react';
import { useI18n } from '@/i18n';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const RustBeltClinicExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useI18n();

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-pixel">
      
      {/* 1. 场景：Strip Mall 诊所夜景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: "url('/assets/medical/rust_clinic_exterior.jpg')",
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay" />
      </div>

      {/* 2. 招牌：闪烁的霓虹灯 */}
      <div className="relative z-10 mt-4 self-center bg-black/80 p-4 border-b-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex gap-4">
          <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">{t('scenes.rust_belt.urgent_care')}</span>
          <span className="text-red-500 text-5xl leading-none ml-2">+</span>
        </h1>
        <div className="flex justify-between items-center mt-2 text-xs font-mono text-gray-400">
          <span>{t('hospital.walkInsWelcome')}</span>
          <span className="text-red-500 font-bold border border-red-500 px-1">{t('hospital.open24h')}</span>
        </div>
      </div>

      {/* 3. 交互区：自动玻璃门 */}
      <div 
        className="absolute inset-0 top-32 flex items-center justify-center z-10 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEnter}
      >
        {/* 玻璃门反光效果 */}
        <div className={`
          w-64 h-96 border-4 border-gray-600 bg-blue-900/20 backdrop-blur-[2px]
          transition-all duration-500 relative overflow-hidden group-hover:bg-blue-900/10
          ${isHovered ? 'border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}
        `}>
          {/* 把手 */}
          <div className="absolute top-1/2 right-4 w-2 h-24 bg-gray-400 rounded-full" />
          
          {/* 门上的贴纸 */}
          <div className="absolute bottom-10 left-4 space-y-2 opacity-80">
            <div className="bg-white text-black text-[8px] font-bold px-1 w-16 text-center">NO INSURANCE?</div>
            <div className="bg-yellow-400 text-black text-[8px] font-bold px-1 w-20 text-center">VISA / MASTER</div>
          </div>

          {/* 开门提示 */}
          <div className={`
            absolute inset-0 flex items-center justify-center
            text-white font-mono text-xl tracking-widest uppercase
            transition-opacity duration-300
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}>
            Push
          </div>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto bg-black/60 px-4 py-2 text-gray-400 hover:text-white text-xs font-mono uppercase border border-gray-600 hover:border-white transition-colors"
      >
        {t('common.close')}
      </button>
    </div>
  );
};
