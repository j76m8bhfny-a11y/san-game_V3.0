import { StateCreator } from 'zustand';
import { Item, RegionID, LedgerCategory, ItemType } from '@/types/schema';
import { StoreState } from '@/types/store';
import shopRules from '@/assets/data/rules/shopRules.json';
import foodRules from '@/assets/data/rules/foodRules.json';
import { getVehicleSellPrice } from '@/components/game/vehicle/config/vehicleShopConfig';

// 辅助函数：消耗物品并播放音效
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
  getRegionItems: (region: RegionID) => Item[];
  buyItem: (itemId: string) => void;
  useItem: (itemId: string) => void;
  sellVehicle: (region: RegionID) => { success: boolean; message: string; price?: number };
}

export const createShopSlice: StateCreator<StoreState, [], [], ShopSlice> = (set, get) => ({

  getRegionItems: (region) => {
    const allItems: Item[] = get().gameDataCache?.items || [];
    return allItems.filter(item => {
      if (!item.regions) return true;
      if (item.regions.length === 0) return false;
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

    const maxInventorySize = shopRules.inventory.maxSize;
    if (state.inventory.length >= maxInventorySize) {
      const msg = shopRules.inventory.fullMessage
        .replace('{current}', String(state.inventory.length))
        .replace('{max}', String(maxInventorySize));
      state.addNotification(msg, "error");
      return;
    }

    // 检查 SNAP 资格 (基于本周收入，而非当前余额)
    const snapConfig = foodRules.snapBenefits;
    const weeklyIncome = state.vitality.ledger.history
      .filter((r: any) => r.amount > 0 && r.category === 'INCOME')
      .reduce((sum: number, r: any) => sum + r.amount, 0);
    
    const isSnapEligible = snapConfig.enabled && 
      snapConfig.eligibleClasses.includes(state.vitality.identity.currentClass) &&
      weeklyIncome < snapConfig.weeklyIncomeThreshold;
    
    const isSnapRestricted = item.tags?.some((tag: string) => 
      snapConfig.restrictedTags.includes(tag)
    );

    if (isSnapEligible && isSnapRestricted) {
      state.addNotification("SNAP福利不能用于购买此类商品", "warning");
      return;
    }

    // 检查资金
    if (state.vitality.metrics.gold < item.price) {
      state.addNotification("资金不足", "error");
      return;
    }

    // 检查车辆唯一性
    const isVehicle = item.tags?.some((tag: string) => tag.startsWith('VEHICLE'));
    if (isVehicle && state.inventory.includes(item.id)) {
      state.addNotification("你已经拥有这辆车了", "warning");
      return;
    }

    // 执行交易
    let category: LedgerCategory = 'MISC';
    const mapping = shopRules.ledgerMapping.find((rule) => item.tags?.includes(rule.tag));
    if (mapping) {
      category = mapping.category as LedgerCategory;
    }

    const transactionType = item.price >= 0 ? category : 'INCOME';
    const txResult = state.addTransaction(transactionType, -item.price, `购买: ${item.name}`);
    if (!txResult.success) {
      state.addNotification("交易失败，资金不足", "error");
      return;
    }

    // 进货
    set((s: any) => ({
      inventory: [...s.inventory, item.id]
    }));

    state.addNotification(`获得: ${item.name}`, "success");
  },

  sellVehicle: (region) => {
    const state = get();
    if (!state.gameDataCache) {
      return { success: false, message: "游戏数据未加载" };
    }

    const vehicleId = state.inventory.find(id => id.startsWith('VEH_'));
    if (!vehicleId) {
      return { success: false, message: "没有车辆可出售" };
    }

    const vehicle = state.gameDataCache.items.find((i: Item) => i.id === vehicleId);
    if (!vehicle) {
      return { success: false, message: "车辆数据异常" };
    }

    const sellPrice = getVehicleSellPrice(vehicleId, region);
    const newInventory = state.inventory.filter(id => id !== vehicleId);
    set({ inventory: newInventory });

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

    if (item.type === ItemType.PASSIVE || item.type === ItemType.KEY || item.type === ItemType.ENDING) {
      state.addNotification("此物品无需主动使用，持有即生效。", "info");
      return;
    }

    if (item.type === ItemType.CONSUMABLE) {
      const effects = item.effects || {};
      let finalHpGain = effects.hp || 0;
      let notificationMsg = `使用了 ${item.name}`;
      let hungerRestore = effects.hunger || 0;

      // 耐药性计算（仅对 DRUG 标签）
      if (item.tags?.includes('DRUG') && finalHpGain > 0 && shopRules.drugResistance?.enable) {
        const { divisor, minEffectiveness, thresholds, messages } = shopRules.drugResistance;
        const currentResistance = state.vitality.metrics.resistance || 0;
        const effectiveness = Math.max(minEffectiveness, 1 - (currentResistance / divisor));
        finalHpGain = Math.floor(finalHpGain * effectiveness);

        if (effectiveness < thresholds.warning) notificationMsg += messages.warning;
        if (effectiveness < thresholds.critical) notificationMsg += messages.critical;
      }

      // 应用数值效果（所有属性都是相对于当前值的累加）
      const metrics = state.vitality.metrics;
      state.modifyStats({
        hp: (metrics.hp || 0) + finalHpGain,
        san: effects.san !== undefined ? (metrics.san || 0) + effects.san : undefined,
        maxHp: effects.maxHp !== undefined ? (metrics.maxHp || 100) + effects.maxHp : undefined,
        hunger: (metrics.hunger || 0) + hungerRestore,
        addiction: effects.addiction !== undefined ? (metrics.addiction || 0) + effects.addiction : undefined,
        resistance: effects.resistance !== undefined ? (metrics.resistance || 0) + effects.resistance : undefined
      });

      // 饮食追踪系统更新
      const currentDietState = (state as any).dietState || {
        junkFoodPoints: 0,
        healthyPoints: 0,
        consecutiveJunkDays: 0,
        consecutiveHealthyDays: 0,
        sodiumIntake: 0,
        sugarIntake: 0,
        redMeatPoints: 0,
        noFreshFoodDays: 0
      };

      let newDietState = { ...currentDietState };
      let isJunkFood = false;
      let isHealthyFood = false;

      // 检查食物标签并更新饮食追踪
      if (item.tags?.includes('JUNK_FOOD')) {
        isJunkFood = true;
        newDietState.junkFoodPoints += item.activeEffect?.params?.junkFoodPoints || 2;
        newDietState.consecutiveJunkDays++;
        newDietState.consecutiveHealthyDays = 0;
      } else if (item.tags?.includes('ORGANIC') || item.tags?.includes('HEALTHY')) {
        isHealthyFood = true;
        newDietState.healthyPoints += item.activeEffect?.params?.healthyPoints || 2;
        newDietState.consecutiveHealthyDays++;
        newDietState.consecutiveJunkDays = 0;
      }

      // 更新钠摄入
      if (item.activeEffect?.params?.sodiumIntake) {
        newDietState.sodiumIntake += item.activeEffect.params.sodiumIntake;
      }

      // 更新糖摄入
      if (item.activeEffect?.params?.sugarIntake) {
        newDietState.sugarIntake += item.activeEffect.params.sugarIntake;
      }

      // 更新红肉摄入
      if (item.tags?.includes('RED_MEAT')) {
        newDietState.redMeatPoints += item.activeEffect?.params?.redMeatPoints || 5;
      }

      // 如果是新鲜食物，重置无新鲜食物天数
      if (item.tags?.includes('ORGANIC') || item.tags?.includes('FRESH') || item.tags?.includes('HEALTHY')) {
        newDietState.noFreshFoodDays = 0;
      }

      // 应用饮食状态更新
      set((s: any) => ({ dietState: newDietState }));

      // 处理 ActiveEffect
      if (item.activeEffect) {
        const { type, params } = item.activeEffect;

        if (type === 'LOTTERY') {
          const win = Math.random() < params.winRate;
          if (win) {
            state.addTransaction('INCOME', params.winPrize, '彩票中奖');
            state.addNotification(params.winMessage, "GOLD");
          } else {
            state.addNotification(params.loseMessage, "info");
          }
        } else if (type === 'BLOOD_DONATION') {
          const { gold, hpCost, message } = params;
          state.modifyStats({ hp: (state.vitality.metrics.hp || 0) - hpCost });
          state.addTransaction('INCOME', gold, `出售血浆`);
          state.addNotification(message, "GOLD");
          consumeItemAndFinish(itemId, state, set);
          return;
        } else if (type === 'SURGERY') {
          const { damage, message } = params;
          state.modifyStats({ hp: (state.vitality.metrics.hp || 0) - damage });
          const currentGold = state.vitality.metrics.gold;
          if (currentGold < 0) {
            state.addTransaction('INCOME', Math.abs(currentGold), `出售器官清偿债务`);
          }
          state.addNotification(message, "warning");
          consumeItemAndFinish(itemId, state, set);
          return;
        } else if (type === 'DISEASE_RISK') {
          // 疾病风险检查
          const roll = Math.random();
          if (roll < params.riskRate) {
            const newDiseaseId = params.diseaseId;
            const currentDiseases = state.vitality.activeDiseases || [];
            if (!currentDiseases.includes(newDiseaseId)) {
              state.contractDisease(newDiseaseId);
              state.addNotification(`⚠️ 你生病了: ${newDiseaseId}`, "error");
            }
          }
        } else if (type === 'METABOLIC_OPTIMIZATION') {
          // 代谢优化 Buff
          const buffEndTurn = state.vitality.time.currentTurn + params.duration;
          set((s: any) => ({
            activeBuffs: [...(s.activeBuffs || []), {
              id: 'METABOLIC_OPTIMIZATION',
              name: '代谢优化',
              endTurn: buffEndTurn,
              effects: {
                maxHpBonus: params.maxHpBonus || 0,
                hpRegenBonus: 5
              }
            }]
          }));
          state.addNotification(`🧬 代谢优化激活: MaxHP +${params.maxHpBonus} (${params.duration}回合)`, "success");
        } else if (type === 'LONGEVITY_BOOST') {
          // 长寿强化
          state.modifyStats({ maxHp: (state.vitality.metrics.maxHp || 100) + params.maxHp });
          state.addNotification(`🧬 你的体质得到了永久性改善 (MaxHP +${params.maxHp})`, "success");
        } else if (type === 'RANDOM_QUALITY') {
          // 随机品质（食品银行）
          const roll = Math.random();
          let quality = 'standard';
          let qualityEffect: any = {};
          
          const table = params.qualityTable;
          if (roll < table.excellent.chance) {
            quality = 'excellent';
            qualityEffect = table.excellent;
          } else if (roll < table.excellent.chance + table.good.chance) {
            quality = 'good';
            qualityEffect = table.good;
          } else if (roll < table.excellent.chance + table.good.chance + table.poor.chance) {
            quality = 'poor';
            qualityEffect = table.poor;
          }

          if (qualityEffect.hp) {
            state.modifyStats({ hp: (state.vitality.metrics.hp || 0) + qualityEffect.hp });
          }
          if (qualityEffect.diseaseRisk && Math.random() < qualityEffect.diseaseRisk) {
            state.contractDisease('FOOD_POISONING');
            state.addNotification('⚠️ 救济食物变质了，你食物中毒了！', "error");
          }

          const qualityMsg = {
            excellent: '运气不错，有新鲜蔬菜和优质蛋白！',
            good: '还算新鲜，能吃饱。',
            standard: '标准的罐头和面包。',
            poor: '有些食物已经过期了...'
          };
          notificationMsg += ` (${qualityMsg[quality as keyof typeof qualityMsg]})`;
        } else if (type === 'DIET_TRACKER') {
          // 饮食追踪已在上面处理
          if (isJunkFood && params.junkFoodPoints >= 3) {
            state.addNotification('🍔 高糖高脂，但真好吃...', "info");
          }
          if (isHealthyFood && params.healthyPoints >= 3) {
            state.addNotification('🥗 健康的食物让身体感到轻盈', "success");
          }
        }
      }

      // 应用政治倾向 - 使用统一的 updateIdentityPoints 方法
      if (item.effects?.points) {
        state.updateIdentityPoints({
          red: item.effects.points.red || 0,
          wolf: item.effects.points.wolf || 0,
          old: item.effects.points.old || 0
        });
        state.addNotification("你的立场发生了偏移...", "info");
      }

      // 消耗物品
      consumeItemAndFinish(itemId, state, set);
      state.addNotification(notificationMsg, "success");
    } else {
      state.addNotification("此物品无法直接使用", "warning");
    }
  }
});
