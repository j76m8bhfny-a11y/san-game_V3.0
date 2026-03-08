/**
 * CloudSavePanel 组件
 * 
 * 云存档管理界面
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCloudSave } from '../../hooks/steam';
import { useSteamStore, useSteamCloudSaves, useSteamCloudEnabled } from '../../store/steam/useSteamStore';
import { Cloud, CloudOff, Upload, Download, Trash2, X, RefreshCw, HardDrive } from 'lucide-react';
import type { SaveFileInfo } from '../../types/steam';

interface CloudSavePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** 当前游戏状态，用于保存 */
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

export const CloudSavePanel: React.FC<CloudSavePanelProps> = ({
  isOpen,
  onClose,
  currentGameState,
  onLoadSave,
}) => {
  const isConnected = useSteamStore((state) => state.isConnected);
  const isCloudEnabled = useSteamCloudEnabled();
  const cloudSaves = useSteamCloudSaves();
  const loadCloudSaves = useSteamStore((state) => state.loadCloudSaves);
  
  const { isSaving, isLoading, lastSyncTime, storageUsage, save, load, deleteSave, sync } = useCloudSave();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<'save' | 'load' | 'delete' | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCloudSaves();
    }
  }, [isOpen, loadCloudSaves]);

  if (!isOpen) return null;

  // 格式化存储大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 保存到槽位
  const handleSave = async (slot: number) => {
    if (!currentGameState) return;
    
    setActionLoading('save');
    try {
      // 转换为 SaveData 格式
      const saveData: any = {
        gameDay: currentGameState.gameDay,
        currentClass: currentGameState.socialClass,
        gold: currentGameState.money,
        hp: currentGameState.health,
        insight: currentGameState.sanity,
        triggeredEvents: currentGameState.triggeredEvents,
        achievementProgress: [],
        extraData: undefined,
      };
      await save(slot, saveData);
    } finally {
      setActionLoading(null);
    }
  };

  // 从槽位加载
  const handleLoad = async (slot: number) => {
    setActionLoading('load');
    try {
      await load(slot);
      onLoadSave?.(slot);
      onClose();
    } finally {
      setActionLoading(null);
    }
  };

  // 删除存档
  const handleDelete = async (slot: number) => {
    if (!confirm('确定要删除这个存档吗？此操作不可恢复。')) return;
    
    setActionLoading('delete');
    try {
      await deleteSave(slot);
    } finally {
      setActionLoading(null);
    }
  };

  // 未连接 Steam
  if (!isConnected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark">
        <div className="bg-gray-900 rounded-sm border border-gray-700 p-8 max-w-md text-center">
          <CloudOff className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Steam 未连接</h2>
          <p className="text-gray-400 mb-6">
            云存档功能需要 Steam 连接。请重启游戏并确保 Steam 客户端正在运行。
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-sm text-white font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-3xl max-h-[85vh] bg-gray-900 rounded-sm border border-gray-700 overflow-hidden flex flex-col"
      >
        {/* 头部 */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">云存档</h2>
                <p className="text-gray-400 text-sm">
                  {isCloudEnabled ? 'Steam 云存档已启用' : 'Steam 云存档未启用'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => sync()}
                disabled={isSaving || isLoading}
                className="p-2 hover:bg-gray-800 rounded-sm transition-colors disabled:opacity-50"
                title="强制同步"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${(isSaving || isLoading) ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-sm transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          {/* 存储配额 */}
          {storageUsage && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400 flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  云端存储空间
                </span>
                <span className="text-gray-300">
                  {formatSize(storageUsage.used)} / {formatSize(storageUsage.total)}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-sm"
                  style={{
                    width: `${(storageUsage.used / storageUsage.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {lastSyncTime && (
            <p className="text-xs text-gray-500 mt-2">
              上次同步: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </div>

        {/* 存档列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 自动存档 */}
            <SaveSlotCard
              slot={0}
              label="自动存档"
              saves={cloudSaves}
              isSelected={selectedSlot === 0}
              onSelect={() => setSelectedSlot(0)}
              onSave={() => handleSave(0)}
              onLoad={() => handleLoad(0)}
              onDelete={() => handleDelete(0)}
              isLoading={actionLoading}
              canSave={!!currentGameState}
            />

            {/* 手动存档槽位 */}
            {[1, 2, 3].map((slot) => (
              <SaveSlotCard
                key={slot}
                slot={slot}
                label={`存档 ${slot}`}
                saves={cloudSaves}
                isSelected={selectedSlot === slot}
                onSelect={() => setSelectedSlot(slot)}
                onSave={() => handleSave(slot)}
                onLoad={() => handleLoad(slot)}
                onDelete={() => handleDelete(slot)}
                isLoading={actionLoading}
                canSave={!!currentGameState}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface SaveSlotCardProps {
  slot: number;
  label: string;
  saves: SaveFileInfo[];
  isSelected: boolean;
  onSelect: () => void;
  onSave: () => void;
  onLoad: () => void;
  onDelete: () => void;
  isLoading: 'save' | 'load' | 'delete' | null;
  canSave: boolean;
}

const SaveSlotCard: React.FC<SaveSlotCardProps> = ({
  slot,
  label,
  saves,
  isSelected,
  onSelect,
  onSave,
  onLoad,
  onDelete,
  isLoading,
  canSave,
}) => {
  const filename = slot === 0 ? 'autosave.json' : `save_slot_${slot}.json`;
  const save = saves.find((s) => s.name === filename);
  const exists = !!save;

  return (
    <motion.div
      onClick={onSelect}
      className={`p-4 rounded-sm border cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-500/10 border-blue-500/50'
          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white">{label}</h3>
          {exists ? (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(save.timestamp * 1000).toLocaleString()}
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">空槽位</p>
          )}
        </div>
        {exists && (
          <span className="text-xs text-gray-500">
            {(save.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-2 pt-3 border-t border-gray-700"
        >
          {canSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              disabled={isLoading === 'save'}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-sm text-sm font-medium text-white transition-colors"
            >
              <Upload className="w-4 h-4" />
              {isLoading === 'save' ? '保存中...' : '保存'}
            </button>
          )}
          
          {exists && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLoad();
                }}
                disabled={isLoading === 'load'}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-sm text-sm font-medium text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                {isLoading === 'load' ? '加载中...' : '加载'}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                disabled={isLoading === 'delete'}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 rounded-sm text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
