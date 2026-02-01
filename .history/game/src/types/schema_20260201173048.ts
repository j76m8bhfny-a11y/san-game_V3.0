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

// 动作类型 (用于 JSON 驱动逻辑)
export enum ActionCode {
  MODIFY_STAT = 'MODIFY_STAT',     // 修改数值
  ADD_ITEM = 'ADD_ITEM',           // 获得物品
  REMOVE_ITEM = 'REMOVE_ITEM',     // 移除物品
  UNLOCK_ARCHIVE = 'UNLOCK_ARCHIVE', // 解锁档案
  CHANCE = 'CHANCE',               // 概率分支
  TRIGGER_EVENT = 'TRIGGER_EVENT', // 强制触发事件
  GAME_OVER = 'GAME_OVER',         // 结局
  ADD_TRANSACTION = 'ADD_TRANSACTION' // ✨ 新增: 记账动作
}

// ✨ 新增: 账本分类
export type LedgerCategory = 
  | 'INCOME'    // 工资、卖东西
  | 'HOUSING'   // 房租
  | 'FOOD'      // 吃饭、生存消耗
  | 'MEDICAL'   // 医院、药品
  | 'BILL'      // 突发账单
  | 'BANK'      // 银行利息、贷款
  | 'TAX'       // 税务
  | 'MISC';     // 其他

// ==========================================
// 2. 维生系统核心定义 (Vitality Core)
// ==========================================

// 账本记录
export interface LedgerRecord {
  id: string;        // 唯一ID
  turn: number;      // 发生在哪一周
  category: LedgerCategory;
  amount: number;    // 正数=收入，负数=支出
  description: string;
  timestamp: number; // 真实时间戳
}

// 基础数值
export interface VitalityMetrics {
  hp: number;
  maxHp: number;
  san: number;
  maxSan: number;
  gold: number;
  [key: string]: number; // 支持扩展 (如 hunger, radiation)
}

// 身份与政治倾向
export interface VitalityIdentity {
  currentClass: PlayerClass;
  points: {
    red: number;  // 革命/激进
    wolf: number; // 资本/狼性
    old: number;  // 保守/旧世界
  };
}

// 隐藏标记与状态
export interface VitalityFlags {
  isHomeless: boolean;
  debtTurns: number;    // 负债持续回合数
  hiddenTags: string[]; // 如 "HAS_KEY", "MURDERER"
  [key: string]: any;   // 自定义标记
}

// ✨ 聚合对象：维生系统状态
export interface VitalityState {
  // --- 核心数值 ---
  metrics: VitalityMetrics;
  
  // --- 身份 ---
  identity: VitalityIdentity;
  
  // --- 时间 (回合制) ---
  time: {
    currentTurn: number; // 当前周数 (1, 2, 3...)
    totalTurns: number;  // 游戏总时长限制 (如 52 周)
  };

  // --- 账本 (本周流水) ---
  ledger: {
    history: LedgerRecord[]; // 仅记录本周，结算后清空或存档
  };

  // --- 标记 ---
  flags: VitalityFlags;
}

// ==========================================
// 3. 核心 Zod Schemas (数据校验)
// ==========================================

// 通用动作 Schema
export const GameActionSchema: z.ZodType<any> = z.lazy(() => z.object({
  code: z.nativeEnum(ActionCode),
  params: z.object({
    target: z.enum(['hp', 'san', 'gold', 'maxHp', 'maxSan']).optional(),
    value: z.number().optional(),
    category: z.string().optional(), // for ADD_TRANSACTION
    description: z.string().optional(), // for ADD_TRANSACTION
    
    itemId: z.string().optional(),
    archiveId: z.string().optional(),
    
    rate: z.number().min(0).max(1).optional(),
    successActions: z.array(GameActionSchema).optional(),
    failActions: z.array(GameActionSchema).optional(),
    
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
  day: z.number(), // 这里指建仓时的 turn
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
  salary: z.number(), // 周薪
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
  price: z.number(),     // 购买价格
  dailyCost: z.number(), // 周租金 (虽然字段名叫 dailyCost，逻辑上我们会当作 weeklyCost 处理，或者改名)
  defenseLevel: z.number(),
  description: z.string(),
});

export const InsuranceSchema = z.object({
  id: z.string(),
  name: z.string(),
  dailyCost: z.number(), // 周费
  coverage: z.enum(['PARTIAL', 'FULL']),
  description: z.string(),
});

export const GlobalSettingsSchema = z.object({
  gameRules: z.object({
    maxDays: z.number(), // 实际上是 maxTurns
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
    gold: z.number().optional(), // 这里的 gold 变动也会被转化为 Transaction
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
      days: z.number(), // 指 turns
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
    minDay: z.number().optional(), // minTurn
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
// 4. TypeScript 类型推导与状态接口
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
  dailyRate: number; // 周息率
  maxAmount: number;
  termDays: number;  // termTurns
  color: string;
  riskLevel: string;
}

export interface ActiveLoan {
  id: string;
  productId: string;
  principal: number;
  interest: number;
  rate: number;
  dueDate: number; // dueTurn
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
  sentenceDays: number; // sentenceTurns
  daysServed: number;   // turnsServed
  bailAmount: number;
}

// 加密货币状态接口
export interface CryptoState {
  isAccountOpen: boolean;
  btcPrice: number;
  priceHistory: number[];
  positions: CryptoPosition[];
  dailyNews: NewsItem | null; // weeklyNews
}

// --- 游戏主状态 (State) ---
export interface GameState {
  // ✅ 1. 维生系统 (核心状态)
  vitality: VitalityState;
  
  // ✅ 2. 物理位置
  currentRegion: RegionID;
  
  // ✅ 3. 资产与库存 (保留在根节点以便 UI 访问)
  activeJob: Job | null;
  activeHousing: Housing | null;
  activeInsurance: Insurance | null;
  inventory: string[]; // Item IDs

  // ✅ 4. 子系统状态
  bank: BankState;
  prison: PrisonState;
  faith: FaithState;
  crypto: CryptoState;

  // ✅ 5. 临时与 UI 状态
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  ending: string | null;
  
  isShopOpen: boolean;
  isInventoryOpen: boolean;
  isArchiveOpen: boolean;
  isMenuOpen: boolean;
  currentRoast: string | null;
  
  notifications: GameNotification[];
  viewingArchive: string | null;
  history: string[]; // 文本日志历史
  unlockedArchives: string[];
  achievedEndings: string[];
  
  _hasHydrated: boolean;
  
  // ✅ 6. 数据缓存 (不持久化)
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
    housing?: Housing[];
    jobs?: Job[];
    insurance?: Insurance[];
  };
  
  // Update helpers
  setRegion: (r: RegionID) => void;
  addNotification: (msg: string, type: any) => void;
  // updatePlayerStats 已废弃，请使用 updateVitality 或 addTransaction
  
  setRoast: (t: string | null) => void;
  setViewingArchive: (id: string | null) => void;
  triggerEnding: (id: string) => void;
  
  // UI setters
  setShopOpen: (v: boolean) => void;
  setInventoryOpen: (v: boolean) => void;
  setArchiveOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  
  // Slices actions (reference)
  resetPlayerState: () => void;
  processNightlyMarket: (news: NewsItem[]) => { logs: string[], notes: string[] };
}