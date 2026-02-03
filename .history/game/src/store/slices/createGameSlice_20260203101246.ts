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
  // ✅ 统一接口：UI 调用此方法处理选项点击
  resolveEventOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  closeEvent: () => void;
  
  // 推进回合 (触发周结算)
  nextTurn: () => void;
  
  // 关闭周报 (并在此时真正进入下一周)
  closeWeeklyReport: () => void;
}

export const createGameSlice: StateCreator<any, [], [], GameSlice> = (set, get) => ({
  isEventOpen: false,
  currentEvent: null,
  weeklyReport: null,

  triggerEvent: (event) => {
    set({ isEventOpen: true, currentEvent: event });
  },

  // ✅ 修复：实现 resolveEventOption 消除 MessageWindow 红线
  resolveEventOption: (optionId) => {
    const { currentEvent } = get();
    if (!currentEvent) return;

    const option = currentEvent.options[optionId];
    if (!option) return;

    // 调用内部的 selectOption 处理逻辑
    (get() as any).selectOption(option);
  },

  // 内部逻辑处理 (适配 V3.0 路径)
  selectOption: (option: EventOption) => {
    const state = get() as GameState; 
    const store = get() as any;      

    // 1. 计算选项结果 (如解锁档案、Flags 等)
    const { updates, logs } = resolveOption(state, option);

    // 2. 应用普通状态更新 (Inventory, Archives, Flags 等)
    if (Object.keys(updates).length > 0) {
      set((prev: any) => ({ ...prev, ...updates }));
    }

    // 3. ✅ 路径修复: Gold (通过 Vitality Slice 的记账系统)
    if (option.effects.gold) {
      // 假设你的 VitalitySlice 有 addLedgerRecord 或类似的财务 Action
      if (store.addLedgerRecord) {
        store.addLedgerRecord('MISC', option.effects.gold, `事件选项: ${option.label}`);
      } else {
        // 兜底：直接修改数值
        store.modifyStats({ gold: option.effects.gold });
      }
    }

    // 4. ✅ 路径修复: HP/SAN (通过 modifyStats 确保路径对齐)
    if (option.effects.hp || option.effects.san) {
      store.modifyStats({ 
        hp: option.effects.hp || 0, 
        san: option.effects.san || 0 
      });
    }

    // 5. 特殊处理: 监狱 (对齐 PrisonSlice)
    if (option.effects.jail) {
      if (store.imprison) {
        store.imprison(
          option.effects.jail.reason,
          option.effects.jail.turns,
          option.effects.jail.bail
        );
      }
    }

    // 6. UI 反馈
    logs.forEach((log: string) => store.addNotification(log, 'info'));

    // 7. 关闭事件
    set({ isEventOpen: false, currentEvent: null });
  },

  closeEvent: () => {
    set({ isEventOpen: false, currentEvent: null });
  },

  nextTurn: () => {
    const state = get() as GameState;
    const store = get() as any;

    // 1. 运行核心系统的周结算
    const result = runTurnSettlement(state);

    // 2. Crypto 市场结算
    let cryptoLogs: string[] = [];
    let cryptoNotes: string[] = [];
    
    if (state.crypto && state.crypto.isAccountOpen) {
      const allNews = state.gameDataCache?.news || [];
      const cryptoResult = store.processWeeklyMarket(allNews); 
      cryptoLogs = cryptoResult.logs || [];
      cryptoNotes = cryptoResult.notes || [];
    }

    // 3. ✅ 深度应用 Vitality 更新
    // 使用 merge 逻辑防止覆盖 metrics 下的其他属性
    set((prev: any) => ({
      ...prev,
      ...result.updates,
      // 如果 result.updates 里包含 vitality，确保它是深合并的
      vitality: result.updates.vitality ? {
        ...prev.vitality,
        ...result.updates.vitality,
        metrics: { ...prev.vitality.metrics, ...(result.updates.vitality.metrics || {}) },
        identity: { ...prev.vitality.identity, ...(result.updates.vitality.identity || {}) }
      } : prev.vitality
    }));

    // 4. 存储报表并打开 UI
    set({ weeklyReport: result.report });

    // 5. 合并并播放通知
    const turn = state.vitality.time.currentTurn;
    store.addNotification(`第 ${turn} 周结算完成`, 'info');
    
    [...result.notes, ...cryptoNotes].forEach((n: string) => store.addNotification(n, 'warning'));
  },

  closeWeeklyReport: () => {
    const store = get() as any;
    set({ weeklyReport: null });
    
    // 清理本周账本缓存并推进回合
    if (store.clearWeeklyLedger) store.clearWeeklyLedger(); 
    if (store.advanceTurn) {
        store.advanceTurn();
    } else {
        // 兜底：手动增加回合数
        set((s: any) => ({
            vitality: {
                ...s.vitality,
                time: { ...s.vitality.time, currentTurn: s.vitality.time.currentTurn + 1 }
            }
        }));
    }
  }
});