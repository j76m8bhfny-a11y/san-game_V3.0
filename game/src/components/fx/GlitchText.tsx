import React, { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  san: number; // 0 - 100 灵视值
  revealedText?: string; // 高灵视时显示的隐藏文本
  className?: string;
}

// 遮蔽字符
const MASK_CHARS = '█▓▒░';

export const GlitchText: React.FC<GlitchTextProps> = ({ 
  text, 
  san, 
  revealedText,
  className = "" 
}) => {
  const [displayText, setDisplayText] = useState(text);
  
  // 灵视值阈值
  const isObscured = san < 30;      // 低灵视：文字被遮蔽
  const isRevealed = san > 70 && revealedText;  // 高灵视：显示隐藏内容

  useEffect(() => {
    // 高灵视：显示隐藏真相
    if (isRevealed) {
      setDisplayText(revealedText!);
      return;
    }
    
    // 正常灵视：显示原文
    if (!isObscured) {
      setDisplayText(text);
      return;
    }

    // 低灵视：文字被遮蔽，偶尔闪烁
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const masked = text.split('').map((char) => {
          if (char === ' ') return ' ';
          // 随机遮蔽
          if (Math.random() < 0.4) {
            return MASK_CHARS[Math.floor(Math.random() * MASK_CHARS.length)];
          }
          return char;
        }).join('');
        setDisplayText(masked);
      } else {
        setDisplayText(text);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [text, revealedText, san, isObscured, isRevealed]);

  // 高灵视：金色辉光效果
  if (isRevealed) {
    return (
      <span className={`${className} text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] font-medium`}>
        {displayText}
      </span>
    );
  }

  // 低灵视：灰度遮蔽效果
  if (isObscured) {
    return (
      <span className={`${className} text-gray-500 blur-[0.5px] select-none`}>
        {displayText}
      </span>
    );
  }

  // 正常灵视
  return <span className={className}>{displayText}</span>;
};

/**
 * 隐藏文本组件 - 只有达到指定灵视值才能看到完整内容
 */
interface HiddenTextProps {
  children: string;
  san: number;
  requiredInsight?: number;
  hintText?: string;
  className?: string;
}

export const HiddenText: React.FC<HiddenTextProps> = ({
  children,
  san,
  requiredInsight = 70,
  hintText = "（你的灵视不足以理解这段文字...）",
  className = ""
}) => {
  const canSee = san >= requiredInsight;
  
  if (canSee) {
    return (
      <span className={`${className} text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]`}>
        {children}
      </span>
    );
  }
  
  return (
    <span className={`${className} text-gray-600 italic`} title={`需要灵视值 ${requiredInsight}`}>
      {hintText}
    </span>
  );
};

export default GlitchText;
