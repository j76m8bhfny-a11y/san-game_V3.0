/**
 * AI测试与现有工具集成测试
 * 
 * 验证:
 * 1. 与BoundaryChecker的集成
 * 2. 与调试工具的兼容性
 * 3. 状态快照的正确性
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoundaryChecker } from '@/test/boundary';
import { createStrategy } from './strategies';
import { runGameSimulation, createSnapshotFromStore } from './simulator';
import { useGameStore } from '@/store/useGameStore';

describe('AI测试与现有工具集成', () => {
  
  beforeEach(() => {
    // 每个测试前重置store
    const store = useGameStore.getState();
    store.restartGame();
  });

  // ==========================================
  // BoundaryChecker集成
  // ==========================================
  
  describe('BoundaryChecker集成', () => {
    it('边界检查通过后应能正常运行AI测试', async () => {
      // 1. 先运行边界检查
      const boundaryResult = await BoundaryChecker.runAll();
      expect(boundaryResult.critical).toBe(0);
      
      // 2. 运行AI测试
      const strategy = createStrategy('random');
      const result = await runGameSimulation(strategy, { maxTurns: 10 });
      
      expect(result.success).toBe(true);
    }, 30000);

    it('AI运行中不应产生数值溢出', async () => {
      const strategy = createStrategy('chaos');  // 使用极限策略制造极端情况
      
      for (let i = 0; i < 5; i++) {
        const result = await runGameSimulation(strategy, { 
          maxTurns: 20,
          onTurnEnd: (turn, state) => {
            // 检查数值边界
            expect(state.vitality.metrics.hp).toBeGreaterThanOrEqual(0);
            expect(state.vitality.metrics.hp).toBeLessThanOrEqual(100);
            expect(state.vitality.metrics.gold).toBeLessThanOrEqual(999999999);
            expect(state.vitality.metrics.gold).toBeGreaterThanOrEqual(-999999999);
          }
        });
        
        expect(result.success).toBe(true);
      }
    }, 60000);
  });

  // ==========================================
  // 状态快照测试
  // ==========================================
  
  describe('状态快照测试', () => {
    it('状态快照应正确反映store状态', async () => {
      const store = useGameStore.getState();
      
      // 修改store状态
      store.vitality.metrics.hp = 50;
      store.vitality.metrics.gold = 1000;
      
      // 创建快照
      const snapshot = createSnapshotFromStore(store);
      
      // 验证快照
      expect(snapshot.vitality.metrics.hp).toBe(50);
      expect(snapshot.vitality.metrics.gold).toBe(1000);
      expect(snapshot.currentTurn).toBe(store.vitality.time.currentTurn);
    });

    it('游戏结束后状态应被正确记录', async () => {
      const strategy = createStrategy('chaos');
      const result = await runGameSimulation(strategy, { maxTurns: 10 });
      
      // 验证结果包含正确的状态结构
      expect(result.finalState).toHaveProperty('vitality');
      expect(result.finalState).toHaveProperty('bank');
      expect(result.finalState).toHaveProperty('faith');
      expect(result.finalState).toHaveProperty('crypto');
      expect(result.finalState).toHaveProperty('prison');
    });
  });

  // ==========================================
  // 调试工具兼容性
  // ==========================================
  
  describe('调试工具兼容性', () => {
    it('应在window上暴露BoundaryChecker', () => {
      expect(window.BoundaryChecker).toBeDefined();
      expect(typeof window.BoundaryChecker.runAll).toBe('function');
    });

    it('AI测试不应影响调试工具状态', async () => {
      // 记录初始状态
      const store = useGameStore.getState();
      const initialDeaths = store.totalDeaths;
      
      // 运行AI测试
      const strategy = createStrategy('random');
      await runGameSimulation(strategy, { maxTurns: 5 });
      
      // 重置游戏
      store.restartGame();
      
      // 验证调试工具可用
      const boundaryResult = await BoundaryChecker.runAll();
      expect(boundaryResult).toHaveProperty('passed');
      expect(boundaryResult).toHaveProperty('failed');
    });
  });
});
