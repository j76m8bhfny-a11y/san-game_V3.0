import { 
  Item, 
  GameEvent, 
  Bill, 
  Archive, 
  Ending,
  Job,
  Housing,
  Insurance
} from '../types/schema';

// ------------------------------------------------------------------
// 基础工具：加载 JSON
// ------------------------------------------------------------------
const loadJsonData = async <T>(path: string): Promise<T> => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading JSON from ${path}:`, error);
    throw error;
  }
};

// ------------------------------------------------------------------
// 核心：加载所有游戏数据
// ------------------------------------------------------------------
export const loadAllGameData = async () => {
  const [
    items, 
    events, 
    bills, 
    archives, 
    endings,
    classes,
    global,
    // 👇 新增加载项
    jobs,
    housing,
    insurance
  ] = await Promise.all([
    loadJsonData<Item[]>('/src/assets/data/items.json'),
    loadJsonData<GameEvent[]>('/src/assets/data/events.json'),
    loadJsonData<Bill[]>('/src/assets/data/bills.json'),
    loadJsonData<Archive[]>('/src/assets/data/archives.json'),
    loadJsonData<Ending[]>('/src/assets/data/endings.json'),
    loadJsonData<any[]>('/src/assets/data/classes.json'), 
    loadJsonData<any>('/src/assets/data/global.json'),
    // 👇 新增路径
    loadJsonData<Job[]>('/src/assets/data/jobs.json'),
    loadJsonData<Housing[]>('/src/assets/data/housing.json'),
    loadJsonData<Insurance[]>('/src/assets/data/insurance.json'),
  ]);

  // 返回扩展后的数据包
  return { items, events, bills, archives, endings, classes, global, jobs, housing, insurance };
};

// ------------------------------------------------------------------
// Map 创建辅助函数 (保持不变)
// ------------------------------------------------------------------
export const createItemMap = (items: Item[]): Map<string, Item> => {
  return new Map(items.map(item => [item.id, item]));
};

export const createEventMap = (events: GameEvent[]): Map<string, GameEvent> => {
  return new Map(events.map(event => [event.id, event]));
};

export const createBillMap = (bills: Bill[]): Map<string, Bill> => {
  return new Map(bills.map(bill => [bill.id, bill]));
};

export const createArchiveMap = (archives: Archive[]): Map<string, Archive> => {
  return new Map(archives.map(archive => [archive.id, archive]));
};

export const createEndingMap = (endings: Ending[]): Map<string, Ending> => {
  return new Map(endings.map(ending => [ending.id, ending]));
};