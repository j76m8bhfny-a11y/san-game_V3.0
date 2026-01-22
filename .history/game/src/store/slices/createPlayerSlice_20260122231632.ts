import { StateCreator } from 'zustand';
import { PlayerClass } from '@/types/schema';

// 1. 定义初始难度配置
export const CLASS_INITIAL_STATS: Record<PlayerClass, { gold: number; hp: number; san: number; desc: string }> = {
  [PlayerClass.Homeless]: { 
    gold: 50, hp: 60, san: 40, 
    desc: '地狱开局。除了活着，你一无所有。' 
  },
  [PlayerClass.Worker]: { 
    gold: 200, hp: 100, san: 60, 
    desc: '标准开局。用健康换取金钱的西西弗斯。' 
  },
  [PlayerClass.Middle]: { 
    gold: 2000, hp: 90, san: 70, 
    desc: '安逸的陷阱。看似拥有选择权，实则更怕失去。' 
  },
  [PlayerClass.Capitalist]: { 
    gold: 10000, hp: 80, san: 50, 
    desc: '顶层掠食者。金钱是数字，人性是筹码。' 
  }
};

const INITIAL_PLAYER_STATE = {
  day: 1,
  hp: 100,
  maxHp: 100,
  san: 50,
  gold: 100,
  currentClass: PlayerClass.Worker,
  inventory: [] as string[],
  history: [] as string[],
  unlockedArchives: [] as string[], 
  flags: { 
    isHomeless: false, 
    debtDays: 0, 
    hasRedBook: false, 
    hasCryptoKey: false 
  },
  points: { red: 0, wolf: 0, old: 0 },
  ending: null as string | null,
};

export interface PlayerSlice {
  // --- State ---
  day: number;
  hp: number;
  maxHp: number;
  san: number;
  gold: number;
  currentClass: PlayerClass;
  
  inventory: string[];
  history: string[];
  unlockedArchives: string[];
  achievedEndings: string[]; 
  
  flags: {
    isHomeless: boolean;
    debtDays: number;
    hasRedBook: boolean;
    hasCryptoKey: boolean;
    [key: string]: any;
  };
  points: { red: number; wolf: number; old: number };
  
  ending: string | null;

  // --- Actions ---
  updatePlayerStats: (updates: Partial<PlayerSlice>) => void;
  triggerEnding: (endingId: string) => void;
  resetPlayerState: () => void;
  startGame: (selectedClass: PlayerClass) => void;
}

export const createPlayerSlice: StateCreator<any, [], [], PlayerSlice> = (set, get) => ({
  // --- Initial State ---
  ...INITIAL_PLAYER_STATE,
  achievedEndings: [], 

  // --- Actions Implementation ---
  updatePlayerStats: (updates) => set((state: any) => ({ ...state, ...updates })),
  
  // 🟢 触发结局
  triggerEnding: (endingId) => {
    const { achievedEndings } = get();
    const newAchieved = achievedEndings.includes(endingId) 
      ? achievedEndings 
      : [...achievedEndings, endingId];
      
    set({ 
      ending: endingId,
      achievedEndings: newAchieved
    });
  },

  // 🟢 重置状态
  resetPlayerState: () => {
    const savedEndings = get().achievedEndings;
    set({
      ...INITIAL_PLAYER_STATE,
      achievedEndings: savedEndings,
      _hasHydrated: true 
    });
  },

  // 🟢 开始游戏 (这是唯一正确的定义，已包含类型注解)
  startGame: (selectedClass: PlayerClass) => {
    const stats = CLASS_INITIAL_STATS[selectedClass];
    const savedEndings = get().achievedEndings;
    
    set({
      ...INITIAL_PLAYER_STATE,
      achievedEndings: savedEndings,
      _hasHydrated: true,
      
      currentClass: selectedClass,
      gold: stats.gold,
      hp: stats.hp,
      maxHp: stats.hp, 
      san: stats.san,
      
      flags: {
        ...INITIAL_PLAYER_STATE.flags,
        isHomeless: selectedClass === PlayerClass.Homeless
      }
    });
  },
});