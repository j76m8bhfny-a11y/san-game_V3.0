import React, { useEffect, useState, useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { PlayerClass } from '@/types/schema';

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
  // 从 Store 获取当前阶级
  const currentClass = useGameStore(s => s.currentClass);

  // 视差鼠标移动逻辑
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xPct = (e.clientX / innerWidth) - 0.5;
      const yPct = (e.clientY / innerHeight) - 0.5;
      x.set(xPct * 20); // 移动范围
      y.set(yPct * 20);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y]);

  // 根据阶级计算滤镜样式 (The Visual Filter)
  const classFilterStyle = useMemo(() => {
    switch (currentClass) {
      case PlayerClass.Worker:
        // 工业绿：压抑、流水线
        return 'brightness(0.8) sepia(0.5) hue-rotate(60deg) saturate(1.5)';
      case PlayerClass.Middle:
        // 虚假暖色：过曝、温馨
        return 'brightness(1.1) contrast(1.1) sepia(0.2) saturate(1.2)';
      case PlayerClass.Capitalist:
        // 冷血蓝：高冷、无情
        return 'grayscale(0.8) brightness(1.2) contrast(1.3) hue-rotate(180deg) drop-shadow(0 0 20px rgba(0,200,255,0.2))';
      case PlayerClass.Homeless:
      default:
        // 原色：肮脏现实
        return 'brightness(0.6) contrast(1.1) grayscale(0.2)';
    }
  }, [currentClass]);

  // 视差转换
  const bgX = useTransform(x, value => -value); // 背景反向移动
  const bgY = useTransform(y, value => -value);
  
  const midX = useTransform(x, value => -value * 0.5); 
  const midY = useTransform(y, value => -value * 0.5);

  const fgX = useTransform(x, value => value * 0.5); // 前景正向移动
  const fgY = useTransform(y, value => value * 0.5);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050505]">
      
      {/* 层 0: 动态背景 (应用阶级滤镜) */}
      <motion.div 
        className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-all duration-[2000ms]"
        style={{ 
          x: bgX, 
          y: bgY, 
          backgroundImage: `url(${bgImage})`,
          filter: `${classFilterStyle} ${isGlitch ? 'blur(2px)' : 'blur(0px)'}`,
        }}
      />

      {/* 层 1: 环境光遮罩 (Vignette) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#000000_100%)] opacity-80 pointer-events-none" />

      {/* 层 2: 故障效果叠加 (Glitch Overlay) */}
      {isGlitch && (
        <div className="absolute inset-0 opacity-50 mix-blend-color-dodge pointer-events-none animate-pulse">
           <div className="w-full h-full bg-[url('/assets/textures/noise.svg')]" />
        </div>
      )}
      
      {/* 层 3: 事件/人物插图 (如果有) */}
      {eventImage && (
        <motion.div
           className="absolute bottom-0 right-10 w-1/3 h-2/3 bg-contain bg-no-repeat bg-bottom opacity-80 mix-blend-hard-light"
           style={{ x: midX, y: midY, backgroundImage: `url(${eventImage})` }}
        />
      )}

      {/* 层 4: 玩家背影 (始终在最前) */}
      {playerImage && (
        <motion.div 
          className="absolute -bottom-10 left-10 w-[400px] h-[600px] bg-contain bg-no-repeat bg-bottom pointer-events-none"
          style={{ 
            x: fgX, 
            y: fgY, 
            backgroundImage: `url(${playerImage})`,
            filter: isGlitch ? 'invert(1)' : 'none'
          }}
        />
      )}
      
    </div>
  );
};