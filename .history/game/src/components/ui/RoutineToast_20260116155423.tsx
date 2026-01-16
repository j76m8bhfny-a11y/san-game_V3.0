import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

export const RoutineToast: React.FC = () => {
  const notifications = useGameStore(s => s.notifications);
  const san = useGameStore(s => s.san);
  const removeNotification = useGameStore(s => s.removeNotification);

  // 视觉风格判断
  const isGlitch = san <= 30;
  const isHighEnd = san > 70;

  return (
    <div className="fixed top-4 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none space-y-2 px-4">
      <AnimatePresence mode='popLayout'>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            layout
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            onAnimationComplete={() => {
              // 自动移除 (2.5秒后)
              setTimeout(() => removeNotification(notif.id), 2500);
            }}
            className={`
              relative w-full max-w-sm overflow-hidden flex items-center justify-between px-4 py-3 shadow-xl backdrop-blur-md
              ${isHighEnd 
                ? 'bg-white/90 rounded-2xl border border-white/40 text-black shadow-blue-500/10' // Apple 风
                : isGlitch 
                  ? 'bg-black/90 border-l-4 border-r-4 border-red-600 rounded-none text-green-500 font-pixel' // 故障风
                  : 'bg-neutral-900/90 border border-gray-700 rounded-md text-gray-200' // 工业风
              }
            `}
          >
            {/* 图标与文本 */}
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 flex items-center justify-center rounded-full text-lg
                ${isHighEnd ? 'bg-gray-100' : 'bg-black border border-current'}
              `}>
                {notif.type === 'GOLD' && '💰'}
                {notif.type === 'HP' && '❤️'}
                {notif.type === 'SAN' && '👁️'}
              </div>
              
              <div className="flex flex-col">
                <span className={`text-xs font-bold uppercase tracking-wider ${isGlitch ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                  {isGlitch ? 'SY$_ERR' : 'Notification'}
                </span>
                <span className={`text-sm font-medium leading-none ${isHighEnd ? 'text-gray-900' : 'text-gray-100'}`}>
                  {notif.message}
                </span>
              </div>
            </div>

            {/* 数值变化 */}
            <div className={`text-lg font-black tracking-tight
              ${notif.value > 0 
                ? (isHighEnd ? 'text-green-500' : 'text-green-400') 
                : (isHighEnd ? 'text-black' : 'text-red-500')}
            `}>
              {notif.value > 0 ? '+' : ''}{notif.value}
            </div>

            {/* 故障装饰线 */}
            {isGlitch && (
              <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20 bg-[url('/assets/textures/noise.svg')]" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};