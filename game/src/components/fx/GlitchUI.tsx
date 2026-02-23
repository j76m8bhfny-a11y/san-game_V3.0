/**
 * GlitchUI - UI污染效果组件
 * 
 * System Gaze强度增加时，干净的UI开始出现"故障艺术"
 * - 按钮偶尔错位闪烁
 * - 文字里夹杂乱码
 * - 随机触发频率基于Gaze强度
 * 
 * 0.8-1.0强度：随机30%触发全面故障
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';


// 乱码字符集
const GLITCH_CHARS = '█▓▒░▼▲◆■●★☆✦✧⌂⌘⌥⎋⏎␣␤␥␦¿¡¤¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿';

interface GlitchUIProps {
  // System Gaze强度 (0-1)
  intensity: number;
  // 子元素
  children: React.ReactNode;
}

/**
 * 根据强度计算触发概率
 */
const getGlitchChance = (intensity: number): number => {
  if (intensity < 0.2) return 0.05;   // 5%
  if (intensity < 0.4) return 0.10;   // 10%
  if (intensity < 0.6) return 0.20;   // 20%
  if (intensity < 0.8) return 0.25;   // 25%
  return 0.30;                         // 30%（用户要求）
};

/**
 * 文本乱码Hook
 */
export const useTextCorruption = (intensity: number) => {
  const corruptText = useCallback((text: string, corruptionLevel: number = 0.1): string => {
    if (intensity < 0.2) return text;
    
    // 根据强度决定是否乱码
    const glitchChance = getGlitchChance(intensity);
    if (Math.random() > glitchChance) return text;
    
    return text.split('').map(char => {
      if (char === ' ') return ' ';
      if (Math.random() < corruptionLevel * intensity) {
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
      return char;
    }).join('');
  }, [intensity]);
  
  return { corruptText };
};

/**
 * 随机位移Hook
 */
export const useRandomOffset = (intensity: number) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (intensity < 0.2) {
      setOffset({ x: 0, y: 0 });
      return;
    }
    
    const chance = getGlitchChance(intensity);
    
    const interval = setInterval(() => {
      if (Math.random() < chance) {
        // 位移幅度随强度增加
        const maxOffset = intensity < 0.5 ? 2 : intensity < 0.8 ? 4 : 6;
        setOffset({
          x: (Math.random() - 0.5) * maxOffset,
          y: (Math.random() - 0.5) * maxOffset,
        });
        
        // 快速复位
        setTimeout(() => {
          setOffset({ x: 0, y: 0 });
        }, 100 + Math.random() * 200);
      }
    }, 1000 + Math.random() * 2000);
    
    return () => clearInterval(interval);
  }, [intensity]);
  
  return offset;
};

/**
 * 闪烁效果Hook
 */
export const useFlicker = (intensity: number) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (intensity < 0.4) {
      setIsVisible(true);
      return;
    }
    
    const chance = getGlitchChance(intensity) * 0.5; // 闪烁概率更低
    
    const interval = setInterval(() => {
      if (Math.random() < chance) {
        setIsVisible(false);
        setTimeout(() => setIsVisible(true), 50 + Math.random() * 100);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [intensity]);
  
  return isVisible;
};

/**
 * 故障文字组件
 */
export const GlitchText: React.FC<{
  children: string;
  intensity: number;
  className?: string;
}> = ({ children, intensity, className = '' }) => {
  const { corruptText } = useTextCorruption(intensity);
  const [displayText, setDisplayText] = useState(children);
  const offset = useRandomOffset(intensity);
  const isVisible = useFlicker(intensity);
  
  useEffect(() => {
    if (intensity < 0.2) {
      setDisplayText(children);
      return;
    }
    
    // 定期尝试乱码
    const interval = setInterval(() => {
      const corrupted = corruptText(children, 0.15);
      setDisplayText(corrupted);
      
      // 一段时间后恢复
      if (corrupted !== children) {
        setTimeout(() => {
          setDisplayText(children);
        }, 500 + Math.random() * 1000);
      }
    }, 3000 + Math.random() * 2000);
    
    return () => clearInterval(interval);
  }, [children, intensity, corruptText]);
  
  return (
    <motion.span
      className={`inline-block ${className} ${intensity > 0.6 ? 'select-none' : ''}`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        opacity: isVisible ? 1 : 0,
      }}
      animate={intensity > 0.8 ? {
        textShadow: [
          'none',
          '2px 0 0 rgba(255,0,0,0.3), -2px 0 0 rgba(0,255,255,0.3)',
          'none',
        ],
      } : {}}
      transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 5 }}
    >
      {displayText}
    </motion.span>
  );
};

/**
 * 故障按钮包装器
 */
export const GlitchButton: React.FC<{
  children: React.ReactNode;
  intensity: number;
  onClick?: () => void;
  className?: string;
}> = ({ children, intensity, onClick, className = '' }) => {
  const offset = useRandomOffset(intensity);
  const isVisible = useFlicker(intensity);
  const [isGlitching, setIsGlitching] = useState(false);
  
  // 高强度时的持续故障效果
  useEffect(() => {
    if (intensity < 0.6) {
      setIsGlitching(false);
      return;
    }
    
    const chance = getGlitchChance(intensity);
    
    const interval = setInterval(() => {
      if (Math.random() < chance) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }
    }, 1500);
    
    return () => clearInterval(interval);
  }, [intensity]);
  
  return (
    <motion.button
      onClick={onClick}
      className={`relative ${className} ${isGlitching ? 'grayscale-[0.3]' : ''}`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        opacity: isVisible ? 1 : 0.3,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
      
      {/* 故障时的重影效果 */}
      {isGlitching && (
        <>
          <div 
            className="absolute inset-0 bg-red-500/20 -translate-x-1"
            style={{ mixBlendMode: 'multiply' }}
          />
          <div 
            className="absolute inset-0 bg-cyan-500/20 translate-x-1"
            style={{ mixBlendMode: 'multiply' }}
          />
        </>
      )}
    </motion.button>
  );
};

/**
 * 全局UI污染层
 */
export const GlitchUILayer: React.FC<{ intensity: number }> = ({ intensity }) => {
  if (intensity < 0.2) return null;
  
  const showGlobalGlitch = intensity >= 0.8 && Math.random() < 0.3;
  
  return (
    <>
      {/* 全局扫描线 */}
      {intensity > 0.5 && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[150]"
          style={{
            background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)',
            backgroundSize: '100% 4px',
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 0.2, repeat: Infinity }}
        />
      )}
      
      {/* 全局故障覆盖 */}
      {showGlobalGlitch && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[160]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{ duration: 0.3 }}
          style={{
            background: `linear-gradient(90deg, rgba(255,0,0,0.05) 0%, transparent 50%, rgba(0,255,255,0.05) 100%)`,
          }}
        />
      )}
    </>
  );
};

/**
 * 主组件：GlitchUI Provider
 */
export const GlitchUI: React.FC<GlitchUIProps> = ({ intensity, children }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) return <>{children}</>;
  
  return (
    <>
      {children}
      <GlitchUILayer intensity={intensity} />
    </>
  );
};

export default GlitchUI;
