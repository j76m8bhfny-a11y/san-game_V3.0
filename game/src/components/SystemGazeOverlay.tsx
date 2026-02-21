/**
 * System Gaze Overlay - 系统凝视视觉反馈
 * 
 * 随着玩家解锁更多档案，系统会'注意到'玩家
 * 表现为屏幕边缘的畸变、色差、扫描线等视觉效果
 */

import React, { useMemo, useEffect, useState } from 'react';
// System Gaze Overlay - 使用 Zustand
import { useGameStore } from '@/store/useGameStore';
import { calculateGazeIntensity } from '@/logic/systemGaze';

interface SystemGazeOverlayProps {
  children: React.ReactNode;
}

export const SystemGazeOverlay: React.FC<SystemGazeOverlayProps> = ({ children }) => {
  const { unlockedArchives } = useGameStore();
  const totalArchives = unlockedArchives?.length || 0;
  const intensity = calculateGazeIntensity(totalArchives);
  const [scanLine, setScanLine] = useState(0);
  
  // 扫描线动画
  useEffect(() => {
    if (intensity < 0.3) return;
    
    const interval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 50);
    
    return () => clearInterval(interval);
  }, [intensity]);
  
  // 根据强度计算视觉效果的样式
  const gazeStyles = useMemo(() => {
    if (intensity <= 0) return {};
    
    const baseIntensity = Math.max(0, intensity);
    
    return {
      // 边缘暗角
      vignette: {
        opacity: baseIntensity * 0.4,
        background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${baseIntensity * 0.8}) 100%)`
      },
      // 色差效果
      chromaticAberration: {
        filter: `drop-shadow(${baseIntensity * 2}px 0 0 rgba(255,0,0,${baseIntensity * 0.3})) drop-shadow(-${baseIntensity * 2}px 0 0 rgba(0,255,255,${baseIntensity * 0.3}))`
      },
      // 噪点
      noise: {
        opacity: baseIntensity * 0.15,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      },
      // 红色调
      redTint: {
        backgroundColor: `rgba(139, 0, 0, ${baseIntensity * 0.1})`,
        mixBlendMode: 'multiply' as const
      }
    };
  }, [intensity]);
  
  // 获取叙事文本
  const gazeNarrative = useMemo(() => {
    if (intensity <= 0) return null;
    if (intensity < 0.3) return "你感觉有什么东西在看着你...";
    if (intensity < 0.5) return "系统的目光正在聚焦。";
    if (intensity < 0.7) return "他们知道你是谁了。";
    if (intensity < 0.9) return "你在哪里，他们都知道。";
    return "他们已经来了。";
  }, [intensity]);
  
  // 获取颜色主题
  const gazeTheme = useMemo(() => {
    if (intensity < 0.3) return 'blue';
    if (intensity < 0.6) return 'yellow';
    return 'red';
  }, [intensity]);
  
  if (intensity <= 0) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative w-full h-full">
      {/* 子内容 */}
      <div 
        className="relative z-10 w-full h-full"
        style={intensity > 0.2 ? gazeStyles.chromaticAberration : {}}
      >
        {children}
      </div>
      
      {/* 暗角效果 */}
      <div 
        className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-1000"
        style={gazeStyles.vignette}
      />
      
      {/* 噪点效果 */}
      {intensity > 0.4 && (
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={gazeStyles.noise}
        />
      )}
      
      {/* 红色调 */}
      {intensity > 0.6 && (
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={gazeStyles.redTint}
        />
      )}
      
      {/* 扫描线 */}
      {intensity > 0.3 && (
        <div 
          className="absolute left-0 right-0 h-px pointer-events-none z-30"
          style={{
            top: `${scanLine}%`,
            background: `linear-gradient(90deg, transparent, rgba(255,50,50,${intensity * 0.5}), transparent)`,
            boxShadow: `0 0 10px rgba(255,50,50,${intensity * 0.3})`
          }}
        />
      )}
      
      {/* 数字雨效果（高强度时） */}
      {intensity > 0.7 && <DigitalRain intensity={intensity} />}
      
      {/* 凝视提示 */}
      {gazeNarrative && (
        <div 
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg
            backdrop-blur-sm border transition-all duration-500
            ${gazeTheme === 'blue' ? 'bg-blue-900/30 border-blue-500/50 text-blue-200' : ''}
            ${gazeTheme === 'yellow' ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-200' : ''}
            ${gazeTheme === 'red' ? 'bg-red-900/30 border-red-500/50 text-red-200 animate-pulse' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            {/* 眼睛图标 */}
            <svg 
              className={`w-5 h-5 ${intensity > 0.6 ? 'animate-pulse' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
            </svg>
            <span className="text-sm font-medium tracking-wide">{gazeNarrative}</span>
          </div>
          
          {/* 档案计数 */}
          <div className="text-xs mt-1 opacity-70 text-center">
            已解锁档案: {totalArchives} | 系统关注等级: {Math.round(intensity * 100)}%
          </div>
        </div>
      )}
      
      {/* 角落警告标记（高强度时） */}
      {intensity > 0.5 && (
        <>
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-red-500/50 z-40" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-red-500/50 z-40" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-red-500/50 z-40" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-red-500/50 z-40" />
        </>
      )}
    </div>
  );
};

// 数字雨组件
const DigitalRain: React.FC<{ intensity: number }> = ({ intensity }) => {
  const drops = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.2
    }));
  }, []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      {drops.map(drop => (
        <div
          key={drop.id}
          className="absolute top-0 text-red-500 font-mono text-xs"
          style={{
            left: `${drop.left}%`,
            animation: `fall ${drop.duration}s linear ${drop.delay}s infinite`,
            opacity: drop.opacity * intensity
          }}
        >
          {Math.random() > 0.5 ? '1' : '0'}
        </div>
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};

export default SystemGazeOverlay;
