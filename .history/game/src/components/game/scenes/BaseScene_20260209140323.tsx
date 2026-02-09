import React, { useRef, useEffect } from 'react';

interface BaseSceneProps {
  children: React.ReactNode;
  className?: string;
  // 基础视差强度 (0-1), 值越大移动幅度越大
  intensity?: number; 
}

export const BaseScene: React.FC<BaseSceneProps> = ({ children, className = '', intensity = 1 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { innerWidth } = window;
      // 计算鼠标相对于屏幕中心的偏移量 (-0.5 到 0.5)
      const xOffset = (e.clientX / innerWidth) - 0.5;
      
      // 更新 CSS 变量
      containerRef.current.style.setProperty('--mouse-x', xOffset.toString());
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full overflow-hidden bg-black select-none ${className}`}
      style={{ '--scene-intensity': intensity } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

// 视差层组件：包裹图片使用
// depth: 0 (不动) ~ 1.0 (移动最快/最近)
export const ParallaxLayer: React.FC<{
  depth: number; 
  children: React.ReactNode;
  className?: string;
}> = ({ depth, children, className = '' }) => {
  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out will-change-transform ${className}`}
      style={{
        // 核心公式：偏移量 = 鼠标位置 * 深度 * 基础强度 * 像素系数
        transform: `translateX(calc(var(--mouse-x, 0) * ${depth * -150}px))`
      }}
    >
      {children}
    </div>
  );
};