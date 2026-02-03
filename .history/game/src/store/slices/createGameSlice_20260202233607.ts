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

    // 1. 运行核心系统的周结算 (房租、工资、银行)
    // 注意：runTurnSettlement 现在会自动计算 transaction 带来的金钱变动
    const result = runTurnSettlement(state);

    // 2. ✨ 运行 Crypto 市场结算
    // 我们必须在这里手动调用 crypto slice 的方法，因为它不是 standard system
    let cryptoLogs: string[] = [];
    let cryptoNotes: string[] = [];
    
    if (state.crypto && state.crypto.isAccountOpen) {
      // 获取当前新闻库
      const allNews = state.gameDataCache?.news || [];
      // 调用 Crypto Slice 的方法
      const cryptoResult = store.processWeeklyMarket(allNews); 
      cryptoLogs = cryptoResult.logs;
      cryptoNotes = cryptoResult.notes;
    }

    // 3. 应用所有状态更新
    set((prev: any) => ({ ...prev, ...result.updates }));

    // 4. 存储报表并打开 UI
    set({ weeklyReport: result.report });

    // 5. 合并并播放通知
    const allLogs = [...result.logs, ...cryptoLogs];
    const allNotes = [...result.notes, ...cryptoNotes];

    if (allLogs.length > 0) {
      // 延迟一点播放，避免和点击音效重叠
      setTimeout(() => {
          store.addNotification(`第 ${state.vitality.time.currentTurn} 周结算完成`, 'info');
      }, 100);
    }
    
    // 重要的警告通知
    allNotes.forEach((n: string) => store.addNotification(n, 'warning'));
  },

  closeWeeklyReport: () => {
    const store = get() as any;
    set({ weeklyReport: null });
    store.clearWeeklyLedger(); 
    store.advanceTurn();
  }
});