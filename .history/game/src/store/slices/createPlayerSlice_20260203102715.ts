import { StateCreator } from 'zustand';
import { 
  PlayerClass, 
  RegionID, 
  ActiveJobState, 
  ActiveHousingState, 
  ActiveInsuranceState 
} from '@/types/schema';

// 1. 初始状态：只保留属于 Player 范畴的非维生数据
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
  activeJob: ActiveJobState | null;      // ✅ 修正为 Active 状态
  activeHousing: ActiveHousingState | null; // ✅ 修正为 Active 状态
  activeInsurance: ActiveInsuranceState | null; // ✅ 修正为 Active 状态

  inventory: string[];
  history: string[];
  unlockedArchives: string[];
  achievedEndings: string[]; 
  ending: string | null;

  // --- Actions ---
  // 更新 Player 范畴的状态
  updatePlayerStats: (updates: Partial<PlayerSlice>) => void;
  triggerEnding: (endingId: string) => void;
  resetPlayerState: () => void;
  
  setRegion: (region: RegionID) => void;
  setJob: (job: ActiveJobState | null) => void;
  setHousing: (housing: ActiveHousingState | null) => void; // ✅ 对应修改
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