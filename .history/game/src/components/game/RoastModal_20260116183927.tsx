// src/components/game/RoastModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

export const RoastModal: React.FC = () => {
  const currentRoast = useGameStore(s => s.currentRoast);
  const setRoast = useGameStore(s => s.setRoast);

  return (
    <AnimatePresence>
      {currentRoast && (
        <div className="fixed top-6 left-0 right-0 z-[10000] flex justify-center pointer-events-none">
          {/*  灵动岛风格容器 */}
          <motion.div
            initial={{ scale: 0.9, y: -50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="pointer-events-auto cursor-pointer bg-black text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 min-w-[320px] max-w-lg backdrop-blur-xl"
            onClick={() => setRoast(null)}
          >
            {/* 图标区 (Siri 波纹动画) */}
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
               <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping" />
               <div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs"></span>
               </div>
            </div>

            {/* 文本区 */}
            <div className="flex flex-col pr-2">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">System Insight</span>
              <span className="text-sm font-medium leading-tight text-gray-100 font-sans">
                {currentRoast}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};