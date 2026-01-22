import { z } from 'zod';

export enum PlayerClass {
  Homeless = 'HOMELESS',
  Worker = 'WORKER',
  Middle = 'MIDDLE',
  Capitalist = 'CAPITALIST'
}
export enum ScalingMode {
  FIXED = 'FIXED',             // 固定值 (捡钱)
  CLASS_LEVERAGE = 'LEVERAGE', // 阶级杠杆 (工作收入)
  INCOME_RATIO = 'INCOME',     // 收入比例 (罚款/税)
}
// --- Zod Schemas ---

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  effects: z.object({
    hp: z.number(),
    san: z.number(),
    maxHp: z.number().optional(),
  }),
  tags: z.array(z.enum(['CONSUMER', 'AWAKENING', 'DARK_WEB', 'WEAPON', 'TICKET'])),
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
  type: z.enum(['SURPRISE', 'JUMP_SCARE']),
  weight: z.number().default(10),
  triggerCondition: z.object({
    minGold: z.number().optional(),
    maxGold: z.number().optional(),
    minSan: z.number().optional(),
    requiredClass: z.array(z.nativeEnum(PlayerClass)).optional(),
    isDebtOnly: z.boolean().optional(),
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
});

// --- Type Inferences ---

export type Item = z.infer<typeof ItemSchema>;
export type Archive = z.infer<typeof ArchiveSchema>;
export type Bill = z.infer<typeof BillSchema>;
export type GameEvent = z.infer<typeof EventSchema>;
export type Ending = z.infer<typeof EndingSchema>;

// --- Game State Definition ---

export interface GameNotification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'GOLD' | 'HP' | 'SAN';
  value?: number;
}

export interface GameState {
  // 基础数值
  day: number;
  hp: number;
  maxHp: number;
  san: number;
  gold: number;
  currentClass: PlayerClass;
  
  // 动态数据
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  ending: string | null;
  
  // 每日结算数据
  dailySummary: {
    revenue: number;
    expenses: number;
    notes: string[];
  } | null;

  // 库存与记录
  inventory: string[];
  history: string[];
  unlockedArchives: string[];
  achievedEndings: string[]; // 👈 [关键] 必须有这个字段

  // 核心逻辑标记
  flags: {
    isHomeless: boolean;
    debtDays: number;
    hasRedBook: boolean;
    hasCryptoKey: boolean;
    [key: string]: any;
  };

  // 觉醒积分
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
  viewingArchive: string | null; // 👈 [关键] 必须有这个字段

  // System
  _hasHydrated: boolean;
}