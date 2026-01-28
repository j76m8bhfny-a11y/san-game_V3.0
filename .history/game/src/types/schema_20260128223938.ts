import { z } from 'zod';

// ==========================================
// 1. 基础枚举与常量
// ==========================================

export enum RegionID {
  Slums = 'SLUMS',        // 贫民窟
  RustBelt = 'RUST_BELT', // 铁锈工业区
  Suburbs = 'SUBURBS',    // 郊区
  Downtown = 'DOWNTOWN'   // 金融核心区
}

export enum PlayerClass {
  Homeless = 'HOMELESS',
  Worker = 'WORKER',
  Middle = 'MIDDLE',
  Capitalist = 'CAPITALIST'
}

export enum ScalingMode {
  FIXED = 'FIXED',
  CLASS_LEVERAGE = 'LEVERAGE',
  INCOME_RATIO = 'INCOME',
}

// ✨ 新增: 动作类型枚举 (用于 JSON 驱动逻辑)
export enum ActionCode {
  MODIFY_STAT = 'MODIFY_STAT',     // 修改数值
  ADD_ITEM = 'ADD_ITEM',           // 获得物品
  REMOVE_ITEM = 'REMOVE_ITEM',     // 移除物品
  UNLOCK_ARCHIVE = 'UNLOCK_ARCHIVE', // 解锁档案
  CHANCE = 'CHANCE',               // 概率分支
  TRIGGER_EVENT = 'TRIGGER_EVENT', // 强制触发事件
  GAME_OVER = 'GAME_OVER'          // 结局
}

// ==========================================
// 2. 核心 Zod Schemas (数据校验)
// ==========================================

// --- ✨ 新增: Action Schema (通用指令) ---
// 使用 z.lazy 处理递归引用 (CHANCE 里面套 Action)
export const GameActionSchema: z.ZodType<any> = z.lazy(() => z.object({
  code: z.nativeEnum(ActionCode),
  params: z.object({
    // 通用参数
    target: z.enum(['hp', 'san', 'gold', 'maxHp']).optional(),
    value: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    
    // 物品/档案相关
    itemId: z.string().optional(),
    archiveId: z.string().optional(),
    
    // 概率相关
    rate: z.number().min(0).max(1).optional(),
    successActions: z.array(GameActionSchema).optional(),
    failActions: z.array(GameActionSchema).optional(),
    
    // 结局相关
    endingId: z.string().optional()
  }).passthrough() // 允许未知字段，方便未来扩展
}));

export type GameAction = z.infer<typeof GameActionSchema>;

// --- 子系统 Schemas ---

export const CryptoPositionSchema = z.object({
  id: z.string(),
  type: z.enum(['LONG', 'SHORT']),
  entryPrice: z.number(),
  leverage: z.number(),
  principal: z.number(),
  day: z.number(),
});

export const NewsItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  effect: z.number(),
});

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  region: z.nativeEnum(RegionID),
  salary: z.number(),
  sanCost: z.number(),
  requiresAddress: z.boolean().default(false),
  requiredVehicle: z.string().optional(),
  requiredClass: z.nativeEnum(PlayerClass).optional(),
  description: z.string(),
});

export const HousingSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.nativeEnum(RegionID),
  type: z.enum(['RENT', 'OWN']),
  price: z.number(),
  dailyCost: z.number(),
  defenseLevel: z.number(),
  description: z.string(),
});

export const InsuranceSchema = z.object({
  id: z.string(),
  name: z.string(),
  dailyCost: z.number(),
  coverage: z.enum(['PARTIAL', 'FULL']),
  description: z.string(),
});

export const GlobalSettingsSchema = z.object({
  gameRules: z.object({
    maxDays: z.number(),
    victoryHpThreshold: z.number(),
    pressureDivisor: z.number(),
  }),
  salaryConfig: z.array(z.object({
    maxSan: z.number(),
    efficiency: z.number(),
    desc: z.string().optional()
  })),
  billConfig: z.object({
    baseProb: z.number(),
    debtProb: z.number()
  })
});

// --- 物品与事件 Schemas ---

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  region: z.nativeEnum(RegionID).optional(),
  effects: z.object({
    hp: z.number(),
    san: z.number(),
    maxHp: z.number().optional(),
  }),
  // 旧版硬编码效果 (兼容保留)
  activeEffect: z.object({
    type: z.enum(['NONE', 'LOTTERY', 'SURGERY', 'BLOOD_DONATION']),
    params: z.record(z.string(), z.any()) 
  }).optional(),
  // ✨ 新增: JSON 驱动的通用效果 (建议未来迁移到这里)
  onUseActions: z.array(GameActionSchema).optional(),
  
  tags: z.array(z.string()), 
  requiredClass: z.nativeEnum(PlayerClass).optional(),
  unlockCondition: z.string().optional(),
  flavorText: z.string(),
});

export const ArchiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  flavorText: z.string(),
  image: z.string().optional(),
});

export const BillSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  type: z.enum(['SURPRISE', 'JUMP_SCARE', 'DISASTER', 'MEDICAL', 'LEGAL', 'VEHICLE']),
  weight: z.number().default(10),
  triggerCondition: z.object({
    minGold: z.number().optional(),
    maxGold: z.number().optional(),
    minSan: z.number().optional(),
    requiredClass: z.array(z.nativeEnum(PlayerClass)).optional(),
    isDebtOnly: z.boolean().optional(),
    hasVehicle: z.string().optional(),
    hasHousing: z.boolean().optional(),
  }),
  image: z.string().optional(),
  news: z.object({
    source: z.string(),
    content: z.string(),
  }).optional(),
  roast: z.string().optional(),
  effects: z.object({
    hp: z.number().optional(),
    san: z.number().optional(),
  }).optional(),
  flavorText: z.string(),
});

export const EventOptionSchema = z.object({
  label: z.string(),
  roast: z.string().optional(),
  effects: z.object({
    scaling: z.nativeEnum(ScalingMode).optional(),
    hp: z.number().optional(),
    gold: z.number().optional(),
    san: z.number().optional(),
    points: z.object({
      red: z.number().optional(),
      wolf: z.number().optional(),
      old: z.number().optional(),
    }).optional(),
    items: z.array(z.object({
      itemId: z.string(),
      count: z.number(), 
    })).optional(),
    jail: z.object({
      days: z.number(),
      bail: z.number(),
      reason: z.string(),
    }).optional(),
    deathReason: z.string().optional(), 
  }),
  archiveId: z.string().optional(), 
});

export const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  bgImage: z.string().optional(),
  eventImage: z.string().optional(),
  text: z.object({
    lowSan: z.string(),
    highSan: z.string(),
  }),
  conditions: z.object({
    minSan: z.number().optional(),
    maxSan: z.number().optional(),
    requiredClass: z.array(z.nativeEnum(PlayerClass)).optional(),
    hasItem: z.string().optional(), 
    region: z.nativeEnum(RegionID).optional(),
  }),
  options: z.object({
    A: EventOptionSchema,
    B: EventOptionSchema,
    C: EventOptionSchema,
    D: EventOptionSchema.extend({
      sanLock: z.number().default(70),
      isGlitched: z.boolean().default(false),
    }),
  }),
});

export const EndingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.number(),
  type: z.enum(['DEATH', 'SURVIVAL', 'ALIENATION', 'STANCE', 'UR']),
  conditions: z.object({
    minDay: z.number().optional(),
    maxHp: z.number().optional(),
    minSan: z.number().optional(),
    maxSan: z.number().optional(),
    minGold: z.number().optional(),
    maxGold: z.number().optional(),
    requiredClass: z.nativeEnum(PlayerClass).optional(),
    requiredFlags: z.array(z.string()).optional(),
    requiredPoints: z.object({
        red: z.number().optional(),
        wolf: z.number().optional(),
        old: z.number().optional()
    }).optional(),
    hasItem: z.string().optional(),
    hasArchive: z.string().optional(),
  }).optional(),
});

// ==========================================
// 3. TypeScript 类型推导与状态接口
// ==========================================

export type GlobalSettings = z.infer<typeof GlobalSettingsSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Archive = z.infer<typeof ArchiveSchema>;
export type Bill = z.infer<typeof BillSchema>;
export type GameEvent = z.infer<typeof EventSchema>;
export type EventOption = z.infer<typeof EventOptionSchema>; // 导出这个给 Resolver 用
export type Ending = z.infer<typeof EndingSchema>;
export type Job = z.infer<typeof JobSchema>;
export type Housing = z.infer<typeof HousingSchema>;
export type Insurance = z.infer<typeof InsuranceSchema>;
export type CryptoPosition = z.infer<typeof CryptoPositionSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;

export interface GameNotification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'GOLD' | 'HP' | 'SAN';
  value?: number;
}

// 信仰系统接口
export enum FaithID {
  NONE = 'NONE',
  CHURCH = 'CHURCH',
  BROTHERHOOD = 'BROTHERHOOD',
  CULT = 'CULT',
  REVOLUTION = 'REVOLUTION'
}

export interface FaithData {
  id: FaithID;
  name: string;
  description: string;
  color: string;
  joinCost: {
    gold?: number;
    cleanInventory?: boolean;
    maxSan?: number;
    minHp?: number;
    minSan?: number;
  };
  rite: {
    name: string;
    description: string;
    baseSanReward?: number;
    baseHpReward?: number;
    hpCost?: number;
    sanCost?: number;
    goldReward?: number;
    redPointReward?: number;
  };
}

export interface FaithState {
  id: FaithID;
  level: number;
  hasPerformedRite: boolean;
}

// 银行系统接口
export interface LoanProduct {
  id: string;
  name: string;
  provider: string;
  description: string;
  minScore: number;
  dailyRate: number;
  maxAmount: number;
  termDays: number;
  color: string;
  riskLevel: string;
}

export interface ActiveLoan {
  id: string;
  productId: string;
  principal: number;
  interest: number;
  rate: number;
  dueDate: number;
  isOverdue: boolean;
}

export interface BankState {
  creditScore: number;
  creditHistory: number[];
  activeLoans: ActiveLoan[];
  lifetimeInterestPaid: number;
}

// 监狱系统接口
export interface PrisonState {
  inJail: boolean;
  crime: string;
  sentenceDays: number;
  daysServed: number;
  bailAmount: number;
}

// --- 游戏主状态 (State) ---
export interface GameState {
  // 基础属性
  day: number;
  hp: number;
  maxHp: number;
  san: number;
  gold: number;
  currentClass: PlayerClass;
  
  // 核心子状态
  bank: BankState;
  prison: PrisonState;
  faith: FaithState;
  
  // 区域与资产
  currentRegion: RegionID;
  activeJob: Job | null;
  activeHousing: Housing | null;
  activeInsurance: Insurance | null;

  // 临时状态 (每日变化)
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  ending: string | null;
  dailySummary: {
    revenue: number;
    expenses: number;
    notes: string[];
  } | null;

  // 加密货币状态
  crypto: {
    isAccountOpen: boolean;
    btcPrice: number;
    priceHistory: number[];
    positions: CryptoPosition[];
    dailyNews: NewsItem | null;
  };

  // 杂项
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
  points: {
    red: number;
    wolf: number;
    old: number;
  };
  
  // UI 状态
  isShopOpen: boolean;
  isInventoryOpen: boolean;
  isArchiveOpen: boolean;
  isMenuOpen: boolean;
  currentRoast: string | null;
  notifications: GameNotification[];
  viewingArchive: string | null;
  _hasHydrated: boolean;
  
  // 数据缓存 (不持久化，仅用于 logic 层访问 json)
  gameDataCache?: {
    global: GlobalSettings;
    items: Item[];
    itemMap: Map<string, Item>;
    events: GameEvent[];
    bills: Bill[];
    classes: any[];
    classMap: any;
    endings: Ending[];
    news?: NewsItem[];
  };
  
  // Update helpers
  setRegion: (r: RegionID) => void;
  addNotification: (msg: string, type: any) => void;
  updatePlayerStats: (updates: Partial<GameState>) => void;
  setRoast: (t: string | null) => void;
  setViewingArchive: (id: string | null) => void;
  triggerEnding: (id: string) => void;
  
  // UI setters
  setShopOpen: (v: boolean) => void;
  setInventoryOpen: (v: boolean) => void;
  setArchiveOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  
  // New Slices actions
  resetPlayerState: () => void;
  processNightlyMarket: (news: NewsItem[]) => { logs: string[], notes: string[] };
}