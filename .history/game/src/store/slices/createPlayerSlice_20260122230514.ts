import { StateCreator } from 'zustand';
import { PlayerClass } from '@/types/schema';

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

// 定义玩家初始状态 (方便重置时调用)
const INITIAL_PLAYER_STATE = {
  day: 1,
  hp: 100,
  maxHp: 100,
  san: 50,
  gold: 100,
  currentClass: PlayerClass.Worker,
  inventory: [] as string[],
  history: [] as string[],
  // 注意：解锁的档案目前逻辑是跟随存档重置的，如果你希望档案永久解锁，
  // 需要在 resetPlayerState 中像 achievedEndings 一样特殊保留。
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
  achievedEndings: string[]; // 这是一个永久数据，重置时不应清空
  
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
  // 通用的状态更新方法，方便简单的数值调整
  updatePlayerStats: (updates: Partial<PlayerSlice>) => void;
  
  // 触发结局 (同时记录到永久成就中)
  triggerEnding: (endingId: string) => void;
  
  // 重置游戏 (新游戏)
  resetPlayerState: () => void;
}

export const createPlayerSlice: StateCreator<any, [], [], PlayerSlice> = (set, get) => ({
  // --- Initial State ---
  ...INITIAL_PLAYER_STATE,
  achievedEndings: [], // 初始为空，但会被持久化存储覆盖

  // --- Actions Implementation ---
  updatePlayerStats: (updates) => set((state: any) => ({ ...state, ...updates })),
  startGame: (selectedClass) => {
    const stats = CLASS_INITIAL_STATS[selectedClass];
    
    // 重置所有状态，但保留永久成就
    const savedEndings = get().achievedEndings;
    
    set({
      ...INITIAL_PLAYER_STATE,
      achievedEndings: savedEndings,
      _hasHydrated: true,
      
      // 应用选中的职业数值
      currentClass: selectedClass,
      gold: stats.gold,
      hp: stats.hp,
      maxHp: stats.hp, // 初始 HP 即为最大 HP
      san: stats.san,
      
      // 特殊 Flag 处理
      flags: {
        ...INITIAL_PLAYER_STATE.flags,
        isHomeless: selectedClass === PlayerClass.Homeless
      }
    });
  },
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
    // 获取当前已达成的结局（因为这是永久数据，不能被重置）
    const savedEndings = get().achievedEndings;
    
    set({
      ...INITIAL_PLAYER_STATE,
      // 恢复永久数据
      achievedEndings: savedEndings,
      // 恢复 hydration 状态 (防止重置导致 loading 界面卡住)
      _hasHydrated: true 
    });
  },
});