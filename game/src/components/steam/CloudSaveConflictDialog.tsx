/**
 * CloudSaveConflictDialog - Steam云存档冲突解决对话框
 * 
 * 当本地存档和云端存档时间戳不同时显示
 * 允许用户选择使用本地、云端或合并存档
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, HardDrive, GitMerge, Clock, AlertTriangle } from 'lucide-react';
import { FocusTrap } from '@/components/ui/FocusTrap';

interface SaveConflictData {
  slot: number;
  localSave: {
    timestamp: number;
    turn: number;
    class: string;
    gold: number;
    hp: number;
  };
  cloudSave: {
    timestamp: number;
    turn: number;
    class: string;
    gold: number;
    hp: number;
  };
}

interface CloudSaveConflictDialogProps {
  conflict: SaveConflictData;
  isOpen: boolean;
  onResolve: (resolution: 'local' | 'cloud' | 'merge') => void;
  onCancel: () => void;
}

export const CloudSaveConflictDialog: React.FC<CloudSaveConflictDialogProps> = ({
  conflict,
  isOpen,
  onResolve,
  onCancel,
}) => {
  const [selectedOption, setSelectedOption] = useState<'local' | 'cloud' | 'merge'>('local');

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const options = [
    {
      id: 'local' as const,
      icon: HardDrive,
      title: '使用本地存档',
      description: '保留此设备上的游戏进度',
      color: 'text-green-400',
      bgColor: 'bg-green-900/30',
      borderColor: 'border-green-700',
    },
    {
      id: 'cloud' as const,
      icon: Cloud,
      title: '使用云端存档',
      description: '下载Steam云端的存档数据',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-700',
    },
    {
      id: 'merge' as const,
      icon: GitMerge,
      title: '合并存档（实验性）',
      description: '尝试合并两个存档的数据',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/30',
      borderColor: 'border-yellow-700',
    },
  ];

  return (
    <FocusTrap isActive={isOpen} onClose={onCancel}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-solid-dark p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-gray-900 rounded-sm border border-gray-700 overflow-hidden"
        >
          {/* 警告头部 */}
          <div className="p-6 border-b border-gray-700 bg-red-900/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-sm bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">存档冲突检测</h2>
                <p className="text-gray-400 text-sm mt-1">
                  本地存档和云端存档的时间戳不一致，请选择要保留的版本
                </p>
              </div>
            </div>
          </div>

          {/* 存档对比 */}
          <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-700">
            {/* 本地存档 */}
            <div className="p-4 bg-gray-800/50 rounded-sm border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="w-5 h-5 text-green-400" />
                <span className="font-bold text-white">本地存档</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(conflict.localSave.timestamp)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>第 {conflict.localSave.turn} 周</div>
                  <div>{conflict.localSave.class}</div>
                  <div>{conflict.localSave.gold} 金币</div>
                  <div>{conflict.localSave.hp} HP</div>
                </div>
              </div>
            </div>

            {/* 云端存档 */}
            <div className="p-4 bg-gray-800/50 rounded-sm border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-white">云端存档</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(conflict.cloudSave.timestamp)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>第 {conflict.cloudSave.turn} 周</div>
                  <div>{conflict.cloudSave.class}</div>
                  <div>{conflict.cloudSave.gold} 金币</div>
                  <div>{conflict.cloudSave.hp} HP</div>
                </div>
              </div>
            </div>
          </div>

          {/* 选项选择 */}
          <div className="p-6 space-y-3">
            <p className="text-sm text-gray-400 mb-4">请选择处理方式：</p>
            
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedOption === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-sm border-2 transition-all text-left
                    ${isSelected 
                      ? `${option.bgColor} ${option.borderColor} border-2` 
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${option.bgColor}`}>
                    <Icon className={`w-5 h-5 ${option.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {option.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center
                    ${isSelected ? `${option.borderColor} ${option.bgColor}` : 'border-gray-600'}
                  `}>
                    {isSelected && <div className={`w-2.5 h-2.5 rounded-sm ${option.color.replace('text-', 'bg-')}`} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 按钮区 */}
          <div className="p-6 border-t border-gray-700 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-sm font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onResolve(selectedOption)}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium transition-colors"
            >
              确认选择
            </button>
          </div>

          {/* 键盘提示 */}
          <div className="px-6 pb-4 text-center">
            <span className="text-xs text-gray-600">
              使用 Tab 切换选项，Enter 确认，Esc 取消
            </span>
          </div>
        </motion.div>
      </div>
    </FocusTrap>
  );
};

export default CloudSaveConflictDialog;
