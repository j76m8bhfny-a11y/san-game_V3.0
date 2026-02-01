import { GameState, GameAction, ActionCode } from '@/types/schema';

// 定义返回结果接口
export interface ActionResult {
  updates: any; // 使用 any 以支持深度 Partial 结构 (如 { vitality: { metrics: ... } })
  logs: string[];
}

export const executeAction = (state: GameState, action: GameAction): ActionResult => {
  const updates: any = {};
  const logs: string[] = [];
  const { code, params } = action;

  switch (code) {
    case ActionCode.MODIFY_STAT: {
      const target = params.target; // 'hp', 'san', 'gold', 'maxHp', 'maxSan'
      const value = params.value || 0;

      // ✅ 修复：映射到 vitality.metrics
      if (target && ['hp', 'san', 'gold', 'maxHp', 'maxSan'].includes(target)) {
        // 安全获取当前值
        const metricKey = target as keyof typeof state.vitality.metrics;
        const currentVal = state.vitality.metrics[metricKey] || 0;
        
        let newVal = currentVal + value;

        // 处理最大值限制 (如果适用)
        if (target === 'hp') {
           const max = state.vitality.metrics.maxHp;
           newVal = Math.min(max, Math.max(0, newVal));
        }
        if (target === 'san') {
           const max = state.vitality.metrics.maxSan;
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
        // 递归执行子动作
        // 注意：这里为了简单，只合并 updates，实际情况可能需要更复杂的递归合并逻辑
        subActions.forEach((subAction: GameAction) => {
          const subResult = executeAction(state, subAction); // 使用当前 state (近似)
          
          // 合并 updates
          // 注意：深层合并 vitality 比较麻烦，这里做简单的浅层合并演示
          // 真正的逻辑应该使用类似 lodash.merge 的工具
          // 但由于我们返回的是 "diff"，直接覆盖通常也是可接受的，除了 vitality
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
};