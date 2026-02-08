import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';

export const RoutineToast: React.FC = () => {
  const notifications = useGameStore(s => s.notifications);
  const { toastStyles } = NARRATIVE_RULES.ui;

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
              ${(toastStyles as Record<string, string>)[notif.type] || (toastStyles as Record<string, string>)['info']}
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