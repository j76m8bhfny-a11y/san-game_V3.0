/**
 * Vitality Slice - Buff 系统模块
 * 
 * 包含：Buff 的添加、移除、处理、事件/物品触发
 */

import { StoreState } from '@/types/store';
import { SurvivalBuff } from '@/types/schema';
import buffConfig from '@/assets/data/rules/survival_buffs.json';
import { processingTriggers } from './utils';

export interface BuffProcessResult {
  hpChange: number;
  insightChange: number;
  expiredBuffs: string[];
}

/**
 * 添加生存 Buff
 */
export function addSurvivalBuff(
  _get: () => StoreState,
  set: (fn: (state: StoreState) => Partial<StoreState>) => void,
  buff: SurvivalBuff
): void {
  // 先处理 onApply 效果（需要在状态更新前执行）
  if (buff.effects?.onApply?.clearStatus) {
    const statusesToClear = buff.effects.onApply.clearStatus;
    console.log(`[SurvivalBuff] 清除状态: ${statusesToClear.join(', ')}`);
  }
  
  set((state: StoreState) => {
    const existingBuffs = state.vitality.activeBuffs || [];
    const MAX_BUFFS = 50;
    
    // ✅ 检查 Buff 数量上限（同类型Buff更新除外）
    const buffBaseId = buff.id.split('_')[0];
    const existingIndex = existingBuffs.findIndex((b: SurvivalBuff) => 
      b.id.split('_')[0] === buffBaseId
    );
    
    // 如果是新 Buff（不是更新现有），检查数量限制
    if (existingIndex < 0 && existingBuffs.length >= MAX_BUFFS) {
      console.warn(`[addSurvivalBuff] Buff数量已达上限 ${MAX_BUFFS}，无法添加: ${buff.name}`);
      if (state.addNotification) {
        state.addNotification('状态效果已达上限', 'warning');
      }
      return {}; // 不修改状态
    }
    
    // 计算MaxHP变化（用于maxHpBonus首次应用）
    let maxHpChange = 0;
    
    // 不可堆叠：刷新持续时间
    if (!buff.stackable && existingIndex >= 0) {
      return {
        vitality: {
          ...state.vitality,
          activeBuffs: existingBuffs.map((b: SurvivalBuff, idx: number) => 
            idx === existingIndex ? { ...b, duration: buff.maxDuration } : b
          )
        }
      };
    }
    
    // 可堆叠：增加层数（不超过maxStacks）
    if (buff.stackable && existingIndex >= 0) {
      const existing = existingBuffs[existingIndex];
      const maxStacks = buff.maxStacks || 1;
      const newStacks = Math.min((existing.stacks || 1) + 1, maxStacks);
      
      return {
        vitality: {
          ...state.vitality,
          activeBuffs: existingBuffs.map((b: SurvivalBuff, idx: number) => 
            idx === existingIndex ? { 
              ...b, 
              stacks: newStacks,
              duration: buff.maxDuration // 同时刷新持续时间
            } : b
          )
        }
      };
    }
    
    // 新Buff：初始化层数为1，并应用maxHpBonus
    const newBuff = { ...buff, stacks: buff.stackable ? 1 : undefined };
    
    // 应用maxHpBonus（如果有）
    const buffEffects = buff.effects as any;
    if (buffEffects?.maxHpBonus) {
      maxHpChange = buffEffects.maxHpBonus;
    }
    
    const currentMetrics = state.vitality.metrics;
    const newMaxHp = Math.max(10, (currentMetrics.maxHp || 100) + maxHpChange);
    
    return {
      vitality: {
        ...state.vitality,
        metrics: {
          ...currentMetrics,
          maxHp: newMaxHp
        },
        activeBuffs: [...existingBuffs, newBuff]
      }
    };
  });
}

/**
 * 移除生存 Buff
 */
export function removeSurvivalBuff(
  set: (fn: (state: StoreState) => Partial<StoreState>) => void,
  buffId: string
): void {
  set((state: StoreState) => ({
    vitality: {
      ...state.vitality,
      activeBuffs: (state.vitality.activeBuffs || []).filter((b: SurvivalBuff) => b.id !== buffId)
    }
  }));
}

/**
 * 处理 Buff 效果（每回合调用）
 */
export function processBuffs(
  get: () => StoreState,
  set: (fn: (state: StoreState) => Partial<StoreState>) => void
): BuffProcessResult {
  const state = get();
  const buffs = state.vitality.activeBuffs || [];
  
  let hpChange = 0;
  let insightChange = 0;
  let maxHpChange = 0;
  const expiredBuffs: string[] = [];
  const remainingBuffs: SurvivalBuff[] = [];
  
  for (const buff of buffs) {
    // 应用每回合效果（考虑层数倍率）
    if (buff.effects.perTurn) {
      const stacks = buff.stacks || 1;
      const baseHp = buff.effects.perTurn.hp || 0;
      const baseInsight = buff.effects.perTurn.insight || 0;
      
      // 如果有stackMultiplier，每层额外增加效果
      const multiplier = buff.effects.perTurn.stackMultiplier || 1;
      const effectiveStacks = stacks > 1 ? 1 + (stacks - 1) * (multiplier - 1) : 1;
      
      hpChange += baseHp * effectiveStacks;
      insightChange += baseInsight * effectiveStacks;
    }
    
    // 减少持续时间（-1表示永久）
    const newDuration = buff.duration > 0 ? buff.duration - 1 : buff.duration;
    
    if (newDuration === 0) {
      // Buff过期
      expiredBuffs.push(buff.id);
      if (buff.effects.onExpire) {
        hpChange += buff.effects.onExpire.hp || 0;
        insightChange += buff.effects.onExpire.insight || 0;
        
        // 处理MaxHP恢复（maxHpBonus设为0表示恢复）
        const expireEffects = buff.effects.onExpire as any;
        const buffEffects = buff.effects as any;
        if (expireEffects?.maxHpBonus !== undefined) {
          const currentMaxHpBonus = buffEffects?.maxHpBonus || 0;
          const expireMaxHpBonus = expireEffects.maxHpBonus;
          // 恢复：减去Buff提供的加成，加上过期设定的值（通常为0）
          maxHpChange += expireMaxHpBonus - currentMaxHpBonus;
        }
        
        // 触发过期事件（如戒断反应）- 添加循环检测
        if (buff.effects.onExpire.trigger) {
          const triggerId = buff.effects.onExpire.trigger;
          if (!processingTriggers.has(triggerId)) {
            processingTriggers.add(triggerId);
            get().applyEventBuff(triggerId);
            processingTriggers.delete(triggerId);
          } else {
            console.warn(`[SurvivalBuff] 检测到循环触发，已阻止: ${triggerId}`);
          }
        }
      }
    } else {
      remainingBuffs.push({ ...buff, duration: newDuration });
    }
  }
  
  // 更新状态（包括可能的MaxHP变化）
  set((state: StoreState) => {
    const currentMetrics = state.vitality.metrics;
    const newMaxHp = Math.max(10, (currentMetrics.maxHp || 100) + maxHpChange);
    // 调整当前HP不超过新的MaxHP
    const newHp = Math.min(newMaxHp, currentMetrics.hp);
    
    return {
      vitality: {
        ...state.vitality,
        metrics: {
          ...currentMetrics,
          hp: newHp,
          maxHp: newMaxHp
        },
        activeBuffs: remainingBuffs
      }
    };
  });
  
  // 方法返回值保持为 sanChange 以保持接口兼容性，但内部使用 insightChange
  return { hpChange, insightChange, expiredBuffs };
}

/**
 * 应用事件触发的 Buff
 */
export function applyEventBuff(
  get: () => StoreState,
  eventId: string
): void {
  const mapping = (buffConfig as any).eventMappings[eventId];
  if (!mapping) return; // 该事件无Buff映射
  
  // 检查概率
  if (Math.random() > mapping.probability) return;
  
  const buffTemplate = (buffConfig as any).buffs[mapping.buffId];
  if (!buffTemplate) {
    console.warn(`[SurvivalBuff] 未找到Buff定义: ${mapping.buffId}`);
    return;
  }
  
  // 创建Buff实例（支持overrideDuration覆盖默认持续时间）
  const duration = mapping.overrideDuration !== undefined 
    ? mapping.overrideDuration 
    : buffTemplate.duration;
  
  const buff: SurvivalBuff = {
    id: `${mapping.buffId}_${Date.now()}`,
    name: buffTemplate.name,
    description: buffTemplate.description,
    duration: duration,
    maxDuration: duration,
    effects: buffTemplate.effects,
    source: eventId,
    stackable: buffTemplate.stackable,
    maxStacks: buffTemplate.maxStacks,
    icon: buffTemplate.icon
  };
  
  get().addSurvivalBuff(buff);
  
  // 通知玩家
  const state = get() as any;
  if (state.addNotification) {
    state.addNotification(`获得状态: ${buff.name}`, 'info');
  }
}

/**
 * 从物品效果应用 Buff
 */
export function applyItemBuff(
  get: () => StoreState,
  buffId: string,
  customDuration?: number
): void {
  const buffTemplate = (buffConfig as any).buffs[buffId];
  if (!buffTemplate) {
    console.warn(`[SurvivalBuff] 未找到Buff定义: ${buffId}`);
    return;
  }
  
  const duration = customDuration !== undefined ? customDuration : buffTemplate.duration;
  
  // 创建Buff实例
  const buff: SurvivalBuff = {
    id: `${buffId}_${Date.now()}`,
    name: buffTemplate.name,
    description: buffTemplate.description,
    duration: duration,
    maxDuration: duration,
    effects: buffTemplate.effects,
    source: 'ITEM',
    stackable: buffTemplate.stackable,
    maxStacks: buffTemplate.maxStacks,
    icon: buffTemplate.icon
  };
  
  get().addSurvivalBuff(buff);
  
  // 通知玩家
  const state = get() as any;
  if (state.addNotification) {
    const stackMsg = buffTemplate.stackable ? ' (可堆叠)' : '';
    state.addNotification(`获得状态: ${buff.name}${stackMsg}`, 'info');
  }
}
