import { StateCreator } from 'zustand';
import { GameState, GameEvent, EventOption, WeeklyReport, Ending } from '@/types/schema';
import { resolveOption } from '@/logic/eventResolver';
import { runTurnSettlement } from '@/systems/SystemRegistry';
import { resolveEnding } from '@/logic/endings'; 
import endingsData from '@/assets/data/endings.json';
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';

// ✅ 引入配置文件
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

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
  
  // 全局重置
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

  selectOption: (option: EventOption) => {
    const state = get() as GameState; 
    const store = get() as any;      

    const { updates, logs } = resolveOption(state, option);

    // ✅ 修复：深合并 Vitality，防止抹除 time, identity 等数据
    if (Object.keys(updates).length > 0) {
      set((prev: any) => {
        const nextVitality = updates.vitality ? {
          ...prev.vitality,
          ...updates.vitality,
          // 特别保护：确保 metrics 和其他深层结构也是合并而非覆盖
          metrics: { ...prev.vitality.metrics, ...(updates.vitality.metrics || {}) },
          identity: { ...prev.vitality.identity, ...(updates.vitality.identity || {}) },
          time: { ...prev.vitality.time, ...(updates.vitality.time || {}) }, // 核心修复！
          flags: { ...prev.vitality.flags, ...(updates.vitality.flags || {}) }
        } : prev.vitality;

        return { 
          ...prev, 
          ...updates, 
          vitality: nextVitality 
        };
      });
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
    
    // 使用配置中的 maxTurns
    const maxTurns = ENDING_RULES.constraints.maxTurns;
    // ✅ Refactor: 从配置中读取数值钳制范围
    const { minStat, maxStat } = SYSTEM_RULES.caps;

    // 1. 回合上限检查 (结局判定)
    if (state.vitality.time.currentTurn >= maxTurns) {
        const endingId = resolveEnding(state, endingsData as unknown as Ending[]);
        store.triggerEnding(endingId);
        return; 
    }

    // 2. 运行核心系统的周结算
    const result = runTurnSettlement(state);

    // 3. Crypto 市场结算
    let cryptoLogs: string[] = [];
    let cryptoNotes: string[] = [];
    
    if (state.crypto && state.crypto.isAccountOpen) {
      const allNews = state.gameDataCache?.news || [];
      const cryptoResult = store.processWeeklyMarket(allNews); 
      cryptoLogs = cryptoResult.logs || [];
      cryptoNotes = cryptoResult.notes || [];
    }

    // 4. 深度应用 Vitality 更新 (含数值钳制)
    set((prev: any) => {
        const prevMetrics = prev.vitality.metrics;
        const updateMetrics = result.updates.vitality?.metrics || {};
        
        let rawSan = (updateMetrics.san !== undefined) ? updateMetrics.san : prevMetrics.san;
        let rawHp = (updateMetrics.hp !== undefined) ? updateMetrics.hp : prevMetrics.hp;

        // ✅ Refactor: 使用配置变量替换硬编码的 0 和 100
        const finalSan = Math.max(minStat, Math.min(maxStat, rawSan));
        const finalHp = Math.max(minStat, Math.min(maxStat, rawHp)); 

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

    // 5. 生存熔断机制 (Death Check)
    const freshState = get() as GameState;
    const { hp } = freshState.vitality.metrics;
    
    if (freshState.ending) return; 

    // ✅ Refactor: 如果有配置"死亡阈值"，也可以在这里替换 minStat
    if (hp <= minStat) {
        store.triggerEnding('ENDING_DEATH_HP'); 
        return; 
    }
    
    // 6. 存储报表并打开 UI
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
  // ✅ Refactor: 使用 JSON 数据驱动的全局重置
  // =================================================================
  restartGame: () => {
    const { achievedEndings, unlockedArchives } = get(); // 🔥 仅保留 Meta 数据
    
    set({
        // 1. Vitality 重置 (从 JSON 读取)
        vitality: {
            metrics: { ...INITIAL_STATE.vitality }, // 读取 hp, san, gold, creditScore 等
            identity: { 
                // 注意：这里类型可能需要根据 Schema 调整，确保 JSON 里的 string 能对应 enum
                currentClass: INITIAL_STATE.identity.defaultClass, 
                points: { ...INITIAL_STATE.identity.points } 
            },
            time: { 
                currentTurn: INITIAL_STATE.time.startTurn, 
                totalTurns: 1 
            },
            activeDiseases: [],
            ledger: { history: [] },
            flags: { 
                ...INITIAL_STATE.flags, // 读取 isHomeless, debtTurns 等
                hiddenTags: [] 
            },
            activeJobs: []
        },
        
        // 2. Systems 重置
        bank: { activeLoans: [], lifetimeInterestPaid: 0 },
        
        crypto: { 
            isAccountOpen: false, 
            btcPrice: INITIAL_STATE.crypto.startPrice, // 读取初始币价
            priceHistory: [INITIAL_STATE.crypto.startPrice], 
            positions: [], 
            weeklyNews: null 
        },
        
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
        unlockedArchives,
        achievedEndings
    });
  }
});