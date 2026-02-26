/**
 * AchievementNotification 组件
 * 
 * 成就解锁时的弹出通知
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAchievementUnlock } from '../../hooks/steam';
import { Trophy } from 'lucide-react';

export const AchievementNotification: React.FC = () => {
  const { notification, dismiss } = useAchievementUnlock();
  const [progress, setProgress] = useState(0);

  // 5 秒倒计时进度条
  useEffect(() => {
    if (!notification) {
      setProgress(0);
      return;
    }

    const duration = 5000;
    const interval = 50;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-4 right-4 z-50 w-80"
          onClick={dismiss}
        >
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-md border border-yellow-500/30 rounded-xl overflow-hidden shadow-2xl">
            {/* 进度条 */}
            <div className="h-1 bg-gray-700/50">
              <motion.div
                className="h-full bg-yellow-400"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="p-4 flex items-start gap-4">
              {/* 图标 */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
                  成就解锁
                </p>
                <h3 className="text-white font-bold text-lg truncate">
                  {notification.achievement.name}
                </h3>
                <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                  {notification.achievement.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
