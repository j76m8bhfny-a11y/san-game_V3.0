import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

export const RoastModal = () => {
  const currentRoast = useGameStore((state) => state.currentRoast);
  const dismiss = useGameStore((state) => state.dismissRoastAndEndEvent);

  return (
    <AnimatePresence>
      {currentRoast && (
        <motion.div
          key="roast-notification"
          // 初始状态：在屏幕顶部之外
          initial={{ opacity: 0, y: -150, x: '-50%' }}
          // 激活状态：下滑到顶部位置，带有弹簧效果
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          // 退出状态：上滑消失
          exit={{ opacity: 0, y: -150, x: '-50%' }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            mass: 0.8 
          }}
          className="fixed top-24 left-1/2 z-[100] w-[92vw] max-w-[680px]"
        >
          {/* iOS Glassmorphism Container 
             - bg-white/80: 高透白底
             - backdrop-blur-2xl: 极强的毛玻璃模糊
             - saturate-150: 增加透出背景的鲜艳度（iOS特征）
          */}
          <div className="
            relative overflow-hidden
            bg-white/80 backdrop-blur-2xl saturate-150
            border border-white/40
            rounded-[22px] 
            shadow-[0_8px_32px_rgba(0,0,0,0.12)]
            p-4
          ">
            {/* Header: 模拟 iOS 通知顶部的小标题栏 */}
            <div className="flex items-center justify-between mb-2 opacity-60">
              <div className="flex items-center gap-2">
                {/* 伪装的 App Icon */}
                <div className="w-5 h-5 bg-black rounded-[5px] flex items-center justify-center shadow-sm">
                   <span className="text-[10px] text-white font-bold font-mono">R</span>
                </div>
                <span className="text-[13px] font-semibold uppercase tracking-wide text-black">
                  REALITY OS
                </span>
              </div>
              <span className="text-[12px] text-black/80">现在</span>
            </div>

            {/* Content: 吐槽正文 */}
            <div className="mb-4 pl-1">
              <p className="text-[15px] leading-snug font-medium text-gray-900 tracking-tight">
                {currentRoast}
              </p>
            </div>

            {/* Action Button: iOS 风格按钮 */}
            <button
              onClick={dismiss}
              className="
                w-full py-3
                bg-[#F2F2F7]/80 hover:bg-[#E5E5EA] active:bg-[#D1D1D6]
                rounded-xl
                text-[15px] font-semibold text-[#007AFF]
                transition-all duration-200
                flex items-center justify-center
                group
              "
            >
              <span>我知道了</span>
            </button>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};