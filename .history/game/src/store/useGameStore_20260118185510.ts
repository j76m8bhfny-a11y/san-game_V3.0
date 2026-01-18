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
  calcPressure 
} from '@/logic/core';
import { resolveEnding } from '@/logic/endings';
import { loadAllGameData, createItemMap, createEventMap, createBillMap, createArchiveMap, createEndingMap } from '@/utils/dataLoader';

// 定义扩展的 Class 数据接口 (为了 TS 类型安全)
interface ClassData {
  id: PlayerClass;
  baseSalary: number;
  monthlyCost: number;
  leverage: number;
  description: string;
}

interface GameActions {
  nextDay: () => void; // 实际上现在是 nextMonth
  chooseOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  buyItem: (itemId: string) => void;
  shopItems: () => Item[];
  setHydrated: () => void;
  resetGame: () => void;
  initializeData: () => Promise<void>;
}

type GameStore = GameState & GameActions;

const INITIAL_STATE: Omit<GameState, '_hasHydrated'> = {
  day: 1, // 现在代表 Month
  hp: 100,
  maxHp: 100,
  san: 50,
  gold: 100,
  currentClass: PlayerClass.Worker,
  currentEvent: null,
  activeBill: null,
  ending: null,
  inventory: [],
  history: [],
  unlockedArchives: [],
  flags: { isHomeless: false, debtDays: 0, hasRedBook: false, hasCryptoKey: false },
  points: { red: 0, wolf: 0, old: 0 }
};

// 缓存 Class 数据以便查询
let classDataMap: Map<PlayerClass, ClassData> | null = null;
let gameDataCache: any = null;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      _hasHydrated: false,
      dailySummary: null,

      initializeData: async () => {
        if (gameDataCache) return;
        try {
          const data = await loadAllGameData();
          gameDataCache = {
            ...data,
            itemMap: createItemMap(data.items),
            // ...其他 Map
          };
          
          // 手动加载 class data (因为 classes.json 结构变了，这里简单处理)
          const classResp = await fetch('/src/assets/data/classes.json');
          const classJson = await classResp.json();
          classDataMap = new Map(classJson.map((c: any) => [c.id, c]));
          
        } catch (error) {
          console.error('[Store] Failed to load:', error);
        }
      },

      shopItems: () => {
        if (!gameDataCache) return [];
        const { gold, currentClass } = get();
        return gameDataCache.items.filter((item: Item) => {
          // 处理特殊的 "卖" 物品（负价格）：只有符合条件才显示
          if (item.price < 0) {
            if (item.unlockCondition === "Gold < 0" && gold >= 0) return false;
            return true; 
          }
          // 常规物品
          if (gold < item.price) return false;
          return true;
        });
      },

      nextDay: () => {
        const state = get();
        if (!gameDataCache || !classDataMap) return;

        // 0. 胜利判定 (40个月)
        if (state.day >= 40 && state.hp > 0) {
           // 这里的 Ending 需要在 resolveEnding 里增加 ED-20 或胜利结局的判定
           const winEnding = resolveEnding(state);
           if (winEnding) { set({ ending: winEnding }); return; }
        }

        // 1. 获取当前阶级数据
        const currentClassData = classDataMap.get(state.currentClass);
        if (!currentClassData) return;

        let newHp = state.hp;
        let newGold = state.gold;
        const log: string[] = [];

        // 2. 扣除月度固定开销 (Fixed Cost)
        newGold -= currentClassData.monthlyCost;
        log.push(`Month Cost: -$${currentClassData.monthlyCost}`);

        // 3. 阶级被动 Debuff
        // 流浪汉：严寒 (-10 HP)
        if (state.currentClass === PlayerClass.Homeless) {
           newHp -= 10;
           log.push(`Homeless Cold: HP -10`);
        }
        
        // 4. 计算薪资 (Salary)
        const salary = calcSalary(currentClassData.baseSalary, state.san);
        newGold += salary;
        
        // 5. 账单与收割 (The Reaper - Debt logic)
        const bill = triggerBill(newGold, state.currentClass, gameDataCache.bills);
        let billAmount = 0;
        
        if (bill) {
            billAmount = bill.amount;
            // 债务代偿机制：如果扣款导致(或已经是)负债，且无法支付
            // 逻辑：直接扣钱。如果钱变成负数，在下一步处理？
            // v12.0 逻辑: "如果事件扣 Gold 导致钱不够，每欠 $10 强制扣 1 HP"
            // 这里我们简化：先扣钱。
            newGold += billAmount; // billAmount 是负数
        }

        // 6. 债务代偿结算 (Check Debt for HP)
        // 只有当因本回合操作导致处于负债状态时触发打击？或者一直触发？
        // 按照文档 "收割类" 描述，这主要针对突发事件。
        // 但为了生存压力，我们设定：如果月底结算时 Gold < 0，则转化部分债务为 HP 伤害
        // 注意：这可能会导致立刻死亡
        if (newGold < 0) {
            const debt = Math.abs(newGold);
            // 限制一下最大扣血，防止一波暴毙？不，文档说是“强制扣”
            const debtDmg = Math.floor(debt / 10); 
            if (debtDmg > 0) {
                newHp -= debtDmg;
                log.push(`Debt Penalty: HP -${debtDmg} (owing $${debt})`);
            }
        }

        // 7. 更新阶级 (基于结算后的 Gold)
        const newClass = checkClassUpdate(newGold);

        // 8. 死亡/结局检查
        if (newHp <= 0) {
            set({ ending: 'ED-01' }); // 默认为冷冻披萨/死亡
            return;
        }

        // 9. 更新状态 & 随机事件
        const availableEvents = gameDataCache.events.filter((e: GameEvent) => {
             // ...保留原有的筛选逻辑
             return true; 
        });
        const randomEvent = availableEvents.length > 0 
            ? availableEvents[Math.floor(Math.random() * availableEvents.length)] 
            : null;

        set({
            day: state.day + 1,
            gold: newGold,
            hp: clamp(newHp, 0, state.maxHp),
            currentClass: newClass,
            activeBill: bill,
            currentEvent: randomEvent,
            history: [...state.history, `Month ${state.day + 1}: ${log.join(', ')}`]
        });
      },

      chooseOption: (optionId) => {
        const state = get();
        if (!state.currentEvent || !classDataMap) return;
        
        const currentClassData = classDataMap.get(state.currentClass);
        if (!currentClassData) return;

        // --- v12.0 ABCD Matrix 核心计算 ---
        const S = currentClassData.baseSalary; // 基准月薪
        const M = currentClassData.leverage;   // 阶级杠杆
        const P = calcPressure(state.san);     // 动态压力系数
        
        let deltaGold = 0;
        let deltaHp = 0;
        let deltaSan = 0;

        // 根据选项类型应用公式
        switch (optionId) {
            case 'A': // 公知 (卖命)
                // Gold: +300 * M
                // HP: -3 * P
                // SAN: -4
                deltaGold = 300 * M;
                deltaHp = -3 * P;
                deltaSan = -4;
                
                // 流浪汉特例修正 (文档: +30) -> 300 * 0.1 = 30 (符合公式)
                break;

            case 'B': // 羊群 (苟活)
                // Gold: +50
                // HP: +2
                // SAN: -2
                deltaGold = 50;
                deltaHp = 2;
                deltaSan = -2;
                break;

            case 'C': // 理中客 (买命)
                // Gold: -20% * S
                // HP: +8
                // SAN: +2
                // 中产 Debuff: C 选项价格翻倍
                let costMultiplierC = state.currentClass === PlayerClass.Middle ? 2 : 1;
                deltaGold = -(0.2 * S) * costMultiplierC;
                deltaHp = 8;
                deltaSan = 2;
                break;

            case 'D': // 觉醒 (燃烧)
                // Gold: -40% * S
                // HP: -8 * P
                // SAN: +10
                // 资本家 Debuff: D 选项 SAN 加倍
                let sanMultiplierD = state.currentClass === PlayerClass.Capitalist ? 2 : 1;
                deltaGold = -(0.4 * S);
                deltaHp = -8 * P;
                deltaSan = 10 * sanMultiplierD;
                break;
        }

        // 应用数值
        const newHp = clamp(state.hp + Math.floor(deltaHp), 0, state.maxHp);
        const newSan = clamp(state.san + deltaSan, 0, 100);
        const newGold = state.gold + Math.floor(deltaGold);

        // 检查死亡 (HP <= 0)
        if (newHp <= 0) {
            set({ ending: 'ED-05' }); // 假定为过劳死/系统崩溃
            return;
        }
        
        // 检查结局 (高SAN / 低SAN)
        const endingId = resolveEnding({ ...state, hp: newHp, san: newSan, gold: newGold });
        if (endingId) { set({ ending: endingId }); return; }

        set({
            hp: newHp,
            san: newSan,
            gold: newGold,
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
        let newInventory = [...state.inventory, itemId];

        // --- 特殊物品逻辑 ---
        
        // D05: 卖肾 (清空负债)
        if (itemId === 'D05') {
            if (newGold < 0) newGold = 0; // 债清
            newMaxHp -= 30;
            newHp -= 30; // 同时也扣当前血量
        } 
        // D01: 卖血 (加钱扣血)
        else if (itemId === 'D01') {
            newGold += 40; // 文档说是 +40，JSON里配的是 price:-40，为了统一逻辑，这里手动处理
            newHp -= 15;
        }
        // I13: 彩票 (1% 几率得 $5000)
        else if (itemId === 'I13') {
            newGold -= item.price;
            newSan += 1;
            if (Math.random() < 0.01) {
                newGold += 5000; // 中奖
                // 可以加个 Feedback 弹窗
            }
        }
        // 常规购买
        else {
            if (newGold < item.price) return; // 买不起
            newGold -= item.price;
            newHp += item.effects.hp || 0;
            newSan += item.effects.san || 0;
            newMaxHp += item.effects.maxHp || 0;
        }

        // 结算
        set({
            gold: newGold,
            hp: clamp(newHp, 0, newMaxHp),
            maxHp: newMaxHp,
            san: clamp(newSan, 0, 100),
            inventory: newInventory
        });
      }
    }),
    {
      name: 'american-insight-storage',
      version: 12, // Bump version to force reset
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        if (version !== 12) return INITIAL_STATE as any;
        return persistedState;
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);