import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import ENDINGS from '@/assets/data/endings.json';

interface GameEndingProps {
  endingId: string;
  onRestart: () => void;
}

export const GameEnding: React.FC<GameEndingProps> = ({ endingId, onRestart }) => {
  // 查找结局文案，如果找不到则显示未知
  const ending = ENDINGS.find(e => e.id === endingId) || {
    title: "UNKNOWN ENDING",
    description: "数据丢失。你处于存在的边缘。",
    type: "DEATH"
  };

  const isDeath = ending.type === 'DEATH';
  const isGood = ending.type === 'UR' || ending.type === 'STANCE';

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-8 text-center select-none">
      {/* 动态背景噪点 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('/assets/textures/noise.svg')] animate-pulse" />

      <div className="relative z-10 max-w-2xl">
        {/* 结局 ID */}
        <div className="font-mono text-gray-500 text-sm mb-4 tracking-widest">
          — CONNECTION TERMINATED: {endingId} —
        </div>

        {/* 标题 */}
        <h1 className={`text-4xl md:text-6xl font-black mb-8 tracking-tighter ${isDeath ? 'text-red-600 font-creepster' : isGood ? 'text-cyan-400 font-pixel' : 'text-white font-serif'}`}>
          {ending.title}
        </h1>

        {/* 描述文本 (打字机风格容器) */}
        <div className="bg-neutral-900/80 border-2 border-white/20 p-6 md:p-8 rounded-sm mb-12 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <p className="font-mono text-lg md:text-xl leading-relaxed text-gray-300 whitespace-pre-wrap">
            {ending.description}
          </p>
        </div>

        {/* 重启按钮 (救命稻草) */}
        <button
          onClick={onRestart}
          className="group relative px-8 py-3 bg-white text-black font-bold text-xl tracking-widest hover:bg-red-600 hover:text-white transition-all duration-200"
        >
          <span className="relative z-10">REBOOT_SYSTEM()</span>
          <div className="absolute inset-0 bg-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </button>
      </div>

      {/* 底部版权 */}
      <div className="absolute bottom-8 text-xs text-gray-700 font-mono">
        AMERICAN_INSIGHT_OS v3.1.4 // SIMULATION FAILED
      </div>
    </div>
  );
};