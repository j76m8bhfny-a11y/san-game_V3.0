import { GameState, GameAction, ActionCode } from '@/types/schema';

// 定义返回结果接口
export interface ActionResult {
  updates: any; // 使用 any 以支持深度 Partial 结构 (如 { vitality: { metrics: ... } })
  logs: string[];
}

// 最大递归深度，防止事件配置错误导致栈溢出
const MAX_RECURSION_DEPTH = 10;

// 递归深度追踪
let recursionDepth = 0;

export const executeAction = (state: GameState, action: GameAction): ActionResult => {
  // 检查递归深度
  if (recursionDepth > MAX_RECURSION_DEPTH) {
    console.error(`🔴 ActionExecutor: 递归深度超过最大值 ${MAX_RECURSION_DEPTH}，可能存在循环依赖`);
    return { 
      updates: {}, 
      logs: [`[错误] 动作执行超过最大递归深度`] 
    };
  }

  recursionDepth++;
  const result = executeActionInternal(state, action);
  recursionDepth--;
  
  return result;
};

const executeActionInternal = (state: GameState, action: GameAction): ActionResult => {
  const updates: any = {};
  const logs: string[] = [];
  const { code, params } = action;

  switch (code) {
    case ActionCode.MODIFY_STAT: {
      const target = params.target; // 'hp', 'insight', 'gold', 'maxHp', 'maxInsight'
      const value = params.value || 0;

      // ✅ 修复：映射到 vitality.metrics
      if (target && ['hp', 'insight', 'gold', 'maxHp', 'maxInsight'].includes(target)) {
        // 安全获取当前值
        const metricKey = target as keyof typeof state.vitality.metrics;
        const currentVal = state.vitality.metrics[metricKey] || 0;
        
        let newVal = currentVal + value;

        // 处理最大值限制 (如果适用)
        if (target === 'hp') {
           const max = state.vitality.metrics.maxHp;
           newVal = Math.min(max, Math.max(0, newVal));
        }
        if (target === 'insight') {
           const max = state.vitality.metrics.maxInsight;
           newVal = Math.min(max, Math.max(0, newVal));
        }
        
        // 构建深度更新对象
        if (!updates.vitality) updates.vitality = { metrics: {} };
        updates.vitality.metrics[metricKey] = newVal;

        logs.push(`${target.toUpperCase()} ${value >= 0 ? '+' : ''}${value}`);
      }
      break;
    }

    case ActionCode.ADD_ITEM: {
      if (params.itemId) {
        // 检查是否已存在 (如果物品不可堆叠)
        // 这里假设 inventory 是 string[]
        const currentInventory = state.inventory || [];
        updates.inventory = [...currentInventory, params.itemId];
        logs.push(`获得物品: ${params.itemId}`);
      }
      break;
    }

    case ActionCode.REMOVE_ITEM: {
      if (params.itemId) {
        const currentInventory = state.inventory || [];
        const index = currentInventory.indexOf(params.itemId);
        if (index > -1) {
          const newInventory = [...currentInventory];
          newInventory.splice(index, 1);
          updates.inventory = newInventory;
          logs.push(`移除物品: ${params.itemId}`);
        }
      }
      break;
    }

    case ActionCode.UNLOCK_ARCHIVE: {
      if (params.archiveId) {
        const currentArchives = state.unlockedArchives || [];
        if (!currentArchives.includes(params.archiveId)) {
          updates.unlockedArchives = [...currentArchives, params.archiveId];
          logs.push(`解锁档案: ${params.archiveId}`);
        }
      }
      break;
    }

    case ActionCode.CHANCE: {
      // 概率事件通常由 EventResolver 处理递归，但如果在这里执行
      // 我们需要随机决定执行 successActions 还是 failActions
      const rate = params.rate ?? 0.5;
      const roll = Math.random();
      const subActions = roll < rate ? params.successActions : params.failActions;

      if (subActions && subActions.length > 0) {
        // 递归执行子动作 - 使用累积状态确保子动作间的状态同步
        let currentState = { ...state };
        
        // 应用之前的 updates 到 currentState
        if (updates.vitality) {
          currentState = {
            ...currentState,
            vitality: {
              ...currentState.vitality,
              ...(updates.vitality as any),
              metrics: {
                ...currentState.vitality.metrics,
                ...(updates.vitality.metrics || {})
              }
            }
          };
        }
        
        subActions.forEach((subAction: GameAction) => {
          // 递归调用，会经过深度检查
          const subResult = executeAction(currentState, subAction);
          
          // 合并 updates
          Object.keys(subResult.updates).forEach(key => {
             if (key === 'vitality' && updates.vitality) {
                 // 简单的二级合并
                 updates.vitality.metrics = { 
                    ...updates.vitality.metrics, 
                    ...(subResult.updates.vitality.metrics || {}) 
                 };
             } else {
                 updates[key] = subResult.updates[key];
             }
          });
          
          // 更新 currentState 以反映当前累积状态
          if (subResult.updates.vitality?.metrics) {
            currentState = {
              ...currentState,
              vitality: {
                ...currentState.vitality,
                metrics: {
                  ...currentState.vitality.metrics,
                  ...subResult.updates.vitality.metrics
                }
              }
            };
          }
          
          logs.push(...subResult.logs);
        });
        
        logs.push(`判定${roll < rate ? '成功' : '失败'} (Roll: ${roll.toFixed(2)} / Rate: ${rate})`);
      }
      break;
    }
    
    case ActionCode.TRIGGER_EVENT: {
        // 这通常由 UI 处理，不直接产生 state updates
        // 但我们可以设置一个标志位或者放入通知
        logs.push(`触发后续事件`);
        break;
    }

    case ActionCode.GAME_OVER: {
      if (params.endingId) {
        updates.ending = params.endingId;
        logs.push(`达成结局: ${params.endingId}`);
      }
      break;
    }
  }

  return { updates, logs };
}; // end of executeActionInternal