import {
  Item,
  GameEvent,
  Bill,
  Archive,
  Ending,
  Job,
  Housing,
  Insurance,
  NewsItem,
  Disease,
  LoanProduct
} from '../types/schema';

// ------------------------------------------------------------------
// 基础工具：加载 JSON
// ------------------------------------------------------------------
const loadJsonData = async <T>(path: string): Promise<T> => {
  try {
    const response = await fetch(path);
    // 检查 HTTP 状态码
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    // 检查 JSON 语法错误
    try {
      return await response.json();
    } catch (parseError) {
      throw new Error(`JSON Syntax Error (格式错误)`);
    }
  } catch (error: any) {
    // 🔥 这里会抛出具体是哪个文件挂了
    throw new Error(`加载文件失败 [${path}]: ${error.message}`);
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
    insurance,
    loans,
    news,
    diseases
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
    loadJsonData<LoanProduct[]>('/src/assets/data/loans.json'),
    loadJsonData<NewsItem[]>('/src/assets/data/news.json'),
    loadJsonData<Disease[]>('/src/assets/data/diseases.json'),
  ]);

  // 返回扩展后的数据包
  return { items, events, bills, archives, endings, classes, global, jobs, housing, insurance, loans, news, diseases };
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

export const createJobMap = (jobs: Job[]): Map<string, Job> => {
  return new Map(jobs.map(job => [job.id, job]));
};