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

  // 根据 SAN 值选择文本
  const displayText = san < 50 ? event.text.lowSan : event.text.highSan;
  
  const options = [
    { id: 'A', ...event.options.A, type: 'normal' },
    { id: 'B', ...event.options.B, type: 'normal' },
    { id: 'C', ...event.options.C, type: 'normal' },
    { id: 'D', ...event.options.D, type: 'awakened' },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl h-[45vh] z-10">
      {/* 手机外壳容器 */}
      <div className="w-full h-full glass-panel rounded-[2rem] flex flex-col overflow-hidden transition-all duration-500">
        
        {/* 顶部状态栏模拟 */}
        <div className="h-6 w-full flex justify-center items-center opacity-30 text-[10px] space-x-2 select-none">
           <span>5G</span>
           <div className="w-12 h-3 bg-black/20 rounded-full" /> {/* 灵动岛 */}
           <span>100%</span>
        </div>

        {/* 聊天记录区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
          <AnimatePresence mode='wait'>
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-end gap-2"
            >
              {/* 头像 */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex-shrink-0 border border-white/20 shadow-sm" />
              
              {/* 系统消息气泡 (灰) */}
              <div className="bg-[#E9E9EB] dark:bg-[#3A3A3C] text-black dark:text-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm max-w-[85%] text-sm md:text-base leading-relaxed">
                <p className="font-bold text-xs opacity-50 mb-1 uppercase tracking-wider">{event.title}</p>
                {displayText}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部输入区 (选项) */}
        <div className="p-2 md:p-4 bg-white/50 dark:bg-black/20 border-t border-[var(--border-color)]">
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt) => {
              const isLocked = opt.type === 'locked'; // 需在 Schema 中支持 locked 状态，暂且默认 false
              const isAwakened = opt.type === 'awakened';
              const isHidden = isAwakened && san > (event.options.D.sanLock || 70); // 假设高 SAN 不可见

              if (isHidden) return null;

              return (
                <button
                  key={opt.id}
                  onClick={() => chooseOption(opt.id)}
                  disabled={isLocked}
                  className={`
                    w-full py-3 px-4 rounded-xl text-sm font-medium transition-all transform active:scale-95
                    flex justify-between items-center group
                    ${isAwakened 
                      ? 'bg-red-600 text-white font-serif shadow-red-500/30 shadow-lg hover:bg-red-700' 
                      : 'bg-[#007AFF] text-white shadow-blue-500/30 shadow-md hover:bg-[#0062CC]'
                    }
                  `}
                >
                  <span>{opt.label}</span>
                  {isAwakened ? (
                    <span className="text-xs opacity-80 font-mono">[TRUTH]</span>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-[10px]">↑</span>
                    </div>
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