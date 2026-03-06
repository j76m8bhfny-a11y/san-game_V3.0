/**
 * 边界条件与数值溢出检查脚本
 * 用于自动化检测游戏中的数值边界问题
 */

import { useGameStore } from '@/store/useGameStore';
import { VitalityMetrics } from '@/types/schema';

// 检查结果类型
export interface BoundaryCheckResult {
  dimension: string;
  testCase: string;
  input: any;
  expected: any;
  actual: any;
  pass: boolean;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  error?: string;
  notes?: string;
}

// 边界配置
const BOUNDARY_CONFIG = {
  gold: {
    min: -999999999,
    max: 999999999,
    default: 0,
    path: 'vitality.metrics.gold',
    description: '金钱'
  },
  hp: {
    min: 0,
    max: 100,
    default: 100,
    path: 'vitality.metrics.hp',
    description: '生命值'
  },
  insight: {
    min: 0,
    max: 100,
    default: 0,
    path: 'vitality.metrics.insight',
    description: '灵视值'
  },
  hunger: {
    min: 0,
    max: 100,
    default: 100,
    path: 'vitality.metrics.hunger',
    description: '饱腹度'
  },
  addiction: {
    min: 0,
    max: 100,
    default: 0,
    path: 'vitality.metrics.addiction',
    description: '成瘾值'
  },
  resistance: {
    min: 0,
    max: 100,
    default: 0,
    path: 'vitality.metrics.resistance',
    description: '药物抗性'
  },
  creditScore: {
    min: 300,
    max: 850,
    default: 500,
    path: 'vitality.metrics.creditScore',
    description: '信用分'
  },
  currentTurn: {
    min: 1,
    max: 52,
    default: 1,
    path: 'vitality.time.currentTurn',
    description: '当前回合'
  }
};

/**
 * 从对象路径获取值
 */
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((o, p) => o?.[p], obj);
}

/**
 * 边界检查器主类
 */
export const BoundaryChecker = {
  /**
   * 运行所有边界检查
   */
  runAll: async (): Promise<{
    passed: number;
    failed: number;
    critical: number;
    details: BoundaryCheckResult[];
  }> => {
    console.log('🧪 === 边界条件检查开始 ===\n');
    
    const results: BoundaryCheckResult[] = [
      ...BoundaryChecker.checkGold(),
      ...BoundaryChecker.checkHP(),
      ...BoundaryChecker.checkInsight(),
      ...BoundaryChecker.checkHunger(),
      ...BoundaryChecker.checkAddiction(),
      ...BoundaryChecker.checkResistance(),
      ...BoundaryChecker.checkCreditScore(),
      ...BoundaryChecker.checkTurn(),
      ...BoundaryChecker.checkArrays()
    ];
    
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    const critical = results.filter(r => !r.pass && r.severity === 'CRITICAL').length;
    
    console.log(`\n📊 总计: ${results.length} | ✅通过: ${passed} | ❌失败: ${failed} | 🔴严重: ${critical}`);
    
    if (failed > 0) {
      console.table(results.filter(r => !r.pass).map(r => ({
        维度: r.dimension,
        测试: r.testCase,
        输入: r.input,
        期望: r.expected,
        实际: r.actual,
        通过: r.pass ? '✅' : '❌',
        严重: r.severity === 'CRITICAL' ? '🔴' : '⚠️'
      })));
    }
    
    // 生成详细报告
    BoundaryChecker.generateReport(results);
    
    return { passed, failed, critical, details: results };
  },

  /**
   * 金钱检查
   */
  checkGold: (): BoundaryCheckResult[] => {
    const config = BOUNDARY_CONFIG.gold;
    const tests = [
      { value: 50, expect: 50, desc: '正常值' },
      { value: 999999998, expect: 999999998, desc: '接近上限' },
      { value: 1000000000, expect: 999999999, desc: '超过上限（应封顶）', critical: true },
      { value: -999999998, expect: -999999998, desc: '接近下限' },
      { value: -1000000000, expect: -999999999, desc: '超过下限（应封底）', critical: true },
      { value: Infinity, expect: 999999999, desc: 'Infinity处理', critical: true },
      { value: -Infinity, expect: -999999999, desc: '-Infinity处理', critical: true },
      { value: NaN, expect: 0, desc: 'NaN处理（应归0）', critical: true },
      { value: 0.1 + 0.2, expect: 0.3, desc: '浮点精度（显示0.3）', precision: 0.001 }
    ];
    
    return tests.map(t => ({
      dimension: 'gold',
      testCase: t.desc,
      ...BoundaryChecker.testValue(config.path, t.value, t.expect, t.precision),
      severity: t.critical ? 'CRITICAL' : 'INFO'
    }));
  },

  /**
   * HP检查
   */
  checkHP: (): BoundaryCheckResult[] => {
    const config = BOUNDARY_CONFIG.hp;
    const tests = [
      { value: 50, expect: 50, desc: '正常值' },
      { value: 100, expect: 100, desc: '满血上限' },
      { value: 101, expect: 100, desc: '超过100（应封顶）', critical: true },
      { value: 0, expect: 0, desc: '零值（死亡线）', critical: true },
      { value: -1, expect: 0, desc: '负数（应归0）', critical: true },
      { value: 50.7, expect: 50, desc: '小数（应收整）' }
    ];
    
    return tests.map(t => ({
      dimension: 'hp',
      testCase: t.desc,
      ...BoundaryChecker.testValue(config.path, t.value, t.expect),
      severity: t.critical ? 'CRITICAL' : 'INFO'
    }));
  },

  /**
   * Insight检查
   */
  checkInsight: (): BoundaryCheckResult[] => {
    const config = BOUNDARY_CONFIG.insight;
    const tests = [
      { value: 40, expect: 40, desc: '正常值' },
      { value: 100, expect: 100, desc: '上限（疯狂边缘）' },
      { value: 0, expect: 0, desc: '下限（完全麻木）' },
      { value: 105, expect: 100, desc: '超过上限', critical: true },
      { value: -5, expect: 0, desc: '低于下限', critical: true }
    ];
    
    return tests.map(t => ({
      dimension: 'insight',
      testCase: t.desc,
      ...BoundaryChecker.testValue(config.path, t.value, t.expect),
      severity: t.critical ? 'CRITICAL' : 'INFO'
    }));
  },

  /**
   * Hunger检查
   */
  checkHunger: (): BoundaryCheckResult[] => {
    const config = BOUNDARY_CONFIG.hunger;
    const tests = [
      { value: 50, expect: 50, desc: '正常值' },
      { value: 100, expect: 100, desc: '饱腹上限' },
      { value: 0, expect: 0, desc: '饥饿状态' },
      { value: 105, expect: 100, desc: '超过上限', critical: true },
      { value: -5, expect: 0, desc: '低于下限', critical: true }
    ];
    
    return tests.map(t => ({
      dimension: 'hunger',
      testCase: t.desc,
      ...BoundaryChecker.testValue(config.path, t.value, t.expect),
      severity: t.critical ? 'CRITICAL' : 'INFO'
    }));
  },

  /**
   * Addiction检查
   */
  checkAddiction: (): BoundaryCheckResult[] => {
    const config = BOUNDARY_CONFIG.addiction;
    const tests = [
      { value: 50, expect: 50, desc: '正常值' },
      { value: 100, expect: 100, desc: '成瘾上限' },
      { value: 0, expect: 0, desc: '无成瘾' },
      { value: 105, expect: 100, desc: '超过上限', critical: true },
      { value: -5, expect: 0, desc: '低于下限', critical: true }
    ];
    
    return tests.map(t => ({
      dimension: 'addiction',
      testCase: t.desc,
      ...BoundaryChecker.testValue(config.path, t.value, t.expect),
      severity: t.critical ? 'CRITICAL' : 'INFO'
    }));
  },

  /**
   * Resistance检查
   */
  checkResistance: (): BoundaryCheckResult[] => {
    const config = BOUNDARY_CONFIG.resistance;
    const tests = [
      { value: 50, expect: 50, desc: '正常值' },
      { value: 100, expect: 100, desc: '抗性上限' },
      { value: 0, expect: 0, desc: '无抗性' },
      { value: 105, expect: 100, desc: '超过上限', critical: true },
      { value: -5, expect: 0, desc: '低于下限', critical: true }
    ];
    
    return tests.map(t => ({
      dimension: 'resistance',
      testCase: t.desc,
      ...BoundaryChecker.testValue(config.path, t.value, t.expect),
      severity: t.critical ? 'CRITICAL' : 'INFO'
    }));
  },

  /**
   * 信用分检查
   */
  checkCreditScore: (): BoundaryCheckResult[] => {
    const config = BOUNDARY_CONFIG.creditScore;
    const tests = [
      { value: 400, expect: 400, desc: '正常值' },
      { value: 850, expect: 850, desc: '满分' },
      { value: 900, expect: 850, desc: '超过850', critical: true },
      { value: 300, expect: 300, desc: '最低分' },
      { value: 250, expect: 300, desc: '低于300（应修正为300）', critical: true }
    ];
    
    return tests.map(t => ({
      dimension: 'creditScore',
      testCase: t.desc,
      ...BoundaryChecker.testValue(config.path, t.value, t.expect),
      severity: t.critical ? 'CRITICAL' : 'INFO'
    }));
  },

  /**
   * 回合检查
   */
  checkTurn: (): BoundaryCheckResult[] => {
    const config = BOUNDARY_CONFIG.currentTurn;
    const tests = [
      { value: 1, expect: 1, desc: '第1周' },
      { value: 26, expect: 26, desc: '半年' },
      { value: 52, expect: 52, desc: '满1年（游戏结束）' },
      { value: 53, expect: 53, desc: '第2年（应支持或触发结局）', note: '可接受' },
      { value: 0, expect: 1, desc: '0回合（应修正为1）', critical: true },
      { value: -5, expect: 1, desc: '负数回合（应修正）', critical: true }
    ];
    
    return tests.map(t => ({
      dimension: 'turn',
      testCase: t.desc,
      ...BoundaryChecker.testValue(config.path, t.value, t.expect),
      severity: t.critical ? 'CRITICAL' : 'INFO',
      notes: t.note
    }));
  },

  /**
   * 数组长度边界检查
   */
  checkArrays: (): BoundaryCheckResult[] => {
    const results: BoundaryCheckResult[] = [];
    const store = useGameStore.getState();
    
    // 检查 inventory
    const inventoryLength = store.inventory?.length || 0;
    results.push({
      dimension: 'array.inventory',
      testCase: '当前库存长度',
      input: inventoryLength,
      expected: '<= 100',
      actual: inventoryLength,
      pass: inventoryLength <= 100,
      severity: inventoryLength > 100 ? 'WARNING' : 'INFO'
    });
    
    // 检查 activeDiseases
    const diseasesLength = store.vitality?.activeDiseases?.length || 0;
    results.push({
      dimension: 'array.diseases',
      testCase: '当前疾病数量',
      input: diseasesLength,
      expected: '<= 10',
      actual: diseasesLength,
      pass: diseasesLength <= 10,
      severity: diseasesLength > 10 ? 'WARNING' : 'INFO'
    });
    
    // 检查 activeBuffs
    const buffsLength = store.vitality?.activeBuffs?.length || 0;
    results.push({
      dimension: 'array.buffs',
      testCase: '当前Buff数量',
      input: buffsLength,
      expected: '<= 50',
      actual: buffsLength,
      pass: buffsLength <= 50,
      severity: buffsLength > 50 ? 'WARNING' : 'INFO'
    });
    
    // 检查 bank.activeLoans
    const loansLength = store.bank?.activeLoans?.length || 0;
    results.push({
      dimension: 'array.loans',
      testCase: '当前贷款数量',
      input: loansLength,
      expected: '<= 5',
      actual: loansLength,
      pass: loansLength <= 5,
      severity: loansLength > 5 ? 'WARNING' : 'INFO'
    });
    
    // 检查 ledger history
    const ledgerLength = store.vitality?.ledger?.history?.length || 0;
    results.push({
      dimension: 'array.ledger',
      testCase: '账本历史记录数',
      input: ledgerLength,
      expected: '<= 100',
      actual: ledgerLength,
      pass: ledgerLength <= 100,
      severity: ledgerLength > 100 ? 'WARNING' : 'INFO'
    });
    
    return results;
  },

  /**
   * 通用测试函数
   */
  testValue: (
    path: string, 
    input: any, 
    expected: any,
    precision?: number
  ): { input: any; expected: any; actual: any; pass: boolean; error?: string } => {
    try {
      const store = useGameStore.getState();
      const original = getValueByPath(store, path);
      
      // 使用 modifyStats 设置值
      const field = path.split('.').pop() as keyof VitalityMetrics;
      store.modifyStats({ [field]: input });
      
      // 读取实际值
      const actual = getValueByPath(useGameStore.getState(), path);
      
      // 恢复原始值
      store.modifyStats({ [field]: original });
      
      // 判断通过条件
      let pass: boolean;
      if (precision !== undefined) {
        pass = Math.abs(actual - expected) < precision;
      } else if (typeof expected === 'number' && typeof actual === 'number') {
        pass = Math.abs(actual - expected) < 0.001;
      } else {
        pass = actual === expected;
      }
      
      return {
        input,
        expected,
        actual,
        pass
      };
    } catch (e: any) {
      return {
        input,
        expected,
        actual: 'ERROR',
        pass: false,
        error: e.message
      };
    }
  },

  /**
   * 生成详细报告
   */
  generateReport: (results: BoundaryCheckResult[]) => {
    const timestamp = new Date().toISOString();
    const criticalIssues = results.filter(r => !r.pass && r.severity === 'CRITICAL');
    const warnings = results.filter(r => !r.pass && r.severity === 'WARNING');
    
    console.log('\n📋 === 边界检查详细报告 ===');
    console.log(`⏰ 检查时间: ${timestamp}`);
    console.log(`📊 总测试数: ${results.length}`);
    console.log(`✅ 通过: ${results.filter(r => r.pass).length}`);
    console.log(`⚠️ 警告: ${warnings.length}`);
    console.log(`🔴 严重问题: ${criticalIssues.length}`);
    
    if (criticalIssues.length > 0) {
      console.log('\n🔴 严重问题列表:');
      criticalIssues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.dimension}] ${issue.testCase}`);
        console.log(`     输入: ${issue.input}, 期望: ${issue.expected}, 实际: ${issue.actual}`);
        if (issue.error) console.log(`     错误: ${issue.error}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ 警告列表:');
      warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. [${warning.dimension}] ${warning.testCase}: ${warning.actual}`);
      });
    }
    
    console.log('\n✅ 边界检查完成');
    
    return {
      timestamp,
      summary: {
        total: results.length,
        passed: results.filter(r => r.pass).length,
        warnings: warnings.length,
        critical: criticalIssues.length
      },
      criticalIssues,
      warnings
    };
  }
};

// 暴露到 window 以便控制台调用
declare global {
  interface Window {
    BoundaryChecker: typeof BoundaryChecker;
  }
}

if (typeof window !== 'undefined') {
  window.BoundaryChecker = BoundaryChecker;
}

export default BoundaryChecker;
