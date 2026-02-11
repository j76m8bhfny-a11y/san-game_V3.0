import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { FaithID } from '@/types/schema';
import { placeholderBackgrounds } from '../utils/placeholderAssets';

interface Props {
  onClose: () => void;
}

export const RustBeltChurchInterior: React.FC<Props> = ({ onClose }) => {
  const { faith, performFaithRite, addNotification } = useGameStore();
  const [isPreaching, setIsPreaching] = useState(false);

  // 假设铁锈区对应兄弟会 (BROTHERHOOD) 或者革命 (REVOLUTION)
  // 这里设定只要不是 CHURCH (Suburbs) 或 CULT (Slums)，都算半个主场，或者特定ID
  const isNative = faith.id === FaithID.BROTHERHOOD || faith.id === FaithID.REVOLUTION;

  const handleRite = () => {
    setIsPreaching(true);
    // 模拟狂热的视觉效果
    setTimeout(() => {
      performFaithRite();
      setIsPreaching(false);
    }, 2000);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-black overflow-hidden font-serif">
      
      {/* 1. 动态背景 */}
      <div 
        className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-300 
          ${isPreaching ? 'scale-110 brightness-150 blur-md' : 'scale-100 blur-sm brightness-75'}
        `}
        style={{ background: placeholderBackgrounds.rust_church_interior }}
      >
        <div className={`absolute inset-0 mix-blend-overlay opacity-50 ${isPreaching ? 'bg-red-500 animate-pulse' : 'bg-purple-900'}`} />
      </div>

      {/* 2. 前景交互物：传单/海报 */}
      <div className={`
        relative z-10 w-[360px] bg-[#f8f5e6] shadow-[0_20px_60px_rgba(0,0,0,0.5)] rotate-1 p-8 text-center
        transform transition-all duration-500
        ${isPreaching ? 'scale-105 rotate-0' : 'hover:-rotate-1'}
      `}>
        {/* 纸张纹理 */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')]" />

        <div className="border-4 border-double border-black p-4 h-full flex flex-col items-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 leading-none">
            {isNative ? 'UNION HALL' : 'THE CHAPEL'}
          </h1>
          <div className="w-full h-px bg-black mb-4" />
          
          <p className="text-sm font-bold italic mb-6">
            "{isNative ? 'Solidarity Forever!' : 'Repent, for the End is Nigh!'}"
          </p>

          {isNative ? (
            // 主场 UI
            <div className="space-y-4 w-full">
              <div className="bg-black text-[#f8f5e6] p-4 font-bold uppercase tracking-widest text-sm">
                Today's Agenda
              </div>
              <button 
                onClick={handleRite}
                disabled={isPreaching}
                className="w-full py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors uppercase text-xs"
              >
                {isPreaching ? 'CHANTING...' : 'Join the Chant (Perform Rite)'}
              </button>
            </div>
          ) : (
             // 客场 UI
            <div className="space-y-4 w-full">
              <p className="text-xs text-gray-600 leading-relaxed">
                The locals are loud, but you can find a quiet spot in the back rows to practice your own faith.
              </p>
              <button 
                onClick={handleRite}
                disabled={isPreaching}
                className="w-full py-3 border border-gray-400 text-gray-600 font-bold hover:border-black hover:text-black transition-colors uppercase text-xs"
              >
                Silent Prayer
              </button>
            </div>
          )}
          
          <div className="mt-6 text-[10px] text-gray-500 font-mono">
            Est. 1984 • Rust Belt Chapter
          </div>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/50 hover:text-white font-mono text-xs uppercase"
      >
        [Exit Building]
      </button>

    </div>
  );
};