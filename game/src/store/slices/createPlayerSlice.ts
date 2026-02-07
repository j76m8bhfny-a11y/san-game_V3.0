import { StateCreator } from 'zustand';
import { 
  PlayerClass, 
  RegionID, 
  ActiveHousingState, 
  ActiveInsuranceState,
  ActiveHousing
} from '@/types/schema';
import vitalityRules from '@/assets/data/rules/vitalityRules.json';

export const CLASS_INITIAL_STATS = vitalityRules.classes as Record<PlayerClass, any>;

// 2. 初始状态
const INITIAL_PLAYER_STATE = {
  currentRegion: RegionID.Slums, 
  // 注意: activeJobs 已在 vitality 内部管理，不在此处存储
  activeHousing: null as ActiveHousing,  // 单一房产，初始为 null
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
  // 注意: activeJobs 在 vitality 中管理 (支持多工作)
  activeHousing: ActiveHousing;  // 单一房产
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
  setInsurance: (insurance) => set({ activeInsurance: insurance }),
});
