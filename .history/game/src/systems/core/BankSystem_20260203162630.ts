import { GameSystem, SystemResult } from '../types';
import { GameState, PlayerClass } from '@/types/schema';
import { processTurnInterest } from '@/logic/bank';

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
    
    // ✅ 修复 1: 修正解构属性名 (totalInterest -> totalTurnInterest)
    const { updatedLoans, totalTurnInterest } = processTurnInterest(bank.activeLoans, currentTurn);
    
    // 我们需要进一步处理逾期状态
    const processedLoans = [...updatedLoans];
    const loansToRemove: string[] = []; 

    // ... (后续逻辑保持不变)
    processedLoans.forEach((loan) => {
      const isOverdue = currentTurn > loan.dueTurn;
      
      if (isOverdue) {
        loan.overdueTurns += 1;
        
        // === 房贷处理逻辑 ===
        if (loan.isMortgage) {
           if (loan.overdueTurns >= 4) {
             result.logs.push(`【法拍执行】房屋 ${activeHousing?.name} 因断供被银行强制收回！`);
             result.notes.push("你失去了房子，变回了流浪汉，信用分崩盘。");
             
             (result.updates as any).activeHousing = null; 
             result.updates.vitality = {
               ...result.updates.vitality,
               identity: {
                 ...vitality.identity,
                 currentClass: PlayerClass.Homeless
               }
             } as any;
             
             loansToRemove.push(loan.id);
             totalScoreChange -= 100;
             return; 
           } else {
             result.logs.push(`【房贷警告】逾期 ${loan.overdueTurns} 周。4周后将收回房产。`);
             totalScoreChange -= 10;
           }
        } 
        
        // === 普通贷款催收逻辑 ===
        else {
          if (loan.overdueTurns === 1) {
            result.logs.push(`贷款逾期警告: 信用评分下降。`);
            totalScoreChange -= 30;
          }
          else if (loan.overdueTurns <= 3) {
            result.logs.push(`【暴力催收】讨债人打断了你的肋骨！`);
            result.updates.vitality = {
               metrics: {
                 hp: Math.max(0, vitality.metrics.hp - 20),
                 san: Math.max(0, vitality.metrics.san - 15)
               }
            } as any;
            totalScoreChange -= 50;
          }
          else if (loan.overdueTurns > 3 && loan.overdueTurns <= 8) {
             const seizeAmount = Math.min(vitality.metrics.gold, 5000); 
             if (seizeAmount > 0) {
               result.newTransactions!.push({
                 id: Math.random().toString(),
                 turn: currentTurn,
                 category: 'BANK',
                 amount: -seizeAmount,
                 description: '【强制执行】银行冻结并划扣资产',
                 timestamp: Date.now()
               });
               
               loan.principal = Math.max(0, loan.principal - seizeAmount);
               result.logs.push(`银行强制划扣了 $${seizeAmount}`);
             } else {
               result.logs.push(`【强制执行失败】你名下无任何资产可供冻结。`);
             }
             totalScoreChange -= 80;
          }
          else if (loan.overdueTurns > 8) {
             result.logs.push(`【司法介入】因长期恶意拖欠，你被逮捕了。`);
             (result.updates as any).prison = {
               inJail: true,
               sentenceTurns: 8,
               crime: "金融诈骗与恶意欠款",
               bailAmount: 0 
             } as any;
             
             totalScoreChange -= 100;
          }
        }
        
      } else {
        totalScoreChange += 1;
      }
    });

    const finalLoans = processedLoans.filter(l => !loansToRemove.includes(l.id));
    (result.updates as any).bank = { activeLoans: finalLoans };

    if (totalScoreChange !== 0) {
      const currentScore = vitality.metrics.creditScore;
      const newScore = Math.max(300, Math.min(850, currentScore + totalScoreChange));
      
      result.updates.vitality = {
        ...result.updates.vitality,
        metrics: {
           ...(result.updates.vitality as any)?.metrics,
           creditScore: newScore
        }
      } as any;
      
      if (totalScoreChange < 0) result.notes.push(`信用评分下降了 ${Math.abs(totalScoreChange)} 分`);
    }

    return result;
  }
};