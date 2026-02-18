import React, { useMemo } from 'react';
import rules from '@/assets/data/rules/vitalityRules.json';

/**
 * 灵视文本组件
 * 
 * 根据灵视值显示不同样式：
 * - 低灵视 (<30): 文字模糊，难以看清真相
 * - 中灵视 (30-70): 正常显示
 * - 高灵视 (>70): 文字闪烁微光，觉醒状态
 */
export const SanityText: React.FC<{ text: string; san: number }> = ({ text, san }) => {
  // ✅ 修复：空值保护
  if (!text) return null;

  // 获取灵视阈值
  const insightLow = rules.visuals?.thresholds?.insightLow ?? 30;
  const insightHigh = rules.visuals?.thresholds?.insightHigh ?? 70;
  
  // 低灵视：文字模糊，被遮蔽
  const isObscured = san <= insightLow;
  // 高灵视：觉醒辉光
  const isAwakened = san >= insightHigh;
  
  const content = useMemo(() => {
    // 高灵视：偶尔有闪烁效果（觉醒者看到的世界不稳定）
    if (isAwakened) {
      return text.split('').map((char, i) => {
        // 只有特定索引才添加效果
        if (char === ' ' || (i % 11 !== 0 && i % 7 !== 0)) return char;

        return (
          <span key={i} className="inline-block animate-pulse text-amber-300/90" style={{ opacity: 0.8 + Math.random() * 0.2 }}>
            {char}
          </span>
        );
      });
    }
    
    // 低灵视：正常返回（外层会处理模糊）
    if (isObscured) return text;

    // 正常状态
    return text;
  }, [text, isObscured, isAwakened]);

  return (
    <p className={`leading-relaxed ${
      isAwakened 
        ? 'font-medium text-amber-100' 
        : isObscured 
          ? 'font-sans text-gray-500 blur-[0.3px]' 
          : 'font-sans text-gray-200'
    }`}>
      {content}
    </p>
  );
};

export default SanityText;
