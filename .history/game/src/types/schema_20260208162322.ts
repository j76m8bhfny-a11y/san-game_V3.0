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

export enum ActionCode {
  MODIFY_STAT = 'MODIFY_STAT',     
  ADD_ITEM = 'ADD_ITEM',           
  REMOVE_ITEM = 'REMOVE_ITEM',     
  UNLOCK_ARCHIVE = 'UNLOCK_ARCHIVE', 
  CHANCE = 'CHANCE',               
  TRIGGER_EVENT = 'TRIGGER_EVENT', 
  GAME_OVER = 'GAME_OVER'          
}

// ✅ 新增：账本分类与房产类型
export type LedgerCategory = 
  | 'INCOME'    // 工资、卖东西
  | 'HOUSING'   // 房租、房贷、物业费
  | 'FOOD'      // 餐饮、生存消耗
  | 'MEDICAL'   // 医院、药品
  | 'BILL'      // 突发账单
  | 'BANK'      // 银行利息、贷款费用
  | 'TAX'       // 税务
  | 'MISC';     // 其他

export type HousingType = 'RENT' | 'OWN';

// ==========================================
// 2. 核心 Zod Schemas (数据校验)
// ==========================================

// --- 通用动作 Schema ---
// 定义 GameAction 的基础结构（用于递归引用）
interface GameActionBase {
  code: ActionCode;
  params: {
    target?: 'hp' | 'san' | 'gold' | 'maxHp';
    value?: number;
    min?: number;
    max?: number;
    itemId?: string;
    archiveId?: string;
    rate?: number;
    successActions?: GameAction[];
    failActions?: GameAction[];
    endingId?: string;
    [key: string]: unknown; // 允许额外字段
  };
}

export const GameActionSchema: z.ZodType<GameActionBase> = z.lazy(() => z.object({
  code: z.nativeEnum(ActionCode),
  params: z.object({
    target: z.enum(['hp', 'san', 'gold', 'maxHp']).optional(),
    value: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    itemId: z.string().optional(),
    archiveId: z.string().optional(),
    rate: z.number().min(0).max(1).optional(),
    successActions: z.array(GameActionSchema).optional(),
    failActions: z.array(GameActionSchema).optional(),
    endingId: z.string().optional()
  }).passthrough()
}));

export type GameAction = GameActionBase;

// --- ✅ 新增：房产系统 Schema (适配新设计) ---

export const HousingCostItemSchema = z.object({
  key: z.string(),          // "RENT", "TAX", "HOA"
  label: z.string(),        // "租金", "房产税"
  baseAmount: z.number(),   // 基础周费用
  isVariable: z.boolean().optional()
});

export const HousingSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.nativeEnum(RegionID),
  requiredClass: z.nativeEnum(PlayerClass),
  
  // 房产价值（用于计算净资产）
  value: z.number().default(0),
  
  // 租赁配置
  rentConfig: z.object({
    deposit: z.number(),
    weeklyCosts: z.array(HousingCostItemSchema)
  }).optional(),

  // 置业配置
  buyConfig: z.object({
    price: z.number(),
    downPaymentRate: z.number(),
    mortgageTermTurns: z.number(),
    interestRate: z.number(),
    weeklyCosts: z.array(HousingCostItemSchema)
  }).optional(),

  regenHp: z.number(),
  defenseLevel: z.number(),
  description: z.string(),
});

// --- 其他子系统 Schema ---

export const CryptoPositionSchema = z.object({
  id: z.string(),
  type: z.enum(['LONG', 'SHORT']),
  entryPrice: z.number(),
  leverage: z.number(),
  principal: z.number(),
  turn: z.number(), // ✅ Day -> Turn
});

export const NewsItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  effect: z.number(),
});


// ==========================================
// 工作系统定义
// ==========================================

export enum JobType {
  FULL_TIME = 'FULL_TIME', // 全职 (占用2个槽位)
  GIG = 'GIG'              // 零工 (占用1个槽位)
}

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.nativeEnum(JobType), // ✅ 新增：类型
  region: z.nativeEnum(RegionID),
  requiredClass: z.nativeEnum(PlayerClass),
  
  // 薪资与消耗 (周为单位)
  baseSalary: z.number(), 
  hpCost: z.number(),     // 每周消耗 HP
  sanCost: z.number(),    // 每周消耗 SAN (灵视)

  // 限制条件
  requiresHousing: z.boolean(), // 是否需要本地房产
  requiredItem: z.string().optional(), // 比如 "VEHICLE"
  
  description: z.string(),
});

export type Job = z.infer<typeof JobSchema>;



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
  requiredItem: z.string().optional(),
  lockedText: z.string().optional(),
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
      turns: z.number(), // ✅ days -> turns
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
  weight: z.number().optional(), // ✅ 添加事件权重字段
});

export const EndingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.number(),
  type: z.enum(['DEATH', 'SURVIVAL', 'ALIENATION', 'STANCE', 'UR']),
  conditions: z.object({
    minTurn: z.number().optional(), // ✅ Day -> Turn
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

export type Archive = z.infer<typeof ArchiveSchema>;
export type Bill = z.infer<typeof BillSchema>;
export type GameEvent = z.infer<typeof EventSchema>;
export type EventOption = z.infer<typeof EventOptionSchema>;
export type Ending = z.infer<typeof EndingSchema>;
export type Housing = z.infer<typeof HousingSchema>;
export type HousingCostItem = z.infer<typeof HousingCostItemSchema>;
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

/**
 * 信仰 Debuff 效果类型
 *
 * 注意：使用 Record 类型替代索引签名，避免与可选属性冲突
 */
export type FaithDebuffEffect = {
  incomeMultiplier?: number;
  hpDrain?: number;
  sanDrain?: number;
  goldDrain?: number;
} & Record<string, number | boolean | string>;

export interface FaithDebuff {
  id: string;
  name: string;
  duration: number;
  remainingTurns: number;
  effect: FaithDebuffEffect;
}

export interface FaithState {
  id: FaithID;
  level: number;
  hasPerformedRite: boolean;
  debuffs: FaithDebuff[];
  bannedFaiths: FaithID[];
}

// 银行系统接口
export interface LoanProduct {
  id: string;
  name: string;
  provider: string;
  description: string;
  minScore: number;
  weeklyRate: number;
  maxAmount: number;
  termTurns: number;
  color: string;
  riskLevel: string;
}

export interface ActiveLoan {
  id: string;
  productId: string;
  principal: number; // 剩余本金
  interest: number;  // 累积未还利息
  rate: number;      // 锁定利率
  dueTurn: number;   // 到期回合
  overdueTurns: number; // ✅ 新增: 已逾期多少周 (用于判断催收阶段)
  isMortgage: boolean;
}

export interface BankState {
  activeLoans: ActiveLoan[];
  lifetimeInterestPaid: number;
  // creditScore 已移至 Vitality
}

// 监狱系统接口
export interface PrisonState {
  inJail: boolean;
  crime: string;
  sentenceTurns: number; // ✅ Days -> Turns
  turnsServed: number;   // ✅ Days -> Turns
  bailAmount: number;
}

// ==========================================
// 4. ✅ 核心维生系统定义 (Vitality Core)
// ==========================================

export interface LedgerRecord {
  id: string;
  turn: number;
  category: LedgerCategory;
  amount: number;
  description: string;
  timestamp: number;
}

/**
 * 维生指标
 *
 * 注意：移除了索引签名，所有属性必须显式声明
 * 如需添加新属性，请在此接口中定义
 */
export interface VitalityMetrics {
  hp: number;
  maxHp: number;
  san: number;
  maxSan: number;
  gold: number;
  creditScore: number;
  // ✅ 新增
  addiction: number;
  resistance: number;
  hunger: number;
  maxHunger: number;
}

export interface VitalityIdentity {
  currentClass: PlayerClass;
  points: {
    red: number;
    wolf: number;
    old: number;
  };
}

export interface VitalityState {
  metrics: VitalityMetrics;
  identity: VitalityIdentity;
  time: {
    currentTurn: number;
    totalTurns: number;
  };
  // ✅ 新增
  activeDiseases: string[]; // 存疾病 ID
  
  ledger: {
    history: LedgerRecord[];
  };
  flags: {
    isHomeless: boolean;
    debtTurns: number;
    hiddenTags: string[];
    [key: string]: any;
  };
  activeJobs: string[];
}

// ==========================================
// 5. ✅ 全局 GameState (根状态)
// ==========================================

// 玩家当前持有的房产状态 (运行时)
export interface ActiveHousingState {
  definitionId: string;
  type: HousingType;
  name: string;
  region: RegionID;
  
  loanId?: string;      // 关联房贷
  defenseLevel: number;
  regenHp: number;
  weeklyCosts: HousingCostItem[]; // 该房产的周费用明细
}

// 单一房产存储结构: 玩家同时只能拥有一处房产（租赁或购买）
export type ActiveHousing = ActiveHousingState | null;

/**
 * 纯数据接口：游戏状态（不包含方法）
 *
 * 注意：此接口仅定义数据结构，方法由各个 Slice 提供
 * 完整的 Store 类型请参考 @/types/store 中的 StoreState
 */
export interface GameState {
  // ✅ 维生核心 (取代原有的 hp, gold, day)
  vitality: VitalityState;

  // 物理位置
  currentRegion: RegionID;

  // 核心子系统状态
  bank: BankState;
  prison: PrisonState;
  faith: FaithState;
  crypto: {
    isAccountOpen: boolean;
    btcPrice: number;
    priceHistory: number[];
    positions: CryptoPosition[];
    weeklyNews: NewsItem | null;
  };

  // 资产与库存
  activeHousing: ActiveHousing;
  activeInsurance: ActiveInsuranceState | null;
  
  inventory: string[];
  history: string[]; // 文本历史记录
  unlockedArchives: string[];
  achievedEndings: string[];
  
  // UI 状态
  isShopOpen: boolean;
  isInventoryOpen: boolean;
  isArchiveOpen: boolean;
  isMenuOpen: boolean;
  currentRoast: string | null;
  notifications: GameNotification[];
  viewingArchive: string | null;
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  ending: string | null;
  
  _hasHydrated: boolean;
}
/**
 * 游戏数据缓存类型（运行时，不持久化）
 */
export interface GameDataCache {
  // 原始数据
  items: Item[];
  events: GameEvent[];
  bills: Bill[];
  archives: Archive[];
  endings: Ending[];
  classes: any[];
  global: any;
  jobs: Job[];
  housing: Housing[];
  insurance: Insurance[];
  news: NewsItem[];
  diseases: Disease[];
  
  // 索引映射（用于快速查找，可选字段）
  classMap?: Record<string, any>;
  itemMap?: Map<string, Item>;
  eventMap?: Map<string, GameEvent>;
  billMap?: Map<string, Bill>;
  archiveMap?: Map<string, Archive>;
  endingMap?: Map<string, Ending>;
  jobMap?: Map<string, Job>;
}

export interface WeeklyReport {
  turn: number;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  records: LedgerRecord[];
  summaryByCategory: Record<string, number>;
}

export enum ItemType {
  CONSUMABLE = 'CONSUMABLE', // 消耗品 (点击使用, 消失)
  PASSIVE = 'PASSIVE',       // 被动 (在包里生效, 不可使用)
  KEY = 'KEY',               // 剧情道具 (不可出售/使用, 解锁Event)
  ENDING = 'ENDING'          // 结局道具
}

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  // 默认为消耗品，兼容旧数据
  type: z.nativeEnum(ItemType).default(ItemType.CONSUMABLE), 
  price: z.number(),
  
  // 区域控制：数组表示可以在多个区域卖；不填表示全区域；空数组表示非卖品
  regions: z.array(z.nativeEnum(RegionID)).optional(), 
  
  effects: z.object({
    hp: z.number().optional(),
    san: z.number().optional(),
    maxHp: z.number().optional(),
    addiction: z.number().optional(),   // 增加成瘾度
    resistance: z.number().optional(),  // 增加耐药性
    // 政治倾向整合
    points: z.object({
        red: z.number().optional(),
        wolf: z.number().optional(),
        old: z.number().optional()
    }).optional(),
    hunger: z.number().optional()
  }).optional(),

  activeEffect: z.object({
    type: z.string(), 
    params: z.record(z.string(), z.any()) 
  }).optional(),

  tags: z.array(z.string()), 
  flavorText: z.string(),
});

export type Item = z.infer<typeof ItemSchema>;

// ==========================================
// 🏥 医院与生理系统 (New)
// ==========================================

// --- 1. 疾病系统 ---
export type DiseaseType = 'ACUTE' | 'CHRONIC' | 'MENTAL'; // 急性(急诊), 慢性(持续扣血), 精神

export const DiseaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['ACUTE', 'CHRONIC', 'MENTAL']),
  severity: z.number(), // 1-10
  effects: z.object({
    hpDrain: z.number().optional(),      // 每周扣血
    sanDrain: z.number().optional(),     // 每周扣San
    statDebuff: z.string().optional(),   // 特殊Debuff标识
  }),
  cureCondition: z.object({
    requiredServiceTags: z.array(z.string()).optional(), // 需要哪类手术标签
    minDrugTier: z.number().optional(),  // 需要几级药
  }).optional(),
  description: z.string(),
});

export type Disease = z.infer<typeof DiseaseSchema>;

// --- 2. 医疗服务配置 ---
export const MedicalServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.nativeEnum(RegionID), // 归属区域
  type: z.enum(['DRUG', 'SURGERY', 'THERAPY', 'SPECIAL', 'EMERGENCY']), // 新增 EMERGENCY
  
  baseCost: z.number(), // 基础费用 (负数代表卖器官赚钱)
  
  // 治疗效果
  effects: z.object({
    cureDiseases: z.array(z.string()).optional(), // 治愈特定ID的病
    cureType: z.array(z.enum(['ACUTE', 'CHRONIC', 'MENTAL'])).optional(), // 治愈某类病
    hpRestore: z.number().optional(),
    sanRestore: z.number().optional(),
    addiction: z.number().optional(), // 增加成瘾度
    hpCapMod: z.number().optional(),  // 修改生命上限 (卖肾-30)
    statMod: z.record(z.string(), z.number()).optional(), // 其他属性修改
  }).optional(),

  // 购买限制
  requirements: z.object({
    minAddiction: z.number().optional(), // 瘾君子限定
    maxAddiction: z.number().optional(), // 耐药性检查
    waitTurns: z.tuple([z.number(), z.number()]).optional(), // 排队区间 [min, max]
    riskRate: z.number().optional(), // 失败/副作用概率
    requiredClass: z.array(z.nativeEnum(PlayerClass)).optional(), // 阶级限制
  }).optional(),

  // 保险配置
  insurance: z.object({
    isCovered: z.boolean(),       // 是否在医保目录
    baseCopayRate: z.number(),    // 基础自付比例 (0.2 = 自己付20%)
    isHiddenInfo: z.boolean().optional(), // 是否隐藏报销详情(坑)
  }),
  
  flavorText: z.string(),
});

export type MedicalService = z.infer<typeof MedicalServiceSchema>;

// --- 3. 保险产品升级 ---
// 覆盖原有的 InsuranceSchema
export const InsuranceSchema = z.object({
  id: z.string(),
  name: z.string(),
  allowedClasses: z.array(z.nativeEnum(PlayerClass)), // 谁能买
  weeklyCost: z.number(),
  
  // 报销能力
  coverage: z.object({
    copayModifier: z.number(), // 自付比例修正 (0.0 = 全额报销, 1.0 = 无报销)
    emergencyCovered: z.boolean(), // 是否包急诊
    mentalCovered: z.boolean(),    // 是否包精神科
    addictionCovered: z.boolean(), // 是否包成瘾治疗
  }),
  description: z.string(),
});

export type Insurance = z.infer<typeof InsuranceSchema>;

// --- ✅ 新增: 运行时保险状态 ---
export interface ActiveInsuranceState {
  id: string;
  name: string;
  type: 'MEDICAL' | 'LIFE' | 'PROPERTY';
  coverage: Insurance['coverage']; // 复用覆盖范围定义
  premium: number;      // 对应 weeklyCost
  renewalTurn: number;  // 下次续费/过期的回合
}

export interface ActiveJobState {
  id: string;
  title: string;
  baseSalary: number;
  sanCost: number;
  region: RegionID;
}

// ActiveInsuranceState 已在第 675 行定义，此处不再重复