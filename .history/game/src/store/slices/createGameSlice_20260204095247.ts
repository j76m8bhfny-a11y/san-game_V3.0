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
  // ✅ 核心接口：UI 调用此方法处理选项点击
  resolveEventOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  closeEvent: () => void;
  // ✅ 核心接口：UI 调用此方法处理账单支付
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
      if (store.addTransaction) {
        const type = option.effects.gold > 0 ? 'INCOME' : 'MISC';
        store.addTransaction(type, option.effects.gold, `事件: ${option.label}`);
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
          option.effects.jail.reason || "事件触发",
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

  resolveBill: () => {
    // 可以在这里添加统计逻辑
    set({ activeBill: null });
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

    // 3. 深度应用 Vitality 更新 (含数值钳制)
    set((prev: any) => {
        const prevMetrics = prev.vitality.metrics;
        const updateMetrics = result.updates.vitality?.metrics || {};
        
        // 原始计算结果 (允许溢出，下一步进行钳制)
        let rawSan = (updateMetrics.san !== undefined) ? updateMetrics.san : prevMetrics.san;
        let rawHp = (updateMetrics.hp !== undefined) ? updateMetrics.hp : prevMetrics.hp;

        // 🛡️ 数值守门员 (Clamping)
        const finalSan = Math.max(0, Math.min(100, rawSan));
        const finalHp = Math.max(0, Math.min(100, rawHp)); 

        return {
            ...prev,
            ...result.updates,
            vitality: result.updates.vitality ? {
                ...prev.vitality,
                ...result.updates.vitality,
                metrics: { 
                    ...prev.vitality.metrics, 
                    ...updateMetrics,
                    san: finalSan, 
                    hp: finalHp
                },
                identity: { ...prev.vitality.identity, ...(result.updates.vitality.identity || {}) }
            } : prev.vitality
        };
    });

    // =================================================================
    // ☠️ 生存熔断机制 (Death Check)
    // =================================================================
    
    const freshState = get() as GameState;
    const { hp, san } = freshState.vitality.metrics;
    
    if (freshState.ending) return; // 已触发结局，阻断后续逻辑

    if (hp <= 0) {
        store.triggerEnding('ENDING_DEATH_HP'); // 触发死亡结局
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