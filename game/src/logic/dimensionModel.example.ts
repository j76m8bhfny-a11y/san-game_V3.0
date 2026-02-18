/**
 * 维度聚合模型使用示例
 * 
 * 展示如何通过调整 JSON 中的物品数值来影响存活概率
 */

import {
  calculateDimensions,
  calculateSurvivalChance,
  quickSurvivalChance,
  rollSurvival,
  exportDimensionAnalysis,
  DimensionId,
} from './dimensionModel';
import { GameState, RegionID, PlayerClass } from '@/types/schema';

// ==========================================
// 示例 1: 查看当前状态的维度分解
// ==========================================

export function example1_CheckDimensions(state: GameState) {
  console.log('\n=== 当前生存维度分析 ===\n');
  
  const dimensions = calculateDimensions(state);
  
  // 打印各维度
  for (const [id, dim] of Object.entries(dimensions)) {
    const names: Record<string, string> = {
      physicalDefense: '物理防御',
      mentalStability: '精神稳定',
      nutritionSupply: '营养供给',
      medicalSupport: '医疗支持',
      economicBuffer: '经济缓冲',
    };
    
    const bar = '█'.repeat(Math.floor(dim.normalized * 20)) + 
                '░'.repeat(20 - Math.floor(dim.normalized * 20));
    console.log(`${names[id].padEnd(10)} [${bar}] ${(dim.normalized * 100).toFixed(0)}%`);
    
    // 打印详细来源
    for (const source of dim.breakdown.slice(0, 3)) {
      console.log(`  └─ ${source.source}: ${source.value.toFixed(1)} (贡献 ${(source.contribution * 100).toFixed(1)}%)`);
    }
  }
}

// ==========================================
// 示例 2: 对比不同配置的生存率
// ==========================================

export function example2_CompareConfigurations() {
  // 配置 A: 流浪者开局
  const homelessState = createMockState({
    class: PlayerClass.Homeless,
    region: RegionID.Slums,
    housing: null,
    inventory: ['instant_noodles'],
    gold: 50,
    diseases: [],
  });
  
  // 配置 B: 工人中期
  const workerState = createMockState({
    class: PlayerClass.Worker,
    region: RegionID.RustBelt,
    housing: 'slum_shack',
    inventory: ['canned_food', 'kettle', 'med_kit', 'sleeping_bag'],
    gold: 500,
    diseases: [],
  });
  
  // 配置 C: 中产阶级
  const middleState = createMockState({
    class: PlayerClass.Middle,
    region: RegionID.Suburbs,
    housing: 'suburb_apartment',
    inventory: ['fresh_vegetables', 'security_door', 'medical_insurance_basic'],
    gold: 3000,
    diseases: [],
  });
  
  // 配置 D: 资本家
  const capitalistState = createMockState({
    class: PlayerClass.Capitalist,
    region: RegionID.Downtown,
    housing: 'downtown_penthouse',
    inventory: ['luxury_steak', 'medical_insurance_premium'],
    gold: 50000,
    diseases: [],
  });
  
  console.log('\n=== 不同配置的存活率对比 ===\n');
  console.log('配置              存活率    风险等级    最短板');
  console.log('─────────────────────────────────────────────────');
  
  const configs = [
    { name: '流浪者开局', state: homelessState },
    { name: '工人中期  ', state: workerState },
    { name: '中产阶级  ', state: middleState },
    { name: '资本家    ', state: capitalistState },
  ];
  
  for (const config of configs) {
    const result = calculateSurvivalChance(config.state);
    const name = config.name.padEnd(10);
    const rate = `${(result.survivalProbability * 100).toFixed(1)}%`.padStart(6);
    const risk = result.riskLevel.padStart(8);
    const weak = (result.weakDimension || '无').padStart(10);
    console.log(`${name}  ${rate}    ${risk}  ${weak}`);
  }
}

// ==========================================
// 示例 3: 调整物品数值的影响
// ==========================================

export function example3_ItemValueImpact() {
  console.log('\n=== 物品数值调整的影响 ===\n');
  
  const baseState = createMockState({
    class: PlayerClass.Worker,
    region: RegionID.RustBelt,
    housing: null,
    inventory: [],
    gold: 500,
    diseases: [],
  });
  
  // 测试不同食物对 nutritionSupply 的影响
  const foods = [
    { id: 'instant_noodles', name: '泡面', expected: 5 },
    { id: 'canned_food', name: '罐头', expected: 20 },
    { id: 'fresh_vegetables', name: '蔬菜', expected: 40 },
    { id: 'luxury_steak', name: '牛排', expected: 60 },
  ];
  
  console.log('食物对营养维度的影响:');
  console.log('食物名称        预期分值   实际分值   存活率变化');
  console.log('─────────────────────────────────────────────────');
  
  const baseResult = calculateSurvivalChance(baseState);
  
  for (const food of foods) {
    const stateWithFood = {
      ...baseState,
      inventory: [food.id],
    };
    const result = calculateSurvivalChance(stateWithFood as any);
    const dims = calculateDimensions(stateWithFood as any);
    
    const name = food.name.padEnd(12);
    const expected = `${food.expected}`.padStart(6);
    const actual = `${(dims.nutritionSupply.value).toFixed(0)}`.padStart(8);
    const change = `${((result.survivalProbability - baseResult.survivalProbability) * 100).toFixed(1)}%`.padStart(10);
    
    console.log(`${name}  ${expected}    ${actual}    ${change}`);
  }
}

// ==========================================
// 示例 4: 疾病对存活率的影响
// ==========================================

export function example4_DiseaseImpact() {
  console.log('\n=== 疾病对存活率的影响 ===\n');
  
  const baseState = createMockState({
    class: PlayerClass.Worker,
    region: RegionID.Suburbs,
    housing: 'suburb_apartment',
    inventory: ['canned_food', 'med_kit'],
    gold: 1000,
    diseases: [],
  });
  
  const diseaseScenarios = [
    { name: '健康', diseases: [] },
    { name: '流感', diseases: ['FLU'] },
    { name: '流感+受伤', diseases: ['FLU', 'INJURY'] },
    { name: '急性感染', diseases: ['ACUTE_INFECTION'] },
    { name: '多病并发', diseases: ['FLU', 'INJURY', 'ACUTE_INFECTION'] },
  ];
  
  console.log('疾病组合        存活率    风险等级');
  console.log('─────────────────────────────────────');
  
  const baseResult = calculateSurvivalChance(baseState);
  
  for (const scenario of diseaseScenarios) {
    const state = {
      ...baseState,
      vitality: {
        ...baseState.vitality,
        activeDiseases: scenario.diseases,
      },
    };
    
    const result = calculateSurvivalChance(state as any);
    
    const name = scenario.name.padEnd(12);
    const rate = `${(result.survivalProbability * 100).toFixed(1)}%`.padStart(6);
    const risk = result.riskLevel.padStart(8);
    
    console.log(`${name}  ${rate}    ${risk}`);
  }
}

// ==========================================
// 示例 5: 回合判定
// ==========================================

export function example5_TurnResolution() {
  console.log('\n=== 回合存活判定 ===\n');
  
  const state = createMockState({
    class: PlayerClass.Worker,
    region: RegionID.Slums,
    housing: null,
    inventory: ['instant_noodles'],
    gold: 100,
    hp: 30,
    maxHp: 100,
    diseases: ['FLU'],
  });
  
  const result = calculateSurvivalChance(state);
  
  console.log(`当前存活概率: ${(result.survivalProbability * 100).toFixed(1)}%`);
  console.log(`风险等级: ${result.riskLevel}`);
  console.log(`建议: ${result.recommendations.join(', ')}`);
  console.log('');
  
  // 模拟 10 次判定
  console.log('模拟 10 次回合判定:');
  let survived = 0;
  for (let i = 0; i < 10; i++) {
    const roll = rollSurvival(state);
    const status = roll.survived ? '✓ 存活' : '✗ 死亡';
    const dice = `${(roll.roll * 100).toFixed(1)}%`;
    console.log(`  第 ${i + 1} 次: ${status} (骰子: ${dice}, 阈值: ${(roll.chance * 100).toFixed(1)}%)`);
    if (roll.survived) survived++;
  }
  
  console.log(`\n存活率统计: ${survived}/10 (${(survived / 10 * 100).toFixed(0)}%)`);
}

// ==========================================
// 示例 6: 完整调试报告
// ==========================================

export function example6_FullReport() {
  const state = createMockState({
    class: PlayerClass.Worker,
    region: RegionID.RustBelt,
    housing: 'slum_shack',
    inventory: ['canned_food', 'kettle', 'med_kit', 'lucky_charm'],
    gold: 600,
    hp: 70,
    maxHp: 100,
    san: 60,
    maxSan: 100,
    hunger: 40,
    diseases: [],
  });
  
  console.log(exportDimensionAnalysis(state));
}

// ==========================================
// 辅助函数：创建模拟状态
// ==========================================

interface MockStateConfig {
  class: PlayerClass;
  region: RegionID;
  housing: string | null;
  inventory: string[];
  gold: number;
  hp?: number;
  maxHp?: number;
  san?: number;
  maxSan?: number;
  hunger?: number;
  diseases?: string[];
}

function createMockState(config: MockStateConfig): GameState {
  return {
    vitality: {
      metrics: {
        hp: config.hp ?? 80,
        maxHp: config.maxHp ?? 100,
        san: config.san ?? 70,
        maxSan: config.maxSan ?? 100,
        gold: config.gold,
        creditScore: 600,
        addiction: 0,
        resistance: 10,
        hunger: config.hunger ?? 30,
        maxHunger: 100,
      },
      identity: {
        currentClass: config.class,
        points: { red: 0, wolf: 0, old: 0 },
      },
      time: { currentTurn: 1, totalTurns: 1 },
      activeDiseases: config.diseases ?? [],
      ledger: { history: [] },
      flags: { isHomeless: !config.housing, debtTurns: 0, hiddenTags: [] },
      activeJobs: [],
      activeInsurances: [],
    },
    currentRegion: config.region,
    activeHousing: config.housing ? {
      definitionId: config.housing,
      type: 'RENT',
      name: config.housing,
      region: config.region,
      defenseLevel: config.housing.includes('penthouse') ? 90 : config.housing.includes('apartment') ? 60 : 20,
      regenHp: config.housing.includes('penthouse') ? 15 : config.housing.includes('apartment') ? 8 : 2,
      weeklyCosts: [],
    } : null,
    inventory: config.inventory,
    activeInsurances: [],
    dmvQueue: null,
    activeLease: null,
    history: [],
    unlockedArchives: [],
    achievedEndings: [],
    bank: { activeLoans: [], lifetimeInterestPaid: 0 },
    prison: { inJail: false, crime: '', sentenceTurns: 0, turnsServed: 0, bailAmount: 0 },
    faith: {
      id: 'NONE',
      level: 1,
      hasPerformedRite: false,
      debuffs: [],
      bannedFaiths: [],
      behaviorState: { lastAction: null, currentStreak: 0, hasReceivedInvitation: false },
    },
    crypto: {
      isAccountOpen: false,
      btcPrice: 30000,
      priceHistory: [],
      positions: [],
      weeklyNews: null,
      weeklyTradesCount: 0,
      lastTradeTurn: -1,
    },
    isShopOpen: false,
    isInventoryOpen: false,
    isArchiveOpen: false,
    isMenuOpen: false,
    currentRoast: null,
    notifications: [],
    viewingArchive: null,
    currentEvent: null,
    activeBill: null,
    currentCryptoNews: null,
    ending: null,
    _hasHydrated: true,
    dietState: {
      junkFoodPoints: 0,
      healthyPoints: 0,
      consecutiveJunkDays: 0,
      consecutiveHealthyDays: 0,
      sodiumIntake: 0,
      sugarIntake: 0,
      redMeatPoints: 0,
      noFreshFoodDays: 0,
    },
    activeBuffs: [],
  } as any;
}

// ==========================================
// 运行所有示例
// ==========================================

export function runAllExamples() {
  const mockState = createMockState({
    class: PlayerClass.Worker,
    region: RegionID.RustBelt,
    housing: 'slum_shack',
    inventory: ['canned_food', 'kettle'],
    gold: 500,
  });
  
  example1_CheckDimensions(mockState);
  example2_CompareConfigurations();
  example3_ItemValueImpact();
  example4_DiseaseImpact();
  example5_TurnResolution();
  example6_FullReport();
}
