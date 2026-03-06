/**
 * 事件动态加载系统（按需加载版）
 * 
 * 功能：
 * - 按阶级分目录异步加载事件
 * - 支持按需加载，减少启动时间和内存占用
 * - 事件池管理与权重抽样
 */

import { GameEvent, PlayerClass } from '@/types/schema';
import type { StoreState } from '@/types/store';

// ==========================================
// 1. 事件模块导入（Vite glob导入 - 懒加载）
// ==========================================

// 使用Vite的import.meta.glob动态导入所有事件JSON（懒加载模式）
// @ts-ignore Vite specific API with type arguments
const eventModules: Record<string, () => Promise<{ default: GameEvent }>> = (import.meta as any).glob(
  '@/assets/data/events/**/*.json',
  { eager: false }  // ✅ 改为懒加载
);

// 事件ID到路径的映射
const eventIdToPath: Map<string, string> = new Map();

/**
 * 扫描所有可用的事件ID（不加载内容）
 */
function scanEventIds(): void {
  if (eventIdToPath.size > 0) return;  // 已扫描过
  
  Object.keys(eventModules).forEach(path => {
    const eventId = pathToId(path);
    eventIdToPath.set(eventId, path);
  });
  
  console.log(`[EventLoader] 扫描到 ${eventIdToPath.size} 个事件ID`);
}

/**
 * 从路径提取事件ID
 */
function pathToId(path: string): string {
  const match = path.match(/\/([^/]+)\.json$/);
  return match ? match[1] : path;
}

// ==========================================
// 2. 事件缓存与索引
// ==========================================

// 扩展PlayerClass以包含COMMON
export type EventClassType = PlayerClass | 'COMMON';

interface EventIndex {
  byId: Map<string, GameEvent>;
  byClass: Map<EventClassType, GameEvent[]>;
  byCategory: Map<string, GameEvent[]>;
  loaded: Set<string>;  // 已加载的事件ID
}

let eventIndex: EventIndex | null = null;

/**
 * 构建事件索引（仅扫描ID，不加载内容）
 * 应用启动时调用一次
 */
export function buildEventIndex(): EventIndex {
  // 扫描所有事件ID
  scanEventIds();
  
  const index: EventIndex = {
    byId: new Map(),
    byClass: new Map<EventClassType, GameEvent[]>([
      [PlayerClass.Homeless, []],
      [PlayerClass.Worker, []],
      [PlayerClass.Middle, []],
      [PlayerClass.Capitalist, []],
      ['COMMON', []]
    ]),
    byCategory: new Map(),
    loaded: new Set()
  };
  
  // 根据ID分类（不加载内容）
  eventIdToPath.forEach((path, eventId) => {
    const eventClass = parseEventClassFromId(eventId);
    const classList = index.byClass.get(eventClass as EventClassType);
    if (classList) {
      // 暂时存储ID，需要时加载
      (classList as any).push({ id: eventId, _path: path });
    }
  });

  eventIndex = index;
  
  // 打印统计
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              事件索引构建完成                            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`总计: ${eventIdToPath.size} 个事件（按需加载）`);

  return index;
}

/**
 * 异步加载单个事件
 */
export async function loadEventById(eventId: string): Promise<GameEvent | null> {
  if (!eventIndex) buildEventIndex();
  
  // 已缓存
  if (eventIndex!.byId.has(eventId)) {
    return eventIndex!.byId.get(eventId)!;
  }
  
  const path = eventIdToPath.get(eventId);
  if (!path) {
    console.warn(`[EventLoader] 未找到事件: ${eventId}`);
    return null;
  }
  
  try {
    const loader = eventModules[path];
    if (!loader) {
      console.warn(`[EventLoader] 无法加载: ${path}`);
      return null;
    }
    
    const mod = await loader();
    const event = mod.default;
    
    if (!validateEvent(event)) {
      console.warn(`[EventLoader] 无效事件数据: ${eventId}`);
      return null;
    }
    
    // 加入索引
    eventIndex!.byId.set(eventId, event);
    eventIndex!.loaded.add(eventId);
    
    // 加入分类索引
    const eventClass = parseEventClass(event.id, (event as any).category);
    const classList = eventIndex!.byClass.get(eventClass as EventClassType);
    if (classList) {
      // 替换占位符为真实事件
      const idx = classList.findIndex((e: any) => e.id === eventId);
      if (idx >= 0) {
        classList[idx] = event;
      } else {
        classList.push(event);
      }
    }
    
    // 加入系列索引
    if (event.series) {
      const seriesList = eventIndex!.byCategory.get(event.series) || [];
      if (!seriesList.find(e => e.id === event.id)) {
        seriesList.push(event);
        eventIndex!.byCategory.set(event.series, seriesList);
      }
    }
    
    return event;
  } catch (error) {
    console.error(`[EventLoader] 加载事件失败 ${eventId}:`, error);
    return null;
  }
}

/**
 * 从ID解析阶级（仅基于ID，不加载内容）
 */
function parseEventClassFromId(eventId: string): EventClassType {
  if (eventId.startsWith('EVT_H')) return PlayerClass.Homeless;
  if (eventId.startsWith('EVT_W')) return PlayerClass.Worker;
  if (eventId.startsWith('EVT_M')) return PlayerClass.Middle;
  if (eventId.startsWith('EVT_CAPITALIST')) return PlayerClass.Capitalist;
  return 'COMMON';
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
