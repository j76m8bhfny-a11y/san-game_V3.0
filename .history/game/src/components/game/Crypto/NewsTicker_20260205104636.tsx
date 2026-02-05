import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import marketRules from '@/assets/data/rules/marketRules.json'; // ✅ Import

export const NewsTicker: React.FC = () => {
  const { crypto } = useGameStore();
  const news = crypto.weeklyNews;
  const { defaultText, speedSeconds } = marketRules.ui.ticker; // ✅ Config

  // 如果没有新闻，显示配置的默认文本
  const text = news ? news.text : defaultText;
  const sentimentColor = news 
    ? (news.effect > 0 ? 'text-green-400' : news.effect < 0 ? 'text-red-500' : 'text-amber-400')
    : 'text-gray-500';

  return (
    <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/80 border-t border-gray-800 flex items-center overflow-hidden z-40 pointer-events-none">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`mx-8 font-mono text-xs md:text-sm font-bold tracking-widest ${sentimentColor}`}>
            {text}
          </span>
        ))}
      </div>
      
      {/* ✅ 动态 CSS 动画速度 */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee ${speedSeconds}s linear infinite;
        }
      `}</style>
    </div>
  );
};