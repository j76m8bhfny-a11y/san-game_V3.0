import { GameSystem, SystemResult } from '../types';
import { GameState, Job, Item } from '@/types/schema'; // ✅ 确保导入 Item 类型
import jobsData from '@/assets/data/jobs.json';
import itemsData from '@/assets/data/items.json'; 
import jobRules from '@/assets/data/rules/jobRules.json';

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
    
    // 强制类型断言，防止 TS 因 JSON 推断错误而报红
    // (修复 JSON 后，这里的 as Item[] 其实是多余的，但能提供双重保险)
    const allItems = itemsData as unknown as Item[];

    // --- 核心逻辑: 灵视效率曲线 (Refactored) ---
    // ✅ 查找符合当前 SAN 值的配置项 (从小到大排序的 JSON 数组)
    // 逻辑：找到第一个 maxSan 大于等于 currentSan 的配置

    const efficiencyConfig = jobRules.efficiencyCurve.find(
      config => currentSan <= config.maxSan
    ) || jobRules.efficiencyCurve[jobRules.efficiencyCurve.length - 1]; // Fallback to last

    const efficiency = efficiencyConfig.modifier;
    const statusText = efficiencyConfig.statusText;

    // 辅助函数：检查物品需求
    const hasRequiredItem = (req: string) => {
      return inventory.some(invId => {
        // 使用强类型的 allItems 数组进行查找
        const itemDef = allItems.find(i => i.id === invId);
        if (!itemDef) return false;
        return itemDef.id === req || (itemDef.tags && itemDef.tags.includes(req));
      });
    };

    // 遍历所有工作进行结算
    let totalIncome = 0;
    let totalHpCost = 0;
    let totalSanCost = 0;

    vitality.activeJobs.forEach(jobId => {
      const job = jobsData.find(j => j.id === jobId) as unknown as Job;
      if (!job) return;

      // =================================================================
      // 🛡️ 资格复核 (Post-Hiring Check)
      // =================================================================
      
      // 1. 复核房产
      if (job.requiresHousing) {
        if (!activeHousing || activeHousing.region !== job.region) {
            result.logs.push(`【停薪】${job.title}: 失去固定住所或搬离该区域。`);
            result.notes.push(`工作异常: ${job.title} 因住所问题暂停发放工资。`);
            return; 
        }
      }

      // 2. 复核道具
      if (job.requiredItem) {
          if (!hasRequiredItem(job.requiredItem)) {
              result.logs.push(`【停薪】${job.title}: 缺少必要工具 (${job.requiredItem})。`);
              result.notes.push(`工作异常: ${job.title} 因缺少工具暂停发放工资。`);
              return; 
          }
      }

      // =================================================================

      // 3. 计算 HP 消耗
      if (vitality.metrics.hp <= totalHpCost + job.hpCost) {
        result.notes.push(`体力不支，被迫旷工: ${job.title}`);
        return; 
      }

      totalHpCost += job.hpCost;
      totalSanCost += job.sanCost;

      // 4. 计算工资
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

      // 5. 额外事件: 高灵视事故
      const { highSanThreshold, probability, penaltyRate } = jobRules.accidents;

      if (currentSan > highSanThreshold && Math.random() < probability) {
        const penalty = Math.floor(job.baseSalary * penaltyRate);
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