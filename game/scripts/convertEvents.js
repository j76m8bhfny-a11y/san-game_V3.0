#!/usr/bin/env node
/**
 * CSV 事件批量转换脚本
 * 
 * 用法: node convertEvents.js <csv文件路径>
 * 示例: node convertEvents.js ../EVENT_BATCH_TEMPLATE.csv
 */

const fs = require('fs');
const path = require('path');

// 解析 CSV（处理引号内的逗号）
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  return lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return { row, lineNum: index + 2 };
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// 数值常量（根据阶级调整insightGain）
const getEffects = (category, option) => {
  const base = {
    A: {
      scaling: 'LEVERAGE',
      gold: 150,
      hp: -12,
      points: { old: 3 },
      insightGain: category === 'HOMELESS' ? 8 : 5
    },
    B: {
      scaling: 'FIXED',
      gold: 25,
      hp: -3,
      points: {},
      insightGain: 1
    },
    C: {
      scaling: 'INCOME',
      gold: -0.15,
      hp: 8,
      points: { wolf: 3 },
      insight: -10
    },
    D: {
      scaling: 'FIXED',
      gold: -100,
      hp: -18,
      points: { red: 15 },
      insight: -10
    }
  };
  return base[option];
};

// 将 CSV 行转换为事件 JSON
function convertRowToEvent(row) {
  const category = row.category;
  
  const event = {
    $schema: 'game-event-v3',
    id: row.id,
    title: row.title,
    category: category,
    series: row.series,
    layer: {
      background: `/assets/scenes/${row.background}.png`,
      foreground: `/assets/events/${row.foreground}.png`
    },
    conditions: {
      requiredClass: category === 'COMMON' ? [] : [category],
      minInsight: 0,
      maxInsight: 100,
      minTurn: 1,
      maxTurn: 52,
      weight: 10
    },
    text: row.text,
    historicalNote: row.historicalNote,
    options: {
      A: {
        label: row.A_label,
        roast: row.A_roast,
        flavorText: row.A_flavorText,
        ideology: row.A_ideology,
        archiveCommentary: row.A_archiveCommentary,
        effects: getEffects(category, 'A')
      },
      B: {
        label: row.B_label,
        roast: row.B_roast,
        flavorText: row.B_flavorText,
        ideology: row.B_ideology,
        archiveCommentary: row.B_archiveCommentary,
        effects: getEffects(category, 'B')
      },
      C: {
        label: row.C_label,
        roast: row.C_roast,
        flavorText: row.C_flavorText,
        ideology: row.C_ideology,
        archiveCommentary: row.C_archiveCommentary,
        effects: getEffects(category, 'C')
      },
      D: {
        label: row.D_label,
        roast: row.D_roast,
        flavorText: row.D_flavorText,
        ideology: row.D_ideology,
        archiveCommentary: row.D_archiveCommentary,
        effects: getEffects(category, 'D'),
        sanLock: parseInt(row.sanLock) || 40,
        isGlitched: true,
        glitchEffect: row.glitchEffect || 'chromatic_aberration',
        archiveId: row.archiveId
      }
    },
    metadata: {
      author: row.author || 'Anonymous',
      version: '3.0',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      references: row.references ? row.references.split(';').filter(Boolean) : [],
      relatedEvents: []
    }
  };
  
  // 如果是 COMMON，移除 requiredClass
  if (category === 'COMMON') {
    delete event.conditions.requiredClass;
  }
  
  return event;
}

// 主函数
function main() {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.error('❌ 请提供 CSV 文件路径');
    console.log('用法: node convertEvents.js <csv文件路径>');
    process.exit(1);
  }
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ 文件不存在: ${csvPath}`);
    process.exit(1);
  }
  
  console.log(`📖 读取 CSV: ${csvPath}`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`📝 找到 ${rows.length} 行数据\n`);
  
  const stats = {
    success: 0,
    skipped: 0,
    errors: []
  };
  
  for (const { row, lineNum } of rows) {
    // 跳过空行（id为空）
    if (!row.id || row.id.trim() === '') {
      console.log(`⏭️  跳过空行 (行 ${lineNum})`);
      stats.skipped++;
      continue;
    }
    
    // 检查必填字段
    const required = ['id', 'category', 'title', 'text', 'A_label', 'B_label', 'C_label', 'D_label', 'archiveId'];
    const missing = required.filter(field => !row[field] || row[field].trim() === '');
    
    if (missing.length > 0) {
      console.error(`❌ 行 ${lineNum} (${row.id}): 缺少必填字段: ${missing.join(', ')}`);
      stats.errors.push({ line: lineNum, id: row.id, error: `缺少字段: ${missing.join(', ')}` });
      continue;
    }
    
    try {
      // 转换 JSON
      const event = convertRowToEvent(row);
      
      // 确定输出目录
      const categoryMap = {
        'HOMELESS': 'homeless',
        'WORKER': 'worker',
        'MIDDLE': 'middle',
        'CAPITALIST': 'capitalist',
        'COMMON': 'common'
      };
      
      const outputDir = path.join(__dirname, '../src/assets/data/events', categoryMap[row.category] || 'common');
      
      // 确保目录存在
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 写入文件
      const outputPath = path.join(outputDir, `${row.id}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(event, null, 2), 'utf-8');
      
      console.log(`✅ ${row.id} → ${path.relative(process.cwd(), outputPath)}`);
      stats.success++;
      
    } catch (err) {
      console.error(`❌ 行 ${lineNum} (${row.id}): 转换失败 - ${err.message}`);
      stats.errors.push({ line: lineNum, id: row.id, error: err.message });
    }
  }
  
  // 输出统计
  console.log('\n' + '='.repeat(50));
  console.log('📊 转换统计');
  console.log('='.repeat(50));
  console.log(`✅ 成功: ${stats.success}`);
  console.log(`⏭️  跳过: ${stats.skipped}`);
  console.log(`❌ 错误: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    stats.errors.forEach(e => {
      console.log(`  行 ${e.line} (${e.id}): ${e.error}`);
    });
    process.exit(1);
  }
  
  console.log('\n🎉 全部转换完成!');
}

main();
