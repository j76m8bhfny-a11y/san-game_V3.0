import { PlayerClass, Bill, ScalingMode, RegionID, Job, Housing, Insurance, Item } from '../types/schema';

// ------------------------------------------------------------------
// 核心逻辑: 移动权限判定 (Gatekeeper)
// ------------------------------------------------------------------
export interface MoveResult {
  allowed: boolean;
  reason?: string;
}

export const checkMovePermission = (
  targetRegion: RegionID,
  currentClass: PlayerClass,
  inventory: string[],
  itemMap: Map<string, Item> // 需要查阅物品的 Tags
): MoveResult => {
  // 1. 贫民窟：永远开放
  if (targetRegion === RegionID.Slums) {
    return { allowed: true };
  }

  // 辅助函数：检查是否有特定 Tag 的物品
  const hasTag = (tag: string) => {
    return inventory.some(id => itemMap.get(id)?.tags.includes(tag));
  };

  // 2. 铁锈工业区 (RUST_BELT)
  // 门槛：有车就行 (T1+)
  if (targetRegion === RegionID.RustBelt) {
    const hasVehicle = hasTag('VEHICLE_T1') || hasTag('VEHICLE_T2') || hasTag('VEHICLE_T3') || hasTag('VEHICLE_T4');
    if (hasVehicle) return { allowed: true };
    return { allowed: false, reason: '工业区太远了，你需要一辆车 (即使是破烂的)。' };
  }

  // 3. 郊区 (SUBURBS)
  // 门槛：中产阶级 OR T2+好车 OR 通行证
  if (targetRegion === RegionID.Suburbs) {
    if (currentClass === PlayerClass.Middle || currentClass === PlayerClass.Capitalist) return { allowed: true };
    if (hasTag('VEHICLE_T2') || hasTag('VEHICLE_T3') || hasTag('VEHICLE_T4')) return { allowed: true };
    if (hasTag('TICKET')) return { allowed: true }; // 伪造证件
    return { allowed: false, reason: '私人社区，闲人免进。你需要更好的车、通行证或体面的身份。' };
  }

  // 4. 金融核心区 (DOWNTOWN)
  // 门槛：资本家 OR T3+豪车 OR 特殊通行证
  if (targetRegion === RegionID.Downtown) {
    if (currentClass === PlayerClass.Capitalist) return { allowed: true };
    if (hasTag('VEHICLE_T3') || hasTag('VEHICLE_T4')) return { allowed: true };
    if (hasTag('VIP_TICKET')) return { allowed: true }; // 高级通行证
    return { allowed: false, reason: '核心区被安保封锁了。你的身份或座驾无法通过检查。' };
  }

  return { allowed: false, reason: '未知区域' };
};

// ------------------------------------------------------------------
// 核心逻辑: 薪资计算 (Job Based)
// ------------------------------------------------------------------
export const calcSalary = (job: Job | null): number => {
  if (!job) return 0; // 无业游民没有工资，只能靠捡垃圾(事件)或低保
  return job.salary;
};

// ------------------------------------------------------------------
// 核心逻辑: 账单触发与减免 (Mitigation System)
// ------------------------------------------------------------------
export const triggerBill = (
  gold: number,
  san: number,
  currentClass: PlayerClass,
  billPool: Bill[],
  config: { baseProb: number; debtProb: number },
  // 新增上下文
  context: {
    inventory: string[];
    itemMap: Map<string, Item>;
    housing: Housing | null;
    insurance: Insurance | null;
  }
): { bill: Bill; finalAmount: number; mitigationLog?: string } | null => {
  const { inventory, itemMap, housing, insurance } = context;

  // 1. 基础概率判定
  const actualProb = gold < 0 ? config.debtProb : config.baseProb;
  
  // 2. 载具维护费逻辑 (动态调整权重)
  // 如果持有车辆，极大增加 "VEHICLE" 类型账单的权重
  // 这里我们简化处理：如果随机到了账单，我们再进行一次池内加权筛选
  if (Math.random() > actualProb) return null;

  // 3. 筛选可用账单
  let validBills = billPool.filter(bill => {
    if (!bill.triggerCondition) return true;
    const c = bill.triggerCondition;

    if (c.isDebtOnly && gold >= 0) return false;
    if (c.requiredClass && !c.requiredClass.includes(currentClass)) return false;
    if (c.minGold !== undefined && gold < c.minGold) return false;
    if (c.maxGold !== undefined && gold > c.maxGold) return false;
    if (c.minSan !== undefined && san < c.minSan) return false;
    
    // 资产检查
    if (c.hasHousing && !housing) return false;
    if (c.hasVehicle) {
        // 检查背包是否有对应 Tag 的物品
        const hasIt = inventory.some(id => itemMap.get(id)?.tags.includes(c.hasVehicle!));
        if (!hasIt) return false;
    }

    return true;
  });

  if (validBills.length === 0) return null;

  // 4. 权重计算 (Weight Adjustment)
  // TODO: 如果有车，将类型为 'VEHICLE' 的账单权重 x5
  // 这里暂时使用简单的随机
  const totalWeight = validBills.reduce((sum, bill) => sum + (bill.weight || 10), 0);
  let randomVal = Math.random() * totalWeight;
  let selectedBill: Bill | null = null;
  
  for (const bill of validBills) {
    const w = bill.weight || 10;
    if (randomVal < w) {
      selectedBill = bill;
      break;
    }
    randomVal -= w;
  }
  
  if (!selectedBill) selectedBill = validBills[0];

  // 5. 减免逻辑 (Mitigation)
  let finalAmount = selectedBill.amount;
  let logs: string[] = [];

  // A. 医保减免
  if (selectedBill.type === 'MEDICAL' && insurance) {
    if (insurance.coverage === 'FULL') {
      finalAmount = 0;
      logs.push(`医保[${insurance.name}]全额覆盖了费用`);
    } else if (insurance.coverage === 'PARTIAL') {
      finalAmount = Math.floor(finalAmount * 0.3); // 减免 70%
      logs.push(`医保[${insurance.name}]报销了 70% 费用`);
    }
  }

  // B. 法律免疫 (e.g. 参议员电话)
  if (selectedBill.type === 'LEGAL') {
     const hasImmunity = inventory.some(id => itemMap.get(id)?.tags.includes('IMMUNE_LEGAL'));
     if (hasImmunity) {
         finalAmount = 0;
         logs.push(`你动用了[特权关系]，撤销了指控`);
     }
  }

  // C. 灾难抵御 (房产)
  if (selectedBill.type === 'DISASTER' && housing) {
      const reduction = housing.defenseLevel * 0.15; // 每级防御减少 15%
      const discount = Math.min(reduction, 1.0);
      if (discount > 0) {
          finalAmount = Math.floor(finalAmount * (1 - discount));
          logs.push(`房产[${housing.name}]抵御了灾害`);
      }
  }

  return { 
      bill: selectedBill, 
      finalAmount, 
      mitigationLog: logs.length > 0 ? logs.join('; ') : undefined 
  };
};

// ... (CalcPressure, CheckClassUpdate 等其他函数保持不变，需要保留吗？)
// 为了代码完整性，建议保留原来的辅助函数
export const calcPressure = (san: number, divisor: number): number => {
  return 1 + (Math.pow(san, 2) / divisor);
};

export const clamp = (num: number, min: number, max: number) => 
  Math.min(Math.max(num, min), max);

export const checkClassUpdate = (gold: number, classDefinitions: any[]): PlayerClass => {
    const matched = classDefinitions.find((cls: any) => 
      gold >= cls.thresholdMin && gold <= cls.thresholdMax
    );
    return matched ? (matched.id as PlayerClass) : PlayerClass.Homeless;
};

export const humanDismantlementCheck = (
    currentClass: PlayerClass,
    debtDayCounter: number,
    gold: number
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

export const calcDynamicGold = (
    baseAmount: number,
    mode: ScalingMode | undefined,
    currentClass: PlayerClass,
    classSettings: any 
  ): number => {
    if (mode === ScalingMode.FIXED) return baseAmount;
    const settings = classSettings[currentClass]; 
    if (!settings) return baseAmount;
    if (mode === ScalingMode.CLASS_LEVERAGE) return Math.floor(baseAmount * settings.leverage);
    if (mode === ScalingMode.INCOME_RATIO) return Math.floor(baseAmount * settings.baseSalary); // 注意：这里还是用的阶级基础收入比例
    return baseAmount;
};