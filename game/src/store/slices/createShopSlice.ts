import { StateCreator } from 'zustand';
import { Item, RegionID, LedgerCategory, ItemType } from '@/types/schema';
import { StoreState } from '@/types/store';
import shopRules from '@/assets/data/rules/shopRules.json';
import foodRules from '@/assets/data/rules/foodRules.json';
import { getVehicleSellPrice } from '@/components/game/vehicle/config/vehicleShopConfig';

// 🚗 区域固定车辆池配置（每区域只有一台车）
const REGION_VEHICLE_POOL: Record<RegionID, string[]> = {
  [RegionID.Slums]: ['CAR_JUNK'],           // 贫民窟：只有破皮卡
  [RegionID.RustBelt]: ['CAR_JUNK', 'CAR_USED'], // 铁锈带：破皮卡或二手轿车
  [RegionID.Suburbs]: ['KEY_CAR', 'CAR_USED', 'CAR_SUV'], // 郊区：车钥匙、二手轿车、家用SUV
  [RegionID.Downtown]: ['CAR_SPORTS', 'CAR_LUXURY'] // 市中心：跑车、豪华轿车
};

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
  // 🏪 库存管理
  refreshShopInventory: () => void; // 刷新所有区域商店库存
  getAvailableItemsInRegion: (region: RegionID) => Item[]; // 获取区域有库存的物品
  // 🚗 车辆相关
  getVehiclePurchaseRegion: () => RegionID | null; // 获取车辆购买区域
}

/**
 * 为区域生成随机库存（每种物品最多1件）
 * 🚗 车辆规则：每区域固定一台车，买了就没了
 */
const generateRegionInventory = (region: RegionID, allItems: Item[]): string[] => {
  // 获取该区域的所有可用物品
  const regionItems = allItems.filter(item => {
    if (!item.regions) return false;
    if (item.regions.length === 0) return false;
    return item.regions.includes(region);
  });

  // 按类型分组
  const foodItems = regionItems.filter(i => i.tags?.includes('FOOD'));
  const medicalItems = regionItems.filter(i => i.tags?.includes('MEDICAL'));
  // 其他物品（排除车辆和食物、医疗）
  const otherItems = regionItems.filter(i => 
    !i.tags?.includes('VEHICLE') && 
    !i.tags?.includes('FOOD') && 
    !i.tags?.includes('MEDICAL')
  );

  // 随机选择
  const selected: string[] = [];
  
  // 食物类：选2-4个
  const foodCount = Math.min(foodItems.length, 2 + Math.floor(Math.random() * 3));
  const shuffledFood = [...foodItems].sort(() => Math.random() - 0.5);
  selected.push(...shuffledFood.slice(0, foodCount).map(i => i.id));
  
  // 医疗类：选1-2个
  if (medicalItems.length > 0) {
    const medicalCount = Math.min(medicalItems.length, 1 + Math.floor(Math.random() * 2));
    const shuffledMedical = [...medicalItems].sort(() => Math.random() - 0.5);
    selected.push(...shuffledMedical.slice(0, medicalCount).map(i => i.id));
  }
  
  // 其他类：选0-2个
  if (otherItems.length > 0) {
    const otherCount = Math.min(otherItems.length, Math.floor(Math.random() * 3));
    const shuffledOther = [...otherItems].sort(() => Math.random() - 0.5);
    selected.push(...shuffledOther.slice(0, otherCount).map(i => i.id));
  }

  // 🚗 添加区域固定车辆（从车辆池中随机选一台）
  const vehiclePool = REGION_VEHICLE_POOL[region];
  if (vehiclePool && vehiclePool.length > 0) {
    // 从该区域可用车辆中随机选一台
    const randomVehicle = vehiclePool[Math.floor(Math.random() * vehiclePool.length)];
    selected.push(randomVehicle);
  }

  return selected;
};

export const createShopSlice: StateCreator<StoreState, [], [], ShopSlice> = (set, get) => ({

  getVehiclePurchaseRegion: () => {
    return get().vehiclePurchaseRegion;
  },

  getRegionItems: (region) => {
    const allItems: Item[] = get().gameDataCache?.items || [];
    return allItems.filter(item => {
      if (!item.regions) return true;
      if (item.regions.length === 0) return false;
      return item.regions.includes(region);
    });
  },

  // 🏪 获取区域有库存的物品（用于UI显示）
  getAvailableItemsInRegion: (region) => {
    const state = get();
    const allItems: Item[] = state.gameDataCache?.items || [];
    const inventory = state.shopInventory?.[region] || [];
    
    return allItems.filter(item => inventory.includes(item.id));
  },

  // 🏪 刷新所有区域商店库存
  refreshShopInventory: () => {
    const state = get();
    const allItems: Item[] = state.gameDataCache?.items || [];
    
    const newInventory: Record<RegionID, string[]> = {
      [RegionID.Slums]: generateRegionInventory(RegionID.Slums, allItems),
      [RegionID.RustBelt]: generateRegionInventory(RegionID.RustBelt, allItems),
      [RegionID.Suburbs]: generateRegionInventory(RegionID.Suburbs, allItems),
      [RegionID.Downtown]: generateRegionInventory(RegionID.Downtown, allItems),
    };

    set({ shopInventory: newInventory });
    
    // 可选：通知玩家商店已刷新
    const store = get() as any;
    if (store.addNotification) {
      store.addNotification('商店库存已刷新', 'info');
    }
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

    // 🏪 检查商店库存（现在车辆也受库存限制）
    const isVehicle = item.tags?.some((tag: string) => tag.startsWith('VEHICLE'));
    const currentRegion = state.currentRegion;
    const regionInventory = state.shopInventory?.[currentRegion] || [];
    
    if (!regionInventory.includes(itemId)) {
      if (isVehicle) {
        state.addNotification("该区域暂无车辆可售", "error");
      } else {
        state.addNotification("该物品本回合已售罄", "error");
      }
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
    set((s: any) => {
      // 🏪 从商店库存中移除（包括车辆）
      const newShopInventory = {
        ...s.shopInventory,
        [currentRegion]: (s.shopInventory?.[currentRegion] || []).filter((id: string) => id !== itemId)
      };
      
      // 🚗 如果是车辆，记录购买区域
      const updates: any = {
        inventory: [...s.inventory, item.id],
        shopInventory: newShopInventory
      };
      if (isVehicle) {
        updates.vehiclePurchaseRegion = currentRegion;
      }
      
      return updates;
    });

    state.addNotification(`获得: ${item.name}`, "success");
  },

  sellVehicle: (region) => {
    const state = get();
    if (!state.gameDataCache) {
      return { success: false, message: "游戏数据未加载" };
    }

    // 🔍 查找车辆（CAR_ 或 KEY_CAR）
    const vehicleId = state.inventory.find(id => 
      id.startsWith('CAR_') || id === 'KEY_CAR'
    );
    if (!vehicleId) {
      return { success: false, message: "没有车辆可出售" };
    }

    // 🚗 检查是否在购买区域
    const purchaseRegion = state.vehiclePurchaseRegion;
    if (purchaseRegion && purchaseRegion !== region) {
      return { 
        success: false, 
        message: `只能在购买区域 (${purchaseRegion}) 出售此车辆` 
      };
    }

    const vehicle = state.gameDataCache.items.find((i: Item) => i.id === vehicleId);
    if (!vehicle) {
      return { success: false, message: "车辆数据异常" };
    }

    const sellPrice = getVehicleSellPrice(vehicleId, region);
    
    // 🚗 卖车时返还车辆到原购买区域库存
    set((s: any) => {
      // 返还到原购买区域（如果记录存在），否则当前区域
      const targetRegion = purchaseRegion || region;
      const targetRegionInventory = s.shopInventory?.[targetRegion] || [];
      const regionPool = REGION_VEHICLE_POOL[targetRegion] || [];
      const shouldReturnToPool = regionPool.includes(vehicleId);
      const isAlreadyInInventory = targetRegionInventory.includes(vehicleId);
      
      const newShopInventory = shouldReturnToPool && !isAlreadyInInventory
        ? {
            ...s.shopInventory,
            [targetRegion]: [...targetRegionInventory, vehicleId]
          }
        : s.shopInventory;
      
      return {
        inventory: s.inventory.filter((id: string) => id !== vehicleId),
        shopInventory: newShopInventory,
        vehiclePurchaseRegion: null // 清除购买区域记录
      };
    });

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
      set(() => ({ dietState: newDietState }));

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
        } else if (type === 'APPLY_BUFF') {
          // 应用生存Buff
          const { buffId, duration, probability = 1.0 } = params;
          if (Math.random() < probability) {
            if (state.applyItemBuff) {
              state.applyItemBuff(buffId, duration);
            } else {
              // 兜底：直接修改状态
              const store = get() as any;
              if (store.addSurvivalBuff) {
                store.addSurvivalBuff({
                  id: `${buffId}_${Date.now()}`,
                  name: buffId,
                  description: '',
                  duration: duration || 5,
                  maxDuration: duration || 5,
                  effects: {},
                  source: 'ITEM',
                  stackable: false
                });
              }
            }
          }
        } else if (type === 'TRIGGER_EVENT') {
          // 触发事件
          const { eventId, probability = 1.0 } = params;
          if (Math.random() < probability) {
            const eventData = state.gameDataCache?.events?.find((e: any) => e.id === eventId);
            if (eventData && state.triggerEvent) {
              state.triggerEvent(eventData);
            } else {
              state.addNotification(`触发事件: ${eventId}`, "warning");
            }
          }
        } else if (type === 'METABOLIC_OPTIMIZATION') {
          // 代谢优化 Buff - 使用新的SurvivalBuff格式
          // 创建一个临时代谢优化Buff
          const metabolicBuff = {
            id: `buff_metabolic_${Date.now()}`,
            name: '代谢优化',
            description: '生酮饮食带来的代谢状态改变',
            duration: params.duration,
            maxDuration: params.duration,
            effects: {
              perTurn: { hp: 2 },
              maxHpBonus: params.maxHpBonus || 0,
              onExpire: { 
                hp: -5,
                maxHpBonus: 0  // 恢复MaxHP
              }
            },
            source: 'ITEM',
            stackable: false,
            icon: 'buff_metabolic'
          };
          const store = get() as any;
          store.addSurvivalBuff?.(metabolicBuff);
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
