import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID, NoviceActionType } from '@/types/schema';
import { placeholderBackgrounds } from '../utils/placeholderAssets';

interface Props {
  onClose: () => void;
}

export const DowntownLodgeInterior: React.FC<Props> = ({ onClose }) => {
  const { vitality, performNoviceAction, performFaithRite, getFaithMode } = useGameStore();
  const [isSigning, setIsSigning] = useState(false);
  const [progress, setProgress] = useState(0);

  const mode = getFaithMode(RegionID.Downtown);

  // === 长按逻辑 (仅用于信徒仪式) ===
  const handleMouseDown = () => {
    if (mode !== 'NATIVE') return;
    setIsSigning(true);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          performFaithRite();
          return 100;
        }
        return prev + 5;
      });
    }, 50);
    // @ts-ignore
    window._signInterval = interval;
  };
  const handleMouseUp = () => {
    setIsSigning(false);
    setProgress(0);
    // @ts-ignore
    if (window._signInterval) clearInterval(window._signInterval);
  };

  // === 新手逻辑 ===
  const handleNoviceClick = (type: NoviceActionType) => {
      performNoviceAction(type);
      if (type === NoviceActionType.REJECT) onClose();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-[#0a0a0a] overflow-hidden">
      
      {/* 背景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
        style={{ background: placeholderBackgrounds.downtown_lodge_interior }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* 核心交互：名册 */}
      <div className={`
        relative z-10 w-[500px] min-h-[600px] bg-[#1a1510] shadow-[0_0_50px_rgba(0,0,0,0.8)]
        border-t border-[#d4af37]/30 flex flex-col items-center p-12 text-[#d4af37] font-serif
        transition-transform duration-500
        ${isSigning ? 'scale-[1.02]' : 'scale-100'}
      `}>
        <div className="absolute top-4 left-4 right-4 bottom-4 border border-[#d4af37]/20 pointer-events-none" />
        
        <h2 className="text-2xl tracking-[0.3em] uppercase mb-4 border-b border-[#d4af37]/30 pb-4">
          {mode === 'NOVICE' ? 'Letter of Intent' : (mode === 'NATIVE' ? 'The Covenant' : 'Guest Registry')}
        </h2>

        {/* === 新手模式：意向书条款 === */}
        {mode === 'NOVICE' && (
            <div className="w-full flex-1 flex flex-col justify-center gap-6">
                <p className="text-xs opacity-60 italic text-center mb-4">
                    "Select the clause that aligns with your ambition."
                </p>
                
                {/* 条款 1: Membership Fee (奉献) */}
                <button 
                    onClick={() => handleNoviceClick(NoviceActionType.DEDICATE)}
                    className="w-full border border-[#d4af37]/30 p-4 hover:bg-[#d4af37]/10 transition-colors text-left group"
                >
                    <div className="text-xs text-[#d4af37] font-bold uppercase tracking-widest group-hover:text-white">I. Membership Fee</div>
                    <div className="text-[10px] opacity-60 mt-1">Pay initiation dues ($50).</div>
                </button>

                {/* 条款 2: Networking (互助) */}
                <button 
                    onClick={() => handleNoviceClick(NoviceActionType.AID)}
                    className="w-full border border-[#d4af37]/30 p-4 hover:bg-[#d4af37]/10 transition-colors text-left group"
                >
                    <div className="text-xs text-[#d4af37] font-bold uppercase tracking-widest group-hover:text-white">II. Info Exchange</div>
                    <div className="text-[10px] opacity-60 mt-1">Trade labor for contacts.</div>
                </button>

                {/* 条款 3: Liability (献祭) */}
                <button 
                    onClick={() => handleNoviceClick(NoviceActionType.SACRIFICE)}
                    className="w-full border border-[#d4af37]/30 p-4 hover:bg-[#d4af37]/10 transition-colors text-left group"
                >
                    <div className="text-xs text-[#d4af37] font-bold uppercase tracking-widest group-hover:text-white">III. Liability Waiver</div>
                    <div className="text-[10px] opacity-60 mt-1">Accept physical risks for profit.</div>
                </button>

                 <div className="mt-auto w-full text-center">
                    <button 
                        onClick={() => handleNoviceClick(NoviceActionType.REJECT)}
                        className="text-[10px] font-mono opacity-40 hover:opacity-100 hover:text-red-500 uppercase tracking-widest"
                    >
                        [ Refuse to Sign ]
                    </button>
                 </div>
            </div>
        )}

        {/* === 信徒模式：血契 === */}
        {mode === 'NATIVE' && (
            <div className="w-full h-full flex flex-col justify-between">
                <p className="text-sm opacity-70 leading-loose italic text-center">
                    "Power is not given, it is taken. By signing, you reaffirm your oath to the Order."
                </p>
                <div 
                  className="relative w-full h-24 border border-[#d4af37]/30 flex items-center justify-center cursor-pointer hover:bg-[#d4af37]/5 transition-colors group mt-auto"
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <span className="text-sm tracking-widest uppercase opacity-80 group-hover:opacity-100">
                    {progress >= 100 ? "OATH RENEWED" : "HOLD TO SIGN"}
                  </span>
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-[#d4af37] transition-all duration-75 ease-linear" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
            </div>
        )}

        {/* === 客场模式：登记簿 === */}
        {mode === 'GUEST' && (
             <div className="w-full h-full flex flex-col justify-center items-center">
                 <p className="text-xs opacity-50 mb-8 text-center">
                     "Guests may register their presence, but the inner sanctum is barred."
                 </p>
                 <button 
                    onClick={() => performFaithRite()}
                    className="border border-gray-600 px-8 py-3 text-xs uppercase tracking-widest hover:border-[#d4af37] hover:text-[#d4af37]"
                 >
                     Sign Guestbook
                 </button>
             </div>
        )}

      </div>

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-[#d4af37]/50 hover:text-[#d4af37] text-[10px] font-mono uppercase tracking-[0.2em]"
      >
        Withdraw
      </button>

    </div>
  );
};