import { StateCreator } from 'zustand';
import { GameState, GameEvent, EventOption, WeeklyReport, Ending } from '@/types/schema';
import { resolveOption } from '@/logic/eventResolver';
import { runTurnSettlement } from '@/systems/SystemRegistry';
// ✅ 引入结局判定逻辑和数据
import { resolveEnding } from '@/logic/endings'; 
import endingsData from '@/assets/data/endings.json';

// 定义最大回合数 (1年 = 52周)
const MAX_TURNS = 52;

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
  
  // ✅ 新增: 全局重置 (修复僵尸存档)
  restartGame: () => void;
}

export const createGameSlice: StateCreator<any, [], [], GameSlice> = (set, get) => ({
  isEventOpen: false,
  currentEvent: null,
  weeklyReport: null,

  triggerEvent: (event) => {
    set({ isEventOpen: true, currentEvent: event });
  },

  resolveEventOption: (optionId) => {
    if (get().isMenuOpen) return;

    const { currentEvent } = get();
    if (!currentEvent) return;

    const option = currentEvent.options[optionId];
    if (!option) return;

    (get() as any).selectOption(option);
  },

  // 内部逻辑处理
  selectOption: (option: EventOption) => {
    const state = get() as GameState; 
    const store = get() as any;      

    const { updates, logs } = resolveOption(state, option);

    if (Object.keys(updates).length > 0) {
      set((prev: any) => ({ ...prev, ...updates }));
    }

    if (option.effects.gold) {
      if (store.addTransaction) {
        const type = option.effects.gold > 0 ? 'INCOME' : 'MISC';
        store.addTransaction(type, option.effects.gold, `事件: ${option.label}`);
      } else {
        store.modifyStats({ gold: option.effects.gold });
      }
    }

    if (option.effects.hp || option.effects.san) {
      store.modifyStats({ 
        hp: option.effects.hp || 0, 
        san: option.effects.san || 0 
      });
    }

    if (option.effects.jail) {
      if (store.imprison) {
        store.imprison(
          option.effects.jail.reason || "事件触发",
          option.effects.jail.turns,
          option.effects.jail.bail
        );
      }
    }

    logs.forEach((log: string) => store.addNotification(log, 'info'));
    set({ isEventOpen: false, currentEvent: null });
  },

  closeEvent: () => {
    set({ isEventOpen: false, currentEvent: null });
  },

  resolveBill: () => {
    set({ activeBill: null });
  },

  nextTurn: () => {
    if (get().isMenuOpen) return;

    const state = get() as GameState;
    const store = get() as any;

    // =================================================================
    // 🔴 修复 1: 回合上限检查 (Time Limit Check)
    // =================================================================
    if (state.vitality.time.currentTurn >= MAX_TURNS) {
        // 达到最大回合，触发结局判定
        // resolveEnding 会根据当前属性判断是“富豪结局”、“平民结局”还是“坏结局”
        const endingId = resolveEnding(state, endingsData as unknown as Ending[], MAX_TURNS);
        store.triggerEnding(endingId);
        return; // ⛔️ 阻断后续逻辑
    }

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
        
        let rawSan = (updateMetrics.san !== undefined) ? updateMetrics.san : prevMetrics.san;
        let rawHp = (updateMetrics.hp !== undefined) ? updateMetrics.hp : prevMetrics.hp;

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

    // 4. 生存熔断机制 (Death Check)
    const freshState = get() as GameState;
    const { hp } = freshState.vitality.metrics;
    
    if (freshState.ending) return; 

    if (hp <= 0) {
        store.triggerEnding('ENDING_DEATH_HP'); 
        return; 
    }
    
    // 5. 存储报表并打开 UI
    set({ weeklyReport: result.report });

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
  },

  // =================================================================
  // 🔴 修复 2: 全局重置 (Fix Zombie Bug)
  // =================================================================
  restartGame: () => {
    const { achievedEndings, unlockedArchives } = get(); // 🔥 仅保留 Meta 数据
    
    // 暴力重置所有 Slice 的状态到初始值
    // 注意：这里没有使用各个 Slice 的 reset 方法，因为难以协调
    // 直接覆盖是一个虽粗暴但最有效的“核弹级”修复
    set({
        // 1. Vitality 重置
        vitality: {
            metrics: { hp: 100, maxHp: 100, san: 100, maxSan: 100, gold: 0, creditScore: 500, hunger: 100, maxHunger: 100, addiction: 0, resistance: 0 },
            identity: { currentClass: 'HOMELESS', points: { red: 0, wolf: 0, old: 0 } }, // 稍后会被 initGame 覆盖
            time: { currentTurn: 1, totalTurns: 1 },
            activeDiseases: [],
            ledger: { history: [] },
            flags: { isHomeless: true, debtTurns: 0, hiddenTags: [] },
            activeJobs: []
        },
        // 2. Systems 重置
        bank: { activeLoans: [], lifetimeInterestPaid: 0 },
        crypto: { isAccountOpen: false, btcPrice: 15000, priceHistory: [15000], positions: [], weeklyNews: null },
        faith: { id: 'NONE', level: 1, hasPerformedRite: false },
        prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 },
        // 3. Assets 重置
        activeHousing: null,
        activeInsurance: null,
        activeJob: null, 
        inventory: [],
        // 4. Game Loop 重置
        ending: null,
        isEventOpen: false,
        currentEvent: null,
        weeklyReport: null,
        
        // 5. 恢复 Meta 数据
        achievedEndings,
        unlockedArchives
    });

    // 提示：UI 层 (App.tsx) 应该在检测到 ending === null 且 turn === 1 时
    // 自动弹出 ClassSelectorModal，让玩家重新选择职业，从而触发 initGame。
  }
});