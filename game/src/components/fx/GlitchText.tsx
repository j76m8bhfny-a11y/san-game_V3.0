import React, { useEffect, useState, useMemo } from 'react';

interface GlitchTextProps {
  text: string;
  san: number; // 0 - 100
  className?: string;
}

// 乱码字符集
const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#________';

export const GlitchText: React.FC<GlitchTextProps> = ({ text, san, className = "" }) => {
  const [displayText, setDisplayText] = useState(text);
  
  // 阈值：当 SAN > 60 (进入觉醒/疯癫状态) 时开始闪烁乱码
  const isGlitching = san > 60; 

  useEffect(() => {
    // 如果 SAN 值正常，强制重置为原文
    if (!isGlitching) {
      setDisplayText(text);
      return;
    }

    const interval = setInterval(() => {
      // 80% 的概率保持原样，20% 的概率这一帧发生跳变
      if (Math.random() > 0.8) {
        const scrambled = text.split('').map((char) => {
          if (char === ' ') return ' ';
          // 每个字符有 15% 的概率被替换为乱码
          if (Math.random() < 0.15) {
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          }
          return char;
        }).join('');
        setDisplayText(scrambled);
      } else {
        setDisplayText(text);
      }
    }, 150); // 每 150ms 刷新一次，模拟旧显示器的刷新率

    return () => clearInterval(interval);
  }, [text, san, isGlitching]);

  // 低 SAN 值（正常状态）直接返回文本，减少性能开销
  if (!isGlitching) {
    return <span className={className}>{text}</span>;
  }

  return (
    <div className={`relative inline-block ${className} font-mono group`}>
      {/* 1. 基础文本层 */}
      <span className="relative z-10">{displayText}</span>
      
      {/* 2. 红色色差层 (Red Shift) - 仅在 hover 或高 SAN 时偶尔出现 */}
      <span 
        className="absolute top-0 left-0 -ml-[2px] text-red-500 opacity-70 animate-pulse mix-blend-screen pointer-events-none"
        aria-hidden="true"
      >
        {displayText}
      </span>

      {/* 3. 蓝色色差层 (Blue Shift) */}
      <span 
        className="absolute top-0 left-0 ml-[2px] text-blue-500 opacity-70 animate-pulse mix-blend-screen pointer-events-none"
        style={{ animationDelay: '0.1s' }} // 错开动画时间
        aria-hidden="true"
      >
        {displayText}
      </span>
    </div>
  );
};