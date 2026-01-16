import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

export const RoutineToast: React.FC = () => {
  const notifications = useGameStore(s => s.notifications);
  const removeNotification = useGameStore(s => s.removeNotification);
  const san = useGameStore(s => s.san);

  // 风格判定
  const isGlitch = san <= 30;

  return (
    <div className="fixed top-24 left-0 right-0 z-[50] flex flex-col items-center pointer-events-none px-4 gap-2">
      <AnimatePresence mode='popLayout'>
        {notifications.slice(-3).map((notif) => ( // 最多显示3条，防止刷屏
          <motion.div
            key={notif.id}
            layout // 自动布局动画
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            onAnimationComplete={() => {
              setTimeout(() => removeNotification(notif.id), 3000);
            }}
            className={`
              relative w-full max-w-[320px] flex items-center justify-between px-4 py-3 shadow-lg backdrop-blur-md overflow-hidden
              ${isGlitch 
                ? 'bg-black border-l-4 border-red-600 rounded-sm text-green-500 font-mono' 
                : 'bg-white/90 dark:bg-[#1c1c1e]/90 rounded-2xl border border-white/20 text-slate-900 dark:text-white'}
            `}
          >
             {/* 装饰图标 */}
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mr-3
               ${isGlitch ? 'bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-white/10'}
             `}>
               {notif.type === 'GOLD' && '💰'}
               {notif.type === 'HP' && '❤️'}
               {notif.type === 'SAN' && '👁️'}
             </div>

             <div className="flex-1 min-w-0 mr-4">
               <div className="text-[10px] opacity-60 font-bold uppercase tracking-wider truncate">
                 {isGlitch ? 'SYSTEM_ALERT' : 'Notification'}
               </div>
               <div className="text-sm font-semibold truncate leading-tight">
                 {notif.message}
               </div>
             </div>

             <div className={`font-mono font-bold text-lg
                ${notif.value > 0 ? 'text-green-500' : 'text-red-500'}
             `}>
               {notif.value > 0 ? '+' : ''}{notif.value}
             </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};