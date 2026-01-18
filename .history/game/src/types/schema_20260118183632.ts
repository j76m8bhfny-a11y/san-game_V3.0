// src/types/schema.ts
import { z } from 'zod';

export enum PlayerClass {
  Homeless = 'HOMELESS',
  Worker = 'WORKER',
  Middle = 'MIDDLE',
  Capitalist = 'CAPITALIST'
}

// [新增] 缩放模式枚举：决定选项金钱的计算方式
export enum ScalingMode {
  FIXED = 'FIXED',           // 固定数值 (B选项：羊群效应)
  CLASS_LEVERAGE = 'LEVERAGE', // 阶级杠杆 (A选项：公知/卖命)
  INCOME_RATIO = 'INCOME',     // 收入比例 (C/D选项：买命/觉醒)
}

// --- Zod Schemas ---

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  effects: z.object({
    hp: z.number(),
    san: z.number(),
    gold: z.number().optional(), // [新增] 卖血/彩票获得的钱
    maxHp: z.number().optional(), // [新增] 扣除血上限
    debtClear: z.boolean().optional(), // [新增] 清空债务
    lotteryWinRate: z.number().optional(), // [新增] 彩票中奖率
    lotteryWinAmount: z.number().optional(), // [新增] 彩票奖金
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
});

export const BillSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  type: z.enum(['SURPRISE', 'JUMP_SCARE']),
  triggerCondition: z.object({
    minGold: z.number().optional(),
    maxGold: z.number().optional(),
    requiredClass: z.array(z.nativeEnum(PlayerClass)).optional(),
    isDebtOnly: z.boolean().optional(),
  }),
  flavorText: z.string(),
});

export const EventOptionSchema = z.object({
  label: z.string(),
  effects: z.object({
    hp: z.number().optional(),
    gold: z.number().optional(), // 这里填基础值或比例系数 (如 300 或 -0.2)
    san: z.number().optional(),
    // [新增] 缩放模式，默认为固定数值
    scaling: z.nativeEnum(ScalingMode).default(ScalingMode.FIXED),
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

export interface GameState {
  day: number;
  hp: number;
  maxHp: number;
  san: number;
  gold: number;
  currentClass: PlayerClass;
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  ending: string | null;
  inventory: string[];
  history: string[];
  unlockedArchives: string[];
  flags: {
    isHomeless: boolean;
    debtDays: number;
    hasRedBook: boolean;
    hasCryptoKey: boolean;
  };
  points: {
    red: number;
    wolf: number;
    old: number;
  };
  _hasHydrated: boolean;
}