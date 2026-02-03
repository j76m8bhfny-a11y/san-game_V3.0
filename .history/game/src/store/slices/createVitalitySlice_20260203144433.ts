import { StateCreator } from 'zustand';
import { VitalityState, PlayerClass, LedgerCategory } from '@/types/schema';
// ✅ 1. 引入单一真理来源，消除数据孤岛
import { CLASS_INITIAL_STATS } from './createPlayerSlice';

export interface VitalitySlice {
  vitality: VitalityState;

  // --- Actions ---
  initGame: (selectedClass: PlayerClass) => void;
  addTransaction: (category: LedgerCategory, amount: number, description: string) => void;
  modifyStats: (changes: { 
    hp?: number; san?: number; 
    hunger?: number;
    maxHp?: number; maxSan?: number;
    addiction?: number; resistance?: number;
  }) => void;
  contractDisease: (diseaseId: string) => void;
  cureDisease: (diseaseId: string) => void;
  advanceTurn: () => void;
  clearWeeklyLedger: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const createVitalitySlice: StateCreator<any, [], [], VitalitySlice> = (set, get) => ({
  vitality: {
    metrics: { hunger: 100, maxHunger: 100,hp: 100, maxHp: 100, san: 100, maxSan: 100, gold: 0, creditScore: 650, addiction: 0, resistance: 0 },
    identity: { currentClass: PlayerClass.Homeless, points: { red: 0, wolf: 0, old: 0 } },
    time: { currentTurn: 1, totalTurns: 1 },
    activeDiseases: [],
    ledger: { history: [] },
    flags: { isHomeless: true, debtTurns: 0, hiddenTags: [] },
    activeJobs: []
  },

  initGame: (selectedClass) => {
    // ✅ 2. 使用导入的配置进行初始化
    const config = CLASS_INITIAL_STATS[selectedClass];
    
    // 防御性检查
    if (!config) {
        console.error(`Missing config for class: ${selectedClass}`);
        return;
    }

    set((state: any) => ({
      vitality: {
        ...state.vitality,
        metrics: {
          ...state.vitality.metrics,
          gold: config.gold,
          hp: config.hp,
          maxHp: config.hp, // 假设初始 HP 即为上限
          san: config.san,
          maxSan: 100,
          hunger: 100,
          maxHunger: 100,
          resistance: 0, // 可以根据 config 扩展
          creditScore: selectedClass === PlayerClass.Homeless ? 500 : 650
        },
        identity: {
          ...state.vitality.identity,
          currentClass: selectedClass
        },
        time: { currentTurn: 1, totalTurns: 1 },
        activeDiseases: [],
        ledger: { history: [] }, // 清空旧账本
        activeJobs: []
      },
      faith: { id: 'NONE', level: 0, hasPerformedRite: false }, //
      prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 }, //
      crypto: { isAccountOpen: false, btcPrice: 20000, positions: [], priceHistory: [], dailyNews: null }, //
      // 重置其他切片状态
      activeHousing: null,
      activeJob: null,
      inventory: [],
      bank: { activeLoans: [], lifetimeInterestPaid: 0 }
    }));
  },

  addTransaction: (category, amount, description) => {
     set((state: any) => {
        const newRecord = {
            id: generateId(),
            turn: state.vitality.time.currentTurn,
            category,
            amount,
            description,
            timestamp: Date.now()
        };
        const newGold = state.vitality.metrics.gold + amount;
        
        return {
            vitality: {
                ...state.vitality,
                metrics: { ...state.vitality.metrics, gold: newGold },
                ledger: {
                    history: [...state.vitality.ledger.history, newRecord]
                }
            }
        };
     });
  },

  modifyStats: (changes) => set((state: any) => {
    // 使用 shallow merge 还是 deep merge 取决于你的 store 结构
    // 这里做简单的浅合并到 metrics
    return {
        vitality: {
            ...state.vitality,
            metrics: { ...state.vitality.metrics, ...changes }
        }
    };
  }),

  contractDisease: (diseaseId) => set((state: any) => ({
    vitality: {
      ...state.vitality,
      activeDiseases: [...state.vitality.activeDiseases, diseaseId]
    }
  })),

  cureDisease: (diseaseId) => set((state: any) => ({
    vitality: {
      ...state.vitality,
      activeDiseases: state.vitality.activeDiseases.filter((id: string) => id !== diseaseId)
    }
  })),

  advanceTurn: () => set((state: any) => ({
    vitality: {
        ...state.vitality,
        time: {
            ...state.vitality.time,
            currentTurn: state.vitality.time.currentTurn + 1,
            totalTurns: state.vitality.time.totalTurns + 1
        }
    }
  })),

  clearWeeklyLedger: () => set((state: any) => ({
      vitality: {
          ...state.vitality,
          ledger: { history: [] }
      }
  }))
});