import React, { useState } from 'react';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const SlumsClinicExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-sans">
      
      {/* 1. 场景：阴暗的地下室入口 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: "url('/assets/medical/slums_clinic_exterior.jpg')",
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.1) contrast(1.2)' : 'brightness(0.8) contrast(1.1)'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* 2. 交互区：生锈的门 */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEnter}
      >
        {/* 门缝里的光 (Hover时变亮) */}
        <div className={`
          absolute top-[20%] left-[45%] w-[10%] h-[60%] 
          bg-green-500/30 mix-blend-screen blur-xl rounded-[50%]
          transition-all duration-500
          ${isHovered ? 'opacity-100 scale-x-150' : 'opacity-20 scale-x-100'}
        `} />

        {/* 喷漆涂鸦 */}
        <div className="absolute top-[30%] right-[30%] opacity-80 transform rotate-12">
          <img 
            src="/assets/medical/ui_graffiti_cross.png" 
            className="w-32 drop-shadow-lg" 
            alt="Red Cross"
          />
        </div>

        {/* 提示文字 */}
        <div className={`
          absolute bottom-20 text-center transition-all duration-300
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <h2 className="text-red-600 font-marker text-3xl mb-1 text-shadow-black">
            ENTER "THE BUTCHER"
          </h2>
          <p className="text-gray-400 font-mono text-xs bg-black/80 px-2 py-1">
            Cheap meds. No questions asked.
          </p>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto text-gray-500 hover:text-white text-xs font-mono uppercase tracking-widest hover:underline"
      >
        [ Run Away ]
      </button>
    </div>
  );
};