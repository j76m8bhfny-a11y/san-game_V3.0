# 游戏存档格式文档

> 本文档描述游戏存档的数据结构和版本信息，用于开发和维护。

## 存储位置

- **本地存档**: `localStorage['pixel-life-storage']`
- **云存档**: Steam Cloud (`save_slot_1.json`, `autosave.json` 等)

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0 | 2026-03-05 | 初始版本，添加 `saveVersion` 和 `saveTime` 字段 |
| - | 之前 | v0: 无版本号的老存档 |

---

## 存档结构 (v1.0)

```typescript
{
  // ========================================
  // 0. 存档元数据（v1.0 新增）
  // ========================================
  saveVersion: "1.0",           // 存档数据结构版本
  saveTime: number,             // 保存时间戳 (Unix ms)

  // ========================================
  // 1. 核心维生数据 (vitality)
  // ========================================
  vitality: {
    metrics: {
      gold: number,             // 金钱
      hp: number,               // 生命值 (0-100)
      maxHp: number,            // 最大生命值
      insight: number,          // 灵视/觉醒值 (0-100)
      maxInsight: number,       // 灵视上限
      hunger: number,           // 饱腹度 (0-100)
      maxHunger: number,        // 饱腹度上限
      creditScore: number,      // 信用分 (300-850)
      addiction: number,        // 成瘾值 (0-100)
      resistance: number,       // 药物抗性
    },
    identity: {
      currentClass: string,     // 当前阶级: "HOMELESS" | "WORKER" | "MIDDLE" | "CAPITALIST"
      points: {
        red: number,            // 红派点数
        wolf: number,           // 狼派点数
        old: number,            // 老派点数
      }
    },
    time: {
      currentTurn: number,      // 当前回合（第几周）
      totalTurns: number,       // 总回合数
    },
    activeDiseases: string[],   // 当前疾病ID列表
    activeBuffs: Array<{
      id: string;
      name: string;
      endTurn: number;
      effects: Record<string, any>;
    }>,
    ledger: {
      history: Array<{
        id: string;
        turn: number;
        category: string;
        amount: number;
        description: string;
        timestamp: number;
      }>
    },
    flags: {
      isHomeless: boolean,
      debtTurns: number,
      hasFelonyRecord: boolean,
      felonyRecordTurn: number | null,
      insuranceSuspended: boolean,
      triggeredEvents: string[],
      hiddenTags: string[],
    },
    activeJobs: Array<{
      jobId: string;
      startTurn: number;
    }>,
    activeInsurances: Array<{
      id: string;
      type: string;
      expiryTurn: number;
    }>,
    pendingMedicalBills: Array<any>,    // 延迟医疗账单
    deductibleTrackers: Array<any>,     // 免赔额追踪器
    medicalAppointments: Array<any>,    // 医疗预约
  },

  // ========================================
  // 2. 玩家资产与位置
  // ========================================
  currentRegion: string,        // 当前区域: "SLUMS" | "RUST_BELT" | "SUBURBS" | "DOWNTOWN"
  activeHousing: {
    definitionId: string,       // 房源定义ID
    type: "RENT" | "OWN",       // 租赁或购买
    name: string,               // 房屋名称
    region: string,             // 所在区域
    loanId?: string,            // 房贷ID（购买时）
    defenseLevel: number,       // 防御等级
    regenHp: number,            // 每回合恢复HP
    weeklyCosts: Array<{name: string, baseAmount: number}>,
  } | null,
  inventory: Array<{
    itemId: string;
    quantity: number;
    durability?: number;
  }>,

  // ========================================
  // 3. 子系统数据
  // ========================================
  bank: {
    activeLoans: Array<{
      id: string;
      productId: string;
      principal: number;
      interest: number;
      rate: number;
      dueTurn: number;
      overdueTurns: number;
      isMortgage: boolean;
    }>,
    lifetimeInterestPaid: number,
  },
  faith: {
    id: string,                 // 信仰ID: "NONE" | "CROWD" | "SKILLS" | "OLD_GOD" | "CORRUPTION"
    level: number,
    hasPerformedRite: boolean,
    debuffs: Array<any>,
    bannedFaiths: string[],
    behaviorState: {
      lastAction: string | null;
      currentStreak: number;
      hasReceivedInvitation: boolean;
    }
  },
  crypto: {
    isAccountOpen: boolean,
    btcPrice: number,
    positions: Array<{
      id: string;
      amount: number;
      entryPrice: number;
      entryTurn: number;
    }>,
    priceHistory: number[],
    weeklyNews: any | null,
    weeklyTradesCount: number,
    lastTradeTurn: number,
  },
  prison: {
    inJail: boolean,
    crime: string,
    sentenceTurns: number,
    turnsServed: number,
    bailAmount: number,
  },

  // ========================================
  // 4. 全局进度（跨运行保留）
  // ========================================
  unlockedArchives: string[],           // 已解锁档案ID列表
  archiveUnlockDates: Record<string, string>, // 档案解锁时间 ISO格式
  achievedEndings: string[],            // 已达成结局ID列表
  endingUnlockDates: Record<string, string>,  // 结局达成时间 ISO格式
  totalDeaths: number,                  // 总死亡次数
  totalPlayTime: number,                // 总游戏时间（分钟）
  totalRuns: number,                    // 总游戏次数
  longestSurvival: number,              // 最长生存回合数
  darkWebEchoes: {
    revealedMemories: string[];
    unlockedMilestones: number[];
    narrativeFragments: string[];
  },
  systemGaze: {
    currentIntensity: number;
    nextThreshold: number;
    exclusiveEventsSeen: string[];
  },

  // ========================================
  // 5. 其他状态
  // ========================================
  dmvQueue: any | null,                 // DMV排队状态
  activeLease: any | null,              // 车辆租赁状态
  history: Array<any>,                  // 游戏历史记录
  
  // ========================================
  // 6. 额外游戏状态
  // ========================================
  dietState: {
    junkFoodPoints: number;             // 垃圾食品点数
    healthyPoints: number;              // 健康饮食点数
    consecutiveJunkDays: number;        // 连续吃垃圾食品天数
    consecutiveHealthyDays: number;     // 连续健康饮食天数
    sodiumIntake: number;               // 钠摄入量
    sugarIntake: number;                // 糖摄入量
    redMeatPoints: number;              // 红肉点数
    noFreshFoodDays: number;            // 无新鲜食物天数
  },
  activeBuffs: Array<{
    id: string;
    name: string;
    endTurn: number;
    effects: Record<string, any>;
  }>,                                  // 顶层 Buff 列表
  shopInventory: {
    SLUMS: string[];
    RUST_BELT: string[];
    SUBURBS: string[];
    DOWNTOWN: string[];
  },                                   // 🏪 商店库存
  vehiclePurchaseRegion: string | null, // 🚗 车辆购买区域
}
```

---

## 字段命名统一

✅ **已统一**: 本地存档和 Steam 云存档使用相同的字段命名（camelCase）。

| 统一字段名 | 来源路径 | 说明 |
|------------|----------|------|
| `gold` | `vitality.metrics.gold` | 金钱 |
| `hp` | `vitality.metrics.hp` | 生命值 |
| `insight` | `vitality.metrics.insight` | 灵视/理智 |
| `gameDay` | `vitality.time.currentTurn` | 当前回合 |
| `currentClass` | `vitality.identity.currentClass` | 社会阶级 |

---

## 存档迁移

### v0 -> v1.0 迁移

当检测到无 `saveVersion` 字段的旧存档时，自动执行以下迁移：

1. 添加 `saveVersion: "1.0"`
2. 添加 `saveTime: Date.now()`
3. 确保所有必需字段存在，缺失时设置默认值

代码位置：`game/src/store/useGameStore.ts` - `migrateSaveV0ToV1()`

---

## 存档备份

当存档损坏时，会自动备份到：
- 键名: `pixel-life-storage-corrupted-${timestamp}`
- 最多保留最近 5 个备份
- 旧备份自动清理

---

## 开发注意事项

1. **添加新字段**: 在 `partialize` 中添加新字段，并考虑在 `migrateSaveV0ToV1` 中设置默认值
2. **修改字段结构**: 视为破坏性变更，需要升级 `saveVersion` 并编写迁移函数
3. **删除字段**: 从 `partialize` 中移除即可，老存档中的字段会被自然忽略
