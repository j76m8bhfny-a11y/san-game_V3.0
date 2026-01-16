import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export const FeedbackLayer: React.FC = () => {
  const lastAction = useGameStore(s => s.lastAction);
  const [activeEffect, setActiveEffect] = useState<'DAMAGE' | 'HEAL' | 'NONE'>('NONE');

  useEffect(() => {
    if (lastAction.type === 'DAMAGE') {
      setActiveEffect('DAMAGE');
      const timer = setTimeout(() => setActiveEffect('NONE'), 600);
      return () => clearTimeout(timer);
    }
    if (lastAction.type === 'HEAL') {
      setActiveEffect('HEAL');
      const timer = setTimeout(() => setActiveEffect('NONE'), 600);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {/* 受伤反馈：红屏闪烁 */}
        {activeEffect === 'DAMAGE' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-900 mix-blend-overlay"
          />
        )}
        
        {/* 回血反馈：绿色边缘 */}
        {activeEffect === 'HEAL' && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 border-[20px] border-green-500/30 blur-xl"
          />
        )}
      </AnimatePresence>
    </div>
  );
};