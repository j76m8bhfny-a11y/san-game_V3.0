import React, { useRef, useEffect } from 'react';
import { GameEvent } from '@/types/schema';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export const MessageWindow: React.FC<{ event: GameEvent }> = ({ event }) => {
  const san = useGameStore(s => s.san);
  const chooseOption = useGameStore(s => s.chooseOption);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [event]);

  // 核心逻辑：Sanity Text Switching
  const displayText = san < 50 ? event.text.lowSan : event.text.highSan;
  
  // 🛠️ 修复：使用 'as const' 锁定 id 类型，防止 TS 推断为 string
  const options = [
    { id: 'A' as const, ...event.options.A },
    { id: 'B' as const, ...event.options.B },
    { id: 'C' as const, ...event.options.C },
    { id: 'D' as const, ...event.options.D },
  ];

  return (
    <div className="w-[95%] max-w-2xl h-[40vh] md:h-[45vh] z-10 mb-4 pointer-events-auto">
      <div className="w-full h-full glass-panel rounded-[2rem] flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-black/60 border border-white/20">
        
        {/* Fake Status Bar */}
        <div className="h-6 w-full flex justify-center items-center opacity-30 text-[10px] space-x-2 select-none border-b border-white/5">
           <span>5G</span>
           <div className="w-16 h-4 bg-black/20 rounded-full" /> 
           <span>100%</span>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
          <AnimatePresence mode='wait'>
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-end gap-3"
            >
              {/* Avatar Fallback */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex-shrink-0 border-2 border-white/20 shadow-sm overflow-hidden">
                <img 
                  src={`/assets/avatars/${event.id.split('_')[1]}.png`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </div>
              
              <div className="bg-[#E9E9EB] dark:bg-[#2C2C2E] text-black dark:text-white px-5 py-3 rounded-2xl rounded-bl-sm shadow-sm max-w-[85%] text-sm md:text-base leading-relaxed">
                <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-1">{event.title}</p>
                <p className={san < 30 ? "font-mono text-red-800 dark:text-red-300" : ""}>
                   {displayText}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white/50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10">
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt) => {
              const isLocked = false; 
              const isAwakened = opt.id === 'D';

              if (isAwakened && san > 80) return null; // 太清醒看不见 D 选项

              return (
                <button
                  key={opt.id}
                  onClick={() => chooseOption(opt.id)}
                  disabled={isLocked}
                  className={`
                    w-full py-3 px-4 rounded-xl text-sm font-medium transition-all transform active:scale-[0.98]
                    flex justify-between items-center min-h-[44px]
                    ${isAwakened 
                      ? 'bg-red-600 text-white font-serif shadow-lg shadow-red-600/20 hover:bg-red-700' 
                      : 'bg-[#007AFF] text-white shadow-lg shadow-blue-500/20 hover:bg-[#0062CC]'
                    }
                  `}
                >
                  <span className="truncate mr-2">{opt.label}</span>
                  {isAwakened ? (
                    <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-white/80 font-mono">TRUTH</span>
                  ) : (
                    <span className="text-white/60">→</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};