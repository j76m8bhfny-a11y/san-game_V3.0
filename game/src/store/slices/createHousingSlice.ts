import { StateCreator } from 'zustand';
import { GameState, Housing, ActiveHousingState, RegionID, PlayerClass, ActiveHousing } from '@/types/schema';
import housingData from '@/assets/data/housing.json';




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

export const createHousingSlice: StateCreator<any, [], [], HousingSlice> = (set, get) => ({
  
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
    
    // 1. 检查是否已有房产
    if (gameState.activeHousing) {
      return { success: false, message: `你已有住所 (${gameState.activeHousing.name})，请先退租或出售。` };
    }
    
    // 2. 检查阶级
    const currentClass = gameState.vitality.identity.currentClass;
    if (currentClass !== house.requiredClass) {
      return { success: false, message: "你的阶级身份不符，房东拒绝签约。" };
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
    
    // 1. 检查是否已有房产
    if (gameState.activeHousing) {
      return { success: false, message: `你已有住所 (${gameState.activeHousing.name})，请先退租或出售。` };
    }
    
    // 2. 检查阶级
    const currentClass = gameState.vitality.identity.currentClass;
    if (currentClass !== house.requiredClass && house.requiredClass !== PlayerClass.Homeless) {
      return { success: false, message: "你的社会信用等级不足以购买此处的房产。" };
    }
    
    // 3. 计算首付（向上取整，避免浮点精度问题）
    const downPayment = Math.ceil(house.buyConfig.price * house.buyConfig.downPaymentRate);
    if (gameState.vitality.metrics.gold < downPayment) {
      return { success: false, message: `首付不足，需要 $${downPayment}` };
    }
    
    // 4. 申请房贷
    const loanAmount = house.buyConfig.price - downPayment;
    const loanResult = state.takeMortgage(
      loanAmount, 
      house.buyConfig.mortgageTermTurns, 
      house.buyConfig.interestRate
    );
    
    if (!loanResult.success) {
      return { success: false, message: `银行拒绝放贷: ${loanResult.message}` };
    }
    
    // 5. 支付首付
    const txResult = state.addTransaction('HOUSING', -downPayment, `购房首付: ${house.name}`);
    if (!txResult.success) {
      // 如果支付失败，需要取消贷款
      state.clearLoan(loanResult.loanId!);
      return { success: false, message: "资金不足以支付首付，已取消贷款申请。" };
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
    
    if (housing.type === 'RENT') {
      // 退租：返还押金
      const deposit = houseData?.rentConfig?.deposit || 0;
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
      const remainingDebt = loan ? loan.principal + loan.interest : 0;
      
      // 简化的卖房逻辑：售价 - 剩余债务 = 到手金额
      const sellPrice = buyConfig.price * 0.9; // 9折出售
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
