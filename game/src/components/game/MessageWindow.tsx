import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useBurningConfig } from '@/hooks/useBurningConfig';
import { usePrefersReducedMotion } from '@/hooks/useAccessibility';
import { GameEvent } from '@/types/schema';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import { getCurrentGazeEffects, getGazeNarrative } from '@/logic/gazeEventSystem';
import { calculateDOptionReduction } from '@/logic/archiveModifier';
import { DOptionConfirm, isHighRiskOption } from '@/components/ui/DOptionConfirm';
import type { PlayerSpritesConfig } from '@/types/narrative';

const { pacing, ui } = NARRATIVE_RULES;

// [NEW] 人物图配置（带类型）
const SPRITE_CONFIG = (NARRATIVE_RULES as unknown as { playerSprites?: PlayerSpritesConfig }).playerSprites;

/**
 * 根据阶级和灵视获取人物图路径
 */
function getPlayerSprite(currentClass: string, insight: number, maxInsight: number): string {
  if (!SPRITE_CONFIG?.enabled) return SPRITE_CONFIG?.default || '/assets/scenes/player_back.png';
  
  const classSprites = SPRITE_CONFIG.byClass?.[currentClass];
  if (!classSprites) return SPRITE_CONFIG.default || '/assets/scenes/player_back.png';
  
  const insightPercent = (insight / maxInsight) * 100;
  const threshold = SPRITE_CONFIG.highInsightThreshold || 70;
  
  // 高灵视时显示剪影（看透了本质）
  if (insightPercent >= threshold && classSprites.highInsight) {
    return classSprites.highInsight;
  }
  
  return classSprites.normal || SPRITE_CONFIG.default || '/assets/scenes/player_back.png';
}

interface MessageWindowProps {
  event: GameEvent;
}

// 打字机组件（支持减少动画偏好）
const TypewriterText: React.FC<{ 
  text: string; 
  onComplete?: () => void; 
  glitch?: boolean;
  ariaLabel?: string;
}> = ({ 
  text, onComplete, glitch = false, ariaLabel 
}) => {
  const [display, setDisplay] = useState('');
  const { playSfx } = useAudioStore();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // 如果用户偏好减少动画，立即显示全文
    if (prefersReducedMotion) {
      setDisplay(text);
      onComplete && onComplete();
      return;
    }

    let i = 0;
    setDisplay('');
    const timer = setInterval(() => {
      if (i < text.length) {
        // Glitch效果：随机字符替换
        if (glitch && Math.random() < 0.1) {
          const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
          setDisplay(text.substring(0, i) + glitchChars[Math.floor(Math.random() * glitchChars.length)]);
        } else {
          setDisplay(text.substring(0, i + 1));
        }
        
        if (i % ui.animationTimings.typingSoundFrequency === 0) playSfx('sfx_typing');
        i++;
      } else {
        clearInterval(timer);
        onComplete && onComplete();
      }
    }, pacing.typewriterSpeedMs);
    return () => clearInterval(timer);
  }, [text, playSfx, onComplete, glitch, prefersReducedMotion]);

  return (
    <span 
      className={`font-pixel leading-relaxed tracking-wide ${glitch ? 'text-red-400' : ''}`}
      aria-label={ariaLabel}
      role="text"
    >
      {display}
    </span>
  );
};

// Glitch覆盖层组件
const GlitchOverlay: React.FC<{ intensity: number }> = ({ intensity }) => {
  if (intensity <= 0) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* 扫描线 */}
      <motion.div 
        className="absolute left-0 right-0 h-px bg-red-500/30"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      {/* 噪点 */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }}
      />
      {/* 红色闪烁 */}
      <motion.div 
        className="absolute inset-0 bg-red-900/10"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
};

// [NEW] 人物图组件 - 支持阶级切换和渐变
const PlayerSprite: React.FC<{
  currentClass: string;
  insight: number;
  maxInsight: number;
  isFocusMode: boolean;
}> = React.memo(({ currentClass, insight, maxInsight, isFocusMode }) => {
  // 同步计算当前应该显示的图片
  const targetSprite = getPlayerSprite(currentClass, insight, maxInsight);
  const [displaySprite, setDisplaySprite] = useState(targetSprite);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 当目标图片变化时，执行淡出淡入过渡
  useEffect(() => {
    if (targetSprite !== displaySprite) {
      // 开始淡出
      setIsTransitioning(true);
      const fadeOutTimer = setTimeout(() => {
        // 切换图片
        setDisplaySprite(targetSprite);
        // 开始淡入
        setIsTransitioning(false);
      }, (SPRITE_CONFIG?.transitionDuration || 0.5) * 500);
      return () => clearTimeout(fadeOutTimer);
    }
  }, [targetSprite, displaySprite]);
  
  const altText = SPRITE_CONFIG?.byClass?.[currentClass]?.altText || 'Player';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={isFocusMode ? { opacity: 0, x: -200 } : { opacity: isTransitioning ? 0 : 1, x: 0 }}
      transition={{ duration: SPRITE_CONFIG?.transitionDuration || 0.5 }}
      className="absolute bottom-0 left-0 md:left-10 z-40 w-[40%] md:w-[25%] pointer-events-none"
    >
      <img 
        src={displaySprite} 
        alt={altText}
        className="w-full object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
        onError={(e) => {
          // 图片加载失败时回退到默认（防死循环）
          const fallback = '/assets/scenes/player_back.png';
          if (e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
      />
    </motion.div>
  );
});

PlayerSprite.displayName = 'PlayerSprite';

// 🌟 Gaze低语组件
const GAZE_WHISPERS = {
  low: [ // 30-50%
    "有人在看你...",
    "你感觉到了吗？",
    "系统正在记录",
    "他们开始注意你了",
  ],
  medium: [ // 50-75%
    "不要继续挖掘了...",
    "有些真相不该被知道",
    "你已经被标记了",
    "回头还来得及",
    "他们在监听",
  ],
  high: [ // 75%+
    "我们知道你是谁",
    "所有门都在关闭",
    "系统正在自我修复",
    "你逃不掉的",
    "这是最后的警告",
    "成为系统的一部分",
  ],
};

const GazeWhisper: React.FC<{ intensity: number }> = ({ intensity }) => {
  const [whisper, setWhisper] = React.useState('');
  
  React.useEffect(() => {
    let pool: string[];
    if (intensity >= 0.75) pool = GAZE_WHISPERS.high;
    else if (intensity >= 0.5) pool = GAZE_WHISPERS.medium;
    else pool = GAZE_WHISPERS.low;
    
    setWhisper(pool[Math.floor(Math.random() * pool.length)]);
    
    // 每15-20秒更换一次低语（降低干扰频率）
    const interval = setInterval(() => {
      setWhisper(pool[Math.floor(Math.random() * pool.length)]);
    }, 15000 + Math.random() * 5000);
    
    return () => clearInterval(interval);
  }, [intensity]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="text-[9px] text-red-500/60 italic max-w-[150px] truncate"
    >
      "{whisper}"
    </motion.div>
  );
};

// 气泡组件
const PixelSMSBubble: React.FC<{
  label: string;
  id: string;
  type: string;
  onClick: () => void;
  disabled?: boolean;
  glitch?: boolean;
  reductionInfo?: {
    reductionPercent: number;
    originalHp: number;
    actualHp: number;
  } | null;
  isBurned?: boolean;
}> = ({ label, id, type, onClick, disabled, glitch, reductionInfo, isBurned }) => {
  
  const getBubbleColor = (type: string): string => {
    const validTypes = ['safe', 'risk', 'special', 'awakening'] as const;
    if (validTypes.includes(type as any)) {
      return ui.bubbleColors[type as keyof typeof ui.bubbleColors];
    }
    return ui.bubbleColors.default;
  };
  const color = getBubbleColor(type);
  
  const getBubbleStyles = (color: string) => {
    return (ui.bubbleStyles as Record<string, { bg: string; text: string; shadow: string }>)[color] 
      || (ui.bubbleStyles as Record<string, { bg: string; text: string; shadow: string }>)['#E9E9EB'];
  };
  const theme = getBubbleStyles(color);
  
  const isDOption = id === 'D';
  const hasReduction = isDOption && reductionInfo && reductionInfo.reductionPercent > 0 && !isBurned;
  
  // [NEW] 使用 Hook 获取燃烧效果配置
  const { config: burningConfig, enabled: burningEnabled, getWhispers } = useBurningConfig();
  const ghostWhisper = burningEnabled ? getWhispers(id) : null;

  return (
    <div className={`flex justify-end items-end gap-2 group w-full pl-2 ${disabled ? 'opacity-50' : ''}`}>
      {/* 档案减免标签 - D选项专用（燃烧时不显示） */}
      {hasReduction && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="px-2 py-0.5 bg-cyan-900/90 border border-cyan-500/50 rounded-full text-[9px] text-cyan-300 flex items-center gap-1 whitespace-nowrap">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            档案减免 {reductionInfo?.reductionPercent}%
          </div>
        </motion.div>
      )}
      
      {/* [NEW] 幽灵低语 - 仅在燃烧状态显示 */}
      <AnimatePresence>
        {isBurned && ghostWhisper && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 0.7, 0], y: [10, 0, -15] }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: burningConfig?.whisperDuration || 2,
              delay: burningConfig?.whisperDelay || 0.3
            }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap italic pointer-events-none z-30"
          >
            {ghostWhisper}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={`text-[10px] font-pixel mb-1 opacity-60 transition-opacity ${isBurned ? 'text-gray-600' : 'text-gray-400 group-hover:opacity-100'}`}>
        [{id}]
      </div>

      <motion.button
        whileHover={disabled || isBurned ? {} : { scale: 1.02, x: -2 }}
        whileTap={disabled || isBurned ? {} : { scale: 0.98 }}
        onClick={disabled || isBurned ? undefined : onClick}
        animate={isBurned ? {
          opacity: 0.35,
          filter: `grayscale(${burningConfig?.grayscaleIntensity || 100}%)`,
          scale: burningConfig?.scaleReduction || 0.95
        } : {}}
        transition={{ duration: burningConfig?.animationDuration || 0.8 }}
        className={`relative w-full text-left text-sm font-bold font-pixel py-2 px-3 leading-tight 
          ${isBurned ? 'bg-gray-800 text-gray-600 shadow-none cursor-default' : `${theme.bg} ${theme.text} ${theme.shadow}`} 
          ${glitch && !isBurned ? 'animate-pulse border border-red-500' : ''}`}
        style={{
          clipPath: `polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)`
        }}
      >
        {/* [NEW] 燃烧灰烬效果覆盖层 */}
        {isBurned && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, burningConfig?.ashOpacity || 0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            className="absolute inset-0 bg-gradient-to-t from-gray-600/50 via-transparent to-gray-400/20 pointer-events-none rounded-sm"
          />
        )}
        
        <span className={isBurned ? 'line-through decoration-gray-600' : ''}>
          {label}
        </span>
        
        {/* 悬停时的详细提示 - D选项专用（燃烧时不显示） */}
        {!isBurned && isDOption && (
          <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-gray-900/95 border border-red-500/30 rounded-lg text-xs z-50 shadow-xl">
            <div className="text-gray-400 mb-2 text-center font-bold">⚠️ 真相的代价</div>
            
            {/* 伤害对比 */}
            <div className="bg-black/30 rounded p-2 mb-2">
              <div className="flex justify-between text-red-400/70 line-through text-[10px]">
                <span>原始伤害</span>
                <span>{reductionInfo?.originalHp || -18} HP</span>
              </div>
              <div className="flex justify-between text-green-400 font-bold">
                <span>档案减免后</span>
                <span>{reductionInfo?.actualHp || -18} HP</span>
              </div>
              {hasReduction && (
                <div className="text-center text-cyan-400 text-[9px] mt-1">
                  💚 节省 {reductionInfo!.originalHp - reductionInfo!.actualHp} HP
                </div>
              )}
            </div>
            
            {/* 解锁档案提示 */}
            <div className="border-t border-gray-700 pt-2">
              <div className="flex items-center gap-1 text-amber-400 mb-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-bold">首次选择解锁档案</span>
              </div>
              <div className="text-gray-400 text-[9px] leading-relaxed">
                解锁的档案将永久保存，下次轮回中D选项伤害降低
              </div>
            </div>
            
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/95 border-r border-b border-red-500/30 rotate-45"></div>
          </div>
        )}
        
        <div className={`absolute bottom-0 -right-[6px] w-[6px] h-[6px] ${isBurned ? 'bg-gray-800' : theme.bg}`} style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }} />
        <div className={`absolute bottom-[0px] right-[0px] w-[4px] h-[4px] ${isBurned ? 'bg-gray-800' : theme.bg}`} />
      </motion.button>

      <div className="w-0 md:w-0"></div> 
    </div>
  );
};

const PixelReceivedBubble: React.FC<{ text: string; glitch?: boolean }> = ({ text, glitch }) => {
  return (
    <div className="flex justify-start items-end gap-2 w-full pr-4 pl-2">
      <div className="w-6 h-6 bg-[#8E8E93] rounded-full flex-shrink-0 mb-1 shadow-sm border border-black/10"></div>
      <div 
        className={`relative w-full text-left text-sm font-bold font-pixel py-2 px-3 leading-tight bg-[#E9E9EB] text-black shadow-[2px_2px_0px_#999] ${glitch ? 'border border-red-400' : ''}`}
        style={{ clipPath: `polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)` }}
      >
        {text}
        <div className="absolute bottom-0 -left-[6px] w-[6px] h-[6px] bg-[#E9E9EB]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
        <div className="absolute bottom-[0px] left-[0px] w-[4px] h-[4px] bg-[#E9E9EB]" />
      </div>
    </div>
  );
};

// 手机组件
const PixelPhone: React.FC<{ 
  options: any[]; 
  onChoose: (id: string) => void;
  selectedId: string | null;
  dOptionLocked?: boolean;
}> = ({ options, onChoose, selectedId, dOptionLocked }) => {
  const [showOptions, setShowOptions] = useState(false);
  
  // [NEW] 使用 Hook 获取燃烧效果配置
  const { enabled: burningEnabled } = useBurningConfig();
  const hasSelection = selectedId !== null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOptions(true);
    }, pacing.delayPhoneSlideInMs);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-[450px] h-[620px] flex items-center justify-center">
      <img 
        src="/assets/ui/pixel_phone_frame.png" 
        alt="Phone Shell"
        className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
      />
      
      <div className="absolute inset-0 border-[12px] border-gray-800 bg-gray-900 rounded-[30px] z-10 shadow-xl" style={{ display: 'none' }} id="fallback-shell"></div>

      <div className="relative z-10 w-[52%] h-[72%] bg-[#f2f2f7] rounded-[30px] overflow-hidden flex flex-col font-pixel mb-[138px] mr-[100px]">
        <div className="absolute inset-0 pointer-events-none z-20 opacity-10 bg-[linear-gradient(#000_1px,transparent_1px)] [background-size:100%_4px]" />

        <div className="h-12 w-full flex justify-between items-end px-5 pb-1 text-[10px] font-bold text-black font-pixel z-20 select-none">
           <span>9:41</span>
           <div className="flex gap-1">
             <span>5G</span>
             <span>[|||]</span>
           </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-center pb-[80px] relative z-30 pointer-events-auto">
          <div className="text-center text-[10px] text-gray-400 font-pixel mb-6">
             iMessage<br/>
             Today 9:41 AM
          </div>

          <div className="flex flex-col w-full space-y-5">
            <motion.div initial={{ opacity: 0, x: -20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.2, duration: 0.4 }}>
              <PixelReceivedBubble text="你怎么看？" />
            </motion.div>

            <AnimatePresence mode="popLayout"> 
              {showOptions && options.map((opt) => {
                // [NEW] 计算燃烧状态：已选择其他选项，且当前不是被选中的
                const isBurned = burningEnabled && hasSelection && selectedId !== opt.id;
                
                return (
                  <motion.div 
                    key={opt.id} 
                    layout 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <PixelSMSBubble 
                      key={opt.id}
                      {...opt}
                      onClick={() => onChoose(opt.id)}
                      type={selectedId ? 'safe' : opt.type}
                      disabled={(opt.id === 'D' && dOptionLocked) || isBurned}
                      glitch={opt.glitch}
                      isBurned={isBurned}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-black/80 rounded-full z-30"></div>
      </div>
    </div>
  );
};

// 主组件
export const MessageWindow: React.FC<MessageWindowProps> = React.memo(({ event }) => {
  if (!event || !event.options) return null;
  
  const { resolveEventOption, vitality, unlockedArchives } = useGameStore();
  const { playSfx } = useAudioStore();
  const currentInsight = vitality.metrics.insight;
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [stage, setStage] = useState<'INIT' | 'TYPING_TITLE' | 'TYPING_BODY' | 'INTERACTIVE'>('INIT');
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [showReductionModal, setShowReductionModal] = useState(false);
  
  // [NEW] D选项确认弹窗
  const [dOptionConfirm, setDOptionConfirm] = useState<{
    isOpen: boolean;
    impact: { hp?: number; san?: number; gold?: number; unlocksArchive?: boolean };
  }>({ isOpen: false, impact: {} });
  
  // 🌟 是否已看过D选项引导（本次游戏会话）
  const [hasSeenDOptionGuide, setHasSeenDOptionGuide] = useState(() => {
    return sessionStorage.getItem('sanguo_seen_d_guide') === 'true';
  });
  
  const bodyCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 获取System Gaze状态
  const gazeEffects = getCurrentGazeEffects({ unlockedArchives: unlockedArchives || [] } as any);
  const gazeNarrative = getGazeNarrative(gazeEffects.intensity);
  const isGazeEvent = event.id?.startsWith('GAZE_');

  useEffect(() => {
    setStage('INIT');
    setModifiers([]);
    const timer = setTimeout(() => {
      setStage('TYPING_TITLE');
    }, pacing.delayTitleToBodyMs);
    return () => clearTimeout(timer);
  }, [event.id]);
  
  useEffect(() => {
    return () => {
      if (bodyCompleteTimerRef.current) clearTimeout(bodyCompleteTimerRef.current);
      if (optionClickTimerRef.current) clearTimeout(optionClickTimerRef.current);
    };
  }, []);

  const handleTitleComplete = useCallback(() => {
    setStage('TYPING_BODY');
  }, []);

  const handleBodyComplete = useCallback(() => {
    if (bodyCompleteTimerRef.current) clearTimeout(bodyCompleteTimerRef.current);
    bodyCompleteTimerRef.current = setTimeout(() => {
      setStage('INTERACTIVE');
      playSfx('sfx_cash');
    }, ui.animationTimings.stageTransitionDelay);
  }, [playSfx]);

  // [NEW] 实际执行选项选择
  const executeOptionSelect = (id: string) => {
    playSfx('sfx_click');
    setSelectedOptId(id);
    
    // 如果选择D选项且有减免，显示结算动画
    if (id === 'D' && dOptionReduction > 0) {
      setShowReductionModal(true);
      setTimeout(() => setShowReductionModal(false), 3000);
    }
    
    if (optionClickTimerRef.current) clearTimeout(optionClickTimerRef.current);
    optionClickTimerRef.current = setTimeout(() => {
      if (resolveEventOption) {
        const result = resolveEventOption(id as 'A' | 'B' | 'C' | 'D');
        if (result?.modifiers) {
          setModifiers(result.modifiers);
        }
      }
    }, pacing.autoResolveDelayMs);
  };
  
  const handleOptionClick = (id: string) => {
    // [NEW] D选项高风险确认流程
    if (id === 'D') {
      const impact = {
        hp: event.options.D?.effects?.hp,
        san: event.options.D?.effects?.insight,
        gold: event.options.D?.effects?.gold,
        unlocksArchive: true,
      };
      
      // 高风险D选项显示确认弹窗
      if (isHighRiskOption(impact)) {
        setDOptionConfirm({ isOpen: true, impact });
        return;
      }
    }
    
    // 普通选项直接执行
    executeOptionSelect(id);
  };
  
  // [NEW] D选项确认后执行
  const handleDOptionConfirm = () => {
    setDOptionConfirm({ ...dOptionConfirm, isOpen: false });
    executeOptionSelect('D');
  };

  // [NEW] 监听键盘快捷键选择事件选项（Q/W/E/R）
  useEffect(() => {
    const handleKeyboardOption = (e: CustomEvent<{ option: string }>) => {
      const optionId = e.detail.option;
      
      // 只有在交互阶段才响应
      if (stage !== 'INTERACTIVE') return;
      
      // 检查选项是否存在
      const optionMap: Record<string, string> = { 'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D' };
      if (!optionMap[optionId]) return;
      
      // D选项特殊处理
      if (optionId === 'D' && !canSeeDOption) return;
      
      // 执行选择
      handleOptionClick(optionId);
    };

    window.addEventListener('select-event-option', handleKeyboardOption as EventListener);
    return () => {
      window.removeEventListener('select-event-option', handleKeyboardOption as EventListener);
    };
  }, [stage, canSeeDOption]);
  
  // 检查D选项是否可用 (支持 insightLock 或 sanLock)
  const dOptionInsightLock = (event.options.D as any)?.insightLock 
    || (event.options.D as any)?.sanLock 
    || 70;
  const canSeeDOption = currentInsight >= dOptionInsightLock;
  const dOptionGlitch = event.options.D?.isGlitched || isGazeEvent;
  
  // 计算D选项减免信息
  const totalArchives = unlockedArchives?.length || 0;
  const dOptionReduction = calculateDOptionReduction(totalArchives);
  const dOptionOriginalHp = event.options.D?.effects?.hp || -18;
  const dOptionActualHp = Math.round(dOptionOriginalHp * (1 - dOptionReduction));
  
  const dOptionReductionInfo = {
    reductionPercent: Math.round(dOptionReduction * 100),
    originalHp: dOptionOriginalHp,
    actualHp: dOptionActualHp
  };
  
  // 构建选项列表
  const options = [
    { id: 'A', label: event.options.A?.label || '', type: 'risk', reductionInfo: null },
    { id: 'B', label: event.options.B?.label || '', type: 'safe', reductionInfo: null },
    { id: 'C', label: event.options.C?.label || '', type: 'special', reductionInfo: null },
    ...(canSeeDOption ? [{ 
      id: 'D', 
      label: event.options.D?.label || '', 
      type: 'awakening',
      glitch: dOptionGlitch,
      reductionInfo: dOptionReductionInfo
    }] : []),
  ].filter(opt => opt.label);

  const descriptionText = event.text;
  // 使用单张事件图（完整场景）
  const eventImg = (event as any).image || event.eventImage || event.bgImage || '/assets/events/default_event.png';

  const shouldHideTitle = isFocusMode || stage === 'INIT' || !!selectedOptId;

  return (
    <div 
      className="fixed inset-0 z-30 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
      aria-describedby="event-description"
    >
      {/* Glitch覆盖层 */}
      {(dOptionGlitch || isGazeEvent) && <GlitchOverlay intensity={gazeEffects.intensity} />}
      
      {/* 背景 - 使用事件图（完整场景）作为全屏背景 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0"
      >
        <img src={eventImg} alt="Event Scene" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      {/* 开眼动画 */}
      <motion.div
        key={`eye-${event.id}`} 
        initial={{ clipPath: 'ellipse(0% 0% at 50% 50%)', filter: 'blur(20px)', background: '#000' }}
        animate={{ clipPath: 'ellipse(150% 150% at 50% 50%)', filter: 'blur(0px)', background: 'transparent' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-50 pointer-events-none"
      />

      {/* System Gaze警告 */}
      {gazeNarrative && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-900/50 border border-red-500/50 rounded-lg"
        >
          <div className="flex items-center gap-2 text-red-200 text-sm">
            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{gazeNarrative}</span>
          </div>
        </motion.div>
      )}
      
      {/* [NEW] D选项确认弹窗 */}
      <DOptionConfirm
        isOpen={dOptionConfirm.isOpen}
        impact={dOptionConfirm.impact}
        onConfirm={handleDOptionConfirm}
        onCancel={() => setDOptionConfirm({ ...dOptionConfirm, isOpen: false })}
      />

      {/* 事件插图 - 已合并到背景，此处不再需要单独显示前景图 */}

      {/* 专注模式点击层 */}
      {stage === 'INTERACTIVE' && (
        <div 
          className="absolute inset-0 z-35 cursor-pointer pointer-events-auto"
          onClick={() => setIsFocusMode(!isFocusMode)}
          title="点击切换专注模式"
        />
      )}

      {/* 顶部标题框 */}
      <motion.div 
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={shouldHideTitle ? { y: -200, x: "-50%", opacity: 0 } : { y: 0, x: "-50%", opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-[15%] left-1/2 w-[90%] md:w-[80%] z-40 pointer-events-none" 
      >
        <div 
          className={`bg-black/40 backdrop-blur-md border-2 border-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] transition-all ${isFocusMode ? 'pointer-events-none' : 'pointer-events-auto'}`}
          role="document"
        >
          <h2 
            id="event-title"
            className={`font-pixel font-bold text-xl mb-4 tracking-widest uppercase border-b-2 border-white/20 pb-2 ${isGazeEvent ? 'text-red-400' : 'text-cyan-400'}`}
          >
            {stage === 'TYPING_TITLE' && (
              <TypewriterText text={event.title} onComplete={handleTitleComplete} glitch={isGazeEvent} />
            )}
            {(stage === 'TYPING_BODY' || stage === 'INTERACTIVE') && event.title}
          </h2>
          <div id="event-description" className="text-gray-200 text-sm md:text-lg min-h-[60px] font-pixel">
            {stage === 'TYPING_BODY' && (
              <TypewriterText text={descriptionText} onComplete={handleBodyComplete} glitch={isGazeEvent} />
            )}
            {stage === 'INTERACTIVE' && (
              <span className="font-pixel leading-relaxed tracking-wide">{descriptionText}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* 修改器显示 */}
      {modifiers.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2"
        >
          {modifiers.map((mod, i) => (
            <span key={i} className="px-2 py-1 bg-purple-900/70 border border-purple-500/50 rounded text-xs text-purple-200">
              {mod}
            </span>
          ))}
        </motion.div>
      )}
      
      {/* D选项减免结算动画 */}
      <AnimatePresence>
        {showReductionModal && selectedOptId === 'D' && dOptionReduction > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="bg-gray-900/95 border-2 border-cyan-500 rounded-2xl p-6 shadow-[0_0_50px_rgba(34,211,238,0.3)] min-w-[280px]">
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-4xl mb-3"
                >
                  📜
                </motion.div>
                <div className="text-cyan-400 font-bold text-lg mb-1">档案已激活</div>
                <div className="text-gray-400 text-xs mb-4">来自过去轮回的记忆保护着你</div>
                
                {/* 减免对比可视化 */}
                <div className="bg-black/40 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center flex-1">
                      <div className="text-red-400 text-2xl font-bold">{dOptionOriginalHp}</div>
                      <div className="text-gray-500 text-xs">原始伤害</div>
                    </div>
                    
                    <div className="text-cyan-500 flex flex-col items-center px-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div className="text-xs font-bold">-{Math.round(dOptionReduction * 100)}%</div>
                    </div>
                    
                    <div className="text-center flex-1">
                      <motion.div 
                        initial={{ scale: 1.5, color: '#4ade80' }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-green-400 text-2xl font-bold"
                      >
                        {dOptionActualHp}
                      </motion.div>
                      <div className="text-gray-500 text-xs">实际伤害</div>
                    </div>
                  </div>
                  
                  {/* 节省的HP */}
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">你避免了</span>
                      <span className="text-green-400 font-bold">
                        {dOptionOriginalHp - dOptionActualHp} HP 的损失
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  已解锁 {totalArchives} 份档案
                </div>
                <div className="text-[10px] text-cyan-400/70 mt-1">
                  继续收集以降低更多代价
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage === 'INTERACTIVE' && (
          <>
            {/* [UPDATED] 左下角人物 - 根据阶级和灵视切换 */}
            <PlayerSprite 
              key={vitality.identity.currentClass}
              currentClass={vitality.identity.currentClass}
              insight={vitality.metrics.insight}
              maxInsight={vitality.metrics.maxInsight}
              isFocusMode={isFocusMode}
            />

            {/* 🌟 能看到D选项时的引导提示（只显示一次） */}
            {canSeeDOption && !selectedOptId && stage === 'INTERACTIVE' && !hasSeenDOptionGuide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute bottom-[400px] right-[50px] z-[55] max-w-[200px]"
                onAnimationComplete={() => {
                  sessionStorage.setItem('sanguo_seen_d_guide', 'true');
                  setHasSeenDOptionGuide(true);
                }}
              >
                <div className="bg-cyan-900/90 border border-cyan-500/50 rounded-xl p-4 shadow-xl relative">
                  <button 
                    onClick={() => setHasSeenDOptionGuide(true)}
                    className="absolute top-1 right-1 text-cyan-500/50 hover:text-cyan-400 text-xs"
                  >
                    ✕
                  </button>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <div className="text-cyan-400 font-bold text-sm mb-1">真相选项已解锁</div>
                      <div className="text-gray-300 text-xs leading-relaxed">
                        选择 ⚠️ 会承受伤害，但将<span className="text-cyan-400 font-bold">解锁档案</span>，永久降低未来代价
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 right-8 w-4 h-4 bg-cyan-900/90 border-b border-r border-cyan-500/50 rotate-45"></div>
                </div>
              </motion.div>
            )}

            {/* 键盘快捷键提示 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-[80px] right-[20px] z-[55] text-[10px] text-gray-500"
              aria-hidden="true"
            >
              <div className="flex gap-2">
                {['Q','W','E','R'].map((key, i) => (
                  <span key={key} className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600">
                    {key}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* 右下角手机 */}
            <motion.div
              initial={{ x: '100%', y: '100%', rotate: 10 }}
              animate={isFocusMode ? { x: 100, y: 300, rotate: 10, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="absolute bottom-[-100px] right-[0px] z-50 pointer-events-auto origin-bottom-right"
              style={{ pointerEvents: isFocusMode ? 'none' : 'auto' }}
            >
              <PixelPhone 
                options={options} 
                selectedId={selectedOptId} 
                onChoose={handleOptionClick}
                dOptionLocked={!canSeeDOption}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* 底部状态栏 - 档案与System Gaze状态 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-0 left-0 right-0 h-10 bg-black/60 border-t border-gray-700/50 
                   flex items-center justify-between px-6 text-xs z-40 pointer-events-auto"
      >
        <div className="flex items-center gap-6">
          {/* 档案数量 */}
          <div className="flex items-center gap-2 text-cyan-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="font-pixel">档案: {totalArchives}</span>
          </div>
          
          {/* D选项减免率 */}
          {dOptionReduction > 0 && (
            <div className="flex items-center gap-2 text-green-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-pixel">D选项减免: {Math.round(dOptionReduction * 100)}%</span>
              {/* 进度条 */}
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(dOptionReduction / 0.67) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
              <span className="text-[9px] text-gray-500">上限67%</span>
            </div>
          )}
        </div>
        
        {/* System Gaze强度（如果>0） */}
        {gazeEffects.intensity > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-pixel">系统关注: {Math.round(gazeEffects.intensity * 100)}%</span>
            </div>
            
            {/* 🌟 Gaze低语提示（高Gaze时显示） */}
            {gazeEffects.intensity >= 0.3 && (
              <GazeWhisper intensity={gazeEffects.intensity} />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
});

MessageWindow.displayName = 'MessageWindow';

export default MessageWindow;
