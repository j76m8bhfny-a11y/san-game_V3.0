/**
 * 事件验证脚本
 * 
 * 检查所有事件文件是否符合v3格式规范
 * 使用方法: npx ts-node scripts/validateEvents.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// v3 Schema定义
const REQUIRED_FIELDS = [
  '$schema',
  'id',
  'title',
  'category',
  'series',
  'layer',
  'conditions',
  'text',
  'options'
];

const VALID_CATEGORIES = ['HOMELESS', 'WORKER', 'MIDDLE', 'CAPITALIST', 'COMMON'];
const VALID_SCALINGS = ['LEVERAGE', 'FIXED', 'INCOME', 'TRUTH'];
const VALID_OPTION_KEYS = ['A', 'B', 'C', 'D'];

/**
 * 验证单个事件
 */
function validateEvent(eventData: any, filePath: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // 检查必需字段
  for (const field of REQUIRED_FIELDS) {
    if (!(field in eventData)) {
      result.errors.push(`缺少必需字段: ${field}`);
      result.valid = false;
    }
  }

  // 检查$schema
  if (eventData.$schema !== 'game-event-v3') {
    result.errors.push(`Schema版本错误: ${eventData.$schema}, 应为 game-event-v3`);
    result.valid = false;
  }

  // 检查category
  if (eventData.category && !VALID_CATEGORIES.includes(eventData.category)) {
    result.errors.push(`无效的category: ${eventData.category}`);
    result.valid = false;
  }

  // 检查layer结构
  if (eventData.layer) {
    if (!eventData.layer.background) {
      result.warnings.push('layer缺少background字段');
    }
    if (!eventData.layer.foreground) {
      result.warnings.push('layer缺少foreground字段');
    }
  }

  // 检查conditions
  if (eventData.conditions) {
    if (!Array.isArray(eventData.conditions.requiredClass)) {
      result.warnings.push('conditions.requiredClass应为数组');
    }
  }

  // 检查options
  if (eventData.options) {
    for (const key of VALID_OPTION_KEYS) {
      if (!(key in eventData.options)) {
        result.errors.push(`缺少选项: ${key}`);
        result.valid = false;
        continue;
      }

      const option = eventData.options[key];
      
      // 检查选项必需字段
      if (!option.label) {
        result.errors.push(`选项${key}缺少label`);
        result.valid = false;
      }
      if (!option.roast) {
        result.warnings.push(`选项${key}缺少roast`);
      }
      if (!option.ideology) {
        result.warnings.push(`选项${key}缺少ideology`);
      }

      // 检查effects
      if (option.effects) {
        if (!VALID_SCALINGS.includes(option.effects.scaling)) {
          result.warnings.push(`选项${key}使用非标准scaling: ${option.effects.scaling}`);
        }
      } else {
        result.errors.push(`选项${key}缺少effects`);
        result.valid = false;
      }

      // 检查D选项特殊字段
      if (key === 'D') {
        if (option.isGlitched && !option.archiveId) {
          result.warnings.push('D选项isGlitched=true但缺少archiveId');
        }
      }
    }
  }

  return result;
}

/**
 * 递归查找所有JSON文件
 */
function findJsonFiles(dir: string, files: string[] = []): string[] {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findJsonFiles(fullPath, files);
    } else if (item.endsWith('.json') && item !== 'events.json') {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 主函数
 */
function main() {
  const eventsDir = path.join(__dirname, '../src/assets/data/events');
  
  console.log('🔍 开始验证事件文件...\n');
  
  const jsonFiles = findJsonFiles(eventsDir);
  console.log(`找到 ${jsonFiles.length} 个事件文件\n`);
  
  let totalValid = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const filePath of jsonFiles) {
    const relativePath = path.relative(eventsDir, filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const eventData = JSON.parse(content);
      
      const result = validateEvent(eventData, filePath);
      
      if (result.valid && result.errors.length === 0) {
        console.log(`✅ ${relativePath}`);
        totalValid++;
      } else {
        console.log(`❌ ${relativePath}`);
        result.errors.forEach(e => console.log(`   错误: ${e}`));
        totalErrors += result.errors.length;
      }
      
      if (result.warnings.length > 0) {
        result.warnings.forEach(w => console.log(`   警告: ${w}`));
        totalWarnings += result.warnings.length;
      }
    } catch (error) {
      console.log(`❌ ${relativePath}`);
      console.log(`   解析错误: ${error}`);
      totalErrors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`总计: ${jsonFiles.length} 个文件`);
  console.log(`✅ 有效: ${totalValid}`);
  console.log(`❌ 错误: ${totalErrors}`);
  console.log(`⚠️  警告: ${totalWarnings}`);
  
  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
