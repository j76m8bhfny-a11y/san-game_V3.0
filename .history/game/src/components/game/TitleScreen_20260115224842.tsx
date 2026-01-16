import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore'; // 稍后实现

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const { day, resetGame } = useGameStore();
  const { playSfx, playBgm } = useAudioStore();
  
  // 检查是否有存档 (Day > 1 视为有进度)
  const hasSave = day > 1;
  const [isBooting, setIsBooting] = useState(true);

  // 模拟开机自检动画
  useEffect(() => {
    playBgm('bgm_title'); // 播放标题音乐
    const timer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleNewGame = () => {
    playSfx('sfx_click');
    if (hasSave) {
      // 简单的确认逻辑，实际项目中可以用弹窗
      if (!window.confirm('WARNING: EXISTING SIMULATION DATA WILL BE PURGED. PROCEED?')) return;
    }
    resetGame(); // 清除数据
    onStart();   // 进入游戏
  };

  const handleContinue = () => {
    playSfx('sfx_click');
    onStart();
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-mono select-none z-[9999]">
      {/* 背景动态噪点 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('/assets/textures/noise.svg')] animate-grain" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-cyan-900/10 to-black pointer-events-none" />

      {/* 装饰性 CRT 扫描线 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10" />

      {/* Booting 动画 */}
      {isBooting ? (
        <div className="text-cyan-500 text-xs md:text-sm space-y-2">
          <p>&gt; SYSTEM_BOOT_SEQUENCE_INIT...</p>
          <p>&gt; CHECKING_MEMORY... 640KB OK</p>
          <p>&gt; LOADING_HISTORY_MODULES... OK</p>
          <p className="animate-pulse">&gt; ESTABLISHING_NEURAL_LINK...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="z-20 flex flex-col items-center w-full max-w-lg p-8"
        >
          {/* Logo 区域 */}
          <div className="mb-12 text-center relative group">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 font-serif" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>
              AMERICAN<br/>INSIGHT
            </h1>
            <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100 mix-blend-color-dodge">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-red-600 blur-[2px] font-serif translate-x-[2px]">
                AMERICAN<br/>INSIGHT
              </h1>
            </div>
            <p className="mt-4 text-[10px] tracking-[0.5em] text-cyan-500 uppercase">
              Ver 5.0 Diamond Master
            </p>
          </div>

          {/* 菜单按钮 */}
          <div className="flex flex-col gap-4 w-full md:w-64">
            <button
              onClick={handleContinue}
              disabled={!hasSave}
              className={`py-3 px-6 border-2 font-bold tracking-widest transition-all duration-200 
                ${hasSave 
                  ? 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                  : 'border-gray-800 text-gray-800 cursor-not-allowed'
                }`}
            >
              CONTINUE
            </button>

            <button
              onClick={handleNewGame}
              className="py-3 px-6 border-2 border-white text-white hover:bg-white hover:text-black font-bold tracking-widest transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            >
              NEW GAME
            </button>

            <div className="mt-8 text-center">
              <p className="text-[10px] text-gray-600">
                © 2024 AMERICAN INSIGHT CORP.<br/>
                "If life deceives you, it's because you didn't read the EULA."
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};