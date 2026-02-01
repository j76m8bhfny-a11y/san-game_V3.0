import { StateCreator } from 'zustand';
import { GameState, Housing, ActiveHousingState, RegionID } from '@/types/schema';
import housingData from '@/assets/data/housing.json';

export interface HousingSlice {
  // Actions
  rentHousing: (housingId: string) => { success: boolean; message: string };
  buyHousing: (housingId: string) => { success: boolean; message: string };
  checkRegionAccess: (region: RegionID) => boolean; // 检查是否有权在某地工作/买房
}

export const createHousingSlice: StateCreator<any, [], [], HousingSlice> = (set, get) => ({
  
  checkRegionAccess: (region) => {
    // 只有在当前居住地才能工作 (流浪汉除外)
    const { activeHousing } = get() as GameState;
    
    // 如果没有房产（通常意味着流浪），或者去的是贫民窟，则允许
    if (!activeHousing || region === RegionID.Slums) return true; 
    
    // 否则必须在居住地
    return activeHousing.region === region;
  },

  rentHousing: (housingId) => {
    // ✅ 关键修复：使用 as any 获取 Store 实例以访问 Actions (addTransaction)
    const state = get() as any;
    // 获取只读数据用于判断
    const gameState = state as GameState;
    
    const house = housingData.find(h => h.id === housingId) as Housing;
    
    if (!house || !house.rentConfig) return { success: false, message: "房源无效" };
    
    // 1. 检查阶级
    const currentClass = gameState.vitality.identity.currentClass;
    if (currentClass !== house.requiredClass && house.requiredClass !== 'HOMELESS') {
      return { success: false, message: "你的阶级身份不符，房东拒绝签约。" };
    }

    // 2. 检查资金 (首周租金 + 押金)
    const firstWeekRent = house.rentConfig.weeklyCosts.reduce((sum, item) => sum + item.baseAmount, 0);
    const upfrontCost = house.rentConfig.deposit + firstWeekRent;

    if (gameState.vitality.metrics.gold < upfrontCost) {
      return { success: false, message: `资金不足，首付需要 $${upfrontCost}` };
    }

    // 3. 执行交易 (调用 VitalitySlice 的 Action)
    state.addTransaction('HOUSING', -upfrontCost, `签约租赁: ${house.name} (含押金)`);

    // 4. 更新状态
    const newHousing: ActiveHousingState = {
      definitionId: house.id,
      type: 'RENT',
      name: house.name,
      region: house.region,
      defenseLevel: house.defenseLevel,
      regenHp: house.regenHp
      // dailyCost 已被移除
    };

    set({ activeHousing: newHousing });
    return { success: true, message: "签约成功！欢迎入住。" };
  },

  buyHousing: (housingId) => {
    // ✅ 关键修复：使用 as any 获取 Store 实例以访问 Actions
    const state = get() as any;
    const gameState = state as GameState;

    const house = housingData.find(h => h.id === housingId) as Housing;

    if (!house || !house.buyConfig) return { success: false, message: "该房产不可出售" };

    // 1. 检查阶级
    if (gameState.vitality.identity.currentClass !== house.requiredClass) {
      return { success: false, message: "你的社会信用等级不足以购买此处的房产。" };
    }

    // 2. 计算首付
    const downPayment = house.buyConfig.price * house.buyConfig.downPaymentRate;
    if (gameState.vitality.metrics.gold < downPayment) {
      return { success: false, message: `首付不足，需要 $${downPayment}` };
    }

    // 3. 申请房贷 (调用 BankSlice 的 Action)
    // 注意：takeMortgage 是 Action，必须从 store 实例调用
    const loanAmount = house.buyConfig.price - downPayment;
    const loanResult = state.takeMortgage(
      loanAmount, 
      house.buyConfig.mortgageTermTurns, 
      house.buyConfig.interestRate
    );

    if (!loanResult.success) {
      return { success: false, message: `银行拒绝放贷: ${loanResult.message}` };
    }

    // 4. 支付首付
    state.addTransaction('HOUSING', -downPayment, `购房首付: ${house.name}`);

    // 5. 更新状态
    const newHousing: ActiveHousingState = {
      definitionId: house.id,
      type: 'OWN',
      name: house.name,
      region: house.region,
      loanId: loanResult.loanId, // 绑定房贷ID
      defenseLevel: house.defenseLevel,
      regenHp: house.regenHp
    };

    set({ activeHousing: newHousing });
    return { success: true, message: "恭喜置业！你拥有了自己的家...和巨额债务。" };
  }
});