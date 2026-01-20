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
    }, 30); 
    return () => clearInterval(timer);
  }, [text, playSfx, onComplete]);

  return <span className="font-pixel leading-relaxed tracking-wide">{display}</span>;
};

// --- ✨ 新增组件：3D 像素按钮 ---
// 使用 CSS border 模拟像素游戏中的立体按钮 (NES 风格)
const Pixel3DButton: React.FC<{ 
  label: string; 
  id: string; 
  type: string; 
  onClick: () => void; 
}> = ({ label, id, type, onClick }) => {
  
  // 根据类型定义颜色方案 (主色, 亮部, 暗部)
  const colors = {
    risk:   { bg: '#e53935', light: '#ff6f60', dark: '#ab000d' }, // 红
    safe:   { bg: '#1e88e5', light: '#6ab7ff', dark: '#005cb2' }, // 蓝
    special:{ bg: '#fdd835', light: '#ffff6b', dark: '#c6a700', text: 'black' }, // 黄
    awakening: { bg: '#8e24aa', light: '#c158dc', dark: '#5c007a' } // 紫
  }[type] || { bg: '#ddd', light: '#fff', dark: '#aaa', text: 'black' };

  return (
    <motion.button
      whileHover={{ scale: 1.05, x: -5 }}
      whileTap={{ scale: 0.95, translateY: 2 }} // 按下时有物理位移感
      onClick={onClick}
      className="relative group w-full mb-3 last:mb-0"
    >
      <div 
        className="relative p-1 transition-all duration-100"
        style={{
          backgroundColor: colors.bg,
          // 3D 边框魔法：左上白，右下黑，模拟凸起
          borderTop: `4px solid ${colors.light}`,
          borderLeft: `4px solid ${colors.light}`,
          borderBottom: `4px solid ${colors.dark}`,
          borderRight: `4px solid ${colors.dark}`,
          color: colors.text || 'white',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' // 投射阴影
        }}
      >
        <div className="flex items-center gap-3 px-2 py-2">
          {/* 序号块 (嵌入式凹陷感) */}
          <div className="w-8 h-8 flex items-center justify-center font-bold border-2 border-black/20 bg-black/10 text-xs">
            {id}
          </div>
          {/* 文本 */}
          <div className="text-left text-sm font-bold leading-tight drop-shadow-md">
            {label}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

// --- 组件：像素手机 (UI Layer 5) ---
const PixelPhone: React.FC<{ options: any[]; onChoose: (id: string) => void }> = ({ options, onChoose }) => {
  return (
    // 容器尺寸调整，适应外壳
    <div className="relative w-[360px] h-[640px] flex items-center justify-center">
      
      {/* 1. 外壳层 (Pixel Art Frame) */}
      <img 
        src="/assets/ui/pixel_phone_frame.png" // 🚨 请确保你有这张图，否则用下方的兜底
        alt="Phone Shell"
        className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none drop-shadow-[10px_10px_0px_rgba(0,0,0,0.5)]"
        onError={(e) => {
           // 如果没有图片，用 CSS 画一个临时的像素壳兜底
           e.currentTarget.style.display = 'none';
        }} 
      />
      
      {/* 兜底外壳 (如果图片加载失败) */}
      <div className="absolute inset-0 border-[12px] border-gray-800 bg-gray-900 rounded-none z-10 shadow-xl" style={{ display: 'none' }} id="fallback-shell"></div>

      {/* 2. 屏幕层 (Screen) */}
      {/* 通过 padding 避开外壳的边缘 (根据你的素材调整 top/bottom/left/right) */}
      <div className="
        relative z-10 w-[86%] h-[83%] bg-[#e0f7fa] overflow-hidden flex flex-col font-sans mt-[-10%]
      ">
        
        {/* 屏幕内发光 (Inner Glow) & 扫描线 */}
        <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_40px_rgba(0,200,255,0.3)] mix-blend-multiply" />
        <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] opacity-20" />

        {/* 顶部状态栏模拟 */}
        <div className="h-6 bg-black/10 flex justify-between items-center px-2 text-[10px] font-bold text-gray-600 font-pixel">
           <span>SIGNAL: LOW</span>
           <span>BAT: 14%</span>
        </div>

        {/* 聊天内容区 */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-end pb-6 space-y-4">
          
          {/* 这里可以放聊天记录，目前主要放选项 */}
          <div className="text-center text-xs text-gray-400 font-pixel mb-4">
             - DECISION REQUIRED -
          </div>

          <div className="space-y-4">
            {options.map((opt) => (
              <Pixel3DButton 
                key={opt.id}
                {...opt}
                onClick={() => onChoose(opt.id)}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

// --- 主组件 (保持逻辑不变) ---
export const MessageWindow: React.FC<MessageWindowProps> = ({ event }) => {
  const { chooseOption, san } = useGameStore();
  const { playSfx } = useAudioStore();
  const [stage, setStage] = useState<'INIT' | 'TYPING' | 'INTERACTIVE'>('INIT');

  useEffect(() => {
    setStage('INIT');
    const timer = setTimeout(() => {
      setStage('TYPING');
    }, 1500); 
    return () => clearTimeout(timer);
  }, [event.id]);

  const handleTextComplete = () => {
    setStage('INTERACTIVE');
    playSfx('sfx_cash'); 
  };

  const options = [
    { id: 'A', label: event.options.A.label, type: 'risk' },
    { id: 'B', label: event.options.B.label, type: 'safe' },
    { id: 'C', label: event.options.C.label, type: 'special' },
    { id: 'D', label: event.options.D?.label, type: 'awakening' },
  ].filter(opt => opt.label);

  const eventImg = event.eventImage || '/assets/events/default_event.png';
  const descriptionText = san < 50 ? event.text.lowSan : event.text.highSan;

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      <motion.div
        key={`eye-${event.id}`} 
        initial={{ clipPath: 'ellipse(0% 0% at 50% 50%)', filter: 'blur(20px)', background: '#000' }}
        animate={{ clipPath: 'ellipse(150% 150% at 50% 50%)', filter: 'blur(0px)', background: 'transparent' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-50 pointer-events-none"
      />

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

      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] md:w-[80%] z-40"
      >
        <div className="bg-black/80 backdrop-blur-sm border-2 border-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
          <h2 className="text-cyan-400 font-pixel font-bold text-xl mb-4 tracking-widest uppercase border-b-2 border-white/20 pb-2">
            {event.title}
          </h2>
          <div className="text-gray-200 text-sm md:text-lg min-h-[60px] font-pixel">
             {stage !== 'INIT' && (
                <TypewriterText text={descriptionText} onComplete={handleTextComplete} />
             )}
          </div>
        </div>
      </motion.div>

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
              className="absolute bottom-[-10px] right-[-10px] md:bottom-10 md:right-10 z-50 pointer-events-auto origin-bottom-right"
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