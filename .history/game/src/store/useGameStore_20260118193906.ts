import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState,
  PlayerClass,
  Item,
  Bill,
  GameEvent,
  GameNotification // 💡 [修复] 补全导入
} from '@/types/schema';

// 💡 [修复] 补全 calcPressure 导入
import { 
  checkClassUpdate, 
  calcSalary, 
  triggerBill, 
  clamp,
  calcPressure 
} from '../logic/core';

import { resolveEnding } from '../logic/endings';

// 💡 [注意] 确保 src/utils/dataLoader.ts 文件已创建
import { 
  loadAllGameData, 
  createItemMap 
} from '../utils/dataLoader';

// --- 辅助接口定义 ---
interface ClassData {
  id: PlayerClass;
  baseSalary: number;
  monthlyCost: number;
  leverage: number;
  description: string;
}

// Store Actions 接口
interface GameActions {
  // 核心循环
  nextDay: () => void;
  chooseOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  buyItem: (itemId: string) => void;
  resolveBill: () => void;
  
  // UI Actions
  setShopOpen: (isOpen: boolean) => void;
  setInventoryOpen: (isOpen: boolean) => void;
  setArchiveOpen: (isOpen: boolean) => void;
  setMenuOpen: (isOpen: boolean) => void;
  setRoast: (content: string | null) => void;
  setViewingArchive: (archiveId: string | null) => void;
  
  // Notification Actions
  addNotification: (message: string, type?: GameNotification['type']) => void;
  removeNotification: (id: string) => void;

  // Data Helpers
  shopItems: () => Item[];
  
  // System
  setHydrated: () => void;
  resetGame: () => void;
  initializeData: () => Promise<void>;
}

type GameStore = GameState & GameActions;

// --- 初始状态 ---
const INITIAL_STATE: Omit<GameState, '_hasHydrated'> = {
  day: 1,
  hp: 100,
  maxHp: 100,
  san: 50,
  gold: 100,
  currentClass: PlayerClass.Worker,
  
  currentEvent: null,
  activeBill: null,
  ending: null,
  dailySummary: null,
  
  inventory: [],
  history: [],
  unlockedArchives: [],
  
  flags: { isHomeless: false, debtDays: 0, hasRedBook: false, hasCryptoKey: false },
  points: { red: 0, wolf: 0, old: 0 },

  // UI State
  isShopOpen: false,
  isInventoryOpen: false,
  isArchiveOpen: false,
  isMenuOpen: false,
  currentRoast: null,
  notifications: [],
  viewingArchive: null
};

// --- 全局缓存 ---
let classDataMap: Map<PlayerClass, ClassData> | null = null;
let gameDataCache: any = null;

// --- Store 实现 ---

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      _hasHydrated: false,

      // ==============================
      // UI & System Actions
      // ==============================

      setShopOpen: (isOpen) => set({ isShopOpen: isOpen }),
      setInventoryOpen: (isOpen) => set({ isInventoryOpen: isOpen }),
      setArchiveOpen: (isOpen) => set({ 
        isArchiveOpen: isOpen,
        // 如果是关闭，顺便清空 viewingArchive
        viewingArchive: isOpen ? get().viewingArchive : null 
      }),
      setMenuOpen: (isOpen) => set({ isMenuOpen: isOpen }),
      setRoast: (content) => set({ currentRoast: content }),
      setViewingArchive: (archiveId) => set({ viewingArchive: archiveId }),

      addNotification: (message, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
          notifications: [...state.notifications, { id, message, type }]
        }));
        setTimeout(() => {
          get().removeNotification(id);
        }, 3000);
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      resolveBill: () => {
        set({ activeBill: null });
      },

      setHydrated: () => set({ _hasHydrated: true }),
      
      resetGame: () => {
        localStorage.removeItem('american-insight-storage');
        window.location.reload();
      },

      // ==============================
      // Data Initialization
      // ==============================

      initializeData: async () => {
        if (gameDataCache) return;
        try {
          // 加载基础数据
          const data = await loadAllGameData();
          gameDataCache = {
            ...data,
            itemMap: createItemMap(data.items),
          };
          
          // 手动加载 class data
          const classResp = await fetch('/src/assets/data/classes.json');
          const classJson = await classResp.json();
          classDataMap = new Map(classJson.map((c: any) => [c.id, c]));
          
          console.log('[Store] Data initialized (v12.0)');
        } catch (error) {
          console.error('[Store] Failed to load data:', error);
          get().addNotification('数据加载失败，请刷新重试', 'error');
        }
      },

      shopItems: () => {
        if (!gameDataCache) return [];
        const { gold } = get();
        return gameDataCache.items.filter((item: Item) => {
          if (item.price < 0) {
             // 负价物品逻辑：只在负债时显示 Gold < 0 的物品
             if (item.unlockCondition === "Gold < 0" && gold >= 0) return false;
             return true;
          }
          return true; 
        });
      },

      // ==============================
      // Core Game Logic (v12.0)
      // ==============================

      nextDay: () => {
        const state = get();
        if (!gameDataCache || !classDataMap) return;
        
        // 0. 胜利判定
        if (state.day >= 40 && state.hp > 0) {
            set({ ending: 'ED-06' }); 
            return;
        }

        const currentClassData = classDataMap.get(state.currentClass);
        if (!currentClassData) return;

        let newHp = state.hp;
        let newGold = state.gold;
        const log: string[] = [];
        const notes: string[] = [];

        // 1. 扣除固定开销
        if (currentClassData.monthlyCost > 0) {
            newGold -= currentClassData.monthlyCost;
            log.push(`月常: -$${currentClassData.monthlyCost}`);
        }
        
        // 2. 阶级被动 Debuff
        if (state.currentClass === PlayerClass.Homeless) {
           newHp -= 10;
           log.push(`严寒: HP-10`);
        }

        // 3. 计算薪资
        const salary = calcSalary(currentClassData.baseSalary, state.san);
        newGold += salary;

        // 4. 触发账单
        const bill = triggerBill(newGold, state.currentClass, gameDataCache.bills);
        let billAmount = 0;
        if (bill) {
            billAmount = bill.amount;
            newGold += billAmount;
            notes.push(bill.flavorText);
        }

        // 5. 债务代偿
        if (newGold < 0) {
            const debt = Math.abs(newGold);
            const debtDmg = Math.floor(debt / 10); 
            if (debtDmg > 0) {
                newHp -= debtDmg;
                log.push(`债务惩罚: HP-${debtDmg}`);
                notes.push(`债务转化为肉体伤害 (-${debtDmg} HP)`);
            }
        }

        // 6. 更新阶级
        const newClass = checkClassUpdate(newGold);
        if (newClass !== state.currentClass) {
            log.push(`阶级变更: ${newClass}`);
        }

        // 7. 死亡检查
        if (newHp <= 0) {
            set({ ending: 'ED-01' });
            return;
        }

        // 8. 随机事件
        const availableEvents = gameDataCache.events.filter((event: GameEvent) => {
          const { conditions } = event;
          if (conditions.minSan !== undefined && state.san < conditions.minSan) return false;
          if (conditions.maxSan !== undefined && state.san > conditions.maxSan) return false;
          if (conditions.requiredClass && !conditions.requiredClass.includes(newClass)) return false;
          if (conditions.hasItem && !state.inventory.includes(conditions.hasItem)) return false;
          return true;
        });

        const randomEvent = availableEvents.length > 0 
            ? availableEvents[Math.floor(Math.random() * availableEvents.length)] 
            : null;

        // 9. 更新状态
        set({
            day: state.day + 1,
            gold: newGold,
            hp: clamp(newHp, 0, state.maxHp),
            currentClass: newClass,
            activeBill: bill,
            currentEvent: randomEvent,
            dailySummary: {
                revenue: salary,
                expenses: currentClassData.monthlyCost + Math.abs(billAmount),
                notes: notes
            },
            history: [...state.history, `Month ${state.day + 1}: ${log.join(', ')}`]
        });
      },

      chooseOption: (optionId) => {
        const state = get();
        if (!state.currentEvent || !classDataMap) return;
        
        const currentClassData = classDataMap.get(state.currentClass);
        if (!currentClassData) return;

        // ABCD Matrix
        const S = currentClassData.baseSalary;
        const M = currentClassData.leverage;
        const P = calcPressure(state.san); // 💡 [修复] 使用新导入的函数
        
        let deltaGold = 0;
        let deltaHp = 0;
        let deltaSan = 0;

        switch (optionId) {
            case 'A': // 公知 (卖命)
                deltaGold = 300 * M;
                deltaHp = -3 * P;
                deltaSan = -4;
                break;
            case 'B': // 羊群 (苟活)
                deltaGold = 50;
                deltaHp = 2;
                deltaSan = -2;
                break;
            case 'C': // 理中客 (买命)
                let costMultiplierC = state.currentClass === PlayerClass.Middle ? 2 : 1;
                deltaGold = -(0.2 * S) * costMultiplierC;
                deltaHp = 8;
                deltaSan = 2;
                break;
            case 'D': // 觉醒 (燃烧)
                let sanMultiplierD = state.currentClass === PlayerClass.Capitalist ? 2 : 1;
                deltaGold = -(0.4 * S);
                deltaHp = -8 * P;
                deltaSan = 10 * sanMultiplierD;
                break;
        }

        const optionConfig = state.currentEvent.options[optionId];
        let newInventory = [...state.inventory];
        let newArchives = [...state.unlockedArchives];
        const newFlags = { ...state.flags };

        if (optionConfig) {
            // 获得物品
            if (optionConfig.effects.items) {
                optionConfig.effects.items.forEach(({ itemId, count }) => {
                    if (count > 0) {
                         if (!newInventory.includes(itemId)) newInventory.push(itemId);
                    } else {
                         const idx = newInventory.indexOf(itemId);
                         if (idx > -1) newInventory.splice(idx, 1);
                    }
                });
            }
            // 解锁档案
            if (optionConfig.archiveId && !newArchives.includes(optionConfig.archiveId)) {
                newArchives.push(optionConfig.archiveId);
                get().addNotification(`解锁档案: ${optionConfig.archiveId}`, 'success');
                set({ viewingArchive: optionConfig.archiveId });
            }
            // 死亡原因
            if (optionConfig.effects.deathReason) {
                const deathEnding = resolveEnding({ ...state, hp: state.hp + deltaHp }, optionConfig.effects.deathReason);
                if (deathEnding) {
                    set({ ending: deathEnding });
                    return;
                }
            }
        }

        const finalHp = clamp(state.hp + Math.floor(deltaHp), 0, state.maxHp);
        const finalSan = clamp(state.san + deltaSan, 0, 100);
        const finalGold = state.gold + Math.floor(deltaGold);

        if (finalHp <= 0) {
            set({ ending: 'ED-05' }); 
            return;
        }
        
        const endingId = resolveEnding({ ...state, hp: finalHp, san: finalSan, gold: finalGold });
        if (endingId) { set({ ending: endingId }); return; }

        set({
            hp: finalHp,
            san: finalSan,
            gold: finalGold,
            inventory: newInventory,
            unlockedArchives: newArchives,
            flags: newFlags,
            currentEvent: null,
            history: [...state.history, `Option ${optionId}: HP${deltaHp.toFixed(1)} SAN${deltaSan} $${deltaGold}`]
        });
      },

      buyItem: (itemId) => {
        const state = get();
        if (!gameDataCache) return;
        
        const item = gameDataCache.itemMap.get(itemId);
        if (!item) return;

        let newGold = state.gold;
        let newHp = state.hp;
        let newMaxHp = state.maxHp;
        let newSan = state.san;
        let newInventory = [...state.inventory];
        let newFlags = { ...state.flags };

        // 特殊物品逻辑
        if (itemId === 'D05') {
            if (newGold < 0) newGold = 0; 
            newMaxHp -= 30;
            newHp -= 30;
            get().addNotification('手术成功...如果你能叫这成功的话', 'warning');
        } else if (itemId === 'D01') {
            newGold += 40; 
            newHp -= 15;
            get().addNotification('献血换来了$40和一阵眩晕', 'warning');
        } else if (itemId === 'I13') {
            newGold -= item.price;
            newSan += 1;
            if (Math.random() < 0.01) {
                newGold += 5000;
                get().addNotification('中奖了！不可思议！+$5000', 'success');
            } else {
                get().addNotification('谢谢惠顾', 'info');
            }
        } else {
            if (newGold < item.price) {
                get().addNotification('资金不足', 'error');
                return;
            }
            newGold -= item.price;
            newHp += item.effects.hp || 0;
            newSan += item.effects.san || 0;
            newMaxHp += item.effects.maxHp || 0;
            
            if (!newInventory.includes(itemId)) {
                newInventory.push(itemId);
            }
            get().addNotification(`购买了 ${item.name}`, 'success');
        }

        if (newHp <= 0) {
             set({ ending: 'ED-02' });
             return;
        }

        set({
            gold: newGold,
            hp: clamp(newHp, 0, newMaxHp),
            maxHp: newMaxHp,
            san: clamp(newSan, 0, 100),
            inventory: newInventory,
            flags: newFlags
        });
      }
    }),
    {
      name: 'american-insight-storage',
      version: 12.3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version !== 12.3) return INITIAL_STATE as any;
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);