import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';

export const RoastModal: React.FC = () => {
  const currentRoast = useGameStore(s => s.currentRoast);
  const setRoast = useGameStore(s => s.setRoast);
  const { playSfx } = useAudioStore();

  // 监听弹出音效
  React.useEffect(() => {
    if (currentRoast) playSfx('sfx_hover'); // 或使用 sfx_notification
  }, [currentRoast, playSfx]);

  return (
    <div className="fixed top-[110px] left-0 right-0 z-[9000] flex justify-center pointer-events-none">
      <AnimatePresence>
        {currentRoast && (
          <motion.div
            layout
            initial={{ scale: 0.8, y: -40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -20, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="pointer-events-auto cursor-pointer bg-black/90 text-white pl-3 pr-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center gap-4 border border-white/10 min-w-[300px] max-w-lg backdrop-blur-xl"
            onClick={() => setRoast(null)}
            whileTap={{ scale: 0.95 }}
          >
            {/* 图标区 (动态变化的 Emoji 或 Logo) */}
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-[#1c1c1e] overflow-hidden border border-white/5">
               <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
               <span className="text-xl relative z-10">💬</span>
            </div>

            {/* 文本区 */}
            <div className="flex flex-col pr-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">System Insight</span>
                <span className="text-[9px] text-gray-600">now</span>
              </div>
              <span className="text-sm font-medium leading-tight text-gray-100 font-sans mt-0.5">
                {currentRoast}
              </span>
            </div>
            
            {/* 装饰：右侧指示条 */}
            <div className="w-1 h-8 rounded-full bg-gray-700/50" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};