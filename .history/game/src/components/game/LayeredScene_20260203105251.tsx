// src/components/game/LayeredScene.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { BankSidebar } from './BankSidebar'; // ✅ 确保是命名导出
import { FaithSidebar } from './FaithSidebar';
import CLASSES_DATA from '@/assets/data/classes.json';

interface LayeredSceneProps {
  bgImage: string;
  eventImage?: string;
  playerImage?: string;
  isGlitch?: boolean;
}

export const LayeredScene: React.FC<LayeredSceneProps> = ({
  bgImage,
  eventImage,
  playerImage,
  isGlitch = false,
}) => {
  // ✅ 1. 路径修复：从 vitality.identity 中获取阶级
  const currentClass = useGameStore(s => s.vitality.identity.currentClass);
  
  // ✅ 2. 方法名对齐：V3.0 UISlice 统一使用 setSidebarOpen 逻辑或对应的开关
  const setFaithOpen = useGameStore(s => s.setFaithOpen);
  const setBankOpen = useGameStore(s => s.setBankOpen);

  const [bgLoaded, setBgLoaded] = useState(false);

  // 视差逻辑保持不变
  const springConfig = { damping: 30, stiffness: 200 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const xPct = (e.clientX / window.innerWidth) - 0.5;
      const yPct = (e.clientY / window.innerHeight) - 0.5;
      x.set(xPct * 20); 
      y.set(yPct * 20);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y]);

  // 查找当前阶级的数据配置
  const currentClassData = useMemo(() => {
    return (CLASSES_DATA as any[]).find(c => c.id === currentClass);
  }, [currentClass]);

  // 动态背景渐变
  const fallbackGradient = useMemo(() => {
    return currentClassData?.visualTheme?.fallbackGradient || 'linear-gradient(to bottom, #1e130c, #000000)';
  }, [currentClassData]);

  // 动态滤镜样式
  const filterStyle = useMemo(() => {
    const base = currentClassData?.visualTheme?.filter || '';
    return `${base} ${isGlitch ? 'blur(2px) contrast(2)' : ''}`;
  }, [currentClassData, isGlitch]);

  // 视差转换
  const bgX = useTransform(x, v => -v);
  const bgY = useTransform(y, v => -v);
  const fgX = useTransform(x, v => v * 0.5); 
  const fgY = useTransform(y, v => v * 0.5);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      
      {/* Layer 0: Background */}
      <motion.div 
        className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-all duration-1000"
        style={{ 
          x: bgX, y: bgY, 
          background: bgLoaded ? `url(${bgImage})` : fallbackGradient,
          filter: filterStyle
        }}
      >
        <img 
          src={bgImage} 
          className="hidden" 
          onLoad={() => setBgLoaded(true)} 
          onError={() => setBgLoaded(false)} 
        />
      </motion.div>

      {/* Layer 1: Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      
      {/* Layer 1.5: Event Image */}
      {eventImage && (
         <motion.div
            key={eventImage} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none"
            style={{ x: fgX, y: fgY, backgroundImage: `url(${eventImage})`, zIndex: 10 }}
          />
      )}

      {/* Layer 2: Glitch Overlay */}
      {isGlitch && (
        <div className="absolute inset-0 opacity-30 mix-blend-hard-light pointer-events-none animate-pulse">
           <div className="w-full h-full bg-[url('/assets/textures/noise.svg')]" />
        </div>
      )}
      
      {/* Layer 3: Player Silhouette */}
      {playerImage && (
        <motion.div 
          className="absolute -bottom-10 left-10 w-[400px] h-[600px] bg-contain bg-no-repeat bg-bottom pointer-events-none opacity-80"
          style={{ x: fgX, y: fgY, backgroundImage: `url(${playerImage})`, zIndex: 20 }}
        />
      )}

      {/* Layer 4: HUD Interaction Layer */}
      <div className="absolute top-24 right-4 z-50 flex flex-col gap-4 pointer-events-auto">
        <button 
          onClick={() => setFaithOpen(true)}
          className="w-12 h-12 bg-black/60 border border-zinc-600 hover:border-yellow-500 hover:bg-zinc-900 transition-all rounded-sm flex items-center justify-center group relative shadow-lg backdrop-blur-sm"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">👁️</span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs bg-black text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700 pointer-events-none">
            SPIRIT // 精神
          </span>
        </button>

        <button 
          onClick={() => setBankOpen(true)}
          className="w-12 h-12 bg-black/60 border border-zinc-600 hover:border-blue-500 hover:bg-zinc-900 transition-all rounded-sm flex items-center justify-center group relative shadow-lg backdrop-blur-sm"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">💳</span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs bg-black text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700 pointer-events-none">
            CREDIT // 信用
          </span>
        </button>
      </div>

      {/* Layer 5: Sidebars Render */}
      <FaithSidebar />
      <BankSidebar />
      
    </div>
  );
};