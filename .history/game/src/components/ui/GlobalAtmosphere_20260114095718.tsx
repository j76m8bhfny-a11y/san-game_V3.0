import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

// --- 子组件：注视的眼睛 (已修复 Hydration Mismatch) ---
const EyeElement = ({ index }: { index: number }) => {
  // 🔒 使用 useMemo 锁定随机值，防止客户端与服务端渲染不一致
  const styleConfig = useMemo(() => {
    return {
      top: Math.floor(Math.random() * 80) + 10 + '%',
      left: Math.floor(Math.random() * 80) + 10 + '%',
      delay: Math.random() * 5,
      repeatDelay: Math.random() * 10
    };
  }, []); 

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 0.5] }}
      transition={{ 
        duration: 0.2, 
        delay: styleConfig.delay, 
        repeat: Infinity, 
        repeatDelay: styleConfig.repeatDelay 
      }}
      style={{ top: styleConfig.top, left: styleConfig.left }}
      className="absolute w-12 h-6 border-2 border-red-500 rounded-full flex items-center justify-center pointer-events-none blur-[1px]"
    >
      <div className="w-2 h-2 bg-red-500 rounded-full" />
    </motion.div>
  );
};

// --- 主组件 ---
export const GlobalAtmosphere: React.FC = () => {
  const san = useGameStore((state) => state.san);
  const isMadness = san > 70; // 疯癫状态
  const isDelusion = san < 30; // 蓝药丸幻觉状态

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden w-screen h-screen">
      
      {/* 1. 动态背景层 (根据 SAN 值变色/蠕动) */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${isMadness ? 'bg-neutral-900' : isDelusion ? 'bg-blue-50' : 'bg-neutral-800'}`} />
      
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0], opacity: isMadness ? 0.3 : 0.1 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className={`absolute -top-1/2 -left-1/2 w-[200vw] h-[200vw] rounded-[40%] blur-[100px] ${isMadness ? 'bg-red-900' : isDelusion ? 'bg-blue-200' : 'bg-neutral-700'}`}
      />

      {/* 2. 精神污染层 (眼球) */}
      <AnimatePresence>
        {isMadness && (
          <div className="absolute inset-0">
             {[...Array(5)].map((_, i) => <EyeElement key={i} index={i} />)}
          </div>
        )}
      </AnimatePresence>

      {/* 3. CRT 滤镜层 (始终存在) */}
      {/* 扫描线 */}
      <div className="absolute inset-0 bg-scanlines bg-[length:100%_4px] animate-scanline opacity-20" />
      {/* 暗角 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.8)_100%)]" />
      {/* RGB 色差边缘 */}
      <div className="absolute inset-0 opacity-20 mix-blend-screen shadow-[inset_0_0_20px_rgba(255,0,0,0.5),inset_2px_0_5px_rgba(0,0,255,0.5)]" />
      
      {/* 4. 噪点 (SVG Filter 性能优化版) */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="h-full w-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

    </div>
  );
};