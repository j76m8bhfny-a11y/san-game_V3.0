import { GameState, GameEvent, EventOption, PlayerClass, RegionID } from '@/types/schema';

// 辅助：安全获取属性 (映射旧属性到新结构)
const getStat = (state: GameState, key: string): any => {
  if (key === 'hp') return state.vitality.metrics.hp;
  if (key === 'maxHp') return state.vitality.metrics.maxHp;
  if (key === 'san') return state.vitality.metrics.san;
  if (key === 'maxSan') return state.vitality.metrics.maxSan;
  if (key === 'gold') return state.vitality.metrics.gold;
  if (key === 'currentClass') return state.vitality.identity.currentClass;
  return 0;
};

// 1. 检查事件触发条件
export const checkCondition = (state: GameState, condition: GameEvent['conditions']): boolean => {
  if (!condition) return true;

  // SAN Check
  if (condition.minSan !== undefined && state.vitality.metrics.san < condition.minSan) return false;
  if (condition.maxSan !== undefined && state.vitality.metrics.san > condition.maxSan) return false;

  // Class Check
  if (condition.requiredClass && condition.requiredClass.length > 0) {
    if (!condition.requiredClass.includes(state.vitality.identity.currentClass)) return false;
  }

  // Region Check
  if (condition.region && state.currentRegion !== condition.region) return false;

  // Item Check
  if (condition.hasItem && !state.inventory.includes(condition.hasItem)) return false;

  return true;
};

// 2. 解析选项文本 (替换变量)
export const resolveEventText = (text: string, state: GameState): string => {
  return text
    .replace(/{HP}/g, state.vitality.metrics.hp.toString())
    .replace(/{SAN}/g, state.vitality.metrics.san.toString())
    .replace(/{GOLD}/g, state.vitality.metrics.gold.toString())
    .replace(/{CLASS}/g, state.vitality.identity.currentClass)
    .replace(/{REGION}/g, state.currentRegion);
};

// 3. 处理选项结果预览 (例如显示 "HP -10" 提示)
export const resolveOptionPreview = (option: EventOption): string[] => {
  const previews: string[] = [];
  const { effects } = option;

  if (!effects) return previews;

  if (effects.hp) previews.push(`HP ${effects.hp > 0 ? '+' : ''}${effects.hp}`);
  if (effects.san) previews.push(`SAN ${effects.san > 0 ? '+' : ''}${effects.san}`);
  if (effects.gold) previews.push(`$${effects.gold}`);
  
  if (effects.items) {
    effects.items.forEach(item => {
      previews.push(`获得: ${item.itemId} x${item.count}`);
    });
  }

  if (effects.jail) {
    previews.push(`入狱: ${effects.jail.turns}周`);
  }

  return previews;
};

// 4. 应用选项效果 (核心逻辑)
// 返回一个更新对象，供 State 进行 merge
export const resolveOptionEffects = (state: GameState, option: EventOption) => {
  const updates: any = { vitality: { metrics: {}, identity: { points: {} } } };
  const logs: string[] = [];
  const { effects } = option;

  if (!effects) return { updates, logs };

  // --- 数值变更 ---
  if (effects.hp !== undefined) {
    const newHp = Math.min(
      state.vitality.metrics.maxHp, 
      Math.max(0, state.vitality.metrics.hp + effects.hp)
    );
    updates.vitality.metrics.hp = newHp;
    logs.push(`HP ${effects.hp > 0 ? '+' : ''}${effects.hp}`);
  }

  if (effects.san !== undefined) {
    const newSan = Math.min(
      state.vitality.metrics.maxSan, 
      Math.max(0, state.vitality.metrics.san + effects.san)
    );
    updates.vitality.metrics.san = newSan;
    logs.push(`SAN ${effects.san > 0 ? '+' : ''}${effects.san}`);
  }

  if (effects.gold !== undefined) {
    // 注意：这里只是计算，真正的记账建议在 UI 层调用 addTransaction
    // 但为了兼容，我们这里直接改数值，或者返回一个标记让 UI 处理
    const newGold = state.vitality.metrics.gold + effects.gold;
    updates.vitality.metrics.gold = newGold;
    logs.push(`资金 ${effects.gold > 0 ? '+' : ''}${effects.gold}`);
    
    // 如果需要记录账本，最好由调用者(UI)处理 addTransaction
    // 因为这里是纯函数，拿不到 store 的 actions
  }

  // --- 政治点数 ---
  if (effects.points) {
    const currentPoints = state.vitality.identity.points;
    updates.vitality.identity.points = {
      red: currentPoints.red + (effects.points.red || 0),
      wolf: currentPoints.wolf + (effects.points.wolf || 0),
      old: currentPoints.old + (effects.points.old || 0)
    };
  }

  // --- 物品获取 ---
  if (effects.items && effects.items.length > 0) {
    const newItems = effects.items.map(i => i.itemId);
    updates.inventory = [...state.inventory, ...newItems];
    logs.push(`获得物品: ${newItems.join(', ')}`);
  }

  // --- 监狱 ---
  if (effects.jail) {
    updates.prison = {
      inJail: true,
      crime: effects.jail.reason,
      sentenceTurns: effects.jail.turns,
      turnsServed: 0,
      bailAmount: effects.jail.bail
    };
    logs.push(`被捕入狱: ${effects.jail.reason}`);
  }

  return { updates, logs };
};