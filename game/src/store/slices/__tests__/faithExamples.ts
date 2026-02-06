/**
 * FaithSlice 全场景使用示例
 * 
 * 展示 createFaithSlice 中所有方法的调用场景和预期结果
 */

import { FaithID } from '@/types/schema';

// ==========================================
// 1. 初始状态
// ==========================================
const initialState = {
  faith: {
    id: FaithID.NONE,           // 无信仰
    level: 1,                   // 从 faithRules.defaults.initialLevel 读取
    hasPerformedRite: false,    // 今日未进行仪式
    debuffs: [],                // 无 Debuff
    bannedFaiths: []            // 无封禁记录
  }
};

// ==========================================
// 2. joinFaith - 加入信仰
// ==========================================

// 场景 2.1: 成功加入救赎教会（扣钱）
const joinChurchSuccess = {
  input: FaithID.CHURCH,
  preCondition: {
    gold: 200,                  // 足够金钱
    bannedFaiths: []            // 未被封禁
  },
  action: 'joinFaith(FaithID.CHURCH)',
  expected: {
    result: { success: true, message: '条件满足。' },
    stateChange: {
      'faith.id': 'CHURCH',
      'faith.level': 1,
      'faith.hasPerformedRite': false,
      'gold': 100                 // 扣除 100 入教费
    },
    notification: '已加入: 救赎教会'
  }
};

// 场景 2.2: 加入失败 - 已经在该信仰中
const joinAlreadyInFaith = {
  input: FaithID.CHURCH,
  preCondition: {
    faith: { id: 'CHURCH' }     // 已经在救赎教会
  },
  action: 'joinFaith(FaithID.CHURCH)',
  expected: {
    result: { success: false, message: '你已经在此信仰中了。' },
    stateChange: '无变化',
    notification: '无'
  }
};

// 场景 2.3: 加入失败 - 被永久封禁（星星之火）
const joinBanned = {
  input: FaithID.REVOLUTION,
  preCondition: {
    bannedFaiths: ['REVOLUTION'] // 之前退出过星星之火
  },
  action: 'joinFaith(FaithID.REVOLUTION)',
  expected: {
    result: { success: false, message: '你被此信仰永久放逐，无法再次加入。' },
    stateChange: '无变化',
    notification: '无'
  }
};

// 场景 2.4: 加入失败 - 金钱不足
const joinInsufficientGold = {
  input: FaithID.CHURCH,
  preCondition: {
    gold: 50                    // 只有 50，需要 100
  },
  action: 'joinFaith(FaithID.CHURCH)',
  expected: {
    result: { success: false, message: '需要 $100 奉献金。' },
    stateChange: '无变化',
    notification: 'error: 需要 $100 奉献金。'
  }
};

// 场景 2.5: 加入失败 - 携带违禁品（互助兄弟会）
const joinForbiddenItems = {
  input: FaithID.BROTHERHOOD,
  preCondition: {
    inventory: ['I02', 'I05'],  // I02 是违禁品
    hasForbiddenItems: true
  },
  action: 'joinFaith(FaithID.BROTHERHOOD)',
  expected: {
    result: { success: false, message: '身带违禁品，无法入会。' },
    stateChange: '无变化',
    notification: 'error: 身带违禁品，无法入会。'
  }
};

// ==========================================
// 3. requestLeaveFaith - 请求退出（获取确认信息）
// ==========================================

// 场景 3.1: 无信仰时请求退出
const requestLeaveNoFaith = {
  preCondition: {
    faith: { id: 'NONE' }
  },
  action: 'requestLeaveFaith()',
  expected: {
    result: { canLeave: false },
    uiAction: '不显示退出按钮或禁用'
  }
};

// 场景 3.2: 救赎教会 - 有惩罚配置
const requestLeaveChurch = {
  preCondition: {
    faith: { id: 'CHURCH' }
  },
  action: 'requestLeaveFaith()',
  expected: {
    result: {
      canLeave: true,
      confirmation: {
        title: '确认退出信仰',
        message: '退出救赎教会将使你获得 +15 SAN（摆脱罪疚感），确定要退出吗？'
      },
      penalty: {
        sanChange: 15,
        description: '摆脱虚伪的救赎，你感到前所未有的清醒。'
      }
    },
    uiAction: '显示确认弹窗，说明 SAN +15 的收益'
  }
};

// 场景 3.3: 互助兄弟会 - 有 Debuff 惩罚
const requestLeaveBrotherhood = {
  preCondition: {
    faith: { id: 'BROTHERHOOD' }
  },
  action: 'requestLeaveFaith()',
  expected: {
    result: {
      canLeave: true,
      confirmation: {
        title: '确认退出信仰',
        message: '退出互助兄弟会将使你获得「被排斥者」状态（7天收入-20%），确定要退出吗？'
      },
      penalty: {
        sanChange: 5,
        debuff: {
          id: 'OUTCAST',
          name: '被排斥者',
          duration: 7,
          effect: { incomeMultiplier: 0.8 }
        }
      }
    },
    uiAction: '显示警告弹窗，强调收入降低 20%'
  }
};

// 场景 3.4: 血肉神教 - 永久属性损失
const requestLeaveCult = {
  preCondition: {
    faith: { id: 'CULT' }
  },
  action: 'requestLeaveFaith()',
  expected: {
    result: {
      canLeave: true,
      confirmation: {
        title: '确认退出信仰',
        message: '退出血肉神教将永久减少 10 点最大生命值，确定要退出吗？'
      },
      penalty: {
        maxHpChange: -10,
        description: '血肉不再回应你，你的生命力永久流失。'
      }
    },
    uiAction: '显示严重警告，⚠️ 永久属性损失'
  }
};

// 场景 3.5: 星星之火 - 永久封禁
const requestLeaveRevolution = {
  preCondition: {
    faith: { id: 'REVOLUTION' }
  },
  action: 'requestLeaveFaith()',
  expected: {
    result: {
      canLeave: true,
      confirmation: {
        title: '确认退出信仰',
        message: '⚠️ 警告：退出星星之火后你将永远无法再次加入，确定要退出吗？'
      },
      penalty: {
        permanentBan: true,
        description: '背叛只有一次机会，革命不再接纳变节者。'
      }
    },
    uiAction: '显示最严重警告，红色 ⚠️ 提示无法再次加入'
  }
};

// ==========================================
// 4. confirmLeaveFaith - 确认并执行退出
// ==========================================

// 场景 4.1: 确认退出救赎教会
const confirmLeaveChurch = {
  preCondition: {
    faith: { id: 'CHURCH' },
    san: 50,
    maxSan: 100
  },
  action: 'confirmLeaveFaith()',
  expected: {
    result: {
      success: true,
      message: '你背弃了信仰。 摆脱虚伪的救赎，你感到前所未有的清醒。'
    },
    stateChange: {
      'faith.id': 'NONE',
      'faith.level': 1,
      'san': 65,                  // 50 + 15
      'debuffs': [],              // 无 Debuff
      'bannedFaiths': []          // 未被封禁
    },
    notification: 'warning: 救赎教会: 摆脱虚伪的救赎，你感到前所未有的清醒。'
  }
};

// 场景 4.2: 确认退出互助兄弟会（添加 Debuff）
const confirmLeaveBrotherhood = {
  preCondition: {
    faith: { id: 'BROTHERHOOD' },
    san: 50
  },
  action: 'confirmLeaveFaith()',
  expected: {
    stateChange: {
      'faith.id': 'NONE',
      'san': 55,                  // +5
      'debuffs': [{
        id: 'OUTCAST',
        name: '被排斥者',
        duration: 7,
        remainingTurns: 7,
        effect: { incomeMultiplier: 0.8 }
      }],
      'bannedFaiths': []
    },
    jobImpact: '接下来 7 周，所有工作收入 × 0.8'
  }
};

// 场景 4.3: 确认退出血肉神教（永久 HP 上限降低）
const confirmLeaveCult = {
  preCondition: {
    faith: { id: 'CULT' },
    hp: 80,
    maxHp: 100
  },
  action: 'confirmLeaveFaith()',
  expected: {
    stateChange: {
      'faith.id': 'NONE',
      'maxHp': 90,                // 100 - 10
      'hp': 80                    // 当前 HP 不变（未超过新上限）
    }
  }
};

// 场景 4.4: 确认退出血肉神教（当前 HP 超过新上限）
const confirmLeaveCultHpClamp = {
  preCondition: {
    faith: { id: 'CULT' },
    hp: 95,
    maxHp: 100
  },
  action: 'confirmLeaveFaith()',
  expected: {
    stateChange: {
      'maxHp': 90,
      'hp': 90                    // 被钳制到新上限
    }
  }
};

// 场景 4.5: 确认退出星星之火（永久封禁）
const confirmLeaveRevolution = {
  preCondition: {
    faith: { id: 'REVOLUTION' }
  },
  action: 'confirmLeaveFaith()',
  expected: {
    stateChange: {
      'faith.id': 'NONE',
      'bannedFaiths': ['REVOLUTION']  // 永久封禁
    },
    futureImpact: '无法再 joinFaith(FaithID.REVOLUTION)'
  }
};

// 场景 4.6: 无信仰时确认退出（异常路径）
const confirmLeaveNoFaith = {
  preCondition: {
    faith: { id: 'NONE' }
  },
  action: 'confirmLeaveFaith()',
  expected: {
    result: { success: false, message: '当前没有信仰' },
    stateChange: '无变化'
  }
};

// ==========================================
// 5. performFaithRite - 执行信仰仪式
// ==========================================

// 场景 5.1: 今日已完成仪式
const riteAlreadyDone = {
  preCondition: {
    faith: { id: 'CHURCH', hasPerformedRite: true }
  },
  action: 'performFaithRite()',
  expected: {
    result: { success: false, message: '今日已完成' },
    notification: 'info: 今日已完成仪式，请明日再来。'
  }
};

// 场景 5.2: 无信仰时执行仪式
const riteNoFaith = {
  preCondition: {
    faith: { id: 'NONE' }
  },
  action: 'performFaithRite()',
  expected: {
    result: { success: false, message: '无信仰' },
    notification: 'error: 无信仰'
  }
};

// 场景 5.3: 救赎教会仪式成功（缴纳什一税）
const riteChurchSuccess = {
  preCondition: {
    faith: { id: 'CHURCH', hasPerformedRite: false },
    gold: 1000                  // 有 1000，什一税 = max(20, 1000*0.1) = 100
  },
  action: 'performFaithRite()',
  expected: {
    result: {
      success: true,
      message: '缴纳 100 什一税。 理智 +15。'
    },
    stateChange: {
      'gold': 900,                // -100
      'san': 'current + 15',
      'faith.hasPerformedRite': true
    },
    ledger: '类别: TAX, 金额: -100, 描述: 信仰仪式: 缴纳什一税'
  }
};

// 场景 5.4: 救赎教会仪式失败（金钱不足支付什一税）
const riteChurchInsufficientGold = {
  preCondition: {
    faith: { id: 'CHURCH' },
    gold: 15                    // 只有 15，低于最低 20
  },
  action: 'performFaithRite()',
  expected: {
    result: { success: false, message: '无法支付什一税 (需 20)' },
    notification: 'error: 无法支付什一税 (需 20)'
  }
};

// 场景 5.5: 互助兄弟会仪式成功（免费恢复 HP/SAN）
const riteBrotherhoodSuccess = {
  preCondition: {
    faith: { id: 'BROTHERHOOD' },
    hp: 50,
    san: 30
  },
  action: 'performFaithRite()',
  expected: {
    result: {
      success: true,
      message: '理智 +5。健康 +10。'
    },
    stateChange: {
      'hp': 60,   // +10
      'san': 35,  // +5
      'faith.hasPerformedRite': true
    },
    goldChange: 0  // 免费
  }
};

// 场景 5.6: 血肉神教仪式成功（消耗 HP 换取金钱）
const riteCultSuccess = {
  preCondition: {
    faith: { id: 'CULT' },
    hp: 50                      // 足够支付 15 HP
  },
  action: 'performFaithRite()',
  expected: {
    result: {
      success: true,
      message: '获得资金 $150。'
    },
    stateChange: {
      'hp': 35,   // -15
      'gold': '+150',
      'faith.hasPerformedRite': true
    },
    ledger: '类别: INCOME, 金额: 150, 描述: 信仰仪式: 进行血祭'
  }
};

// 场景 5.7: 星星之火仪式成功（消耗 SAN 换取红色倾向）
const riteRevolutionSuccess = {
  preCondition: {
    faith: { id: 'REVOLUTION' },
    san: 50,
    identity: { points: { red: 10 } }
  },
  action: 'performFaithRite()',
  expected: {
    result: {
      success: true,
      message: ' 红色倾向 +5。'
    },
    stateChange: {
      'san': 40,  // -10
      'identity.points.red': 15,  // +5
      'faith.hasPerformedRite': true
    }
  }
};

// ==========================================
// 6. resetDailyFaith - 重置每日仪式状态
// ==========================================

// 场景 6.1: 每日重置（在 turn 结算时调用）
const resetDaily = {
  preCondition: {
    faith: {
      id: 'CHURCH',
      hasPerformedRite: true,     // 今日已完成
      debuffs: [{ remainingTurns: 5 }],  // 保留 Debuff
      bannedFaiths: []
    }
  },
  action: 'resetDailyFaith()',
  expected: {
    stateChange: {
      'faith.hasPerformedRite': false  // 重置为可执行
      // debuffs 和 bannedFaiths 保持不变
    }
  }
};

// ==========================================
// 7. tickFaithDebuffs - Debuff 计时减少
// ==========================================

// 场景 7.1: Debuff 持续时间减少
const tickDebuffsNormal = {
  preCondition: {
    debuffs: [
      { id: 'OUTCAST', remainingTurns: 5 },
      { id: 'OTHER', remainingTurns: 1 }
    ]
  },
  action: 'tickFaithDebuffs()',
  expected: {
    stateChange: {
      'debuffs': [
        { id: 'OUTCAST', remainingTurns: 4 },  // 5 -> 4
        // { id: 'OTHER' ... } 被移除，因为 remainingTurns 变为 0
      ]
    }
  }
};

// 场景 7.2: 所有 Debuff 到期
const tickDebuffsAllExpired = {
  preCondition: {
    debuffs: [
      { id: 'OUTCAST', remainingTurns: 1 }
    ]
  },
  action: 'tickFaithDebuffs()',
  expected: {
    stateChange: {
      'debuffs': []  // 清空
    },
    jobImpact: '下一周工作收入恢复正常（无 0.8 倍率）'
  }
};

// 场景 7.3: 无 Debuff 时调用
const tickDebuffsEmpty = {
  preCondition: {
    debuffs: []
  },
  action: 'tickFaithDebuffs()',
  expected: {
    stateChange: '无变化'
  }
};

// ==========================================
// 8. 复杂场景 - 退出后 Debuff 影响工作
// ==========================================

// 场景 8.1: 退出互助兄弟会后工作收入降低
const debuffAffectsJob = {
  scenario: '玩家退出互助兄弟会，然后尝试工作',
  steps: [
    {
      step: 1,
      action: 'confirmLeaveFaith()',
      state: { faith: { id: 'BROTHERHOOD' } },
      result: '获得 OUTCAST debuff (7天, incomeMultiplier: 0.8)'
    },
    {
      step: 2,
      action: '工作结算 (JobSystem.processTurn)',
      calculation: 'actualSalary = baseSalary × efficiency × 0.8',
      result: '收入减少 20%'
    },
    {
      step: 3,
      action: '7周后 tickFaithDebuffs()',
      result: 'OUTCAST debuff 被移除'
    },
    {
      step: 4,
      action: '工作结算',
      result: '收入恢复正常'
    }
  ]
};

// ==========================================
// 9. 边界场景
// ==========================================

// 场景 9.1: 旧存档兼容性 - 缺失 debuffs 字段
const oldSaveCompatibility = {
  scenario: '玩家使用旧存档，faith 对象没有 debuffs 字段',
  preCondition: {
    faith: {
      id: 'CHURCH',
      level: 1,
      hasPerformedRite: false
      // 缺少 debuffs 和 bannedFaiths
    }
  },
  action: 'joinFaith(FaithID.BROTHERHOOD)',
  expected: {
    // 代码中使用 || [] 防御
    result: '正常执行，不会崩溃',
    note: '所有访问点都有 state.faith.debuffs || [] 保护'
  }
};

// 场景 9.2: 多次退出同一信仰（刷新 Debuff）
const refreshDebuff = {
  scenario: '玩家退出互助兄弟会，7天内再次加入并退出',
  steps: [
    { action: '第一次退出', debuff: 'OUTCAST (7天)' },
    { action: '3天后', debuff: 'OUTCAST (剩余4天)' },
    { action: '再次加入兄弟会' },
    { action: '再次退出', debuff: 'OUTCAST (重新变为7天，而非叠加)' }
  ],
  note: '同名 debuff 刷新持续时间，而非叠加多个'
};

// ==========================================
// 导出总结
// ==========================================
export const faithExamples = {
  initialState,
  joinScenarios: {
    joinChurchSuccess,
    joinAlreadyInFaith,
    joinBanned,
    joinInsufficientGold,
    joinForbiddenItems
  },
  requestLeaveScenarios: {
    requestLeaveNoFaith,
    requestLeaveChurch,
    requestLeaveBrotherhood,
    requestLeaveCult,
    requestLeaveRevolution
  },
  confirmLeaveScenarios: {
    confirmLeaveChurch,
    confirmLeaveBrotherhood,
    confirmLeaveCult,
    confirmLeaveCultHpClamp,
    confirmLeaveRevolution,
    confirmLeaveNoFaith
  },
  riteScenarios: {
    riteAlreadyDone,
    riteNoFaith,
    riteChurchSuccess,
    riteChurchInsufficientGold,
    riteBrotherhoodSuccess,
    riteCultSuccess,
    riteRevolutionSuccess
  },
  maintenanceScenarios: {
    resetDaily,
    tickDebuffsNormal,
    tickDebuffsAllExpired,
    tickDebuffsEmpty
  },
  complexScenarios: {
    debuffAffectsJob,
    oldSaveCompatibility,
    refreshDebuff
  }
};

export default faithExamples;
