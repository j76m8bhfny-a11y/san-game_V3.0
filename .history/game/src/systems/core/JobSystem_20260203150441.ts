import { GameSystem, SystemResult } from '../types';
import { GameState, Job } from '@/types/schema';
import jobsData from '@/assets/data/jobs.json';

export const JobSystem: GameSystem = {
  id: 'JOB_SYSTEM',

  processTurn: ({ state }) => {
    const { vitality, activeHousing, inventory } = state;
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    if (vitality.activeJobs.length === 0) return result;

    const currentSan = vitality.metrics.san;
    
    // --- 核心逻辑: 灵视效率曲线 ---
    let efficiency = 1.0;
    let statusText = "正常";

    if (currentSan <= 20) {
      efficiency = 1.2; 
      statusText = "麻木 (120%)";
    } else if (currentSan <= 50) {
      efficiency = 1.0; 
      statusText = "稳定 (100%)";
    } else if (currentSan <= 80) {
      efficiency = 0.6; 
      statusText = "分心 (60%)";
    } else {
      efficiency = 0.2; 
      statusText = "灵视干扰 (20%)";
    }

    // 遍历所有工作进行结算
    let totalIncome = 0;
    let totalHpCost = 0;
    let totalSanCost = 0;

    vitality.activeJobs.forEach(jobId => {
      const job = jobsData.find(j => j.id === jobId) as unknown as Job;
      if (!job) return;

      // === ✅ 新增: 每周资格复核 (Post-Hiring Check) ===
      
      // 1. 复核房产 (如需房产且当前无房或房产不在该区域)
      if (job.requiresHousing) {
        if (!activeHousing || activeHousing.region !== job.region) {
            result.logs.push(`【停薪】${job.title}: 失去固定住所或搬离该区域。`);
            // 可以在这里触发自动离职逻辑，但作为 System 最好只做结算
            return; // 跳过发薪
        }
      }

      // 2. 复核道具 (如车卖了)
      if (job.requiredItem) {
          const hasItem = inventory.some(itemId => itemId === job.requiredItem || itemId.includes(job.requiredItem!));
          if (!hasItem) {
              result.logs.push(`【停薪】${job.title}: 缺少必要工具 (${job.requiredItem})。`);
              return; // 跳过发薪
          }
      }

      // 3. 计算 HP 消耗
      if (vitality.metrics.hp <= totalHpCost + job.hpCost) {
        result.notes.push(`体力不支，被迫旷工: ${job.title}`);
        return; 
      }

      totalHpCost += job.hpCost;
      totalSanCost += job.sanCost;

      // === ✅ 优化: 收益计算逻辑 ===
      
      // 基础工资结算 (总是发生，除非上方被拦截)
      const actualSalary = Math.floor(job.baseSalary * efficiency);
      totalIncome += actualSalary;
      
      result.newTransactions!.push({
        id: Math.random().toString(),
        turn: vitality.time.currentTurn,
        category: 'INCOME',
        amount: actualSalary,
        description: `工资: ${job.title} [${statusText}]`,
        timestamp: Date.now()
      });

      // 额外事件: 高灵视事故 (独立判定，不再吞没工资)
      // 概率降低: 30% -> 15%
      if (currentSan > 80 && Math.random() < 0.15) {
        const penalty = Math.floor(job.baseSalary * 0.25); // 罚款基数为底薪的 25%
        result.newTransactions!.push({
          id: Math.random().toString(),
          turn: vitality.time.currentTurn,
          category: 'MISC',
          amount: -penalty,
          description: `工作事故 (${job.title}): 灵视过高导致操作失误`,
          timestamp: Date.now()
        });
        result.logs.push(`【警告】${job.title}: 看到幻觉误触警报，赔偿 $${penalty}`);
      }
    });

    if (totalHpCost > 0 || totalSanCost > 0) {
      result.updates.vitality = {
        metrics: {
          hp: Math.max(0, vitality.metrics.hp - totalHpCost),
          san: Math.max(0, vitality.metrics.san - totalSanCost)
        }
      } as any;
      
      result.logs.push(`本周工作结算: HP -${totalHpCost}, SAN -${totalSanCost}`);
    }

    return result;
  }
};