import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { AnimatePresence } from 'framer-motion';
import rules from '@/assets/data/rules/vitalityRules.json';

// --- 子组件：觉醒之眼（象征看到真相）---
// 高灵视时出现的视觉元素
const AwakenedEye = ({ index }: { index: number }) => {
  const styleConfig = useMemo(() => {
    return {
      top: Math.floor(Math.random() * 80) + 10 + '%',
      left: Math.floor(Math.random() * 80) + 10 + '%',
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 3
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
      className="absolute w-8 h-4 border border-amber-400/60 rounded-full flex items-center justify-center pointer-events-none blur-[0.5px] animate-eye-glow"
    >
      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
    </div>
  );
};

// --- 主组件 ---
export const GlobalAtmosphere: React.FC = () => {
  const san = useGameStore((state) => state.vitality.metrics.insight);
  
  // 灵视值阈值
  const insightHigh = rules.visuals.thresholds.insightHigh ?? 70;
  const insightAwaken = rules.visuals.thresholds.insightAwaken ?? 85;
  
  // 高灵视 = 觉醒状态，看到隐藏的东西
  const isAwakened = san > insightHigh;
  const isTranscendent = san > insightAwaken;

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden w-screen h-screen">
      
      {/* 1. 觉醒时的背景辉光 */}
      <div
        className={`absolute -top-1/2 -left-1/2 w-[200vw] h-[200vw] rounded-[40%] blur-[100px] transition-all duration-1000 ${
          isTranscendent 
            ? 'bg-amber-600/20 animate-awaken-aura' 
            : isAwakened 
              ? 'bg-purple-600/10' 
              : 'opacity-0'
        } mix-blend-overlay`}
      />

      {/* 2. 觉醒层（真知之眼） */}
      <AnimatePresence>
        {isAwakened && (
          <div className="absolute inset-0">
             {[...Array(isTranscendent ? 5 : 3)].map((_, i) => <AwakenedEye key={i} index={i} />)}
          </div>
        )}
      </AnimatePresence>

      {/* 3. CRT 滤镜层 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
      {/* 暗角 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
      
      {/* 4. 噪点 */}
      <div className="absolute inset-0 opacity-[0.05] animate-grain bg-[url('/assets/textures/noise.svg')] pointer-events-none" />

      {/* CSS 动画定义 */}
      <style>{`
        @keyframes eye-glow {
          0%, 100% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 0.6; transform: scale(1); }
        }
        .animate-eye-glow {
          animation: eye-glow ease-in-out infinite;
        }
        @keyframes awaken-aura {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.05) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        .animate-awaken-aura {
          animation: awaken-aura 30s linear infinite;
        }
      `}</style>
    </div>
  );
};
