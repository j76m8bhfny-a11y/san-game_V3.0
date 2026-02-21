// src/components/game/Crypto/CryptoNewsPopup.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '@/store/useAudioStore';
import { NewsItem } from '@/types/schema';
import marketRules from '@/assets/data/rules/market_rules.json';

interface CryptoNewsPopupProps {
  news: NewsItem;
  onClose: () => void;
}

export const CryptoNewsPopup: React.FC<CryptoNewsPopupProps> = ({ news, onClose }) => {
  const { playSfx } = useAudioStore();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  
  // 播放提示音
  useEffect(() => {
    playSfx('sfx_click');
  }, [playSfx]);
  
  // 自动关闭进度条
  useEffect(() => {
    if (isPaused) return;
    
    const duration = marketRules.news.popup.durationMs;
    const interval = 50;
    const step = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress(p => {
        if (p <= 0) {
          onClose();
          return 0;
        }
        return p - step;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [onClose, isPaused]);

  // 点击关闭
  const handleClose = useCallback(() => {
    playSfx('sfx_click');
    onClose();
  }, [onClose, playSfx]);

  // 价格影响颜色
  const effectColor = news.effect > 0 ? 'text-green-400' : 
                     news.effect < 0 ? 'text-red-400' : 'text-gray-400';
  const effectBg = news.effect > 0 ? 'bg-green-500/10 border-green-500/30' : 
                  news.effect < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30';
  const effectIcon = news.effect > 0 ? '📈' : 
                    news.effect < 0 ? '📉' : '➡️';

  // 提取新闻文本（去除原有的 >>> 和 <<<）
  const cleanText = news.text
    .replace(/^>>>/, '')
    .replace(/<<<\s*$/, '')
    .trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
        {/* 手机弹窗容器 - 占据屏幕70% */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[70%] min-w-[320px] bg-[#15202b] rounded-2xl overflow-hidden border border-gray-700 shadow-2xl"
          style={{ maxHeight: '70vh' }}
          onClick={e => e.stopPropagation()}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Twitter风格顶部 */}
          <div className="bg-[#1e2732] p-3 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                ₿
              </div>
              <div>
                <div className="text-sm text-white font-bold">Crypto Insider</div>
                <div className="text-[10px] text-gray-500">@darknet_whale · Verified</div>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="text-gray-500 hover:text-white text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              ×
            </button>
          </div>
          
          {/* 新闻内容 */}
          <div className="p-5 space-y-4">
            {/* 时间戳 */}
            <div className="text-[10px] text-gray-500 font-mono">
              {new Date().toLocaleTimeString()} · Twitter Web App
            </div>
            
            {/* BREAKING 标签 */}
            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider ${effectBg} ${effectColor}`}>
              {marketRules.news.popup.prefix}
            </div>
            
            {/* 新闻正文 */}
            <div className={`text-lg leading-relaxed font-medium ${effectColor}`}>
              {cleanText}
            </div>
            
            {/* 影响指示 */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${effectBg} border`}>
              <span className="text-2xl">{effectIcon}</span>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Expected Impact</div>
                <div className="text-sm font-bold font-mono">
                  {news.effect > 0 ? '+' : ''}{(news.effect * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            {/* 互动按钮 */}
            <div className="flex items-center gap-6 text-[10px] text-gray-500 pt-3 border-t border-gray-800">
              <span className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer">
                <span>💬</span> 评论 42
              </span>
              <span className="flex items-center gap-1 hover:text-green-400 transition-colors cursor-pointer">
                <span>🔄</span> 转发 666
              </span>
              <span className="flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer">
                <span>❤️</span> 喜欢 1.2k
              </span>
              <span className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer">
                <span>📤</span> 分享
              </span>
            </div>
          </div>
          
          {/* 自动关闭进度条 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
            <motion.div 
              className={`h-full ${news.effect > 0 ? 'bg-green-500' : news.effect < 0 ? 'bg-red-500' : 'bg-gray-500'}`}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0 }}
            />
          </div>
          
          {/* 暂停提示 */}
          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-2 right-2 text-[9px] text-gray-600 bg-black/50 px-2 py-1 rounded"
            >
              ⏸️ PAUSED
            </motion.div>
          )}
        </motion.div>
    </motion.div>
  );
};

// 导出hook用于在GameStore中控制显示
export const useCryptoNews = () => {
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null);
  
  const showNews = useCallback((news: NewsItem) => {
    setCurrentNews(news);
  }, []);
  
  const hideNews = useCallback(() => {
    setCurrentNews(null);
  }, []);
  
  return { currentNews, showNews, hideNews };
};
