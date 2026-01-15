import React from 'react';
import { motion } from 'framer-motion';

interface LayeredSceneProps {
  bgImage: string;      // 环境背景图 URL
  eventImage: string;   // 事件主体图 URL
  playerImage: string;  // 玩家背影图 URL
  isGlitch: boolean;    // 是否处于低 SAN 状态
}

export const LayeredScene: React.FC<LayeredSceneProps> = ({ bgImage, eventImage, playerImage, isGlitch }) => {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden border-b-4 border-neutral-800 bg-black">
      
      {/* Layer 1: 背景 (缓慢推拉，营造电影感) */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})`, filter: isGlitch ? 'hue-rotate(90deg) contrast(1.2)' : 'none' }}
        animate={{ scale: [1, 1.05, 1], x: [0, -10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* 像素网点遮罩 (Dithering) - PC98 质感核心 */}
      <div className="absolute inset-0 bg-[url('/assets/textures/dither-pattern.png')] opacity-10 pointer-events-none mix-blend-overlay" />

      {/* Layer 3: 事件主体 (呼吸动画 + 故障效果) */}
      <motion.div 
        className={`absolute right-[15%] bottom-[10%] w-64 h-64 bg-contain bg-no-repeat bg-center ${isGlitch ? 'mix-blend-hard-light' : ''}`}
        style={{ backgroundImage: `url(${eventImage})` }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 低 SAN 时的额外故障层 */}
        {isGlitch && (
          <div className="absolute inset-0 bg-inherit animate-pulse opacity-50 translate-x-1" style={{ filter: 'blur(2px)' }} />
        )}
      </motion.div>

      {/* Layer 2: 玩家背影 (独立的呼吸节奏，建立在场感) */}
      <motion.div 
        className="absolute left-0 bottom-[-20px] w-56 h-56 bg-contain bg-no-repeat bg-bottom origin-bottom-left"
        style={{ backgroundImage: `url(${playerImage})` }}
        animate={{ y: [0, -3, 0], scale: [1, 1.01, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} 
      />
      
    </div>
  );
};
