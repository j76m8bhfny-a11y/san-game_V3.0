/**
 * 批量事件迁移脚本
 * 将 events.json 中的旧格式事件批量转换为新格式
 * 
 * 使用: node scripts/batchMigrate.js
 */

const fs = require('fs');
const path = require('path');

// 加载旧事件
const eventsPath = path.join(__dirname, '../src/assets/data/events.json');
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));

// 标准化数值映射
const VALUE_MAP = {
  A: { gold: 150, hp: -12, insightGain: 8, points: { old: 3 } },
  B: { gold: 25, hp: -3, insightGain: 1, points: {} },
  C: { gold: -0.15, hp: 8, insight: -10, points: { wolf: 3 } },
  D: { gold: -100, hp: -18, insight: -10, points: { red: 15 } }
};

const IDEOLOGIES = {
  A: '新自由主义/奋斗逼',
  B: '犬儒主义/摆烂',
  C: '消费主义/岁静',
  D: '激进左翼/觉醒'
};

const SCALINGS = {
  A: 'LEVERAGE',
  B: 'FIXED',
  C: 'INCOME',
  D: 'FIXED'
};

// 推断事件类别
function inferCategory(eventId) {
  if (eventId.includes('WORKER')) return 'WORKER';
  if (eventId.includes('MIDDLE')) return 'MIDDLE';
  if (eventId.includes('CAPITALIST')) return 'CAPITALIST';
  return 'HOMELESS';
}

// 生成新ID
function generateNewId(oldId, category) {
  // EVT_01_BENCH -> EVT_H01_BENCH
  const match = oldId.match(/EVT_(\d+)_(.+)/);
  if (!match) return oldId;
  
  const [, num, name] = match;
  const prefix = category === 'HOMELESS' ? 'H' :
                 category === 'WORKER' ? 'W' :
                 category === 'MIDDLE' ? 'M' :
                 category === 'CAPITALIST' ? 'C' : 'X';
  
  return `EVT_${prefix}${num}_${name}`;
}

// 迁移单个选项
function migrateOption(oldOption, optionType, category) {
  const newValues = VALUE_MAP[optionType];
  
  const migrated = {
    label: oldOption.label,
    roast: oldOption.roast,
    flavorText: oldOption.flavorText || getDefaultFlavorText(optionType),
    ideology: IDEOLOGIES[optionType],
    archiveCommentary: oldOption.archiveCommentary || getDefaultCommentary(optionType),
    effects: {
      scaling: SCALINGS[optionType],
      gold: newValues.gold,
      hp: newValues.hp,
      points: newValues.points
    }
  };

  // 处理 insight/insightGain
  if (optionType === 'A' || optionType === 'B') {
    migrated.effects.insightGain = category === 'HOMELESS' && optionType === 'A' 
      ? 8 
      : newValues.insightGain;
  } else {
    migrated.effects.insight = newValues.insight;
  }

  // D选项特殊字段
  if (optionType === 'D') {
    if (oldOption.sanLock) migrated.sanLock = oldOption.sanLock;
    if (oldOption.isGlitched) {
      migrated.isGlitched = true;
      migrated.glitchEffect = 'chromatic_aberration';
    }
    if (oldOption.archiveId) migrated.archiveId = oldOption.archiveId;
  }

  return migrated;
}

function getDefaultFlavorText(optionType) {
  const defaults = {
    A: '你告诉自己要坚持，要相信努力就能改变命运。',
    B: '你选择了最安全、最不需要思考的路径。',
    C: '你决定花钱解决这个让你不安的问题。',
    D: '你看到了表象之下的真相，尽管知道这会付出代价。'
  };
  return defaults[optionType];
}

function getDefaultCommentary(optionType) {
  const commentaries = {
    A: '这种选择代表了系统最希望穷人持有的心态：自责、内卷、永不质疑结构。',
    B: '麻木不是愚蠢，而是生存策略。在一个无法胜利的系统中，不抱希望就不会失望。',
    C: '消费主义提供了一个完美的出口：把系统性问题转化为个人问题，然后用钱解决。',
    D: '真相的代价总是高昂的，但沉默的代价更高。'
  };
  return commentaries[optionType];
}

// 迁移单个事件
function migrateEvent(oldEvent) {
  const category = inferCategory(oldEvent.id);
  const newId = generateNewId(oldEvent.id, category);
  
  return {
    $schema: 'game-event-v3',
    id: newId,
    title: oldEvent.title,
    category: category,
    series: oldEvent.series || '基础生存',
    layer: {
      background: oldEvent.bgImage || '/assets/scenes/common/bg_street.png',
      foreground: oldEvent.eventImage || '/assets/events/common/evt_placeholder.png'
    },
    conditions: {
      requiredClass: oldEvent.conditions?.requiredClass || [category],
      minSan: oldEvent.conditions?.minSan ?? 0,
      maxSan: oldEvent.conditions?.maxSan ?? 100,
      weight: oldEvent.conditions?.weight ?? 10,
      minTurn: 1,
      maxTurn: 52
    },
    text: oldEvent.text,
    historicalNote: oldEvent.historicalNote || '基于美国社会现实事件改编。',
    options: {
      A: migrateOption(oldEvent.options.A, 'A', category),
      B: migrateOption(oldEvent.options.B, 'B', category),
      C: migrateOption(oldEvent.options.C, 'C', category),
      D: migrateOption(oldEvent.options.D, 'D', category)
    },
    metadata: {
      author: 'Dark Web Echoes Team',
      version: '3.0',
      migratedFrom: oldEvent.id,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      references: oldEvent.metadata?.references || [],
      relatedEvents: oldEvent.metadata?.relatedEvents || []
    }
  };
}

// 获取输出目录
function getOutputDir(category) {
  return path.join(__dirname, '../src/assets/data/events', category.toLowerCase());
}

// 主函数
function main() {
  console.log(`🚀 开始迁移 ${events.length} 个事件...\n`);
  
  let migrated = 0;
  let errors = 0;
  
  // 跳过高优先级事件（已手动迁移）
  const skipIds = [
    'EVT_01_BENCH', 'EVT_02_TOILET', 'EVT_03_MILK', 'EVT_04_SPIKES',
    'EVT_05_BUS_TICKET', 'EVT_06_HOSPITAL_DUMP', 'EVT_07_BEGGING_FINE',
    'EVT_08_LIBRARY', 'EVT_09_NO_WATER', 'EVT_10_SELLING_PLASMA',
    'EVT_11_SNAP_HOT_FOOD', 'EVT_12_PERIOD_POVERTY', 'EVT_13_CASHLESS',
    'EVT_14_PET_BAN', 'EVT_15_LOCKED_TRASH'
  ];
  
  for (const oldEvent of events) {
    // 跳过已迁移的
    if (skipIds.includes(oldEvent.id)) {
      console.log(`⏭️  跳过: ${oldEvent.id} (已手动迁移)`);
      continue;
    }
    
    try {
      const newEvent = migrateEvent(oldEvent);
      const category = newEvent.category;
      const outputDir = getOutputDir(category);
      
      // 确保目录存在
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 写入文件
      const outputPath = path.join(outputDir, `${newEvent.id}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(newEvent, null, 2));
      
      console.log(`✅ ${oldEvent.id} -> ${newEvent.id}`);
      migrated++;
    } catch (error) {
      console.error(`❌ 失败: ${oldEvent.id} - ${error.message}`);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`总计: ${events.length} 个事件`);
  console.log(`✅ 成功: ${migrated}`);
  console.log(`⏭️  跳过: ${skipIds.length}`);
  console.log(`❌ 失败: ${errors}`);
}

main();
