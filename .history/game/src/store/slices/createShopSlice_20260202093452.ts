import { StateCreator } from 'zustand';
import { Item, RegionID, LedgerCategory, ItemType } from '@/types/schema';

// 假设这些类型在主 Store 里合并了
export interface ShopSlice {
  // Selectors
  getRegionItems: (region: RegionID) => Item[];
  
  // Actions
  buyItem: (itemId: string) => void;
  useItem: (itemId: string) => void; // ✅ 新增：统一的使用入口
}

export const createShopSlice: StateCreator<any, [], [], ShopSlice> = (set, get) => ({

  getRegionItems: (region) => {
    const allItems: Item[] = get().gameDataCache?.items || [];
    return allItems.filter(item => {
      // 1. 如果 regions 字段不存在，默认为通用商品
      if (!item.regions) return true;
      // 2. 如果 regions 为空数组，说明是非卖品 (只能通过事件获得)
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

    // 1. 检查资金
    if (state.vitality.metrics.gold < item.price) {
      if (state.playSfx) state.playSfx('sfx_deny');
      state.addNotification("资金不足", "error");
      return;
    }

    // 2. 执行交易 (核心：走账本)
    // 根据物品类型判断分类，这里简化为 INCOME (负数) 或 FOOD/MISC
    let category: LedgerCategory = 'MISC';
    if (item.tags.includes('FOOD')) category = 'FOOD';
    if (item.tags.includes('MEDICAL')) category = 'MEDICAL';

    // 如果价格 < 0 (卖血/试药)，其实是赚钱
    const transactionType = item.price >= 0 ? category : 'INCOME';
    
    // 调用 Vitality Slice 的核心记账
    state.addTransaction(transactionType, -item.price, `购买: ${item.name}`);

    // 3. 进货 (添加到 Inventory)
    // 注意：某些特殊服务(如治疗)可能不需要进背包，这里假设所有 Shop 物品都先通过 Item 形式存在
    // 如果是服务，可以在 ItemSchema 里加个 flag isInstantUse
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
      // 1. 应用数值效果 (HP, SAN, MaxHP)
      if (item.effects) {
        state.modifyStats({
            hp: item.effects.hp,
            san: item.effects.san,
            maxHp: item.effects.maxHp
        });

        // 2. 应用政治倾向 (如果有)
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
      }

      // 3. 处理复杂 ActiveEffect (如彩票) - 可以解耦到独立的 Resolver，这里简单演示
      if (item.activeEffect) {
         if (item.activeEffect.type === 'LOTTERY') {
             // 抽奖逻辑...
             const win = Math.random() < item.activeEffect.params.winRate;
             if (win) {
                 state.addTransaction('INCOME', item.activeEffect.params.winPrize, '彩票中奖');
                 state.addNotification(item.activeEffect.params.winMessage, "GOLD");
             } else {
                 state.addNotification(item.activeEffect.params.loseMessage, "info");
             }
         }
      }

      // 4. 消耗掉 (从背包移除 1 个)
      const newInventory = [...state.inventory];
      const index = newInventory.indexOf(itemId);
      if (index > -1) {
        newInventory.splice(index, 1);
        set({ inventory: newInventory });
      }
      
      if (state.playSfx) state.playSfx('sfx_use_item');
      state.addNotification(`使用了 ${item.name}`, "success");
    }
  }
});