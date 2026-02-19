import { StateCreator } from 'zustand';
import { StoreState } from '@/types/store';
import { 
  RegionID, 
  DMVQueueState, 
  ActiveLease, 
  PlayerClass
} from '@/types/schema';

// 导入JSON配置
import dmvRules from '@/assets/data/rules/dmvRules.json';
import vehicleRules from '@/assets/data/rules/vehicleRules.json';
import leaseProducts from '@/assets/data/rules/leaseProducts.json';
import vehiclesData from '@/assets/data/vehicles.json';
import licensesData from '@/assets/data/licenses.json';

// VehicleSlice 接口定义
export interface VehicleSlice {
  // ===== DMV排队系统 =====
  dmvQueue: DMVQueueState | null;
  startDMVQueue: (region: RegionID, licenseType: 'VALID' | 'ELITE') => { success: boolean; message: string };
  processDMVQueueTurn: () => { isComplete: boolean; message?: string };
  completeDMVQueue: () => { success: boolean; message: string };
  cancelDMVQueue: () => void;
  
  // ===== 租赁系统 =====
  activeLease: ActiveLease | null;
  startLease: (vehicleId: string, region: RegionID) => { success: boolean; message: string };
  processLeaseTurn: () => { isExpired: boolean; paymentSuccess: boolean; message?: string };
  endLease: (returnCondition: 'good' | 'fair' | 'poor') => { success: boolean; finalCost: number; message: string };
  
  // ===== 置换系统 =====
  calculateTradeInValue: (vehicleId: string, region: RegionID) => number;
  tradeInVehicle: (oldVehicleId: string, newVehicleId: string, region: RegionID) => { success: boolean; tradeInValue: number; finalPrice: number; message: string };
  
  // ===== 信用检查 =====
  checkCreditForPurchase: (vehicleId: string) => { 
    canPurchase: boolean; 
    creditCheckPassed: boolean;
    rateModifier: number;
    message: string;
    requiredScore?: number;
    currentScore?: number;
  };
  
  // ===== 车辆效果处理 =====
  processVehicleEffects: () => { hpChange: number; sanChange: number; addictionChange: number };
}

// 辅助函数：获取车辆配置
const getVehicleConfig = (vehicleId: string) => {
  return (vehiclesData as any[]).find(v => v.id === vehicleId);
};

// 辅助函数：获取驾照配置
const getLicenseConfig = (licenseId: string) => {
  return (licensesData as any[]).find(l => l.id === licenseId);
};

// 辅助函数：检查阶级要求
const meetsClassRequirement = (playerClass: PlayerClass, requiredClass: PlayerClass): boolean => {
  const classOrder = ['HOMELESS', 'WORKER', 'MIDDLE', 'CAPITALIST'];
  return classOrder.indexOf(playerClass) >= classOrder.indexOf(requiredClass);
};

export const createVehicleSlice: StateCreator<StoreState, [], [], VehicleSlice> = (set, get) => ({
  // 初始状态
  dmvQueue: null,
  activeLease: null,

  // ============================================================================
  // DMV排队系统
  // ============================================================================
  
  startDMVQueue: (region, licenseType) => {
    const state = get();
    const { currentTurn } = state.vitality.time;
    
    // 检查是否已在排队
    if (state.dmvQueue) {
      return { success: false, message: '已经在排队中，请耐心等待' };
    }
    
    // 检查区域是否支持DMV（仅铁锈区）
    const regionConfig = (dmvRules as any).regionalModifiers[region];
    if (!regionConfig && region !== 'RUST_BELT') {
      return { success: false, message: '该区域不支持DMV排队办理' };
    }
    
    // 检查驾照类型配置
    const licenseTypeConfig = (dmvRules as any).licenseTypes[licenseType];
    if (!licenseTypeConfig || !licenseTypeConfig.requiresDMV) {
      return { success: false, message: '该驾照类型不需要排队办理' };
    }
    
    // 生成排队号码
    const { min, max } = (dmvRules as any).queueNumberRange;
    const ticketNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    const currentNumber = Math.floor(Math.random() * (ticketNumber - min)) + min;
    
    // 创建排队状态
    const queueState: DMVQueueState = {
      ticketNumber,
      currentNumber,
      waitTurnsRemaining: licenseTypeConfig.waitTurns,
      region,
      licenseType,
      startTurn: currentTurn
    };
    
    set({ dmvQueue: queueState });
    
    return { 
      success: true, 
      message: `取号成功！您的号码是 #${ticketNumber}，当前叫号 #${currentNumber}，预计等待 ${licenseTypeConfig.waitTurns} 回合` 
    };
  },
  
  processDMVQueueTurn: () => {
    const state = get();
    const queue = state.dmvQueue;
    
    if (!queue) {
      return { isComplete: false, message: '没有在排队' };
    }
    
    // 获取进度配置
    const { min, max } = (dmvRules as any).progressPerTurn;
    const progress = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // 更新当前叫号
    const newCurrentNumber = Math.min(queue.currentNumber + progress, queue.ticketNumber);
    const newWaitTurns = queue.waitTurnsRemaining - 1;
    
    const updatedQueue: DMVQueueState = {
      ...queue,
      currentNumber: newCurrentNumber,
      waitTurnsRemaining: newWaitTurns
    };
    
    set({ dmvQueue: updatedQueue });
    
    // 检查是否完成（只需等待回合结束）
    const isComplete = newWaitTurns <= 0;
    
    return {
      isComplete,
      message: isComplete 
        ? '轮到您了！请到窗口办理' 
        : `当前叫号 #${newCurrentNumber}，还需等待 ${Math.max(0, newWaitTurns)} 回合`
    };
  },
  
  completeDMVQueue: () => {
    const state = get();
    const queue = state.dmvQueue;
    
    if (!queue) {
      return { success: false, message: '没有在排队' };
    }
    
    // 检查是否可以完成
    if (queue.waitTurnsRemaining > 0 || queue.currentNumber < queue.ticketNumber) {
      return { success: false, message: '还未轮到您，请继续等待' };
    }
    
    // 获取驾照ID
    const licenseId = queue.licenseType === 'VALID' ? 'LICENSE_VALID' : 'LICENSE_ELITE';
    const licenseConfig = getLicenseConfig(licenseId);
    
    // 扣除费用（从配置读取）
    const price = licenseConfig?.price || 50;
    const currentGold = state.vitality.metrics.gold;
    
    if (currentGold < price) {
      return { success: false, message: '资金不足，无法完成办理' };
    }
    
    // 扣除费用并添加驾照到库存
    const newInventory = [...state.inventory, licenseId];
    set({ 
      inventory: newInventory,
      dmvQueue: null,
      vitality: {
        ...state.vitality,
        metrics: {
          ...state.vitality.metrics,
          gold: currentGold - price
        }
      }
    });
    
    // 添加交易记录
    state.addTransaction('MISC', -price, `购买驾照: ${licenseConfig?.nameKey || licenseId}`);
    
    return { success: true, message: '驾照办理成功！' };
  },
  
  cancelDMVQueue: () => {
    set({ dmvQueue: null });
  },

  // ============================================================================
  // 租赁系统
  // ============================================================================
  
  startLease: (vehicleId, region) => {
    const state = get();
    const { vitality, inventory } = state;
    
    // 检查是否已有车辆（包括拥有的和租赁的）
    const hasOwnedVehicle = inventory.some(id => id.startsWith('CAR_') || id === 'KEY_CAR');
    const hasLeasedVehicle = !!state.activeLease;
    if (hasOwnedVehicle) {
      return { success: false, message: '您已经拥有车辆，无法租赁（请先出售现有车辆）' };
    }
    if (hasLeasedVehicle) {
      return { success: false, message: '您已有正在进行的租赁，无法同时租赁多辆车' };
    }
    
    // 检查是否已有租赁
    if (state.activeLease) {
      return { success: false, message: '您已有正在进行的租赁合同' };
    }
    
    // 获取租赁产品
    const leaseProduct = (leaseProducts as any[]).find(
      p => p.vehicleId === vehicleId && p.region === region
    );
    
    if (!leaseProduct) {
      return { success: false, message: '该车辆不支持租赁' };
    }
    
    // 检查阶级要求
    if (leaseProduct.requiredClass && !meetsClassRequirement(vitality.identity.currentClass, leaseProduct.requiredClass)) {
      return { success: false, message: '您的阶级不符合租赁要求' };
    }
    
    // 检查信用分
    if (leaseProduct.creditScoreRequired && vitality.metrics.creditScore < leaseProduct.creditScoreRequired) {
      return { 
        success: false, 
        message: `信用分不足，需要 ${leaseProduct.creditScoreRequired}，当前 ${vitality.metrics.creditScore}` 
      };
    }
    
    // 检查首付资金
    if (vitality.metrics.gold < leaseProduct.downPayment) {
      return { success: false, message: `首付资金不足，需要 $${leaseProduct.downPayment}` };
    }
    
    // 创建租赁状态
    const leaseState: ActiveLease = {
      leaseProductId: leaseProduct.id,
      vehicleId,
      weeklyPayment: leaseProduct.weeklyPayment,
      downPayment: leaseProduct.downPayment,
      remainingTurns: leaseProduct.termTurns,
      totalTurns: leaseProduct.termTurns,
      mileageUsed: 0,
      mileageLimit: leaseProduct.mileageLimit,
      wearAndTear: 0,
      region,
      startTurn: vitality.time.currentTurn
    };
    
    // 扣除首付
    set({
      activeLease: leaseState,
      vitality: {
        ...vitality,
        metrics: {
          ...vitality.metrics,
          gold: vitality.metrics.gold - leaseProduct.downPayment
        }
      }
    });
    
    // 添加交易记录
    state.addTransaction('BILL', -leaseProduct.downPayment, `租赁首付: ${leaseProduct.name}`);
    
    return { 
      success: true, 
      message: `租赁成功！首付 $${leaseProduct.downPayment}，每周 $${leaseProduct.weeklyPayment}，租期 ${leaseProduct.termTurns} 回合` 
    };
  },
  
  processLeaseTurn: () => {
    const state = get();
    const lease = state.activeLease;
    
    if (!lease) {
      return { isExpired: false, paymentSuccess: true };
    }
    
    // 检查是否有足够资金支付周供
    const currentGold = state.vitality.metrics.gold;
    const canPay = currentGold >= lease.weeklyPayment;
    
    if (!canPay) {
      // 无法支付，租赁合同违约
      set({ activeLease: null });
      return { 
        isExpired: true, 
        paymentSuccess: false, 
        message: '无法支付租赁费用，合同已终止' 
      };
    }
    
    // 扣除周供
    const newRemainingTurns = lease.remainingTurns - 1;
    const isExpired = newRemainingTurns <= 0;
    
    set({
      activeLease: isExpired ? null : { ...lease, remainingTurns: newRemainingTurns },
      vitality: {
        ...state.vitality,
        metrics: {
          ...state.vitality.metrics,
          gold: currentGold - lease.weeklyPayment
        }
      }
    });
    
    // 添加交易记录
    state.addTransaction('BILL', -lease.weeklyPayment, `租赁周供 (${lease.remainingTurns}周剩余)`);
    
    return {
      isExpired,
      paymentSuccess: true,
      message: isExpired ? '租赁期已满，请归还车辆' : `已支付周供 $${lease.weeklyPayment}，剩余 ${newRemainingTurns} 回合`
    };
  },
  
  endLease: (returnCondition) => {
    const state = get();
    const lease = state.activeLease;
    
    if (!lease) {
      return { success: false, finalCost: 0, message: '没有正在进行的租赁' };
    }
    
    // 根据归还条件计算磨损程度
    const conditionModifiers = {
      'good': 0.3,    // 良好：30%磨损
      'fair': 0.6,    // 一般：60%磨损
      'poor': 0.9     // 较差：90%磨损
    };
    const wearLevel = conditionModifiers[returnCondition] || 0.5;
    
    // 计算额外费用
    let extraCost = 0;
    const messages: string[] = [];
    
    // 超里程费用
    if (lease.mileageUsed > lease.mileageLimit) {
      const overage = lease.mileageUsed - lease.mileageLimit;
      const overageCost = overage * 3; // 每单位里程$3
      extraCost += overageCost;
      messages.push(`超里程费用: $${overageCost}`);
    }
    
    // 磨损费用（基于归还条件）
    const wearPenaltyThreshold = (vehicleRules as any).lease.wearAndTearThreshold;
    if (wearLevel > wearPenaltyThreshold) {
      const wearPenaltyRate = (vehicleRules as any).lease.wearAndTearPenaltyRate;
      const wearCost = Math.floor(lease.downPayment * wearPenaltyRate * wearLevel);
      extraCost += wearCost;
      messages.push(`车辆磨损费: $${wearCost} (${returnCondition})`);
    }
    
    // 提前终止费用（如果还有剩余租期）
    if (lease.remainingTurns > 0) {
      const earlyTerminationFee = lease.weeklyPayment * 2;
      extraCost += earlyTerminationFee;
      messages.push(`提前终止费: $${earlyTerminationFee}`);
    }
    
    // 检查是否有足够资金支付额外费用
    const currentGold = state.vitality.metrics.gold;
    if (currentGold < extraCost) {
      return { 
        success: false, 
        finalCost: extraCost, 
        message: `资金不足支付额外费用 $${extraCost}` 
      };
    }
    
    // 扣除费用并清除租赁状态
    set({
      activeLease: null,
      vitality: {
        ...state.vitality,
        metrics: {
          ...state.vitality.metrics,
          gold: currentGold - extraCost
        }
      }
    });
    
    // 添加交易记录
    if (extraCost > 0) {
      state.addTransaction('BILL', -extraCost, `租赁归还费用`);
    }
    
    return {
      success: true,
      finalCost: extraCost,
      message: extraCost > 0 
        ? `租赁结束。额外费用: $${extraCost}。${messages.join(', ')}`
        : '租赁正常结束，无额外费用'
    };
  },

  // ============================================================================
  // 置换系统
  // ============================================================================
  
  calculateTradeInValue: (vehicleId, region) => {
    const vehicle = getVehicleConfig(vehicleId);
    if (!vehicle) return 0;
    
    // 基础售价
    const baseRate = vehicle.sellPriceRate?.default || 0.6;
    const regionRate = region === 'SLUMS' 
      ? (vehicle.sellPriceRate?.slums || baseRate)
      : baseRate;
    
    // 置换加成
    const tradeInModifier = (vehicleRules as any).tradeIn.rateModifier;
    const finalRate = regionRate + tradeInModifier;
    
    return Math.floor(vehicle.price * finalRate);
  },
  
  tradeInVehicle: (oldVehicleId, newVehicleId, region) => {
    const state = get();
    const { vitality, inventory } = state;
    
    // 检查是否拥有旧车
    if (!inventory.includes(oldVehicleId)) {
      return { success: false, tradeInValue: 0, finalPrice: 0, message: '您不拥有该车辆' };
    }
    
    // 计算置换价值（直接计算，避免递归调用）
    const oldVehicle = getVehicleConfig(oldVehicleId);
    if (!oldVehicle) {
      return { success: false, tradeInValue: 0, finalPrice: 0, message: '旧车信息不存在' };
    }
    const baseRate = oldVehicle.sellPriceRate?.default || 0.6;
    const regionRate = region === 'SLUMS' 
      ? (oldVehicle.sellPriceRate?.slums || baseRate)
      : baseRate;
    const tradeInModifier = (vehicleRules as any).tradeIn?.rateModifier || 0.05;
    const tradeInValue = Math.floor(oldVehicle.price * (regionRate + tradeInModifier));
    
    // 获取新车价格
    const newVehicle = getVehicleConfig(newVehicleId);
    if (!newVehicle) {
      return { success: false, tradeInValue: 0, finalPrice: 0, message: '新车信息不存在' };
    }
    
    // 计算最终价格
    const finalPrice = Math.max(0, newVehicle.price - tradeInValue);
    
    // 检查资金
    if (vitality.metrics.gold < finalPrice) {
      return { 
        success: false, 
        tradeInValue, 
        finalPrice, 
        message: `资金不足，还需 $${finalPrice}` 
      };
    }
    
    // 检查阶级要求
    if (newVehicle.requiredClass && !meetsClassRequirement(vitality.identity.currentClass, newVehicle.requiredClass)) {
      return { success: false, tradeInValue: 0, finalPrice: 0, message: '阶级不符合要求' };
    }
    
    // 执行置换
    const newInventory = inventory
      .filter(id => id !== oldVehicleId)
      .concat(newVehicleId);
    
    set({
      inventory: newInventory,
      vitality: {
        ...vitality,
        metrics: {
          ...vitality.metrics,
          gold: vitality.metrics.gold - finalPrice
        }
      }
    });
    
    // 添加交易记录
    state.addTransaction('INCOME', tradeInValue, `置换旧车抵扣`);
    state.addTransaction('MISC', -newVehicle.price, `购买新车: ${newVehicle.nameKey}`);
    
    return {
      success: true,
      tradeInValue,
      finalPrice,
      message: `置换成功！旧车抵扣 $${tradeInValue}，实际支付 $${finalPrice}`
    };
  },

  // ============================================================================
  // 信用检查
  // ============================================================================
  
  checkCreditForPurchase: (vehicleId) => {
    const state = get();
    const { vitality } = state;
    const vehicle = getVehicleConfig(vehicleId);
    
    if (!vehicle) {
      return { 
        canPurchase: false, 
        creditCheckPassed: false, 
        rateModifier: 0, 
        message: '车辆信息不存在' 
      };
    }
    
    // 如果没有信用要求，直接通过
    if (!vehicle.creditScoreRequired) {
      return {
        canPurchase: true,
        creditCheckPassed: true,
        rateModifier: 0,
        message: '无需信用检查'
      };
    }
    
    const requiredScore = vehicle.creditScoreRequired;
    const currentScore = vitality.metrics.creditScore;
    const creditConfig = (vehicleRules as any).creditCheck;
    
    // 检查是否通过信用检查
    const passed = currentScore >= requiredScore;
    
    // 计算利率调整
    let rateModifier = 0;
    if (currentScore >= creditConfig.standardRateThreshold) {
      rateModifier = creditConfig.rateModifiers.standard;
    } else if (currentScore >= creditConfig.highRateThreshold) {
      rateModifier = creditConfig.rateModifiers.high;
    } else if (currentScore >= creditConfig.rejectThreshold) {
      rateModifier = creditConfig.rateModifiers.subprime;
    } else {
      rateModifier = creditConfig.rateModifiers.subprime;
    }
    
    return {
      canPurchase: passed,
      creditCheckPassed: passed,
      rateModifier,
      message: passed 
        ? `信用检查通过 (${currentScore}/${requiredScore})`
        : `信用分不足，需要 ${requiredScore}，当前 ${currentScore}`,
      requiredScore,
      currentScore
    };
  },

  // ============================================================================
  // 车辆效果处理
  // ============================================================================
  
  processVehicleEffects: () => {
    const state = get();
    const { inventory } = state;
    
    let hpChange = 0;
    let sanChange = 0;
    let addictionChange = 0;
    
    // 获取所有车辆效果
    const vehicleEffects = inventory
      .filter(id => id.startsWith('CAR_') || id === 'KEY_CAR')
      .map(id => getVehicleConfig(id)?.effects)
      .filter(Boolean);
    
    // 汇总效果
    for (const effects of vehicleEffects) {
      if (effects.hp) hpChange += effects.hp;
      if (effects.san) sanChange += effects.san;
      if (effects.addiction) addictionChange += effects.addiction;
    }
    
    return { hpChange, sanChange, addictionChange };
  }
});
