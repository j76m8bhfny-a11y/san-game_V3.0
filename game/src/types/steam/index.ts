/**
 * Steam 集成类型定义
 * 
 * 对应 Rust 后端的 steam 模块
 */

// ==================== 基础类型 ====================

/** Steam 连接状态 */
export type SteamState = 
  | 'Uninitialized' 
  | 'Initializing' 
  | 'Connected' 
  | { Failed: { reason: string } };

/** Steam 初始化结果 */
export interface SteamInitResult {
  success: boolean;
  state: SteamState;
  steam_id: string | null;
  player_name: string | null;
  error_message: string | null;
}

/** 玩家信息 */
export interface SteamPlayerInfo {
  steamId: string;
  playerName: string;
}

// ==================== 成就类型 ====================

/** 成就定义 */
export interface Achievement {
  /** 成就唯一ID（必须与 Steamworks 后台配置一致） */
  id: string;
  /** 成就名称（显示用） */
  name: string;
  /** 成就描述 */
  description: string;
  /** 是否已解锁 */
  unlocked: boolean;
  /** 解锁时间（Unix 时间戳） */
  unlock_time: number | null;
  /** 是否是进度型成就 */
  is_progressive: boolean;
  /** 当前进度（如果是进度型） */
  current_progress: number;
  /** 最大进度（如果是进度型） */
  max_progress: number;
}

/** 成就解锁事件 */
export interface AchievementUnlockEvent {
  achievement_id: string;
  achievement_name: string;
  achievement_description: string;
  unlock_time: number;
}

/** 成就进度（本地存储） */
export interface AchievementProgress {
  achievement_id: string;
  current_progress: number;
  max_progress: number;
}

// ==================== 云存档类型 ====================

/** 存档文件元数据 */
export interface SaveFileInfo {
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** 修改时间（Unix 时间戳） */
  timestamp: number;
  /** 是否存在云端 */
  exists_in_cloud: boolean;
}

/** 
 * 游戏存档数据结构
 * 字段命名统一：与本地存档保持一致，使用 camelCase
 */
export interface SaveData {
  /** 存档版本（用于兼容性检查） */
  version: string;
  /** 存档槽位 (1-3 手动, 0 自动) */
  slot: number;
  /** 游戏天数 (对应 vitality.time.currentTurn) */
  gameDay: number;
  /** 玩家社会阶层 (对应 vitality.identity.currentClass) */
  currentClass: string;
  /** 玩家资产/金钱 (对应 vitality.metrics.gold) */
  gold: number;
  /** 玩家健康值/HP (对应 vitality.metrics.hp) */
  hp: number;
  /** 玩家理智值/灵视 (对应 vitality.metrics.insight) */
  insight: number;
  /** 已触发事件列表 (对应 vitality.flags.triggeredEvents) */
  triggeredEvents: string[];
  /** 存档创建时间 (对应 saveTime) */
  saveTime: number;
  /** 存档修改时间 */
  modifiedAt: number;
  /** 已解锁成就进度（本地缓存） */
  achievementProgress: AchievementProgress[];
  /** 额外游戏数据（灵活扩展） */
  extraData?: Record<string, unknown>;
}

/** 云存档同步结果 */
export interface CloudSyncResult {
  success: boolean;
  uploaded_files: string[];
  downloaded_files: string[];
  conflict_files: string[];
  error_message: string | null;
}

// ==================== Rich Presence 类型 ====================

/** 游戏状态枚举 */
export type GameState =
  | 'MainMenu'
  | 'PlayingSlums'
  | 'PlayingWorker'
  | 'PlayingMiddle'
  | 'PlayingCapitalist'
  | 'InEvent'
  | 'Paused'
  | 'GameOver';

/** Rich Presence 数据 */
export interface RichPresenceData {
  /** 当前游戏状态 */
  state: GameState;
  /** 游戏天数 */
  game_day: number;
  /** 社会阶层 */
  social_class: string;
  /** 当前事件名称（如果处于事件中） */
  current_event?: string;
  /** 玩家资产 */
  money?: number;
  /** 是否可加入（预留多人模式） */
  joinable: boolean;
}

// ==================== 游戏状态到 Rich Presence 的映射 ====================

export const GameStateMapping: Record<GameState, { displayName: string; iconKey: string }> = {
  MainMenu: { displayName: '在主菜单', iconKey: 'menu' },
  PlayingSlums: { displayName: '在贫民窟挣扎求存', iconKey: 'slums' },
  PlayingWorker: { displayName: '在工人区努力打拼', iconKey: 'worker' },
  PlayingMiddle: { displayName: '在郊区还房贷', iconKey: 'middle' },
  PlayingCapitalist: { displayName: '在商业区收割财富', iconKey: 'capitalist' },
  InEvent: { displayName: '面临人生抉择', iconKey: 'event' },
  Paused: { displayName: '游戏暂停中', iconKey: 'paused' },
  GameOver: { displayName: '人生落幕', iconKey: 'gameover' },
};

// ==================== 成就预定义列表 ====================

export const ACHIEVEMENTS_DEFINITION: Omit<Achievement, 'unlocked' | 'unlock_time'>[] = [
  {
    id: 'ACH_FIRST_BLOOD',
    name: '第一课',
    description: '在游戏中经历第一次死亡',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
  {
    id: 'ACH_SURVIVE_7D',
    name: '一周战士',
    description: '在街头生存 7 天',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
  {
    id: 'ACH_SURVIVE_30D',
    name: '月度生存者',
    description: '在街头生存 30 天',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
  {
    id: 'ACH_HOMELESS_ESCAPE',
    name: '破茧成蝶',
    description: '成功脱离 homeless 阶层',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
  {
    id: 'ACH_WORKER_REBEL',
    name: '觉醒时刻',
    description: '作为 worker 触发工会事件',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
  {
    id: 'ACH_MIDDLE_MORTGAGE',
    name: '房奴人生',
    description: '背负 30 年房贷',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
  {
    id: 'ACH_CAPITALIST_FIRST_MILLION',
    name: '第一桶金',
    description: '累计资产突破 100 万',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
  {
    id: 'ACH_IRONIC_ENDING',
    name: '黑色幽默',
    description: '触发讽刺性结局',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
  {
    id: 'ACH_EVENT_COLLECTOR',
    name: '百科全书',
    description: '体验过所有 100+ 事件',
    is_progressive: true,
    current_progress: 0,
    max_progress: 100,
  },
  {
    id: 'ACH_ALL_CLASSES',
    name: '人生百态',
    description: '体验过所有社会阶层',
    is_progressive: false,
    current_progress: 0,
    max_progress: 0,
  },
];
