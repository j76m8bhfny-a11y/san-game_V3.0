import { StateCreator } from 'zustand';
import { GameState, GameEvent, EventOption, WeeklyReport, Ending, FaithID, PlayerClass } from '@/types/schema';
import { resolveOption } from '@/logic/eventResolver';
import { runTurnSettlement } from '@/systems/SystemRegistry';
import { resolveEnding } from '@/logic/endings';
import endingsData from '@/assets/data/endings.json';
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';

// ✅ 引入 UI 清理函数
import { clearAllNotificationTimers } from './createUISlice';

// ✅ 引入配置文件
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// ✅ 引入类型安全工具
import { SetState, StoreState } from '@/types/store';

export interface GameSlice {
  // --- State ---
  isEventOpen: boolean;
  currentEvent: GameEvent | null;
  weeklyReport: WeeklyReport | null;
  activeBill: any | null;  // 与 UISlice 中的 activeBill 保持同步

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

export const createGameSlice: StateCreator<StoreState, [], [], GameSlice> = (set, get) => ({
  isEventOpen: false,
  currentEvent: null,
  weeklyReport: null,
  activeBill: null,  // 初始状态

  triggerEvent: (event) => {
    set({ isEventOpen: true, currentEvent: event });
  },

  resolveEventOption: (optionId) => {
    if (get().isMenuOpen) {
      const store = get() as StoreState;
      if (store.addNotification) {
        store.addNotification("请关闭菜单后再做选择", 'warning');
      }
      return;
    }

    const { currentEvent } = get();
    if (!currentEvent) return;

    const option = currentEvent.options[optionId];
    if (!option) return;

    (get() as GameSlice & StoreState).selectOption(option);
  },

  selectOption: (option: EventOption) => {
    const state = get() as GameState;
    const store = get() as StoreState;
    
    // ✅ 计算动态金钱效果（根据 scaling 模式）
    let actualGoldChange = option.effects.gold || 0;
    const scaling = option.effects.scaling;
    const currentClass = state.vitality.identity.currentClass;
    
    if (scaling && option.effects.gold) {
      const baseAmount = option.effects.gold;
      
      switch (scaling) {
        case 'LEVERAGE': {
          // 阶级杠杆：不同阶级获得不同倍数的收益/损失
          const leverageMap: Record<string, number> = {
            'HOMELESS': 1,
            'WORKER': 1.5,
            'MIDDLE': 2,
            'CAPITALIST': 3
          };
          const multiplier = leverageMap[currentClass] || 1;
          actualGoldChange = Math.floor(baseAmount * multiplier);
          break;
        }
        case 'INCOME': {
          // 收入比例：基于当前金钱的比例（用于大额损失）
          // baseAmount 是小数，如 -0.2 表示损失 20% 的当前金钱
          actualGoldChange = Math.floor(state.vitality.metrics.gold * baseAmount);
          break;
        }
        case 'FIXED':
        default: {
          // 固定值：直接使用配置的值
          actualGoldChange = baseAmount;
          break;
        }
      }
    }

    // ✅ 修复【问题1-A】：先扣钱，再执行效果（防止"免费回血"漏洞）
    // 1. 先处理金钱支出（如果是支出的话）
    if (actualGoldChange < 0) {
      if (store.addTransaction) {
        const txResult = store.addTransaction('MISC', actualGoldChange, `事件: ${option.label}`);
        if (!txResult.success) {
          store.addNotification("资金不足以执行此操作", 'error');
          return; // 钱不够，直接返回，不执行任何效果
        }
      } else {
        // 兜底：如果没有addTransaction，检查余额
        if (state.vitality.metrics.gold < Math.abs(actualGoldChange)) {
          store.addNotification("资金不足以执行此操作", 'error');
          return;
        }
        store.modifyStats({ gold: actualGoldChange });
      }
    }

    // 2. 计算并应用其他效果（HP/SAN/物品等）
    const { updates, logs } = resolveOption(state, option);

    // ✅ 修复：深合并 Vitality，防止抹除 time, identity 等数据
    if (Object.keys(updates).length > 0) {
      set((prev: StoreState) => {
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

    // 3. 处理金钱收入（收入不需要检查余额）
    if (actualGoldChange > 0) {
      if (store.addTransaction) {
        store.addTransaction('INCOME', actualGoldChange, `事件: ${option.label}`);
      } else {
        store.modifyStats({ gold: actualGoldChange });
      }
    }
    // 5. 监狱逻辑处理
    if (option.effects.jail) {
      if (store.imprison) {
        store.imprison(
          option.effects.jail.reason || "事件触发",
          option.effects.jail.turns,
          option.effects.jail.bail
        );
      }
    }
    // 6. 触发吐槽并保持事件状态
    if (option.roast && store.setRoast) {
      // 如果有吐槽，只关闭“手机选项”，不销毁“当前事件”
      store.setRoast(option.roast); 
      set({ isEventOpen: false }); 
      // 注意：这里不要写 currentEvent: null！
    } else {
      // 如果没有吐槽，直接彻底关掉
      set({ isEventOpen: false, currentEvent: null });
    }

    // 7. 打印普通日志
    logs.forEach((log: string) => store.addNotification(log, 'info'));
  },

  closeEvent: () => {
    set({ isEventOpen: false, currentEvent: null });
  },

  resolveBill: () => {
    const store = get() as StoreState;
    // ✅ 调用 UISlice 的 closeBill 来统一管理 activeBill 状态
    if (store.closeBill) {
      store.closeBill();
    } else {
      set({ activeBill: null });
    }
  },

  nextTurn: () => {
    if (get().isMenuOpen) return;
    
    // 监狱状态下不执行普通回合结算，由 serveTime 处理
    if (get().prison?.inJail) return;

    const state = get() as GameState;
    const store = get() as StoreState;
    
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
    let cryptoNotes: string[] = [];
    
    if (state.crypto && state.crypto.isAccountOpen) {
      // 防御性处理：如果 gameDataCache 未加载，使用 crypto 中缓存的上周新闻
      let allNews = state.gameDataCache?.news;
      if (!allNews || allNews.length === 0) {
        console.warn('[Crypto] gameDataCache.news 为空，使用备用新闻数据');
        // 使用 crypto 中已经缓存的 weeklyNews 作为兜底
        allNews = state.crypto.weeklyNews ? [state.crypto.weeklyNews] : [];
      }
      const cryptoResult = store.processWeeklyMarket(allNews);
      // crypto 日志通过 processWeeklyMarket 内部的通知系统展示
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
    const { hp, san } = freshState.vitality.metrics;
    
    if (freshState.ending) return; 

    // 检查 HP 死亡条件
    if (hp <= minStat) {
        store.triggerEnding('ENDING_DEATH_HP'); 
        return; 
    }
    
    // 检查 SAN 死亡条件（疯狂/精神崩溃）
    if (san <= minStat) {
        store.triggerEnding('ENDING_DEATH_SAN'); 
        return; 
    }
    
    // 6. 阶级判定 (回合结算后)
    if (store.recalculateClass) {
      store.recalculateClass();
    }
    
    // 7. 存储报表并打开 UI
    set({ weeklyReport: result.report });

    const nextTurnNum = state.vitality.time.currentTurn + 1;
    store.addNotification(`进入第 ${nextTurnNum} 周`, 'info');
    
    [...result.notes, ...cryptoNotes].forEach((n: string) => store.addNotification(n, 'warning'));
  },

  closeWeeklyReport: () => {
    const store = get() as any;
    
    // ✅ 调整顺序：先推进回合，再清空账本，避免数据丢失
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
    
    // 推进回合后再清空 UI 状态和账本
    set({ weeklyReport: null });
    if (store.clearWeeklyLedger) store.clearWeeklyLedger();
    if (store.tickFaithDebuffs) store.tickFaithDebuffs();
  },

  // =================================================================
  // ✅ Refactor: 使用 JSON 数据驱动的全局重置
  // =================================================================
  restartGame: () => {
    const { achievedEndings, unlockedArchives } = get(); // 🔥 仅保留 Meta 数据
    
    // ✅ 清理所有待处理的通知定时器（防止内存泄漏）
    clearAllNotificationTimers();
    
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
                hiddenTags: [],
                triggeredEvents: [] // ✅ 重置已触发事件列表（新游戏可重新触发所有事件）
            },
            activeJobs: []
        },
        
        // 2. Systems 重置
        bank: { activeLoans: [], lifetimeInterestPaid: 0 },
        
        crypto: { 
            isAccountOpen: false, 
            btcPrice: INITIAL_STATE.crypto.startPrice,
            priceHistory: Array(7).fill(INITIAL_STATE.crypto.startPrice), 
            positions: [], 
            weeklyNews: null 
        },
        
        faith: { id: FaithID.NONE, level: 1, hasPerformedRite: false, debuffs: [], bannedFaiths: [] },
        prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 },
        
        // 3. Assets 重置
        currentRegion: 'SLUMS',
        activeHousing: null,
        activeInsurance: null,
        inventory: [],
        
        // 4. Game Loop 重置
        ending: null,
        isEventOpen: false,
        currentEvent: null,
        weeklyReport: null,
        
        // 5. 恢复 Meta 数据
        unlockedArchives,
        achievedEndings,
        
        // 6. 重置所有 UI 状态
        isShopOpen: false,
        isInventoryOpen: false,
        isArchiveOpen: false,
        isMenuOpen: false,
        isJobBoardOpen: false,
        isHousingOpen: false,
        isHospitalOpen: false,
        isCryptoOpen: false,
        isFaithOpen: false,
        isBankOpen: false,
        currentRoast: null,
        notifications: [],
        viewingArchive: null,
        activeBill: null
    });
  }
});