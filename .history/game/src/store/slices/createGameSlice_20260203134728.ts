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
    // ✅ 安全修复：如果游戏处于暂停（菜单打开）状态，禁止处理事件选项
    if (get().isMenuOpen) return;

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

    // 3. 路径修复: Gold
    if (option.effects.gold) {
      if (store.addLedgerRecord) {
        store.addLedgerRecord('MISC', option.effects.gold, `事件选项: ${option.label}`);
      } else {
        store.modifyStats({ gold: option.effects.gold });
      }
    }

    // 4. 路径修复: HP/SAN
    if (option.effects.hp || option.effects.san) {
      store.modifyStats({ 
        hp: option.effects.hp || 0, 
        san: option.effects.san || 0 
      });
    }

    // 5. 特殊处理: 监狱
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
    // ✅ 安全修复：暂停状态下禁止推进回合
    if (get().isMenuOpen) return;

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

    // 3. 深度应用 Vitality 更新
    set((prev: any) => ({
      ...prev,
      ...result.updates,
      vitality: result.updates.vitality ? {
        ...prev.vitality,
        ...result.updates.vitality,
        metrics: { ...prev.vitality.metrics, ...(result.updates.vitality.metrics || {}) },
        identity: { ...prev.vitality.identity, ...(result.updates.vitality.identity || {}) }
      } : prev.vitality
    }));

    // =================================================================
    // ☠️ 生存熔断机制 (Death Check)
    // =================================================================
    // 在状态更新后，立即检查是否存活。如果死了，不再显示周报。
    
    const freshState = get() as GameState; // 获取最新状态
    const { hp, san } = freshState.vitality.metrics;
    
    // A. 检查是否有子系统直接触发了 Ending (例如 BankSystem 触发的牢底坐穿)
    if (freshState.ending) {
        return; // 直接退出，App.tsx 会渲染 GameEnding
    }

    // B. 检查数值死亡 (HP/SAN 耗尽)
    // 注意：请确保 endingId 与你的 endings.json 或常量定义一致
    if (hp <= 0) {
        store.triggerEnding('ENDING_DEATH_HP'); // 假设: 因过劳/疾病死亡
        return; // ⛔️ 熔断：不显示周报
    }
    
    if (san <= 0) {
        store.triggerEnding('ENDING_DEATH_SAN'); // 假设: 因疯狂/自杀死亡
        return; // ⛔️ 熔断：不显示周报
    }

    // =================================================================

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
        set((s: any) => ({
            vitality: {
                ...s.vitality,
                time: { ...s.vitality.time, currentTurn: s.vitality.time.currentTurn + 1 }
            }
        }));
    }
  }
});