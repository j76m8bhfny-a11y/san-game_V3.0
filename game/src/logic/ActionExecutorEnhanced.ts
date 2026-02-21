/**
 * Enhanced Action Executor - 集成档案系统和System Gaze
 * 
 * 在原 ActionExecutor 基础上增加：
 * 1. 自动应用档案奖励（D选项惩罚减免等）
 * 2. System Gaze 效果应用
 * 3. 档案解锁处理
 */

import { GameState, GameAction, ActionCode } from '@/types/schema';
import { executeAction as baseExecuteAction, ActionResult } from './ActionExecutor';
import { 
  applyArchiveAndGazeModifiers,
  processArchiveUnlock 
} from './actionExecutorAdapter';

// 扩展 ActionResult 以包含修改器信息
export interface EnhancedActionResult extends ActionResult {
  modifiers?: string[];
  archiveUnlocked?: {
    archiveId: string;
    isNew: boolean;
    milestoneTriggered: boolean;
  };
}

/**
 * 增强版动作执行器
 * 
 * @param state 当前游戏状态
 * @param action 要执行的动作
 * @param context 额外上下文（选项类型、事件数据等）
 */
export const executeActionEnhanced = (
  state: GameState,
  action: GameAction,
  context?: {
    optionType?: 'A' | 'B' | 'C' | 'D';
    eventData?: {
      scaling?: string;
      isDOption?: boolean;
      archiveId?: string;
    };
  }
): EnhancedActionResult => {
  const { code, params } = action;
  
  // 处理 MODIFY_STAT - 应用档案和 System Gaze 修改
  if (code === ActionCode.MODIFY_STAT && context?.optionType) {
    const target = params.target;
    const value = params.value || 0;
    
    if (target && ['hp', 'gold', 'insight'].includes(target)) {
      // 使用适配器计算最终效果
      const baseEffect = { gold: 0, hp: 0, insight: 0 };
      
      if (target === 'gold') baseEffect.gold = value;
      if (target === 'hp') baseEffect.hp = value;
      if (target === 'insight') baseEffect.insight = value;
      
      const modified = applyArchiveAndGazeModifiers(
        baseEffect,
        state as any, // StoreState 兼容
        context.optionType,
        context.eventData
      );
      
      // 根据目标应用修改后的值
      let finalValue = value;
      if (target === 'gold') finalValue = modified.gold;
      if (target === 'hp') finalValue = modified.hp;
      if (target === 'insight') finalValue = modified.insight;
      
      // 创建修改后的动作
      const modifiedAction: GameAction = {
        ...action,
        params: { ...params, value: finalValue }
      };
      
      // 执行基础动作
      const result = baseExecuteAction(state, modifiedAction);
      
      return {
        ...result,
        modifiers: modified.modifiers
      };
    }
  }
  
  // 处理 UNLOCK_ARCHIVE - 处理档案解锁
  if (code === ActionCode.UNLOCK_ARCHIVE && params.archiveId) {
    const unlockResult = processArchiveUnlock(
      state as any,
      params.archiveId
    );
    
    const result = baseExecuteAction(state, action);
    
    return {
      ...result,
      archiveUnlocked: unlockResult.success ? {
        archiveId: params.archiveId,
        isNew: unlockResult.isNew,
        milestoneTriggered: unlockResult.milestoneTriggered
      } : undefined
    };
  }
  
  // 其他动作直接执行基础版本
  return baseExecuteAction(state, action);
};

/**
 * 批量执行动作（带状态累积）
 */
export const executeActionsEnhanced = (
  initialState: GameState,
  actions: GameAction[],
  context?: Parameters<typeof executeActionEnhanced>[2]
): { 
  finalState: GameState; 
  results: EnhancedActionResult[];
  allModifiers: string[];
} => {
  let currentState = { ...initialState };
  const results: EnhancedActionResult[] = [];
  const allModifiers: string[] = [];
  
  for (const action of actions) {
    const result = executeActionEnhanced(currentState, action, context);
    results.push(result);
    
    // 收集所有修改器
    if (result.modifiers) {
      allModifiers.push(...result.modifiers);
    }
    
    // 合并状态更新
    if (result.updates) {
      currentState = mergeUpdates(currentState, result.updates);
    }
  }
  
  return { finalState: currentState, results, allModifiers };
};

/**
 * 合并更新到状态
 */
function mergeUpdates(state: GameState, updates: any): GameState {
  const newState = { ...state };
  
  // 处理 vitality 嵌套更新
  if (updates.vitality) {
    newState.vitality = {
      ...state.vitality,
      ...updates.vitality,
      metrics: {
        ...state.vitality.metrics,
        ...(updates.vitality.metrics || {})
      }
    };
  }
  
  // 处理其他顶层更新
  Object.keys(updates).forEach(key => {
    if (key !== 'vitality') {
      (newState as any)[key] = updates[key];
    }
  });
  
  return newState;
}

// 导出兼容原版的名字
export { executeActionEnhanced as executeAction };
export default executeActionEnhanced;
