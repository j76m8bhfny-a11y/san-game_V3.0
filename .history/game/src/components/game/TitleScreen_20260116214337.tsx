import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';

// --- 子组件：实体菜单卡片 ---
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
  const { playSfx } = useAudioStore();

  return (
    <motion.button
      initial={{ y: 100, opacity: 0, rotate: 0 }}
      animate={{ y: 0, opacity: disabled ? 0.5 : 1, rotate: rotate }}
      whileHover={{ y: -30, rotate: 0, scale: 1.1, zIndex: 50, transition: { type: "spring", stiffness: 300 } }}
      onClick={() => {
        if (!disabled) {
          playSfx('sfx_click'); // 点击音效
          onClick();
        }
      }}
      onMouseEnter={() => {
        if (!disabled) {
          playSfx('sfx_hover'); // 悬停音效
          onHover(label);
        }
      }}
      onMouseLeave={() => onHover(null)}
      className={`
        relative w-28 h-44 md:w-40 md:h-60 rounded-xl shadow-2xl
        flex flex-col items-center justify-end pb-4 px-2
        transition-shadow duration-300 group
        ${color} 
        ${disabled ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-cyan-500/50'}
        border border-white/10 backdrop-blur-sm
      `}
    >
      {/* 内部容器 */}
      <div className="absolute inset-0 p-4 flex flex-col items-center justify-center overflow-hidden rounded-xl">
        {children}
      </div>

      {/* 标签文字 */}
      <div className={`relative z-10 text-center ${textColor} w-full`}>
        <div className="text-lg md:text-xl font-black font-sans tracking-tighter leading-none break-words">{label}</div>
        <div className="text-[8px] md:text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider truncate w-full">{subLabel}</div>
      </div>
    </motion.button>
  );
};

// --- 主组件 ---
interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const { day, resetGame } = useGameStore();
  const { playBgm } = useAudioStore();
  
  const hasSave = day > 1;
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const [glitchTrigger, setGlitchTrigger] = useState(false);

  useEffect(() => {
    playBgm('bgm_title');
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        setGlitchTrigger(true);
        setTimeout(() => setGlitchTrigger(false), 150);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [playBgm]);

  const handleStart = (type: 'NEW' | 'CONTINUE') => {
    if (type === 'NEW') {
      if (hasSave && !window.confirm('WARNING: OVERWRITE EXISTING REALITY?')) return;
      resetGame();
      onStart();
    } else {
      onStart();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none flex flex-col items-center justify-center md:justify-between py-12 md:py-20">
      
      {/* L0: Background (CSS Gradient Fallback) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="absolute inset-0 bg-[url('/assets/textures/grid.svg')] opacity-20 [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Glitch Overlay */}
      <AnimatePresence>
        {glitchTrigger && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600 mix-blend-color-dodge z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* L1: Logo */}
      <div className="relative z-20 text-center mb-8 md:mb-0 group cursor-default">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-8xl font-serif font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            AMERICAN<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">INSIGHT</span>
          </h1>
          <motion.div 
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="absolute -bottom-4 right-0 md:-right-8 text-2xl md:text-4xl text-red-600 font-creepster rotate-[-5deg] mix-blend-screen"
          >
            异化生存
          </motion.div>
        </motion.div>
      </div>

      {/* L2: Menu Cards */}
      <div className="relative z-30 flex items-center justify-center gap-4 md:gap-12 perspective-[1000px]">
        
        {/* New Game */}
        <MenuCard 
          label="NEW GAME" subLabel="RESIDENT ALIEN" color="bg-[#E0F7FA]" rotate={-3}
          onClick={() => handleStart('NEW')} onHover={setHoverItem} delay={0.2}
        >
          <div className="w-full h-full border-2 border-green-800/20 rounded flex flex-col items-center justify-start pt-4 bg-green-50">
             <div className="w-12 h-12 bg-gray-300 rounded-full mb-2 border border-gray-400" />
             <div className="w-16 h-2 bg-gray-300 rounded mb-1" />
             <div className="w-10 h-2 bg-gray-300 rounded" />
             <div className="mt-auto mb-2 text-[8px] text-green-800 font-bold">US DEPT OF STATE</div>
          </div>
        </MenuCard>

        {/* Continue */}
        <MenuCard 
          label="CONTINUE" subLabel={`DAY ${day}`} color="bg-white" rotate={2} disabled={!hasSave}
          onClick={() => handleStart('CONTINUE')} onHover={setHoverItem} delay={0.4}
        >
          <div className="w-full h-full border-t-8 border-blue-800 flex flex-col items-center pt-2">
             <div className="w-14 h-14 bg-gray-200 rounded overflow-hidden mb-2 relative">
               <img 
                 src="/assets/scenes/player_back.png" 
                 alt="User" 
                 className="w-full h-full object-cover grayscale opacity-60"
                 onError={(e) => e.currentTarget.style.display = 'none'} // Fallback: 保持灰色背景
               />
               <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-xs opacity-50 z-[-1]">IMG</div>
             </div>
             <div className="text-[6px] font-mono w-full px-2 text-center text-gray-500 leading-tight">
                EMPLOYEE ID: 8940<br/>CLEARANCE: LOW
             </div>
          </div>
        </MenuCard>

        {/* Settings */}
        <MenuCard 
          label="SYSTEM" subLabel="CONFIG" color="bg-gray-900" textColor="text-gray-200" rotate={5}
          onClick={() => alert("SYSTEM LOCKED BY ADMIN")} onHover={setHoverItem} delay={0.6}
        >
          <div className="w-16 h-16 border-2 border-gray-600 rounded-full flex items-center justify-center">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>
        </MenuCard>
      </div>

      {/* L3: Footer */}
      <div className="relative z-20 text-center mt-8 h-6">
        <p className="text-[10px] text-gray-500 font-mono">
          {hoverItem ? `> SELECT: ${hoverItem}` : "VER 8.0.0 // NO HOPE EDITION"}
        </p>
      </div>
    </div>
  );
};