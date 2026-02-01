import { StateCreator } from 'zustand';
import { GameEvent, Bill, RegionID, GameState, WeeklyReport, Item } from '@/types/schema';
import { checkMovePermission, checkClassUpdate } from '@/logic/core';
import { resolveOption } from '@/logic/eventResolver';
import { resolveEnding } from '@/logic/endings';
import { runTurnSettlement } from '../../systems/SystemRegistry';

export interface GameSlice {
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  weeklyReport: WeeklyReport | null; // ✅ 取代 dailySummary
  
  // Actions
  nextTurn: () => void;
  closeWeeklyReport: () => void; // ✅ 关闭周报并推进时间
  
  chooseOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  buyItem: (itemId: string) => void;
  attemptMove: (targetRegion: RegionID) => void;
  
  resolveBill: () => void;
  resetGame: () => void;
}

export const createGameSlice: StateCreator<any, [], [], GameSlice> = (set, get) => ({
  currentEvent: null,
  activeBill: null,
  weeklyReport: null,

  resolveBill: () => set({ activeBill: null }),

  // ✅ 结算流程第一步：计算本周结果，展示弹窗
  nextTurn: () => {
    const state = get() as GameState;
    const { gameDataCache, vitality } = state;
    if (!gameDataCache) return;

    // 1. 执行周结算系统 (Housing, Bank 等)
    // 这会生成自动账单(如房租)并返回合并后的状态更新
    const sysResult = runTurnSettlement(state);
    
    // 2. 准备新的状态预览 (用于检查结局和阶级)
    // 注意：这里只是为了计算，尚未应用到 store
    const nextMetrics = {
      ...vitality.metrics,
      ...(sysResult.updates.vitality?.metrics || {})
    };
    const nextGold = nextMetrics.gold; // 包含本周所有收支后的预计金钱

    // 3. 阶级检查 (基于预计金钱)
    let newClass = vitality.identity.currentClass;
    if (gameDataCache.classes) {
       const updatedClass = checkClassUpdate(nextGold, gameDataCache.classes);
       if (updatedClass !== newClass) {
          newClass = updatedClass;
          sysResult.logs.push(`阶级变更: ${newClass}`);
          // 可以在这里插入 update
          if (!sysResult.updates.vitality) sysResult.updates.vitality = {};
          if (!sysResult.updates.vitality.identity) sysResult.updates.vitality.identity = { ...vitality.identity };
          sysResult.updates.vitality.identity.currentClass = newClass;
       }
    }

    // 4. 死亡/结局检查
    // A. 死亡
    if (nextMetrics.hp <= 0) {
       const deathEnding = resolveEnding({ ...state, vitality: { ...vitality, metrics: nextMetrics } }, gameDataCache.endings || [], 999, 'HP');
       state.triggerEnding(deathEnding || 'ED-DEATH-GENERIC');
       return;
    }
    // B. 时间耗尽
    if (vitality.time.currentTurn >= vitality.time.totalTurns) {
       state.triggerEnding('ED-TIME-OUT');
       return;
    }

    // 5. 应用更新并显示周报
    set((prev: GameState) => ({
      // 合并 SystemRegistry 返回的深度更新
      ...prev,
      ...sysResult.updates,
      vitality: {
         ...prev.vitality,
         ...sysResult.updates.vitality,
         metrics: { ...prev.vitality.metrics, ...(sysResult.updates.vitality?.metrics || {}) },
         identity: { ...prev.vitality.identity, ...(sysResult.updates.vitality?.identity || {}) },
         flags: { ...prev.vitality.flags, ...(sysResult.updates.vitality?.flags || {}) },
         // Ledger 的合并已经在 Registry 里处理好了，这里主要是为了触发 UI 更新
      },
      weeklyReport: sysResult.report, // ✅ 弹窗显示数据
      history: [...prev.history, ...sysResult.logs.map(l => `Week ${prev.vitality.time.currentTurn}: ${l}`)]
    }));
  },

  // ✅ 结算流程第二步：用户关闭弹窗，正式进入下一周
  closeWeeklyReport: () => {
    const state = get();
    set({ weeklyReport: null });
    state.clearWeeklyLedger(); // 清空本周流水
    state.advanceTurn();       // 回合数 +1
  },

  resetGame: () => {
    const state = get();
    if (state.resetPlayerState) state.resetPlayerState(); // 调用 Vitality 的重置
    // 如果有其他 Slice 的重置逻辑也要调用
    set({
      currentEvent: null,
      activeBill: null,
      weeklyReport: null,
      history: []
    });
  },

  attemptMove: (targetRegion) => {
    const state = get() as GameState;
    if (state.currentRegion === targetRegion) return;
    const { gameDataCache, vitality } = state;
    if (!gameDataCache) return;

    // 适配 Vitality 结构
    const check = checkMovePermission(
      targetRegion, 
      vitality.identity.currentClass, 
      state.inventory, 
      gameDataCache.itemMap
    );

    if (check.allowed) {
      state.setRegion(targetRegion);
      state.addNotification(`进入区域: ${targetRegion}`, 'success');
    } else {
      state.addNotification(check.reason || '无法进入该区域', 'error');
    }
  },

  chooseOption: (optionId) => {
    const state = get() as GameState;
    if (!state.currentEvent) return;

    // 1. 计算结果 (resolveOption 已适配 Deep Updates)
    const result = resolveOption(state, optionId, state.currentEvent.options[optionId]);

    // 2. 结局触发
    if (result.endingId) {
      state.triggerEnding(result.endingId);
      return;
    }

    // 3. 应用更新 (这里处理 Deep Merge)
    set((prev: GameState) => {
      const updates = result.updates as any;
      const newVitality = updates.vitality ? {
        ...prev.vitality,
        ...updates.vitality,
        metrics: { ...prev.vitality.metrics, ...(updates.vitality.metrics || {}) },
        identity: { ...prev.vitality.identity, ...(updates.vitality.identity || {}) },
        flags: { ...prev.vitality.flags, ...(updates.vitality.flags || {}) }
      } : prev.vitality;

      return {
        ...prev,
        ...updates,
        vitality: newVitality,
        currentEvent: null, // 选项选完，事件结束
        history: [...prev.history, ...result.logs]
      };
    });
  },

  buyItem: (itemId) => {
    const state = get() as GameState;
    const { gameDataCache, vitality } = state;
    const item = gameDataCache?.items?.find((i: Item) => i.id === itemId);

    if (!item) return;

    if (vitality.metrics.gold >= item.price) {
      // ✅ 核心修改：走账本系统
      state.addTransaction('MISC', -item.price, `购买: ${item.name}`);
      
      // 添加物品到背包
      set((prev: GameState) => ({
        inventory: [...prev.inventory, item.id]
      }));
      
      // 应用物品效果 (立即使用类型)
      if (item.effects) {
        state.modifyStats(item.effects);
      }
      
      state.addNotification(`购买了 ${item.name}`, 'success');
    } else {
      state.addNotification('资金不足', 'error');
    }
  }
});