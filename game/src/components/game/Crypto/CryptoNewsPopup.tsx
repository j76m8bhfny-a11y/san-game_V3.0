/**
 * CryptoNewsPopup - 加密货币新闻弹窗（混合风格）
 * 
 * 呈现方式：事件系统风格（场景背景 + 左下角人物 + 右下角手机框架）
 * 内容风格：Twitter风格（占屏幕70%，带自动关闭进度条）
 * 
 * 模拟日常看手机刷新闻的体验
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '@/store/useAudioStore';
import { NewsItem } from '@/types/schema';
import marketRules from '@/assets/data/rules/market_rules.json';

interface CryptoNewsPopupProps {
  news: NewsItem;
  onClose: () => void;
}

// Twitter风格新闻内容组件
const TwitterNewsContent: React.FC<{
  news: NewsItem;
  progress: number;
  isPaused: boolean;
  onClose: () => void;
}> = ({ news, progress, isPaused, onClose }) => {
  // 价格影响颜色 - 中性化，不透露涨跌（让玩家自己猜）
  const effectColor = 'text-blue-400';  // 统一蓝色
  const effectBg = 'bg-blue-500/10 border-blue-500/30';  // 统一蓝色背景
  const effectIcon = '📊';  // 统一图表图标，不暗示方向

  // 清理新闻文本
  const cleanText = news.text
    .replace(/^>>>/, '')
    .replace(/<<<$/, '')
    .trim();

  return (
    <div className="relative w-full h-full flex flex-col">
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
          onClick={onClose}
          className="text-gray-500 hover:text-white text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          ×
        </button>
      </div>
      
      {/* 新闻内容 */}
      <div className="flex-1 p-5 space-y-4 overflow-y-auto">
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
        
        {/* 影响指示 - 模糊化显示 */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${effectBg} border`}>
          <span className="text-2xl">{effectIcon}</span>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Market Signal</div>
            <div className="text-sm font-bold font-mono text-blue-400">
              波动幅度 ??%
            </div>
            <div className="text-[9px] text-gray-600 italic">
              影响不明，自行判断
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
      
      {/* 自动关闭进度条 - 中性蓝色 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
        <motion.div 
          className="h-full bg-blue-500"
          style={{ width: `${progress}%` }}
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
    </div>
  );
};

// 手机框架组件
const NewsPhone: React.FC<{
  news: NewsItem;
  onConfirm: () => void;
}> = ({ news, onConfirm }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const { playSfx } = useAudioStore();

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
          onConfirm();
          return 0;
        }
        return p - step;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [onConfirm, isPaused]);

  return (
    <div 
      className="relative w-[450px] h-[620px] flex items-center justify-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <img 
        src="/assets/ui/pixel_phone_frame.png" 
        alt="Phone Shell"
        className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
      />
      
      <div className="absolute inset-0 border-[12px] border-gray-800 bg-gray-900 rounded-[30px] z-10 shadow-xl" style={{ display: 'none' }} id="fallback-shell"></div>

      <div className="relative z-10 w-[52%] h-[72%] bg-[#15202b] rounded-[30px] overflow-hidden flex flex-col mb-[138px] mr-[100px]">
        {/* 手机屏幕内容 - Twitter风格 */}
        <TwitterNewsContent 
          news={news} 
          progress={progress}
          isPaused={isPaused}
          onClose={onConfirm}
        />
      </div>
    </div>
  );
};

export const CryptoNewsPopup: React.FC<CryptoNewsPopupProps> = ({ news, onClose }) => {
  const { playSfx } = useAudioStore();

  const handleClose = useCallback(() => {
    playSfx('sfx_click');
    onClose();
  }, [onClose, playSfx]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 pointer-events-none"
    >
      {/* 背景 - 地图/街景模糊背景 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm"
      />

      {/* 左下角人物 */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute bottom-0 left-0 md:left-10 z-40 w-[40%] md:w-[25%] pointer-events-none"
      >
        <img 
          src="/assets/scenes/player_back.png" 
          alt="Player" 
          className="w-full object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </motion.div>

      {/* 右下角手机 - 显示Twitter新闻 */}
      <motion.div
        initial={{ x: '100%', y: '100%', rotate: 10 }}
        animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="absolute bottom-[-100px] right-[0px] z-50 pointer-events-auto origin-bottom-right"
      >
        <NewsPhone news={news} onConfirm={handleClose} />
      </motion.div>

      {/* 提示文字 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 text-center"
      >
        <p className="text-gray-400 text-sm font-pixel">
          收到一条加密快讯
        </p>
        <p className="text-gray-600 text-xs mt-1">
          （鼠标悬停暂停，点击×关闭）
        </p>
      </motion.div>
    </motion.div>
  );
};

// Hook导出
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

export default CryptoNewsPopup;
