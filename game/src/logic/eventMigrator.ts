/**
 * 事件迁移工具
 * 
 * 将旧格式事件迁移到新格式（v3标准化格式）
 * 主要变化：
 * 1. 数值标准化（A:150/-12/8, B:25/-3/1, C:-15%/8/-10, D:-100/-18/-10）
 * 2. insightClear -> insight（负值表示消耗）
 * 3. 添加ideology、flavorText、archiveCommentary字段
 * 4. 结构调整：添加layer、series、metadata
 */

import { GameEvent } from '@/types/schema';

// 旧数值到新数值的映射
interface MigrationValues {
  gold: number;
  hp: number;
  insight?: number;
  insightGain?: number;
  points: Record<string, number>;
}

const VALUE_MIGRATION: Record<string, MigrationValues> = {
  // A选项：旧 gold 300 -> 新 150，hp -3 -> -12，insightGain 4 -> 8（HOMELESS）
  A: {
    gold: 150,
    hp: -12,
    insightGain: 5,  // 基础值，HOMELESS会覆盖为8
    points: { old: 3 }
  },
  // B选项：旧 gold 50 -> 新 25，hp 2 -> -3，insightGain 2 -> 1
  B: {
    gold: 25,
    hp: -3,
    insightGain: 1,
    points: {}
  },
  // C选项：旧 gold -0.2 -> -0.15，hp 8不变，insightClear 2 -> insight -10
  C: {
    gold: -0.15,
    hp: 8,
    insight: -10,  // 负值表示减少（洗白）
    points: { wolf: 3 }
  },
  // D选项：旧 gold -0.4 -> -100（或保持-0.4看情况），hp -8 -> -18，insightClear 10 -> insight -10
  D: {
    gold: -100,  // 从比例改为固定值
    hp: -18,
    insight: -10,
    points: { red: 15 }
  }
};

/**
 * 判断是否是HOMELESS事件（需要特殊处理insightGain）
 */
function isHomelessEvent(eventId: string): boolean {
  return eventId.startsWith('EVT_0') || eventId.startsWith('EVT_H') || 
         (!eventId.includes('WORKER') && !eventId.includes('MIDDLE') && !eventId.includes('CAPITALIST'));
}

/**
 * 迁移单个选项
 */
function migrateOption(
  oldOption: any,
  optionType: 'A' | 'B' | 'C' | 'D',
  isHomeless: boolean
): any {
  const newValues = VALUE_MIGRATION[optionType];
  
  const migrated: any = {
    label: oldOption.label,
    roast: oldOption.roast,
    ideology: getIdeology(optionType),
    effects: {}
  };

  // 添加flavorText（如果不存在，使用占位符）
  if (!oldOption.flavorText) {
    migrated.flavorText = getDefaultFlavorText(optionType, isHomeless);
  } else {
    migrated.flavorText = oldOption.flavorText;
  }

  // 处理effects
  const effects: any = {
    scaling: oldOption.effects?.scaling || getDefaultScaling(optionType)
  };

  // 数值迁移
  switch (optionType) {
    case 'A':
      effects.gold = newValues.gold;
      effects.hp = newValues.hp;
      effects.insightGain = isHomeless ? 8 : newValues.insightGain;
      effects.points = newValues.points;
      break;
    case 'B':
      effects.gold = newValues.gold;
      effects.hp = newValues.hp;
      effects.insightGain = newValues.insightGain;
      break;
    case 'C':
      effects.scaling = 'INCOME';
      effects.gold = newValues.gold;
      effects.hp = newValues.hp;
      effects.insight = newValues.insight;  // 注意：负值表示减少
      effects.points = newValues.points;
      break;
    case 'D':
      effects.scaling = 'FIXED';
      effects.gold = oldOption.effects?.gold?.toString().includes('.') 
        ? -0.4  // 保持比例如果旧值是比例
        : newValues.gold;  // 否则使用新固定值
      effects.hp = newValues.hp;
      effects.insight = newValues.insight;  // 注意：负值表示消耗
      effects.points = newValues.points;
      
      // D选项特殊字段
      if (oldOption.sanLock) migrated.sanLock = oldOption.sanLock;
      if (oldOption.isGlitched) {
        migrated.isGlitched = true;
        migrated.glitchEffect = 'chromatic_aberration';
      }
      if (oldOption.archiveId) migrated.archiveId = oldOption.archiveId;
      break;
  }

  migrated.effects = effects;

  // 添加archiveCommentary
  migrated.archiveCommentary = oldOption.archiveCommentary || getDefaultCommentary(optionType);

  return migrated;
}

/**
 * 获取意识形态标签
 */
function getIdeology(optionType: 'A' | 'B' | 'C' | 'D'): string {
  const ideologies = {
    A: '新自由主义/奋斗逼',
    B: '犬儒主义/摆烂',
    C: '消费主义/岁静',
    D: '激进左翼/觉醒'
  };
  return ideologies[optionType];
}

/**
 * 获取默认scaling模式
 */
function getDefaultScaling(optionType: 'A' | 'B' | 'C' | 'D'): string {
  const scalings = {
    A: 'LEVERAGE',
    B: 'FIXED',
    C: 'INCOME',
    D: 'FIXED'
  };
  return scalings[optionType];
}

/**
 * 获取默认flavorText
 */
function getDefaultFlavorText(optionType: 'A' | 'B' | 'C' | 'D', isHomeless: boolean): string {
  const defaults: Record<string, string> = {
    A: isHomeless 
      ? '你告诉自己要坚持，要相信努力就能改变命运。但身体正在发出警报。'
      : '你相信只要够努力，就能突破阶级天花板。这是成功的代价。',
    B: '你选择了最安全、最不需要思考的路径。这让你感觉掌控了局面，尽管什么都没有改变。',
    C: '你决定花钱解决这个让你不安的问题。毕竟，消费是这个社会最认可的应对机制。',
    D: '你看到了表象之下的真相，尽管知道这会付出代价。有些东西比舒适更重要。'
  };
  return defaults[optionType];
}

/**
 * 获取默认archiveCommentary
 */
function getDefaultCommentary(optionType: 'A' | 'B' | 'C' | 'D'): string {
  const commentaries = {
    A: '这种选择代表了系统最希望穷人持有的心态：自责、内卷、永不质疑结构。',
    B: '麻木不是愚蠢，而是生存策略。在一个无法胜利的系统中，不抱希望就不会失望。',
    C: '消费主义提供了一个完美的出口：把系统性问题转化为个人问题，然后用钱解决。',
    D: '真相的代价总是高昂的，但沉默的代价更高。'
  };
  return commentaries[optionType];
}

/**
 * 迁移整个事件
 */
export function migrateEvent(oldEvent: any): GameEvent {
  const isHomeless = isHomelessEvent(oldEvent.id);
  
  // 解析事件阶级
  let category = oldEvent.category;
  if (!category) {
    if (oldEvent.id.includes('WORKER')) category = 'WORKER';
    else if (oldEvent.id.includes('MIDDLE')) category = 'MIDDLE';
    else if (oldEvent.id.includes('CAPITALIST')) category = 'CAPITALIST';
    else category = 'HOMELESS';
  }

  // 生成新ID格式
  let newId = oldEvent.id;
  if (oldEvent.id.startsWith('EVT_0')) {
    const num = oldEvent.id.match(/EVT_0(\d+)/)?.[1];
    if (num) newId = `EVT_H${num}`;
  }

  const migrated: any = {
    $schema: 'game-event-v3',
    id: newId,
    title: oldEvent.title,
    category: category,
    series: oldEvent.series || '基础生存',
    
    // 事件图片（单张完整场景图）
    image: oldEvent.eventImage || oldEvent.bgImage || '/assets/events/evt_placeholder.png',
    
    // 条件
    conditions: {
      requiredClass: oldEvent.conditions?.requiredClass || [category],
      minSan: oldEvent.conditions?.minSan ?? 0,
      maxSan: oldEvent.conditions?.maxSan ?? 100,
      weight: oldEvent.conditions?.weight ?? 10,
      minTurn: 1,
      maxTurn: 52
    },
    
    // 文本
    text: oldEvent.text,
    historicalNote: oldEvent.historicalNote || getHistoricalNote(oldEvent.title),
    
    // 选项
    options: {
      A: migrateOption(oldEvent.options.A, 'A', isHomeless),
      B: migrateOption(oldEvent.options.B, 'B', isHomeless),
      C: migrateOption(oldEvent.options.C, 'C', isHomeless),
      D: migrateOption(oldEvent.options.D, 'D', isHomeless)
    },
    
    // 元数据
    metadata: {
      author: 'Dark Web Echoes Team',
      version: '3.0',
      migratedFrom: oldEvent.id,
      createdAt: '2024-01-15',
      updatedAt: new Date().toISOString().split('T')[0],
      references: oldEvent.metadata?.references || [],
      relatedEvents: oldEvent.metadata?.relatedEvents || []
    }
  };

  return migrated as GameEvent;
}

/**
 * 根据标题获取历史注释
 */
function getHistoricalNote(title: string): string {
  const notes: Record<string, string> = {
    '公园长椅': '源自英国卡姆登长椅(Camden Bench)，专门设计来防止流浪者躺卧。',
    '上锁的厕所': '2018年费城星巴克事件后，越来越多的商家用密码锁限制厕所使用。',
    '倒掉牛奶': '美国每年浪费30-40%的食物，同时有数千万人面临食物不安全。',
    '桥下尖刺': '2014年伦敦豪宅安装防流浪汉尖刺引发全英抗议。'
  };
  return notes[title] || '基于美国社会现实事件改编。';
}

/**
 * 批量迁移事件列表
 */
export function migrateEvents(oldEvents: any[]): GameEvent[] {
  return oldEvents.map(event => migrateEvent(event));
}

/**
 * 导出迁移后的事件为JSON字符串（美化格式）
 */
export function exportMigratedEvent(event: GameEvent): string {
  return JSON.stringify(event, null, 2);
}

// ==========================================
// 快速迁移特定事件
// ==========================================

/**
 * 迁移前15个HOMELESS事件（用于验证）
 */
export function getFirst15HomelessEvents(): GameEvent[] {
  // 这些ID对应现有的events.json中的事件
  // 前15个HOMELESS事件ID（用于验证）
  // const first15Ids = ['EVT_01_BENCH', ...];
  
  // 注意：这里需要实际的事件数据
  // 实际使用时，应该从events.json导入
  return [];
}
