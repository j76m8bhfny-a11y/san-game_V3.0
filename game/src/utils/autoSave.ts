/**
 * 自动存档系统
 * 
 * 功能：
 * - 每周自动保存（回合结束时）
 * - 保留最近 N 个自动存档
 * - 支持从自动存档恢复
 * - 与手动存档槽位分离
 */

import { useGameStore } from '@/store/useGameStore';
import { isTauri, fileStorage } from './fileStorage';

// 配置
const CONFIG = {
  // 保留的自动存档数量
  MAX_AUTO_SAVES: 3,
  // 自动存档 key 前缀
  AUTO_SAVE_PREFIX: 'auto_save_slot_',
  // 最后一次自动存档时间戳 key
  LAST_AUTO_SAVE_KEY: 'last_auto_save_time',
};

export interface AutoSaveInfo {
  slot: number;
  timestamp: number;
  turn: number;
  gold: number;
  region: string;
  class: string;
}

/**
 * 获取自动存档列表
 */
export async function getAutoSaves(): Promise<AutoSaveInfo[]> {
  const saves: AutoSaveInfo[] = [];
  
  if (isTauri()) {
    // Tauri 环境：从文件列表筛选
    try {
      const allFiles = await fileStorage.list();
      for (const file of allFiles) {
        if (file.name.startsWith(CONFIG.AUTO_SAVE_PREFIX)) {
          const slot = parseInt(file.name.replace(CONFIG.AUTO_SAVE_PREFIX, '').split('_')[0], 10);
          saves.push({
            slot,
            timestamp: file.timestamp,
            turn: 0, // 需要从文件内容读取
            gold: 0,
            region: '',
            class: '',
          });
        }
      }
    } catch (e) {
      console.error('读取自动存档列表失败:', e);
    }
  } else {
    // 浏览器环境：从 localStorage 读取
    for (let i = 0; i < CONFIG.MAX_AUTO_SAVES; i++) {
      const key = `${CONFIG.AUTO_SAVE_PREFIX}${i}`;
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          saves.push({
            slot: i,
            timestamp: parsed.saveTime || parsed.timestamp || Date.now(),
            turn: parsed.vitality?.time?.currentTurn || 0,
            gold: parsed.vitality?.metrics?.gold || 0,
            region: parsed.currentRegion || '',
            class: parsed.vitality?.identity?.currentClass || '',
          });
        } catch (e) {
          console.error(`解析自动存档 ${i} 失败:`, e);
        }
      }
    }
  }
  
  // 按时间戳降序排列
  return saves.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * 执行自动保存
 * 在每周结算后调用
 */
export async function performAutoSave(): Promise<boolean> {
  try {
    const state = useGameStore.getState();
    
    // 构造存档数据
    const saveData = {
      saveVersion: '1.0',
      saveTime: Date.now(),
      timestamp: Date.now(),
      vitality: state.vitality,
      currentRegion: state.currentRegion,
      activeHousing: state.activeHousing,
      dmvQueue: state.dmvQueue,
      activeLease: state.activeLease,
      inventory: state.inventory,
      history: state.history,
      unlockedArchives: state.unlockedArchives,
      achievedEndings: state.achievedEndings,
      archiveUnlockDates: state.archiveUnlockDates,
      endingUnlockDates: state.endingUnlockDates,
      totalDeaths: state.totalDeaths,
      totalPlayTime: state.totalPlayTime,
      totalRuns: state.totalRuns,
      longestSurvival: state.longestSurvival,
      darkWebEchoes: state.darkWebEchoes,
      systemGaze: state.systemGaze,
      bank: state.bank,
      faith: state.faith,
      crypto: state.crypto,
      prison: state.prison,
      dietState: state.dietState,
      activeBuffs: state.activeBuffs,
      shopInventory: state.shopInventory,
      vehiclePurchaseRegion: state.vehiclePurchaseRegion,
    };
    
    // 获取现有自动存档列表
    const existingSaves = await getAutoSaves();
    
    // 确定新存档的槽位（轮换制）
    let targetSlot = 0;
    if (existingSaves.length >= CONFIG.MAX_AUTO_SAVES) {
      // 使用最旧的槽位
      targetSlot = existingSaves[existingSaves.length - 1].slot;
    } else {
      // 使用下一个空槽位
      const usedSlots = new Set(existingSaves.map(s => s.slot));
      for (let i = 0; i < CONFIG.MAX_AUTO_SAVES; i++) {
        if (!usedSlots.has(i)) {
          targetSlot = i;
          break;
        }
      }
    }
    
    // 保存
    if (isTauri()) {
      // Tauri 使用特殊槽位号（100+表示自动存档）
      const autoSaveSlot = 100 + targetSlot;
      await fileStorage.save(autoSaveSlot, saveData);
    } else {
      const key = `${CONFIG.AUTO_SAVE_PREFIX}${targetSlot}`;
      localStorage.setItem(key, JSON.stringify(saveData));
    }
    
    // 记录最后保存时间
    localStorage.setItem(CONFIG.LAST_AUTO_SAVE_KEY, Date.now().toString());
    
    console.log(`💾 自动存档完成 [槽位 ${targetSlot}] - 第 ${saveData.vitality.time.currentTurn} 周`);
    return true;
  } catch (error) {
    console.error('自动存档失败:', error);
    return false;
  }
}

/**
 * 从自动存档加载
 */
export async function loadAutoSave(slot: number): Promise<boolean> {
  try {
    let data: any = null;
    
    if (isTauri()) {
      const autoSaveSlot = 100 + slot;
      data = await fileStorage.load(autoSaveSlot);
    } else {
      const key = `${CONFIG.AUTO_SAVE_PREFIX}${slot}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        data = JSON.parse(stored);
      }
    }
    
    if (!data) {
      console.warn(`自动存档 ${slot} 不存在`);
      return false;
    }
    
    // 恢复状态到 store
    useGameStore.setState(data);
    
    console.log(`📂 已从自动存档 ${slot} 加载 - 第 ${data.vitality?.time?.currentTurn || '?'} 周`);
    return true;
  } catch (error) {
    console.error('加载自动存档失败:', error);
    return false;
  }
}

/**
 * 检查是否有自动存档
 */
export async function hasAutoSave(): Promise<boolean> {
  const saves = await getAutoSaves();
  return saves.length > 0;
}

/**
 * 删除所有自动存档
 */
export async function clearAllAutoSaves(): Promise<void> {
  try {
    if (isTauri()) {
      // Tauri：删除槽位 100-102
      for (let i = 0; i < CONFIG.MAX_AUTO_SAVES; i++) {
        await fileStorage.delete(100 + i).catch(() => {});
      }
    } else {
      // 浏览器：删除 localStorage
      for (let i = 0; i < CONFIG.MAX_AUTO_SAVES; i++) {
        localStorage.removeItem(`${CONFIG.AUTO_SAVE_PREFIX}${i}`);
      }
    }
    localStorage.removeItem(CONFIG.LAST_AUTO_SAVE_KEY);
    console.log('🗑️ 所有自动存档已清除');
  } catch (error) {
    console.error('清除自动存档失败:', error);
  }
}

/**
 * 获取最后一次自动存档时间
 */
export function getLastAutoSaveTime(): number | null {
  const time = localStorage.getItem(CONFIG.LAST_AUTO_SAVE_KEY);
  return time ? parseInt(time, 10) : null;
}

// 开发模式暴露到 window
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).autoSave = {
    getAutoSaves,
    performAutoSave,
    loadAutoSave,
    hasAutoSave,
    clearAllAutoSaves,
    getLastAutoSaveTime,
  };
}
