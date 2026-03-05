import { GameState, GameEvent, EventOption, ActionCode, GameAction } from '@/types/schema';
import { executeAction } from './ActionExecutorEnhanced'; // 改用增强版
import { produce } from 'immer';
import { useGameStore } from '@/store/useGameStore';

// 检查事件触发条件
export const checkCondition = (state: GameState, condition: GameEvent['conditions']): boolean => {
  if (!condition) return true;
  
  // 防御性检查：确保状态完整性
  if (!state?.vitality?.metrics) {
    console.warn('[checkCondition] 状态不完整，跳过事件检查');
    return false;
  }

  // 1. 灵视值检查 (Insight Check)
  // minInsight: 觉醒度不足则无法看到此事件（需要更高灵视）
  // maxInsight: 过于觉醒则看不到某些世俗事件（灵视太高无法触发）
  if (condition.minInsight !== undefined && state.vitality.metrics.insight < condition.minInsight) return false;
  if (condition.maxInsight !== undefined && state.vitality.metrics.insight > condition.maxInsight) return false;

  // 2. Class Check (使用新的 identity 路径)
  if (condition.requiredClass) {
    if (!condition.requiredClass.includes(state.vitality.identity.currentClass)) return false;
  }

  // 3. Region Check
  if (condition.region && state.currentRegion !== condition.region) return false;

  // 4. Item Check
  if (condition.hasItem && !state.inventory.includes(condition.hasItem)) return false;

  // 🔴 监狱系统相关条件检查
  // 5. 重罪记录检查
  if (condition.hasFelonyRecord !== undefined) {
    const playerHasFelony = state.vitality.flags?.hasFelonyRecord ?? false;
    if (condition.hasFelonyRecord !== playerHasFelony) return false;
  }

  // 6. 保险暂停检查
  if (condition.insuranceSuspended !== undefined) {
    const playerInsuranceSuspended = state.vitality.flags?.insuranceSuspended ?? false;
    if (condition.insuranceSuspended !== playerInsuranceSuspended) return false;
  }

  // 7. 活跃疾病检查
  if (condition.hasActiveDisease !== undefined) {
    const hasDisease = (state.vitality.activeDiseases?.length ?? 0) > 0;
    if (condition.hasActiveDisease !== hasDisease) return false;
  }

  return true;
};

// 选项类型推断
function inferOptionType(option: EventOption, eventOptions: GameEvent['options']): 'A' | 'B' | 'C' | 'D' {
  if (eventOptions.A === option) return 'A';
  if (eventOptions.B === option) return 'B';
  if (eventOptions.C === option) return 'C';
  return 'D';
}

// ✅ 使用 Immer 简化状态合并逻辑
export const resolveOption = (
  state: GameState, 
  option: EventOption, 
  event?: GameEvent
): { 
  updates: any; 
  logs: string[]; 
  nextEventId?: string;
  modifiers?: string[];
  archiveUnlocked?: {
    archiveId: string;
    isNew: boolean;
    milestoneTriggered: boolean;
  };
} => {
  const logs: string[] = [];
  const modifiers: string[] = [];
  let archiveUnlocked: { archiveId: string; isNew: boolean; milestoneTriggered: boolean } | undefined;
  
  // 推断选项类型
  const optionType = event ? inferOptionType(option, event.options) : 'A';
  const isDOption = optionType === 'D';
  
  // 使用 Immer 的 produce 函数，基于 state 创建 draft，Immer 会自动生成不可变更新
  const updates = produce(state, (draft) => {
    // 1. 基础数值变动 (HP, SAN)
    if (option.effects.hp) {
      const action: GameAction = { 
        code: ActionCode.MODIFY_STAT, 
        params: { target: 'hp', value: option.effects.hp } 
      };
      // 传递上下文以应用档案奖励和 System Gaze
      const res = executeAction(state, action, {
        optionType,
        eventData: {
          scaling: option.effects.scaling,
          isDOption,
          archiveId: option.archiveId
        }
      });
      
      if (res.updates.vitality?.metrics) {
        Object.assign(draft.vitality.metrics, res.updates.vitality.metrics);
      }
      logs.push(...res.logs);
      if (res.modifiers) modifiers.push(...res.modifiers);
    }

    if (option.effects.insight) {
      const action: GameAction = { 
        code: ActionCode.MODIFY_STAT, 
        params: { target: 'insight', value: option.effects.insight } 
      };
      const res = executeAction(state, action, {
        optionType,
        eventData: {
          scaling: option.effects.scaling,
          isDOption,
          archiveId: option.archiveId
        }
      });
      
      if (res.updates.vitality?.metrics) {
        Object.assign(draft.vitality.metrics, res.updates.vitality.metrics);
      }
      logs.push(...res.logs);
      if (res.modifiers) modifiers.push(...res.modifiers);
    }

    // 2. 金币变动
    if (option.effects.gold) {
      const action: GameAction = { 
        code: ActionCode.MODIFY_STAT, 
        params: { target: 'gold', value: option.effects.gold } 
      };
      const res = executeAction(state, action, {
        optionType,
        eventData: {
          scaling: option.effects.scaling,
          isDOption,
          archiveId: option.archiveId
        }
      });
      
      if (res.updates.vitality?.metrics) {
        Object.assign(draft.vitality.metrics, res.updates.vitality.metrics);
      }
      logs.push(...res.logs);
      if (res.modifiers) modifiers.push(...res.modifiers);
    }

    // 3. 获得物品
    if (option.effects.items?.length) {
      option.effects.items.forEach(item => {
        // 防御性检查：确保 item 和必要字段存在
        if (!item?.itemId || typeof item.count !== 'number' || item.count <= 0) {
          console.warn('Invalid item effect:', item);
          return;
        }
        const newItems = Array(item.count).fill(item.itemId);
        draft.inventory.push(...newItems);
        logs.push(`获得物品: ${item.itemId} x${item.count}`);
      });
    }

    // 4. 触发后续 (Archive)
    if (option.archiveId) {
      const wasUnlocked = state.unlockedArchives.includes(option.archiveId);
      
      if (!wasUnlocked) {
        draft.unlockedArchives.push(option.archiveId);
        logs.push(`解锁档案: ${option.archiveId}`);
        
        // 检查里程碑
        const newCount = draft.unlockedArchives.length;
        const isMilestone = newCount % 3 === 0 || [10, 25, 40].includes(newCount);
        
        archiveUnlocked = {
          archiveId: option.archiveId,
          isNew: true,
          milestoneTriggered: isMilestone
        };
        
        // 触发全局状态更新（同步执行，避免竞态条件）
        const store = useGameStore.getState();
        if (store.unlockArchive && option.archiveId && !store.unlockedArchives.includes(option.archiveId)) {
          store.unlockArchive(option.archiveId);
        }
      } else {
        archiveUnlocked = {
          archiveId: option.archiveId,
          isNew: false,
          milestoneTriggered: false
        };
      }
    }

    // 5. 政治倾向 (Points)
    if (option.effects.points) {
      const currentPoints = draft.vitality.identity.points;
      
      // ✅ 防御性编程：限制政治倾向数值范围，防止溢出
      const clampPoints = (val: number): number => {
        // 限制在 -1000 到 +1000 范围内，防止数值溢出
        return Math.max(-1000, Math.min(1000, val));
      };
      
      draft.vitality.identity.points = {
        red: clampPoints(currentPoints.red + (option.effects.points.red || 0)),
        wolf: clampPoints(currentPoints.wolf + (option.effects.points.wolf || 0)),
        old: clampPoints(currentPoints.old + (option.effects.points.old || 0))
      };
      
      if (option.effects.points.red) logs.push(`红方倾向 ${option.effects.points.red > 0 ? '+' : ''}${option.effects.points.red}`);
      if (option.effects.points.wolf) logs.push(`蓝方倾向 ${option.effects.points.wolf > 0 ? '+' : ''}${option.effects.points.wolf}`);
      if (option.effects.points.old) logs.push(`旧派倾向 ${option.effects.points.old > 0 ? '+' : ''}${option.effects.points.old}`);
    }
  });

  return { updates, logs, modifiers, archiveUnlocked };
};
