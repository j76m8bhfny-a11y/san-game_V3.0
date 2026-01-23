import { StateCreator } from 'zustand';
import { PlayerClass, RegionID, Job, Housing, Insurance } from '@/types/schema';

// 初始状态 (空值/默认值)
// 注意：具体的数值 (Gold/HP/San) 现在由 startGame 读取 JSON 决定
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
  
  flags: { 
    isHomeless: false, 
    debtDays: 0, 
    hasRedBook: false, 
    hasCryptoKey: false,
    [key: string]: any 
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
  
  // 🗺️ 核心生存状态
  currentRegion: RegionID;
  activeJob: Job | null;
  activeHousing: Housing | null;
  activeInsurance: Insurance | null;

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
  
  // 🎮 游戏流程控制
  startGame: (selectedClass: PlayerClass) => void;
  
  // 🗺️ 新增设置方法
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
    // 避免重复添加同一个结局 ID
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
    
    // 🔍 核心改动：从全局缓存 (SystemSlice) 中读取 JSON 数据
    const allGameData = state.gameDataCache; 
    
    if (!allGameData || !allGameData.classes) {
      console.error("[PlayerSlice] Game data not loaded yet! Cannot start game.");
      return;
    }

    // 1. 查找选定阶级的配置
    const classConfig = allGameData.classes.find((c: any) => c.id === selectedClass);
    
    // 2. 获取初始数值 (JSON 中定义)
    // 如果 JSON 没配对 (容错)，给个默认的“穷人”数值
    const stats = classConfig?.initialStats || { gold: 50, hp: 60, san: 40 };

    // 3. 保留永久成就
    const savedEndings = state.achievedEndings;
    
    // 4. 重置状态并应用新数值
    set({
      ...INITIAL_PLAYER_STATE,
      achievedEndings: savedEndings,
      _hasHydrated: true,
      
      currentClass: selectedClass,
      gold: stats.gold,
      hp: stats.hp,
      maxHp: stats.hp, 
      san: stats.san,
      
      // 默认出生点：贫民窟
      currentRegion: RegionID.Slums,
      
      // 特殊标记
      flags: {
        ...INITIAL_PLAYER_STATE.flags,
        isHomeless: selectedClass === PlayerClass.Homeless
      }
    });
    
    console.log(`[Game Started] Class: ${selectedClass}, Gold: ${stats.gold}, Region: SLUMS`);
  },

  setRegion: (region) => set({ currentRegion: region }),
  setJob: (job) => set({ activeJob: job }),
  setHousing: (housing) => set({ activeHousing: housing }),
  setInsurance: (insurance) => set({ activeInsurance: insurance }),
});