// src/components/game/TitleScreen.tsx

import React, { useEffect, useState } from 'react';
import { SettingsModal } from './SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
// ✅ 引入系统规则配置
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';
import { random } from '@/utils/random';
// ✅ 引入游戏定时器 Hook
import { useGameTimer } from '@/hooks/useGameTimer';

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
      transition={{ delay }}
      whileHover={{ y: -30, rotate: 0, scale: 1.1, zIndex: 50, transition: { type: "spring", stiffness: 300 } }}
      onClick={() => {
        if (!disabled) {
          playSfx('sfx_click');
          onClick();
        }
      }}
      onMouseEnter={() => {
        if (!disabled) {
          playSfx('sfx_hover');
          onHover(label);
        }
      }}
      onMouseLeave={() => onHover(null)}
      className={`
        relative w-28 h-44 md:w-40 md:h-60 rounded-sm shadow-2xl
        flex flex-col items-center justify-end pb-4 px-2
        transition-shadow duration-300 group
        ${color} 
        ${disabled ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-cyan-500/50'}
        border border-white/10 backdrop-blur-sm
      `}
    >
      <div className="absolute inset-0 p-4 flex flex-col items-center justify-center overflow-hidden rounded-sm">
        {children}
      </div>

      <div className={`relative z-10 text-center ${textColor} w-full`}>
        <div className="text-lg md:text-xl font-black font-pixel tracking-tighter leading-none break-words">{label}</div>
        <div className="text-[8px] md:text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider truncate w-full">{subLabel}</div>
      </div>
    </motion.button>
  );
};

// --- 主组件 ---
interface TitleScreenProps {
  onStart: (type: 'NEW' | 'CONTINUE') => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  // ✅ Refactor: 使用 restartGame 替代旧的 resetPlayerState
  const { vitality, inventory, restartGame } = useGameStore();
  const { playBgm } = useAudioStore();
  const { t, locale, setLocale } = useI18n();
  const [showSettings, setShowSettings] = useState(false);
  
  const currentTurn = vitality?.time?.currentTurn ?? 1;
  // 简单的判定：如果回合数 > 1 (或者根据你的初始设定)，则认为有存档
  // 如果初始回合是1，这里可能需要判断 flags 或其他状态，或者干脆 currentTurn > 1
  const hasSave = currentTurn > 1 || vitality.metrics.gold !== 0 || inventory.length > 0;
  
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const [glitchTrigger, setGlitchTrigger] = useState(false);
  
  // ✅ 使用游戏定时器 Hook
  const { setGameInterval, setGameTimeout } = useGameTimer();

  // ✅ Refactor: 获取 UI 配置
  const uiConfig = SYSTEM_RULES.ui.titleScreen;

  useEffect(() => {
    playBgm('bgm_title');
    
    // ✅ Refactor: 使用游戏定时器 Hook
    const cancelInterval = setGameInterval(() => {
      // ✅ Refactor: 使用配置中的概率 (假设 glitchChance 为 0.2)
      if (random() < uiConfig.glitchChance) {
        setGlitchTrigger(true);
        // ✅ Refactor: 使用配置中的持续时间
        setGameTimeout(() => setGlitchTrigger(false), uiConfig.glitchDuration);
      }
    }, uiConfig.glitchInterval);
    
    return () => cancelInterval();
  }, [playBgm, uiConfig, setGameInterval, setGameTimeout]);

  const handleStart = (type: 'NEW' | 'CONTINUE') => {
    if (type === 'NEW') {
      if (hasSave && !window.confirm('WARNING: OVERWRITE EXISTING REALITY?')) return;
      restartGame(); 
    }
    // 将 type 传递给 onStart
    onStart(type);
  };

  const toggleLanguage = () => {
    setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-200 font-pixel select-none flex flex-col items-center justify-center md:justify-between py-12 md:py-20">
      
      {/* Language Toggle Button - Top Right */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 z-50 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-xs font-medium text-white/80 hover:text-white transition-all"
      >
        {locale === 'zh-CN' ? '中文 / EN' : 'EN / 中文'}
      </button>

      {/* L0: Background - American Dream Sky Theme */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100">
        <div className="absolute inset-0 bg-[url('/assets/textures/grid.svg')] opacity-10 [transform:perspective(500px)_rotateX(60deg)] origin-bottom" />
        {/* Pixel Clouds */}
        <div className="absolute top-20 left-10 w-32 h-16 bg-white/60 rounded-sm" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)' }} />
        <div className="absolute top-32 right-20 w-24 h-12 bg-white/40 rounded-sm" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)' }} />
      </div>

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
          <h1 className="text-5xl md:text-8xl font-pixel font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            AMERICAN<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">INSIGHT</span>
          </h1>
          <motion.div 
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="absolute -bottom-4 right-0 md:-right-8 text-2xl md:text-4xl text-red-600 rotate-[-5deg] mix-blend-screen"
          >
            异化生存
          </motion.div>
        </motion.div>
      </div>

      {/* L2: Menu Cards */}
      <div className="relative z-30 flex items-center justify-center gap-4 md:gap-12">
        
        <MenuCard 
          label={t('titleScreen.newGame')} subLabel={t('titleScreen.subtitle.new')} color="bg-[#E0F7FA]" rotate={-3}
          onClick={() => handleStart('NEW')} onHover={() => setHoverItem(t('titleScreen.hover.new'))} delay={0.2}
        >
          <div className="w-full h-full border-2 border-green-800/20 rounded flex flex-col items-center justify-start pt-4 bg-green-50">
             <div className="w-12 h-12 bg-gray-300 rounded-full mb-2 border border-gray-400" />
             <div className="w-16 h-2 bg-gray-300 rounded mb-1" />
             <div className="w-10 h-2 bg-gray-300 rounded" />
             <div className="mt-auto mb-2 text-[8px] text-green-800 font-bold">US DEPT OF STATE</div>
          </div>
        </MenuCard>

        <MenuCard 
          label={t('titleScreen.continue')} subLabel={t('titleScreen.subtitle.continue', { turn: currentTurn })} color="bg-white" rotate={2} disabled={!hasSave}
          onClick={() => handleStart('CONTINUE')} onHover={() => setHoverItem(t('titleScreen.hover.continue'))} delay={0.4}
        >
          <div className="w-full h-full border-t-8 border-blue-800 flex flex-col items-center pt-2">
             <div className="w-14 h-14 rounded overflow-hidden mb-2 relative flex items-center justify-center bg-gray-300">
               <img 
                 src="/assets/scenes/player_back.png" 
                 alt="User" 
                 className="w-full h-full object-cover grayscale opacity-60"
                 onError={(e) => e.currentTarget.style.display = 'none'} 
               />
               <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold text-xs opacity-50 z-0">IMG</div>
             </div>
             <div className="text-[6px] font-mono w-full px-2 text-center text-gray-500 leading-tight">
                EMPLOYEE ID: 8940<br/>CLEARANCE: LOW
             </div>
          </div>
        </MenuCard>

        <MenuCard 
          label={t('titleScreen.settings')} subLabel={t('titleScreen.subtitle.settings')} color="bg-[#f5f5dc]" textColor="text-gray-800" rotate={5}
          onClick={() => setShowSettings(true)} onHover={() => setHoverItem(t('titleScreen.hover.settings'))} delay={0.6}
        >
          <div className="w-full h-full flex items-center justify-center">
             <div className="text-4xl">⚙️</div>
          </div>
        </MenuCard>
      </div>

      <div className="relative z-20 text-center mt-8 h-6">
        <p className="text-[10px] text-gray-500 font-mono">
          {hoverItem ? `> SELECT: ${hoverItem}` : "VER 8.0.0 // NO HOPE EDITION"}
        </p>
      </div>

      {/* 设置菜单 */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};