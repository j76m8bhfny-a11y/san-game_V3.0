/**
 * IntroComic - 开场美漫漫画组件
 * 
 * 美漫风格的开场介绍，分镜式展示润人的美利坚初体验
 * 流程：分镜1 → 分镜2 → 分镜3 → 开始游戏
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/store/useAudioStore';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import type { IntroComicConfig } from '@/types/narrative';

interface IntroComicProps {
  onComplete: () => void;
}

type ComicPhase = 'panels' | 'final';

interface ComicBubble {
  type: 'narration' | 'dialogue' | 'thought';
  text: string;
  position: 'top' | 'center' | 'bottom' | 'left' | 'right';
  speaker?: string;
  delay?: number;
}

interface ComicPanel {
  id: string;
  background: string;
  caption?: string;
  bubbles: ComicBubble[];
  duration: number;
}

// 从配置读取（带类型）
const COMIC_CONFIG = (NARRATIVE_RULES as unknown as { introComic?: IntroComicConfig }).introComic;

export const IntroComic: React.FC<IntroComicProps> = React.memo(({ onComplete }) => {
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [phase, setPhase] = useState<ComicPhase>('panels');
  const [visibleBubbles, setVisibleBubbles] = useState<number[]>([]);
  const [isSkipped, setIsSkipped] = useState(false);
  const [autoPlayTimer, setAutoPlayTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { playSfx } = useAudioStore();
  
  const panels: ComicPanel[] = COMIC_CONFIG?.panels || [];
  const currentPanel = panels[currentPanelIndex];
  const isLastPanel = currentPanelIndex >= panels.length - 1;
  
  // 检查是否已看过开场
  useEffect(() => {
    // 如果漫画被禁用，直接跳过
    if (!COMIC_CONFIG || COMIC_CONFIG.enabled === false) {
      onComplete();
      return;
    }
    
    const hasSeenComic = localStorage.getItem('has_seen_comic_v2');
    if (hasSeenComic === 'true') {
      // 已看过，直接完成
      onComplete();
    }
    // 未看过时，在组件卸载或完成时才会标记
  }, [onComplete]);
  
  // 标记为已看
  const markAsSeen = useCallback(() => {
    localStorage.setItem('has_seen_comic_v2', 'true');
  }, []);
  
  // 清除自动播放定时器
  const clearAutoPlay = useCallback(() => {
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      setAutoPlayTimer(null);
    }
  }, [autoPlayTimer]);
  
  // 显示气泡的时序控制
  useEffect(() => {
    if (!currentPanel || phase !== 'panels') return;
    
    setVisibleBubbles([]);
    
    currentPanel.bubbles.forEach((bubble, index) => {
      const delay = bubble.delay || index * 600;
      const timer = setTimeout(() => {
        setVisibleBubbles(prev => [...prev, index]);
        playSfx('sfx_typing'); // 气泡弹出音效
      }, delay);
      
      return () => clearTimeout(timer);
    });
    
    // 自动进入下一页
    const autoTimer = setTimeout(() => {
      if (!isSkipped) {
        handleNext();
      }
    }, currentPanel.duration);
    setAutoPlayTimer(autoTimer);
    
    return () => {
      clearAutoPlay();
    };
  }, [currentPanel, currentPanelIndex, phase, isSkipped]);
  
  // 下一页
  const handleNext = () => {
    clearAutoPlay();
    playSfx('sfx_paper'); // 翻页音效
    
    if (isLastPanel) {
      setPhase('final');
    } else {
      setCurrentPanelIndex(prev => prev + 1);
    }
  };
  
  // 跳过
  const handleSkip = () => {
    setIsSkipped(true);
    clearAutoPlay();
    markAsSeen();
    onComplete();
  };
  
  // 开始游戏
  const handleStart = () => {
    playSfx('sfx_click');
    markAsSeen();
    onComplete();
  };
  
  // 获取气泡样式
  const getBubbleStyle = (type: string, position: string): string => {
    const baseStyle = 'absolute p-4 font-bold text-sm md:text-base shadow-lg';
    const positionStyles: Record<string, string> = {
      'top': 'top-4 left-1/2 -translate-x-1/2 max-w-[80%]',
      'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[70%]',
      'bottom': 'bottom-4 left-1/2 -translate-x-1/2 max-w-[80%]',
      'left': 'left-4 top-1/2 -translate-y-1/2 max-w-[40%]',
      'right': 'right-4 top-1/2 -translate-y-1/2 max-w-[40%]'
    };
    
    const typeStyles: Record<string, string> = {
      'narration': 'bg-yellow-100 text-black border-2 border-black font-pixel italic',
      'dialogue': 'bg-white text-black border-2 border-black rounded-lg',
      'thought': 'bg-blue-100 text-black border-2 border-blue-400 rounded-full font-italic'
    };
    
    return `${baseStyle} ${positionStyles[position] || positionStyles.center} ${typeStyles[type] || typeStyles.dialogue}`;
  };
  
  // 获取气泡尾巴/形状
  const getBubbleShape = (type: string): React.CSSProperties => {
    switch (type) {
      case 'thought':
        return { borderRadius: '50% 50% 50% 10%' };
      case 'narration':
        return { clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)' };
      default:
        return {};
    }
  };
  
  if (isSkipped) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black overflow-hidden"
        onClick={phase === 'panels' ? handleNext : undefined}
      >
        {/* 美漫风格背景纹理 */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-700 via-black to-black" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '4px 4px'
          }}
        />
        
        {/* 跳过按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); handleSkip(); }}
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-400 text-sm rounded border border-gray-600 transition-colors"
        >
          跳过开场 →
        </button>
        
        {phase === 'panels' && currentPanel && (
          <motion.div
            key={currentPanel.id}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ 
              duration: COMIC_CONFIG?.style?.transitionDuration || 0.6,
              ease: "easeInOut"
            }}
            className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
            onClick={handleNext}
          >
            {/* 漫画分镜容器 */}
            <div 
              className="relative w-full max-w-4xl aspect-[16/9] bg-gray-900 overflow-hidden"
              style={{
                border: '4px solid white',
                boxShadow: '0 0 0 2px black, 8px 8px 0 0 rgba(0,0,0,0.5)',
                clipPath: 'polygon(0 0, 100% 0, 100% 95%, 98% 100%, 0 100%)'
              }}
            >
              {/* 背景图 */}
              <div 
                className="absolute inset-0 bg-cover bg-center grayscale-[30%] contrast-125"
                style={{ 
                  backgroundImage: `url(${currentPanel.background})`,
                  filter: 'sepia(20%) contrast(1.1)'
                }}
              >
                {/* 美漫网点纸效果覆盖 */}
                <div 
                  className="absolute inset-0 opacity-20 mix-blend-overlay"
                  style={{
                    backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                    backgroundSize: '8px 8px'
                  }}
                />
              </div>
              
              {/* 标题/Caption */}
              {currentPanel.caption && (
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent"
                >
                  <h2 
                    className="text-white text-lg md:text-xl font-black uppercase tracking-wider text-center"
                    style={{ 
                      fontFamily: COMIC_CONFIG?.style?.fontFamily || 'Impact, sans-serif',
                      textShadow: '2px 2px 0 #000, -1px -1px 0 #000'
                    }}
                  >
                    {currentPanel.caption}
                  </h2>
                </motion.div>
              )}
              
              {/* 对话气泡 */}
              {currentPanel.bubbles.map((bubble, index) => (
                <AnimatePresence key={index}>
                  {visibleBubbles.includes(index) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", damping: 15 }}
                      className={getBubbleStyle(bubble.type, bubble.position)}
                      style={getBubbleShape(bubble.type)}
                    >
                      {bubble.speaker && (
                        <div className="text-xs uppercase text-gray-500 mb-1 font-bold">
                          {bubble.speaker}
                        </div>
                      )}
                      <p className="leading-tight">{bubble.text}</p>
                      
                      {/* 气泡尾巴 */}
                      {bubble.type === 'dialogue' && (
                        <div 
                          className="absolute -bottom-2 left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-black rotate-45"
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
              
              {/* 页码指示器 */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                {panels.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentPanelIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              
              {/* 点击提示 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm"
              >
                点击继续 →
              </motion.div>
            </div>
          </motion.div>
        )}
        
        {/* 最终页面 */}
        {phase === 'final' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            <div className="text-center max-w-2xl">
              {/* 美漫风格标题 */}
              <motion.h1
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-black text-white mb-8 uppercase"
                style={{ 
                  fontFamily: COMIC_CONFIG?.style?.fontFamily || 'Impact, sans-serif',
                  textShadow: '4px 4px 0 #dc2626, -2px -2px 0 #000',
                  WebkitTextStroke: '2px black'
                }}
              >
                AMERICAN<br/>INSIGHT
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl md:text-2xl text-gray-300 mb-12 font-bold"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
              >
                {COMIC_CONFIG?.finalText || "你能在这个吃人的系统里活多久？"}
              </motion.p>
              
              <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                onClick={handleStart}
                className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-black uppercase rounded border-4 border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
                style={{ 
                  fontFamily: COMIC_CONFIG?.style?.fontFamily || 'Impact, sans-serif',
                  clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)'
                }}
              >
                {COMIC_CONFIG?.startButton || "开始求生"}
              </motion.button>
              
              {/* 装饰元素 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                transition={{ delay: 1 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.03) 35px, rgba(255,255,255,0.03) 70px)'
                }}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

IntroComic.displayName = 'IntroComic';

export default IntroComic;
