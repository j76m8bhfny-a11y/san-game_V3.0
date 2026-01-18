import { z } from 'zod';
import {
  ItemSchema,
  ArchiveSchema,
  BillSchema,
  EventSchema,
  EndingSchema,
  type Item,
  type Archive,
  type Bill,
  type GameEvent,
  type Ending,
} from '@/types/schema';

// Schema 数组版本
const ItemsArraySchema = z.array(ItemSchema);
const ArchivesArraySchema = z.array(ArchiveSchema);
const BillsArraySchema = z.array(BillSchema);
const EventsArraySchema = z.array(EventSchema);
const EndingsArraySchema = z.array(EndingSchema);

export async function loadItems(): Promise<Item[]> {
  const response = await fetch('/src/assets/data/items.json');
  return ItemsArraySchema.parse(await response.json());
}

export async function loadArchives(): Promise<Archive[]> {
  const response = await fetch('/src/assets/data/archives.json');
  return ArchivesArraySchema.parse(await response.json());
}

export async function loadBills(): Promise<Bill[]> {
  const response = await fetch('/src/assets/data/bills.json');
  return BillsArraySchema.parse(await response.json());
}

export async function loadEvents(): Promise<GameEvent[]> {
  const response = await fetch('/src/assets/data/events.json');
  return EventsArraySchema.parse(await response.json());
}

export async function loadEndings(): Promise<Ending[]> {
  const response = await fetch('/src/assets/data/endings.json');
  return EndingsArraySchema.parse(await response.json());
}

export async function loadAllGameData() {
  const [items, archives, bills, events, endings] = await Promise.all([
    loadItems(),
    loadArchives(),
    loadBills(),
    loadEvents(),
    loadEndings(),
  ]);

  return { items, archives, bills, events, endings };
}

// 辅助函数：创建 Map 以便快速查找
export const createItemMap = (items: Item[]) => new Map(items.map(i => [i.id, i]));
export const createArchiveMap = (archives: Archive[]) => new Map(archives.map(a => [a.id, a]));
export const createBillMap = (bills: Bill[]) => new Map(bills.map(b => [b.id, b]));
export const createEventMap = (events: GameEvent[]) => new Map(events.map(e => [e.id, e]));
export const createEndingMap = (endings: Ending[]) => new Map(endings.map(e => [e.id, e]));