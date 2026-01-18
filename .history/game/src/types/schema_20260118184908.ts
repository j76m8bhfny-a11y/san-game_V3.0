// 定义玩家阶级枚举
export enum PlayerClass {
  Homeless = 'Homeless',
  Worker = 'Worker',
  Middle = 'Middle',
  Capitalist = 'Capitalist'
}

// 物品接口
export interface Item {
  id: string;
  name: string;
  price: number;
  flavorText: string; // 物品描述/梗
  unlockCondition?: any; // 解锁条件 (如 "Gold < -2000")
  effects: {
    hp?: number;
    san?: number;
    maxHp?: number;
    gold?: number;
  };
  tags: string[]; // 例如 ["food", "drug", "special"]
}

// 账单接口
export interface Bill {
  id: string;
  name: string;
  amount: number; // 正数为收入，负数为支出
  flavorText: string;
  triggerCondition?: string; // 例如 "Gold > 2000"
}

export interface GameNotification {
  id: string;
  type: 'GOLD' | 'HP' | 'SAN';
  value: number;
  message: string;
}

// 事件选项接口
export interface Option {
  label: string;
  description?: string;
  
  // ✅ 新增: 专属吐槽文案 (可选)
  // 当玩家选择此选项时，顶部灵动岛会弹出这句话
  roast?: string;

  // 选项锁 (可选)
  sanLock?: number; // 需要 SAN 值大于此值才可见/解锁
  
  effects: {
    hp?: number;
    san?: number;
    gold?: number;
    
    // 物品变动
    items?: { 
      itemId: string; 
      count: number; // 正数为获得，负数为失去
    }[];
    
    // 信仰/倾向值变动
    points?: {
      red?: number;  // 革命/反骨
      wolf?: number; // 资本/利己
      old?: number;  // 古神/癫狂
    };
    
    // 特殊死亡判定
    deathReason?: string; // 如果选了这项导致死亡，显示的结局ID
  };
  
  // 关联档案 (可选)
  archiveId?: string; // 选择后解锁的档案ID
}

// 游戏事件接口
export interface GameEvent {
  id: string;
  title: string;
  // 文本根据 SAN 值不同而变化
  text: {
    highSan: string; // SAN > 50 显示
    lowSan: string;  // SAN <= 50 显示 (通常更疯狂)
  };
  options: {
    A: Option;
    B: Option;
    C: Option;
    D: Option; // 通常是特殊选项 (觉醒/疯狂)
  };
  // 事件触发条件
  conditions?: {
    minClass?: PlayerClass;
    maxClass?: PlayerClass;
    minSan?: number;
    maxSan?: number;
    requiredItem?: string;
  };
}

// 档案/黑匣子内容接口
export interface Archive {
  id: string;
  title: string;
  content: string; // 核心扎心文案
  image?: string;  // 配图路径
  unlocked: boolean;
}

// 结局接口
export interface Ending {
  id: string;
  title: string;
  description: string; // 结局文本
  condition: string;   // 判定逻辑描述 (仅供开发参考)
  type: 'DEAD' | 'ALIVE' | 'INSANE' | 'TRUE' | 'UR'; 
}

// 每日结算数据 (用于 DailySettlement 组件)
export interface DailySummary {
  income: number;
  expense: number;
  class: PlayerClass;
}

// 核心游戏状态接口 (Zustand Store 使用)
export interface GameState {
  // 基础数值
  day: number;
  hp: number;
  maxHp: number;
  san: number;
  gold: number;
  currentClass: PlayerClass;

  // 当前交互状态
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  ending: string | null;
  
  // 玩家资产
  inventory: string[];
  history: string[];
  unlockedArchives: string[];

  // 特殊标记 flags
  flags: {
    isHomeless: boolean;
    debtDays: number;
    hasRedBook: boolean;
    hasCryptoKey: boolean;
    [key: string]: any;
  };

  // 信仰/倾向点数
  points: {
    red: number;
    wolf: number;
    old: number;
  };

  // UI 状态开关
  isShopOpen: boolean;
  isMenuOpen: boolean;
  isArchiveOpen: boolean;
  // ✅ 新增: 修复 InventorySidebar 报错
  isInventoryOpen: boolean; 
  // ✅ 新增: 修复 store 中 viewingArchive 报错
  viewingArchive: string | null;
  
  // 内部状态
  _hasHydrated: boolean;
  
  // 最近一次动作类型
  lastAction: {
    type: 'NONE' | 'INCOME' | 'PAYMENT' | 'DAMAGE' | 'HEAL' | 'INSANITY';
    id: number;
  };
  
  // 当前正在显示的吐槽
  currentRoast: string | null;
}