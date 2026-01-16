import React, { useEffect, useMemo, useState } from 'react';
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
  const currentClass = useGameStore(s => s.currentClass);
  const [bgLoaded, setBgLoaded] = useState(false);

  // 视差逻辑
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

  // 根据阶级生成的 CSS 渐变兜底 (Fallback Gradients)
  const fallbackGradient = useMemo(() => {
    switch (currentClass) {
      case PlayerClass.Worker: // 工业灰/绿
        return 'linear-gradient(to bottom, #2C3E50, #000000)';
      case PlayerClass.Middle: // 虚假暖光
        return 'linear-gradient(to bottom, #FFEEEE, #DDEFBB)';
      case PlayerClass.Capitalist: // 冷血蓝金
        return 'linear-gradient(to bottom, #141E30, #243B55)';
      case PlayerClass.Homeless: // 肮脏街头
      default:
        return 'linear-gradient(to bottom, #1e130c, #000000)';
    }
  }, [currentClass]);

  // 滤镜样式
  const filterStyle = useMemo(() => {
    let base = '';
    if (currentClass === PlayerClass.Worker) base = 'sepia(0.5) hue-rotate(60deg)';
    if (currentClass === PlayerClass.Middle) base = 'contrast(1.1) brightness(1.1)';
    if (currentClass === PlayerClass.Capitalist) base = 'contrast(1.2) hue-rotate(180deg)';
    
    return `${base} ${isGlitch ? 'blur(2px) contrast(2)' : ''}`;
  }, [currentClass, isGlitch]);

  // 转换
  const bgX = useTransform(x, v => -v);
  const bgY = useTransform(y, v => -v);
  const fgX = useTransform(x, v => v * 0.5); 
  const fgY = useTransform(y, v => v * 0.5);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      
      {/* Layer 0: Background (Image or Gradient Fallback) */}
      <motion.div 
        className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-all duration-1000"
        style={{ 
          x: bgX, y: bgY, 
          background: bgLoaded ? `url(${bgImage})` : fallbackGradient,
          filter: filterStyle
        }}
      >
        {/* 隐藏的 img 标签用于触发 onLoad */}
        <img 
          src={bgImage} 
          className="hidden" 
          onLoad={() => setBgLoaded(true)} 
          onError={() => setBgLoaded(false)} // 失败则保持渐变
        />
      </motion.div>

      {/* Layer 1: Vignette & Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      {/* Layer 2: Glitch Overlay */}
      {isGlitch && (
        <div className="absolute inset-0 opacity-30 mix-blend-hard-light pointer-events-none animate-pulse">
           <div className="w-full h-full bg-[url('/assets/textures/noise.svg')]" />
        </div>
      )}
      
      {/* Layer 3: Player Silhouette (Fallback to none if missing) */}
      {playerImage && (
        <motion.div 
          className="absolute -bottom-10 left-10 w-[400px] h-[600px] bg-contain bg-no-repeat bg-bottom pointer-events-none opacity-80"
          style={{ x: fgX, y: fgY, backgroundImage: `url(${playerImage})` }}
        />
      )}
    </div>
  );
};