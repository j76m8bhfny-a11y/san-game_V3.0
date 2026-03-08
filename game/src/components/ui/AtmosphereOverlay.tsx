/**
 * AtmosphereOverlay - Sigmoid死亡悬崖视觉压迫系统
 * 
 * 当玩家资源跌破危险阈值时，屏幕产生物理层面的改变：
 * - HP低：血红暗角 + 心跳震动
 * - 灵视低：黑色扭曲 + 文字乱码
 * - 饥饿高：发黄变灰 + 胃部图标抽搐
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

// 危险阈值配置（与survivalModel.ts保持一致）
const DANGER_THRESHOLDS = {
  hp: 0.25,        // HP < 25%
  insight: 0.30,   // 灵视 < 30%
  hunger: 0.75,    // 饥饿度 > 75%
};

interface AtmosphereState {
  hpCritical: boolean;
  insightCritical: boolean;
  hungerCritical: boolean;
}

interface HeartbeatParams {
  duration: number;
  scale: number;
  vignetteOpacity: number;
}

/**
 * 计算心跳动画参数
 * HP越低，心跳越快越强烈
 */
const getHeartbeatParams = (hpPercent: number): HeartbeatParams | null => {
  if (hpPercent > DANGER_THRESHOLDS.hp) return null;
  
  const intensity = 1 - (hpPercent / DANGER_THRESHOLDS.hp); // 0~1
  return {
    duration: 1.2 - (intensity * 0.6),     // 1.2s → 0.6s
    scale: 1 + (intensity * 0.02),         // 轻微缩放
    vignetteOpacity: 0.3 + (intensity * 0.4), // 暗角加深
  };
};

/**
 * 获取滤镜组合
 */
const getFilterStyle = (state: AtmosphereState): string => {
  const filters: string[] = [];
  
  if (state.hpCritical) {
    filters.push('contrast(1.15) saturate(1.2)');
  }
  
  if (state.insightCritical) {
    filters.push('blur(0.3px) grayscale(0.2)');
  }
  
  if (state.hungerCritical) {
    filters.push('sepia(0.3) brightness(0.92)');
  }
  
  return filters.join(' ') || 'none';
};

/**
 * 血红暗角组件
 */
const RedVignette: React.FC<{ opacity: number; pulse: boolean }> = ({ 
  opacity, 
  pulse 
}) => (
  <motion.div
    className="absolute inset-0 pointer-events-none z-40"
    style={{
      background: `radial-gradient(ellipse at center, transparent 40%, rgba(139, 0, 0, ${opacity}) 100%)`,
    }}
    animate={pulse ? {
      opacity: [opacity, opacity * 1.3, opacity],
    } : {}}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

/**
 * 黑色扭曲滤镜组件（灵视低）
 */
const DistortionOverlay: React.FC = () => {
  const [offset, setOffset] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(Math.random() * 4 - 2); // -2px ~ 2px
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* 边缘黑色侵蚀 */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.6) 100%)`,
          transform: `scale(${1 + Math.abs(offset) * 0.01})`,
          transition: 'transform 2s ease-out',
        }}
      />
      
      {/* 蠕动边缘效果 */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <defs>
          <filter id="turbulence">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.01" 
              numOctaves="3" 
              result="noise"
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="10" 
              xChannelSelector="R" 
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="black" 
          filter="url(#turbulence)"
          opacity="0.3"
        />
      </svg>
    </div>
  );
};

/**
 * 饥饿黄化滤镜
 */
const HungerTint: React.FC = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none z-40"
    style={{
      background: 'linear-gradient(to bottom, rgba(255, 200, 100, 0.1) 0%, rgba(100, 80, 50, 0.15) 100%)',
      mixBlendMode: 'multiply',
    }}
    animate={{
      opacity: [0.8, 1, 0.8],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

/**
 * 主组件：AtmosphereOverlay
 */
export const AtmosphereOverlay: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { vitality } = useGameStore();
  
  const metrics = useMemo(() => ({
    hpPercent: vitality.metrics.hp / vitality.metrics.maxHp,
    insightPercent: vitality.metrics.insight / vitality.metrics.maxInsight,
    hungerPercent: vitality.metrics.hunger / vitality.metrics.maxHunger,
  }), [vitality.metrics]);
  
  // 计算危险状态
  const dangerState: AtmosphereState = useMemo(() => ({
    hpCritical: metrics.hpPercent <= DANGER_THRESHOLDS.hp,
    insightCritical: metrics.insightPercent <= DANGER_THRESHOLDS.insight,
    hungerCritical: metrics.hungerPercent >= DANGER_THRESHOLDS.hunger,
  }), [metrics]);
  
  // 计算心跳参数
  const heartbeatParams = useMemo(() => 
    getHeartbeatParams(metrics.hpPercent),
    [metrics.hpPercent]
  );
  
  // 滤镜样式
  const filterStyle = useMemo(() => 
    getFilterStyle(dangerState),
    [dangerState]
  );
  
  // 是否有任何危险状态
  const isDangerous = dangerState.hpCritical || 
                      dangerState.insightCritical || 
                      dangerState.hungerCritical;
  
  return (
    <div className="relative w-full h-full">
      {/* 主内容区（应用滤镜） */}
      <div 
        className="w-full h-full transition-all duration-500"
        style={{ filter: filterStyle }}
      >
        {children}
      </div>
      
      {/* 危险状态覆盖层 */}
      <AnimatePresence mode="wait">
        {isDangerous && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* HP危险：血红暗角 + 心跳 */}
            {dangerState.hpCritical && heartbeatParams && (
              <RedVignette 
                opacity={heartbeatParams.vignetteOpacity}
                pulse={true}
              />
            )}
            
            {/* 灵视危险：黑色扭曲 */}
            {dangerState.insightCritical && <DistortionOverlay />}
            
            {/* 饥饿危险：黄化滤镜 */}
            {dangerState.hungerCritical && <HungerTint />}
            
            {/* 复合危险：额外增强效果 */}
            {(dangerState.hpCritical && dangerState.insightCritical) && (
              <motion.div
                className="absolute inset-0 z-50"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
                }}
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AtmosphereOverlay;
