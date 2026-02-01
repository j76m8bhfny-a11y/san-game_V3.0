import { StateCreator } from 'zustand';
import { GameState, GameEvent, EventOption, WeeklyReport } from '@/types/schema';
import { resolveOption } from '@/logic/eventResolver';
import { runTurnSettlement } from '@/systems/SystemRegistry';

export interface GameSlice {
  // --- State ---
  isEventOpen: boolean;
  currentEvent: GameEvent | null;
  weeklyReport: WeeklyReport | null; // 存储周结报表数据

  // --- Actions ---
  triggerEvent: (event: GameEvent) => void;
  selectOption: (option: EventOption) => void;
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

  selectOption: (option) => {
    const state = get() as GameState; // 用于读取数据
    const store = get() as any;       // 用于调用 Action (addTransaction 等)

    // 1. 计算选项结果 (纯逻辑)
    const { updates, logs } = resolveOption(state, option);

    // 2. 应用普通状态更新 (Inventory, Archives, Flags 等)
    // 注意: 这里不直接更新 Gold/HP/SAN，由后续步骤通过 Action 处理以保证副作用正确
    if (Object.keys(updates).length > 0) {
      set((prev: any) => ({ ...prev, ...updates }));
    }

    // 3. 特殊处理: Gold (通过 addTransaction 记账)
    if (option.effects.gold) {
      store.addTransaction('MISC', option.effects.gold, `事件: ${option.label}`);
    }

    // 4. 特殊处理: HP/SAN (通过 modifyStats 确保边界检查)
    if (option.effects.hp || option.effects.san) {
      store.modifyStats({ 
        hp: option.effects.hp, 
        san: option.effects.san 
      });
    }

    // 5. 特殊处理: 监狱
    if (option.effects.jail) {
      // 检查 PrisonSlice 是否存在
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

    // 关闭事件窗口
    set({ isEventOpen: false, currentEvent: null });
  },

  closeEvent: () => {
    set({ isEventOpen: false, currentEvent: null });
  },

  nextTurn: () => {
    const state = get() as GameState;
    const store = get() as any;

    // 1. 运行核心系统的周结算 (房租、工资、利息等自动计算)
    const result = runTurnSettlement(state);

    // 2. 应用系统产生的状态更新 (Vitality合并、Inventory变动等)
    set((prev: any) => ({ ...prev, ...result.updates }));

    // 3. 存储报表并打开 UI (此时 turn 还没变，或者刚变完用于展示)
    set({ weeklyReport: result.report });

    // 4. 播放系统日志
    if (result.logs.length > 0) {
      result.logs.forEach((l: string) => store.addNotification(l, 'info'));
    }
    if (result.notes.length > 0) {
      result.notes.forEach((n: string) => store.addNotification(n, 'warning'));
    }
  },

  closeWeeklyReport: () => {
    const store = get() as any;
    
    // 1. 关闭弹窗
    set({ weeklyReport: null });

    // 2. 核心生命周期: 清理旧账本 -> 正式进入下一周
    // 这些方法来自 createVitalitySlice
    store.clearWeeklyLedger(); 
    store.advanceTurn();
  }
});