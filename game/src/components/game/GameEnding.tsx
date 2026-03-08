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
  onViewDeathSummary?: () => void; // [NEW] 查看死亡结算
}

export const GameEnding: React.FC<GameEndingProps> = ({ endingId, onRestart, onViewDeathSummary }) => {
  const { t } = useI18n();
  const { stopBgm, playSfx } = useAudioStore();
  
  // ✅ 2. 提取 UI 配置
  const { ui } = ENDING_RULES;
  
  // ✅ 3. 获取结局数据 (使用配置中的 fallbackContent 作为兜底)
  const ending = ENDINGS.find(e => e.id === endingId) || ui.fallbackContent;

  // ✅ 4. 动态判断结局类型
  const isDeath = ending.type === ui.categories.death;
  const isGood = ui.categories.goodTypes.includes(ending.type);
  
  // ✅ 新增：真结局 ED-22 "觉醒者" 特殊标记
  const isAwakened = endingId === 'ED-22';
  const isUR = ending.type === 'UR';
  const isStance = ending.type === 'STANCE';

  useEffect(() => {
    stopBgm();
    
    // ✅ 新增：结局音效分层
    if (isAwakened) {
      // ED-22 真结局 - 庄重史诗音效
      playSfx('sfx_ending_awakened');
    } else if (isDeath) {
      // 死亡结局 - 故障音效
      playSfx('sfx_glitch');
    } else if (isUR) {
      // UR 结局
      playSfx('sfx_ending_ur');
    } else if (isStance) {
      // STANCE 结局
      playSfx('sfx_ending_stance');
    }
  }, [isDeath, isAwakened, isUR, isStance, stopBgm, playSfx]);

  return (
    // 外层容器允许滚动
    <div className={`fixed inset-0 z-[10000] overflow-y-auto transition-colors duration-1000
      ${isAwakened ? 'bg-black' : 'bg-black'}
    `}>
      
      {/* 背景动态 */}
      <div className="fixed inset-0 opacity-10 pointer-events-none bg-[url('/assets/textures/noise.svg')] animate-grain z-0" />
      
      {/* ✅ 新增：ED-22 金色光芒背景 */}
      {isAwakened && (
        <>
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.15)_0%,_transparent_70%)] animate-pulse z-0" />
          {/* 动态金色光点效果 */}
          <div className="fixed inset-0 overflow-hidden z-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-400/40 rounded-sm animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </>
      )}
      
      {isDeath && <div className="fixed inset-0 bg-red-900/10 mix-blend-overlay animate-pulse z-0" />}

      {/* 内容容器 */}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center select-none relative z-10 py-12">
        
        <motion.div 
          // ✅ 5. 动画参数配置化
          initial={{ opacity: 0, scale: ui.animation.initialScale, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: isAwakened ? 2 : ui.animation.fadeInDuration, ease: "easeOut" }}
          className="max-w-xl w-full flex flex-col items-center"
        >
          {/* 结局代号 */}
          <div className={`font-mono text-xs md:text-sm mb-6 tracking-[0.5em] border-b pb-2
            ${isAwakened ? 'text-amber-400 border-amber-600' : 'text-gray-500 border-gray-800'}
          `}>
            {isAwakened ? 'TRUE END // SYSTEM RESET' : `ENDPOINT: ${endingId}`}
          </div>

          {/* ✅ 新增：ED-22 特殊标题样式 - 金色发光边框 */}
          <div className={`relative mb-8 ${isAwakened ? 'p-8 rounded-sm' : ''}`}>
            {isAwakened && (
              <>
                {/* 金色边框光效 */}
                <div className="absolute inset-0 bg-amber-500/50 animate-shimmer rounded-sm" />
                <div className="absolute inset-0 border-2 border-amber-400 rounded-sm shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
                {/* 四角装饰 */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-300" />
              </>
            )}
            
            <h1 className={`text-4xl md:text-7xl font-black tracking-tighter leading-tight relative z-10
              ${isAwakened ? 'text-amber-100 font-pixel drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]' :
                isDeath ? 'text-red-600 font-creepster drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]' : 
                isGood ? 'text-cyan-400 font-pixel drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 
                'text-white font-pixel'}
            `}>
              {ending.title}
            </h1>
          </div>

          {/* 描述文本框 */}
          <div className={`w-full p-6 md:p-10 rounded-sm mb-12 shadow-pixel relative group
            ${isAwakened 
              ? 'bg-[#1a1005] border-2 border-amber-600/50' 
              : 'bg-[#111] border border-gray-800'}
          `}>
            {/* 四角装饰 */}
            <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l 
              ${isAwakened ? 'border-amber-500' : 'border-gray-500'}`} />
            <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r 
              ${isAwakened ? 'border-amber-500' : 'border-gray-500'}`} />
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l 
              ${isAwakened ? 'border-amber-500' : 'border-gray-500'}`} />
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r 
              ${isAwakened ? 'border-amber-500' : 'border-gray-500'}`} />
            
            <p className={`font-mono text-sm md:text-lg leading-relaxed whitespace-pre-wrap text-justify
              ${isAwakened ? 'text-amber-100/90' : 'text-gray-300'}
            `}>
              {ending.description}
            </p>
            
            {/* ✅ ED-22 底部签名 */}
            {isAwakened && (
              <div className="mt-6 pt-4 border-t border-amber-800/50 text-right">
                <span className="text-amber-500/60 text-xs font-mono">
                  "你看到了代码，现在你是代码的一部分。"
                </span>
              </div>
            )}
          </div>

          {/* 按钮组 */}
          <div className="flex flex-col gap-4 mb-8">
            {/* 死亡结局：先显示"查看本次收获" */}
            {isDeath && onViewDeathSummary && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={() => { 
                  playSfx('sfx_click'); 
                  onViewDeathSummary();
                }}
                className="group relative px-10 py-4 font-bold text-lg tracking-widest transition-all duration-300 overflow-hidden cursor-pointer active:scale-95 bg-cyan-900/30 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-600"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>📜</span>
                  <span>查看本次收获</span>
                </span>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 animate-[scan_2s_linear_infinite] opacity-0 group-hover:opacity-100" />
              </motion.button>
            )}
            
            {/* ✅ ED-22 特殊重启按钮 - 金色 */}
            <button
              onClick={() => { 
                playSfx('sfx_click'); 
                onRestart(); 
              }}
              className={`
                group relative px-10 py-4 font-bold text-lg tracking-widest transition-all duration-300 overflow-hidden cursor-pointer active:scale-95
                ${isAwakened 
                  ? 'bg-pixel-gradient-amber text-amber-100 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:brightness-110' 
                  : isDeath 
                    ? 'bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-800' 
                    : 'bg-white text-black hover:bg-gray-200'}
              `}
            >
              <span className="relative z-10">
                {isAwakened ? '进入新的轮回 // 带着记忆' : isDeath ? '开始新的轮回' : t('gameOver.restart')}
              </span>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/50 animate-[scan_2s_linear_infinite] opacity-0 group-hover:opacity-100" />
            </button>
          </div>
          
          {/* ✅ 新增：ED-22 特殊成就标识 */}
          {isAwakened && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              className="mb-4 px-4 py-2 bg-amber-950/50 border border-amber-600/30 rounded"
            >
              <span className="text-amber-400 text-xs font-mono tracking-widest">
                ★ 真结局已解锁 - 你现在是觉醒者 ★
              </span>
            </motion.div>
          )}
          
          {/* 底部版权 */}
          <div className={`text-[9px] font-mono uppercase mt-auto
            ${isAwakened ? 'text-amber-700' : 'text-gray-700'}
          `}>
            {isAwakened 
              ? 'Simulation Reset // User Elevated to Admin // ' + new Date().getFullYear()
              : 'Simulation Terminated // ' + new Date().getFullYear()
            }
          </div>

        </motion.div>
      </div>
    </div>
  );
};
