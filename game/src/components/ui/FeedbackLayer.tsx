import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export const FeedbackLayer: React.FC = () => {
  // ✅ 1. 修复：路径对齐至 vitality.metrics.hp
  const hp = useGameStore(s => s.vitality.metrics.hp);
  
  // 2. 使用 ref 记录上一次的 HP
  const prevHpRef = useRef(hp);
  
  const [activeEffect, setActiveEffect] = useState<'DAMAGE' | 'HEAL' | 'NONE'>('NONE');

  useEffect(() => {
    const prevHp = prevHpRef.current;

    // 3. 比较差异触发特效
    if (hp < prevHp) {
      // 掉血 -> 受伤反馈
      setActiveEffect('DAMAGE');
      const timer = setTimeout(() => setActiveEffect('NONE'), 600);
      
      prevHpRef.current = hp;
      return () => clearTimeout(timer);
    } 
    else if (hp > prevHp) {
      // 加血 -> 治疗反馈
      setActiveEffect('HEAL');
      const timer = setTimeout(() => setActiveEffect('NONE'), 600);
      
      prevHpRef.current = hp;
      return () => clearTimeout(timer);
    }
    
    prevHpRef.current = hp;
  }, [hp]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence mode="wait">
        {/* 受伤反馈：红屏闪烁 */}
        {activeEffect === 'DAMAGE' && (
          <motion.div
            key="damage"
            initial={false}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-red-900 mix-blend-multiply"
          />
        )}
        
        {/* 回血反馈：绿色边缘光晕 */}
        {activeEffect === 'HEAL' && (
          <motion.div
            key="heal"
            initial={false}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 border-[40px] border-green-500/20 blur-2xl"
          />
        )}
      </AnimatePresence>
    </div>
  );
};