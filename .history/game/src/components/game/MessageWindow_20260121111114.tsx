import React, { useState, useEffect, useCallback } from 'react'; // 👈 加上 useCallback
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
    <div className="flex justify-end items-end gap-2 mb-4 group w-full pl-2">
      
      {/* 1. 序号/时间戳 (放在气泡左侧外面，模拟发送时间) */}
      <div className="text-[10px] text-gray-400 font-pixel mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
        [{id}]
      </div>

      {/* 2. 气泡主体 */}
      <motion.button
        whileHover={{ scale: 1.02, x: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative w-full text-left text-sm font-bold font-pixel py-2 px-3 leading-tight ${styles.bg} ${styles.text} ${styles.shadow}`}
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

// --- ✨ 补充缺失的组件：接收到的消息 (灰色左对齐气泡) ---
const PixelReceivedBubble: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex justify-start items-end gap-2 w-full pr-4 pl-2">
      
      {/* 1. 头像 (模拟发送者) */}
      <div className="w-6 h-6 bg-[#8E8E93] rounded-full flex-shrink-0 mb-1 shadow-sm border border-black/10"></div>

      {/* 2. 气泡主体 */}
      <div 
        className="relative w-full text-left text-sm font-bold font-pixel py-2 px-3 leading-tight bg-[#E9E9EB] text-black shadow-[2px_2px_0px_#999]"
        style={{
          // 像素圆角裁剪
          clipPath: `polygon(
            4px 0, calc(100% - 4px) 0, 
            100% 4px, 100% calc(100% - 4px), 
            calc(100% - 4px) 100%, 4px 100%, 
            0 calc(100% - 4px), 0 4px
          )`
        }}
      >
        {text}

        {/* 3. 左侧小尾巴 (Tail) */}
        <div 
          className="absolute bottom-0 -left-[6px] w-[6px] h-[6px] bg-[#E9E9EB]"
          style={{
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' // 直角三角形朝左
          }}
        />
        
        {/* 尾巴像素修正 */}
        <div className="absolute bottom-[0px] left-[0px] w-[4px] h-[4px] bg-[#E9E9EB]" />
      </div>
    </div>
  );
};
// --- 组件：像素手机 (UI Layer 5) ---
const PixelPhone: React.FC<{ options: any[]; onChoose: (id: string) => void }> = ({ options, onChoose }) => {
  // 👇 1. 新增状态控制
  const [showOptions, setShowOptions] = useState(false);

  // 👇 2. 模拟消息延迟：手机出来 0.8秒 后，才显示选项
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOptions(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-[450px] h-[620px] flex items-center justify-center">
      
      {/* 1. 外壳层 (Pixel Art Frame) */}
      <img 
        src="/assets/ui/pixel_phone_frame.png" 
        alt="Phone Shell"
        className="absolute inset-0 w-full h-full object-fill z-20 pointer-events-none"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
      />
      
      {/* 兜底外壳 */}
      <div className="absolute inset-0 border-[12px] border-gray-800 bg-gray-900 rounded-[30px] z-10 shadow-xl" style={{ display: 'none' }} id="fallback-shell"></div>

      {/* 2. 屏幕层 (Screen) */}
      {/* 适配 iPhone 样式：全面屏、圆角、顶部挖孔 */}
      <div className="
        relative z-10 
        w-[52%] h-[72%] 
        bg-[#f2f2f7] /* iOS 浅色背景灰 */
        rounded-[30px] 
        overflow-hidden 
        flex flex-col font-sans
        mb-[138px]               /* 上下偏移 */
        mr-[100px]          /* 👈 新增：向左偏移 (数字越大越往左) */
      ">
        
        {/* 屏幕内发光 & 扫描线 */}
        {/*<div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]" /> */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-10 bg-[linear-gradient(#000_1px,transparent_1px)] [background-size:100%_4px]" />

        {/* 灵动岛 (Dynamic Island) */}
        {/*<div className="absolute top-3 left-1/2 -translate-x-1/2 w-[28%] h-7 bg-black rounded-full z-30 flex items-center justify-center">
           <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full ml-auto mr-2 opacity-50"></div>
        </div> */}

        {/* 顶部状态栏 */}
        <div className="h-12 w-full flex justify-between items-end px-5 pb-1 text-[10px] font-bold text-black font-pixel z-20 select-none">
           <span>9:41</span>
           <div className="flex gap-1">
             <span>5G</span>
             <span>[|||]</span>
           </div>
        </div>

        {/* 聊天内容区 (Chat View) */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-center 
          pb-[80px] relative z-30 pointer-events-auto">
          
          {/* 系统提示 */}
          <div className="text-center text-[10px] text-gray-400 font-pixel mb-6">
             iMessage<br/>
             Today 9:41 AM
          </div>

          <div className="flex flex-col w-full space-y-4">
            
            {/* 👇 3. 对方的消息 (带入场动画) */}
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }} // 手机出来后 0.2s 弹出
            >
              <PixelReceivedBubble text="你怎么看？" />
            </motion.div>

            {/* 👇 4. 我的选项 (条件渲染 + 动画) */}
            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col w-full space-y-4"
                >
                  {options.map((opt) => (
                    <PixelSMSBubble 
                      key={opt.id}
                      {...opt}
                      onClick={() => onChoose(opt.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* 对方发来的消息 (模拟) - 可以是事件标题 */}
          {/* <div className="flex justify-start mb-6">
             <div className="bg-[#E9E9EB] text-black text-sm font-pixel py-2 px-3 rounded-xl rounded-tl-none max-w-[80%] shadow-sm">
                Waiting for command...
             </div>
          </div> */}

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
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [stage, setStage] = useState<'INIT' | 'TYPING_TITLE' | 'TYPING_BODY' | 'INTERACTIVE'>('INIT');

  useEffect(() => {
    setStage('INIT');
    const timer = setTimeout(() => {
      setStage('TYPING_TITLE');
    }, 1500); 
    return () => clearTimeout(timer);
  }, [event.id]);

  const handleTitleComplete = useCallback(() => {
    setStage('TYPING_BODY');
  }, []);

  const handleBodyComplete = useCallback(() => {
    setStage('INTERACTIVE');
    playSfx('sfx_cash'); 
  }, [playSfx]);

  const options = [
    { id: 'A', label: event.options.A.label, type: 'risk' },
    { id: 'B', label: event.options.B.label, type: 'safe' },
    { id: 'C', label: event.options.C.label, type: 'special' },
    { id: 'D', label: event.options.D?.label, type: 'awakening' },
  ].filter(opt => opt.label);

  const descriptionText = san < 50 ? event.text.lowSan : event.text.highSan;
  // 1. 获取背景图和事件插图
  const bgImg = event.bgImage || event.eventImage || '/assets/scenes/default_bg.png';
  const eventImg = event.eventImage || '/assets/events/default_event.png';

  // 2. 计算当前事件图是否应该居中
  // 逻辑：如果是“专注模式” 或者 “还没到交互阶段(手机没出来)”，就居中。否则往左边挪。
  const isCenterPosition = isFocusMode || stage !== 'INTERACTIVE';

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* 1. 最底层：全屏背景图 (铺满，稍微暗一点) */}
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
        {/* 暗角遮罩，让中间亮一点 */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80" />
      </motion.div>

      {/* 2. 开眼动画 (保持原来的逻辑) */}
      <motion.div
        key={`eye-${event.id}`} 
        initial={{ clipPath: 'ellipse(0% 0% at 50% 50%)', filter: 'blur(20px)', background: '#000' }}
        animate={{ clipPath: 'ellipse(150% 150% at 50% 50%)', filter: 'blur(0px)', background: 'transparent' }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-50 pointer-events-none"
      />

      {/* 3. 中间层：事件插图 (核心动画逻辑) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: -50 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: "-50%",   // 垂直永远居中
          x: "-50%",   // 水平基准修正
          
          // 核心位移：居中时在50%，交互时退到30%
          left: isCenterPosition ? "50%" : "40%" 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 60, 
          damping: 20, 
          duration: 0.8 
        }}
        // 样式：悬浮卡片风格，圆角，白边框
        className="absolute top-1/2 w-[80%] md:w-[45%] aspect-[4/3] z-20 shadow-2xl overflow-hidden rounded-2xl border-4 border-white/10"
      >
        <img 
          src={eventImg} 
          alt="Event Subject" 
          className="w-full h-full object-cover"
        />
        {/* 图片内光影 */}
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
        animate={isFocusMode 
          ? { y: -200, x: "-50%", opacity: 0 } 
          : { y: 0, x: "-50%", opacity: 1 }
        }
        transition={{ duration: 0.5, ease: "easeInOut" }} // 动画更平滑
        className="absolute top-[15%] left-1/2 w-[90%] md:w-[80%] z-40 pointer-events-none" // 加上 pointer-events-none 防止挡住点击层
      >
        <div className={`bg-black/40 backdrop-blur-md border-2 border-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] transition-all ${isFocusMode ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <h2 className="text-cyan-400 font-pixel font-bold text-xl mb-4 tracking-widest uppercase border-b-2 border-white/20 pb-2">
            {/* 👇 修改 4: 标题的条件渲染 */}
            {stage === 'TYPING_TITLE' && (
              <TypewriterText text={event.title} onComplete={handleTitleComplete} />
            )}
            {(stage === 'TYPING_BODY' || stage === 'INTERACTIVE') && (
              event.title
            )}
          </h2>
          <div className="text-gray-200 text-sm md:text-lg min-h-[60px] font-pixel">
            {/* 👇 修改 5: 正文的条件渲染 */}
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
  
              // 🛠️ 修改这里：去掉 md: 前缀，强制统一位置
              // bottom: 距离底部的像素 (支持负数，如 -50px)
              // right: 距离右侧的像素
              className="absolute bottom-[-100px] right-[0px] z-50 pointer-events-auto origin-bottom-right"
              // 当隐藏时，禁用手机交互，防止误触
              style={{ pointerEvents: isFocusMode ? 'none' : 'auto' }}
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