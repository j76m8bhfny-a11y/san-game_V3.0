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
// 静态导入 JSON 数据（Vite 会自动处理，无需 fetch）
// ------------------------------------------------------------------
import itemsData from '@/assets/data/items.json';
import billsData from '@/assets/data/bills.json';
import archivesData from '@/assets/data/archives.json';
import endingsData from '@/assets/data/endings.json';
import classesData from '@/assets/data/classes.json';
import globalData from '@/assets/data/global.json';
import jobsData from '@/assets/data/jobs.json';
import housingData from '@/assets/data/housing.json';
import insuranceData from '@/assets/data/insurance.json';
import loansData from '@/assets/data/loans.json';
import newsData from '@/assets/data/news.json';
import diseasesData from '@/assets/data/diseases.json';

// ------------------------------------------------------------------
// 核心：加载所有游戏数据
// ------------------------------------------------------------------
export const loadAllGameData = async () => {
  // 静态导入的数据直接使用，无需 await
  const items = itemsData as unknown as Item[];
  const bills = billsData as unknown as Bill[];
  const archives = archivesData as unknown as Archive[];
  const endings = endingsData as unknown as Ending[];
  const classes = classesData as unknown as any[];
  const global = globalData as unknown as any;
  const jobs = jobsData as unknown as Job[];
  const housing = housingData as unknown as Housing[];
  const insurance = insuranceData as unknown as Insurance[];
  const loans = loansData as unknown as LoanProduct[];
  const news = newsData as unknown as NewsItem[];
  const diseases = diseasesData as unknown as Disease[];

  // 返回扩展后的数据包（events 已由 EventSystem 单独加载，这里返回空数组占位）
  return { items, bills, archives, endings, classes, global, jobs, housing, insurance, loans, news, diseases, events: [] };
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
