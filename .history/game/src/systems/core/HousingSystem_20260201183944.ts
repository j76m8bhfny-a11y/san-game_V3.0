import { GameSystem, SystemResult } from '../types';
import { Housing, LedgerRecord } from '@/types/schema';
import housingData from '@/assets/data/housing.json';

export const HousingSystem: GameSystem = {
  id: 'HOUSING',

  processTurn: ({ state }) => {
    const { activeHousing, vitality, bank } = state;
    const result: SystemResult = {
      updates: {}, // HousingSystem 不直接修改 gold，而是通过 Transaction
      newTransactions: [],
      logs: [],
      notes: []
    };

    // 1. 如果无房，不仅跳过，可能还要处理流浪惩罚 (在 StatRules 里做)
    if (!activeHousing) {
      result.logs.push("露宿街头: HP/SAN 恢复受阻");
      return result;
    }

    // 2. 查找原始配置 (为了获取费用列表)
    const housingConfig = housingData.find(h => h.id === activeHousing.definitionId) as Housing;
    if (!housingConfig) return result; // 数据错误保护

    // 3. 处理回血 (Benefit)
    if (activeHousing.regenHp > 0) {
      // ✅ 修复: 使用类型断言 as any 绕过 Partial 检查，或者构造完整的结构
      // 因为 SystemRegistry 会做深度合并，这里给部分结构是安全的
      result.updates.vitality = {
        metrics: { 
          hp: Math.min(vitality.metrics.maxHp, vitality.metrics.hp + activeHousing.regenHp) 
        }
      } as any; 
      
      result.logs.push(`家中休息: HP +${activeHousing.regenHp}`);
    }

    // 4. 处理费用 (Cost)
    
    // === A. 租赁模式 ===
    if (activeHousing.type === 'RENT' && housingConfig.rentConfig) {
      let totalRent = 0;
      
      housingConfig.rentConfig.weeklyCosts.forEach(cost => {
        // 生成账单明细
        result.newTransactions!.push({
          id: Math.random().toString(), // 临时ID，Registry会重新生成或直接用
          turn: vitality.time.currentTurn,
          category: cost.key === 'RENT' ? 'HOUSING' : 'MISC', // 可以细分
          amount: -cost.baseAmount,
          description: `${activeHousing.name}: ${cost.label}`,
          timestamp: Date.now()
        });
        totalRent += cost.baseAmount;
      });

      // 检查是否违约 (钱不够付)
      if (vitality.metrics.gold < totalRent) {
        result.notes.push("【警告】你付不起本周房租！房东正在磨刀。");
        // 这里可以添加 "evictionCount"，积累几次后 activeHousing = null
      }
    }

    // === B. 置业模式 ===
    if (activeHousing.type === 'OWN' && housingConfig.buyConfig) {
      // B1. 杂费 (税、物业、保险)
      housingConfig.buyConfig.weeklyCosts.forEach(cost => {
        result.newTransactions!.push({
          id: Math.random().toString(),
          turn: vitality.time.currentTurn,
          category: 'HOUSING',
          amount: -cost.baseAmount,
          description: `${activeHousing.name}: ${cost.label}`,
          timestamp: Date.now()
        });
      });

      // B2. 房贷 (自动扣款)
      if (activeHousing.loanId) {
        // 调用 BankSlice 的方法 (我们假设 state 里有这个方法，或者通过 helper 调用)
        // 注意：System 只能读 state，通常不能调 action。
        // 但这里我们需要产生副作用(还款)。
        // 理想做法：返回一个 "BankAction" 给 Registry 执行。
        // 妥协做法：在 Registry 里注入 bank methods，或者在这里只是计算金额，由 Registry 统一扣。
        
        // 由于架构限制，我们假设 BankSlice 提供了 helper `calculateInstallment` 
        // 真正的扣款(减少贷款余额)应该由 Registry 处理，或者我们接受这里只是扣 Gold，
        // 贷款余额的更新由 BankSystem 在 processTurn 里处理？
        
        // >> 最佳方案: 
        // HousingSystem 只负责生成 "房贷账单(Transaction)"。
        // BankSystem 负责扫描账单，如果发现有 "MORTGAGE_PAYMENT" 的记录，就减少贷款余额。
        
        // 既然我们现在改不了 BankSystem，我们先模拟生成账单：
        // 估算月供 (简单算法)
        const principal = housingConfig.buyConfig.price * (1 - housingConfig.buyConfig.downPaymentRate);
        const rate = housingConfig.buyConfig.interestRate;
        const weeklyPayment = Math.floor(principal * rate * 1.5); // 临时估算

        result.newTransactions!.push({
          id: Math.random().toString(),
          turn: vitality.time.currentTurn,
          category: 'BANK',
          amount: -weeklyPayment, // 扣钱
          description: `房贷自动还款`,
          timestamp: Date.now()
        });
      }
    }

    return result;
  }
};