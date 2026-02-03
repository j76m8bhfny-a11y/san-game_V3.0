import { StateCreator } from 'zustand';
import { Item, RegionID, LedgerCategory, ItemType } from '@/types/schema';

// 🎒 背包容量限制
const MAX_INVENTORY_SIZE = 12;

export interface ShopSlice {
  // Selectors
  getRegionItems: (region: RegionID) => Item[];
  
  // Actions
  buyItem: (itemId: string) => void;
  useItem: (itemId: string) => void;
}

export const createShopSlice: StateCreator<any, [], [], ShopSlice> = (set, get) => ({

  getRegionItems: (region) => {
    const allItems: Item[] = get().gameDataCache?.items || [];
    return allItems.filter(item => {
      // 1. 如果 regions 字段不存在，默认为通用商品
      if (!item.regions) return true;
      // 2. 如果 regions 为空数组，说明是非卖品
      if (item.regions.length === 0) return false;
      // 3. 检查当前区域是否在允许列表中
      return item.regions.includes(region);
    });
  },

  buyItem: (itemId) => {
    const state = get();
    const item = state.gameDataCache.items.find((i: Item) => i.id === itemId);
    
    if (!item) {
      state.addNotification("商品不存在", "error");
      return;
    }

    // ✅ 修复 3: 背包容量检查
    if (state.inventory.length >= MAX_INVENTORY_SIZE) {
      if (state.playSfx) state.playSfx('sfx_deny');
      state.addNotification(`背包已满 (${MAX_INVENTORY_SIZE}/${MAX_INVENTORY_SIZE})`, "error");
      return;
    }

    // 1. 检查资金
    if (state.vitality.metrics.gold < item.price) {
      if (state.playSfx) state.playSfx('sfx_deny');
      state.addNotification("资金不足", "error");
      return;
    }

    // 2. 执行交易 (核心：走账本)
    // ✅ 修复 2: 确认此处只调用 addTransaction，没有手动修改 gold，避免双重扣款
    let category: LedgerCategory = 'MISC';
    if (item.tags.includes('FOOD')) category = 'FOOD';
    if (item.tags.includes('MEDICAL')) category = 'MEDICAL';

    const transactionType = item.price >= 0 ? category : 'INCOME';
    
    // 调用 Vitality Slice 的核心记账 (自动扣减余额 + 记录账本)
    state.addTransaction(transactionType, -item.price, `购买: ${item.name}`);

    // 3. 进货
    set((s: any) => ({
      inventory: [...s.inventory, item.id]
    }));

    if (state.playSfx) state.playSfx('sfx_cash');
    state.addNotification(`获得: ${item.name}`, "success");
  },

  useItem: (itemId) => {
    const state = get();
    const item = state.gameDataCache.items.find((i: Item) => i.id === itemId);
    
    if (!item) return;

    // 🛡️ 类型防御
    if (item.type === ItemType.PASSIVE || item.type === ItemType.KEY || item.type === ItemType.ENDING) {
      state.addNotification("此物品无需主动使用，持有即生效。", "info");
      return;
    }

    // ✅ 处理消耗品逻辑
    if (item.type === ItemType.CONSUMABLE) {
      const effects = item.effects || {};
      let finalHpGain = effects.hp || 0;
      let notificationMsg = `使用了 ${item.name}`;

      // === 💊 耐药性计算逻辑 ===
      if (item.tags.includes('DRUG') && finalHpGain > 0) {
        const currentResistance = state.vitality.metrics.resistance || 0;
        const effectiveness = Math.max(0.1, 1 - (currentResistance / 100));
        
        finalHpGain = Math.floor(finalHpGain * effectiveness);

        if (effectiveness < 0.8) notificationMsg += ` (耐药性导致效果衰减)`;
        if (effectiveness < 0.3) notificationMsg += ` (几近失效)`;
      }

      // 1. 应用数值效果
      // ✅ 修复 1: 补全 hunger 字段 (暂通过 any 绕过 schema 检查，需同步更新 VitalitySlice)
      state.modifyStats({
          hp: finalHpGain,
          san: effects.san,
          maxHp: effects.maxHp,
          hunger: (effects as any).hunger || 0, // 新增饥饿恢复
          addiction: effects.addiction,
          resistance: effects.resistance
      });

      // 2. 应用政治倾向
      if (item.effects.points) {
         const currentPoints = state.vitality.identity.points;
         set((s: any) => ({
           vitality: {
             ...s.vitality,
             identity: {
               ...s.vitality.identity,
               points: {
                 red: currentPoints.red + (item.effects.points.red || 0),
                 wolf: currentPoints.wolf + (item.effects.points.wolf || 0),
                 old: currentPoints.old + (item.effects.points.old || 0),
               }
             }
           }
         }));
         state.addNotification("你的立场发生了偏移...", "info");
      }

      // 3. 处理复杂 ActiveEffect
      if (item.activeEffect) {
         if (item.activeEffect.type === 'LOTTERY') {
             const win = Math.random() < item.activeEffect.params.winRate;
             if (win) {
                 state.addTransaction('INCOME', item.activeEffect.params.winPrize, '彩票中奖');
                 state.addNotification(item.activeEffect.params.winMessage, "GOLD");
             } else {
                 state.addNotification(item.activeEffect.params.loseMessage, "info");
             }
         }
      }

      // 4. 消耗掉
      const newInventory = [...state.inventory];
      const index = newInventory.indexOf(itemId);
      if (index > -1) {
        newInventory.splice(index, 1);
        set({ inventory: newInventory });
      }
      
      if (state.playSfx) state.playSfx('sfx_use_item');
      state.addNotification(notificationMsg, "success");
    }
  }
});