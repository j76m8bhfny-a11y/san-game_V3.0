import React, { useState, useEffect } from 'react';

interface Props {
  sanity: number;
  onSignPact: () => void;
  onClose: () => void;
}

export const DowntownLodgeInterior: React.FC<Props> = ({ sanity, onSignPact, onClose }) => {
  const [isSigning, setIsSigning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasSigned, setHasSigned] = useState(false);

  // 长按签字逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSigning && !hasSigned) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setHasSigned(true);
            onSignPact();
            return 100;
          }
          return prev + 2; // 签字速度
        });
      }, 30);
    } else if (!isSigning && !hasSigned) {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isSigning, hasSigned, onSignPact]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-[#050505] overflow-hidden">
      
      {/* 1. 背景：阴暗的会议室 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
        style={{ 
          backgroundImage: "url('/assets/faith/downtown_lodge_interior.jpg')",
        }}
      >
        {/* 烛光摇曳效果 */}
        <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-orange-500/5 blur-[100px] animate-pulse-slow" />
      </div>

      {/* 2. 核心交互物：名册 (The Ledger) */}
      <div className="relative z-10 w-[500px] h-[600px] perspective-1000">
        <div className={`
          relative w-full h-full bg-[#1a120b] shadow-[0_20px_50px_rgba(0,0,0,0.8)] 
          border-l-[20px] border-[#0f0a06] rounded-r-lg p-12 flex flex-col
          transition-transform duration-500
          ${isSigning ? 'scale-[1.02] rotate-x-5' : 'scale-100'}
        `}>
          {/* 纸张纹理 */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-80 mix-blend-overlay rounded-r-lg" />
          
          {/* 页面内容 */}
          <div className="relative z-10 text-[#d4af37] font-serif flex flex-col h-full text-center">
            <h1 className="text-3xl border-b border-[#d4af37]/30 pb-4 mb-6 tracking-widest uppercase">The Covenant</h1>
            
            <p className="text-sm leading-loose italic opacity-80 mb-8 text-justify">
              "By signing this ledger, I hereby pledge my allegiance to the Order. 
              I sacrifice my mortal conscience for the burden of power. 
              Chaos is a ladder, and I shall ascend."
            </p>

            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="text-xs text-red-900 font-bold uppercase tracking-widest">
                Cost: -20 Max Sanity
              </div>
              <div className="text-xs text-[#d4af37] font-bold uppercase tracking-widest">
                Gain: Influence & Insider Info
              </div>
            </div>

            {/* 签字区域 */}
            <div 
              className="mt-auto relative w-full h-32 border-b-2 border-[#d4af37]/50 flex items-end justify-center cursor-pointer group"
              onMouseDown={() => !hasSigned && setIsSigning(true)}
              onMouseUp={() => setIsSigning(false)}
              onMouseLeave={() => setIsSigning(false)}
              onTouchStart={() => !hasSigned && setIsSigning(true)}
              onTouchEnd={() => setIsSigning(false)}
            >
              {!hasSigned ? (
                <>
                  <div className="text-gray-500 text-xs mb-2 group-hover:text-[#d4af37] transition-colors">
                    {isSigning ? "Signing..." : "Hold to Sign in Blood"}
                  </div>
                  {/* 钢笔图标跟随光标 (简化为固定显示) */}
                  <div className={`
                    absolute bottom-4 right-10 text-4xl transition-transform duration-200
                    ${isSigning ? 'translate-x-[-50px] rotate-[-45deg]' : 'rotate-0'}
                  `}>
                    ✒️
                  </div>
                  
                  {/* 进度条 (墨迹/血迹) */}
                  <div className="absolute bottom-0 left-0 h-1 bg-red-900 transition-all duration-75" style={{ width: `${progress}%` }} />
                </>
              ) : (
                <div className="text-red-700 font-handwriting text-4xl rotate-[-5deg] animate-stamp">
                  Signed.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 旁观者 (Shadow Figures) */}
      <div className="absolute inset-0 pointer-events-none flex justify-between items-center px-20">
        <div className="w-32 h-64 bg-black/80 blur-xl rounded-full opacity-60 animate-pulse-slow" />
        <div className="w-32 h-64 bg-black/80 blur-xl rounded-full opacity-60 animate-pulse-slow delay-500" />
      </div>

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-gray-600 hover:text-[#d4af37] font-serif italic"
      >
        Leave quietly
      </button>

    </div>
  );
};