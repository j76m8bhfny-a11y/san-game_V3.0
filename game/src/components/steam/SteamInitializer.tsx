/**
 * SteamInitializer 组件
 * 
 * 处理 Steam 初始化状态显示和错误处理
 */

import React, { useEffect, useState } from 'react';
import { useSteamInit } from '../../hooks/steam';
import type { SteamInitResult } from '../../types/steam';

interface SteamInitializerProps {
  /** 初始化成功回调 */
  onInitialized?: (result: SteamInitResult) => void;
  /** 初始化失败回调 */
  onFailed?: (error: string) => void;
  /** 是否显示加载画面 */
  showLoadingScreen?: boolean;
  /** 子组件（初始化成功后渲染） */
  children: React.ReactNode;
}

export const SteamInitializer: React.FC<SteamInitializerProps> = ({
  onInitialized,
  onFailed,
  showLoadingScreen = true,
  children,
}) => {
  const [showContent, setShowContent] = useState(false);
  
  const { isInitializing, isConnected, error, retry } = useSteamInit({
    autoInit: true,
    onSuccess: (result) => {
      onInitialized?.(result);
      setShowContent(true);
    },
    onError: (err) => {
      onFailed?.(err);
      // 即使没有 Steam，也显示内容（离线模式）
      setShowContent(true);
    },
  });

  // 如果禁用加载画面，直接显示内容
  useEffect(() => {
    if (!showLoadingScreen) {
      setShowContent(true);
    }
  }, [showLoadingScreen]);

  // 如果还在初始化且显示加载画面
  if (isInitializing && showLoadingScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-sm h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4" />
        <p className="text-lg font-medium">正在连接 Steam...</p>
        <p className="text-sm text-gray-400 mt-2">首次启动可能需要几秒钟</p>
      </div>
    );
  }

  // 如果初始化失败且未连接
  if (error && !isConnected && showLoadingScreen && !showContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2">Steam 连接失败</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          {error}
        </p>
        <div className="flex gap-4">
          <button
            onClick={retry}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-sm font-medium transition-colors"
          >
            重试连接
          </button>
          <button
            onClick={() => setShowContent(true)}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-sm font-medium transition-colors"
          >
            离线模式继续
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-8">
          离线模式下，成就和云存档功能将不可用
        </p>
      </div>
    );
  }

  // 显示内容（如果 showContent 为 true 或已连接）
  if (showContent || isConnected) {
    return <>{children}</>;
  }

  // 默认返回 null（不应该到达这里）
  return null;
};
