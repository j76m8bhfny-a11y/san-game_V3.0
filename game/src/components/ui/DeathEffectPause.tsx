/**
 * DeathEffectPause - 死亡时暂停其他效果
 * 
 * 当DeathSummary显示时：
 * - 暂停GlitchUI效果
 * - 暂停SystemGazeOverlay
 * - 暂停AtmosphereOverlay的动态效果
 * - 显示纯黑背景
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface DeathEffectContextType {
  isPaused: boolean;
  pauseEffects: () => void;
  resumeEffects: () => void;
}

const DeathEffectContext = createContext<DeathEffectContextType>({
  isPaused: false,
  pauseEffects: () => {},
  resumeEffects: () => {},
});

export const DeathEffectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPaused, setIsPaused] = useState(false);

  const pauseEffects = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeEffects = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <DeathEffectContext.Provider value={{ isPaused, pauseEffects, resumeEffects }}>
      {children}
    </DeathEffectContext.Provider>
  );
};

export const useDeathEffectPause = () => useContext(DeathEffectContext);

export default DeathEffectProvider;
