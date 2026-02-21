import React, { useEffect } from 'react';

import { useAudioStore } from '@/store/useAudioStore';
import ENDINGS from '@/assets/data/endings.json';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';
// ✅ 1. 引入配置文件
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';

interface GameEndingProps {
  endingId: string;
  onRestart: () => void;
}

export const GameEnding: React.FC<GameEndingProps> = ({ endingId, onRestart }) => {
  const { t } = useI18n();
  const { stopBgm, playSfx } = useAudioStore();
  
  // ✅ 2. 提取 UI 配置
  const { ui } = ENDING_RULES;
  
  // ✅ 3. 获取结局数据 (使用配置中的 fallbackContent 作为兜底)
  const ending = ENDINGS.find(e => e.id === endingId) || ui.fallbackContent;

  // ✅ 4. 动态判断结局类型 (不再硬编码 'DEATH', 'UR', 'STANCE')
  const isDeath = ending.type === ui.categories.death;
  const isGood = ui.categories.goodTypes.includes(ending.type);

  useEffect(() => {
    stopBgm();
    if (isDeath) {
      playSfx('sfx_glitch');
    }
  }, [isDeath, stopBgm, playSfx]);

  return (
    // 外层容器允许滚动
    <div className="fixed inset-0 z-[10000] bg-black overflow-y-auto">
      
      {/* 背景动态 */}
      <div className="fixed inset-0 opacity-10 pointer-events-none bg-[url('/assets/textures/noise.svg')] animate-grain z-0" />
      {isDeath && <div className="fixed inset-0 bg-red-900/10 mix-blend-overlay animate-pulse z-0" />}

      {/* 内容容器 */}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none relative z-10 py-12">
        
        <motion.div 
          // ✅ 5. 动画参数配置化
          initial={{ opacity: 0, scale: ui.animation.initialScale, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: ui.animation.fadeInDuration, ease: "easeOut" }}
          className="max-w-xl w-full flex flex-col items-center"
        >
          {/* 结局代号 */}
          <div className="font-mono text-gray-500 text-xs md:text-sm mb-6 tracking-[0.5em] border-b border-gray-800 pb-2">
            ENDPOINT: {endingId}
          </div>

          {/* 标题 */}
          <h1 className={`text-4xl md:text-7xl font-black mb-8 tracking-tighter leading-tight
            ${isDeath ? 'text-red-600 font-creepster drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 
              isGood ? 'text-cyan-400 font-pixel drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 
              'text-white font-serif'}
          `}>
            {ending.title}
          </h1>

          {/* 描述文本框 */}
          <div className="w-full bg-[#111] border border-gray-800 p-6 md:p-10 rounded-sm mb-12 shadow-2xl relative group">
            {/* 四角装饰 */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-500" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-500" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-500" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-500" />
            
            <p className="font-mono text-sm md:text-lg leading-relaxed text-gray-300 whitespace-pre-wrap text-justify">
              {ending.description}
            </p>
          </div>

          {/* 重启按钮 */}
          <button
            onClick={() => { 
              playSfx('sfx_click'); 
              onRestart(); 
            }}
            className={`
              group relative px-10 py-4 font-bold text-lg tracking-widest transition-all duration-300 overflow-hidden mb-8 cursor-pointer active:scale-95
              ${isDeath ? 'bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-800' : 
                'bg-white text-black hover:bg-gray-200'}
            `}
          >
            <span className="relative z-10">{t('gameOver.restart')}</span>
            {/* 故障扫描线动画 */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white/50 animate-[scan_2s_linear_infinite] opacity-0 group-hover:opacity-100" />
          </button>
          
          {/* 底部版权 */}
          <div className="text-[9px] text-gray-700 font-mono uppercase mt-auto">
            Simulation Terminated // {new Date().getFullYear()}
          </div>

        </motion.div>
      </div>
    </div>
  );
};