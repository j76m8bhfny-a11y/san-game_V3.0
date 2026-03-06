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

  // ========== 容错测试用例 ==========
  
  // 测试存档损坏恢复 (TC-FAULT-001)
  testCorruptedSave: () => void;
  
  // 测试图片404容错 (TC-FAULT-003)
  testImage404: (imagePath: string) => void;
  
  // 测试快速点击防护 (TC-FAULT-004)
  testRapidClick: (buttonSelector: string, clickCount?: number) => void;
  
  // 测试存储空间满 (TC-FAULT-005)
  testStorageFull: () => (() => void);

  // ========== 自动存档测试 ==========
  
  // 立即执行一次自动存档
  autoSave: () => Promise<boolean>;
  
  // 查看自动存档列表
  listAutoSaves: () => Promise<void>;
  
  // 从指定自动存档槽位加载
  loadAutoSave: (slot: number) => Promise<boolean>;
  
  // 清除所有自动存档
  clearAutoSaves: () => Promise<void>;

  // ========== 加密测试 ==========
  
  // 测试爆仓机制
  testLiquidation: () => void;
  
  // 设置 BTC 价格（用于测试）
  setBTCPrice: (price: number) => void;
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

9. 容错测试:
   debug.testCorruptedSave()      // TC-FAULT-001: 存档损坏测试
   debug.testImage404('path')     // TC-FAULT-003: 图片404测试
   debug.testRapidClick('button') // TC-FAULT-004: 快速点击测试
   const cleanup = debug.testStorageFull() // TC-FAULT-005: 存储满测试
   cleanup()                        // 清理测试数据

10. 自动存档:
    debug.autoSave()               // 立即执行自动存档
    debug.listAutoSaves()          // 查看自动存档列表
    debug.loadAutoSave(0)          // 从槽位0加载自动存档
    debug.clearAutoSaves()         // 清除所有自动存档

11. 加密测试:
    debug.testLiquidation()        // 测试爆仓机制
    debug.setBTCPrice(1000)        // 设置 BTC 价格测试爆仓
      `);
    },

    /**
     * 立即执行一次自动存档
     */
    autoSave: async () => {
      const { performAutoSave } = await import('@/utils/autoSave');
      const result = await performAutoSave();
      console.log(result ? '✅ 自动存档成功' : '❌ 自动存档失败');
      return result;
    },
    
    /**
     * 查看自动存档列表
     */
    listAutoSaves: async () => {
      const { getAutoSaves } = await import('@/utils/autoSave');
      const saves = await getAutoSaves();
      console.log('💾 自动存档列表:');
      console.table(saves.map(s => ({
        槽位: s.slot,
        回合: s.turn,
        金币: s.gold,
        区域: s.region,
        阶级: s.class,
        时间: new Date(s.timestamp).toLocaleString()
      })));
    },
    
    /**
     * 从自动存档加载
     */
    loadAutoSave: async (slot: number) => {
      const { loadAutoSave: load } = await import('@/utils/autoSave');
      const result = await load(slot);
      if (result) {
        console.log(`✅ 已从自动存档 ${slot} 加载`);
        console.log('🔄 页面将刷新以应用状态...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.error(`❌ 加载自动存档 ${slot} 失败`);
      }
      return result;
    },
    
    /**
     * 清除所有自动存档
     */
    clearAutoSaves: async () => {
      const { clearAllAutoSaves } = await import('@/utils/autoSave');
      await clearAllAutoSaves();
      console.log('🗑️ 所有自动存档已清除');
    },

    /**
     * 测试爆仓机制
     * 创建高杠杆仓位然后触发爆仓
     */
    testLiquidation: () => {
      const store = useGameStore.getState();
      
      // 确保账户已开通且有足够资金
      if (!store.crypto.isAccountOpen) {
        console.log('请先开通加密账户');
        return;
      }
      
      // 创建一个 100x 杠杆的多仓
      store.openPosition('LONG', 1000, 100);
      console.log('🎯 创建测试仓位: LONG 1000 @ 100x');
      console.log('💡 使用 debug.setBTCPrice(价格) 来触发爆仓');
    },

    /**
     * 设置 BTC 价格（用于测试爆仓）
     */
    setBTCPrice: (price: number) => {
      const store = useGameStore.getState();
      const currentPrice = store.crypto.btcPrice;
      
      console.log(`📊 BTC 价格: $${currentPrice} → $${price}`);
      
      // 使用 checkAndLiquidatePositions 检查爆仓
      const result = store.checkAndLiquidatePositions(price);
      
      if (result.liquidated > 0) {
        console.log(`💥 爆仓! ${result.liquidated} 个仓位被清算, 损失 $${result.totalLoss}`);
      } else {
        console.log('✅ 未触发爆仓');
      }
      
      // 更新价格显示
      useGameStore.setState((s: any) => ({
        crypto: { ...s.crypto, btcPrice: price }
      }));
    },

    /**
     * TC-FAULT-001: 存档损坏恢复测试
     * 模拟损坏的存档数据，测试恢复机制
     */
    testCorruptedSave: () => {
      const tests = [
        {
          name: 'JSON语法错误',
          setup: () => localStorage.setItem('pixel-life-storage', '{broken json'),
          expect: '重置为初始状态'
        },
        {
          name: '数值Infinity',
          setup: () => {
            const data = JSON.parse(localStorage.getItem('pixel-life-storage') || '{}');
            data.vitality = { ...data.vitality, metrics: { ...data.vitality?.metrics, gold: Infinity } };
            localStorage.setItem('pixel-life-storage', JSON.stringify(data));
          },
          expect: 'gold变为有效数值'
        },
        {
          name: '数值NaN',
          setup: () => {
            const data = JSON.parse(localStorage.getItem('pixel-life-storage') || '{}');
            data.vitality = { ...data.vitality, metrics: { ...data.vitality?.metrics, hp: NaN } };
            localStorage.setItem('pixel-life-storage', JSON.stringify(data));
          },
          expect: 'hp变为60（默认值）'
        },
        {
          name: '字段缺失',
          setup: () => {
            const data = { vitality: { metrics: { gold: 100 } } };
            localStorage.setItem('pixel-life-storage', JSON.stringify(data));
          },
          expect: 'class默认为HOMELESS'
        }
      ];
      
      console.log('🧪 TC-FAULT-001: 存档损坏恢复测试');
      console.log('请按顺序执行以下测试，每次执行后刷新页面检查恢复行为：');
      console.table(tests.map((t, i) => ({ 
        序号: i + 1, 
        测试: t.name, 
        预期: t.expect 
      })));
      
      // 提供执行函数
      return tests.map((t, i) => {
        (debugTools as any)[`runTest${i + 1}`] = () => {
          t.setup();
          console.log(`✅ 已设置: ${t.name}`);
          console.log(`💡 预期: ${t.expect}`);
          console.log('🔄 请刷新页面查看恢复效果');
        };
        return t;
      });
    },

    /**
     * TC-FAULT-003: 图片404容错测试
     * 模拟图片加载失败，测试占位图显示
     */
    testImage404: (imagePath?: string) => {
      const testPath = imagePath || '/assets/events/evt_001.png';
      console.log(`🧪 TC-FAULT-003: 图片404容错测试`);
      console.log(`测试路径: ${testPath}`);
      console.log(`
使用方式:
1. 重命名图片文件: ${testPath} -> ${testPath}.bak
2. 触发显示该图片的事件
3. 预期: 显示占位图（灰色块+文字），不空白不崩溃
4. 测试完成后恢复图片原名
      `);
      
      // 创建测试用的错误图片URL
      const img = new Image();
      img.onerror = () => {
        console.log('✅ 图片错误处理正常触发');
      };
      img.src = testPath + '?test=' + Date.now();
    },

    /**
     * TC-FAULT-004: 快速点击防护测试
     * 模拟快速连续点击，测试节流效果
     */
    testRapidClick: (buttonSelector?: string, clickCount: number = 10) => {
      const selector = buttonSelector || '[data-testid="buy-button"], button';
      console.log(`🧪 TC-FAULT-004: 快速点击防护测试`);
      console.log(`目标按钮: ${selector}`);
      console.log(`点击次数: ${clickCount}`);
      
      const buttons = document.querySelectorAll(selector);
      if (buttons.length === 0) {
        console.warn('⚠️ 未找到目标按钮');
        return;
      }
      
      let actualClicks = 0;
      const targetButton = buttons[0];
      
      // 记录点击次数
      const clickHandler = () => { actualClicks++; };
      targetButton.addEventListener('click', clickHandler);
      
      // 执行快速点击
      console.log(`开始执行 ${clickCount} 次快速点击...`);
      for (let i = 0; i < clickCount; i++) {
        targetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      
      // 延迟检查
      setTimeout(() => {
        targetButton.removeEventListener('click', clickHandler);
        console.log(`✅ 快速点击测试完成`);
        console.log(`预期点击: 1次 (被节流)`);
        console.log(`实际点击: ${actualClicks}次`);
        if (actualClicks <= 1) {
          console.log('✅ 节流保护生效');
        } else {
          console.warn('⚠️ 节流保护可能未生效');
        }
      }, 1000);
    },

    /**
     * TC-FAULT-005: 存储空间满测试
     * 模拟 localStorage 满的情况
     * @returns 清理函数，必须在测试后调用
     */
    testStorageFull: () => {
      const keys: string[] = [];
      
      console.log('🧪 TC-FAULT-005: 存储空间满测试');
      console.log('开始填充 localStorage...');
      
      // 填充 localStorage
      for(let i = 0; i < 1000; i++) {
        try {
          const key = `__test_filler_${i}`;
          localStorage.setItem(key, 'x'.repeat(10000));
          keys.push(key);
        } catch(e) {
          console.log(`💾 存储已满，共填充 ${keys.length} 项`);
          break;
        }
      }
      
      console.log('✅ localStorage 已填满');
      console.log('💡 现在执行保存操作，应该显示"存储空间不足"提示');
      console.log('⚠️ 重要: 测试完成后必须调用返回的清理函数！');
      
      // 返回清理函数
      return () => {
        console.log('🧹 开始清理测试数据...');
        keys.forEach(k => localStorage.removeItem(k));
        console.log(`✅ 已清理 ${keys.length} 项测试数据`);
      };
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
