import { StateCreator } from 'zustand';
import { Item, RegionID, LedgerCategory, ItemType } from '@/types/schema';
import { StoreState } from '@/types/store';
// ✅ 1. 引入配置文件 (请确保路径正确)
import shopRules from '@/assets/data/rules/shopRules.json';
import { getVehicleSellPrice } from '@/components/game/vehicle/config/vehicleShopConfig'; // [NEW]

// ✅ 辅助函数：消耗物品并播放音效（提取重复代码）
const consumeItemAndFinish = (itemId: string, state: any, set: Function) => {
  const newInventory = [...state.inventory];
  const index = newInventory.indexOf(itemId);
  if (index > -1) {
    newInventory.splice(index, 1);
    set({ inventory: newInventory });
  }
  if (state.playSfx) state.playSfx(shopRules.audio.useItem);
};

export interface ShopSlice {
  // Selectors
  getRegionItems: (region: RegionID) => Item[];
  
  // Actions
  buyItem: (itemId: string) => void;
  useItem: (itemId: string) => void;
  sellVehicle: (region: RegionID) => { success: boolean; message: string; price?: number };
}

export const createShopSlice: StateCreator<StoreState, [], [], ShopSlice> = (set, get) => ({

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
    if (!state.gameDataCache) {
      state.addNotification("游戏数据未加载", "error");
      return;
    }
    const item = state.gameDataCache.items.find((i: Item) => i.id === itemId);
    
    if (!item) {
      state.addNotification("商品不存在", "error");
      return;
    }

    // ✅ 重构 2: 从配置读取背包容量限制 & 错误信息
    const maxInventorySize = shopRules.inventory.maxSize;
    if (state.inventory.length >= maxInventorySize) {
      // playSfx 不在 StoreState 中，暂时注释掉
      // if (state.playSfx) state.playSfx(shopRules.audio.buyFail);
      
      const msg = shopRules.inventory.fullMessage
        .replace('{current}', String(state.inventory.length))
        .replace('{max}', String(maxInventorySize));
        
      state.addNotification(msg, "error");
      return;
    }

    // 1. 检查资金
    if (state.vitality.metrics.gold < item.price) {
      // if (state.playSfx) state.playSfx(shopRules.audio.buyFail);
      state.addNotification("资金不足", "error");
      return;
    }

    // 2. 检查车辆唯一性（已拥有的车辆不能重复购买）
    const isVehicle = item.tags?.some((tag: string) => tag.startsWith('VEHICLE'));
    if (isVehicle && state.inventory.includes(item.id)) {
      state.addNotification("你已经拥有这辆车了", "warning");
      return;
    }

    // 3. 执行交易 (核心：走账本)
    // ✅ 重构 3: 动态账本分类映射 (代替硬编码的 if-else)
    let category: LedgerCategory = 'MISC';
    // 遍历配置规则，找到第一个匹配 Item Tag 的分类
    const mapping = shopRules.ledgerMapping.find((rule) => item.tags?.includes(rule.tag));
    if (mapping) {
      category = mapping.category as LedgerCategory;
    }

    const transactionType = item.price >= 0 ? category : 'INCOME';
    
    // 调用 Vitality Slice 的核心记账 (自动扣减余额 + 记录账本)
    const txResult = state.addTransaction(transactionType, -item.price, `购买: ${item.name}`);
    if (!txResult.success) {
      // if (state.playSfx) state.playSfx(shopRules.audio.buyFail);
      state.addNotification("交易失败，资金不足", "error");
      return;
    }

    // 3. 进货（每个物品独立占格，不堆叠）
    set((s: any) => ({
      inventory: [...s.inventory, item.id]
    }));

    // ✅ 重构 4: 音效读取配置
    // if (state.playSfx) state.playSfx(shopRules.audio.buySuccess);
    state.addNotification(`获得: ${item.name}`, "success");
  },

  sellVehicle: (region) => {
    const state = get();
    if (!state.gameDataCache) {
      return { success: false, message: "游戏数据未加载" };
    }

    // 查找当前拥有的车辆
    const vehicleId = state.inventory.find(id => id.startsWith('VEH_'));
    if (!vehicleId) {
      return { success: false, message: "没有车辆可出售" };
    }

    const vehicle = state.gameDataCache.items.find((i: Item) => i.id === vehicleId);
    if (!vehicle) {
      return { success: false, message: "车辆数据异常" };
    }

    // ✅ 使用配置化的售价计算（从vehicles.json读取）
    const sellPrice = getVehicleSellPrice(vehicleId, region);

    // 移除车辆
    const newInventory = state.inventory.filter(id => id !== vehicleId);
    set({ inventory: newInventory });

    // 添加收入
    state.addTransaction('INCOME', sellPrice, `出售车辆: ${vehicle.name}`);
    state.addNotification(`出售车辆获得 $${sellPrice}`, "GOLD");

    return { success: true, message: `车辆已出售`, price: sellPrice };
  },

  useItem: (itemId) => {
    const state = get();
    if (!state.gameDataCache) {
      state.addNotification("游戏数据未加载", "error");
      return;
    }
    const item = state.gameDataCache.items.find((i: Item) => i.id === itemId);
    
    if (!item) {
      state.addNotification("物品数据异常", "error");
      return;
    }

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
      // 防御性检查：确保 drugResistance 配置存在且启用
      if (item.tags?.includes('DRUG') && finalHpGain > 0 && shopRules.drugResistance?.enable) {
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
      if (item.effects?.points) {
         set((s: any) => ({
           vitality: {
             ...s.vitality,
             identity: {
               ...s.vitality.identity,
               points: {
                 red: s.vitality.identity.points.red + (item.effects!.points!.red || 0),
                 wolf: s.vitality.identity.points.wolf + (item.effects!.points!.wolf || 0),
                 old: s.vitality.identity.points.old + (item.effects!.points!.old || 0),
               }
             }
           }
         }));
         state.addNotification("你的立场发生了偏移...", "info");
      }

      // 3. 处理复杂 ActiveEffect (彩票、卖器官、试药等)
      // ⚠️ 注意：如果有 activeEffect，它接管全部逻辑，不再执行后续消耗品效果
      if (item.activeEffect) {
         if (item.activeEffect.type === 'LOTTERY') {
             const win = Math.random() < item.activeEffect.params.winRate;
             if (win) {
                 state.addTransaction('INCOME', item.activeEffect.params.winPrize, '彩票中奖');
                 state.addNotification(item.activeEffect.params.winMessage, "GOLD");
             } else {
                 state.addNotification(item.activeEffect.params.loseMessage, "info");
             }
         } else if (item.activeEffect.type === 'BLOOD_DONATION') {
             // 卖血浆：扣血 + 给钱 + 记账（不执行普通消耗品效果）
             const { gold, hpCost, message } = item.activeEffect.params;
             state.modifyStats({ hp: -hpCost });
             state.addTransaction('INCOME', gold, `出售血浆`);
             state.addNotification(message, "GOLD");
             consumeItemAndFinish(itemId, state, set);
             return;
             
         } else if (item.activeEffect.type === 'SURGERY') {
             // 卖器官：扣血 + 清债 + 记账（不执行普通消耗品效果）
             const { damage, message } = item.activeEffect.params;
             state.modifyStats({ hp: -damage });
             // 清空负债（如果有）
             const currentGold = state.vitality.metrics.gold;
             if (currentGold < 0) {
                 state.addTransaction('INCOME', Math.abs(currentGold), `出售器官清偿债务`);
             }
             state.addNotification(message, "warning");
             consumeItemAndFinish(itemId, state, set);
             return;
         }
      }

      // 4. 普通消耗品：消耗掉
      consumeItemAndFinish(itemId, state, set);
      state.addNotification(notificationMsg, "success");
    } else {
      // 非消耗品且无特殊处理逻辑的物品
      state.addNotification("此物品无法直接使用", "warning");
    }
  }
});