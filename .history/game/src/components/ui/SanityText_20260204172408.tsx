import React, { useMemo } from 'react';
import rules from '@/assets/data/rules/vitalityRules.json';

// 仅对 15% 的字符应用故障效果，避免 DOM 爆炸
export const SanityText: React.FC<{ text: string; san: number }> = ({ text, san }) => {
  // ✅ 修复：空值保护
  if (!text) return null;

  const isGlitchy = san <= rules.visuals.thresholds.sanMedium;
  
  const content = useMemo(() => {
    if (!isGlitchy) return text;

    return text.split('').map((char, i) => {
      // 性能优化：只有质数索引才渲染为 span，其余保持纯文本
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