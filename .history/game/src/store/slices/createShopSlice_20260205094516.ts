import { StateCreator } from 'zustand';
import { Item, RegionID, LedgerCategory, ItemType } from '@/types/schema';
// ✅ 1. 引入配置文件 (请确保路径正确)
import shopRules from '@/assets/data/rules/shopRules.json';

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

    // ✅ 重构 2: 从配置读取背包容量限制 & 错误信息
    const maxInventorySize = shopRules.inventory.maxSize;
    if (state.inventory.length >= maxInventorySize) {
      if (state.playSfx) state.playSfx(shopRules.audio.buyFail);
      
      const msg = shopRules.inventory.fullMessage
        .replace('{current}', String(state.inventory.length))
        .replace('{max}', String(maxInventorySize));
        
      state.addNotification(msg, "error");
      return;
    }

    // 1. 检查资金
    if (state.vitality.metrics.gold < item.price) {
      if (state.playSfx) state.playSfx(shopRules.audio.buyFail);
      state.addNotification("资金不足", "error");
      return;
    }

    // 2. 执行交易 (核心：走账本)
    // ✅ 重构 3: 动态账本分类映射 (代替硬编码的 if-else)
    let category: LedgerCategory = 'MISC';
    // 遍历配置规则，找到第一个匹配 Item Tag 的分类
    const mapping = shopRules.ledgerMapping.find((rule) => item.tags.includes(rule.tag));
    if (mapping) {
      category = mapping.category as LedgerCategory;
    }

    const transactionType = item.price >= 0 ? category : 'INCOME';
    
    // 调用 Vitality Slice 的核心记账 (自动扣减余额 + 记录账本)
    state.addTransaction(transactionType, -item.price, `购买: ${item.name}`);

    // 3. 进货
    set((s: any) => ({
      inventory: [...s.inventory, item.id]
    }));

    // ✅ 重构 4: 音效读取配置
    if (state.playSfx) state.playSfx(shopRules.audio.buySuccess);
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

      // === 💊 耐药性计算逻辑 (重构) ===
      // ✅ 重构 5: 提取算法参数到 JSON，实现完全数据驱动
      if (item.tags.includes('DRUG') && finalHpGain > 0 && shopRules.drugResistance.enable) {
        const { divisor, minEffectiveness, thresholds, messages } = shopRules.drugResistance;
        const currentResistance = state.vitality.metrics.resistance || 0;
        
        // 核心衰减公式：Max(min, 1 - (R / divisor))
        const effectiveness = Math.max(minEffectiveness, 1 - (currentResistance / divisor));
        
        finalHpGain = Math.floor(finalHpGain * effectiveness);

        // 阈值提示
        if (effectiveness < thresholds.warning) notificationMsg += messages.warning;
        if (effectiveness < thresholds.critical) notificationMsg += messages.critical;
      }

      // 1. 应用数值效果
      // 补全 hunger 字段 (暂通过 any 绕过 schema 检查，需同步更新 VitalitySlice)
      state.modifyStats({
          hp: finalHpGain,
          san: effects.san,
          maxHp: effects.maxHp,
          hunger: (effects as any).hunger || 0, 
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

      // 3. 处理复杂 ActiveEffect (彩票逻辑等)
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
      
      // ✅ 重构 6: 音效读取配置
      if (state.playSfx) state.playSfx(shopRules.audio.useItem);
      state.addNotification(notificationMsg, "success");
    }
  }
});