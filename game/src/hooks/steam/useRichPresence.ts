/**
 * useRichPresence Hook
 * 
 * 自动更新 Steam Rich Presence 状态
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSteamStore } from '../../store/steam/useSteamStore';
import type { GameState } from '../../types/steam';

interface UseRichPresenceOptions {
  /** 是否启用 Rich Presence */
  enabled?: boolean;
}

interface GameStateInfo {
  gameDay: number;
  socialClass: string;
  currentEvent?: string;
  money?: number;
}

export function useRichPresence(options: UseRichPresenceOptions = {}) {
  const { enabled = true } = options;
  
  const isConnected = useSteamStore((state) => state.isConnected);
  const storeSetGameState = useSteamStore((state) => state.setGameState);
  const storeSetEventState = useSteamStore((state) => state.setEventState);
  const storeClearRichPresence = useSteamStore((state) => state.clearRichPresence);
  
  const currentStateRef = useRef<GameState | null>(null);
  const currentInfoRef = useRef<GameStateInfo | null>(null);

  // 根据游戏数据确定 GameState
  const determineGameState = useCallback((
    socialClass: string,
    isInEvent: boolean
  ): GameState => {
    if (isInEvent) {
      return 'InEvent';
    }

    switch (socialClass) {
      case 'homeless':
        return 'PlayingSlums';
      case 'worker':
        return 'PlayingWorker';
      case 'middle':
        return 'PlayingMiddle';
      case 'capitalist':
        return 'PlayingCapitalist';
      default:
        return 'PlayingSlums';
    }
  }, []);

  // 更新游戏状态
  const updateGameState = useCallback((
    gameDay: number,
    socialClass: string,
    isInEvent: boolean = false,
    currentEvent?: string,
    money?: number
  ) => {
    if (!enabled || !isConnected) return;

    const state = determineGameState(socialClass, isInEvent);
    
    // 避免重复更新相同状态
    if (
      currentStateRef.current === state &&
      currentInfoRef.current?.gameDay === gameDay &&
      currentInfoRef.current?.socialClass === socialClass
    ) {
      return;
    }

    currentStateRef.current = state;
    currentInfoRef.current = { gameDay, socialClass, currentEvent, money };

    if (isInEvent && currentEvent) {
      storeSetEventState(currentEvent, gameDay, socialClass);
    } else {
      storeSetGameState(state, gameDay, socialClass);
    }
  }, [enabled, isConnected, determineGameState, storeSetGameState, storeSetEventState]);

  // 设置主菜单状态
  const setMainMenu = useCallback(() => {
    if (!enabled || !isConnected) return;
    currentStateRef.current = 'MainMenu';
    storeSetGameState('MainMenu', 0, 'homeless');
  }, [enabled, isConnected, storeSetGameState]);

  // 设置暂停状态
  const setPaused = useCallback(() => {
    if (!enabled || !isConnected) return;
    currentStateRef.current = 'Paused';
    storeSetGameState('Paused', currentInfoRef.current?.gameDay || 0, 'homeless');
  }, [enabled, isConnected, storeSetGameState]);

  // 设置游戏结束状态
  const setGameOver = useCallback((gameDay: number, socialClass: string) => {
    if (!enabled || !isConnected) return;
    currentStateRef.current = 'GameOver';
    storeSetGameState('GameOver', gameDay, socialClass);
  }, [enabled, isConnected, storeSetGameState]);

  // 清除 Rich Presence
  const clear = useCallback(() => {
    if (!isConnected) return;
    storeClearRichPresence();
    currentStateRef.current = null;
    currentInfoRef.current = null;
  }, [isConnected, storeClearRichPresence]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (isConnected) {
        storeClearRichPresence();
      }
    };
  }, [isConnected, storeClearRichPresence]);

  return {
    updateGameState,
    setMainMenu,
    setPaused,
    setGameOver,
    clear,
    currentState: currentStateRef.current,
  };
}
