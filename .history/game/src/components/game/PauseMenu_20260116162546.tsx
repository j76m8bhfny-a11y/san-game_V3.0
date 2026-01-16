import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { SettingsModal } from './SettingsModal';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onRestart,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [timeStr, setTimeStr] = useState("00:00:00");

  // 模拟录像带时间码
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-hidden font-mono">
          
          {/* 1. VHS 视觉滤镜层 */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {/* 扫描线 */}
            <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_3px)]" />
            {/* 噪点 */}
            <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] animate-grain opacity-50" />
            {/* 顶部 Glitch 条 */}
            <div className="absolute top-10 w-full h-1 bg-white/50 opacity-30 animate-pulse" />
          </div>

          {/* 2. 录像带 UI 信息 */}
          <div className="absolute top-8 left-8 text-white text-xl tracking-widest opacity-80 animate-pulse">
            PAUSE <span className="inline-block w-4 h-4 bg-white ml-2 align-middle" /> ||
          </div>
          <div className="absolute bottom-8 right-8 text-white text-xl tracking-widest opacity-80">
            PLAY {timeStr}
          </div>

          {/* 3. 核心菜单卡片 */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 w-full max-w-sm bg-black border-4 border-white p-8 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
          >
            {/* 咖啡休息倒计时 (装饰性) */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black px-4 text-white font-bold border-2 border-white rotate-2">
              COFFEE_BREAK
            </div>

            <div className="flex flex-col gap-6 text-center">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase italic tracking-tighter">
                Break Time?
              </h2>

              <nav className="flex flex-col gap-4">
                <MenuButton onClick={onResume} primary>
                  ► RESUME WORK
                </MenuButton>
                
                <MenuButton onClick={() => setShowSettings(true)}>
                  ⚙ SYSTEM CONFIG
                </MenuButton>
                
                <MenuButton onClick={onRestart} danger>
                  ⚠ REBOOT LIFE
                </MenuButton>
              </nav>

              <div className="border-t border-gray-800 pt-4 mt-2">
                <div className="text-xs text-gray-500 animate-marquee whitespace-nowrap overflow-hidden">
                  <span className="inline-block animate-[scroll_10s_linear_infinite]">
                    Time is money. Your debt is growing while you pause. Get back to work. 
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 嵌套的设置弹窗 */}
          <AnimatePresence>
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

// 辅助按钮组件
const MenuButton = ({ children, onClick, primary, danger }: any) => (
  <button
    onClick={onClick}
    className={`
      py-3 px-6 text-sm font-bold tracking-widest transition-all duration-200 uppercase border-2
      ${primary 
        ? 'bg-white text-black border-white hover:bg-gray-200 hover:scale-105' 
        : danger 
          ? 'bg-black text-red-500 border-red-500 hover:bg-red-900 hover:text-white'
          : 'bg-black text-gray-300 border-gray-600 hover:border-white hover:text-white'
      }
    `}
  >
    {children}
  </button>
);