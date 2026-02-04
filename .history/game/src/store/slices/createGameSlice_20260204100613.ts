import { StateCreator } from 'zustand';
import { GameState, GameEvent, EventOption, WeeklyReport } from '@/types/schema';
import { resolveOption } from '@/logic/eventResolver';
import { runTurnSettlement } from '@/systems/SystemRegistry';

export interface GameSlice {
  // --- State ---
  isEventOpen: boolean;
  currentEvent: GameEvent | null;
  weeklyReport: WeeklyReport | null;

  // --- Actions ---
  triggerEvent: (event: GameEvent) => void;
  resolveEventOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  closeEvent: () => void;
  resolveBill: () => void;
  nextTurn: () => void;
  closeWeeklyReport: () => void;
}

export const createGameSlice: StateCreator<any, [], [], GameSlice> = (set, get) => ({
  isEventOpen: false,
  currentEvent: null,
  weeklyReport: null,

  triggerEvent: (event) => {
    set({ isEventOpen: true, currentEvent: event });
  },

  resolveEventOption: (optionId) => {
    // 安全检查
    if (get().isMenuOpen) return;

    const { currentEvent } = get();
    if (!currentEvent) return;

    // ✅ 修复 1: 索引映射 (A->0, B->1...)
    const indexMap: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    const index = indexMap[optionId];
    const option = currentEvent.options[index];

    if (!option) {
        console.error("Option not found:", optionId, index);
        return;
    }

    (get() as any).selectOption(option);
  },

  // 内部逻辑处理
  selectOption: (option: EventOption) => {
    const state = get() as GameState; 
    const store = get() as any;      

    // 1. 计算逻辑结果
    const { updates, logs } = resolveOption(state, option);

    // 2. ✅ 修复 2: 深度合并状态 (防止 Vitality 被覆盖)
    set((prev: any) => {
        let nextVitality = prev.vitality;
        
        // 如果有 Vitality 更新，手动深度合并
        if (updates.vitality) {
             nextVitality = {
                 ...prev.vitality,
                 ...updates.vitality,
                 // 保护 metrics 和 identity 不被部分对象覆盖
                 metrics: { ...prev.vitality.metrics, ...(updates.vitality.metrics || {}) },
                 identity: { ...prev.vitality.identity, ...(updates.vitality.identity || {}) },
             };
        }
        
        // 剥离 vitality，避免浅层覆盖
        const { vitality: _v, ...otherUpdates } = updates;
        
        return {
            ...prev,
            ...otherUpdates, // Inventory, Archives 等根属性可以直接覆盖
            vitality: nextVitality
        };
    });

    // 3. 处理金钱 (Transaction)
    if (option.effects.gold) {
      if (store.addTransaction) {
        const type = option.effects.gold > 0 ? 'INCOME' : 'MISC';
        store.addTransaction(type, option.effects.gold, `事件: ${option.label}`);
      }
    }

    // 4. 处理 HP/SAN (ModifyStats)
    if (option.effects.hp || option.effects.san) {
      store.modifyStats({ 
        hp: option.effects.hp || 0, 
        san: option.effects.san || 0 
      });
    }

    // 5. 处理监狱
    if (option.effects.jail && store.imprison) {
      store.imprison(
        option.effects.jail.reason || "事件触发",
        option.effects.jail.turns,
        option.effects.jail.bail
      );
    }

    // 6. UI 反馈
    if (logs && logs.length > 0) {
        logs.forEach((log: string) => store.addNotification(log, 'info'));
    }

    // 7. 关闭事件
    set({ isEventOpen: false, currentEvent: null });
  },

  closeEvent: () => {
    set({ isEventOpen: false, currentEvent: null });
  },

  resolveBill: () => {
    // 强制清理 activeBill (防止 UI 卡死)
    set({ activeBill: null });
  },

  nextTurn: () => {
    if (get().isMenuOpen) return;

    const state = get() as GameState;
    const store = get() as any;

    // 1. 系统结算
    const result = runTurnSettlement(state);

    // 2. Crypto 结算
    let cryptoLogs: string[] = [];
    let cryptoNotes: string[] = [];
    if (state.crypto && state.crypto.isAccountOpen) {
      const allNews = state.gameDataCache?.news || [];
      const cryptoResult = store.processWeeklyMarket(allNews); 
      cryptoLogs = cryptoResult.logs || [];
      cryptoNotes = cryptoResult.notes || [];
    }

    // 3. 应用周结更新 (SystemRegistry 返回的已经处理过 safeUpdates)
    set((prev: any) => {
        // 合并 SystemRegistry 的结果
        const mergedState = { ...prev, ...result.updates };
        
        // 如果有 vitality 更新，确保数值在范围内 (Clamping)
        if (result.updates.vitality && result.updates.vitality.metrics) {
            const m = mergedState.vitality.metrics;
            m.hp = Math.max(0, Math.min(m.maxHp, m.hp));
            m.san = Math.max(0, Math.min(m.maxSan, m.san));
        }
        
        return mergedState;
    });

    // =================================================================
    // ☠️ 死亡检查
    // =================================================================
    const freshState = get() as GameState;
    if (freshState.ending) return;

    if (freshState.vitality.metrics.hp <= 0) {
        store.triggerEnding('ENDING_DEATH_HP');
        return;
    }

    // 4. 显示周报
    set({ weeklyReport: result.report });

    // 5. 通知
    const turn = state.vitality.time.currentTurn;
    store.addNotification(`第 ${turn} 周结算完成`, 'info');
    [...result.notes, ...cryptoNotes].forEach((n: string) => store.addNotification(n, 'warning'));
  },

  closeWeeklyReport: () => {
    const store = get() as any;
    set({ weeklyReport: null });
    
    if (store.clearWeeklyLedger) store.clearWeeklyLedger(); 
    if (store.advanceTurn) {
        store.advanceTurn();
    } else {
        // Fallback
        set((s: any) => ({
            vitality: {
                ...s.vitality,
                time: { ...s.vitality.time, currentTurn: s.vitality.time.currentTurn + 1 }
            }
        }));
    }
  }
});