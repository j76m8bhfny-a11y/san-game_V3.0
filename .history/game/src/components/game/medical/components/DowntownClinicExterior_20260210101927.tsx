import React, { useState } from 'react';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const DowntownClinicExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-sans">
      
      {/* 1. 场景：极简主义建筑外观 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: "url('/assets/medical/downtown_clinic_exterior.jpg')",
          transform: isHovered ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* 2. Logo与品牌：神秘、高端 */}
      <div className="relative z-10 self-center mt-12 text-center opacity-90">
        <div className="w-16 h-16 mx-auto bg-white/10 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
          <div className="w-8 h-8 border-2 border-cyan-400 rounded-full animate-pulse-slow" />
        </div>
        <h1 className="text-4xl font-thin text-white tracking-[0.3em] uppercase">
          AETHELGARD
        </h1>
        <p className="text-[10px] text-cyan-300 uppercase tracking-widest mt-2">
          Beyond Biology
        </p>
      </div>

      {/* 3. 交互区：隐形感应门 */}
      <div 
        className="absolute inset-0 top-40 flex items-center justify-center z-10 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEnter}
      >
        {/* 呼吸灯光效 */}
        <div className={`
          absolute inset-0 bg-gradient-to-t from-cyan-900/40 via-transparent to-transparent
          transition-opacity duration-1000
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `} />

        {/* 门体：巨大的无缝玻璃 */}
        <div className={`
          w-[400px] h-[500px] border-x border-t border-white/10 bg-white/5 backdrop-blur-[1px]
          transition-all duration-700 flex flex-col items-center justify-center
          ${isHovered ? 'bg-white/10 border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.2)]' : ''}
        `}>
          <div className={`
            text-cyan-400 font-mono text-xs tracking-widest transition-all duration-500
            ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}>
            [ BIOMETRIC AUTHENTICATED ]
          </div>
          <div className={`
            mt-2 w-1 h-12 bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-50
            transition-all duration-500
            ${isHovered ? 'h-0' : 'h-12'}
          `} />
        </div>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto text-gray-500 hover:text-white text-[10px] font-mono uppercase tracking-[0.2em] transition-colors"
      >
        Return to City
      </button>
    </div>
  );
};