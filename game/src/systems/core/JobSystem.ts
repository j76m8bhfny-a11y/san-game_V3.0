import { GameSystem, SystemResult } from '../types';
import { Job, Item, FaithDebuff } from '@/types/schema';
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

    const currentInsight = vitality.metrics.insight;
    
    // 强制类型断言，防止 TS 因 JSON 推断错误而报红
    // (修复 JSON 后，这里的 as Item[] 其实是多余的，但能提供双重保险)
    const allItems = itemsData as unknown as Item[];

    // --- 核心逻辑: 灵视效率曲线 (Refactored) ---
    // ✅ 查找符合当前 Insight 值的配置项 (从大到小排序，0=蒙昧/高效，100=通透/低效)
    // 逻辑：找到第一个 minInsight 小于等于 currentInsight 的配置（从高到低遍历）

    // 防御性检查：确保 efficiencyCurve 配置存在且非空
    const curve = jobRules.efficiencyCurve || [];
    // 按 minInsight 从大到小排序后查找（因为高 insight = 低效率）
    const sortedCurve = [...curve].sort((a, b) => b.minInsight - a.minInsight);
    const efficiencyConfig = sortedCurve.length > 0 
      ? (sortedCurve.find(config => currentInsight >= config.minInsight) || sortedCurve[sortedCurve.length - 1])
      : { modifier: 1.0, statusText: '正常' }; // 兜底配置

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
    let totalInsightCost = 0;

    // 计算信仰 Debuff 的收入总倍率（防御性处理）
    const faithDebuffs = (state.faith?.debuffs || []) as FaithDebuff[];
    const incomeMultiplier = faithDebuffs.reduce((multiplier, debuff) => {
      // 过滤无效的 debuff 数据（旧存档兼容）
      if (!debuff || !debuff.effect) return multiplier;
      return multiplier * (debuff.effect.incomeMultiplier ?? 1);
    }, 1);

    vitality.activeJobs.forEach(jobId => {
      const job = jobsData.find(j => j.id === jobId) as Job;
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
      const requiredItemsList = job.requiredItems || (job.requiredItem ? [job.requiredItem] : []);
      for (const required of requiredItemsList) {
          if (!hasRequiredItem(required)) {
              result.logs.push(`【停薪】${job.title}: 缺少必要工具 (${required})。`);
              result.notes.push(`工作异常: ${job.title} 因缺少工具暂停发放工资。`);
              return; 
          }
      }

      // =================================================================

      // 3. 计算 HP 消耗（考虑Buff影响）
      // 检查是否有疲劳压制Buff（能量饮料等）
      const hasFatigueSuppress = state.vitality.activeBuffs?.some(
        (b: any) => b.id.startsWith('buff_fatigue_suppress') && b.duration > 0
      );
      
      // 应用workHpCostModifier：如果有疲劳压制，工作不消耗HP
      const actualHpCost = hasFatigueSuppress ? 0 : job.hpCost;
      
      if (vitality.metrics.hp <= totalHpCost + actualHpCost) {
        result.notes.push(`体力不支，被迫旷工: ${job.title}`);
        return; 
      }

      totalHpCost += actualHpCost;
      totalInsightCost += job.insightCost;

      // 4. 计算工资 (效率 × 信仰Debuff倍率)
      const actualSalary = Math.floor(job.baseSalary * efficiency * incomeMultiplier);
      totalIncome += actualSalary;
      
      // 构建工资描述（包含Debuff影响提示）
      let salaryDescription = `工资: ${job.title} [${statusText}]`;
      if (incomeMultiplier < 1) {
        const debuffNames = faithDebuffs
          .filter(d => d.effect?.incomeMultiplier && d.effect.incomeMultiplier < 1)
          .map(d => d.name)
          .join(', ');
        salaryDescription += ` [${debuffNames}: ${Math.round(incomeMultiplier * 100)}%]`;
      }

      result.newTransactions!.push({
        id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
        turn: vitality.time.currentTurn,
        category: 'INCOME',
        amount: actualSalary,
        description: salaryDescription,
        timestamp: Date.now()
      });

      // 5. 额外事件: 极高灵视说出真相被视为疯子
      const { highInsightThreshold, probability, penaltyRate } = jobRules.accidents;

      if (currentInsight > highInsightThreshold && Math.random() < probability) {
        const penalty = Math.floor(job.baseSalary * penaltyRate);
        result.newTransactions!.push({
          id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
          turn: vitality.time.currentTurn,
          category: 'MISC',
          amount: -penalty,
          description: `工作事故 (${job.title}): 你说出了不该看到的真相`,
          timestamp: Date.now()
        });
        result.logs.push(`【警告】${job.title}: 你说出了不该看到的真相，被同事当作疯子，赔偿 $${penalty}`);
      }
    });

    if (totalHpCost > 0 || totalInsightCost > 0) {
      result.updates.vitality = {
        metrics: {
          hp: Math.max(0, vitality.metrics.hp - totalHpCost),
          insight: Math.max(0, vitality.metrics.insight - totalInsightCost)
        }
      } as any;
      
      result.logs.push(`本周工作结算: HP -${totalHpCost}, INSIGHT -${totalInsightCost}`);
    }

    // 添加信仰Debuff影响通知
    if (incomeMultiplier < 1) {
      const debuffInfo = faithDebuffs
        .filter(d => d.effect?.incomeMultiplier && d.effect.incomeMultiplier < 1)
        .map(d => `${d.name}(${d.remainingTurns}天)`)
        .join(', ');
      result.notes.push(`信仰惩罚生效: 工作收入受 [${debuffInfo}] 影响`);
    }

    return result;
  }
};