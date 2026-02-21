/**
 * 事件动态加载系统
 * 
 * 功能：
 * - 按阶级分目录加载240个事件
 * - 支持热重载（开发模式）
 * - 事件池管理与权重抽样
 */

import { GameEvent, PlayerClass } from '@/types/schema';
import type { StoreState } from '@/types/store';

// ==========================================
// 1. 事件模块导入（Vite glob导入）
// ==========================================

// 使用Vite的import.meta.glob动态导入所有事件JSON
// @ts-ignore Vite specific API with type arguments
const eventModules: Record<string, { default: GameEvent }> = (import.meta as any).glob(
  '@/assets/data/events/**/*.json',
  { eager: true }
);

// ==========================================
// 2. 事件缓存与索引
// ==========================================

// 扩展PlayerClass以包含COMMON
export type EventClassType = PlayerClass | 'COMMON';

interface EventIndex {
  byId: Map<string, GameEvent>;
  byClass: Map<EventClassType, GameEvent[]>;
  byCategory: Map<string, GameEvent[]>;
}

let eventIndex: EventIndex | null = null;

/**
 * 构建事件索引
 * 应用启动时调用一次
 */
export function buildEventIndex(): EventIndex {
  const index: EventIndex = {
    byId: new Map(),
    byClass: new Map<EventClassType, GameEvent[]>([
      [PlayerClass.Homeless, []],
      [PlayerClass.Worker, []],
      [PlayerClass.Middle, []],
      [PlayerClass.Capitalist, []],
      ['COMMON', []]
    ]),
    byCategory: new Map()
  };

  // 遍历所有导入的模块
  Object.entries(eventModules).forEach(([path, mod]) => {
    const event = mod.default;
    
    // 验证事件数据
    if (!validateEvent(event)) {
      console.warn(`Invalid event data in ${path}:`, event);
      return;
    }

    // 加入ID索引
    index.byId.set(event.id, event);

    // 解析阶级分类
    const eventClass = parseEventClass(event.id, (event as any).category);
    const classList = index.byClass.get(eventClass as EventClassType);
    if (classList) {
      classList.push(event);
    }

    // 加入分类索引
    if (event.series) {
      const seriesList = index.byCategory.get(event.series) || [];
      seriesList.push(event);
      index.byCategory.set(event.series, seriesList);
    }
  });

  eventIndex = index;
  
  // 打印统计
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              事件系统加载完成                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`总计: ${index.byId.size} 个事件`);
  console.log(`  HOMELESS: ${index.byClass.get(PlayerClass.Homeless)?.length || 0}`);
  console.log(`  WORKER: ${index.byClass.get(PlayerClass.Worker)?.length || 0}`);
  console.log(`  MIDDLE: ${index.byClass.get(PlayerClass.Middle)?.length || 0}`);
  console.log(`  CAPITALIST: ${index.byClass.get(PlayerClass.Capitalist)?.length || 0}`);
  console.log(`  COMMON: ${index.byClass.get('COMMON')?.length || 0}`);

  return index;
}

// ==========================================
// 3. 事件查询API
// ==========================================

/**
 * 通过ID获取事件
 */
export function getEventById(id: string): GameEvent | undefined {
  if (!eventIndex) buildEventIndex();
  return eventIndex!.byId.get(id);
}

/**
 * 获取指定阶级的所有事件
 */
export function getEventsByClass(playerClass: EventClassType): GameEvent[] {
  if (!eventIndex) buildEventIndex();
  return eventIndex!.byClass.get(playerClass) || [];
}

/**
 * 获取所有可用事件（根据玩家状态筛选）
 */
export function getAvailableEvents(state: StoreState): GameEvent[] {
  if (!eventIndex) buildEventIndex();

  const playerClass = state.vitality.identity.currentClass as EventClassType;
  const allEvents: GameEvent[] = [];

  // 添加当前阶级专属事件
  const classEvents = eventIndex!.byClass.get(playerClass) || [];
  allEvents.push(...classEvents);

  // 添加通用事件
  const commonEvents = eventIndex!.byClass.get('COMMON') || [];
  allEvents.push(...commonEvents);

  // 根据条件筛选
  return allEvents.filter(event => checkEventConditions(event, state));
}

// ==========================================
// 4. 事件抽样（带权重）
// ==========================================

/**
 * 从可用事件中按权重抽样
 * 用于随机触发事件
 */
export function sampleEvent(state: StoreState): GameEvent | null {
  const available = getAvailableEvents(state);
  
  if (available.length === 0) return null;

  // 计算总权重
  const totalWeight = available.reduce((sum, event) => 
    sum + (event.weight || 10), 0
  );

  // 随机抽样
  let random = Math.random() * totalWeight;
  
  for (const event of available) {
    random -= (event.weight || 10);
    if (random <= 0) return event;
  }

  return available[available.length - 1];
}

/**
 * 按类别抽样事件
 * 用于特定场景（如医疗事件、工作事件）
 */
export function sampleEventByCategory(
  category: string,
  state: StoreState
): GameEvent | null {
  if (!eventIndex) buildEventIndex();

  const categoryEvents = eventIndex!.byCategory.get(category) || [];
  const available = categoryEvents.filter(event => 
    checkEventConditions(event, state)
  );

  if (available.length === 0) return null;

  // 简单随机（等权重）
  return available[Math.floor(Math.random() * available.length)];
}

// ==========================================
// 5. 条件检查
// ==========================================

/**
 * 检查事件是否满足触发条件
 */
function checkEventConditions(event: GameEvent, state: StoreState): boolean {
  const conditions = event.conditions;
  if (!conditions) return true;

  // 阶级检查
  if (conditions.requiredClass && conditions.requiredClass.length > 0) {
    const playerClass = state.vitality.identity.currentClass;
    if (!conditions.requiredClass.includes(playerClass)) {
      return false;
    }
  }

  // 灵视值范围检查
  const insight = state.vitality.metrics.insight;
  if (conditions.minInsight !== undefined && insight < conditions.minInsight) {
    return false;
  }
  if (conditions.maxInsight !== undefined && insight > conditions.maxInsight) {
    return false;
  }

  // 理智值范围检查（san = 100 - insight，反比关系）- 使用类型断言
  const san = 100 - insight;
  const condAny = conditions as any;
  if (condAny.minSan !== undefined && san < condAny.minSan) {
    return false;
  }
  if (condAny.maxSan !== undefined && san > condAny.maxSan) {
    return false;
  }

  // 回合范围检查
  const currentTurn = state.vitality.time.currentTurn;
  if (condAny.minTurn !== undefined && currentTurn < condAny.minTurn) {
    return false;
  }
  if (condAny.maxTurn !== undefined && currentTurn > condAny.maxTurn) {
    return false;
  }

  // 区域检查
  if (conditions.region && state.currentRegion !== conditions.region) {
    return false;
  }

  // 物品检查
  if (conditions.hasItem && !state.inventory.includes(conditions.hasItem)) {
    return false;
  }

  return true;
}

// ==========================================
// 6. 辅助函数
// ==========================================

/**
 * 从事件ID解析阶级
 */
function parseEventClass(
  eventId: string, 
  category?: string
): EventClassType {
  // 优先使用category字段
  if (category) {
    const upperCategory = category.toUpperCase();
    if (upperCategory === 'HOMELESS') return PlayerClass.Homeless;
    if (upperCategory === 'WORKER') return PlayerClass.Worker;
    if (upperCategory === 'MIDDLE') return PlayerClass.Middle;
    if (upperCategory === 'CAPITALIST') return PlayerClass.Capitalist;
    if (upperCategory === 'COMMON') return 'COMMON';
  }

  // 从ID解析
  if (eventId.startsWith('EVT_H')) return PlayerClass.Homeless;
  if (eventId.startsWith('EVT_W')) return PlayerClass.Worker;
  if (eventId.startsWith('EVT_M')) return PlayerClass.Middle;
  if (eventId.startsWith('EVT_C')) return PlayerClass.Capitalist;
  if (eventId.startsWith('EVT_X')) return 'COMMON';

  // 兜底：从路径推断
  if (eventId.includes('HOMELESS')) return PlayerClass.Homeless;
  if (eventId.includes('WORKER')) return PlayerClass.Worker;
  if (eventId.includes('MIDDLE')) return PlayerClass.Middle;
  if (eventId.includes('CAPITALIST')) return PlayerClass.Capitalist;

  return 'COMMON';
}

/**
 * 简单的事件数据验证
 */
function validateEvent(event: Partial<GameEvent>): boolean {
  // 必需字段
  if (!event.id || !event.title || !event.text) {
    return false;
  }

  // 选项检查
  if (!event.options || 
      !event.options.A || !event.options.B || 
      !event.options.C || !event.options.D) {
    console.warn(`Event ${event.id} missing options`);
    return false;
  }

  // D选项必须有效应（因为这是真相选项）
  if (!event.options.D.effects) {
    console.warn(`Event ${event.id} D option missing effects`);
    return false;
  }

  return true;
}

// ==========================================
// 7. 调试工具
// ==========================================

/**
 * 打印事件统计信息
 */
export function printEventStatistics(): void {
  if (!eventIndex) buildEventIndex();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                 事件系统统计                             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 按阶级统计
  ([PlayerClass.Homeless, PlayerClass.Worker, PlayerClass.Middle, PlayerClass.Capitalist, 'COMMON'] as EventClassType[]).forEach(cls => {
    const events = eventIndex!.byClass.get(cls) || [];
    console.log(`[${cls}] ${events.length} 个事件`);
    
    // 统计每个选项的平均数值
    if (events.length > 0) {
      const avgHpA = events.reduce((sum, e) => sum + (e.options.A.effects?.hp || 0), 0) / events.length;
      const avgHpD = events.reduce((sum, e) => sum + (e.options.D.effects?.hp || 0), 0) / events.length;
      console.log(`  A选项平均HP: ${avgHpA.toFixed(1)}, D选项平均HP: ${avgHpD.toFixed(1)}`);
    }
  });

  // 按系列统计
  console.log('\n按系列分类:');
  eventIndex!.byCategory.forEach((events, series) => {
    console.log(`  ${series}: ${events.length} 个`);
  });
}

/**
 * 查找缺失的事件（用于开发期检查）
 */
export function findMissingEvents(
  expectedIds: string[]
): { found: string[]; missing: string[] } {
  if (!eventIndex) buildEventIndex();

  const found: string[] = [];
  const missing: string[] = [];

  expectedIds.forEach(id => {
    if (eventIndex!.byId.has(id)) {
      found.push(id);
    } else {
      missing.push(id);
    }
  });

  return { found, missing };
}
