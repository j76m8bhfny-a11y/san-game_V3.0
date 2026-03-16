/**
 * 游戏状态模拟器
 * 提供状态快照管理和游戏模拟功能
 */

import type { 
  GameStateSnapshot, 
  GameResult, 
  AIDecision, 
  SimulatorConfig 
} from './types';
import type { AIStrategy } from './types';
import type { StoreState } from '@/store/useGameStore';

// ==========================================
// 状态快照工具
// ==========================================

/** 从真实store创建快照 */
export function createSnapshotFromStore(store: StoreState): GameStateSnapshot {
  return {
    vitality: store.vitality,
    bank: store.bank,
    faith: store.faith,
    crypto: store.crypto,
    prison: store.prison,
    currentTurn: store.vitality.time.currentTurn,
    currentRegion: store.currentRegion,
    ending: (store as any).ending || null,
    unlockedArchives: store.unlockedArchives || [],
    achievedEndings: store.achievedEndings || [],
    totalDeaths: store.totalDeaths || 0,
    isEventOpen: (store as any).isEventOpen || false,
    currentEvent: (store as any).currentEvent || null
  };
}

/** 将快照应用到store（用于恢复状态） */
export function applySnapshotToStore(
  store: StoreState, 
  snapshot: Partial<GameStateSnapshot>
): void {
  // 注意：这里只应用可变的部分
  // 实际实现中可能需要更复杂的合并逻辑
  if (snapshot.vitality) {
    Object.assign(store.vitality, snapshot.vitality);
  }
}

// ==========================================
// 核心模拟器 - 使用真实Store
// ==========================================

/**
 * 运行单局游戏模拟
 * 注意：此函数直接操作store，需要在隔离环境中运行
 */
export async function runGameSimulation(
  strategy: AIStrategy,
  config: SimulatorConfig
): Promise<GameResult> {
  // 动态导入以避免循环依赖
  const { useGameStore } = await import('@/store/useGameStore');
  const { analyzeDeath } = await import('@/logic/deathAnalysis');
  
  const store = useGameStore.getState();
  const decisions: AIDecision[] = [];
  
  try {
    // 重置游戏到初始状态
    store.restartGame();
    
    // 应用自定义初始状态（如果有）
    // ...
    
    let turn = 0;
    
    while (turn < config.maxTurns) {
      // 检查游戏是否结束
      const ending = (store as any).ending;
      if (ending) {
        return finalizeResult('ending', turn, decisions, store, analyzeDeath);
      }
      
      if (store.vitality.metrics.hp <= 0) {
        return finalizeResult('dead', turn, decisions, store, analyzeDeath);
      }
      
      turn++;
      config.onTurnStart?.(turn, createSnapshotFromStore(store));
      
      // 创建决策上下文
      const context = {
        event: (store as any).currentEvent,
        state: createSnapshotFromStore(store),
        turn,
        history: decisions
      };
      
      // AI做决策
      const decision = strategy.decide(context);
      decisions.push(decision);
      config.onDecision?.(decision);
      
      // 执行决策
      if ((store as any).isEventOpen && decision.choice) {
        // 在事件中 - 选择选项
        (store as any).resolveEventOption(decision.choice);
        // 关闭事件
        (store as any).closeEvent?.();
      } else {
        // 不在事件中 - 推进回合
        await store.nextTurn();
      }
      
      config.onTurnEnd?.(turn, createSnapshotFromStore(store));
      
      // 策略回合结束回调
      strategy.onTurnEnd?.(createSnapshotFromStore(store), decision);
    }
    
    // 达到最大回合数
    return finalizeResult('timeout', turn, decisions, store, analyzeDeath);
    
  } catch (error) {
    return {
      success: false,
      outcome: 'error',
      turns: decisions.length,
      decisions,
      finalState: createSnapshotFromStore(store),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
  }
}

/** 生成最终结果 */
function finalizeResult(
  outcome: GameResult['outcome'],
  turns: number,
  decisions: AIDecision[],
  store: StoreState,
  analyzeDeath: any
): GameResult {
  const snapshot = createSnapshotFromStore(store);
  
  let deathAnalysis;
  if (outcome === 'dead') {
    try {
      deathAnalysis = analyzeDeath(store as any);
    } catch (e) {
      console.warn('死亡分析失败:', e);
    }
  }
  
  return {
    success: outcome !== 'error',
    outcome,
    turns,
    decisions,
    finalState: snapshot,
    deathAnalysis
  };
}

// ==========================================
// 快速模拟器（简化版 - 用于纯逻辑测试）
// ==========================================

/** 轻量级模拟配置 */
export interface FastSimConfig extends SimulatorConfig {
  /** 跳过异步事件加载，使用预定义事件 */
  useMockEvents?: boolean;
}

/**
 * 快速模拟 - 简化版，不依赖完整store
 * 用于快速验证逻辑，速度比runGameSimulation快
 */
export async function fastSimulate(
  strategy: AIStrategy,
  config: FastSimConfig
): Promise<GameResult> {
  // 创建一个最小化的模拟状态
  let state = createMockInitialState();
  const decisions: AIDecision[] = [];
  
  try {
    for (let turn = 1; turn <= config.maxTurns; turn++) {
      // 检查死亡
      if (state.vitality.metrics.hp <= 0) {
        return {
          success: true,
          outcome: 'dead',
          turns: turn - 1,
          decisions,
          finalState: state as any
        };
      }
      
      config.onTurnStart?.(turn, state as any);
      
      // 模拟事件触发（简化版）
      const mockEvent = config.useMockEvents ? getMockEvent(state) : null;
      
      // AI决策
      const context = {
        event: mockEvent,
        state: state as any,
        turn,
        history: decisions
      };
      
      const decision = strategy.decide(context);
      decisions.push(decision);
      config.onDecision?.(decision);
      
      // 应用决策效果（简化版）
      if (decision.choice && mockEvent) {
        const option = mockEvent.options[decision.choice];
        if (option) {
          applyOptionEffects(state, option);
        }
      }
      
      // 回合结算（简化版）
      applySettlement(state);
      
      state.currentTurn = turn + 1;
      config.onTurnEnd?.(turn, state as any);
    }
    
    return {
      success: true,
      outcome: 'timeout',
      turns: config.maxTurns,
      decisions,
      finalState: state as any
    };
    
  } catch (error) {
    return {
      success: false,
      outcome: 'error',
      turns: decisions.length,
      decisions,
      finalState: state as any,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// ==========================================
// 模拟辅助函数
// ==========================================

/** 创建模拟初始状态 */
function createMockInitialState(): any {
  return {
    vitality: {
      metrics: {
        hp: 100,
        maxHp: 100,
        hunger: 50,
        insight: 0,
        gold: 100,
        creditScore: 500,
        addiction: 0,
        resistance: 0
      },
      identity: {
        currentClass: 'HOMELESS',
        points: { red: 0, wolf: 0, old: 0 }
      },
      time: { currentTurn: 1, totalTurns: 1 },
      activeDiseases: [],
      ledger: { history: [] },
      flags: {
        isHomeless: true,
        debtTurns: 0,
        triggeredEvents: [],
        hiddenTags: []
      }
    },
    bank: { activeLoans: [], lifetimeInterestPaid: 0 },
    faith: { 
      id: 'NONE', 
      level: 1, 
      hasPerformedRite: false, 
      debuffs: [], 
      bannedFaiths: [] 
    },
    crypto: { 
      isAccountOpen: false, 
      btcPrice: 30000, 
      positions: [],
      weeklyNews: null,
      weeklyTradesCount: 0,
      lastTradeTurn: -1
    },
    prison: { 
      inJail: false, 
      crime: '', 
      sentenceTurns: 0, 
      turnsServed: 0, 
      bailAmount: 0 
    },
    currentTurn: 1,
    currentRegion: 'SLUMS',
    ending: null,
    isEventOpen: false,
    currentEvent: null,
    unlockedArchives: [],
    achievedEndings: [],
    totalDeaths: 0
  };
}

/** 简化版效果应用 */
function applyOptionEffects(state: any, option: any): void {
  const effects = option.effects || {};
  const metrics = state.vitality.metrics;
  
  if (effects.hp) metrics.hp += effects.hp;
  if (effects.gold) metrics.gold += effects.gold;
  if (effects.hunger) metrics.hunger += effects.hunger;
  if (effects.insight) metrics.insight += effects.insight;
  
  // 钳制数值
  metrics.hp = Math.max(0, Math.min(100, metrics.hp));
  metrics.hunger = Math.max(0, Math.min(100, metrics.hunger));
  metrics.insight = Math.max(0, Math.min(100, metrics.insight));
  metrics.gold = Math.max(-999999999, Math.min(999999999, metrics.gold));
}

/** 简化版回合结算 */
function applySettlement(state: any): void {
  const metrics = state.vitality.metrics;
  
  // 饥饿度增长
  metrics.hunger = Math.min(100, metrics.hunger + 5);
  
  // 饥饿影响HP
  if (metrics.hunger > 80) {
    metrics.hp -= 5;
  }
  
  // HP钳制
  metrics.hp = Math.max(0, metrics.hp);
}

/** 获取模拟事件 */
function getMockEvent(state: any): any {
  // 简化的模拟事件池
  const events = [
    {
      id: 'mock_event_1',
      title: '模拟事件1',
      options: {
        A: { 
          label: '安全选项', 
          effects: { hp: 5, gold: -10 } 
        },
        B: { 
          label: '风险选项', 
          effects: { hp: -10, gold: 20 } 
        }
      }
    },
    {
      id: 'mock_event_2',
      title: '模拟事件2',
      options: {
        A: { 
          label: '休息', 
          effects: { hp: 10, gold: -5 }
        },
        B: { 
          label: '工作', 
          effects: { hp: -5, gold: 30 }
        },
        C: { 
          label: '寻找食物', 
          effects: { gold: -10, hp: 5 }
        }
      }
    }
  ];
  
  // 高风险事件（高灵视）
  if (state.vitality.metrics.insight >= 70) {
    events.push({
      id: 'mock_insight_event',
      title: '真相事件',
      options: {
        A: { label: '普通', effects: { hp: 5, gold: 0 } },
        B: { label: '保守', effects: { hp: 10, gold: 0 } },
        C: { 
          label: '⚠️ 真相', 
          effects: { hp: -15, gold: 0 }
        }
      }
    });
  }
  
  return events[Math.floor(Math.random() * events.length)];
}
