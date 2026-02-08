import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { AnimatePresence } from 'framer-motion';
import rules from '@/assets/data/rules/vitalityRules.json';

// --- 子组件：注视的眼睛 ---
// ✅ 优化：使用纯 CSS 动画替代 framer-motion，大幅降低 CPU 占用
const EyeElement = ({ index }: { index: number }) => {
  const styleConfig = useMemo(() => {
    return {
      top: Math.floor(Math.random() * 80) + 10 + '%',
      left: Math.floor(Math.random() * 80) + 10 + '%',
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4 // 3-7秒随机持续时间
    };
  }, []);

  return (
    <div
      style={{ 
        top: styleConfig.top, 
        left: styleConfig.left,
        animationDelay: `${styleConfig.delay}s`,
        animationDuration: `${styleConfig.duration}s`
      }}
      className="absolute w-12 h-6 border-2 border-red-500 rounded-full flex items-center justify-center pointer-events-none blur-[1px] animate-eye-blink"
    >
      <div className="w-2 h-2 bg-red-500 rounded-full" />
    </div>
  );
};

// --- 主组件 ---
export const GlobalAtmosphere: React.FC = () => {
  // ✅ 1. 修复：路径对齐至 vitality.metrics.san
  const san = useGameStore((state) => state.vitality.metrics.san);
  
  // ✅ 2. 修正：理智值低于 30 才是"疯癫/精神污染"状态
  const isMadness = san < rules.visuals.thresholds.sanLow; 

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden w-screen h-screen">
      
      {/* 1. 疯癫时的背景动态光晕 (半透明) */}
      {/* ✅ 优化：使用 CSS 动画替代 framer-motion */}
      <div
        className={`absolute -top-1/2 -left-1/2 w-[200vw] h-[200vw] rounded-[40%] blur-[100px] bg-red-900 mix-blend-overlay animate-madness-aura ${isMadness ? 'opacity-30' : 'opacity-0'}`}
      />

      {/* 2. 精神污染层 (眼球) */}
      <AnimatePresence>
        {isMadness && (
          <div className="absolute inset-0">
             {[...Array(3)].map((_, i) => <EyeElement key={i} index={i} />)}
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

      {/* ✅ 添加 CSS 动画定义 */}
      <style>{`
        @keyframes eye-blink {
          0%, 90%, 100% { opacity: 0; transform: scale(0.5); }
          45% { opacity: 0.8; transform: scale(1); }
        }
        .animate-eye-blink {
          animation: eye-blink ease-in-out infinite;
        }
        @keyframes madness-aura {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        .animate-madness-aura {
          animation: madness-aura 20s linear infinite;
        }
      `}</style>
    </div>
  );
};
