import { GameSystem, SystemResult } from '../types';
import { PlayerClass } from '@/types/schema';
import { processTurnInterest } from '@/logic/bank';
import { Config } from '@/config';
import bankNarratives from '@/assets/data/rules/bank_narratives.json';
import prisonRules from '@/assets/data/rules/prison_rules.json';
import { calculateDynamicSentence } from '@/types/prisonRules';

/**
 * 从消息数组中随机获取一条消息
 */
const getRandomMessage = (messages: string[]): string => {
  if (!messages || messages.length === 0) return '';
  return messages[Math.floor(Math.random() * messages.length)];
};

export const BankSystem: GameSystem = {
  id: 'BANK_SYSTEM',

  processTurn: ({ state }) => {
    const { bank, vitality, activeHousing } = state;
    const result: SystemResult = {
      updates: { bank: { ...bank } } as any,
      newTransactions: [],
      logs: [],
      notes: []
    };

    const currentTurn = vitality.time.currentTurn;

    // ====================================================
    // 1. 🛡️ 保险费用自动扣除 (Insurance Logic)
    // ====================================================
    const activeInsurances = vitality.activeInsurances || [];
    const remainingInsurances = [];
    
    for (const insurance of activeInsurances) {
      const cost = insurance.weeklyCost;
      if (cost > 0) {
        // 🔴 监狱保险断供补丁：检查资金是否足够支付保险
        const currentGold = (result.updates.vitality as any)?.metrics?.gold ?? vitality.metrics.gold;
        const pendingChanges = result.newTransactions?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
        const projectedGold = currentGold + pendingChanges;
        const canAfford = projectedGold >= cost;
        
        if (!canAfford && state.prison?.inJail) {
          // 狱中资金不足，保险断供
          result.logs.push(`【保险断供】${insurance.name}因资金不足已暂停。出狱后你将面临全额医疗费用。`);
          result.notes.push(`⚠️ 保险断供：你的${insurance.type === 'AUTO' ? '车险' : '医疗保险'}已被取消。`);
          
          // 更新保险断供标记
          result.updates.vitality = {
            ...result.updates.vitality,
            flags: {
              ...(result.updates.vitality as any)?.flags ?? vitality.flags,
              insuranceSuspended: true
            }
          } as any;
          
          // 不将此保险加入剩余保险列表（相当于移除）
          continue;
        }
        
        const category = insurance.type === 'AUTO' ? 'BILL' : 'MEDICAL';
        result.newTransactions!.push({
          id: `ins_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          turn: currentTurn,
          category,
          amount: -cost,
          description: `${insurance.type === 'AUTO' ? '车险' : '医疗保险'}周费: ${insurance.name}`,
          timestamp: Date.now()
        });
        result.logs.push(`支付了 $${cost} 的${insurance.type === 'AUTO' ? '车险' : '医疗保险'}费用`);
        remainingInsurances.push(insurance);
      }
    }
    
    // 更新保险列表（移除已断供的）
    if (remainingInsurances.length !== activeInsurances.length) {
      (result.updates as any).vitality = {
        ...(result.updates as any).vitality,
        activeInsurances: remainingInsurances
      };
    }

    // ====================================================
    // 2. 🏦 贷款与利息处理 (Loan Logic)
    // ====================================================
    if (bank.activeLoans.length > 0) {
      // 获取当前持有的房产（单一房产）
      const currentHousing = activeHousing;
      
      let totalScoreChange = 0;
      
      // 计算利息并更新逾期计数 (注意: processTurnInterest 内部已经处理了 overdueTurns + 1)
      const { updatedLoans } = processTurnInterest(bank.activeLoans, currentTurn);
      
      const processedLoans = [...updatedLoans];
      const loansToRemove: string[] = []; 

      // ✅ 解构配置项，方便调用
      const { collection, mortgage } = Config.bank;

      processedLoans.forEach((loan) => {
        // 获取当前逾期周数
        const t = loan.overdueTurns || 0;
        
        // ----------------------------------------------------
        // 🏠 房贷处理逻辑 (Mortgage Logic)
        // ----------------------------------------------------
        // ✅ 修复：房贷使用 overdueTurns > 0 作为逾期判定（由 HousingSystem 设置）
        if (loan.isMortgage && t > 0) {
           // 🛑 达到断供阈值 -> 强制收房
           if (t >= mortgage.foreclosureTurns) {
              const houseName = currentHousing?.loanId === loan.id ? currentHousing.name : '你名下的房产';
              const foreclosureMsg = getRandomMessage(bankNarratives.mortgage.foreclosure.messages)
                .replace('{houseName}', houseName);
             
             result.logs.push(foreclosureMsg);
             result.notes.push("你失去了房子，变回了流浪汉，信用分崩盘。");
             
             // 移除房产
             if (currentHousing?.loanId === loan.id) {
               (result.updates as any).activeHousing = null;
             } 
             
             // 阶级跌落
             result.updates.vitality = {
               ...result.updates.vitality,
               identity: {
                 ...(result.updates.vitality as any)?.identity || vitality.identity,
                 currentClass: PlayerClass.Homeless
               }
             } as any;
             
             // 标记移除贷款
             loansToRemove.push(loan.id);
             
             // 📉 信用分重罚
             totalScoreChange -= mortgage.foreclosurePenalty;
             return; 

           } else {
             // ⚠️ 断供警告
             const warningMsg = getRandomMessage(bankNarratives.mortgage.warning.messages)
               .replace('{weeks}', String(t))
               .replace('{remaining}', String(mortgage.foreclosureTurns - t));
             result.logs.push(warningMsg);
             totalScoreChange -= mortgage.warningPenalty;
           }
        } 
          
        
        // ----------------------------------------------------
        // 💸 普通贷款催收逻辑 (Collection Logic)
        // ----------------------------------------------------
        // ✅ 修复：普通贷款使用 currentTurn > loan.dueTurn 判定逾期
        else if (currentTurn > loan.dueTurn) {
          // 🛑 阶段 1: 早期警告
          if (t === collection.warning.turn) {
            const warningMsg = getRandomMessage(bankNarratives.collection.warning.messages);
            result.logs.push(warningMsg);
            totalScoreChange -= collection.warning.scorePenalty;
          }
          
          // 🛑 阶段 2: 暴力催收 (扣 HP/SAN)
          else if (t <= collection.violence.maxTurn) {
            const violenceMsg = getRandomMessage(bankNarratives.collection.violence.messages);
            result.logs.push(violenceMsg);
            
            // 读取配置伤害值和数值下限
            const { hpDamage, insightGain } = collection.violence;
            const { minStat, maxStat } = Config.system.caps;
            
            // 获取当前 HP/Insight（优先读取 updates 中的值，如果尚未设置则读取 current）
            const currentHp = (result.updates.vitality as any)?.metrics?.hp ?? vitality.metrics.hp;
            const currentInsight = (result.updates.vitality as any)?.metrics?.insight ?? vitality.metrics.insight;
            
            result.updates.vitality = {
               ...result.updates.vitality,
               metrics: {
                 ...(result.updates.vitality as any)?.metrics,
                 hp: Math.max(minStat, currentHp - hpDamage),
                 insight: Math.min(maxStat, currentInsight + insightGain)
               }
            } as any;
            
            totalScoreChange -= collection.violence.scorePenalty;
          }
          
          // 🛑 阶段 3: 强制划扣 (Seizure)
          else if (t <= collection.seizure.maxTurn) {
             const limit = collection.seizure.limit;
             // 获取最新余额
             const currentGold = (result.updates.vitality as any)?.metrics?.gold ?? vitality.metrics.gold;
             const seizeAmount = Math.min(currentGold, limit); 
             
             if (seizeAmount > 0) {
               const seizureDesc = getRandomMessage(bankNarratives.collection.seizure.messages);
               result.newTransactions!.push({
                 id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
                 turn: currentTurn,
                 category: 'BANK',
                 amount: -seizeAmount,
                 description: seizureDesc,
                 timestamp: Date.now()
               });
               
               // 扣减本金（使用不可变方式更新）
               const loanIndex = processedLoans.findIndex(l => l.id === loan.id);
               if (loanIndex !== -1) {
                 processedLoans[loanIndex] = {
                   ...processedLoans[loanIndex],
                   principal: Math.max(0, processedLoans[loanIndex].principal - seizeAmount)
                 };
               }
               result.logs.push(seizureDesc);
             } else {
               result.logs.push(`【强制执行失败】你名下无任何资产可供冻结。`);
             }
             
             totalScoreChange -= collection.seizure.scorePenalty;
          }
          
          // 🛑 阶段 4: 司法介入 (入狱) - 动态刑期计算
          else {
             const jailMsg = getRandomMessage(bankNarratives.collection.jail.messages);
             result.logs.push(jailMsg);
             
             // 计算总债务用于动态刑期
             const totalDebt = processedLoans.reduce((sum, l) => sum + l.principal + l.interest, 0);
             
             // 使用动态刑期计算: 2周基础 + 每$5000欠款加1周，上限8周
             const dynamicSentence = calculateDynamicSentence(totalDebt, prisonRules.sentence);
             
             // 应用重罪记录惩罚（-250分）
             const felonyPenalty = prisonRules.penalty?.creditScorePenalty ?? -250;
             
             (result.updates as any).prison = {
               inJail: true,
               sentenceTurns: dynamicSentence,
               crime: "金融诈骗与恶意欠款",
               bailAmount: 0,
               totalDebtAtConviction: totalDebt // 记录定罪时的债务
             } as any;
             
             // 添加重罪记录标记
             (result.updates as any).vitality = {
               ...(result.updates as any).vitality,
               flags: {
                 ...(result.updates as any).vitality?.flags ?? vitality.flags,
                 hasFelonyRecord: true,
                 felonyRecordTurn: currentTurn
               }
             };
             
             totalScoreChange += felonyPenalty; // 使用配置的惩罚值（负数）
             result.notes.push("【重罪记录】你被判定为金融罪犯，社会性死亡开始。");
          }
        }
      });

      // 有活跃贷款且全部按时还款：按债务比例给予周常加分
      const hasActiveLoans = processedLoans.length > 0;
      const hasOverdueLoans = processedLoans.some(l => currentTurn > l.dueTurn);
      
      if (hasActiveLoans && !hasOverdueLoans) {
        // 计算总剩余债务
        const totalDebt = processedLoans.reduce((sum, l) => sum + l.principal + l.interest, 0);
        
        // 债务比例越低（还得多），加分越高 (+5 ~ +10)
        let weeklyBonus = 5;
        if (totalDebt < 5000) weeklyBonus = 10;
        else if (totalDebt < 20000) weeklyBonus = 8;
        else if (totalDebt < 50000) weeklyBonus = 6;
        
        totalScoreChange += weeklyBonus;
      }

      // 过滤掉已终止的贷款
      const finalLoans = processedLoans.filter(l => !loansToRemove.includes(l.id));
      (result.updates as any).bank = { 
        ...bank,
        activeLoans: finalLoans 
      };

      // 应用信用分变更
      if (totalScoreChange !== 0) {
        const { minScore, maxScore } = Config.bank.creditScore;
        const currentScore = vitality.metrics.creditScore;
        
        // 限制信用分范围 [300, 850]
        const newScore = Math.max(minScore, Math.min(maxScore, currentScore + totalScoreChange));
        
        result.updates.vitality = {
          ...result.updates.vitality,
          metrics: {
             ...(result.updates.vitality as any)?.metrics,
             creditScore: newScore
          }
        } as any;
        
        if (totalScoreChange < 0) {
            result.notes.push(`信用评分下降了 ${Math.abs(totalScoreChange)} 分`);
        }
      }
    }

    return result;
  }
};