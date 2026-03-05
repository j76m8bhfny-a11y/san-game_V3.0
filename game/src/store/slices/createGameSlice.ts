import { StateCreator } from 'zustand';
import { GameState, GameEvent, EventOption, WeeklyReport, Ending, FaithID, PlayerClass, RegionID, Bill, NewsItem } from '@/types/schema';

// 事件连锁深度限制（防止无限循环）
const MAX_EVENT_CHAIN = 3;
let eventChainDepth = 0;
import { resolveOption } from '@/logic/eventResolver';
import { getCurrentGazeEffects } from '@/logic/gazeEventSystem';
import { runTurnSettlement } from '@/systems/SystemRegistry';
import { resolveEnding } from '@/logic/endings';
import endingsData from '@/assets/data/endings.json';
import ENDING_RULES from '@/assets/data/rules/ending_rules.json';
import newsData from '@/assets/data/news.json';
import { processEventTurn } from '@/systems/core/EventSystem';

// ✅ 引入 UI 清理函数
import { clearAllNotificationTimers } from './createUISlice';

// ✅ 引入配置文件
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// ✅ 引入类型安全工具
import { StoreState } from '@/types/store';

// ✅ 引入全局定时器管理器
import { globalTimerManager } from '@/hooks/useGameTimer';

export interface GameSlice {
  // --- State ---
  isEventOpen: boolean;
  currentEvent: GameEvent | null;
  weeklyReport: WeeklyReport | null;
  activeBill: Bill | null;  // ✅ 修复：与 UISlice 和 schema.ts 保持一致
  currentCryptoNews: NewsItem | null;  // 🔴 新增：当前显示的加密新闻
  isPaused: boolean;  // 🔴 新增：游戏暂停状态

  // --- Actions ---
  triggerEvent: (event: GameEvent) => void;
  resolveEventOption: (optionId: 'A' | 'B' | 'C' | 'D') => { modifiers: string[] } | void;
  closeEvent: () => void;
  resolveBill: () => void;
  
  nextTurn: () => void;
  closeWeeklyReport: () => void;
  
  // 🔴 新增：加密新闻弹窗控制
  showCryptoNews: (news: NewsItem) => void;
  hideCryptoNews: () => void;
  maybeTriggerCryptoNews: () => void;
  scheduleCryptoNewsAfterEvent: () => void;  // 事件后延迟触发
  
  // 🔴 新增：游戏暂停控制
  pauseGame: () => void;
  resumeGame: () => void;
  
  // 全局重置
  restartGame: () => void;
  
  // ✅ 重构：提取的回合结算子方法
  checkTurnLimit: (state: GameState, store: StoreState) => boolean;
  runCoreSettlement: (state: GameState) => { updates: any; report: WeeklyReport; notes: string[] };
  processCryptoMarket: (state: GameState, store: StoreState) => { notes: string[] };
  applySettlementUpdates: (updates: any, report: WeeklyReport) => void;
  checkDeathCondition: (store: StoreState) => boolean;
  updatePlayerClass: (store: StoreState) => void;
  finalizeTurn: (state: GameState, store: StoreState, settlementNotes: string[], cryptoNotes: string[]) => void;
}

export const createGameSlice: StateCreator<StoreState, [], [], GameSlice> = (set, get) => ({
  isEventOpen: false,
  currentEvent: null,
  weeklyReport: null,
  activeBill: null,  // 初始状态
  currentCryptoNews: null,  // 🔴 初始状态
  isPaused: false,  // 🔴 新增：初始未暂停

  triggerEvent: (event) => {
    // 检查事件连锁深度，防止无限循环
    if (eventChainDepth >= MAX_EVENT_CHAIN) {
      console.warn(`[GameSlice] 事件连锁深度超过限制 (${MAX_EVENT_CHAIN})，停止触发新事件`);
      return;
    }
    eventChainDepth++;
    set({ isEventOpen: true, currentEvent: event, isPaused: true }); // 触发事件时暂停
  },
  
  // 🔴 新增：暂停游戏
  pauseGame: () => {
    set({ isPaused: true });
  },
  
  // 🔴 新增：恢复游戏
  resumeGame: () => {
    set({ isPaused: false });
  },

  resolveEventOption: (optionId) => {
    if (get().isMenuOpen) {
      const store = get() as StoreState;
      if (store.addNotification) {
        store.addNotification("请关闭菜单后再做选择", 'warning');
      }
      return { modifiers: [] };
    }

    const { currentEvent } = get();
    if (!currentEvent) return { modifiers: [] };

    const option = currentEvent.options[optionId];
    if (!option) return { modifiers: [] };

    // ✅ 内部 slice 调用使用 any，因为 selectOption 在当前 slice 定义中
    // 这是 Zustand 类型系统的已知限制
    return (get() as any).selectOption(option);
  },

  selectOption: (option: EventOption) => {
    const state = get() as GameState;
    const store = get() as StoreState;
    const modifiers: string[] = [];
    
    // ✅ 计算动态金钱效果（根据 scaling 模式）
    let actualGoldChange = option.effects.gold || 0;
    const scaling = option.effects.scaling;
    const currentClass = state.vitality.identity.currentClass;
    
    // 获取System Gaze效果
    const totalArchives = state.unlockedArchives?.length || 0;
    const { intensity, effects: gazeEffects } = getCurrentGazeEffects({ 
      unlockedArchives: state.unlockedArchives || [],
      vitality: state.vitality 
    } as any);
    
    if (intensity > 0) {
      modifiers.push(`系统凝视 ${Math.round(intensity * 100)}%`);
    }
    
    if (scaling && option.effects.gold) {
      const baseAmount = option.effects.gold;
      
      switch (scaling) {
        case 'LEVERAGE': {
          // 阶级杠杆：不同阶级获得不同倍数的收益/损失
          const leverageMap: Record<string, number> = {
            'HOMELESS': 0.15,
            'WORKER': 0.5,
            'MIDDLE': 1.0,
            'CAPITALIST': 2.0
          };
          const multiplier = leverageMap[currentClass] || 1;
          actualGoldChange = Math.floor(baseAmount * multiplier);
          modifiers.push(`${currentClass}杠杆 x${multiplier}`);
          break;
        }
        case 'INCOME': {
          // 收入比例：基于当前金钱的比例（用于大额损失）
          // baseAmount 是小数，如 -0.15 表示损失 15% 的当前金钱
          // 应用gaze效果：gig pay下限
          const effectiveRate = Math.max(gazeEffects.gigPayLowerBound / 30, Math.abs(baseAmount));
          actualGoldChange = Math.floor(state.vitality.metrics.gold * (baseAmount > 0 ? effectiveRate : -effectiveRate));
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
    
    // D选项惩罚减免 (通过检查option的特定属性来判断是否为D选项)
    const isDOption = option.effects?.points?.red && option.effects.points.red > 0;
    if (isDOption && totalArchives > 0) {
      const reduction = Math.min(0.67, 1 - 1 / (1 + totalArchives / 20));
      if (reduction > 0) {
        modifiers.push(`档案减免 ${Math.round(reduction * 100)}%`);
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
    
    // 🌟 D选项额外奖励：+3灵视（真相觉醒）
    if (isDOption) {
      if (!updates.vitality) updates.vitality = {};
      if (!updates.vitality.metrics) updates.vitality.metrics = {};
      const currentInsight = updates.vitality.metrics.insight || state.vitality.metrics.insight;
      updates.vitality.metrics.insight = currentInsight + 3;
      modifiers.push('真相觉醒 +3灵视');
    }

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
    
    // 返回修改器信息供UI显示
    return { modifiers };
  },

  closeEvent: () => {
    set({ isEventOpen: false, currentEvent: null, isPaused: false }); // 🔴 关闭事件时恢复游戏
    
    // 重置事件连锁深度
    eventChainDepth = 0;
    
    // 🔴 事件关闭后，随机延迟触发加密新闻（如果已开户）
    get().scheduleCryptoNewsAfterEvent();
  },
  
  // 🔴 新增：事件后随机延迟触发新闻
  scheduleCryptoNewsAfterEvent: () => {
    const { crypto } = get();
    
    // 只有开通账户的玩家才会收到推送
    if (!crypto.isAccountOpen) return;
    
    // ✅ 每回合必定触发，只是延迟随机（0.5-3秒）
    const delay = 500 + Math.random() * 2500;
    
    globalTimerManager.setTimeout(() => {
      const store = get();
      // 再次检查：确保玩家还开着账户，且当前没有正在显示的新闻
      if (store.crypto.isAccountOpen && !store.currentCryptoNews) {
        store.maybeTriggerCryptoNews();
      }
    }, delay);
  },

  // 🔴 调整点3: 加密新闻弹窗控制
  showCryptoNews: (news: NewsItem) => {
    set({ currentCryptoNews: news });
  },
  
  hideCryptoNews: () => {
    set({ currentCryptoNews: null });
  },
  
  maybeTriggerCryptoNews: () => {
    const { crypto } = get();
    
    // 只有开通比特币账户的才会收到推送
    if (!crypto.isAccountOpen) return;
    
    // 随机选择一条新闻
    const allNews = newsData as NewsItem[];
    const randomNews = allNews[Math.floor(Math.random() * allNews.length)];
    
    // 设置当前显示的新闻弹窗
    set({ currentCryptoNews: randomNews });
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

  // ============================================================
  // 回合推进主流程 (已重构为子方法)
  // ============================================================
  nextTurn: () => {
    if (get().isMenuOpen) return;
    if (get().isPaused) return; // 🔴 暂停状态下不执行回合
    if (get().prison?.inJail) return; // 监狱状态下不执行普通回合结算（由 serveTime 处理）

    const state = get() as GameState;
    const store = get() as StoreState;

    // ✅ 0. 回合开始时触发事件（在结算之前）
    const eventResult = processEventTurn(state);
    if (eventResult.updates.currentEvent) {
      // 如果有事件触发，更新状态并暂停结算
      set((prev) => ({
        currentEvent: eventResult.updates.currentEvent as GameEvent,
        isEventOpen: true,
        vitality: {
          ...prev.vitality,
          flags: {
            ...prev.vitality.flags,
            triggeredEvents: eventResult.updates.vitality?.flags?.triggeredEvents || 
              prev.vitality.flags.triggeredEvents
          }
        }
      }));
      
      // 添加事件日志
      eventResult.logs.forEach(log => store.addNotification?.(log, 'info'));
      
      // 事件触发后暂停，等待玩家处理
      return;
    }

    // 1. 回合上限检查
    if (get().checkTurnLimit(state, store)) return;

    // 2. 运行核心系统结算
    const settlementResult = get().runCoreSettlement(state);

    // 3. 处理加密市场
    const cryptoResult = get().processCryptoMarket(state, store);

    // 4. 应用结算更新
    get().applySettlementUpdates(settlementResult.updates, settlementResult.report);

    // 5. 检查死亡条件
    if (get().checkDeathCondition(store)) return;

    // 6. 更新玩家阶级
    get().updatePlayerClass(store);

    // 7. 完成回合
    get().finalizeTurn(state, store, settlementResult.notes, cryptoResult.notes);
  },

  // ------------------------------------------------------------
  // 子方法：回合上限检查
  // ------------------------------------------------------------
  checkTurnLimit: (state, store) => {
    const maxTurns = ENDING_RULES.constraints.maxTurns;
    if (state.vitality.time.currentTurn >= maxTurns) {
      // ✅ 传入全局档案总数，支持 ED-22 等跨局结局判定
      const globalTotalArchives = store.getTotalArchives ? store.getTotalArchives() : state.unlockedArchives.length;
      const endingId = resolveEnding(state, endingsData as unknown as Ending[], maxTurns, undefined, globalTotalArchives);
      store.triggerEnding(endingId);
      return true; // 表示已触发结局，终止回合
    }
    return false;
  },

  // ------------------------------------------------------------
  // 子方法：运行核心系统结算
  // ------------------------------------------------------------
  runCoreSettlement: (state) => {
    const result = runTurnSettlement(state);
    return {
      updates: result.updates,
      report: result.report,
      notes: result.notes || []
    };
  },

  // ------------------------------------------------------------
  // 子方法：处理加密市场
  // ------------------------------------------------------------
  processCryptoMarket: (state, store) => {
    const notes: string[] = [];
    
    if (state.crypto?.isAccountOpen) {
      let allNews = store.gameDataCache?.news;
      if (!allNews || allNews.length === 0) {
        console.warn('[Crypto] gameDataCache.news 为空，使用备用新闻数据');
        allNews = state.crypto.weeklyNews ? [state.crypto.weeklyNews] : [];
      }
      const result = store.processWeeklyMarket(allNews);
      notes.push(...(result.notes || []));
    }
    
    return { notes };
  },

  // ------------------------------------------------------------
  // 子方法：应用结算更新
  // ------------------------------------------------------------
  applySettlementUpdates: (updates, report) => {
    const { minStat, maxStat } = SYSTEM_RULES.caps;
    
    set((prev: any) => {
      const prevMetrics = prev.vitality.metrics;
      const updateMetrics = updates.vitality?.metrics || {};
      
      const rawInsight = updateMetrics.insight !== undefined ? updateMetrics.insight : prevMetrics.insight;
      const rawHp = updateMetrics.hp !== undefined ? updateMetrics.hp : prevMetrics.hp;

      return {
        ...prev,
        ...updates,
        vitality: updates.vitality ? {
          ...prev.vitality,
          ...updates.vitality,
          metrics: {
            ...prev.vitality.metrics,
            ...updateMetrics,
            insight: Math.max(minStat, Math.min(maxStat, rawInsight)),
            hp: Math.max(minStat, Math.min(maxStat, rawHp))
          },
          identity: { ...prev.vitality.identity, ...(updates.vitality.identity || {}) }
        } : prev.vitality,
        weeklyReport: report
      };
    });
  },

  // ------------------------------------------------------------
  // 子方法：检查死亡条件
  // ------------------------------------------------------------
  checkDeathCondition: (store) => {
    const state = get() as GameState;
    if (state.ending) return true;
    
    const { hp } = state.vitality.metrics;
    const { minStat } = SYSTEM_RULES.caps;
    
    if (hp <= minStat) {
      // ✅ 调用 resolveEnding 进行完整结局判定，支持条件匹配
      const maxTurns = ENDING_RULES.constraints.maxTurns;
      const endingId = resolveEnding(state, endingsData as unknown as Ending[], maxTurns, 'HP_DEPLETED');
      store.triggerEnding(endingId);
      return true;
    }
    return false;
  },

  // ------------------------------------------------------------
  // 子方法：更新玩家阶级
  // ------------------------------------------------------------
  updatePlayerClass: (store) => {
    if (store.recalculateClass) {
      store.recalculateClass();
    }
  },

  // ------------------------------------------------------------
  // 子方法：完成回合，发送通知
  // ------------------------------------------------------------
  finalizeTurn: (state, store, settlementNotes, cryptoNotes) => {
    const nextTurnNum = state.vitality.time.currentTurn + 1;
    store.addNotification(`进入第 ${nextTurnNum} 周`, 'info');
    
    [...settlementNotes, ...cryptoNotes].forEach((n: string) => {
      store.addNotification(n, 'warning');
    });
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
    // 注意: tickFaithDebuffs 已在 FaithSystem.processTurn 中调用，无需重复
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
            metrics: { ...INITIAL_STATE.vitality }, // 读取 hp, insight, gold, creditScore 等
            identity: {
                // ✅ 类型断言：JSON 中的 string 需要转换为 PlayerClass enum
                currentClass: INITIAL_STATE.identity.defaultClass as PlayerClass,
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
            activeJobs: [],
            activeInsurances: [],
            activeBuffs: [],
            pendingMedicalBills: [],
            deductibleTrackers: [],
            medicalAppointments: []
        },
        
        // 2. Systems 重置
        bank: { activeLoans: [], lifetimeInterestPaid: 0 },
        
        crypto: { 
            isAccountOpen: false, 
            btcPrice: INITIAL_STATE.crypto.startPrice,
            priceHistory: Array(7).fill(INITIAL_STATE.crypto.startPrice), 
            positions: [], 
            weeklyNews: null,
            weeklyTradesCount: 0,  // 🔴 新增
            lastTradeTurn: -1      // 🔴 新增
        },
        
        faith: { 
            id: FaithID.NONE, 
            level: 1, 
            hasPerformedRite: false, 
            debuffs: [], 
            bannedFaiths: [],
            behaviorState: {
                lastAction: null,
                currentStreak: 0,
                hasReceivedInvitation: false
            }
        },
        prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 },
        
        // 3. Assets 重置
        // 注意: activeInsurances 已在 vitality 中重置，此处无需重复
        currentRegion: 'SLUMS' as RegionID,
        activeHousing: null,
        dmvQueue: null, // [NEW] 重置DMV排队
        activeLease: null, // [NEW] 重置租赁状态
        inventory: [],
        
        // 4. Game Loop 重置
        ending: null,
        isEventOpen: false,
        currentEvent: null,
        weeklyReport: null,
        currentCryptoNews: null,  // 🔴 重置加密新闻
        
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
        activeBill: null,
        
        // 7. 饮食系统重置
        dietState: {
            junkFoodPoints: 0,
            healthyPoints: 0,
            consecutiveJunkDays: 0,
            consecutiveHealthyDays: 0,
            sodiumIntake: 0,
            sugarIntake: 0,
            redMeatPoints: 0,
            noFreshFoodDays: 0
        },
        activeBuffs: [],
        shopInventory: {
          SLUMS: [],
          RUST_BELT: [],
          SUBURBS: [],
          DOWNTOWN: []
        } // 🏪 重置商店库存
    });
    
    // 🏪 重新初始化商店库存
    globalTimerManager.setTimeout(() => {
      const store = get() as any;
      if (store.refreshShopInventory) {
        store.refreshShopInventory();
      }
    }, 0);
  }
});