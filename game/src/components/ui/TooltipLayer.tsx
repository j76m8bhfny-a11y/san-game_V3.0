import React from 'react';
import { useTooltipStore } from '@/store/useTooltipStore';
import { motion, AnimatePresence } from 'framer-motion';

export const TooltipLayer: React.FC = () => {
  const { content, position } = useTooltipStore();
  
  if (!content) return null;

  // 边界检测逻辑：如果靠右/靠下，则反向显示
  const isRight = position.x > window.innerWidth - 220;
  const isBottom = position.y > window.innerHeight - 120;
  
  const finalX = isRight ? position.x - 230 : position.x + 15;
  const finalY = isBottom ? position.y - 100 : position.y + 15;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0 }}
          style={{ left: finalX, top: finalY }}
          className="absolute bg-black/90 border border-green-500/50 text-green-100 p-3 rounded shadow-[0_0_15px_rgba(0,255,0,0.2)] max-w-[200px] backdrop-blur-sm"
        >
          <div className="h-1 w-full bg-green-500/30 mb-2" />
          <div className="text-xs font-mono leading-relaxed">{content}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};