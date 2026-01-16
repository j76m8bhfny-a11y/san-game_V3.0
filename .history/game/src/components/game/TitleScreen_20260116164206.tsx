import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';

// --- 子组件：实体菜单卡片 (移到顶部定义) ---
interface MenuCardProps {
  label: string;
  subLabel?: string;
  color: string;
  textColor?: string;
  rotate: number;
  disabled?: boolean;
  onClick: () => void;
  onHover: (txt: string | null) => void;
  delay: number;
  children?: React.ReactNode;
}

const MenuCard: React.FC<MenuCardProps> = ({ 
  label, subLabel, color, textColor = "text-gray-800", rotate, disabled, onClick, onHover, delay, children 
}) => {
  return (
    <motion.button
      initial={{ y: 100, opacity: 0, rotate: 0 }}
      animate={{ y: 0, opacity: disabled ? 0.5 : 1, rotate: rotate }}
      whileHover={{ y: -20, rotate: 0, scale: 1.1, zIndex: 50 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && onHover(label)}
      onMouseLeave={() => onHover(null)}
      className={`
        relative w-32 h-48 md:w-40 md:h-56 rounded-2xl shadow-2xl
        flex flex-col items-center justify-end pb-6 px-4
        transition-all duration-300 group
        ${color} 
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:-translate-y-4 hover:shadow-3xl'}
        border border-white/20 backdrop-blur-sm
      `}
    >
      {/* 移除内部的纸张纹理，改为干净的渐变或纯色 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* 内部装饰内容 */}
      <div className="absolute inset-0 p-4 opacity-90 flex flex-col items-center justify-center">
        {children}
      </div>

      {/* 标签文字 - 使用更现代的字体 */}
      <div className={`relative z-10 text-center ${textColor}`}>
        <div className="text-lg md:text-xl font-bold font-sans tracking-tight leading-none">{label}</div>
        <div className="text-[9px] md:text-[10px] font-medium opacity-60 mt-1 uppercase tracking-wide">{subLabel}</div>
      </div>
    </motion.button>
  );
};

// --- 主组件 ---
interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  // ✅ 移除未使用的 setMenuOpen
  const { day, resetGame } = useGameStore();
  const { playSfx, playBgm } = useAudioStore();
  
  const hasSave = day > 1;
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const [glitchTrigger, setGlitchTrigger] = useState(false);

  // 播放标题音乐 & 随机触发背景故障
  useEffect(() => {
    playBgm('bgm_title');
    
    // 随机故障计时器 (每 3-8 秒触发一次背景闪烁)
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchTrigger(true);
        setTimeout(() => setGlitchTrigger(false), 200);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = (type: 'NEW' | 'CONTINUE') => {
    playSfx('sfx_click');
    if (type === 'NEW') {
      if (hasSave && !window.confirm('WARNING: 覆盖现有进度?')) return;
      resetGame();
      onStart();
    } else {
      onStart();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none flex flex-col items-center justify-between py-12">
      
      {/* --- L0: 动态背景 (日落大道) --- */}
      <div className="absolute inset-0 z-0">
        {/* 1. 基础风景 (渐变模拟天空) */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-orange-800" />
        
        {/* 2. 城市剪影 (远景) */}
        <div className="absolute bottom-0 w-full h-1/3 bg-[url('/assets/scenes/bg_street.png')] bg-cover bg-bottom opacity-50 grayscale mix-blend-multiply" />
        
        {/* 3. 动态网格线 (复古未来感) */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(255,0,255,0.3)_96%)] bg-[length:100%_40px] opacity-30 transform perspective-[500px] rotate-x-[60deg] origin-bottom scale-y-[2]" />

        {/* 4. 故障层 (The "OBEY" Flash) */}
        <AnimatePresence>
          {glitchTrigger && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-600 mix-blend-color-dodge z-10 flex items-center justify-center pointer-events-none"
            >
              <h1 className="text-[20vw] font-black text-black font-sans tracking-tighter opacity-20">OBEY</h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. 氛围覆盖 */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* --- L1: 标题 Logo --- */}
      <div className="relative z-20 text-center mt-8 md:mt-16 group cursor-default">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-serif font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            AMERICAN<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">INSIGHT</span>
          </h1>
          
          {/* 红色涂鸦副标题 */}
          <motion.div 
            initial={{ opacity: 0, scale: 2, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: -5 }}
            transition={{ delay: 1, type: 'spring' }}
            className="absolute -bottom-6 right-0 md:-right-12 text-3xl md:text-5xl text-red-600 font-creepster rotate-[-5deg] mix-blend-screen"
            style={{ textShadow: '2px 2px 0px black' }}
          >
            异化生存
          </motion.div>
        </motion.div>

        <p className="mt-8 text-xs font-mono text-gray-400 tracking-[0.5em] uppercase opacity-70">
          Ver 8.0.1 // Diamond Master
        </p>
      </div>

      {/* --- L2: 桌面菜单 (实体交互区) --- */}
      <div className="relative z-30 w-full max-w-4xl h-1/3 flex items-end justify-center gap-8 md:gap-16 pb-12 perspective-[1000px]">
        
        {/* 1. 绿卡 (New Game) */}
        <MenuCard 
          label="NEW GAME" 
          subLabel="I-551 PERMANENT RESIDENT"
          color="bg-green-100"
          rotate={-5}
          onClick={() => handleStart('NEW')}
          onHover={setHoverItem}
          delay={0.2}
        >
          <div className="absolute top-2 left-2 w-8 h-8 border border-green-800 rounded bg-gray-200 overflow-hidden">
            <div className="w-full h-full bg-gray-400 rounded-full scale-75 translate-y-2" />
          </div>
          <div className="absolute top-2 right-2 text-[8px] font-bold text-green-900">USA</div>
          <div className="absolute bottom-2 left-2 w-full pr-4">
             <div className="h-1 bg-black/10 mb-1 w-2/3" />
             <div className="h-1 bg-black/10 w-1/2" />
          </div>
        </MenuCard>

        {/* 2. 工牌 (Continue) */}
        <MenuCard 
          label="CONTINUE"
          subLabel="EMPLOYEE ID: 8940"
          color="bg-white"
          rotate={3}
          disabled={!hasSave}
          onClick={() => handleStart('CONTINUE')}
          onHover={setHoverItem}
          delay={0.4}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-blue-900 rounded-full flex justify-center items-center shadow-md">
            <div className="w-full h-[1px] bg-white/20" />
          </div>
          <div className="w-full h-full border-t-4 border-blue-900 pt-2 flex flex-col items-center">
             <div className="w-12 h-12 bg-gray-200 rounded mb-2 grayscale">
               <img src="/assets/scenes/player_back.png" className="w-full h-full object-cover opacity-50" alt="" />
             </div>
             <div className="text-[8px] font-bold">WORKER CLASS</div>
          </div>
        </MenuCard>

        {/* 3. 员工手册 (Settings/Credits) */}
        <MenuCard 
          label="SETTINGS"
          subLabel="HANDBOOK"
          color="bg-red-900"
          textColor="text-red-100"
          rotate={8}
          onClick={() => alert("ACCESS DENIED: Management is watching.")}
          onHover={setHoverItem}
          delay={0.6}
        >
          <div className="absolute inset-0 border-2 border-yellow-500/50 m-1 flex items-center justify-center">
             <div className="w-10 h-10 border-2 border-yellow-500 rounded-full flex items-center justify-center opacity-50">
               ★
             </div>
          </div>
        </MenuCard>

      </div>

      {/* --- L3: 底部提示 --- */}
      <div className="relative z-20 text-center pb-4">
        <p className="text-[10px] text-gray-500 font-mono transition-opacity duration-300 h-4">
          {hoverItem ? `[ ACTION: ${hoverItem} ]` : "© 2026 AMERICAN INSIGHT CORP."}
        </p>
      </div>

      {/* 噪点覆盖 */}
      <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-10 pointer-events-none z-40 animate-grain" />
    </div>
  );
};