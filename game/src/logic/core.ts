import { PlayerClass, Bill, ScalingMode, RegionID, Item, Housing, Insurance } from '../types/schema';
// ✅ 1. 确保正确引入配置
import housingRules from '@/assets/data/rules/housingRules.json';
import prisonRules from '@/assets/data/rules/prisonRules.json';

// ------------------------------------------------------------------
// 核心公式 1: 动态压力系数
// ------------------------------------------------------------------
export const calcPressure = (san: number, divisor: number): number => {
  return 1 + (Math.pow(san, 2) / divisor);
};

// ------------------------------------------------------------------
// 核心公式 2: 薪资效率系数
// ------------------------------------------------------------------
export const calcSalary = (baseSalary: number, currentSan: number, config: any[]): number => {
  const match = config.find((c: any) => currentSan <= c.maxSan);
  const efficiency = match ? match.efficiency : 0.1;
  return Math.floor(baseSalary * efficiency);
};

// ------------------------------------------------------------------
// 核心逻辑: 动态金币计算 (阶级杠杆)
// ------------------------------------------------------------------
export const calcDynamicGold = (
  baseAmount: number,
  mode: ScalingMode | undefined,
  currentClass: PlayerClass,
  classSettings: any 
): number => {
  if (mode === ScalingMode.FIXED) {
    return baseAmount;
  }

  const settings = classSettings[currentClass]; 
  if (!settings) return baseAmount;

  if (mode === ScalingMode.CLASS_LEVERAGE) {
    return Math.floor(baseAmount * settings.leverage);
  }

  if (mode === ScalingMode.INCOME_RATIO) {
    return Math.floor(baseAmount * settings.baseSalary);
  }

  return baseAmount;
};

// ------------------------------------------------------------------
// 核心逻辑: 账单触发
// ------------------------------------------------------------------
export const triggerBill = (
  gold: number,
  san: number,
  currentClass: PlayerClass,
  billPool: Bill[],
  config: { baseProb: number; debtProb: number },
  assets: {
    housing: Housing | null;
    vehicleTags: string[];
    inventory?: string[];
    insurance?: any;
    activeLoans?: Array<{ productId: string; overdueTurns: number }>;
  }
): Bill | null => {
  const actualProb = gold < 0 ? config.debtProb : config.baseProb;
  
  if (Math.random() > actualProb) return null;

  const validBills = billPool.filter(bill => {
    if (!bill.triggerCondition) return true;
    const { 
      isDebtOnly, requiredClass, minGold, minSan, maxGold,
      hasVehicle, hasHousing,
      hasItem, hasItemTag, noItem, noItemTag,
      noInsuranceType
    } = bill.triggerCondition as any;

    if (isDebtOnly && gold >= 0) return false;
    if (requiredClass && !requiredClass.includes(currentClass)) return false;
    if (minGold !== undefined && gold < minGold) return false;
    if (maxGold !== undefined && gold > maxGold) return false;
    if (minSan !== undefined && san < minSan) return false;

    if (hasVehicle && !assets.vehicleTags.includes(hasVehicle)) return false;

    if (hasHousing !== undefined) {
      const playerHasHousing = !!assets.housing;
      if (hasHousing !== playerHasHousing) return false;
    }

    // 车辆相关检查
    const inventory = assets.inventory || [];
    
    // 检查是否有特定物品
    if (hasItem && !inventory.includes(hasItem)) return false;
    
    // 检查是否有特定标签的物品
    if (hasItemTag) {
      const hasTag = inventory.some(id => {
        // 简单检查：VEHICLE标签检查id前缀，LICENSE标签检查id前缀
        if (hasItemTag === 'VEHICLE') return id.startsWith('CAR_') || id === 'KEY_CAR';
        if (hasItemTag === 'LICENSE') return id.startsWith('LICENSE_');
        return false;
      });
      if (!hasTag) return false;
    }
    
    // 检查是否没有特定物品
    if (noItem && inventory.includes(noItem)) return false;
    
    // 检查是否没有特定标签的物品
    if (noItemTag) {
      const hasTag = inventory.some(id => {
        if (noItemTag === 'VEHICLE') return id.startsWith('CAR_') || id === 'KEY_CAR';
        if (noItemTag === 'LICENSE') return id.startsWith('LICENSE_');
        return false;
      });
      if (hasTag) return false;
    }
    
    // ✅ 检查保险类型（多保险支持）
    if (noInsuranceType) {
      // assets.insurance 可能是单个保险或保险数组
      const insurances = Array.isArray(assets.insurance) 
        ? assets.insurance 
        : assets.insurance ? [assets.insurance] : [];
      const hasInsuranceType = insurances.some((ins: Insurance) => ins.type === noInsuranceType);
      if (hasInsuranceType) return false;
    }
    
    // 检查逾期贷款（车辆拖走）
    const { hasOverdueLoan, overdueWeeks } = bill.triggerCondition as any;
    if (hasOverdueLoan && overdueWeeks) {
      const activeLoans = assets.activeLoans || [];
      const hasMatchingOverdueLoan = activeLoans.some(loan => 
        loan.productId === hasOverdueLoan && loan.overdueTurns >= overdueWeeks
      );
      if (!hasMatchingOverdueLoan) return false;
    }

    return true;
  });

  if (validBills.length === 0) return null;
  
  const totalWeight = validBills.reduce((sum, bill) => sum + (bill.weight || 10), 0);
  let randomVal = Math.random() * totalWeight;
  
  for (const bill of validBills) {
    const w = bill.weight || 10;
    if (randomVal < w) return bill;
    randomVal -= w;
  }

  return validBills[0];
};

// ------------------------------------------------------------------
// 阶级更新检查
// ------------------------------------------------------------------

// ✅ 安全的 PlayerClass 枚举值集合
const VALID_PLAYER_CLASSES: Set<string> = new Set([
  PlayerClass.Homeless,
  PlayerClass.Worker,
  PlayerClass.Middle,
  PlayerClass.Capitalist
]);

/**
 * 验证并获取安全的流浪汉阶级ID
 * 如果配置无效，返回硬编码的安全兜底值
 */
const getSafeHomelessClassId = (): PlayerClass => {
  const configId = housingRules?.access?.homelessClassId;
  
  // 运行时校验：确保配置值是有效的 PlayerClass
  if (configId && VALID_PLAYER_CLASSES.has(configId)) {
    return configId as PlayerClass;
  }
  
  // ⚠️ 配置异常警告：使用安全兜底值
  console.warn(
    `[Config Error] housingRules.access.homelessClassId="${configId}" is invalid. ` +
    `Falling back to "${PlayerClass.Homeless}". ` +
    `Valid values: ${Array.from(VALID_PLAYER_CLASSES).join(', ')}`
  );
  return PlayerClass.Homeless;
};

export const checkClassUpdate = (gold: number, classDefinitions: any[]): PlayerClass => {
  const matched = classDefinitions.find((cls: any) => 
    gold >= cls.thresholdMin && gold <= cls.thresholdMax
  );
  
  // ✅ 修复: 使用配置中的 Homeless ID，带运行时校验
  return matched ? (matched.id as PlayerClass) : getSafeHomelessClassId();
};

export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// 人体拆解检查 (Bad End 前置)
export const humanDismantlementCheck = (
  currentClass: PlayerClass,
  debtDayCounter: number,
) => {
  // ✅ 修复: 使用配置判断是否为流浪汉（带运行时校验）
  const isHomeless = currentClass === getSafeHomelessClassId();
  const passiveTrigger = isHomeless && debtDayCounter >= 3;
  
  if (passiveTrigger) {
    return {
      triggered: true,
      type: 'PASSIVE' as const,
      changes: { goldSetTo: 0, maxHpMultiplier: 0.5, debtReset: true }
    };
  }
  return null;
};

// ------------------------------------------------------------------
// 🗺️ 区域移动权限检查
// ------------------------------------------------------------------
export const checkMovePermission = (
  targetRegion: RegionID,
  currentClass: PlayerClass,
  inventoryIds: string[],
  itemMap: Map<string, Item>,
  inPrison: boolean = false // ✅ [New] 新增参数：当前是否在监狱
): { allowed: boolean; reason?: string } => {
  
  // 1. 优先检查监狱状态 (读取 JSON 配置)
  // ✅ 防御性编程：使用可选链，默认阻断移动
  if (inPrison && (prisonRules?.settings?.blockMovement ?? true)) {
    return { 
      allowed: false, 
      reason: "你正在服刑中，无法离开监狱区域。" // 这里的文案也可以提取到 JSON
    };
  }

  // 2. 检查流浪汉允许区域 (原有逻辑优化)
  // ✅ 防御性编程：使用可选链和空数组兜底
  const allowedRegions = housingRules?.access?.homelessAllowedRegions ?? [];
  if (allowedRegions.includes(targetRegion)) {
    return { allowed: true };
  }

  const hasTag = (tag: string) => {
    return inventoryIds.some(id => {
      const item = itemMap.get(id);
      return item?.tags.includes(tag);
    });
  };

  const hasT4 = hasTag('VEHICLE_T4'); 
  const hasT3 = hasTag('VEHICLE_T3'); 
  const hasT2 = hasTag('VEHICLE_T2'); 
  const hasT1 = hasTag('VEHICLE_T1'); 

  switch (targetRegion) {
    case RegionID.RustBelt:
      if (hasT1 || hasT2 || hasT3 || hasT4) return { allowed: true };
      return { allowed: false, reason: "你需要一辆车 (即使是破烂) 才能去工厂。" };

    case RegionID.Suburbs:
      if (hasT2 || hasT3 || hasT4) return { allowed: true };
      if (currentClass === PlayerClass.Middle || currentClass === PlayerClass.Capitalist) return { allowed: true };
      if (hasTag('TICKET_SUBURBS')) return { allowed: true };
      return { allowed: false, reason: "私人社区。未检测到中产身份或合规车辆。" };

    case RegionID.Downtown:
      if (hasT3 || hasT4) return { allowed: true };
      if (currentClass === PlayerClass.Capitalist) return { allowed: true };
      if (hasTag('TICKET_DOWNTOWN')) return { allowed: true };
      return { allowed: false, reason: "核心金融区。穷人与狗不得入内。" };

    default:
      return { allowed: true };
  }
};

// ------------------------------------------------------------------
// 账单减免计算
// ------------------------------------------------------------------
export const calculateBillMitigation = (
  bill: Bill,
  housing: Housing | null,
  insurance: Insurance | null
): { finalAmount: number; mitigated: boolean; reason?: string } => {
  let finalAmount = bill.amount; 
  let reason = '';
  let mitigated = false;

  // ✅ 奖励账单（正数金额）不适用减免逻辑
  if (finalAmount > 0) {
    return { finalAmount, mitigated: false };
  }

  if (bill.type === 'MEDICAL' && insurance) {
    const { copayModifier } = insurance.coverage;
    
    if (copayModifier === 0) {
      finalAmount = 0;
      reason = `[医保] ${insurance.name} 全额报销`;
      mitigated = true;
    } else if (copayModifier < 1) {
      const savedRate = Math.round((1 - copayModifier) * 100);
      finalAmount = Math.floor(finalAmount * copayModifier);
      reason = `[医保] ${insurance.name} 报销 ${savedRate}%`;
      mitigated = true;
    }
  }

  // 2. 房产防御判定
  if ((bill.type === 'DISASTER' || bill.type === 'JUMP_SCARE') && housing) {
    const reduction = Math.min(housing.defenseLevel * 0.1, 0.5);
    if (reduction > 0) {
      finalAmount = Math.floor(finalAmount * (1 - reduction));
      reason = reason ? `${reason} + [安保] 减免` : `[安保] ${housing.name} 拦截`;
      mitigated = true;
    }
  }

  return { finalAmount, mitigated, reason };
};