import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { GameEvent } from '@/types/schema';

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
    // 重置显示，防止文本切换时残留
    setDisplay('');
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplay(text.substring(0, i + 1));
        if (i % 2 === 0) playSfx('sfx_typing'); // 隔字播放音效
        i++;
      } else {
        clearInterval(timer);
        onComplete && onComplete();
      }
    }, 30); // 打字速度
    return () => clearInterval(timer);
  }, [text, playSfx, onComplete]);

  return <span className="font-pixel leading-relaxed">{display}</span>;
};

// --- 组件：像素手机 (UI Layer 5) ---
const PixelPhone: React.FC<{ options: any[]; onChoose: (id: string) => void }> = ({ options, onChoose }) => {
  return (
    <div className="relative w-[320px] md:w-[380px] h-[500px] bg-gray-900 border-4 border-gray-800 rounded-[30px] shadow-2xl overflow-hidden flex flex-col">
      {/* 手机刘海/额头 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl z-20" />
      
      {/* 屏幕区域 */}
      <div className="flex-1 bg-gray-100 flex flex-col p-4 pt-10 overflow-y-auto font-sans relative">
        {/* 背景纹理 */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="flex-1" /> {/* 占位，把气泡推到底部 */}
        
        <div className="space-y-4 z-10">
          {options.map((opt, idx) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onChoose(opt.id)}
              className="w-full flex justify-end group"
            >
              <div className={`
                max-w-[90%] p-3 px-4 rounded-2xl rounded-tr-sm text-sm md:text-base text-left shadow-sm
                transition-all duration-200
                ${opt.type === 'risk' ? 'bg-red-500 text-white' : 
                  opt.type === 'safe' ? 'bg-blue-500 text-white' : 
                  'bg-[#00e05e] text-black'} 
                group-hover:scale-105 group-hover:shadow-md
              `}>
                <span className="font-bold mr-1">[{opt.id}]</span>
                {/* 🚨 [修复] 使用 .label 替代 .text */}
                {opt.label}
              </div>
            </motion.button>
          ))}
        </div>
        
        {/* 底部输入框装饰 */}
        <div className="mt-4 h-10 bg-gray-200 rounded-full border border-gray-300 flex items-center px-4 text-gray-400 text-xs">
          iMessage...
        </div>
      </div>

      {/* 手机下巴/Home条 */}
      <div className="h-6 bg-black flex justify-center items-center">
        <div className="w-1/3 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  );
};

// --- 主组件 ---
export const MessageWindow: React.FC<MessageWindowProps> = ({ event }) => {
  // 🚨 [新增] 获取 san 值用于判断文本
  const { chooseOption, san } = useGameStore();
  const { playSfx } = useAudioStore();
  
  const [stage, setStage] = useState<'INIT' | 'TYPING' | 'INTERACTIVE'>('INIT');

  // 初始化：睁眼动画 -> 开始打字
  useEffect(() => {
    // 每次 event 变化时重置状态
    setStage('INIT');
    const timer = setTimeout(() => {
      setStage('TYPING');
    }, 1500); 
    return () => clearTimeout(timer);
  }, [event.id]); // 监听 event.id 变化

  const handleTextComplete = () => {
    setStage('INTERACTIVE');
    playSfx('sfx_cash'); 
  };

  // 🚨 [修复] 选项映射使用 .label
  const options = [
    { id: 'A', label: event.options.A.label, type: 'risk' },
    { id: 'B', label: event.options.B.label, type: 'safe' },
    { id: 'C', label: event.options.C.label, type: 'special' },
    { id: 'D', label: event.options.D?.label, type: 'awakening' },
  ].filter(opt => opt.label);

  const eventImg = event.eventImage || '/assets/events/default_event.png';

  // 🚨 [修复] 根据 SAN 值选择文本 (低于 50 显示 lowSan，否则 highSan，或者反过来，根据你的设定)
  // 假设：高 SAN (High) 是正常/理智视角，低 SAN (Low) 是疯狂视角
  // 但 schema 中通常 lowSan 对应低理智时的描述。
  const descriptionText = san < 50 ? event.text.lowSan : event.text.highSan;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      
      {/* --- Phase 1: 睁眼特效层 --- */}
      <motion.div
        key={`eye-${event.id}`} // 增加 key 确保重播动画
        initial={{ clipPath: 'ellipse(0% 0% at 50% 50%)', filter: 'blur(20px)', background: '#000' }}
        animate={{ clipPath: 'ellipse(150% 150% at 50% 50%)', filter: 'blur(0px)', background: 'transparent' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-50 pointer-events-none"
      />

      {/* --- Layer 2: 事件插图 --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute top-1/2 -translate-y-1/2 left-0 md:left-[5%] w-full md:w-[60%] h-[60%] md:h-[80%] z-30 overflow-hidden rounded-r-3xl border-r-4 border-white/20 shadow-2xl"
      >
        <img 
          src={eventImg} 
          alt="Event" 
          className="w-full h-full object-cover"
          onError={(e) => e.currentTarget.src = 'https://placehold.co/800x600/222/FFF?text=NO+SIGNAL'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </motion.div>

      {/* --- Layer 3: 文本区域 --- */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] md:w-[80%] z-40"
      >
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <h2 className="text-cyan-400 font-bold text-xl mb-2 tracking-widest uppercase border-b border-white/10 pb-2">
            {event.title}
          </h2>
          <div className="text-gray-200 text-sm md:text-lg min-h-[60px]">
             {stage !== 'INIT' && (
                // 🚨 [修复] 使用动态选择的文本
                <TypewriterText text={descriptionText} onComplete={handleTextComplete} />
             )}
          </div>
        </div>
      </motion.div>

      {/* --- Phase 3: 交互介入 --- */}
      <AnimatePresence>
        {stage === 'INTERACTIVE' && (
          <>
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
              />
            </motion.div>

            <motion.div
              initial={{ x: '100%', y: '100%', rotate: 10 }}
              animate={{ x: 0, y: 0, rotate: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="absolute bottom-[-20px] right-[-20px] md:bottom-10 md:right-10 z-50 pointer-events-auto origin-bottom-right"
            >
              <PixelPhone 
                options={options} 
                onChoose={(id) => {
                  playSfx('sfx_click');
                  chooseOption(id as any);
                }} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};