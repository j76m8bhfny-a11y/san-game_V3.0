import { GameSystem, SystemResult } from '../types';
import { GameState, PlayerClass } from '@/types/schema';
import { processTurnInterest } from '@/logic/bank';
import bankRules from '@/assets/data/rules/bankRules.json'; // ✅ 1. 引入数值配置文件

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

    if (bank.activeLoans.length === 0) return result;

    const currentTurn = vitality.time.currentTurn;
    let totalScoreChange = 0;
    
    // 计算利息并更新逾期计数 (注意: processTurnInterest 内部已经处理了 overdueTurns + 1)
    const { updatedLoans } = processTurnInterest(bank.activeLoans, currentTurn);
    
    const processedLoans = [...updatedLoans];
    const loansToRemove: string[] = []; 

    // ✅ 2. 解构配置项，方便调用
    const { collection, mortgage } = bankRules;

    processedLoans.forEach((loan) => {
      // 检查是否当前逾期
      const isOverdue = currentTurn > loan.dueTurn;
      
      if (isOverdue) {
        // 获取当前逾期周数 (由 processTurnInterest 计算得出)
        const t = loan.overdueTurns;
        
        // ====================================================
        // 🏠 房贷处理逻辑 (Mortgage Logic)
        // ====================================================
        if (loan.isMortgage) {
           // 🛑 达到断供阈值 -> 强制收房
           if (t >= mortgage.foreclosureTurns) {
             result.logs.push(`【法拍执行】房屋 ${activeHousing?.name} 因断供被银行强制收回！`);
             result.notes.push("你失去了房子，变回了流浪汉，信用分崩盘。");
             
             // 移除房产
             (result.updates as any).activeHousing = null; 
             
             // 阶级跌落
             result.updates.vitality = {
               ...result.updates.vitality,
               identity: {
                 ...vitality.identity,
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
             result.logs.push(`【房贷警告】逾期 ${t} 周。${mortgage.foreclosureTurns - t}周后将收回房产。`);
             totalScoreChange -= mortgage.warningPenalty;
           }
        } 
        
        // ====================================================
        // 💸 普通贷款催收逻辑 (Collection Logic)
        // ====================================================
        else {
          // 🛑 阶段 1: 早期警告
          if (t === collection.warning.turn) {
            result.logs.push(`贷款逾期警告: 信用评分下降。`);
            totalScoreChange -= collection.warning.scorePenalty;
          }
          
          // 🛑 阶段 2: 暴力催收 (扣 HP/SAN)
          else if (t <= collection.violence.maxTurn) {
            result.logs.push(`【暴力催收】讨债人打断了你的肋骨！`);
            
            // 读取配置伤害值
            const { hpDamage, sanDamage } = collection.violence;
            
            result.updates.vitality = {
               metrics: {
                 hp: Math.max(0, vitality.metrics.hp - hpDamage),
                 san: Math.max(0, vitality.metrics.san - sanDamage)
               }
            } as any;
            
            totalScoreChange -= collection.violence.scorePenalty;
          }
          
          // 🛑 阶段 3: 强制划扣 (Seizure)
          else if (t <= collection.seizure.maxTurn) {
             const limit = collection.seizure.limit;
             const seizeAmount = Math.min(vitality.metrics.gold, limit); 
             
             if (seizeAmount > 0) {
               result.newTransactions!.push({
                 id: Math.random().toString(),
                 turn: currentTurn,
                 category: 'BANK',
                 amount: -seizeAmount,
                 description: '【强制执行】银行冻结并划扣资产',
                 timestamp: Date.now()
               });
               
               // 扣减本金
               loan.principal = Math.max(0, loan.principal - seizeAmount);
               result.logs.push(`银行强制划扣了 $${seizeAmount}`);
             } else {
               result.logs.push(`【强制执行失败】你名下无任何资产可供冻结。`);
             }
             
             totalScoreChange -= collection.seizure.scorePenalty;
          }
          
          // 🛑 阶段 4: 司法介入 (入狱)
          else {
             result.logs.push(`【司法介入】因长期恶意拖欠，你被逮捕了。`);
             
             (result.updates as any).prison = {
               inJail: true,
               sentenceTurns: collection.jail.sentenceTurns, // 读取配置刑期
               crime: "金融诈骗与恶意欠款",
               bailAmount: 0 
             } as any;
             
             totalScoreChange -= collection.jail.scorePenalty;
          }
        }
        
      } else {
        // 未逾期：信用分微量自然增长
        totalScoreChange += 1;
      }
    });

    // 过滤掉已终止的贷款（如被法拍的房贷）
    const finalLoans = processedLoans.filter(l => !loansToRemove.includes(l.id));
    (result.updates as any).bank = { activeLoans: finalLoans };

    // 应用信用分变更
    if (totalScoreChange !== 0) {
      const { minScore, maxScore } = bankRules.creditScore;
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

    return result;
  }
};