import React, { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import ENDINGS from '@/assets/data/endings.json';
import { motion } from 'framer-motion';

interface GameEndingProps {
  endingId: string;
  onRestart: () => void;
}

export const GameEnding: React.FC<GameEndingProps> = ({ endingId, onRestart }) => {
  const { stopBgm, playSfx } = useAudioStore();
  
  const ending = ENDINGS.find(e => e.id === endingId) || {
    title: "UNKNOWN_FATE",
    description: "数据丢失。你处于存在的边缘。",
    type: "DEATH"
  };

  const isDeath = ending.type === 'DEATH';
  const isGood = ending.type === 'UR' || ending.type === 'STANCE';

  // 进场处理
  useEffect(() => {
    stopBgm();
    if (isDeath) {
      playSfx('sfx_glitch');
    } else {
      // 可以在这里播放胜利/结局BGM
    }
  }, [isDeath, stopBgm, playSfx]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      
      {/* 背景动态 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/textures/noise.svg')] animate-grain" />
      {isDeath && <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay animate-pulse" />}

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 max-w-xl w-full"
      >
        {/* 结局代号 */}
        <div className="font-mono text-gray-500 text-xs md:text-sm mb-6 tracking-[0.5em] border-b border-gray-800 pb-2">
          ENDPOINT: {endingId}
        </div>

        {/* 标题 */}
        <h1 className={`text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none
          ${isDeath ? 'text-red-600 font-creepster drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 
            isGood ? 'text-cyan-400 font-pixel drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 
            'text-white font-serif'}
        `}>
          {ending.title}
        </h1>

        {/* 描述文本框 */}
        <div className="bg-[#111] border border-gray-800 p-6 md:p-10 rounded-sm mb-12 shadow-2xl relative group">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-500" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-500" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-500" />
          
          <p className="font-mono text-base md:text-lg leading-relaxed text-gray-300 whitespace-pre-wrap text-justify">
            {ending.description}
          </p>
        </div>

        {/* 重启按钮 */}
        <button
          onClick={() => { playSfx('sfx_click'); onRestart(); }}
          className={`
            group relative px-10 py-4 font-bold text-lg tracking-widest transition-all duration-300 overflow-hidden
            ${isDeath ? 'bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-800' : 
              'bg-white text-black hover:bg-gray-200'}
          `}
        >
          <span className="relative z-10">{isDeath ? 'RESPAWN_REQUEST()' : 'REBOOT_SYSTEM()'}</span>
          {/* 故障扫描线动画 */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/50 animate-[scan_2s_linear_infinite] opacity-0 group-hover:opacity-100" />
        </button>
      </motion.div>

      {/* 底部版权 */}
      <div className="absolute bottom-6 text-[9px] text-gray-700 font-mono uppercase">
        Simulation Terminated // {new Date().getFullYear()}
      </div>
    </div>
  );
};