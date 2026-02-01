import { StateCreator } from 'zustand';
import { VitalityState, PlayerClass, GameState, LedgerCategory, LedgerRecord } from '@/types/schema';

// 初始配置常量
const CLASS_CONFIG = {
  [PlayerClass.Homeless]: { gold: 50, hp: 60, san: 40 },
  [PlayerClass.Worker]: { gold: 200, hp: 100, san: 60 },
  [PlayerClass.Middle]: { gold: 2000, hp: 90, san: 70 },
  [PlayerClass.Capitalist]: { gold: 10000, hp: 80, san: 50 }
};

export interface VitalitySlice {
  vitality: VitalityState;

  // --- Actions ---
  initGame: (selectedClass: PlayerClass) => void;
  
  // ✅ 核心记账方法：所有花钱/赚钱都必须调这个
  addTransaction: (category: LedgerCategory, amount: number, description: string) => void;
  
  // 修改非金钱数值 (HP/SAN)
  modifyStats: (changes: { hp?: number; san?: number; maxHp?: number; maxSan?: number }) => void;
  
  // 推进回合 (进入下一周)
  advanceTurn: () => void;
  
  // 清空本周账单 (在结算弹窗关闭后调用)
  clearWeeklyLedger: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const createVitalitySlice: StateCreator<any, [], [], VitalitySlice> = (set, get) => ({
  vitality: {
    metrics: { 
      hp: 100, maxHp: 100, 
      san: 50, maxSan: 100, 
      gold: 0,
      creditScore: 580 // 初始信用分
    },
    // ✅ 修复：补全 identity
    identity: {
      currentClass: PlayerClass.Homeless,
      points: { red: 0, wolf: 0, old: 0 }
    },
    // ✅ 修复：补全 time
    time: {
      currentTurn: 1,
      totalTurns: 52,
      dayOfWeek: 1
    },
    ledger: { history: [] },
    flags: { isHomeless: false, debtTurns: 0, hiddenTags: [] },
    activeJobs: []
  },

  initGame: (selectedClass) => {
    const config = CLASS_CONFIG[selectedClass];
    set({
      vitality: {
        metrics: { 
          hp: config.hp, maxHp: config.hp, 
          san: config.san, maxSan: 100, 
          gold: config.gold, 
          creditScore: 580 // ✅ 确保重置时也有
        },
        identity: { currentClass: selectedClass, points: { red: 0, wolf: 0, old: 0 } },
        time: { 
          currentTurn: 1, 
          totalTurns: 52, 
          dayOfWeek: 1 // ✅ 新增
        },
        ledger: { history: [] }, // 初始清空
        flags: { isHomeless: selectedClass === PlayerClass.Homeless, debtTurns: 0, hiddenTags: [] },
        activeJobs: []
      }
    });
  },

  addTransaction: (category, amount, description) => {
    set((state: GameState) => {
      const { metrics, time, ledger } = state.vitality;
      
      // 1. 创建账单记录
      const newRecord: LedgerRecord = {
        id: generateId(),
        turn: time.currentTurn,
        category,
        amount,
        description,
        timestamp: Date.now()
      };

      // 2. 实时更新金钱
      const newGold = metrics.gold + amount;

      return {
        vitality: {
          ...state.vitality,
          metrics: { ...metrics, gold: newGold },
          ledger: {
            ...ledger,
            history: [...ledger.history, newRecord]
          }
        }
      };
    });
  },

  modifyStats: (changes) => {
    set((state: GameState) => {
      const m = state.vitality.metrics;
      const newMetrics = { ...m };
      
      if (changes.maxHp) newMetrics.maxHp += changes.maxHp;
      if (changes.maxSan) newMetrics.maxSan += changes.maxSan;
      
      if (changes.hp) newMetrics.hp = Math.min(newMetrics.maxHp, Math.max(0, m.hp + changes.hp));
      if (changes.san) newMetrics.san = Math.min(newMetrics.maxSan, Math.max(0, m.san + changes.san));

      return { vitality: { ...state.vitality, metrics: newMetrics } };
    });
  },

  advanceTurn: () => {
    set((state: GameState) => ({
      vitality: {
        ...state.vitality,
        time: {
          ...state.vitality.time,
          currentTurn: state.vitality.time.currentTurn + 1
        }
      }
    }));
  },
  
  clearWeeklyLedger: () => {
    set((state: GameState) => ({
      vitality: {
        ...state.vitality,
        ledger: { history: [] } // 清空历史，开始记录下一周
      }
    }));
  }
});