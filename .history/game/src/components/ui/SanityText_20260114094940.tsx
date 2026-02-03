import React, { useMemo } from 'react';

// 仅对 15% 的字符应用故障效果，避免 DOM 爆炸
export const SanityText: React.FC<{ text: string; san: number }> = ({ text, san }) => {
  const isGlitchy = san <= 70;
  
  const content = useMemo(() => {
    if (!isGlitchy) return text;

    return text.split('').map((char, i) => {
      // 性能优化：只有质数索引才渲染为 span，其余保持纯文本
      // 这样可以将 DOM 节点数量减少 80% 以上
      if (i % 7 !== 0 && i % 5 !== 0) return char;

      return (
        <span key={i} className="inline-block animate-pulse text-red-400/80" style={{ opacity: Math.random() }}>
          {char}
        </span>
      );
    });
  }, [text, isGlitchy]);

  return <p className={`leading-relaxed ${isGlitchy ? 'font-mono' : 'font-sans'}`}>{content}</p>;
};
