// src/components/game/LayeredScene.tsx

import React, { useEffect, useMemo, useState, useRef } from 'react';
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

  // ✅ 优化：使用节流减少更新频率，降低 CPU 占用
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const throttleRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (throttleRef.current) return; // 节流：如果已在等待帧中，跳过
      
      throttleRef.current = requestAnimationFrame(() => {
        const xPct = (e.clientX / window.innerWidth) - 0.5;
        const yPct = (e.clientY / window.innerHeight) - 0.5;
        setMousePos({ x: xPct * 15, y: yPct * 15 }); // 减少移动幅度
        throttleRef.current = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (throttleRef.current) cancelAnimationFrame(throttleRef.current);
    };
  }, []);
  
  // ✅ 使用简单的 transform 替代 useSpring + useTransform，大幅降低 CPU 占用
  const bgTransform = { x: -mousePos.x, y: -mousePos.y };
  const fgTransform = { x: mousePos.x * 0.3, y: mousePos.y * 0.3 };

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

  // ✅ 移除：不再使用 useSpring + useTransform，改用简单的 state + CSS transform

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      
      {/* Layer 0: Background */}
      <div 
        className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-transform duration-200 ease-out"
        style={{ 
          transform: `translate(${bgTransform.x}px, ${bgTransform.y}px)`,
          background: bgLoaded ? `url(${bgImage})` : fallbackGradient,
          filter: filterStyle,
          willChange: 'transform'
        }}
      >
        <img 
          src={bgImage} 
          className="hidden" 
          onLoad={() => setBgLoaded(true)} 
          onError={() => setBgLoaded(false)} 
        />
      </div>

      {/* Layer 1: Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      
      {/* Layer 1.5: Event Image */}
      {eventImage && (
         <div
            key={eventImage} 
            className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none transition-transform duration-200 ease-out"
            style={{ 
              transform: `translate(${fgTransform.x}px, ${fgTransform.y}px)`, 
              backgroundImage: `url(${eventImage})`, 
              zIndex: 10,
              willChange: 'transform'
            }}
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
        <div 
          className="absolute -bottom-10 left-10 w-[400px] h-[600px] bg-contain bg-no-repeat bg-bottom pointer-events-none opacity-80 transition-transform duration-200 ease-out"
          style={{ 
            transform: `translate(${fgTransform.x}px, ${fgTransform.y}px)`, 
            backgroundImage: `url(${playerImage})`, 
            zIndex: 20,
            willChange: 'transform'
          }}
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