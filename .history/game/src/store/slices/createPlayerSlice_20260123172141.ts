import { StateCreator } from 'zustand';
import { PlayerClass, RegionID, Job, Housing, Insurance } from '@/types/schema';

// ✅ 重新加回这个常量，供 UI (ClassSelectorModal) 使用
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
  gold: 0,
  currentClass: PlayerClass.Worker,
  
  // 🗺️ 新增地图与生存状态
  currentRegion: RegionID.Slums, 
  activeJob: null as Job | null,
  activeHousing: null as Housing | null,
  activeInsurance: null as Insurance | null,

  inventory: [] as string[],
  history: [] as string[],
  unlockedArchives: [] as string[], 
  
  // ✅ 修复语法错误：移除了 [key: string]: any
  flags: { 
    isHomeless: false, 
    debtDays: 0, 
    hasRedBook: false, 
    hasCryptoKey: false
    // 这里不能写索引签名，它只存在于 Interface 定义中
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
  
  currentRegion: RegionID;
  activeJob: Job | null;
  activeHousing: Housing | null;
  activeInsurance: Insurance | null;

  inventory: string[];
  history: string[];
  unlockedArchives: string[];
  achievedEndings: string[]; 
  
  // Interface 里可以保留索引签名
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
  
  setRegion: (region: RegionID) => void;
  setJob: (job: Job | null) => void;
  setHousing: (housing: Housing | null) => void;
  setInsurance: (insurance: Insurance | null) => void;
}

export const createPlayerSlice: StateCreator<any, [], [], PlayerSlice> = (set, get) => ({
  // --- Initial State ---
  ...INITIAL_PLAYER_STATE,
  achievedEndings: [], 

  // --- Actions Implementation ---
  updatePlayerStats: (updates) => set((state: any) => ({ ...state, ...updates })),

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

  resetPlayerState: () => {
    const savedEndings = get().achievedEndings;
    set({
      ...INITIAL_PLAYER_STATE,
      achievedEndings: savedEndings,
      _hasHydrated: true 
    });
  },

  startGame: (selectedClass: PlayerClass) => {
    const state = get();
    const allGameData = state.gameDataCache; 
    
    // 逻辑：优先读 JSON，如果 JSON 没加载或没配对，回退到 UI 常量 CLASS_INITIAL_STATS
    let stats = CLASS_INITIAL_STATS[selectedClass];

    if (allGameData && allGameData.classes) {
       const classConfig = allGameData.classes.find((c: any) => c.id === selectedClass);
       if (classConfig && classConfig.initialStats) {
           stats = classConfig.initialStats;
           console.log("Loaded stats from JSON:", stats);
       }
    }

    const savedEndings = state.achievedEndings;
    
    set({
      ...INITIAL_PLAYER_STATE,
      achievedEndings: savedEndings,
      _hasHydrated: true,
      
      currentClass: selectedClass,
      gold: stats.gold,
      hp: stats.hp,
      maxHp: stats.hp, 
      san: stats.san,
      currentRegion: RegionID.Slums,
      
      flags: {
        ...INITIAL_PLAYER_STATE.flags,
        isHomeless: selectedClass === PlayerClass.Homeless
      }
    });
  },

  setRegion: (region) => set({ currentRegion: region }),
  setJob: (job) => set({ activeJob: job }),
  setHousing: (housing) => set({ activeHousing: housing }),
  setInsurance: (insurance) => set({ activeInsurance: insurance }),
});