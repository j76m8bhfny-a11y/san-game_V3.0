import { PlayerClass, Bill, ScalingMode, RegionID, Item, Housing, Insurance } from '../types/schema';

// ------------------------------------------------------------------
// 核心公式 1: 动态压力系数
// ------------------------------------------------------------------
export const calcPressure = (san: number, divisor: number): number => {
  return 1 + (Math.pow(san, 2) / divisor);
};

// ------------------------------------------------------------------
// 核心公式 2: 薪资效率系数
// ------------------------------------------------------------------
// ✅ 修复: 使用 any 暂时替代已移除的 GlobalSettings 配置类型
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
  // ✅ 修复: config 路径对齐
  config: { baseProb: number; debtProb: number },
  assets: {
    housing: Housing | null;
    vehicleTags: string[]; 
  }
): Bill | null => {
  const actualProb = gold < 0 ? config.debtProb : config.baseProb;
  
  if (Math.random() > actualProb) return null;

  const validBills = billPool.filter(bill => {
    if (!bill.triggerCondition) return true;
    const { 
      isDebtOnly, requiredClass, minGold, minSan, maxGold,
      hasVehicle, hasHousing 
    } = bill.triggerCondition;

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
export const checkClassUpdate = (gold: number, classDefinitions: any[]): PlayerClass => {
  const matched = classDefinitions.find((cls: any) => 
    gold >= cls.thresholdMin && gold <= cls.thresholdMax
  );
  return matched ? (matched.id as PlayerClass) : PlayerClass.Homeless;
};

export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

// 人体拆解检查
export const humanDismantlementCheck = (
  currentClass: PlayerClass,
  debtDayCounter: number,
  // ✅ 修复: 移除未使用的 gold 参数 (警告 6133)
) => {
  const passiveTrigger = currentClass === PlayerClass.Homeless && debtDayCounter >= 3;
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
  itemMap: Map<string, Item>
): { allowed: boolean; reason?: string } => {
  
  if (targetRegion === RegionID.Slums) {
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

  // ✅ 修复: 比较逻辑对齐 V3.0 的 Insurance.coverage 对象结构
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