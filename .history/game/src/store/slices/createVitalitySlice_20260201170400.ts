import { StateCreator } from 'zustand';
import { VitalityState, PlayerClass, GameState } from '@/types/schema';

// 初始常量
const INITIAL_METRICS = {
  hp: 100, maxHp: 100,
  san: 50, maxSan: 100,
  gold: 0
};

const CLASS_CONFIG: Record<PlayerClass, { gold: number; hp: number; san: number }> = {
  [PlayerClass.Homeless]: { gold: 50, hp: 60, san: 40 },
  [PlayerClass.Worker]: { gold: 200, hp: 100, san: 60 },
  [PlayerClass.Middle]: { gold: 2000, hp: 90, san: 70 },
  [PlayerClass.Capitalist]: { gold: 10000, hp: 80, san: 50 }
};

export interface VitalitySlice {
  vitality: VitalityState;
  
  // Actions
  initVitality: (selectedClass: PlayerClass) => void;
  
  // ✨ 核心修改器：支持路径更新，自动处理边界
  // 例如: modifyVitality({ metrics: { hp: -10, gold: 500 } }) -> 自动扣血加钱
  modifyVitality: (changes: DeepPartial<VitalityState>) => void;
  
  // 专门用于设置特定值 (非增量)
  setVitalityState: (newState: DeepPartial<VitalityState>) => void;
}

// 辅助类型
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const createVitalitySlice: StateCreator<any, [], [], VitalitySlice> = (set, get) => ({
  vitality: {
    metrics: { ...INITIAL_METRICS },
    identity: {
      currentClass: PlayerClass.Homeless,
      points: { red: 0, wolf: 0, old: 0 }
    },
    flags: {
      isHomeless: false,
      debtDays: 0,
      hiddenTags: []
    }
  },

  initVitality: (selectedClass) => {
    // 获取配置 (优先读 JSON 缓存，这里简化为读常量)
    const config = CLASS_CONFIG[selectedClass];
    
    set({
      vitality: {
        metrics: {
          hp: config.hp, maxHp: config.hp,
          san: config.san, maxSan: 100,
          gold: config.gold
        },
        identity: {
          currentClass: selectedClass,
          points: { red: 0, wolf: 0, old: 0 }
        },
        flags: {
          isHomeless: selectedClass === PlayerClass.Homeless,
          debtDays: 0,
          hiddenTags: []
        }
      }
    });
  },

  modifyVitality: (changes) => {
    set((state: GameState) => {
      const current = state.vitality;
      const m = changes.metrics || {};
      const i = changes.identity || {};
      const f = changes.flags || {};

      // 1. 处理数值 (增量更新 + 边界检查)
      const newMetrics = { ...current.metrics };
      if (m.hp !== undefined) newMetrics.hp = Math.min(newMetrics.maxHp, Math.max(0, newMetrics.hp + m.hp));
      if (m.san !== undefined) newMetrics.san = Math.min(newMetrics.maxSan, Math.max(0, newMetrics.san + m.san));
      if (m.gold !== undefined) newMetrics.gold = newMetrics.gold + m.gold; // 允许负债
      if (m.maxHp !== undefined) newMetrics.maxHp = newMetrics.maxHp + m.maxHp;

      // 2. 处理身份 (合并更新)
      const newIdentity = { 
        ...current.identity, 
        ...i,
        points: { ...current.identity.points, ...(i.points || {}) }
      };

      // 3. 处理标记 (合并更新)
      const newFlags = { ...current.flags, ...f };

      return {
        vitality: {
          metrics: newMetrics,
          identity: newIdentity,
          flags: newFlags
        }
      };
    });
  },

  setVitalityState: (newState) => {
    set((state: GameState) => ({
      vitality: {
        metrics: { ...state.vitality.metrics, ...(newState.metrics || {}) },
        identity: { ...state.vitality.identity, ...(newState.identity || {}) },
        flags: { ...state.vitality.flags, ...(newState.flags || {}) }
      }
    }));
  }
});