import { GameSystem, SystemResult } from '../types';
import { GameState, Job } from '@/types/schema';
import jobsData from '@/assets/data/jobs.json';

export const JobSystem: GameSystem = {
  id: 'JOB_SYSTEM',

  processTurn: ({ state }) => {
    const { vitality } = state;
    const result: SystemResult = {
      updates: {},
      newTransactions: [],
      logs: [],
      notes: []
    };

    if (vitality.activeJobs.length === 0) return result;

    const currentSan = vitality.metrics.san;
    
    // --- 核心逻辑: 灵视效率曲线 ---
    // SAN 越低 (越疯/越麻木)，效率越高
    // SAN 越高 (灵视越高)，效率越低
    let efficiency = 1.0;
    let statusText = "正常";

    if (currentSan <= 20) {
      efficiency = 1.2; // 麻木机器：120% 效率
      statusText = "麻木 (120%)";
    } else if (currentSan <= 50) {
      efficiency = 1.0; // 略微疲劳但专注于工作
      statusText = "稳定 (100%)";
    } else if (currentSan <= 80) {
      efficiency = 0.6; // 开始分心，看到不该看的东西
      statusText = "分心 (60%)";
    } else {
      efficiency = 0.2; // 灵视过高，无法在这个维度集中注意力
      statusText = "灵视干扰 (20%)";
    }

    // 遍历所有工作进行结算
    let totalIncome = 0;
    let totalHpCost = 0;
    let totalSanCost = 0; // 工作本身也会掉 SAN

    vitality.activeJobs.forEach(jobId => {
      const job = jobsData.find(j => j.id === jobId) as unknown as Job;
      if (!job) return;

      // 1. 计算 HP 消耗 (如果 HP 不够，强制停工)
      if (vitality.metrics.hp <= totalHpCost + job.hpCost) {
        result.notes.push(`体力不支，被迫旷工: ${job.title}`);
        return; // 跳过这份工作的结算
      }

      totalHpCost += job.hpCost;
      totalSanCost += job.sanCost;

      // 2. 计算工资
      // 灵视过高(>80) 时，有概率倒赔钱 (损坏设备/医疗赔偿)
      if (currentSan > 80 && Math.random() < 0.3) {
        const penalty = Math.floor(job.baseSalary * 0.2);
        result.newTransactions!.push({
          id: Math.random().toString(),
          turn: vitality.time.currentTurn,
          category: 'MISC',
          amount: -penalty,
          description: `工作事故 (${job.title}): 灵视过高导致操作失误`,
          timestamp: Date.now()
        });
        result.logs.push(`${job.title}: 看到触手导致操作失误，赔偿 $${penalty}`);
      } else {
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
      }
    });

    // 应用状态变更
    // 注意：金钱通过 transaction 处理，这里只处理 HP/SAN 扣除
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