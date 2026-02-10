import React, { useState } from 'react';

interface Props {
  onEnter: () => void;
  onClose: () => void;
}

export const SlumsBankExterior: React.FC<Props> = ({ onEnter, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-sans">
      
      {/* 1. 场景：街角当铺 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: "url('/assets/bank/slums_bank_exterior.jpg')",
          filter: isHovered ? 'brightness(1.1) contrast(1.2)' : 'brightness(0.7) sepia(0.4)'
        }}
      >
        <div className="absolute inset-0 bg-yellow-900/20 mix-blend-multiply" />
      </div>

      {/* 2. 霓虹灯招牌 (故障效果) */}
      <div className="absolute top-1/4 right-10 transform rotate-6">
        <div className="border-4 border-yellow-600 bg-black/80 p-4 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
          <h1 className="text-5xl font-black text-yellow-500 tracking-tighter uppercase font-mono flex gap-2">
            <span className={isHovered ? 'animate-pulse' : 'opacity-50'}>PAWN</span>
            <span className="text-white">&</span>
            <span className="animate-flicker text-red-500">LOAN</span>
          </h1>
          <div className="mt-2 flex justify-between text-[10px] text-yellow-200 font-bold bg-red-900 px-2">
            <span>WE BUY GOLD</span>
            <span>NO ID NEEDED</span>
          </div>
        </div>
      </div>

      {/* 3. 交互区：铁栅栏门 */}
      <div 
        className="absolute inset-0 top-1/3 flex items-center justify-center z-10 cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onEnter}
      >
        <div className={`
          relative w-64 h-80 border-4 border-gray-700 bg-black/40 backdrop-blur-sm
          flex items-center justify-center transition-all duration-300
          ${isHovered ? 'border-yellow-600 bg-black/60 scale-105' : ''}
        `}>
          {/* 铁网纹理 */}
          <div className="absolute inset-0 bg-[url('/assets/fx/chainlink_fence.png')] opacity-80 pointer-events-none" />
          
          <div className={`
            bg-yellow-500 text-black font-black text-xl px-4 py-2 transform -rotate-12 border-2 border-white
            transition-transform duration-200
            ${isHovered ? 'rotate-0 scale-110' : ''}
          `}>
            GET CASH NOW!
          </div>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="relative z-20 self-center mt-auto text-gray-500 hover:text-white text-xs font-mono uppercase tracking-widest bg-black/50 px-2 py-1"
      >
        [ Don't go in ]
      </button>
    </div>
  );
};