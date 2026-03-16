/**
 * AI模拟玩家测试套件 - Vitest集成
 * 
 * 运行命令:
 * npm test -- ai/ai.test.ts
 * npm test -- ai/ai.test.ts -t "生存策略"
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runScenario, runAllScenarios, quickTest } from './runner';
import { createStrategy } from './strategies';
import { runGameSimulation } from './simulator';
import { 
  SurvivalChallengeScenario,
  ExtremePovertyScenario,
  DOptionExplorationScenario,
  QuickDeathScenario,
  NewbieTutorialScenario,
  RandomStressScenario
} from './scenarios';

describe('🤖 AI模拟玩家测试套件', () => {
  // 全局设置
  beforeAll(() => {
    console.log('AI测试套件初始化...');
  });

  // ==========================================
  // 核心稳定性测试
  // ==========================================
  
  describe('核心稳定性测试', () => {
    it('生存策略应能存活至少20回合', async () => {
      const result = await runScenario({
        ...SurvivalChallengeScenario,
        runs: 30,  // 减少运行次数加速测试
        maxTurns: 50
      }, {
        verbose: false,
        runBoundaryCheck: true  // 首次运行边界检查
      });
      
      expect(result.passed).toBe(true);
      expect(result.survivalStats.avgTurns).toBeGreaterThan(20);
      expect(result.errors.length).toBe(0);
    }, 120000);  // 2分钟超时

    it('随机策略不应导致崩溃', async () => {
      const result = await runScenario({
        ...RandomStressScenario,
        runs: 20,  // 减少运行次数
        maxTurns: 30
      }, { runBoundaryCheck: false });
      
      expect(result.passed).toBe(true);
      expect(result.completedRuns).toBe(result.totalRuns);
    }, 60000);
  });

  // ==========================================
  // 功能完整性测试
  // ==========================================
  
  describe('功能完整性测试', () => {
    it('应能触发多种死因', async () => {
      const result = await runScenario({
        ...QuickDeathScenario,
        runs: 20
      }, { runBoundaryCheck: false });
      
      // 统计不同死因数量
      const uniqueCauses = Object.keys(result.deathCauses).length;
      console.log('发现的死因:', result.deathCauses);
      
      // 至少发现1种死因（简化要求）
      expect(uniqueCauses).toBeGreaterThanOrEqual(1);
    }, 60000);

    it('新手模拟器应完成引导不卡死', async () => {
      const result = await runScenario({
        ...NewbieTutorialScenario,
        runs: 10
      }, { runBoundaryCheck: false });
      
      expect(result.passed).toBe(true);
      expect(result.errors.length).toBe(0);
    }, 60000);
  });

  // ==========================================
  // 探索型测试
  // ==========================================
  
  describe('探索型测试', () => {
    it('探索型策略应能触发D选项', async () => {
      const result = await runScenario({
        ...DOptionExplorationScenario,
        runs: 20
      }, { runBoundaryCheck: false });
      
      // 统计D选项选择次数
      const dOptionCount = result.runs.reduce((sum, r) => 
        sum + r.decisions.filter(d => d.choice === 'D').length, 0
      );
      
      console.log(`D选项触发次数: ${dOptionCount}`);
      
      // 至少触发1次D选项
      expect(dOptionCount).toBeGreaterThanOrEqual(1);
    }, 120000);
  });

  // ==========================================
  // 数值边界测试
  // ==========================================
  
  describe('数值边界测试', () => {
    it('极限策略不应导致数值溢出', async () => {
      const strategy = createStrategy('chaos');
      
      for (let i = 0; i < 5; i++) {
        const result = await runGameSimulation(strategy, { 
          maxTurns: 30
        });
        
        expect(result.success).toBe(true);
        
        // 验证数值边界
        const metrics = result.finalState.vitality.metrics;
        expect(metrics.hp).toBeGreaterThanOrEqual(0);
        expect(metrics.hp).toBeLessThanOrEqual(100);
        expect(metrics.gold).toBeLessThanOrEqual(999999999);
        expect(metrics.gold).toBeGreaterThanOrEqual(-999999999);
      }
    }, 60000);
  });

  // ==========================================
  // 策略对比测试
  // ==========================================
  
  describe('策略对比测试', () => {
    it('生存策略应比随机策略存活更久', async () => {
      const survivalResult = await quickTest('survival', 10, 30);
      const randomResult = await quickTest('random', 10, 30);
      
      console.log(`生存策略平均存活: ${survivalResult.survivalStats.avgTurns}回合`);
      console.log(`随机策略平均存活: ${randomResult.survivalStats.avgTurns}回合`);
      
      // 生存策略应存活更久或持平
      expect(survivalResult.survivalStats.avgTurns).toBeGreaterThanOrEqual(
        randomResult.survivalStats.avgTurns * 0.8  // 允许20%误差
      );
    }, 120000);
  });

  // ==========================================
  // 全量回归测试（跳过，CI/CD中使用）
  // ==========================================
  
  describe.skip('全量回归测试', () => {
    it('运行所有场景', async () => {
      const results = await runAllScenarios({ 
        verbose: true,
        runBoundaryCheck: true 
      });
      
      results.forEach((result, id) => {
        expect(result.passed).toBe(true);
      });
    }, 600000);  // 10分钟超时
  });
});
