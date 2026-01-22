import React, { useEffect, useMemo, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
// 1. 引入 JSON 数据源 (直接驱动 UI)
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

  // 2. 查找当前阶级的数据配置
  const currentClassData = useMemo(() => {
    return CLASSES_DATA.find(c => c.id === currentClass);
  }, [currentClass]);

  // 3. 动态背景渐变 (从 JSON 读取，不再硬编码)
  const fallbackGradient = useMemo(() => {
    // 如果 JSON 里配置了 visualTheme 就用，否则用默认的黑色渐变兜底
    return currentClassData?.visualTheme?.fallbackGradient || 'linear-gradient(to bottom, #1e130c, #000000)';
  }, [currentClassData]);

  // 4. 动态滤镜样式 (从 JSON 读取)
  const filterStyle = useMemo(() => {
    const base = currentClassData?.visualTheme?.filter || '';
    // 叠加故障效果
    return `${base} ${isGlitch ? 'blur(2px) contrast(2)' : ''}`;
  }, [currentClassData, isGlitch]);

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
      
      {/* Layer 1.5: 事件插图层 (Event Image) */}
      {eventImage && (
         <motion.div
            key={eventImage} // 确保切换图片时有淡入淡出动画
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none"
            style={{ 
              x: fgX, y: fgY, // 跟随鼠标有轻微视差
              backgroundImage: `url(${eventImage})`,
              zIndex: 10 // 确保在背景之上，玩家之下
            }}
          />
      )}

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
          style={{ x: fgX, y: fgY, backgroundImage: `url(${playerImage})`, zIndex: 20 }}
        />
      )}
    </div>
  );
};