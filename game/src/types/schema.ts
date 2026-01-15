import { z } from 'zod';

export enum PlayerClass {
  Homeless = 'HOMELESS',
  Worker = 'WORKER',
  Middle = 'MIDDLE',
  Capitalist = 'CAPITALIST'
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

/**
 * 事件选项 Schema (修正版)
 * 新增: items 字段，支持获得(正数)或失去(负数)物品
 */
export const EventOptionSchema = z.object({
  label: z.string(),
  effects: z.object({
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
    // [Ω-Fix] 新增 deathReason，用于精确触发特定死亡结局 (如 ED-04)
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
    // [Ω-Fix] 新增 hasItem 条件，防止 JSON 加载崩溃
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
export type Bill = z.infer<typeof BillSchema>;
export type GameEvent = z.infer<typeof EventSchema>;
export type Ending = z.infer<typeof EndingSchema>;

// --- 🚨 [Omega Patch] Global State Definition ---
// 这里定义 GameState，供 Store 和 Logic 统一引用，防止循环依赖
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
  ending: string | null; // Ending ID

  // 库存与记录
  inventory: string[]; // Item IDs
  history: string[];   // Log strings
  unlockedArchives: string[]; // Archive IDs

  // 核心逻辑标记 (Flags)
  flags: {
    isHomeless: boolean;
    debtDays: number;     // 债务计数器
    hasRedBook: boolean;  // 红书 (Red)
    hasCryptoKey: boolean;// 密钥 (Wolf)
  };

  // 觉醒积分 (Stance)
  points: {
    red: number;
    wolf: number;
    old: number;
  };

  // System
  _hasHydrated: boolean; // Hydration Gate
}