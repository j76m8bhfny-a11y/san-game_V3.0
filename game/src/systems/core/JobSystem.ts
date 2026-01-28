import { GameSystem, SystemResult } from '../types';
import { PlayerClass } from '@/types/schema';
import { calcSalary } from '@/logic/core';

// 直接导入静态配置数据
// 在 Vibe Coding 模式下，这样写最快且有效
import classesData from '@/assets/data/classes.json';
import globalData from '@/assets/data/global.json';

export const JobSystem: GameSystem = {
  id: 'JOB',

  processDay: ({ state }) => {
    const { activeJob, currentClass, san, gold } = state;
    const result: SystemResult = {
      updates: {},
      logs: [],
      notes: []
    };

    let baseSalary = 0;
    let jobTitle = '';

    // 1. 确定基础薪资
    if (activeJob) {
      // 如果有工作
      baseSalary = activeJob.salary;
      jobTitle = activeJob.title;
      
      // 工作可能带来的额外消耗 (例如 activeJob.sanCost)
      // 如果需要在 System 里处理，可以在这里写 logic
    } else {
      // 如果没工作，检查是否有阶级低保 (例如流浪汉乞讨)
      const classInfo = classesData.find((c: any) => c.id === currentClass);
      if (classInfo && classInfo.baseSalary > 0) {
        baseSalary = classInfo.baseSalary;
        jobTitle = '低保/乞讨';
      }
    }

    // 如果没有收入来源，直接返回
    if (baseSalary <= 0) return result;

    // 2. 计算实际薪资 (应用 SAN 值效率修正)
    // 使用核心逻辑层的算法，保持统一
    const finalSalary = calcSalary(baseSalary, san, globalData.salaryConfig);

    // 3. 应用更新
    result.updates.gold = gold + finalSalary;
    
    // 4. 记录日志
    if (activeJob) {
      result.logs.push(`工作(${jobTitle}): +$${finalSalary}`);
      // 如果薪资因为 SAN 值低被打折了，可以加个提示
      if (finalSalary < baseSalary * 0.8) {
        result.notes.push(`工作效率低下: 精神状态影响了你的收入 (原薪资 $${baseSalary})`);
      }
    } else {
      result.logs.push(`${jobTitle}: +$${finalSalary}`);
    }

    return result;
  }
};