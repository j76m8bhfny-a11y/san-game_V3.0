import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import rules from '@/assets/data/rules/vitalityRules.json';

// --- 子组件：注视的眼睛 ---
const EyeElement = ({ index }: { index: number }) => {
  const styleConfig = useMemo(() => {
    return {
      top: Math.floor(Math.random() * 80) + 10 + '%',
      left: Math.floor(Math.random() * 80) + 10 + '%',
      delay: Math.random() * 5,
      repeatDelay: Math.random() * 10
    };
  }, []); 

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 0.5] }}
      transition={{ 
        duration: 0.2, 
        delay: styleConfig.delay, 
        repeat: Infinity, 
        repeatDelay: styleConfig.repeatDelay 
      }}
      style={{ top: styleConfig.top, left: styleConfig.left }}
      className="absolute w-12 h-6 border-2 border-red-500 rounded-full flex items-center justify-center pointer-events-none blur-[1px]"
    >
      <div className="w-2 h-2 bg-red-500 rounded-full" />
    </motion.div>
  );
};

// --- 主组件 ---
export const GlobalAtmosphere: React.FC = () => {
  // ✅ 1. 修复：路径对齐至 vitality.metrics.san
  const san = useGameStore((state) => state.vitality.metrics.san);
  
  // ✅ 2. 修正：理智值低于 30 才是“疯癫/精神污染”状态
  visuals.thresholds.sanLow (30);
  const isMadness = san < rules.visuals.thresholds.sanLow; 

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden w-screen h-screen">
      
      {/* 1. 疯癫时的背景动态光晕 (半透明) */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0], opacity: isMadness ? 0.3 : 0 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className={`absolute -top-1/2 -left-1/2 w-[200vw] h-[200vw] rounded-[40%] blur-[100px] bg-red-900 mix-blend-overlay`}
      />

      {/* 2. 精神污染层 (眼球) */}
      <AnimatePresence>
        {isMadness && (
          <div className="absolute inset-0">
             {[...Array(5)].map((_, i) => <EyeElement key={i} index={i} />)}
          </div>
        )}
      </AnimatePresence>

      {/* 3. CRT 滤镜层 */}
      {/* 扫描线 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
      {/* 暗角 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
      
      {/* 4. 噪点 (使用 CSS 动画) */}
      <div className="absolute inset-0 opacity-[0.05] animate-grain bg-[url('/assets/textures/noise.svg')] pointer-events-none" />

    </div>
  );
};