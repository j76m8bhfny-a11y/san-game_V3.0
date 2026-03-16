import React, { useEffect, useState } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import ENDINGS from '@/assets/data/endings.json';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';
import { EndingType } from '@/types/schema';

interface GameEndingProps {
  endingId: string;
  onRestart: () => void;
  onViewDeathSummary?: () => void;
}

// 结局类型配置（V2新增）
const ENDING_TYPE_CONFIG: Record<EndingType, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}> = {
  DEATH: {
    label: '死亡结局',
    color: 'text-red-500',
    bgColor: 'bg-red-950/30',
    borderColor: 'border-red-800',
    icon: '💀',
    description: '系统淘汰了不合格的单位'
  },
  SURVIVAL: {
    label: '苟活结局',
    color: 'text-gray-400',
    bgColor: 'bg-gray-900/50',
    borderColor: 'border-gray-700',
    icon: '🐀',
    description: '你在系统的缝隙中存活了下来'
  },
  ALIENATION: {
    label: '异化结局',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/30',
    borderColor: 'border-purple-800',
    icon: '🌀',
    description: '你适应了疯狂，或者疯狂适应了你'
  },
  STANCE: {
    label: '立场结局',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/30',
    borderColor: 'border-cyan-800',
    icon: '⚡',
    description: '你选择了站队，并承担了代价'
  },
  UR: {
    label: '超稀有结局',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/30',
    borderColor: 'border-amber-700',
    icon: '👑',
    description: '你触及了系统的异常区域'
  }
};

export const GameEnding: React.FC<GameEndingProps> = ({ 
  endingId, 
  onRestart, 
  onViewDeathSummary 
}) => {
  const { t } = useI18n();
  const { stopBgm, playSfx } = useAudioStore();
  const { ui } = ENDING_RULES;
  
  // ✅ V2新增：延迟显示状态
  const [showRoast, setShowRoast] = useState(false);
  
  // 查找结局数据
  const ending = ENDINGS.find(e => e.id === endingId) || ui.fallbackContent;
  
  // 类型配置
  const typeConfig = ENDING_TYPE_CONFIG[ending.type as EndingType] || ENDING_TYPE_CONFIG.DEATH;
  
  // 判断结局类型
  const isDeath = ending.type === 'DEATH';
  const isAwakened = endingId === 'ED-22';
  const isUR = ending.type === 'UR';
  const isStance = ending.type === 'STANCE';
  const hasRoast = !!(ending as any).roast;

  useEffect(() => {
    stopBgm();
    
    // ✅ V2优化：结局音效分层
    if (isAwakened) {
      playSfx('sfx_ending_awakened');
    } else if (isDeath) {
      playSfx('sfx_glitch');
    } else if (isUR) {
      playSfx('sfx_ending_ur');
    } else if (isStance) {
      playSfx('sfx_ending_stance');
    }
    
    // ✅ V2新增：延迟显示吐槽语
    const timer = hasRoast ? setTimeout(() => setShowRoast(true), 2000) : null;
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isDeath, isAwakened, isUR, isStance, hasRoast, stopBgm, playSfx]);

  return (
    <div className={`fixed inset-0 z-[10000] overflow-y-auto bg-black transition-all duration-1000`}>
      {/* 动态背景 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* 噪点纹理 */}
        <div className="absolute inset-0 opacity-5 bg-[url('/assets/textures/noise.svg')] animate-grain" />
        
        {/* ✅ V2新增：类型特定背景效果 */}
        {isDeath && (
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-black animate-pulse" />
        )}
        {isUR && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.1)_0%,_transparent_70%)] animate-pulse" />
        )}
        {isAwakened && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.2)_0%,_transparent_70%)] animate-pulse" />
            <div className="absolute inset-0 overflow-hidden">
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
      </div>

      {/* 主内容 */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl w-full"
        >
          {/* ✅ V2新增：顶部类型标识 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center justify-center gap-3 mb-6 px-4 py-2 rounded-full border ${typeConfig.bgColor} ${typeConfig.borderColor}`}
          >
            <span className="text-2xl">{typeConfig.icon}</span>
            <div className="text-center">
              <div className={`text-xs font-bold tracking-widest uppercase ${typeConfig.color}`}>
                {typeConfig.label}
              </div>
              <div className="text-[10px] text-gray-500">
                {typeConfig.description}
              </div>
            </div>
            <span className="text-2xl">{typeConfig.icon}</span>
          </motion.div>

          {/* 结局ID */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-4"
          >
            <span className="font-mono text-xs text-gray-600 tracking-[0.3em]">
              {isAwakened ? 'TRUE END // SYSTEM RESET' : `ENDPOINT: ${endingId}`}
            </span>
          </motion.div>

          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className={`text-4xl md:text-6xl font-black tracking-tight leading-tight
              ${isAwakened 
                ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] font-pixel' 
                : isDeath 
                  ? 'text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.4)] font-creepster'
                  : isUR
                    ? 'text-amber-300 font-pixel'
                    : 'text-white font-pixel'
              }
            `}>
              {ending.title}
            </h1>
          </motion.div>

          {/* ✅ V2改进：描述卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`relative p-6 md:p-8 rounded-lg border mb-6 ${typeConfig.bgColor} ${typeConfig.borderColor}`}
          >
            {/* 装饰角 */}
            <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${typeConfig.borderColor}`} />
            <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${typeConfig.borderColor}`} />
            <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${typeConfig.borderColor}`} />
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${typeConfig.borderColor}`} />
            
            <p className={`text-base md:text-lg leading-relaxed text-justify font-light
              ${isAwakened ? 'text-amber-100/90' : 'text-gray-300'}
            `}>
              {ending.description}
            </p>
            
            {/* ED-22 底部签名 */}
            {isAwakened && (
              <div className="mt-6 pt-4 border-t border-amber-800/50 text-right">
                <span className="text-amber-500/60 text-xs font-mono">
                  "你看到了代码，现在你是代码的一部分。"
                </span>
              </div>
            )}
          </motion.div>

          {/* ✅ V2新增：吐槽语区域 */}
          <AnimatePresence>
            {showRoast && (ending as any).roast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="relative p-4 rounded-lg bg-gray-900/80 border border-gray-700">
                  <div className="absolute -top-3 left-4 px-2 bg-black">
                    <span className="text-xs text-gray-500 font-mono">💬 SYSTEM COMMENT</span>
                  </div>
                  <p className="text-gray-400 text-sm italic leading-relaxed pl-2 border-l-2 border-gray-600">
                    "{(ending as any).roast}"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ✅ V2改进：按钮组 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex flex-col gap-3"
          >
            {/* 死亡结局特殊按钮 */}
            {isDeath && onViewDeathSummary && (
              <button
                onClick={() => { playSfx('sfx_click'); onViewDeathSummary(); }}
                className="group relative w-full py-4 px-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>📜</span>
                  <span>查看本次收获</span>
                </span>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/50 animate-[scan_2s_linear_infinite] opacity-0 group-hover:opacity-100" />
              </button>
            )}

            {/* 重启按钮 */}
            <button
              onClick={() => { playSfx('sfx_click'); onRestart(); }}
              className={`
                group relative w-full py-4 px-6 font-bold text-lg tracking-widest transition-all duration-300 overflow-hidden cursor-pointer active:scale-95
                ${isAwakened 
                  ? 'bg-gradient-to-r from-amber-900/50 to-amber-800/50 text-amber-100 border border-amber-500 hover:brightness-110' 
                  : isDeath 
                    ? 'bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-800' 
                    : 'bg-white text-black hover:bg-gray-200 border border-white'}
              `}
            >
              <span className="relative z-10">
                {isAwakened ? '进入新的轮回 // 带着记忆' : isDeath ? '开始新的轮回' : t('gameOver.restart')}
              </span>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/50 animate-[scan_2s_linear_infinite] opacity-0 group-hover:opacity-100" />
            </button>
          </motion.div>

          {/* ED-22 特殊成就标识 */}
          {isAwakened && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              className="mt-6 text-center"
            >
              <span className="text-amber-400 text-xs font-mono tracking-widest">
                ★ 真结局已解锁 - 你现在是觉醒者 ★
              </span>
            </motion.div>
          )}

          {/* 底部版权 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className={`text-[9px] font-mono uppercase text-center mt-8
              ${isAwakened ? 'text-amber-700' : 'text-gray-700'}
            `}
          >
            {isAwakened 
              ? 'Simulation Reset // User Elevated to Admin // ' + new Date().getFullYear()
              : 'Simulation Terminated // ' + new Date().getFullYear()
            }
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};
