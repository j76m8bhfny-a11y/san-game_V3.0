import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  // 现代风格只需要简单的模糊背景，不需要 VHS 噪点
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 backdrop-blur-md">
          
          {/* 核心菜单卡片 (iOS Widget 风格) */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-xs p-6"
          >
            {/* 卡片容器 */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] shadow-2xl overflow-hidden text-center">
              
              {/* 顶部插图区 */}
              <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-20 mix-blend-overlay" />
                <span className="text-6xl filter drop-shadow-lg">☕️</span>
                <div className="absolute bottom-2 text-white/80 text-xs font-medium tracking-widest uppercase">
                  Coffee Break
                </div>
              </div>

              {/* 按钮组 */}
              <div className="p-6 space-y-3">
                <MenuButton onClick={onResume} primary>
                  Resume
                </MenuButton>
                
                <MenuButton onClick={() => setShowSettings(true)}>
                  Settings
                </MenuButton>
                
                <div className="pt-2">
                  <MenuButton onClick={onRestart} danger>
                    Restart Simulation
                  </MenuButton>
                </div>
              </div>

              {/* 底部文案 */}
              <div className="bg-gray-50 dark:bg-white/5 py-3 px-4 text-[10px] text-gray-400 border-t border-gray-100 dark:border-white/5">
                Time is money. Interest is compounding.
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

// 现代风格按钮组件
const MenuButton = ({ children, onClick, primary, danger }: any) => (
  <button
    onClick={onClick}
    className={`
      w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95
      ${primary 
        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600' 
        : danger 
          ? 'bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
      }
    `}
  >
    {children}
  </button>
);