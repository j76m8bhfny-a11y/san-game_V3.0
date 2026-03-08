/**
 * AchievementPanel 组件
 * 
 * 显示所有成就列表和进度
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSteamAchievements, useSteamUnlockedCount } from '../../store/steam/useSteamStore';
import { Trophy, Lock, X } from 'lucide-react';
import type { Achievement } from '../../types/steam';

interface AchievementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementPanel: React.FC<AchievementPanelProps> = ({ isOpen, onClose }) => {
  const achievements = useSteamAchievements();
  const unlockedCount = useSteamUnlockedCount();
  const totalCount = achievements.length;
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!isOpen) return null;

  const filteredAchievements = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl max-h-[80vh] bg-gray-900 rounded-sm border border-gray-700 overflow-hidden flex flex-col"
      >
        {/* 头部 */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">成就</h2>
                <p className="text-gray-400 text-sm">
                  已解锁 {unlockedCount}/{totalCount} 个成就
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-sm transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* 进度条 */}
          <div className="h-3 bg-gray-800 rounded-sm overflow-hidden">
            <motion.div
              className="h-full bg-pixel-gradient-gold"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* 筛选按钮 */}
          <div className="flex gap-2 mt-4">
            {(['all', 'unlocked', 'locked'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {type === 'all' && '全部'}
                {type === 'unlocked' && '已解锁'}
                {type === 'locked' && '未解锁'}
              </button>
            ))}
          </div>
        </div>

        {/* 成就列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              没有找到符合条件的成就
            </div>
          ) : (
            filteredAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const isUnlocked = achievement.unlocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-4 rounded-sm border transition-all ${
        isUnlocked
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-gray-800/50 border-gray-700 opacity-60'
      }`}
    >
      {/* 图标 */}
      <div
        className={`flex-shrink-0 w-14 h-14 rounded-sm flex items-center justify-center ${
          isUnlocked
            ? 'bg-pixel-gradient-gold'
            : 'bg-gray-700'
        }`}
      >
        {isUnlocked ? (
          <Trophy className="w-7 h-7 text-white" />
        ) : (
          <Lock className="w-6 h-6 text-gray-500" />
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
            {achievement.name}
          </h3>
          {isUnlocked && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
              已解锁
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
        {achievement.is_progressive && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-700 rounded-sm overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-sm"
                style={{
                  width: `${(achievement.current_progress / achievement.max_progress) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {achievement.current_progress}/{achievement.max_progress}
            </p>
          </div>
        )}
      </div>

      {/* 解锁时间 */}
      {isUnlocked && achievement.unlock_time && (
        <div className="text-xs text-gray-500">
          {new Date(achievement.unlock_time * 1000).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
};
