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
            bg-white/70 
            backdrop-blur-2xl 
            backdrop-saturate-150
            border border-white/50
            rounded-[22px] 
            shadow-[0_8px_32px_rgba(0,0,0,0.12)]
            p-4 flex items-center gap-4
          ">
            {/* 👈 修改点 2: 左侧文本区 (Header + Content 包在一起) */}
            <div className="flex-1 min-w-0"> 
              
              {/* Header */}
              <div className="flex items-center gap-2 mb-1.5 opacity-50">
                <div className="w-4 h-4 bg-black rounded-[5px] flex items-center justify-center">
                   <span className="text-[9px] text-white font-bold font-mono">i</span>
                </div>
                <span className="text-[11px] font-semibold tracking-wide text-black uppercase">
                  MESSAGES
                </span>
                <span className="text-[10px] text-black font-medium ml-1">· 现在</span>
              </div>

              {/* Content: 去掉了底部的 margin */}
              <div className="pl-0.5">
                <p className="text-[15px] leading-snug font-medium text-gray-900">
                  {currentRoast}
                </p>
              </div>
            </div>

            {/* 👈 修改点 3: 右侧按钮 (变为自适应宽度，不再是 w-full) */}
            <button
              onClick={dismiss}
              className="
                shrink-0       /* 防止被挤压 */
                px-5 py-2.5    /* 调整内边距，使其大小合适 */
                bg-[#000000]/5 hover:bg-[#000000]/10 active:bg-[#000000]/15
                rounded-xl
                text-[15px] font-semibold text-[#007AFF]
                transition-colors duration-200
                flex items-center justify-center
              "
            >
              我知道了
            </button>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};