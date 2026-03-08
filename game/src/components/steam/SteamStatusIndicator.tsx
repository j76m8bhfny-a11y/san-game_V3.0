/**
 * SteamStatusIndicator 组件
 * 
 * 显示 Steam 连接状态和快捷操作
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSteamStore, useSteamConnected, useSteamPlayerInfo } from '../../store/steam/useSteamStore';
import { AchievementPanel } from './AchievementPanel';
import { CloudSavePanel } from './CloudSavePanel';
import { Trophy, Cloud, ChevronDown, ChevronUp } from 'lucide-react';

interface SteamStatusIndicatorProps {
  /** 当前游戏状态，用于云存档 */
  currentGameState?: {
    gameDay: number;
    socialClass: string;
    money: number;
    health: number;
    sanity: number;
    triggeredEvents: string[];
  } | null;
  /** 加载存档后的回调 */
  onLoadSave?: (slot: number) => void;
}

// Steam 图标 SVG 组件（lucide-react 中没有 Steam 图标）
const SteamIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15h-2v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.95c5.05-.5 9-4.76 9-9.95 0-5.52-4.48-10-10-10z"/>
    <circle cx="17" cy="7" r="1.5" fill="currentColor"/>
  </svg>
);

export const SteamStatusIndicator: React.FC<SteamStatusIndicatorProps> = ({
  currentGameState,
  onLoadSave,
}) => {
  const isConnected = useSteamConnected();
  const playerInfo = useSteamPlayerInfo();
  const achievements = useSteamStore((state) => state.achievements);
  const unlockedCount = useSteamStore((state) => state.unlockedAchievements.size);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCloudSaves, setShowCloudSaves] = useState(false);

  const totalCount = achievements.length;

  return (
    <>
      {/* 状态指示器 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-4 z-40"
      >
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-sm border backdrop-solid-dark transition-all cursor-pointer ${
            isConnected
              ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
              : 'bg-gray-800/80 border-gray-700 hover:bg-gray-700/80'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Steam 图标 */}
          <div className="relative">
            <SteamIcon className={`w-5 h-5 ${isConnected ? 'text-green-400' : 'text-gray-500'}`} />
            {isConnected && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-sm" />
            )}
          </div>

          {/* 状态文本 */}
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
              {isConnected ? playerInfo?.playerName || '已连接' : '离线模式'}
            </span>
            {isConnected && (
              <span className="text-xs text-gray-500">
                {unlockedCount}/{totalCount} 成就
              </span>
            )}
          </div>

          {/* 展开箭头 */}
          {isConnected && (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )
          )}
        </div>

        {/* 展开菜单 */}
        <AnimatePresence mode="wait">
          {isExpanded && isConnected && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-48 backdrop-solid-dark rounded-sm border border-gray-700 overflow-hidden shadow-pixel"
            >
              <MenuItem
                icon={<Trophy className="w-4 h-4" />}
                label="成就"
                badge={`${unlockedCount}/${totalCount}`}
                onClick={() => {
                  setShowAchievements(true);
                  setIsExpanded(false);
                }}
              />
              <MenuItem
                icon={<Cloud className="w-4 h-4" />}
                label="云存档"
                onClick={() => {
                  setShowCloudSaves(true);
                  setIsExpanded(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 成就面板 */}
      <AchievementPanel
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />

      {/* 云存档面板 */}
      <CloudSavePanel
        isOpen={showCloudSaves}
        onClose={() => setShowCloudSaves(false)}
        currentGameState={currentGameState}
        onLoadSave={onLoadSave}
      />
    </>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, badge, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors text-left"
  >
    <div className="flex items-center gap-3 text-gray-300">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    {badge && (
      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
        {badge}
      </span>
    )}
  </button>
);
