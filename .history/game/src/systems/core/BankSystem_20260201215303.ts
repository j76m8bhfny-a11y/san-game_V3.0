import { GameSystem, SystemResult } from '../types';
import { GameState, PlayerClass } from '@/types/schema';

export const BankSystem: GameSystem = {
  id: 'BANK_SYSTEM',

  processTurn: ({ state }) => {
    const { bank, vitality, activeHousing } = state;
    const result: SystemResult = {
      updates: { bank: { ...bank } }as any, // 准备更新 bank
      newTransactions: [],
      logs: [],
      notes: []
    };

    if (bank.activeLoans.length === 0) return result;

    const currentTurn = vitality.time.currentTurn;
    let totalScoreChange = 0;
    const updatedLoans = [...bank.activeLoans];
    const loansToRemove: string[] = []; // 用于移除结清或法拍的贷款

    updatedLoans.forEach((loan, index) => {
      // 1. 计算复利 (Compound Interest)
      // 本金不变，利息增加: NewInterest = (Principal + OldInterest) * Rate
      // 这里的逻辑是：本周产生的利息加入到 interest 池中，下周如果不还，这个池子会变大
      // 如果要严格复利，应该把 interest 并入 principal 计算，或者单独算。
      // 这里采用: 本周利息 = (剩余本金) * 周利率。
      // 如果你希望利滚利 (interest on interest)，则应该是 (principal + interest) * rate
      
      const compoundBase = loan.principal + loan.interest; 
      const weeklyInterest = Math.ceil(compoundBase * loan.rate);
      loan.interest += weeklyInterest;
      
      // 2. 逾期检测
      const isOverdue = currentTurn > loan.dueTurn;
      
      if (isOverdue) {
        loan.overdueTurns += 1;
        
        // === 房贷处理逻辑 ===
        if (loan.isMortgage) {
           // 房贷逾期超过 4 周 -> 法拍
           if (loan.overdueTurns >= 4) {
             result.logs.push(`【法拍执行】房屋 ${activeHousing?.name} 因断供被银行强制收回！`);
             result.notes.push("你失去了房子，变回了流浪汉，信用分崩盘。");
             
             // 强制流浪
             (result.updates as any).activeHousing = null; 
             result.updates.vitality = {
               ...result.updates.vitality, // 保持其他 vitality 更新
               identity: {
                 ...vitality.identity,
                 currentClass: PlayerClass.Homeless
               }
             } as any;
             
             // 移除贷款
             loansToRemove.push(loan.id);
             
             // 信用分重罚
             totalScoreChange -= 100;
             return; // 结束此贷款处理
           } else {
             result.logs.push(`【房贷警告】逾期 ${loan.overdueTurns} 周。4周后将收回房产。`);
             totalScoreChange -= 10;
           }
        } 
        
        // === 普通贷款催收逻辑 (4阶段) ===
        else {
          // Stage 1: 信用污点 (1周)
          if (loan.overdueTurns === 1) {
            result.logs.push(`贷款逾期警告: 信用评分下降。`);
            totalScoreChange -= 30;
          }
          
          // Stage 2: 暴力催收 (2-3周)
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
          
          // Stage 3: 强制划扣 (4-6周)
          else if (loan.overdueTurns <= 6) {
             const seizeAmount = Math.min(vitality.metrics.gold, 5000); // 只要有钱就抢
             if (seizeAmount > 0) {
               result.newTransactions!.push({
                 id: Math.random().toString(),
                 turn: currentTurn,
                 category: 'BANK',
                 amount: -seizeAmount,
                 description: '【强制执行】银行冻结并划扣资产',
                 timestamp: Date.now()
               });
               
               // 手动还债逻辑 (简化版，直接抵扣本金)
               loan.principal = Math.max(0, loan.principal - seizeAmount);
               result.logs.push(`银行强制划扣了 $${seizeAmount}`);
             } else {
               result.logs.push(`【强制执行失败】你名下无任何资产可供冻结。`);
             }
             totalScoreChange -= 80;
          }
          
          // Stage 4: 牢底坐穿 (>6周)
          else {
             result.logs.push(`【司法介入】因长期恶意拖欠，你被逮捕了。`);
             (result.updates as any).prison = {
               inJail: true,
               sentenceTurns: 8,
               crime: "金融诈骗与恶意欠款",
               bailAmount: 0 // 不允许保释
             } as any;
             
             // 贷款依然存在，但在监狱里可能无法处理
             totalScoreChange -= 100;
          }
        }
        
      } else {
        // 按时还款奖励 (如果是房贷，每周奖励少一点)
        totalScoreChange += 1;
      }
    });

    // 清理已法拍/结清的贷款
    const finalLoans = updatedLoans.filter(l => !loansToRemove.includes(l.id));
    (result.updates as any).bank = { activeLoans: finalLoans };

    // 应用信用分变更
    if (totalScoreChange !== 0) {
      const currentScore = vitality.metrics.creditScore;
      // 确保在 300 - 850 之间
      const newScore = Math.max(300, Math.min(850, currentScore + totalScoreChange));
      
      // 合并 vitality 更新
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