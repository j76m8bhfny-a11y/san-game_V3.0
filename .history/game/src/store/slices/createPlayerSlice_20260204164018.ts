import { StateCreator } from 'zustand';
import { 
  PlayerClass, 
  RegionID, 
  ActiveJobState, 
  ActiveHousingState, 
  ActiveInsuranceState 
} from '@/types/schema';
import vitalityRules from '@/assets/data/rules/vitalityRules.json';
export const CLASS_INITIAL_STATS = vitalityRules.classes as Record<PlayerClass, any>;


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