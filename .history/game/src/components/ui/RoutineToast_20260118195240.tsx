import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export const RoutineToast: React.FC = () => {
  const notifications = useGameStore(s => s.notifications);

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`
              px-4 py-3 rounded shadow-lg backdrop-blur-md border-l-4 min-w-[200px]
              ${notif.type === 'success' ? 'bg-green-900/80 border-green-500 text-green-100' : ''}
              ${notif.type === 'warning' ? 'bg-yellow-900/80 border-yellow-500 text-yellow-100' : ''}
              ${notif.type === 'error' ? 'bg-red-900/80 border-red-500 text-red-100' : ''}
              ${notif.type === 'info' ? 'bg-blue-900/80 border-blue-500 text-blue-100' : ''}
              /* 处理飘字类型样式 */
              ${notif.type === 'GOLD' ? 'bg-yellow-600/90 border-yellow-300 text-yellow-50 font-bold' : ''}
              ${notif.type === 'HP' ? 'bg-red-600/90 border-red-300 text-red-50 font-bold' : ''}
              ${notif.type === 'SAN' ? 'bg-purple-600/90 border-purple-300 text-purple-50 font-bold' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              {/* 修复：添加 undefined 检查，只有当 value 存在时才渲染 */}
              {notif.value !== undefined && (
                <span className="text-lg">
                  {notif.value > 0 ? '+' : ''}{notif.value}
                </span>
              )}
              <span className="text-sm">{notif.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};