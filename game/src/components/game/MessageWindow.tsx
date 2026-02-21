import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { GameEvent } from '@/types/schema';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import { getCurrentGazeEffects, getGazeNarrative } from '@/logic/gazeEventSystem';

const { pacing, ui } = NARRATIVE_RULES;

interface MessageWindowProps {
  event: GameEvent;
}

// 打字机组件
const TypewriterText: React.FC<{ text: string; onComplete?: () => void; glitch?: boolean }> = ({ 
  text, onComplete, glitch = false 
}) => {
  const [display, setDisplay] = useState('');
  const { playSfx } = useAudioStore();

  useEffect(() => {
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
  }, [text, playSfx, onComplete, glitch]);

  return (
    <span className={`font-pixel leading-relaxed tracking-wide ${glitch ? 'text-red-400' : ''}`}>
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

// 气泡组件
const PixelSMSBubble: React.FC<{
  label: string;
  id: string;
  type: string;
  onClick: () => void;
  disabled?: boolean;
  glitch?: boolean;
}> = ({ label, id, type, onClick, disabled, glitch }) => {
  
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

  return (
    <div className={`flex justify-end items-end gap-2 group w-full pl-2 ${disabled ? 'opacity-50' : ''}`}>
      <div className="text-[10px] text-gray-400 font-pixel mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
        [{id}]
      </div>

      <motion.button
        whileHover={disabled ? {} : { scale: 1.02, x: -2 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        onClick={disabled ? undefined : onClick}
        className={`relative w-full text-left text-sm font-bold font-pixel py-2 px-3 leading-tight ${theme.bg} ${theme.text} ${theme.shadow} ${glitch ? 'animate-pulse border border-red-500' : ''}`}
        style={{
          clipPath: `polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)`
        }}
      >
        {label}
        <div className={`absolute bottom-0 -right-[6px] w-[6px] h-[6px] ${theme.bg}`} style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }} />
        <div className={`absolute bottom-[0px] right-[0px] w-[4px] h-[4px] ${theme.bg}`} />
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

      <div className="relative z-10 w-[52%] h-[72%] bg-[#f2f2f7] rounded-[30px] overflow-hidden flex flex-col font-sans mb-[138px] mr-[100px]">
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
              {showOptions && options
                .filter(opt => selectedId ? opt.id === selectedId : true) 
                .map((opt) => (
                  <motion.div key={opt.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <PixelSMSBubble 
                      key={opt.id}
                      {...opt}
                      onClick={() => onChoose(opt.id)}
                      type={selectedId ? 'safe' : opt.type}
                      disabled={opt.id === 'D' && dOptionLocked}
                      glitch={opt.glitch}
                    />
                  </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-black/80 rounded-full z-30"></div>
      </div>
    </div>
  );
};

// 主组件
export const MessageWindow: React.FC<MessageWindowProps> = ({ event }) => {
  if (!event || !event.options) return null;
  
  const { resolveEventOption, vitality, unlockedArchives } = useGameStore();
  const { playSfx } = useAudioStore();
  const currentInsight = vitality.metrics.insight;
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [stage, setStage] = useState<'INIT' | 'TYPING_TITLE' | 'TYPING_BODY' | 'INTERACTIVE'>('INIT');
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);
  const [modifiers, setModifiers] = useState<string[]>([]);
  
  const bodyCompleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const optionClickTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleOptionClick = (id: string) => {
    playSfx('sfx_click');
    setSelectedOptId(id);
    
    if (optionClickTimerRef.current) clearTimeout(optionClickTimerRef.current);
    optionClickTimerRef.current = setTimeout(() => {
      if (resolveEventOption) {
        // 传递选项类型和事件数据以应用修改器
        const result = resolveEventOption(id as 'A' | 'B' | 'C' | 'D');
        if (result?.modifiers) {
          setModifiers(result.modifiers);
        }
      }
    }, pacing.autoResolveDelayMs);
  };
  
  // 检查D选项是否可用 (insightLock is the property name in schema)
  const dOptionInsightLock = (event.options.D as any)?.insightLock || 70;
  const canSeeDOption = currentInsight >= dOptionInsightLock;
  const dOptionGlitch = event.options.D?.isGlitched || isGazeEvent;
  
  // 构建选项列表
  const options = [
    { id: 'A', label: event.options.A?.label || '', type: 'risk' },
    { id: 'B', label: event.options.B?.label || '', type: 'safe' },
    { id: 'C', label: event.options.C?.label || '', type: 'special' },
    ...(canSeeDOption ? [{ 
      id: 'D', 
      label: event.options.D?.label || '', 
      type: 'awakening',
      glitch: dOptionGlitch
    }] : []),
  ].filter(opt => opt.label);

  const descriptionText = event.text;
  // v3事件使用layer字段
  const bgImg = (event as any).layer?.background || event.bgImage || '/assets/scenes/default_bg.png';
  const eventImg = (event as any).layer?.foreground || event.eventImage || '/assets/events/default_event.png';

  const isCenterPosition = isFocusMode || stage !== 'INTERACTIVE';
  const shouldHideTitle = isFocusMode || stage === 'INIT' || !!selectedOptId;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* Glitch覆盖层 */}
      {(dOptionGlitch || isGazeEvent) && <GlitchOverlay intensity={gazeEffects.intensity} />}
      
      {/* 背景 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0"
      >
        <img src={bgImg} alt="Background" className="w-full h-full object-cover opacity-60 brightness-75" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80" />
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

      {/* 事件插图 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: -50 }}
        animate={{ 
          opacity: 1, 
          y: "-44%",   
          x: "-50%",   
          left: isCenterPosition ? "50%" : "40%" ,
          scale: (stage === 'INIT' || isFocusMode) ? 1.05 : 1,
        }}
        transition={{ 
          scale: { duration: 3.5, ease: "easeInOut" },
          default: { type: "spring", stiffness: 60, damping: 20, duration: 0.8 }
        }}
        className="absolute top-1/2 w-[80%] md:w-[45%] aspect-[4/3] z-20 shadow-2xl overflow-hidden rounded-2xl border-4 border-white/10"
      >
        <img src={eventImg} alt="Event Subject" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]" />
      </motion.div>

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
        <div className={`bg-black/40 backdrop-blur-md border-2 border-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] transition-all ${isFocusMode ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <h2 className={`font-pixel font-bold text-xl mb-4 tracking-widest uppercase border-b-2 border-white/20 pb-2 ${isGazeEvent ? 'text-red-400' : 'text-cyan-400'}`}>
            {stage === 'TYPING_TITLE' && (
              <TypewriterText text={event.title} onComplete={handleTitleComplete} glitch={isGazeEvent} />
            )}
            {(stage === 'TYPING_BODY' || stage === 'INTERACTIVE') && event.title}
          </h2>
          <div className="text-gray-200 text-sm md:text-lg min-h-[60px] font-pixel">
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

      <AnimatePresence>
        {stage === 'INTERACTIVE' && (
          <>
            {/* 左下角人物 */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isFocusMode ? { opacity: 0, x: -200 } : { opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute bottom-0 left-0 md:left-10 z-40 w-[40%] md:w-[25%] pointer-events-none"
            >
              <img src="/assets/scenes/player_back.png" alt="Player" className="w-full object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]" />
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
    </div>
  );
};

export default MessageWindow;
