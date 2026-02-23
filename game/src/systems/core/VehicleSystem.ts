/**
 * VehicleSystem - 车辆系统
 * 
 * 处理：
 * 1. 每周车辆维护费
 * 2. 随机故障
 * 3. 停车罚单
 * 4. 油价波动
 */

import { GameSystem, SystemResult } from '../types';
import { random } from '@/utils/random';
import vehiclesData from '@/assets/data/vehicles.json';

// 车辆维护费配置（每周）
const MAINTENANCE_COSTS: Record<string, number> = {
  'TIER_1': 20,    // 破车/皮卡
  'TIER_2': 50,    // 轿车
  'TIER_3': 100,   // SUV
  'TIER_4': 200    // 豪车
};

// 故障概率（每周）
const BREAKDOWN_CHANCES: Record<string, number> = {
  'TIER_1': 0.15,  // 15%
  'TIER_2': 0.08,  // 8%
  'TIER_3': 0.05,  // 5%
  'TIER_4': 0.03   // 3%
};

// 故障修理费
const REPAIR_COSTS: Record<string, number> = {
  'TIER_1': 100,
  'TIER_2': 300,
  'TIER_3': 600,
  'TIER_4': 2000
};

// 罚单概率（每周）
const TICKET_CHANCE = 0.05; // 5%
const TICKET_AMOUNT = 50;

export const VehicleSystem: GameSystem = {
  id: 'VEHICLE_SYSTEM',
  priority: 88, // 在就业系统之后，账单系统之前

  processTurn: ({ state }): SystemResult => {
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    const inventory = state.inventory || [];
    const currentTurn = state.vitality.time.currentTurn;

    // 查找玩家拥有的车辆
    const vehicleIds = inventory.filter(id => id.startsWith('VEH_') || id.startsWith('CAR_'));
    
    if (vehicleIds.length === 0) {
      return result;
    }

    // 处理每辆车
    vehicleIds.forEach(vehicleId => {
      // 获取车辆配置
      const vehicleConfig = (vehiclesData as any[]).find(v => v.id === vehicleId);
      if (!vehicleConfig) return;

      const tier = vehicleConfig.tags?.find((t: string) => t.startsWith('TIER_')) || 'TIER_1';

      // 1. 扣除维护费
      const maintenanceCost = MAINTENANCE_COSTS[tier] || 20;
      result.newTransactions!.push({
        id: `veh_maint_${vehicleId}_${currentTurn}`,
        turn: currentTurn,
        category: 'BILL',
        amount: -maintenanceCost,
        description: `${vehicleConfig.nameKey || vehicleId} 维护费`,
        timestamp: Date.now()
      });
      result.logs.push(`支付车辆维护费 $${maintenanceCost}`);

      // 2. 检查故障
      const breakdownChance = BREAKDOWN_CHANCES[tier] || 0.1;
      if (random() < breakdownChance) {
        const repairCost = REPAIR_COSTS[tier] || 100;
        result.newTransactions!.push({
          id: `veh_breakdown_${vehicleId}_${currentTurn}`,
          turn: currentTurn,
          category: 'BILL',
          amount: -repairCost,
          description: `${vehicleConfig.nameKey || vehicleId} 故障修理`,
          timestamp: Date.now()
        });
        result.notes.push(`🚗 车辆故障！修理费 $${repairCost}`);
        result.logs.push(`车辆故障，支付修理费 $${repairCost}`);
      }

      // 3. 检查停车罚单（如果是破车，概率更高）
      let ticketChance = TICKET_CHANCE;
      if (tier === 'TIER_1') {
        ticketChance *= 2; // 破车更容易被针对
      }
      
      if (random() < ticketChance) {
        result.newTransactions!.push({
          id: `veh_ticket_${vehicleId}_${currentTurn}`,
          turn: currentTurn,
          category: 'BILL',
          amount: -TICKET_AMOUNT,
          description: '停车罚单',
          timestamp: Date.now()
        });
        result.notes.push(`🅿️ 收到停车罚单 $${TICKET_AMOUNT}`);
        result.logs.push(`违规停车罚款 $${TICKET_AMOUNT}`);
      }
    });

    return result;
  }
};

export default VehicleSystem;
