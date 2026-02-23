/**
 * useHeartbeat - 心跳音效与震动钩子
 * 
 * 当HP低于危险阈值时，播放沉重心跳音效和震动反馈
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';

const HP_CRITICAL_THRESHOLD = 0.25;

interface HeartbeatConfig {
  // 心跳间隔（毫秒）
  interval: number;
  // 音量 (0-1)
  volume: number;
  // 震动强度 (Vibration API pattern)
  vibrationPattern: number | number[];
}

/**
 * 根据HP百分比计算心跳配置
 * HP越低，心跳越快、越响、震动越强
 */
const getHeartbeatConfig = (hpPercent: number): HeartbeatConfig | null => {
  if (hpPercent > HP_CRITICAL_THRESHOLD) return null;
  
  const intensity = 1 - (hpPercent / HP_CRITICAL_THRESHOLD); // 0~1
  
  // 基础间隔1200ms，最低可到500ms
  const interval = Math.max(500, 1200 - intensity * 700);
  
  // 音量从0.3到0.8
  const volume = 0.3 + intensity * 0.5;
  
  // 震动强度递增
  const vibrationPattern = intensity > 0.7 
    ? [200, 100, 200]  // 高强度：双震
    : intensity > 0.4 
      ? [150, 50]      // 中强度
      : 100;           // 低强度
  
  return { interval, volume, vibrationPattern };
};

/**
 * 使用Web Audio API创建心跳音效
 */
const createHeartbeatSound = (volume: number): void => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // 创建低频振荡器（心跳的低沉声音）
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // 心跳频率：低频快速下降
    oscillator.frequency.setValueAtTime(80, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    
    // 音量包络：快速上升后缓慢下降
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.35);
    
    // 清理
    setTimeout(() => {
      ctx.close();
    }, 500);
  } catch (e) {
    // 音频API不可用，静默失败
  }
};

/**
 * 触发震动（如果支持）
 */
const triggerVibration = (pattern: number | number[]): void => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/**
 * 心跳钩子
 * @returns 当前是否处于危险状态
 */
export const useHeartbeat = (): boolean => {
  const { vitality } = useGameStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const hpPercent = vitality.metrics.hp / vitality.metrics.maxHp;
  const config = getHeartbeatConfig(hpPercent);
  const isCritical = config !== null;
  
  const playHeartbeat = useCallback(() => {
    if (!config) return;
    
    createHeartbeatSound(config.volume);
    triggerVibration(config.vibrationPattern);
  }, [config]);
  
  useEffect(() => {
    // 清除旧定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (config) {
      // 立即播放一次
      playHeartbeat();
      
      // 设置定时器
      intervalRef.current = setInterval(playHeartbeat, config.interval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config, playHeartbeat]);
  
  return isCritical;
};

/**
 * 危险状态检测钩子（用于UI显示）
 */
export const useDangerState = () => {
  const { vitality } = useGameStore();
  
  const hpPercent = vitality.metrics.hp / vitality.metrics.maxHp;
  const insightPercent = vitality.metrics.insight / vitality.metrics.maxInsight;
  const hungerPercent = vitality.metrics.hunger / vitality.metrics.maxHunger;
  
  return {
    isHpCritical: hpPercent <= 0.25,
    isInsightCritical: insightPercent <= 0.30,
    isHungerCritical: hungerPercent >= 0.75,
    hpPercent,
    insightPercent,
    hungerPercent,
    // 获取最紧急的危险类型
    mostCritical: hpPercent <= 0.15 ? 'hp' 
      : insightPercent <= 0.20 ? 'insight'
      : hungerPercent >= 0.85 ? 'hunger'
      : hpPercent <= 0.25 ? 'hp'
      : insightPercent <= 0.30 ? 'insight'
      : 'hunger',
  };
};

export default useHeartbeat;
