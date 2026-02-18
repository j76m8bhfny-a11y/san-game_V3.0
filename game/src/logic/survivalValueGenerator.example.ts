/**
 * 数值生成器使用示例
 * 
 * 展示如何用模型逆向生成各个系统的 JSON 配置
 */

import {
  generateValuesForState,
  generateEventImpact,
  generateItemJson,
  generateEventJson,
  generateDesignReport,
} from './survivalValueGenerator';

// ==========================================
// 示例 1: 设计"流浪者开局"状态
// ==========================================

export function designHomelessStart() {
  console.log('\n' + '='.repeat(60));
  console.log('示例 1: 设计流浪者开局');
  console.log('='.repeat(60));
  
  const report = generateDesignReport({
    name: '流浪者开局',
    targetSurvivalRate: 0.20,  // 20% 存活率，很危险
    constraints: {
      hasHousing: false,
      requiredClass: 'HOMELESS',
      requiredRegion: 'SLUMS',
      maxGold: 50,
    },
  });
  
  console.log(report);
  
  // 输出说明：
  // 系统会告诉你需要配置：
  // - 食物的 hunger 值应该很低（5-10）
  // - 住所 defenseLevel=1, regenHp=5
  // - 工作薪资 100-200
}

// ==========================================
// 示例 2: 设计"中产舒适"状态
// ==========================================

export function designMiddleClassComfort() {
  console.log('\n' + '='.repeat(60));
  console.log('示例 2: 设计中产舒适状态');
  console.log('='.repeat(60));
  
  const report = generateDesignReport({
    name: '中产舒适期',
    targetSurvivalRate: 0.80,  // 80% 存活率，比较安全
    constraints: {
      hasHousing: true,
      requiredClass: 'MIDDLE',
      requiredRegion: 'SUBURBS',
      minGold: 2000,
    },
  });
  
  console.log(report);
  
  // 输出说明：
  // 系统会告诉你需要配置：
  // - 食物的 hunger 值应该中等（25-30）
  // - 住所 defenseLevel=8, regenHp=25
  // - 工作薪资 2000-2500
}

// ==========================================
// 示例 3: 设计一个负面事件
// ==========================================

export function designNegativeEvent() {
  console.log('\n' + '='.repeat(60));
  console.log('示例 3: 设计"车祸"负面事件');
  console.log('='.repeat(60));
  
  // 当前玩家存活率 70%，想让事件降低 15%
  const eventConfig = generateEventJson(
    'EVENT_CAR_CRASH',
    '车祸',
    -0.15,  // 降低 15% 存活率
    0.70     // 当前存活率
  );
  
  console.log('生成的事件 JSON:');
  console.log(JSON.stringify(eventConfig, null, 2));
  
  // 预期输出：
  // {
  //   "effects": {
  //     "hp": -25,      // 系统计算出的伤害值
  //     "gold": -300,   // 系统计算出的金钱损失
  //     "san": 0
  //   }
  // }
  // 
  // 解释：
  // - 玩家受到 -25 HP 伤害，对 physicalDefense 维度产生影响
  // - 损失 $300，对 economicSecurity 维度产生影响
  // - 综合效果：存活率从 70% 降至 55%
}

// ==========================================
// 示例 4: 设计一个正面事件
// ==========================================

export function designPositiveEvent() {
  console.log('\n' + '='.repeat(60));
  console.log('示例 4: 设计"彩票中奖"正面事件');
  console.log('='.repeat(60));
  
  // 当前玩家存活率 40%，想让事件提升 10%
  const eventConfig = generateEventJson(
    'EVENT_LOTTERY_WIN',
    '彩票中奖',
    +0.10,  // 提升 10% 存活率
    0.40
  );
  
  console.log('生成的事件 JSON:');
  console.log(JSON.stringify(eventConfig, null, 2));
  
  // 预期输出：
  // {
  //   "effects": {
  //     "hp": 0,
  //     "gold": +800,   // 金钱奖励
  //     "san": +15      // 精神愉悦
  //   }
  // }
}

// ==========================================
// 示例 5: 设计一个物品
// ==========================================

export function designNewItem() {
  console.log('\n' + '='.repeat(60));
  console.log('示例 5: 设计"神户和牛"奢侈品食物');
  console.log('='.repeat(60));
  
  // 设计一个能提升 5% 存活率的奢侈品
  const itemConfig = generateItemJson(
    'FOOD_WAGYU_BEEF',
    '神户和牛',
    0.05,      // 提升 5% 存活率
    'FOOD'
  );
  
  console.log('生成的物品 JSON:');
  console.log(JSON.stringify(itemConfig, null, 2));
  
  // 预期输出：
  // {
  //   "id": "FOOD_WAGYU_BEEF",
  //   "name": "神户和牛",
  //   "effects": { "hunger": 25 },  // 系统计算出需要 25 hunger
  //   "price": 150,                  // 根据效果自动定价
  //   "tags": ["FOOD", "LUXURY"]
  // }
}

// ==========================================
// 示例 6: 设计疾病惩罚
// ==========================================

export function designDiseaseSystem() {
  console.log('\n' + '='.repeat(60));
  console.log('示例 6: 设计疾病对存活的影响');
  console.log('='.repeat(60));
  
  // 计算不同疾病类型的影响
  const scenarios = [
    { name: '健康', diseases: [], penalty: 0 },
    { name: '流感', diseases: ['FLU'], penalty: 0.05 },
    { name: '流感+受伤', diseases: ['FLU', 'INJURY'], penalty: 0.10 },
    { name: '急性感染', diseases: ['ACUTE_INFECTION'], penalty: 0.15 },
  ];
  
  console.log('疾病组合对存活率的影响:');
  console.log('组合              存活率惩罚    预期存活率(从70%)');
  console.log('-'.repeat(50));
  
  const baseRate = 0.70;
  for (const s of scenarios) {
    const newRate = Math.max(0, baseRate - s.penalty);
    console.log(
      `${s.name.padEnd(16)}  -${(s.penalty * 100).toFixed(0)}%         ${(newRate * 100).toFixed(0)}%`
    );
  }
  
  // 输出：
  // 健康              0%           70%
  // 流感             -5%           65%
  // 流感+受伤        -10%          60%
  // 急性感染         -15%          55%
}

// ==========================================
// 示例 7: 批量设计多个阶级状态
// ==========================================

export function designAllClasses() {
  console.log('\n' + '='.repeat(60));
  console.log('示例 7: 批量设计四个阶级');
  console.log('='.repeat(60));
  
  const classes = [
    { name: '流浪者', class: 'HOMELESS', rate: 0.20, region: 'SLUMS' },
    { name: '工人', class: 'WORKER', rate: 0.55, region: 'RUST_BELT' },
    { name: '中产', class: 'MIDDLE', rate: 0.80, region: 'SUBURBS' },
    { name: '资本家', class: 'CAPITALIST', rate: 0.92, region: 'DOWNTOWN' },
  ];
  
  console.log('各阶级的推荐配置:\n');
  
  for (const c of classes) {
    const result = generateValuesForState({
      name: c.name,
      targetSurvivalRate: c.rate,
      constraints: {
        requiredClass: c.class,
        requiredRegion: c.region,
        hasHousing: c.class !== 'HOMELESS',
      },
    });
    
    console.log(`${c.name} (目标 ${(c.rate * 100).toFixed(0)}%)`);
    console.log(`  住所: defenseLevel=${result.values.housing.defenseLevel}, regenHp=${result.values.housing.regenHp}`);
    console.log(`  食物: hunger=${result.values.items.foodHungerValue}`);
    console.log(`  工作: salary=$${result.values.jobs.baseSalary}/周`);
    console.log(`  医疗: hpRestore=${result.values.items.medicalHpValue}`);
    console.log('');
  }
}

// ==========================================
// 示例 8: 验证现有配置
// ==========================================

export function validateExistingConfig() {
  console.log('\n' + '='.repeat(60));
  console.log('示例 8: 验证现有 JSON 配置');
  console.log('='.repeat(60));
  
  // 假设你有以下配置，验证是否合理
  const existingItems = [
    { id: '泡面', hunger: 10, price: 5 },
    { id: '罐头', hunger: 20, price: 15 },
    { id: '蔬菜', hunger: 25, price: 30 },
    { id: '牛排', hunger: 35, price: 150 },
  ];
  
  console.log('物品性价比分析:');
  console.log('物品      饥饿值  价格   性价比(饥饿/价格)');
  console.log('-'.repeat(45));
  
  for (const item of existingItems) {
    const ratio = item.hunger / item.price;
    const rating = ratio > 1.5 ? '优秀' : ratio > 0.8 ? '良好' : '较差';
    console.log(
      `${item.id.padEnd(8)}  ${item.hunger.toString().padStart(4)}    $${item.price.toString().padStart(3)}   ${ratio.toFixed(2)} ${rating}`
    );
  }
  
  console.log('\n建议:');
  console.log('- 泡面性价比应该最高（穷人食物）');
  console.log('- 牛排性价比应该最低（奢侈品）');
  console.log('- 如果实际配置不符合，需要调整');
}

// ==========================================
// 运行所有示例
// ==========================================

export function runAllExamples() {
  designHomelessStart();
  designMiddleClassComfort();
  designNegativeEvent();
  designPositiveEvent();
  designNewItem();
  designDiseaseSystem();
  designAllClasses();
  validateExistingConfig();
}

// 使用指南：
// 1. 打开浏览器控制台
// 2. 运行: import { runAllExamples } from '@/logic/survivalValueGenerator.example'
// 3. runAllExamples()
// 4. 查看生成的配置建议
//
// 或者直接在代码中使用:
// const report = generateDesignReport({ name: '我的设计', targetSurvivalRate: 0.75 })
// console.log(report)
