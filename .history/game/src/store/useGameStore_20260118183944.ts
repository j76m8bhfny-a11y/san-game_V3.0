// src/store/useGameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState,
  PlayerClass,
  Item,
  Bill,
  GameEvent,
  Archive,
  Ending
} from '@/types/schema';
import {
  checkClassUpdate,
  calcSalary,
  triggerBill,
  clamp,
  calculateOptionEffects,
  processSpecialItemEffects
} from '@/logic/core';
import { resolveEnding } from '@/logic/endings';
import { 
  loadAllGameData, 
  createItemMap, 
  createEventMap, 
  createBillMap, 
  createArchiveMap, 
  createEndingMap 
} from '@/utils/dataLoader';

// 1. 定义 Actions 接口
interface GameActions {
  // 核心循环 Actions
  nextDay: () => void;
  chooseOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  buyItem: (itemId: string) => void;
  
  // UI 辅助数据 (Getters/Derived)
  shopItems: () => Item[];       // 商店当前显示的物品
  
  // 系统 Actions
  setHydrated: () => void;
  resetGame: () => void;
  initializeData: () => Promise<void>;
}

// 合并 State 和 Actions
type GameStore = GameState & GameActions;

// 2. 初始状态 (Initial State)
const INITIAL_STATE: Omit<GameState, '_hasHydrated'> = {
  day: 1,
  hp: 100,
  maxHp: 100,
  san: 50,    // 默认蓝药丸状态
  gold: 100,  // 初始资金
  currentClass: PlayerClass.Worker,
  
  currentEvent: null,
  activeBill: null,
  ending: null,
  
  inventory: [],
  history: [],
  unlockedArchives: [],
  
  flags: {
    isHomeless: false,
    debtDays: 0,
    hasRedBook: false,
    hasCryptoKey: false
  },
  
  points: { red: 0, wolf: 0, old: 0 }
};

// 3. 版本控制 (Ω-Optimized)
// 修改数据结构时（如新增 flag），请增加此版本号以触发迁移重置
const STORE_VERSION = 2; // v12.0 Update

// 4. 数据缓存（全局单例）
let gameDataCache: {
  items: Item[];
  archives: Archive[];
  bills: Bill[];
  events: GameEvent[];
  endings: Ending[];
  itemMap: Map<string, Item>;
  eventMap: Map<string, GameEvent>;
  billMap: Map<string, Bill>;
  archiveMap: Map<string, Archive>;
  endingMap: Map<string, Ending>;
} | null = null;

// 5. Store 实现
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      _hasHydrated: false, // 💧 防水闸初始关闭

      // --- 数据初始化 ---
      initializeData: async () => {
        if (gameDataCache) return; // 已加载则跳过
        
        try {
          const data = await loadAllGameData();
          gameDataCache = {
            ...data,
            itemMap: createItemMap(data.items),
            eventMap: createEventMap(data.events),
            billMap: createBillMap(data.bills),
            archiveMap: createArchiveMap(data.archives),
            endingMap: createEndingMap(data.endings),
          };
          console.log('[Store] Game data loaded:', {
            items: data.items.length,
            events: data.events.length,
            bills: data.bills.length,
            endings: data.endings.length,
            archives: data.archives.length,
          });
        } catch (error) {
          console.error('[Store] Failed to load game data:', error);
        }
      },

      /**
       * 获取商店可购买物品列表
       * 根据当前 gold 和 hp 过滤物品
       */
      shopItems: () => {
        if (!gameDataCache) return [];
        
        const { gold, currentClass } = get();
        
        return gameDataCache.items.filter(item => {
          // 检查是否买得起 (卖血类物品价格为0或负数，不做此检查)
          if (item.price > 0 && gold < item.price) return false;
          
          // 检查职业限制
          if (item.requiredClass && item.requiredClass !== currentClass) return false;
          
          // 检查解锁条件 (简单字符串解析)
          if (item.unlockCondition) {
            // 解析 "gold < X"
            if (item.unlockCondition.includes('gold <')) {
              const val = parseInt(item.unlockCondition.split('<')[1]);
              if (gold >= val) return false;
            }
          }
          
          return true;
        });
      },

      /**
       * 进入下一天
       * 核心游戏循环逻辑 (v12.0)
       */
      nextDay: () => {
        const state = get();
        if (!gameDataCache) return;
        
        // 1. 检查结局
        const endingId = resolveEnding(state);
        if (endingId) {
          set({ ending: endingId });
          return;
        }
        
        // 2. 应用阶级环境伤害 (v12.0 新增)
        // 流浪汉：每月被动 -10 HP (寒冬)
        let envHpLoss = 0;
        if (state.currentClass === PlayerClass.Homeless) {
          envHpLoss = -10;
        }

        // 3. 计算薪资
        // 映射基准月薪
        const baseSalaryMap = {
          [PlayerClass.Homeless]: 50,
          [PlayerClass.Worker]: 3200,
          [PlayerClass.Middle]: 12000,
          [PlayerClass.Capitalist]: 80000,
        };
        const baseSalary = baseSalaryMap[state.currentClass];
        const salary = calcSalary(baseSalary, state.san);
        
        // 4. 触发随机账单/事件
        const bill = triggerBill(state.gold, state.currentClass, gameDataCache.bills);
        const billAmount = bill?.amount || 0;

        // 5. 债务代偿机制 (v12.0 核心)
        // 如果是扣款账单且导致无法支付，强制扣 HP 抵债
        let hpDebtPenalty = 0;
        
        if (billAmount < 0) {
          // 计算当前可用资金 (现有 + 工资)
          const availableFunds = state.gold + salary;
          const cost = Math.abs(billAmount);
          
          // 如果钱不够付账单
          if (availableFunds < cost) {
            const unpaidAmount = cost - Math.max(0, availableFunds);
            // 每欠 $10 扣 1 HP
            hpDebtPenalty = -Math.ceil(unpaidAmount / 10);
          }
        }

        // 6. 计算新资金与阶级
        const newGold = state.gold + salary + billAmount;
        const newClass = checkClassUpdate(newGold);
        
        // 7. 更新状态
        set({
          day: state.day + 1,
          gold: newGold,
          // 应用环境伤害 + 债务惩罚
          hp: clamp(state.hp + envHpLoss + hpDebtPenalty, 0, state.maxHp),
          currentClass: newClass,
          activeBill: bill || null,
          flags: {
            ...state.flags,
            isHomeless: newClass === PlayerClass.Homeless,
            // 如果资金为负，累积债务天数
            debtDays: newGold < 0 ? state.flags.debtDays + 1 : 0,
          },
          history: [
            ...state.history,
            `Day ${state.day + 1}: Salary +$${salary}${bill ? `, Bill ${bill.name} ($${bill.amount})` : ''}`
          ],
        });
        
        // 8. 随机选择新事件 (Event Pool)
        const availableEvents = gameDataCache.events.filter(event => {
          const { conditions } = event;
          
          if (conditions.minSan !== undefined && state.san < conditions.minSan) return false;
          if (conditions.maxSan !== undefined && state.san > conditions.maxSan) return false;
          if (conditions.requiredClass && !conditions.requiredClass.includes(newClass)) return false;
          if (conditions.hasItem && !state.inventory.includes(conditions.hasItem)) return false;
          
          return true;
        });
        
        if (availableEvents.length > 0) {
          const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
          set({ currentEvent: randomEvent });
        }
      },

      /**
       * 选择事件选项
       * 接入 v12.0 公式系统 (calculateOptionEffects)
       */
      chooseOption: (optionId) => {
        const state = get();
        if (!state.currentEvent || !gameDataCache) return;
        
        const option = state.currentEvent.options[optionId];
        if (!option) return;
        
        const { effects, archiveId } = option;
        
        // 1. 应用 v12.0 数值计算 (含动态压力P系数)
        const { goldChange, hpChange, sanChange } = calculateOptionEffects(
          effects,
          state.currentClass,
          state.san
        );
        
        const newHp = clamp(state.hp + hpChange, 0, state.maxHp);
        const newSan = clamp(state.san + sanChange, 0, 100);
        const newGold = state.gold + goldChange;
        
        // 2. 应用积分
        const newPoints = {
          red: state.points.red + (effects.points?.red || 0),
          wolf: state.points.wolf + (effects.points?.wolf || 0),
          old: state.points.old + (effects.points?.old || 0),
        };
        
        // 3. 处理物品获得/失去
        let newInventory = [...state.inventory];
        if (effects.items) {
          effects.items.forEach(({ itemId, count }) => {
            if (count > 0) {
              for (let i = 0; i < count; i++) newInventory.push(itemId);
            } else {
              const removeCount = Math.abs(count);
              for (let i = 0; i < removeCount; i++) {
                const idx = newInventory.indexOf(itemId);
                if (idx !== -1) newInventory.splice(idx, 1);
              }
            }
          });
        }
        
        // 4. 更新 Flags
        const newFlags = { ...state.flags };
        if (newInventory.includes('K02')) newFlags.hasRedBook = true;
        if (newInventory.includes('K03')) newFlags.hasCryptoKey = true;
        
        // 5. 解锁档案
        let newArchives = [...state.unlockedArchives];
        if (archiveId && !newArchives.includes(archiveId)) {
          newArchives.push(archiveId);
        }
        
        // 6. 检查特定死亡原因 (如 EVT_SPECIAL_GUN 触发 COP 结局)
        if (effects.deathReason) {
          const endingId = resolveEnding({ ...state, hp: newHp }, effects.deathReason);
          if (endingId) {
            set({ ending: endingId });
            return;
          }
        }
        
        // 7. 更新状态
        set({
          hp: newHp,
          san: newSan,
          gold: newGold,
          inventory: newInventory,
          points: newPoints,
          flags: newFlags,
          unlockedArchives: newArchives,
          currentEvent: null,
          history: [
            ...state.history,
            `Chose option ${optionId}: ${option.label}`
          ],
        });
        
        // 8. 检查结局
        const endingId = resolveEnding({ ...state, hp: newHp, san: newSan, gold: newGold });
        if (endingId) {
          set({ ending: endingId });
        }
      },

      /**
       * 购买物品
       * 接入 v12.0 特殊物品逻辑 (卖血/彩票/试药)
       */
      buyItem: (itemId) => {
        const state = get();
        if (!gameDataCache) return;
        
        const item = gameDataCache.itemMap.get(itemId);
        if (!item) return;
        
        // 检查购买条件
        if (state.gold < item.price) return;
        if (item.unlockCondition && item.unlockCondition.includes('gold <') && state.gold >= 0) return;
        
        // 1. 处理特殊收益 (卖血 / 彩票 / 债务清零)
        const { goldChange, activeBill } = processSpecialItemEffects(item, state.gold);
        
        // 2. 计算新属性
        const newGold = state.gold - item.price + goldChange;
        
        // 3. 计算 MaxHP 变化 (如试药/卖肾扣除上限)
        // 确保 MaxHP 至少为 10
        const newMaxHp = Math.max(10, state.maxHp + (item.effects.maxHp || 0));
        
        // 4. 计算 HP (不能超过新上限)
        const newHp = clamp(
          state.hp + item.effects.hp,
          0,
          newMaxHp
        );
        
        const newSan = clamp(state.san + item.effects.san, 0, 100);
        
        // 5. 添加库存 (如果是消耗品逻辑，可在此调整，目前逻辑是所有物品都进库存)
        const newInventory = [...state.inventory, itemId];
        
        // 6. 更新 Flags
        const newFlags = { ...state.flags };
        if (itemId === 'K02') newFlags.hasRedBook = true;
        if (itemId === 'K03') newFlags.hasCryptoKey = true;
        
        // 7. 更新状态
        set({
          gold: newGold,
          hp: newHp,
          maxHp: newMaxHp,
          san: newSan,
          inventory: newInventory,
          flags: newFlags,
          // 如果触发了彩票中奖，显示弹窗
          activeBill: activeBill || state.activeBill,
          history: [
            ...state.history,
            `Bought ${item.name}`
          ],
        });
      },

      setHydrated: () => set({ _hasHydrated: true }),
      
      resetGame: () => {
        localStorage.removeItem('american-insight-storage');
        set({ ...INITIAL_STATE, _hasHydrated: true });
        window.location.reload(); 
      }
    }),
    {
      name: 'american-insight-storage', 
      version: STORE_VERSION,           
      storage: createJSONStorage(() => localStorage), 
      
      migrate: (persistedState: any, version) => {
        if (version !== STORE_VERSION) {
          console.warn(`[Store] Version mismatch (${version} vs ${STORE_VERSION}). Resetting state.`);
          return INITIAL_STATE as any;
        }
        return persistedState as GameStore;
      },

      onRehydrateStorage: () => (state) => {
        console.log('Storage Hydrated!');
        state?.setHydrated();
      }
    }
  )
);