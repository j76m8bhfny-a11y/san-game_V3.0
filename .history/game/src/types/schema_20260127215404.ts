import { z } from 'zod';

// --- 新增: 区域枚举 ---
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

// --- ✨ 新增: 加密市场相关 Schema ---
// 1. 持仓结构
export const CryptoPositionSchema = z.object({
  id: z.string(),
  type: z.enum(['LONG', 'SHORT']), // 做多 / 做空
  entryPrice: z.number(),          // 开仓价格
  leverage: z.number(),            // 杠杆倍数 (1-100)
  principal: z.number(),           // 本金 (投入的 Gold)
  day: z.number(),                 // 开仓时间 (第几天)
});

// 2. 新闻条目结构
export const NewsItemSchema = z.object({
  id: z.string(),
  text: z.string(),                // 跑马灯文本
  effect: z.number(),              // 价格影响系数 (例如 0.15 代表 +15%)
});

// --- 新增: 工作 Schema ---
export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  region: z.nativeEnum(RegionID),
  salary: z.number(),      // 固定日薪
  sanCost: z.number(),     // 每日San消耗
  requiresAddress: z.boolean().default(false), // 是否需要房产
  requiredVehicle: z.string().optional(),      // 需要的载具Tag (如 VEHICLE_T2)
  requiredClass: z.nativeEnum(PlayerClass).optional(), // 阶级门槛(可选)
  description: z.string(),
});

// --- 新增: 房产 Schema ---
export const HousingSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.nativeEnum(RegionID),
  type: z.enum(['RENT', 'OWN']), // 租赁 或 购买
  price: z.number(),             // 每日租金 或 购买总价
  dailyCost: z.number(),         // 每日维护费/租金
  defenseLevel: z.number(),      // 0-5, 防御灾难账单等级
  description: z.string(),
});

// --- 新增: 医保 Schema ---
export const InsuranceSchema = z.object({
  id: z.string(),
  name: z.string(),
  dailyCost: z.number(),         // 每日订阅费
  coverage: z.enum(['PARTIAL', 'FULL']), // 部分(70%) 或 全免
  description: z.string(),
});

// --- 基础配置 Schema ---
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

// --- 修改: 物品 Schema (增加 region) ---
export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  region: z.nativeEnum(RegionID).optional(), // 👈 新增: 所属区域
  effects: z.object({
    hp: z.number(),
    san: z.number(),
    maxHp: z.number().optional(),
  }),
  activeEffect: z.object({
    type: z.enum(['NONE', 'LOTTERY', 'SURGERY', 'BLOOD_DONATION']),
    params: z.record(z.string(), z.any()) 
  }).optional(),
  // 增加 VEHICLE 相关的 Tag 定义
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
  type: z.enum(['SURPRISE', 'JUMP_SCARE', 'DISASTER', 'MEDICAL', 'LEGAL', 'VEHICLE']), // 👈 扩充类型以便逻辑判断
  weight: z.number().default(10),
  triggerCondition: z.object({
    minGold: z.number().optional(),
    maxGold: z.number().optional(),
    minSan: z.number().optional(),
    requiredClass: z.array(z.nativeEnum(PlayerClass)).optional(),
    isDebtOnly: z.boolean().optional(),
    // 新增: 针对特定资产的触发条件
    hasVehicle: z.string().optional(), // e.g. "VEHICLE_T1"
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
    region: z.nativeEnum(RegionID).optional(), // 👈 新增: 事件发生的区域限制
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

// --- Type Inferences ---
export type GlobalSettings = z.infer<typeof GlobalSettingsSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Archive = z.infer<typeof ArchiveSchema>;
export type Bill = z.infer<typeof BillSchema>;
export type GameEvent = z.infer<typeof EventSchema>;
export type Ending = z.infer<typeof EndingSchema>;
export type Job = z.infer<typeof JobSchema>;
export type Housing = z.infer<typeof HousingSchema>;
export type Insurance = z.infer<typeof InsuranceSchema>;

export interface GameNotification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'GOLD' | 'HP' | 'SAN';
  value?: number;
}

export type CryptoPosition = z.infer<typeof CryptoPositionSchema>;
export type NewsItem = z.infer<typeof NewsItemSchema>;

// 扩展 GameState
export interface GameState {
  day: number;
  hp: number;
  maxHp: number;
  san: number;
  gold: number;
  currentClass: PlayerClass;
  
  // 🗺️ 新增核心状态
  currentRegion: RegionID;
  activeJob: Job | null;
  activeHousing: Housing | null;
  activeInsurance: Insurance | null;

  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  ending: string | null;
  dailySummary: {
    revenue: number;
    expenses: number;
    notes: string[];
  } | null;

  crypto: {
    isAccountOpen: boolean;        // 是否已开户
    btcPrice: number;              // 当前 BTC 价格
    priceHistory: number[];        // 7日价格走势 (用于画图)
    positions: CryptoPosition[];   // 当前持仓列表
    dailyNews: NewsItem | null;    // 今日随机新闻
  };
  
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
  isShopOpen: boolean;
  isInventoryOpen: boolean;
  isArchiveOpen: boolean;
  isMenuOpen: boolean;
  currentRoast: string | null;
  notifications: GameNotification[];
  viewingArchive: string | null;
  _hasHydrated: boolean;
}