/**
 * useAchievementUnlock Hook
 * 
 * 处理成就解锁通知和动画
 */

import { useCallback, useState, useEffect } from 'react';
import { useSteamStore } from '../../store/steam/useSteamStore';
import type { Achievement } from '../../types/steam';

interface AchievementNotification {
  achievement: Achievement;
  timestamp: number;
}

interface UseAchievementUnlockReturn {
  /** 当前显示的解锁通知 */
  notification: AchievementNotification | null;
  /** 通知队列 */
  queue: AchievementNotification[];
  /** 关闭当前通知 */
  dismiss: () => void;
  /** 强制显示某个成就通知（调试用） */
  showNotification: (achievementId: string) => void;
}

export function useAchievementUnlock(): UseAchievementUnlockReturn {
  const [notification, setNotification] = useState<AchievementNotification | null>(null);
  const [queue, setQueue] = useState<AchievementNotification[]>([]);
  
  const achievements = useSteamStore((state) => state.achievements);

  // 监听新解锁的成就
  useEffect(() => {
    // 检查哪些成就是新解锁的（刚刚解锁的）
    const checkNewUnlocks = () => {
      const now = Date.now() / 1000;
      const newUnlocks = achievements.filter((a) => {
        if (!a.unlocked || !a.unlock_time) return false;
        // 如果解锁时间在最近 5 秒内，认为是新解锁
        return now - a.unlock_time < 5;
      });

      newUnlocks.forEach((achievement) => {
        const notification: AchievementNotification = {
          achievement,
          timestamp: Date.now(),
        };

        setQueue((prev) => {
          // 避免重复添加
          if (prev.some((n) => n.achievement.id === achievement.id)) {
            return prev;
          }
          return [...prev, notification];
        });
      });
    };

    // 每 2 秒检查一次新解锁
    const interval = setInterval(checkNewUnlocks, 2000);
    return () => clearInterval(interval);
  }, [achievements]);

  // 处理通知队列
  useEffect(() => {
    if (notification || queue.length === 0) return;

    // 显示队列中的下一个通知
    const next = queue[0];
    setNotification(next);
    setQueue((prev) => prev.slice(1));

    // 5 秒后自动关闭
    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification, queue]);

  const dismiss = useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = useCallback((achievementId: string) => {
    const achievement = achievements.find((a) => a.id === achievementId);
    if (achievement) {
      setQueue((prev) => [
        ...prev,
        {
          achievement,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [achievements]);

  return {
    notification,
    queue,
    dismiss,
    showNotification,
  };
}
