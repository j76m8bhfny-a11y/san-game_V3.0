/**
 * 存活计算 Slice 集成示例
 * 
 * 这是一个完整的示例，展示如何将存活计算集成到你的 store 中
 * 你可以参考这个文件修改你现有的 slice
 */

import { StateCreator } from 'zustand';
import { StoreState } from '@/types/store';
import { 
  calculateSurvivalRate, 
  checkSurvival, 
  printSurvivalAnalysis,
  SurvivalResult 
} from '@/logic/survivalCalculator';

export interface SurvivalSlice {
  // ========== 存活计算 ==========
  
  /**
   * 获取当前存活率分析
   * 包含各维度分数和建议
   */
  getSurvivalAnalysis: () => SurvivalResult;
  
  /**
   * 快速获取存活率（仅数字）
   */
  getSurvivalRate: () => number;
  
  /**
   * 执行死亡判定
   * 在回合结束时调用
   */
  checkDeath: () => { survived: boolean; roll: number; rate: number };
  
  /**
   * 打印存活分析到控制台
   * 用于调试
   */
  debugSurvival: () => void;
}

/**
 * 创建存活计算 Slice
 * 
 * 使用方式：
 * 1. 在你的 useGameStore.ts 中导入并合并此 slice
 * 2. 在 advanceTurn 中调用 checkDeath()
 * 3. 在 UI 中调用 getSurvivalRate() 显示存活率
 */
export const createSurvivalSlice: StateCreator<StoreState, [], [], SurvivalSlice> = (set, get) => ({
  
  getSurvivalAnalysis: () => {
    const state = get();
    return calculateSurvivalRate(state);
  },
  
  getSurvivalRate: () => {
    const state = get();
    return calculateSurvivalRate(state).survivalRate;
  },
  
  checkDeath: () => {
    const state = get();
    
    // 如果已经在监狱或已死亡，跳过判定
    if (state.prison?.inJail) {
      return { survived: true, roll: 0, rate: 1 };
    }
    
    if (state.ending) {
      return { survived: false, roll: 1, rate: 0 };
    }
    
    return checkSurvival(state);
  },
  
  debugSurvival: () => {
    const state = get();
    console.log(printSurvivalAnalysis(state));
  },
});

// ==========================================
// 集成到现有 VitalitySlice 的示例
// ==========================================

/*
// 在 createVitalitySlice.ts 中添加：

import { SurvivalResult } from '@/logic/survivalCalculator';

export interface VitalitySlice {
  // ... 现有代码 ...
  
  // 新增存活计算
  getSurvivalAnalysis: () => SurvivalResult;
  checkDeath: () => { survived: boolean; roll: number; rate: number };
}

export const createVitalitySlice: StateCreator<StoreState, [], [], VitalitySlice> = (set, get) => ({
  // ... 现有代码 ...
  
  // 新增方法
  getSurvivalAnalysis: () => {
    const state = get();
    return calculateSurvivalRate(state);
  },
  
  checkDeath: () => {
    const state = get();
    return checkSurvival(state);
  },
  
  // 修改 advanceTurn，添加存活判定
  advanceTurn: () => {
    const state = get();
    
    // ... 现有回合逻辑 ...
    
    // 新增：存活判定
    const deathCheck = get().checkDeath();
    
    if (!deathCheck.survived) {
      console.log(`💀 死亡判定失败: 骰子 ${(deathCheck.roll * 100).toFixed(1)}% > 存活率 ${(deathCheck.rate * 100).toFixed(1)}%`);
      
      // 触发死亡结局
      const store = get() as any;
      if (store.triggerEnding) {
        store.triggerEnding('DEATH_GENERIC');
      }
      
      return;
    }
    
    // 存活但危险时给警告
    const survival = get().getSurvivalAnalysis();
    if (survival.riskLevel === 'CRITICAL') {
      const store = get() as any;
      if (store.addNotification) {
        store.addNotification('⚠️ 警告：你的生命垂危！请立即治疗！', 'error');
      }
    }
    
    // ... 继续现有逻辑 ...
  },
});
*/

// ==========================================
// React 组件中使用示例
// ==========================================

/*
// SurvivalIndicator.tsx
import { useGameStore } from '@/store/useGameStore';

export function SurvivalIndicator() {
  // 方式1: 获取完整分析
  const analysis = useGameStore(state => state.getSurvivalAnalysis?.());
  
  // 方式2: 只获取存活率数字
  const rate = useGameStore(state => state.getSurvivalRate?.());
  
  if (!analysis) return null;
  
  const getColor = (r: number) => {
    if (r >= 0.80) return '#4CAF50';
    if (r >= 0.60) return '#FFC107';
    if (r >= 0.40) return '#FF9800';
    return '#F44336';
  };
  
  const getIcon = (level: string) => {
    switch (level) {
      case 'SAFE': return '✅';
      case 'WARNING': return '⚠️';
      case 'DANGER': return '🔥';
      case 'CRITICAL': return '💀';
      default: return '?';
    }
  };
  
  return (
    <div className="survival-indicator" style={{ 
      padding: '10px', 
      border: `2px solid ${getColor(analysis.survivalRate)}`,
      borderRadius: '8px'
    }}>
      <div style={{ 
        fontSize: '24px', 
        fontWeight: 'bold',
        color: getColor(analysis.survivalRate)
      }}>
        {getIcon(analysis.riskLevel)} {(analysis.survivalRate * 100).toFixed(0)}%
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        存活概率 - {analysis.riskLevel}
      </div>
      {analysis.suggestions.length > 0 && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '11px', 
          color: '#F44336' 
        }}>
          💡 {analysis.suggestions[0]}
        </div>
      )}
    </div>
  );
}
*/

// ==========================================
// 事件系统中使用示例
// ==========================================

/*
// 在事件处理中根据存活率调整结果

function handleEventOutcome(eventId: string, state: GameState) {
  const survival = state.getSurvivalAnalysis();
  
  // 低存活率时事件更危险
  if (survival.survivalRate < 0.3) {
    // 增加负面结果权重
    return getDangerousOutcome(eventId);
  }
  
  // 高存活率时获得保护
  if (survival.survivalRate > 0.8) {
    // 减少负面结果
    return getSafeOutcome(eventId);
  }
  
  return getNormalOutcome(eventId);
}
*/

// ==========================================
// 调试命令（可在浏览器控制台使用）
// ==========================================

/*
// 在浏览器控制台输入：

// 查看当前存活分析
useGameStore.getState().debugSurvival?.();

// 或者直接
import { printSurvivalAnalysis } from '@/logic/survivalCalculator';
console.log(printSurvivalAnalysis(useGameStore.getState()));

// 手动触发死亡判定
const result = useGameStore.getState().checkDeath?.();
console.log(result);

// 查看各维度分数
const analysis = useGameStore.getState().getSurvivalAnalysis?.();
console.table(analysis.dimensions);
*/
