import { StateCreator } from 'zustand';
import { 
  PlayerClass, 
  RegionID, 
  ActiveJobState, 
  ActiveHousingState, 
  ActiveInsuranceState 
} from '@/types/schema';

// ✅ 1. 导出初始数值常量，供 ClassSelectorModal 使用
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

// 2. 初始状态
const INITIAL_PLAYER_STATE = {
  currentRegion: RegionID.Slums, 
  activeJob: null as ActiveJobState | null,
  activeHousing: null as ActiveHousingState | null,
  activeInsurance: null as ActiveInsuranceState | null,

  inventory: [] as string[],
  history: [] as string[],
  unlockedArchives: [] as string[], 
  achievedEndings: [] as string[],
  ending: null as string | null,
};

export interface PlayerSlice {
  // --- State ---
  currentRegion: RegionID;
  activeJob: ActiveJobState | null;
  activeHousing: ActiveHousingState | null;
  activeInsurance: ActiveInsuranceState | null;

  inventory: string[];
  history: string[];
  unlockedArchives: string[];
  achievedEndings: string[]; 
  ending: string | null;

  // --- Actions ---
  updatePlayerStats: (updates: Partial<PlayerSlice>) => void;
  triggerEnding: (endingId: string) => void;
  resetPlayerState: () => void;
  
  setRegion: (region: RegionID) => void;
  setJob: (job: ActiveJobState | null) => void;
  setHousing: (housing: ActiveHousingState | null) => void;
  setInsurance: (insurance: ActiveInsuranceState | null) => void;
}

export const createPlayerSlice: StateCreator<any, [], [], PlayerSlice> = (set, get) => ({
  ...INITIAL_PLAYER_STATE,

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
      achievedEndings: savedEndings
    });
  },

  setRegion: (region) => set({ currentRegion: region }),
  setJob: (job) => set({ activeJob: job }),
  setHousing: (housing) => set({ activeHousing: housing }),
  setInsurance: (insurance) => set({ activeInsurance: insurance }),
});