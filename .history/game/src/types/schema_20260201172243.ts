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

// 动作代码 (用于 JSON 驱动的通用逻辑)
export enum ActionCode {
  MODIFY_STAT = 'MODIFY_STAT',     // 修改数值 (hp, san, gold)
  MODIFY_VITALITY = 'MODIFY_VITALITY', // ✨ 新增: 专门用于修改维生状态
  ADD_ITEM = 'ADD_ITEM',           // 获得物品
  REMOVE_ITEM = 'REMOVE_ITEM',     // 移除物品
  UNLOCK_ARCHIVE = 'UNLOCK_ARCHIVE', // 解锁档案
  CHANCE = 'CHANCE',               // 概率分支
  TRIGGER_EVENT = 'TRIGGER_EVENT', // 强制触发事件
  GAME_OVER = 'GAME_OVER'          // 结局
}

// 信仰 ID
export enum FaithID {
  NONE = 'NONE',
  CHURCH = 'CHURCH',
  BROTHERHOOD = 'BROTHERHOOD',
  CULT = 'CULT',
  REVOLUTION = 'REVOLUTION'
}

// ==========================================
// 2. 核心 Zod Schemas (JSON 数据校验)
// ==========================================

// --- Action Schema (通用指令) ---
export const GameActionSchema: z.ZodType<any> = z.lazy(() => z.object({
  code: z.nativeEnum(ActionCode),
  params: z.object({
    // 通用参数
    target: z.string().optional(), // 如 'metrics.hp', 'identity.points.red'
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
  }).passthrough() 
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
  activeEffect: z.object({
    type: z.enum(['NONE', 'LOTTERY', 'SURGERY', 'BLOOD_DONATION']),
    params: z.record(z.string(), z.any()) 
  }).optional(),
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
// 3. 核心 State 接口定义 (Type Definitions)
// ==========================================

export type GlobalSettings = z.infer<typeof GlobalSettingsSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Archive = z.infer<typeof ArchiveSchema>;
export type Bill = z.infer<typeof BillSchema>;
export type GameEvent = z.infer<typeof EventSchema>;
export type EventOption = z.infer<typeof EventOptionSchema>;
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

// --- ✨ 维生系统 (Vitality System) ---

// 1. 基础维生指标
export interface VitalityMetrics {
  hp: number;
  maxHp: number;
  san: number;
  maxSan: number;
  gold: number;
  [key: string]: number; // 支持未来扩展指标 (如 hunger, radiation)
}

// 1. 新增：财务流水记录
export interface LedgerRecord {
  category: 'HOUSING' | 'FOOD' | 'MEDICAL' | 'INCOME' | 'TAX' | 'DEBT' | 'MISC';
  amount: number; // 正数为收入，负数为支出
  description: string;
  dayOfWeek: number; // 1-7
}

export interface VitalityState {
  metrics: VitalityMetrics;
  identity: VitalityIdentity;
  flags: VitalityFlags;
  
  // ✅ 新增：时间与账本
  time: {
    week: number;      // 第几周
    dayOfWeek: number; // 1-7 (用于UI显示当前是周几)
  };
  
  ledger: {
    history: LedgerRecord[]; // 本周的所有流水
  };
}

// 2. 身份与意识形态
export interface VitalityIdentity {
  currentClass: PlayerClass;
  points: {
    red: number;  // 革命/激进
    wolf: number; // 资本/狼性
    old: number;  // 保守/旧世界
  };
}

// 3. 状态标记
export interface VitalityFlags {
  isHomeless: boolean;
  debtDays: number;
  hiddenTags: string[]; // 统一存放如 "HAS_KEY", "MURDERER" 等标签
  [key: string]: any;   // 支持任意自定义标记
}

// 4. 聚合对象：维生状态集
export interface VitalityState {
  metrics: VitalityMetrics;
  identity: VitalityIdentity;
  flags: VitalityFlags;
}

// --- 辅助类型: 深度 Partial ---
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// --- 子系统状态接口 ---

// 银行
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

// 监狱
export interface PrisonState {
  inJail: boolean;
  crime: string;
  sentenceDays: number;
  daysServed: number;
  bailAmount: number;
}

// 信仰
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

// ==========================================
// 4. GameState (主状态)
// ==========================================

export interface GameState {
  // --- 全局环境 ---
  day: number;
  currentRegion: RegionID;
  
  // --- ✅ 维生核心 (替代了原有的 hp, gold, class 等扁平属性) ---
  vitality: VitalityState;

  // --- 资产与库存 ---
  activeJob: Job | null;
  activeHousing: Housing | null;
  activeInsurance: Insurance | null;
  inventory: string[];        // 存放 Item ID
  unlockedArchives: string[]; // 存放 Archive ID
  achievedEndings: string[];  // 存放 Ending ID
  history: string[];          // 历史记录文本

  // --- 核心子系统 ---
  bank: BankState;
  prison: PrisonState;
  faith: FaithState;
  crypto: {
    isAccountOpen: boolean;
    btcPrice: number;
    priceHistory: number[];
    positions: CryptoPosition[];
    dailyNews: NewsItem | null;
  };

  // --- 每日临时状态 (Daily Flux) ---
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  ending: string | null;      // 当前触发的结局 ID (非空则游戏结束)
  dailySummary: {
    revenue: number;
    expenses: number;
    notes: string[];
  } | null;

  // --- UI 状态 ---
  isShopOpen: boolean;
  isInventoryOpen: boolean;
  isArchiveOpen: boolean;
  isMenuOpen: boolean;
  currentRoast: string | null;
  notifications: GameNotification[];
  viewingArchive: string | null;
  _hasHydrated: boolean;
  
  // --- 数据缓存 (Runtime Cache, 非持久化) ---
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
    insurance?: Insurance[];
  };
  
  // --- Actions (由各 Slice 实现并合并) ---
  // 这里只列出通用的，具体由 Slice 定义
  setRegion: (r: RegionID) => void;
  addNotification: (msg: string, type: any) => void;
  setRoast: (t: string | null) => void;
  setViewingArchive: (id: string | null) => void;
  triggerEnding: (id: string) => void;
  
  setShopOpen: (v: boolean) => void;
  setInventoryOpen: (v: boolean) => void;
  setArchiveOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  
  resetPlayerState: () => void;
  processNightlyMarket: (news: NewsItem[]) => { logs: string[], notes: string[] };

  // ✨ 新增通用更新器 (由 createVitalitySlice 实现)
  updateVitality: (updates: DeepPartial<VitalityState>) => void;
}