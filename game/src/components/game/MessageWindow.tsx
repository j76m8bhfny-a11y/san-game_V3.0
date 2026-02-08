import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { GameEvent } from '@/types/schema';
// 👇 1. 引入配置文件
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';

// 便捷引用配置
const { pacing, ui } = NARRATIVE_RULES;

// --- 类型定义 ---
interface MessageWindowProps {
  event: GameEvent;
}

// --- 组件：打字机文本 ---
const TypewriterText: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
  const [display, setDisplay] = useState('');
  const { playSfx } = useAudioStore();

  useEffect(() => {
    let i = 0;
    setDisplay('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplay(text.substring(0, i + 1));
        if (i % 2 === 0) playSfx('sfx_typing');
        i++;
      } else {
        clearInterval(timer);
        onComplete && onComplete();
      }
    }, pacing.typewriterSpeedMs); // ✅ 替换: 读取配置中的打字速度
    return () => clearInterval(timer);
  }, [text, playSfx, onComplete]);

  return <span className="font-pixel leading-relaxed tracking-wide">{display}</span>;
};

// --- ✨ 组件：iOS 像素短信气泡 ---
const PixelSMSBubble: React.FC<{ 
  label: string; 
  id: string; 
  type: string; 
  onClick: () => void; 
}> = ({ label, id, type, onClick }) => {
  
  // ✅ 修复类型错误的核心：
  // 1. 使用 (ui.bubbleColors as any) 允许使用字符串 type 进行索引
  // 2. 添加 || ui.bubbleColors.default 作为兜底，防止 crash
  const theme = (ui.bubbleColors as any)[type] || ui.bubbleColors.default;

  return (
    <div className="flex justify-end items-end gap-2 group w-full pl-2">
      
      {/* 1. 序号/时间戳 */}
      <div className="text-[10px] text-gray-400 font-pixel mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
        [{id}]
      </div>

      {/* 2. 气泡主体 */}
      <motion.button
        whileHover={{ scale: 1.02, x: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        // ✅ 使用配置中的 class (theme.bg, theme.text, theme.shadow)
        className={`relative w-full text-left text-sm font-bold font-pixel py-2 px-3 leading-tight ${theme.bg} ${theme.text} ${theme.shadow}`}
        style={{
          clipPath: `polygon(
            4px 0, calc(100% - 4px) 0, 
            100% 4px, 100% calc(100% - 4px), 
            calc(100% - 4px) 100%, 4px 100%, 
            0 calc(100% - 4px), 0 4px
          )`
        }}
      >
        {/* 文本内容 */}
        {label}

        {/* 3. 小尾巴 (Tail) */}
        <div 
          className={`absolute bottom-0 -right-[6px] w-[6px] h-[6px] ${theme.bg}`}
          style={{
            clipPath: 'polygon(0 0, 0 100%, 100% 100%)' // 直角三角形
          }}
        />
        
        {/* 尾巴的像素修正 */}
        <div className={`absolute bottom-[0px] right-[0px] w-[4px] h-[4px] ${theme.bg}`} />

      </motion.button>

      {/* 4. 占位 */}
      <div className="w-0 md:w-0"></div> 
    </div>
  );
};

// --- 组件：接收到的消息 (灰色左对齐气泡) ---
const PixelReceivedBubble: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex justify-start items-end gap-2 w-full pr-4 pl-2">
      
      {/* 1. 头像 */}
      <div className="w-6 h-6 bg-[#8E8E93] rounded-full flex-shrink-0 mb-1 shadow-sm border border-black/10"></div>

      {/* 2. 气泡主体 */}
      <div 
        className="relative w-full text-left text-sm font-bold font-pixel py-2 px-3 leading-tight bg-[#E9E9EB] text-black shadow-[2px_2px_0px_#999]"
        style={{
          clipPath: `polygon(
            4px 0, calc(100% - 4px) 0, 
            100% 4px, 100% calc(100% - 4px), 
            calc(100% - 4px) 100%, 4px 100%, 
            0 calc(100% - 4px), 0 4px
          )`
        }}
      >
        {text}

        {/* 3. 左侧小尾巴 */}
        <div 
          className="absolute bottom-0 -left-[6px] w-[6px] h-[6px] bg-[#E9E9EB]"
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' 
          }}
        />
        
        {/* 尾巴像素修正 */}
        <div className="absolute bottom-[0px] left-[0px] w-[4px] h-[4px] bg-[#E9E9EB]" />
      </div>
    </div>
  );
};

// --- 组件：像素手机 ---
const PixelPhone: React.FC<{ options: any[]; onChoose: (id: string) => void;
  selectedId: string | null; 
}> = ({ options, onChoose , selectedId }) => {
  const [showOptions, setShowOptions] = useState(false);

  // 模拟消息延迟
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOptions(true);
    }, pacing.delayPhoneSlideInMs); // ✅ 替换: 读取配置中的手机滑入延迟
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-[450px] h-[620px] flex items-center justify-center">
      
      {/* 1. 外壳层 */}
      <img 
        src="/assets/ui/pixel_phone_frame.png" 
        alt="Phone Shell"
        className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
      />
      
      {/* 兜底外壳 */}
      <div className="absolute inset-0 border-[12px] border-gray-800 bg-gray-900 rounded-[30px] z-10 shadow-xl" style={{ display: 'none' }} id="fallback-shell"></div>

      {/* 2. 屏幕层 */}
      <div className="
        relative z-10 
        w-[52%] h-[72%] 
        bg-[#f2f2f7] 
        rounded-[30px] 
        overflow-hidden 
        flex flex-col font-sans
        mb-[138px]
        mr-[100px]
      ">
        
        <div className="absolute inset-0 pointer-events-none z-20 opacity-10 bg-[linear-gradient(#000_1px,transparent_1px)] [background-size:100%_4px]" />

        {/* 顶部状态栏 */}
        <div className="h-12 w-full flex justify-between items-end px-5 pb-1 text-[10px] font-bold text-black font-pixel z-20 select-none">
           <span>9:41</span>
           <div className="flex gap-1">
             <span>5G</span>
             <span>[|||]</span>
           </div>
        </div>

        {/* 聊天内容区 */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-center 
          pb-[80px] relative z-30 pointer-events-auto">
          
          <div className="text-center text-[10px] text-gray-400 font-pixel mb-6">
             iMessage<br/>
             Today 9:41 AM
          </div>

          <div className="flex flex-col w-full space-y-5">
            
            {/* 对方的消息 */}
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <PixelReceivedBubble text="你怎么看？" />
            </motion.div>

            {/* 我的选项 */}
            <AnimatePresence mode="popLayout"> 
              {showOptions && options
                .filter(opt => selectedId ? opt.id === selectedId : true) 
                .map((opt) => (
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
                      onClick={() => !selectedId && onChoose(opt.id)}
                      // 如果已选中，显示 safe (蓝色)，否则显示各自的类型
                      type={selectedId ? 'safe' : opt.type} 
                    />
                  </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 底部 Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-black/80 rounded-full z-30"></div>
      </div>
    </div>
  );
};

// --- 主组件 ---
export const MessageWindow: React.FC<MessageWindowProps> = ({ event }) => {
  if (!event || !event.options) return null;
  const { resolveEventOption, vitality } = useGameStore();
  const { san } = vitality.metrics; 
  const { playSfx } = useAudioStore();
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [stage, setStage] = useState<'INIT' | 'TYPING_TITLE' | 'TYPING_BODY' | 'INTERACTIVE'>('INIT');
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null);

  useEffect(() => {
    setStage('INIT');
    const timer = setTimeout(() => {
      setStage('TYPING_TITLE');
    }, pacing.delayTitleToBodyMs); // ✅ 替换: 读取配置
    return () => clearTimeout(timer);
  }, [event.id]);

  const handleTitleComplete = useCallback(() => {
    setStage('TYPING_BODY');
  }, []);

  const handleBodyComplete = useCallback(() => {
    setTimeout(() => {
      setStage('INTERACTIVE');
      playSfx('sfx_cash'); 
    }, pacing.delayBodyToInteractionMs); // ✅ 替换: 读取配置
  }, [playSfx]);

  const handleOptionClick = (id: string) => {
    playSfx('sfx_click');
    setSelectedOptId(id); 
    
    setTimeout(() => {
      if (resolveEventOption) {
        resolveEventOption(id as 'A' | 'B' | 'C' | 'D');
      } else {
        console.error("resolveEventOption is not defined in GameStore");
      }
    }, pacing.autoResolveDelayMs); // ✅ 替换: 读取配置 (500ms -> autoResolveDelayMs)
  };
  

  const options = [
    { id: 'A', label: event.options.A.label, type: 'risk' },
    { id: 'B', label: event.options.B.label, type: 'safe' },
    { id: 'C', label: event.options.C.label, type: 'special' },
    { id: 'D', label: event.options.D?.label || '', type: 'awakening' },
  ].filter(opt => opt.label);

  const descriptionText = san < 50 ? event.text.lowSan : event.text.highSan;
  const bgImg = event.bgImage || event.eventImage || '/assets/scenes/default_bg.png';
  const eventImg = event.eventImage || '/assets/events/default_event.png';

  const isCenterPosition = isFocusMode || stage !== 'INTERACTIVE';
  const shouldHideTitle = isFocusMode || stage === 'INIT' || !!selectedOptId;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* 1. 最底层：全屏背景图 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={bgImg} 
          alt="Background" 
          className="w-full h-full object-cover opacity-60 brightness-75" 
        />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80" />
      </motion.div>

      {/* 2. 开眼动画 */}
      <motion.div
        key={`eye-${event.id}`} 
        initial={{ clipPath: 'ellipse(0% 0% at 50% 50%)', filter: 'blur(20px)', background: '#000' }}
        animate={{ clipPath: 'ellipse(150% 150% at 50% 50%)', filter: 'blur(0px)', background: 'transparent' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-50 pointer-events-none"
      />

      {/* 3. 中间层：事件插图 */}
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
        <img 
          src={eventImg} 
          alt="Event Subject" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]" />
      </motion.div>

      {/* 4. 点击隐藏UI的透明层 */}
      {stage === 'INTERACTIVE' && (
        <div 
          className="absolute inset-0 z-35 cursor-pointer pointer-events-auto"
          onClick={() => setIsFocusMode(!isFocusMode)}
          title="点击切换专注模式"
        />
      )}

      {/* --- 顶部题目框 --- */}
      <motion.div 
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={shouldHideTitle 
          ? { y: -200, x: "-50%", opacity: 0 } 
          : { y: 0, x: "-50%", opacity: 1 }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-[15%] left-1/2 w-[90%] md:w-[80%] z-40 pointer-events-none" 
      >
        <div className={`bg-black/40 backdrop-blur-md border-2 border-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] transition-all ${isFocusMode ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <h2 className="text-cyan-400 font-pixel font-bold text-xl mb-4 tracking-widest uppercase border-b-2 border-white/20 pb-2">
            {stage === 'TYPING_TITLE' && (
              <TypewriterText text={event.title} onComplete={handleTitleComplete} />
            )}
            {(stage === 'TYPING_BODY' || stage === 'INTERACTIVE') && (
              event.title
            )}
          </h2>
          <div className="text-gray-200 text-sm md:text-lg min-h-[60px] font-pixel">
            {stage === 'TYPING_BODY' && (
                <TypewriterText text={descriptionText} onComplete={handleBodyComplete} />
            )}
   
            {stage === 'INTERACTIVE' && (
                <span className="font-pixel leading-relaxed tracking-wide">{descriptionText}</span>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {stage === 'INTERACTIVE' && (
          <>
            {/* --- 左下角人物 --- */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isFocusMode 
                ? { opacity: 0, x: -200 } 
                : { opacity: 1, x: 0 }
              }
              transition={{ duration: 0.8 }}
              className="absolute bottom-0 left-0 md:left-10 z-40 w-[40%] md:w-[25%] pointer-events-none"
            >
              <img 
                src="/assets/scenes/player_back.png" 
                alt="Player" 
                className="w-full object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
              />
            </motion.div>

            {/* --- 右下角手机 --- */}
            <motion.div
              initial={{ x: '100%', y: '100%', rotate: 10 }}
              animate={isFocusMode 
                ? { x: 100, y: 300, rotate: 10, opacity: 0 } 
                : { x: 0, y: 0, rotate: 0, opacity: 1 }
              }
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="absolute bottom-[-100px] right-[0px] z-50 pointer-events-auto origin-bottom-right"
              style={{ pointerEvents: isFocusMode ? 'none' : 'auto' }}
            >
             <PixelPhone 
                options={options} 
                selectedId={selectedOptId} 
                onChoose={handleOptionClick} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};