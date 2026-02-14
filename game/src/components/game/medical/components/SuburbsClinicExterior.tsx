import React, { useState } from 'react';
import { useI18n } from '@/i18n';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const SuburbsClinicExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useI18n();

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-sans">
      
      {/* 1. 场景：连锁药房外观 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: "url('/assets/medical/suburbs_clinic_exterior.jpg')",
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.05)' : 'brightness(1)'
        }}
      >
        {/* 阳光明媚的滤镜 */}
        <div className="absolute inset-0 bg-yellow-500/10 mix-blend-overlay" />
      </div>

      {/* 2. 招牌：专业、商业化 */}
      <div className="relative z-10 mt-6 self-start ml-10 bg-white/90 p-4 rounded-lg shadow-xl border-t-4 border-red-600">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white font-bold w-10 h-10 flex items-center justify-center rounded text-xl shadow-md">
            Rx
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-none">
              Medi<span className="text-red-600">Chain</span>
            </h1>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Pharmacy & Wellness
            </div>
          </div>
        </div>
      </div>

      {/* 3. 交互区：自动感应门 */}
      <div 
        className="absolute inset-0 top-32 flex items-center justify-center z-10 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEnter}
      >
        {/* 门体 */}
        <div className={`
          relative w-80 h-96 bg-blue-100/20 backdrop-blur-sm border-x-8 border-t-8 border-gray-300
          transition-all duration-700 overflow-hidden shadow-2xl
          ${isHovered ? 'w-[450px] bg-blue-100/10' : ''}
        `}>
          {/* 门玻璃上的倒影 */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent pointer-events-none" />
          
          {/* 门把手/中缝 */}
          <div className={`
            absolute top-0 bottom-0 left-1/2 w-1 bg-gray-400 transition-all duration-700
            ${isHovered ? 'w-[200px] opacity-0' : 'w-2 opacity-100'}
          `} />

          {/* 开门后的内部景象 (模糊) */}
          <div className={`
            absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 delay-100
            ${isHovered ? 'opacity-100' : ''}
          `}>
             <span className="bg-white/80 text-gray-800 px-4 py-1 rounded-full font-bold text-sm shadow-lg tracking-wider">
               WELCOME
             </span>
          </div>

          {/* 营业时间贴纸 */}
          <div className={`
            absolute bottom-20 left-4 text-[10px] font-bold text-white drop-shadow-md transition-opacity duration-300
            ${isHovered ? 'opacity-0' : 'opacity-100'}
          `}>
            OPEN 24 HOURS<br/>DRIVE-THRU AVAILABLE
          </div>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto bg-white/80 px-6 py-2 rounded-full text-gray-600 hover:text-red-600 text-xs font-bold uppercase shadow-lg transition-all hover:scale-105"
      >
        {t('common.close')}
      </button>
    </div>
  );
};
