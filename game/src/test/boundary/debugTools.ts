/**
 * 调试工具集
 * 用于游戏测试和边界条件验证
 */

import { useGameStore } from '@/store/useGameStore';
// import { PlayerClass, FaithID } from '@/types/schema';
import { BoundaryChecker } from './boundaryChecker';

/**
 * 调试工具类型定义
 */
export interface DebugTools {
  // 设置单个字段
  set: (path: string, value: any) => void;
  
  // 获取当前状态
  get: (path?: string) => any;
  
  // 快速设置测试场景
  scenario: (name: 'starvation' | 'rich' | 'sick' | 'indebted' | 'maxInsight' | 'jail' | 'overdueLoans') => void;
  
  // 运行边界检查
  check: () => Promise<any>;
  
  // 数组压力测试
  testArrays: () => ArrayTestResult[];
  
  // 检查事件效果
  checkEventEffects: () => any[];
  
  // 添加物品
  addItem: (itemId: string) => void;
  
  // 添加疾病
  addDisease: (diseaseId: string) => void;
  
  // 应用贷款
  applyForLoan: (loanData: { id: string; amount: number; rate: number; overdue?: number }) => boolean;
  
  // 重置游戏
  reset: () => void;
  
  // 显示帮助
  help: () => void;
}

export interface ArrayTestResult {
  name: string;
  pass: boolean;
  details: Record<string, any>;
}

/**
 * 场景配置
 */
const SCENARIOS: Record<string, (store: any) => void> = {
  // 场景一：饿死危机（HP+Gold复合）
  starvation: (store) => {
    store.modifyStats({ hp: 10, gold: 0, hunger: 0 });
    store.updatePlayerStats({ activeHousing: null });
    console.log('🍖 已应用场景: 饿死危机 (HP=10, Gold=0, 无住房)');
  },
  
  // 场景二：富豪
  rich: (store) => {
    store.modifyStats({ 
      gold: 999999998, 
      hp: 100, 
      insight: 0,
      hunger: 100 
    });
    store.updateIdentityPoints({ red: 0, wolf: 50, old: 0 });
    console.log('💰 已应用场景: 富豪 (Gold=999999998)');
  },
  
  // 场景三：病死危机（HP+Diseases复合）
  sick: (store) => {
    store.modifyStats({ hp: 15 });
    // 添加多个疾病
    store.contractDisease('DIABETES');
    store.contractDisease('FLU');
    store.contractDisease('ANXIETY');
    console.log('🤒 已应用场景: 病死危机 (HP=15, 多疾病)');
  },
  
  // 场景四：破产翻身（Gold+Loans复合）
  indebted: (store) => {
    store.modifyStats({ gold: -5000 });
    // 直接修改 bank 添加逾期贷款
    const currentTurn = store.vitality?.time?.currentTurn || 1;
    const activeLoans = store.bank?.activeLoans || [];
    
    const newLoans = [
      ...activeLoans,
      {
        id: 'LOAN_1',
        productId: 'PAYDAY_01',
        principal: 3000,
        interest: 500,
        rate: 0.25,
        dueTurn: currentTurn - 1,
        overdueTurns: 3,
        isMortgage: false
      },
      {
        id: 'LOAN_2',
        productId: 'CREDIT_BUILDER_01',
        principal: 2000,
        interest: 200,
        rate: 0.15,
        dueTurn: currentTurn - 2,
        overdueTurns: 2,
        isMortgage: false
      }
    ];
    
    // 使用 set 直接更新 bank
    useGameStore.setState((state: any) => ({
      bank: { ...state.bank, activeLoans: newLoans }
    }));
    
    console.log('💸 已应用场景: 破产翻身 (Gold=-5000, 2个逾期贷款)');
  },
  
  // 场景五：最高灵视
  maxInsight: (store) => {
    store.modifyStats({ insight: 100, hp: 50 });
    // 解锁大量档案以触发系统凝视
    const currentArchives = store.unlockedArchives || [];
    const newArchives = [...currentArchives];
    for (let i = 1; i <= 40; i++) {
      const archiveId = `ARCHIVE_${i.toString().padStart(3, '0')}`;
      if (!newArchives.includes(archiveId)) {
        newArchives.push(archiveId);
      }
    }
    store.updatePlayerStats({ unlockedArchives: newArchives });
    console.log('👁️ 已应用场景: 最高灵视 (Insight=100, 40个档案)');
  },
  
  // 场景六：入狱
  jail: (store) => {
    if (store.imprison) {
      store.imprison('调试测试', 5, 1000);
    } else {
      // 直接修改 prison 状态
      useGameStore.setState(() => ({
        prison: { 
          inJail: true, 
          crime: '调试测试', 
          sentenceTurns: 5, 
          turnsServed: 0, 
          bailAmount: 1000 
        }
      }));
    }
    console.log('🔒 已应用场景: 入狱 (5回合, 保释金$1000)');
  },
  
  // 场景七：多重逾期贷款
  overdueLoans: (store) => {
    const currentTurn = store.vitality?.time?.currentTurn || 1;
    const activeLoans = store.bank?.activeLoans || [];
    
    // 添加5个逾期贷款（达到上限）
    const newLoans = [...activeLoans];
    for (let i = 1; i <= 5; i++) {
      newLoans.push({
        id: `LOAN_${i}`,
        productId: 'PAYDAY_01',
        principal: 1000 * i,
        interest: 100 * i,
        rate: 0.2 + i * 0.05,
        dueTurn: currentTurn - i,
        overdueTurns: i,
        isMortgage: false
      });
    }
    
    useGameStore.setState((s: any) => ({
      bank: { ...s.bank, activeLoans: newLoans }
    }));
    
    console.log('📉 已应用场景: 多重逾期贷款 (5个逾期贷款)');
  }
};

/**
 * 创建调试工具实例
 */
export const createDebugTools = (): DebugTools => {
  return {
    /**
     * 设置字段值
     */
    set: (path: string, value: any) => {
      const store = useGameStore.getState();
      const parts = path.split('.');
      
      // 处理 vitality.metrics 字段
      if (parts[0] === 'vitality' && parts[1] === 'metrics' && parts[2]) {
        const field = parts[2];
        store.modifyStats({ [field]: value });
        console.log(`✓ Set ${path} = ${value}`);
        return;
      }
      
      // 处理 vitality.time 字段
      if (parts[0] === 'vitality' && parts[1] === 'time' && parts[2]) {
        const field = parts[2];
        useGameStore.setState((s: any) => ({
          vitality: {
            ...s.vitality,
            time: {
              ...s.vitality.time,
              [field]: value
            }
          }
        }));
        console.log(`✓ Set ${path} = ${value}`);
        return;
      }
      
      // 处理其他路径（简化版）
      console.warn(`路径 ${path} 暂不支持，请使用 modifyStats 或其他专门方法`);
    },

    /**
     * 获取字段值
     */
    get: (path?: string) => {
      const store = useGameStore.getState();
      if (!path) return store;
      
      const parts = path.split('.');
      let value: any = store;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    },

    /**
     * 应用测试场景
     */
    scenario: (name) => {
      const store = useGameStore.getState();
      const scenarioFn = SCENARIOS[name];
      
      if (!scenarioFn) {
        console.error('可用场景:', Object.keys(SCENARIOS));
        return;
      }
      
      scenarioFn(store);
    },

    /**
     * 运行边界检查
     */
    check: () => {
      return BoundaryChecker.runAll();
    },

    /**
     * 数组压力测试
     */
    testArrays: () => {
      const store = useGameStore.getState();
      const results: ArrayTestResult[] = [];
      
      // 测试1: Inventory 上限
      console.log('\n📦 --- Testing Inventory Limit ---');
      const items50 = Array(50).fill(null).map((_, i) => `ITEM_${i}`);
      store.updatePlayerStats({ inventory: items50 });
      const count50 = store.inventory.length;
      console.log(`Set 50 items: ${count50}`);
      
      // 尝试添加第51个
      store.updatePlayerStats({ inventory: [...store.inventory, 'ITEM_51'] });
      const count51 = store.inventory.length;
      console.log(`After adding 51st: ${count51}`);
      
      results.push({
        name: 'Inventory Limit',
        pass: count50 === 50,
        details: { count50, count51, limit: 50 }
      });
      
      // 测试2: Diseases 上限
      console.log('\n🦠 --- Testing Diseases Limit ---');
      // 先清除现有疾病
      store.vitality?.activeDiseases?.forEach((d: string) => store.cureDisease(d));
      // 添加10个疾病
      const diseaseIds = ['DIABETES', 'FLU', 'ANXIETY', 'HYPERTENSION', 'INSOMNIA', 
                          'DEPRESSION', 'ASTHMA', 'ARTHRITIS', 'MIGRAINE', 'ALLERGY'];
      diseaseIds.forEach(id => store.contractDisease(id));
      const diseaseCount = store.vitality?.activeDiseases?.length || 0;
      console.log(`Disease count: ${diseaseCount}`);
      
      results.push({
        name: 'Diseases Limit',
        pass: diseaseCount <= 10,
        details: { count: diseaseCount, limit: 10 }
      });
      
      // 测试3: Loans 上限
      console.log('\n💳 --- Testing Loans Limit ---');
      const currentTurn = store.vitality?.time?.currentTurn || 1;
      const currentLoans = store.bank?.activeLoans || [];
      
      // 尝试添加6个贷款
      const newLoans = [...currentLoans];
      for (let i = 1; i <= 6; i++) {
        newLoans.push({
          id: `TEST_LOAN_${i}`,
          productId: 'PAYDAY_01',
          principal: 1000,
          interest: 100,
          rate: 0.2,
          dueTurn: currentTurn + 10,
          overdueTurns: 0,
          isMortgage: false
        });
      }
      
      useGameStore.setState((s: any) => ({
        bank: { ...s.bank, activeLoans: newLoans }
      }));
      
      const loanCount = useGameStore.getState().bank?.activeLoans?.length || 0;
      console.log(`Loan count: ${loanCount}`);
      
      results.push({
        name: 'Loans Limit',
        pass: loanCount <= 5,
        details: { count: loanCount, limit: 5 }
      });
      
      console.log('\n📊 Array Test Results:');
      console.table(results);
      
      return results;
    },

    /**
     * 检查事件效果数值
     */
    checkEventEffects: () => {
      // 这个需要在游戏运行时检查事件数据
      console.log('🔍 事件效果检查 - 需要访问 gameDataCache.events');
      const store = useGameStore.getState();
      const events = store.gameDataCache?.events || [];
      
      const issues: any[] = [];
      
      events.forEach((event: any) => {
        Object.entries(event.options || {}).forEach(([key, option]: [string, any]) => {
          const effects = option.effects || {};
          
          // 检查gold效果
          if (effects.gold !== undefined) {
            // 检查是否使用了百分比但值不合理
            if (Math.abs(effects.gold) < 1 && effects.gold !== 0 && effects.scaling !== 'INCOME') {
              issues.push({
                event: event.id,
                option: key,
                field: 'gold',
                issue: '疑似百分比值但未设置INCOME scaling',
                value: effects.gold
              });
            }
            // 检查超大值
            if (Math.abs(effects.gold) > 1000000) {
              issues.push({
                event: event.id,
                option: key,
                field: 'gold',
                issue: '数值过大可能溢出',
                value: effects.gold
              });
            }
          }
          
          // 检查hp效果
          if (effects.hp !== undefined && Math.abs(effects.hp) > 100) {
            issues.push({
              event: event.id,
              option: key,
              field: 'hp',
              issue: 'HP变化超过最大值',
              value: effects.hp
            });
          }
          
          // 检查insight效果
          if (effects.insight !== undefined && Math.abs(effects.insight) > 100) {
            issues.push({
              event: event.id,
              option: key,
              field: 'insight',
              issue: 'Insight变化超过最大值',
              value: effects.insight
            });
          }
        });
      });
      
      if (issues.length > 0) {
        console.warn(`发现 ${issues.length} 个事件效果问题:`);
        console.table(issues);
      } else {
        console.log('✅ 事件效果检查通过');
      }
      
      return issues;
    },

    /**
     * 添加物品
     */
    addItem: (itemId: string) => {
      const store = useGameStore.getState();
      store.updatePlayerStats({ 
        inventory: [...store.inventory, itemId] 
      });
      console.log(`✓ Added item: ${itemId}`);
    },

    /**
     * 添加疾病
     */
    addDisease: (diseaseId: string) => {
      const store = useGameStore.getState();
      store.contractDisease(diseaseId);
      console.log(`✓ Added disease: ${diseaseId}`);
    },

    /**
     * 申请贷款
     */
    applyForLoan: (loanData) => {
      const store = useGameStore.getState();
      const currentTurn = store.vitality?.time?.currentTurn || 1;
      try {
        // 直接修改 bank state
        const newLoan = {
          id: loanData.id,
          productId: 'PAYDAY_01',
          principal: loanData.amount,
          interest: 0,
          rate: loanData.rate,
          dueTurn: currentTurn + 4,
          overdueTurns: loanData.overdue || 0,
          isMortgage: false
        };
        
        useGameStore.setState((s: any) => ({
          bank: { 
            ...s.bank, 
            activeLoans: [...s.bank.activeLoans, newLoan] 
          }
        }));
        
        console.log(`✓ Added loan: ${loanData.id} ($${loanData.amount})`);
        return true;
      } catch (e) {
        console.error('添加贷款失败:', e);
        return false;
      }
    },

    /**
     * 重置游戏
     */
    reset: () => {
      const store = useGameStore.getState();
      store.restartGame();
      console.log('🔄 游戏已重置');
    },

    /**
     * 显示帮助
     */
    help: () => {
      console.log(`
🛠️ 调试工具使用指南

1. 设置数值:
   debug.set('vitality.metrics.hp', 10)
   debug.set('vitality.metrics.gold', 999999)

2. 获取数值:
   debug.get()                    // 获取整个状态
   debug.get('vitality.metrics')  // 获取指定路径

3. 快速场景:
   debug.scenario('starvation')   // 饿死危机 (HP=10, Gold=0)
   debug.scenario('rich')         // 富豪 (Gold=999999998)
   debug.scenario('sick')         // 多病 (HP=15, 多疾病)
   debug.scenario('indebted')     // 负债 (Gold=-5000, 逾期贷款)
   debug.scenario('maxInsight')   // 最高灵视 (Insight=100)
   debug.scenario('jail')         // 入狱
   debug.scenario('overdueLoans') // 多重逾期贷款

4. 边界检查:
   debug.check()                  // 运行所有边界检查

5. 数组测试:
   debug.testArrays()             // 测试数组长度边界

6. 事件检查:
   debug.checkEventEffects()      // 检查事件效果数值

7. 其他操作:
   debug.addItem('ITEM_ID')       // 添加物品
   debug.addDisease('DISEASE_ID') // 添加疾病
   debug.reset()                  // 重置游戏

8. 直接调用检查器:
   BoundaryChecker.runAll()       // 完整边界检查
   BoundaryChecker.checkGold()    // 只检查金钱
   BoundaryChecker.checkHP()      // 只检查HP
      `);
    }
  };
};

// 调试工具实例
export const debugTools = createDebugTools();

// 暴露到 window
declare global {
  interface Window {
    debug: DebugTools;
    gameStore: typeof useGameStore;
    BoundaryChecker: typeof BoundaryChecker;
  }
}

export default debugTools;
