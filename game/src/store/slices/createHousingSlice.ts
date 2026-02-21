import { StateCreator } from 'zustand';
import { GameState, Housing, ActiveHousingState, RegionID } from '@/types/schema';
import { StoreState } from '@/types/store';
import housingData from '@/assets/data/housing.json';
import housingRules from '@/assets/data/rules/housing_rules.json';
import jobRules from '@/assets/data/rules/job_rules.json';




export interface HousingSlice {
  // State (通过 PlayerSlice 的 activeHousing 存储)
  
  // Actions
  rentHousing: (housingId: string) => { success: boolean; message: string };
  buyHousing: (housingId: string) => { success: boolean; message: string };
  moveOut: () => { success: boolean; message: string; refund?: number };
  
  // Queries
  getCurrentHousing: () => ActiveHousingState | undefined;
  getTotalWeeklyHousingCost: () => number;
  checkRegionAccess: (region: RegionID) => boolean;
}

export const createHousingSlice: StateCreator<StoreState, [], [], HousingSlice> = (set, get) => ({
  
  // ===== Queries =====
  
  getCurrentHousing: () => {
    const { activeHousing } = get() as GameState;
    return activeHousing || undefined;
  },
  
  getTotalWeeklyHousingCost: () => {
    const housing = get().getCurrentHousing();
    if (!housing) return 0;
    return housing.weeklyCosts?.reduce((sum: number, item: { baseAmount: number }) => sum + item.baseAmount, 0) || 0;
  },
  
  checkRegionAccess: (_region: RegionID) => {
    // 保持现状：只有车辆限制区域，不通过房产限制
    // 房产只影响工作/休息等玩法，不影响物理移动
    return true;
  },
  
  // ===== Actions =====
  
  rentHousing: (housingId) => {
    const state = get() as any;
    const gameState = state as GameState;
    
    const house = housingData.find(h => h.id === housingId) as Housing;
    if (!house || !house.rentConfig) return { success: false, message: "房源无效" };
    
    // 0. 检查阶级（向下兼容：高阶级可以租低阶级房子）
    const playerWeight = jobRules.classWeights[gameState.vitality.identity.currentClass as keyof typeof jobRules.classWeights] ?? 0;
    const houseWeight = jobRules.classWeights[house.requiredClass as keyof typeof jobRules.classWeights] ?? 99;
    if (playerWeight < houseWeight) {
      return { success: false, message: "你的身份不足以入住此地。" };
    }
    
    // 1. 检查是否已有房产
    if (gameState.activeHousing) {
      return { success: false, message: `你已有住所 (${gameState.activeHousing.name})，请先退租或出售。` };
    }
    
    // 2. 资本家区域不支持租赁
    if (house.region === RegionID.Downtown) {
      return { success: false, message: "金融核心区的房产只售不租。" };
    }
    
    // 3. 检查资金 (首周租金 + 押金)
    const firstWeekRent = house.rentConfig.weeklyCosts.reduce((sum, item) => sum + item.baseAmount, 0);
    const upfrontCost = house.rentConfig.deposit + firstWeekRent;
    
    if (gameState.vitality.metrics.gold < upfrontCost) {
      return { success: false, message: `资金不足，首付需要 $${upfrontCost}` };
    }
    
    // 4. 执行交易
    const txResult = state.addTransaction('HOUSING', -upfrontCost, `签约租赁: ${house.name} (押金$${house.rentConfig.deposit} + 首周租金)`);
    if (!txResult.success) {
      return { success: false, message: "资金不足以支付首付。" };
    }
    
    // 5. 更新状态
    const newHousing: ActiveHousingState = {
      definitionId: house.id,
      type: 'RENT',
      name: house.name,
      region: house.region,
      defenseLevel: house.defenseLevel,
      regenHp: house.regenHp,
      weeklyCosts: house.rentConfig.weeklyCosts
    };
    
    set({ activeHousing: newHousing });
    
    return { success: true, message: `签约成功！欢迎入住 ${house.name}。` };
  },
  
  buyHousing: (housingId) => {
    const state = get() as any;
    const gameState = state as GameState;
    
    const house = housingData.find(h => h.id === housingId) as Housing;
    if (!house || !house.buyConfig) return { success: false, message: "该房产不可出售" };
    
    // 0. 检查阶级（向下兼容：高阶级可以买低阶级房子）
    const playerWeight = jobRules.classWeights[gameState.vitality.identity.currentClass as keyof typeof jobRules.classWeights] ?? 0;
    const houseWeight = jobRules.classWeights[house.requiredClass as keyof typeof jobRules.classWeights] ?? 99;
    if (playerWeight < houseWeight) {
      return { success: false, message: "你的身份不足以购买此地产业。" };
    }
    
    // ✅ 检查信用分（针对中产/资本家房产）
    if (house.requiredClass === 'MIDDLE' || house.requiredClass === 'CAPITALIST') {
      const currentScore = gameState.vitality.metrics.creditScore;
      let effectiveScore = currentScore;
      
      // 检查催收Debuff影响
      const collectionBuff = gameState.vitality.activeBuffs?.find((b: any) => b.id?.includes('buff_medical_collection'));
      if (collectionBuff?.data?.creditScoreModifier) {
        effectiveScore += collectionBuff.data.creditScoreModifier;
      }
      
      // 中产房产需要信用分 >= 600，资本家房产 >= 700
      const minCreditScore = house.requiredClass === 'CAPITALIST' ? 700 : 600;
      
      if (effectiveScore < minCreditScore) {
        const reason = collectionBuff
          ? `信用检查失败 (当前: ${currentScore}, 有效: ${effectiveScore}, 需要: ${minCreditScore})。医疗催收记录使你无法获得房贷批准。`
          : `信用检查失败 (当前: ${currentScore}, 需要: ${minCreditScore})。银行拒绝了你的房贷申请。`;
        return { success: false, message: reason };
      }
    }
    
    // 1. 检查是否已有房产
    if (gameState.activeHousing) {
      return { success: false, message: `你已有住所 (${gameState.activeHousing.name})，请先退租或出售。` };
    }
    
    // 2. 验证首付比例
    if (house.buyConfig.downPaymentRate <= 0 || house.buyConfig.downPaymentRate > 1) {
      return { success: false, message: "首付比例配置异常" };
    }
    
    // 3. 计算首付（向上取整，避免浮点精度问题）
    const downPayment = Math.ceil(house.buyConfig.price * house.buyConfig.downPaymentRate);
    if (gameState.vitality.metrics.gold < downPayment) {
      return { success: false, message: `首付不足，需要 $${downPayment}` };
    }
    
    // 4. 先检查首付资金是否充足
    if (gameState.vitality.metrics.gold < downPayment) {
      return { success: false, message: `首付不足，需要 $${downPayment}` };
    }
    
    // 5. 先支付首付，成功后再申请房贷（避免有房无贷或有贷无房）
    const txResult = state.addTransaction('HOUSING', -downPayment, `购房首付: ${house.name}`);
    if (!txResult.success) {
      return { success: false, message: "资金不足以支付首付。" };
    }
    
    // 6. 首付成功后再申请房贷
    const loanAmount = house.buyConfig.price - downPayment;
    const loanResult = state.takeMortgage(
      loanAmount, 
      house.buyConfig.mortgageTermTurns, 
      house.buyConfig.interestRate
    );
    
    if (!loanResult.success) {
      // 房贷申请失败，回滚首付（这种情况极少见）
      state.addTransaction('HOUSING', downPayment, `购房首付退款: ${house.name}`);
      return { success: false, message: `银行拒绝放贷: ${loanResult.message}，首付已退回。` };
    }
    
    // 6. 更新状态
    const newHousing: ActiveHousingState = {
      definitionId: house.id,
      type: 'OWN',
      name: house.name,
      region: house.region,
      loanId: loanResult.loanId,
      defenseLevel: house.defenseLevel,
      regenHp: house.regenHp,
      weeklyCosts: house.buyConfig.weeklyCosts
    };
    
    set({ activeHousing: newHousing });
    
    return { success: true, message: `恭喜置业！${house.name} 已加入你的资产组合。` };
  },
  
  moveOut: () => {
    const state = get() as any;
    const gameState = state as GameState;
    const housing = gameState.activeHousing;
    
    if (!housing) {
      return { success: false, message: "你没有住所。" };
    }
    
    // 查找原始房源数据获取押金信息
    const houseData = housingData.find(h => h.id === housing.definitionId) as Housing;
    
    if (!houseData) {
      return { success: false, message: "房产数据异常，无法找到原始房源信息。" };
    }
    
    if (housing.type === 'RENT') {
      // 退租：返还押金
      const deposit = houseData.rentConfig?.deposit || 0;
      if (deposit > 0) {
        state.addTransaction('HOUSING', deposit, `退租返还押金: ${housing.name}`);
      }
      
      set({ activeHousing: null });
      
      return { success: true, message: `已退租 ${housing.name}。`, refund: deposit };
      
    } else {
      // 卖房：返还剩余价值
      const buyConfig = houseData?.buyConfig;
      if (!buyConfig) {
        return { success: false, message: "房产数据异常。" };
      }
      
      // 找到关联房贷
      const loan = gameState.bank.activeLoans.find(l => l.id === housing.loanId);
      
      // 如果存在loanId但找不到贷款记录，说明数据异常
      if (housing.loanId && !loan) {
        return { success: false, message: "房贷数据异常，无法找到关联贷款记录。" };
      }
      
      const remainingDebt = loan ? loan.principal + loan.interest : 0;
      
      // 简化的卖房逻辑：售价 - 剩余债务 = 到手金额
      const sellPrice = buyConfig.price * (housingRules.sell?.discountRate ?? 0.9); // 从配置读取折扣率，默认9折
      const netProceeds = sellPrice - remainingDebt;
      
      if (netProceeds > 0) {
        const txResult = state.addTransaction('HOUSING', netProceeds, `出售房产: ${housing.name}`);
        if (!txResult.success) {
          console.warn('出售房产收入记账失败');
        }
      } else if (netProceeds < 0) {
        // 资不抵债，需要额外支付
        if (gameState.vitality.metrics.gold >= Math.abs(netProceeds)) {
          const txResult = state.addTransaction('HOUSING', netProceeds, `出售房产(资不抵债): ${housing.name}`);
          if (!txResult.success) {
            return { success: false, message: `资金不足以支付卖房差额 $${Math.abs(netProceeds).toFixed(0)}。` };
          }
        } else {
          return { success: false, message: `资不抵债！出售需补足 $${Math.abs(netProceeds).toFixed(0)}，资金不足。` };
        }
      }
      
      // 结清房贷
      if (loan) {
        state.clearLoan(housing.loanId);
      }
      
      set({ activeHousing: null });
      
      return { success: true, message: `已出售 ${housing.name}。`, refund: Math.max(0, netProceeds) };
    }
  }
});
