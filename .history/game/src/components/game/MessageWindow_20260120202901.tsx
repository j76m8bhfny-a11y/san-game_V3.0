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

// --- ✨ 新增组件：iOS 像素短信气泡 ---
const PixelSMSBubble: React.FC<{ 
  label: string; 
  id: string; 
  type: string; 
  onClick: () => void; 
}> = ({ label, id, type, onClick }) => {
  
  // 🎨 iOS 像素配色方案
  const styles = {
    // 蓝色 (iMessage) - 安全/普通
    safe: { 
      bg: 'bg-[#007AFF]', 
      text: 'text-white',
      shadow: 'shadow-[2px_2px_0px_#004999]' // 深蓝阴影
    },
    // 红色 (Destructive) - 风险
    risk: { 
      bg: 'bg-[#FF3B30]', 
      text: 'text-white',
      shadow: 'shadow-[2px_2px_0px_#99231d]' // 深红阴影
    },
    // 金色/黄色 - 特殊
    special: { 
      bg: 'bg-[#FFCC00]', 
      text: 'text-black',
      shadow: 'shadow-[2px_2px_0px_#b38f00]' // 深金阴影
    },
    // 紫色 - 觉醒
    awakening: { 
      bg: 'bg-[#AF52DE]', 
      text: 'text-white',
      shadow: 'shadow-[2px_2px_0px_#5e2d79]' // 深紫阴影
    }
  }[type] || { bg: 'bg-[#E9E9EB]', text: 'text-black', shadow: 'shadow-[2px_2px_0px_#999]' };

  return (
    <div className="flex justify-end items-end gap-2 mb-4 group w-full pl-8">
      
      {/* 1. 序号/时间戳 (放在气泡左侧外面，模拟发送时间) */}
      <div className="text-[10px] text-gray-400 font-pixel mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
        [{id}]
      </div>

      {/* 2. 气泡主体 */}
      <motion.button
        whileHover={{ scale: 1.02, x: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative max-w-[90%] text-sm font-bold font-pixel py-2 px-3 leading-tight ${styles.bg} ${styles.text} ${styles.shadow}`}
        style={{
          // 🛠️ 核心魔法：使用 clip-path 切出像素圆角 (4px 步进)
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

        {/* 3. 小尾巴 (Tail) - 位于右下角 */}
        <div 
          className={`absolute bottom-0 -right-[6px] w-[6px] h-[6px] ${styles.bg}`}
          style={{
            clipPath: 'polygon(0 0, 0 100%, 100% 100%)' // 直角三角形
          }}
        />
        
        {/* 尾巴的像素修正 (可选，为了让连接处更自然) */}
        <div className={`absolute bottom-[0px] right-[0px] w-[4px] h-[4px] ${styles.bg}`} />

      </motion.button>

      {/* 4. 发送者头像占位 (可选，如果是右侧对齐，这里可以是空的或显示用户头像) */}
      <div className="w-0 md:w-0"></div> 
    </div>
  );
};

// --- 组件：像素手机 (UI Layer 5) ---
const PixelPhone: React.FC<{ options: any[]; onChoose: (id: string) => void }> = ({ options, onChoose }) => {
  return (
    <div className="relative w-[400px] h-[780px] flex items-center justify-center">
      
      {/* 1. 外壳层 (Pixel Art Frame) */}
      <img 
        src="/assets/ui/pixel_phone_frame.png" 
        alt="Phone Shell"
        className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none drop-shadow-[10px_10px_0px_rgba(0,0,0,0.5)]"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
      />
      
      {/* 兜底外壳 */}
      <div className="absolute inset-0 border-[12px] border-gray-800 bg-gray-900 rounded-[30px] z-10 shadow-xl" style={{ display: 'none' }} id="fallback-shell"></div>

      {/* 2. 屏幕层 (Screen) */}
      {/* 适配 iPhone 样式：全面屏、圆角、顶部挖孔 */}
      <div className="
        relative z-10 
        w-[50%] h-[58%] 
        bg-[#f2f2f7] /* iOS 浅色背景灰 */
        rounded-[30px] 
        overflow-hidden 
        flex flex-col font-sans
        mb-40               /* 上下偏移 */
        mr-20          /* 👈 新增：向左偏移 (数字越大越往左) */
      ">
        
        {/* 屏幕内发光 & 扫描线 */}
        <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]" />
        <div className="absolute inset-0 pointer-events-none z-20 opacity-10 bg-[linear-gradient(#000_1px,transparent_1px)] [background-size:100%_4px]" />

        {/* 灵动岛 (Dynamic Island) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[28%] h-7 bg-black rounded-full z-30 flex items-center justify-center">
           <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full ml-auto mr-2 opacity-50"></div>
        </div>

        {/* 顶部状态栏 */}
        <div className="h-12 w-full flex justify-between items-end px-5 pb-1 text-[10px] font-bold text-black font-pixel z-20 select-none">
           <span>9:41</span>
           <div className="flex gap-1">
             <span>5G</span>
             <span>[|||]</span>
           </div>
        </div>

        {/* 聊天内容区 (Chat View) */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-end pb-8">
          
          {/* 系统提示 */}
          <div className="text-center text-[10px] text-gray-400 font-pixel mb-6">
             iMessage<br/>
             Today 9:41 AM
          </div>

          {/* 对方发来的消息 (模拟) - 可以是事件标题 */}
          {/* <div className="flex justify-start mb-6">
             <div className="bg-[#E9E9EB] text-black text-sm font-pixel py-2 px-3 rounded-xl rounded-tl-none max-w-[80%] shadow-sm">
                Waiting for command...
             </div>
          </div> */}

          {/* 玩家选项 (右对齐气泡) */}
          <div className="flex flex-col items-end space-y-2">
            {options.map((opt) => (
              <PixelSMSBubble 
                key={opt.id}
                {...opt}
                onClick={() => onChoose(opt.id)}
              />
            ))}
          </div>

        </div>

        {/* 底部 Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-black/80 rounded-full z-30"></div>
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
  
              // 🛠️ 修改这里：去掉 md: 前缀，强制统一位置
              // bottom: 距离底部的像素 (支持负数，如 -50px)
              // right: 距离右侧的像素
              className="absolute bottom-[-200px] right-[0px] z-50 pointer-events-auto origin-bottom-right"
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