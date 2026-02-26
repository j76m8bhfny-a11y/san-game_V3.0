/**
 * useSteamInit Hook
 * 
 * 处理 Steam 初始化逻辑
 */

import { useEffect, useCallback, useState } from 'react';
import { useSteamStore } from '../../store/steam/useSteamStore';
import type { SteamInitResult } from '../../types/steam';

interface UseSteamInitOptions {
  /** 是否在组件挂载时自动初始化 */
  autoInit?: boolean;
  /** 初始化失败时的回调 */
  onError?: (error: string) => void;
  /** 初始化成功时的回调 */
  onSuccess?: (result: SteamInitResult) => void;
}

interface UseSteamInitReturn {
  /** 是否正在初始化 */
  isInitializing: boolean;
  /** 是否已连接 */
  isConnected: boolean;
  /** 错误信息 */
  error: string | null;
  /** 手动触发初始化 */
  initialize: () => Promise<SteamInitResult>;
  /** 重新尝试连接 */
  retry: () => Promise<SteamInitResult>;
}

export function useSteamInit(options: UseSteamInitOptions = {}): UseSteamInitReturn {
  const { autoInit = true, onError, onSuccess } = options;
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const storeInitialize = useSteamStore((state) => state.initialize);
  const isConnected = useSteamStore((state) => state.isConnected);
  const storeError = useSteamStore((state) => state.errorMessage);

  const initialize = useCallback(async (): Promise<SteamInitResult> => {
    setIsInitializing(true);
    setError(null);

    try {
      const result = await storeInitialize();
      
      if (result.success) {
        onSuccess?.(result);
      } else {
        const errorMsg = result.error_message || 'Steam 连接失败';
        setError(errorMsg);
        onError?.(errorMsg);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      onError?.(errorMsg);
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, [storeInitialize, onError, onSuccess]);

  const retry = useCallback(async (): Promise<SteamInitResult> => {
    return initialize();
  }, [initialize]);

  // 自动初始化
  useEffect(() => {
    if (autoInit) {
      initialize();
    }
  }, [autoInit, initialize]);

  // 同步 store 中的错误
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  return {
    isInitializing,
    isConnected,
    error,
    initialize,
    retry,
  };
}
