import { GameSystem, SystemResult } from '../../../systems/types';

export const HousingSystem: GameSystem = {
  id: 'HOUSING',

  processDay: ({ state }) => {
    const { activeHousing, gold } = state;
    const result: SystemResult = {
      updates: {},
      logs: [],
      notes: []
    };

    // 如果没有房产，直接跳过
    if (!activeHousing) return result;

    const rentCost = activeHousing.dailyCost;

    // 如果是免费房产或无维护费，跳过
    if (rentCost <= 0) return result;

    // --- 核心逻辑: 房租扣除与违约判定 ---
    
    if (gold < rentCost) {
      // 💀 违约逻辑: 没钱付房租 -> 驱逐
      // 注意：这里我们不再直接调用 set()，而是返回要更新的字段
      result.updates = {
        activeHousing: null, // 失去房产
        activeJob: null      // 同时也失去工作 (根据你之前的设定)
      };
      
      result.logs.push(`违约: 失去房产与工作`);
      result.notes.push(`[严重] 资金不足以支付 $${rentCost} 房租，你被房东赶了出来！失去住所和工作。`);
      
    } else {
      // ✅ 正常扣费逻辑
      result.updates = {
        gold: gold - rentCost
      };
      
      // 记录日志
      // result.logs.push(`房租扣费: -$${rentCost}`); // 如果觉得太啰嗦可以注释掉
      result.notes.push(`房租扣费: -$${rentCost}`);
    }

    return result;
  }
};