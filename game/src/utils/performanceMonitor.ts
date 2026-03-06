/**
 * 性能监控工具
 * 用于开发模式下监控State大小、内存使用等指标
 */

import { useGameStore } from '@/store/useGameStore';

// 只在开发模式下启用
const isDev = import.meta.env.DEV;

// 性能监控配置
const CONFIG = {
  MAX_STATE_SIZE_KB: 500,
  MAX_HISTORY_LENGTH: 100,
  MAX_LEDGER_HISTORY: 100,
  MAX_TRIGGERED_EVENTS: 200,
  MAX_MEMORY_MB: 200,
  CHECK_INTERVAL_MS: 30000,  // 每30秒检查一次
};

interface PerformanceReport {
  timestamp: number;
  stateSizeKB: number;
  memoryMB?: number;
  warnings: string[];
  metrics: {
    historyLength: number;
    ledgerHistoryLength: number;
    triggeredEventsCount: number;
    eventCacheSize: number;
  };
}

/**
 * 检查State大小和数组长度
 */
function checkStateHealth(): { pass: boolean; warnings: string[]; metrics: PerformanceReport['metrics'] } {
  const warnings: string[] = [];
  
  try {
    const state = useGameStore.getState();
    const stateSize = JSON.stringify(state).length / 1024;
    
    if (stateSize > CONFIG.MAX_STATE_SIZE_KB) {
      warnings.push(`State大小超过限制: ${stateSize.toFixed(1)}KB > ${CONFIG.MAX_STATE_SIZE_KB}KB`);
    }
    
    // 检查数组长度
    const historyLength = state.history?.length || 0;
    const ledgerHistoryLength = state.vitality?.ledger?.history?.length || 0;
    const triggeredEventsCount = state.vitality?.flags?.triggeredEvents?.length || 0;
    
    if (historyLength > CONFIG.MAX_HISTORY_LENGTH) {
      warnings.push(`history数组过长: ${historyLength} > ${CONFIG.MAX_HISTORY_LENGTH}`);
    }
    
    if (ledgerHistoryLength > CONFIG.MAX_LEDGER_HISTORY) {
      warnings.push(`ledger.history数组过长: ${ledgerHistoryLength} > ${CONFIG.MAX_LEDGER_HISTORY}`);
    }
    
    if (triggeredEventsCount > CONFIG.MAX_TRIGGERED_EVENTS) {
      warnings.push(`triggeredEvents数组过长: ${triggeredEventsCount} > ${CONFIG.MAX_TRIGGERED_EVENTS}`);
    }
    
    // 检查事件缓存（如果可访问）
    let eventCacheSize = 0;
    try {
      const { eventIndex } = require('@/assets/data/events/index');
      const stats = eventIndex.getCacheStats?.();
      if (stats) {
        eventCacheSize = stats.size;
        if (stats.hitRate > 0.9) {
          warnings.push(`事件缓存即将满载: ${(stats.hitRate * 100).toFixed(0)}%`);
        }
      }
    } catch {
      // 忽略访问错误
    }
    
    return {
      pass: warnings.length === 0,
      warnings,
      metrics: {
        historyLength,
        ledgerHistoryLength,
        triggeredEventsCount,
        eventCacheSize
      }
    };
  } catch (error) {
    return {
      pass: false,
      warnings: [`检查State健康时出错: ${error}`],
      metrics: {
        historyLength: 0,
        ledgerHistoryLength: 0,
        triggeredEventsCount: 0,
        eventCacheSize: 0
      }
    };
  }
}

/**
 * 检查内存使用
 */
function checkMemory(): { pass: boolean; memoryMB?: number; warning?: string } {
  if (!('memory' in performance)) {
    return { pass: true };  // 浏览器不支持
  }
  
  const mem = (performance as any).memory;
  const usedMB = mem.usedJSHeapSize / 1048576;
  
  if (usedMB > CONFIG.MAX_MEMORY_MB) {
    return {
      pass: false,
      memoryMB: usedMB,
      warning: `内存使用过高: ${usedMB.toFixed(1)}MB > ${CONFIG.MAX_MEMORY_MB}MB`
    };
  }
  
  return { pass: true, memoryMB: usedMB };
}

/**
 * 生成性能报告
 */
export function generatePerformanceReport(): PerformanceReport {
  const stateHealth = checkStateHealth();
  const memoryCheck = checkMemory();
  
  const warnings = [...stateHealth.warnings];
  if (memoryCheck.warning) {
    warnings.push(memoryCheck.warning);
  }
  
  return {
    timestamp: Date.now(),
    stateSizeKB: JSON.stringify(useGameStore.getState()).length / 1024,
    memoryMB: memoryCheck.memoryMB,
    warnings,
    metrics: stateHealth.metrics
  };
}

/**
 * 快速检查（用于每回合后调用）
 */
export function quickCheck(): void {
  if (!isDev) return;
  
  const stateHealth = checkStateHealth();
  
  if (!stateHealth.pass) {
    console.warn('[PerformanceMonitor] 性能警告:', stateHealth.warnings);
  }
}

/**
 * 完整检查（用于手动触发或定时检查）
 */
export function fullCheck(): PerformanceReport {
  const report = generatePerformanceReport();
  
  if (!isDev) return report;
  
  if (report.warnings.length > 0) {
    console.group('🔍 性能检查报告');
    console.table({
      'State大小': `${report.stateSizeKB.toFixed(1)}KB`,
      '内存使用': report.memoryMB ? `${report.memoryMB.toFixed(1)}MB` : 'N/A',
      'history长度': report.metrics.historyLength,
      'ledger长度': report.metrics.ledgerHistoryLength,
      '已触发事件': report.metrics.triggeredEventsCount,
      '事件缓存': report.metrics.eventCacheSize
    });
    console.warn('⚠️ 警告:', report.warnings);
    console.groupEnd();
  } else {
    console.log('✅ 性能检查通过');
  }
  
  return report;
}

/**
 * 启动自动监控
 */
export function startAutoMonitor(): () => void {
  if (!isDev) return () => {};
  
  console.log('[PerformanceMonitor] 启动自动监控');
  
  const intervalId = setInterval(() => {
    fullCheck();
  }, CONFIG.CHECK_INTERVAL_MS);
  
  // 返回清理函数
  return () => clearInterval(intervalId);
}

/**
 * 在浏览器控制台暴露的调试工具
 */
if (isDev && typeof window !== 'undefined') {
  (window as any).performanceMonitor = {
    quickCheck,
    fullCheck,
    startAutoMonitor,
    generatePerformanceReport,
    CONFIG
  };
  
  console.log('[PerformanceMonitor] 已挂载到 window.performanceMonitor');
}
