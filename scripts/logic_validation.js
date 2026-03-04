#!/usr/bin/env node
/**
 * 游戏逻辑一致性检查脚本
 * 按照逻辑一致性检查方案v3执行全面验证
 */

const fs = require('fs');
const path = require('path');

// 游戏总回合数
const TOTAL_TURNS = 52;

// 区域列表
const REGIONS = ['SLUMS', 'RUST_BELT', 'SUBURBS', 'DOWNTOWN'];

// 阶层列表
const CLASSES = ['HOMELESS', 'WORKER', 'MIDDLE', 'CAPITALIST'];

// 报告对象
const report = {
  summary: { totalChecks: 0, passed: 0, errors: 0, warnings: 0, info: 0 },
  byModule: {},
  critical: [],
  errors: [],
  warnings: [],
  suggestions: [],
  statistics: {}
};

// 辅助函数：添加问题
function addIssue(code, severity, module, message, data = null, suggestion = '') {
  const issue = { code, severity, module, message, data, suggestion };
  report.summary.totalChecks++;
  
  if (!report.byModule[module]) {
    report.byModule[module] = { passed: 0, issues: [] };
  }
  
  if (severity === 'CRITICAL') {
    report.critical.push(issue);
    report.summary.errors++;
  } else if (severity === 'ERROR') {
    report.errors.push(issue);
    report.summary.errors++;
  } else if (severity === 'WARNING') {
    report.warnings.push(issue);
    report.summary.warnings++;
  } else {
    report.suggestions.push(issue);
    report.summary.info++;
  }
  
  report.byModule[module].issues.push(issue);
}

// 辅助函数：添加通过记录
function addPass(module) {
  report.summary.totalChecks++;
  report.summary.passed++;
  if (!report.byModule[module]) {
    report.byModule[module] = { passed: 0, issues: [] };
  }
  report.byModule[module].passed++;
}

// 加载JSON文件
function loadJson(filename) {
  try {
    const filepath = path.join(__dirname, '../game/src/assets/data', filename);
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

// 加载所有事件文件
function loadAllEvents() {
  const events = [];
  const eventsDir = path.join(__dirname, '../game/src/assets/data/events');
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (item.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const event = JSON.parse(content);
          event._filepath = fullPath;
          events.push(event);
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
  
  scanDir(eventsDir);
  return events;
}

// ==================== 模块1: 基础数值逻辑检查 (BASE) ====================
function checkBaseLogic(classes, housing, jobs) {
  const module = 'BASE';
  console.log(`\n📋 执行模块 ${module}: 基础数值逻辑检查...`);
  
  // BASE-001: 阈值连续性检查
  const sortedClasses = [...classes].sort((a, b) => a.thresholdMin - b.thresholdMin);
  for (let i = 0; i < sortedClasses.length - 1; i++) {
    const current = sortedClasses[i];
    const next = sortedClasses[i + 1];
    if (current.thresholdMax + 1 !== next.thresholdMin) {
      addIssue('BASE-001', 'ERROR', module, 
        `阈值断层: ${current.id}(${current.thresholdMax}) -> ${next.id}(${next.thresholdMin})`,
        { current, next },
        `确保 ${current.id}.thresholdMax + 1 == ${next.id}.thresholdMin`);
    } else {
      addPass(module);
    }
  }
  
  // BASE-002: 阶层初始状态合理性
  for (const cls of classes) {
    // 检查HP范围
    if (cls.initialStats.hp <= 0 || cls.initialStats.hp > 100) {
      addIssue('BASE-002', 'ERROR', module,
        `${cls.id} 初始HP(${cls.initialStats.hp})超出有效范围(0,100]`,
        cls, '调整initialStats.hp到(0,100]范围内');
    }
    
    // 检查insight范围
    if (cls.initialStats.insight < 0 || cls.initialStats.insight > 100) {
      addIssue('BASE-002', 'ERROR', module,
        `${cls.id} 初始Insight(${cls.initialStats.insight})超出有效范围[0,100]`,
        cls, '调整initialStats.insight到[0,100]范围内');
    }
    
    // 检查金币是否在阶层范围内
    if (cls.initialStats.gold < cls.thresholdMin || cls.initialStats.gold > cls.thresholdMax) {
      if (cls.thresholdMax < 999999999) { // 排除无限上限
        addIssue('BASE-002', 'WARNING', module,
          `${cls.id} 初始资金(${cls.initialStats.gold})不在阶层资产范围内[${cls.thresholdMin}, ${cls.thresholdMax}]`,
          cls, '考虑调整initialStats.gold使其符合阶层定位');
      }
    }
    
    // 检查开局资金是否足够支付首月费用
    if (cls.monthlyCost > 0 && cls.initialStats.gold < cls.monthlyCost / 4) {
      addIssue('BASE-002', 'WARNING', module,
        `${cls.id} 开局资金(${cls.initialStats.gold})不足以支付首周费用(${Math.round(cls.monthlyCost/4)})`,
        cls, '考虑增加initialStats.gold或降低monthlyCost');
    }
  }
  
  // BASE-003: 区域可达性检查
  for (const job of jobs) {
    const jobRegion = job.region;
    const validHousingRegions = housing
      .filter(h => h.requiredClass === job.requiredClass)
      .map(h => h.region);
    
    if (!validHousingRegions.includes(jobRegion)) {
      // 检查是否有交通工具要求
      const requiresVehicle = job.requiredItem === 'VEHICLE' || 
                             (job.requiredItems && job.requiredItems.includes('VEHICLE'));
      
      if (!requiresVehicle) {
        addIssue('BASE-003', 'ERROR', module,
          `工作${job.id}区域(${jobRegion})与住所区域(${validHousingRegions.join(', ')})不匹配且无交通工具要求`,
          job, '添加requiredItem/requiresItems: VEHICLE或调整工作区域');
      }
    }
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块2: 时间系统一致性检查 (TIME) ====================
function checkTimeSystem(loans, hospitalServices, diseases, events, housing) {
  const module = 'TIME';
  console.log(`\n📋 执行模块 ${module}: 时间系统一致性检查...`);
  
  // TIME-001: 时间单位统一性
  // 检查贷款期限
  for (const loan of loans) {
    if (loan.termTurns > TOTAL_TURNS) {
      addIssue('TIME-001', 'WARNING', module,
        `贷款${loan.id}期限(${loan.termTurns}周)超过游戏总时长(${TOTAL_TURNS}周)`,
        loan, '考虑缩短termTurns或在游戏中实现多周目机制');
    }
  }
  
  // 检查医疗冷却
  for (const service of hospitalServices) {
    if (service.cooldown?.turns >= TOTAL_TURNS) {
      addIssue('TIME-001', 'WARNING', module,
        `医疗服务${service.id}冷却(${service.cooldown.turns}回合)接近/超过游戏总时长`,
        service, '考虑缩短cooldown.turns');
    }
  }
  
  // 检查住房抵押贷款
  for (const h of housing) {
    if (h.buyConfig?.mortgageTermTurns > TOTAL_TURNS) {
      addIssue('TIME-001', 'INFO', module,
        `住房${h.id}抵押贷款期限(${h.buyConfig.mortgageTermTurns}周)超过游戏总时长`,
        h, '这是正常设计，表示贷款需要在多周目游戏中才能还清');
    }
  }
  
  // TIME-002: 游戏总时长匹配性
  for (const loan of loans) {
    if (loan.termTurns > TOTAL_TURNS) {
      addIssue('TIME-002', 'WARNING', module,
        `贷款${loan.id}期限(${loan.termTurns}周)超过游戏总时长(${TOTAL_TURNS}周)，可能无法还清`,
        loan, '缩短termTurns或允许多周目债务继承');
    }
  }
  
  for (const disease of diseases) {
    if (disease.duration && disease.duration > TOTAL_TURNS) {
      addIssue('TIME-002', 'INFO', module,
        `疾病${disease.id}持续时间(${disease.duration}回合)超过游戏总时长`,
        disease, '慢性设计，可能持续到游戏结束');
    }
  }
  
  for (const event of events) {
    if (event.conditions?.maxTurn > TOTAL_TURNS) {
      addIssue('TIME-002', 'ERROR', module,
        `事件${event.id} maxTurn(${event.conditions.maxTurn})超过游戏总回合(${TOTAL_TURNS})，永远不会触发`,
        event, '调整conditions.maxTurn <= 52');
    }
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块3: 经济可持续性检查 (ECON) ====================
function checkEconomicSustainability(classes, jobs, housing, items, loans) {
  const module = 'ECON';
  console.log(`\n📋 执行模块 ${module}: 经济可持续性检查...`);
  
  const survivalEstimates = {};
  
  for (const cls of classes) {
    // 计算周收入（假设工资是周薪）
    const weeklyIncome = cls.baseSalary / 4; // 如果是月薪则除以4
    const weeklyExpense = cls.monthlyCost / 4;
    
    // 找最便宜住房
    const affordableHousing = housing.filter(h => h.requiredClass === cls.id);
    const minHousingCost = affordableHousing.length > 0 
      ? Math.min(...affordableHousing.map(h => {
          if (h.rentConfig?.weeklyCosts) {
            return h.rentConfig.weeklyCosts.reduce((sum, c) => sum + c.baseAmount, 0);
          }
          return 0;
        }))
      : 0;
    
    // 找最便宜食物
    const foodItems = items.filter(item => 
      item.tags?.includes('FOOD') && 
      (item.regions?.some(r => affordableHousing.some(h => h.region === r)) || !item.regions)
    );
    const minFoodCost = foodItems.length > 0 
      ? Math.min(...foodItems.map(i => i.price || 0)) * 7 // 每天一份
      : 0;
    
    const netFlow = weeklyIncome - weeklyExpense - minHousingCost - minFoodCost;
    
    survivalEstimates[cls.id] = {
      weeklyIncome,
      weeklyExpense,
      minHousingCost,
      minFoodCost,
      netFlow,
      bankruptcyTurns: netFlow < 0 ? Math.floor(cls.initialStats.gold / Math.abs(netFlow)) : Infinity
    };
    
    // ECON-001: 基础收支平衡检查
    if (netFlow < -200) {
      addIssue('ECON-001', 'ERROR', module,
        `${cls.name}周净现金流严重赤字(${netFlow})，几乎必然破产`,
        survivalEstimates[cls.id], '增加baseSalary或降低monthlyCost');
    } else if (netFlow < -50) {
      addIssue('ECON-001', 'WARNING', module,
        `${cls.name}周净现金流为负(${netFlow})，生存压力极大`,
        survivalEstimates[cls.id], '考虑增加收入来源或降低成本');
    } else {
      addPass(module);
    }
    
    // 计算破产时间
    if (netFlow < 0) {
      const bankruptcyTurns = cls.initialStats.gold / Math.abs(netFlow);
      if (bankruptcyTurns < 10) {
        addIssue('ECON-001', 'ERROR', module,
          `${cls.name}10周内必然破产，无法体验游戏内容`,
          { bankruptcyTurns: bankruptcyTurns.toFixed(1) },
          '大幅增加initialStats.gold或降低固定支出');
      } else if (bankruptcyTurns < 26) {
        addIssue('ECON-001', 'WARNING', module,
          `${cls.name}半年内可能破产，容错率过低`,
          { bankruptcyTurns: bankruptcyTurns.toFixed(1) },
          '适当增加initialStats.gold');
      }
    }
  }
  
  report.statistics.survivalEstimate = survivalEstimates;
  
  // ECON-002: 贷款数学可行性
  const loanFeasibility = {};
  for (const loan of loans) {
    const totalRepayment = loan.maxAmount * (1 + loan.weeklyRate * Math.min(loan.termTurns, TOTAL_TURNS));
    const weeklyPayment = totalRepayment / Math.min(loan.termTurns, TOTAL_TURNS);
    
    // 获取该区域的平均收入
    const regionJobs = jobs.filter(j => j.region === loan.region);
    const avgWeeklyIncome = regionJobs.length > 0
      ? regionJobs.reduce((sum, j) => sum + j.baseSalary, 0) / regionJobs.length / 4
      : 200;
    
    const paymentRatio = weeklyPayment / avgWeeklyIncome;
    
    loanFeasibility[loan.id] = { paymentRatio, weeklyPayment, avgWeeklyIncome };
    
    if (paymentRatio > 1) {
      addIssue('ECON-002', 'ERROR', module,
        `贷款${loan.id}周还款(${weeklyPayment.toFixed(2)})超过平均收入(${avgWeeklyIncome.toFixed(2)})，数学上无法偿还`,
        loanFeasibility[loan.id], '降低weeklyRate或延长termTurns');
    } else if (paymentRatio > 0.5) {
      addIssue('ECON-002', 'WARNING', module,
        `贷款${loan.id}还款占收入${(paymentRatio*100).toFixed(0)}%以上，压力极大`,
        loanFeasibility[loan.id], '考虑降低weeklyRate');
    } else {
      addPass(module);
    }
    
    // 检查回收物品
    if (loan.repossessionItem) {
      // 简化检查，实际应该检查物品是否存在
      addIssue('ECON-002', 'INFO', module,
        `贷款${loan.id}有回收物品${loan.repossessionItem}，需确保该物品存在`,
        loan, '验证repossessionItem在物品表中存在');
    }
  }
  
  report.statistics.loanFeasibility = loanFeasibility;
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块4: 医疗系统逻辑检查 (MED) ====================
function checkMedicalSystem(hospitalServices, diseases, classes) {
  const module = 'MED';
  console.log(`\n📋 执行模块 ${module}: 医疗系统逻辑检查...`);
  
  // MED-001: 医疗分层合理性
  for (const region of REGIONS) {
    const services = hospitalServices.filter(s => s.region === region);
    
    // 基础服务存在性
    const hasEmergency = services.some(s => s.type === 'EMERGENCY');
    if (!hasEmergency) {
      addIssue('MED-001', 'ERROR', module,
        `${region}区域无急诊服务`,
        { region }, '添加type为EMERGENCY的服务');
    }
    
    // 成本递增性检查
    const sortedCosts = services.map(s => s.baseCost).sort((a, b) => a - b);
    for (let i = 1; i < sortedCosts.length; i++) {
      if (sortedCosts[i] < sortedCosts[i-1]) {
        addIssue('MED-001', 'WARNING', module,
          `${region}医疗成本不递增`,
          { region, costs: sortedCosts }, '考虑按成本递增排序服务');
        break;
      }
    }
  }
  
  // MED-002: 保险配置检查
  for (const service of hospitalServices) {
    const ins = service.insurance;
    
    if (ins) {
      // copayRate范围检查
      if (ins.baseCopayRate < 0 || ins.baseCopayRate > 1) {
        addIssue('MED-002', 'ERROR', module,
          `医疗服务${service.id} copayRate(${ins.baseCopayRate})必须在0-1之间`,
          service, '调整baseCopayRate到[0,1]范围');
      }
      
      // isCovered但copayRate=1.0
      if (ins.isCovered && ins.baseCopayRate === 1.0) {
        addIssue('MED-002', 'WARNING', module,
          `医疗服务${service.id} isCovered=true但copayRate=1.0，等同于未覆盖`,
          service, '设置isCovered=false或降低baseCopayRate');
      }
    }
    
    // 延期支付检查
    if (service.deferredPayment) {
      const dp = service.deferredPayment;
      if (dp.delayTurns > TOTAL_TURNS) {
        addIssue('MED-002', 'WARNING', module,
          `医疗服务${service.id}延期支付超过游戏总时长`,
          service, '缩短delayTurns');
      }
      
      if (dp.collectionsRisk < 0 || dp.collectionsRisk > 1) {
        addIssue('MED-002', 'ERROR', module,
          `医疗服务${service.id} collectionsRisk必须在0-1之间`,
          service, '调整collectionsRisk到[0,1]范围');
      }
    }
  }
  
  // MED-003: 疾病治疗闭环
  for (const disease of diseases) {
    if (!disease.id || disease.id.startsWith('_comment')) continue;
    
    // 查找治疗方案
    const treatments = hospitalServices.filter(s => 
      s.effects?.cureDisease?.includes(disease.id) ||
      s.effects?.suppressDisease?.includes(disease.id)
    );
    
    if (treatments.length === 0 && disease.type !== 'MENTAL') {
      addIssue('MED-003', 'WARNING', module,
        `疾病${disease.id}无治疗方案`,
        disease, '在hospital_services.json中添加治愈/抑制此疾病的服务');
    }
    
    // 慢性病检查
    if (disease.type === 'CHRONIC') {
      const weeklyHpDrain = disease.effects?.hpDrain || 0;
      const hasOngoingCost = disease.ongoingCost != null;
      
      if (weeklyHpDrain > 0 && !hasOngoingCost && treatments.length === 0) {
        addIssue('MED-003', 'ERROR', module,
          `慢性病${disease.id}持续扣血且无治疗方案/控制手段，最终必然死亡`,
          disease, '添加治疗方案或ongoingCost控制成本');
      }
    }
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块5: 事件系统逻辑检查 (EVENT) ====================
function checkEventSystem(events, classes) {
  const module = 'EVENT';
  console.log(`\n📋 执行模块 ${module}: 事件系统逻辑检查...`);
  
  const distribution = {
    'HOMELESS': { count: 0, positive: 0, negative: 0, neutral: 0 },
    'WORKER': { count: 0, positive: 0, negative: 0, neutral: 0 },
    'MIDDLE': { count: 0, positive: 0, negative: 0, neutral: 0 },
    'CAPITALIST': { count: 0, positive: 0, negative: 0, neutral: 0 }
  };
  
  // 收集所有事件ID用于断链检查
  const allEventIds = new Set(events.map(e => e.id));
  const eventGraph = {};
  
  for (const event of events) {
    if (!event.id) continue;
    
    const cond = event.conditions || {};
    
    // EVENT-001: 触发条件有效性
    if (cond.minTurn != null && cond.maxTurn != null) {
      if (cond.minTurn > cond.maxTurn) {
        addIssue('EVENT-001', 'ERROR', module,
          `事件${event.id}回合范围无效(${cond.minTurn} > ${cond.maxTurn})`,
          event, '调整minTurn <= maxTurn');
      }
      
      if (cond.maxTurn > TOTAL_TURNS) {
        addIssue('EVENT-001', 'ERROR', module,
          `事件${event.id} maxTurn(${cond.maxTurn})超过游戏总回合(${TOTAL_TURNS})`,
          event, '调整maxTurn <= 52');
      }
      
      if (cond.maxTurn - cond.minTurn < 3) {
        addIssue('EVENT-001', 'WARNING', module,
          `事件${event.id}触发窗口过窄(${cond.maxTurn - cond.minTurn}周)`,
          event, '考虑扩大触发窗口');
      }
    }
    
    // Insight范围
    if (cond.minSan != null && cond.maxSan != null) {
      if (cond.minSan > cond.maxSan) {
        addIssue('EVENT-001', 'ERROR', module,
          `事件${event.id} SAN范围无效`,
          event, '调整minSan <= maxSan');
      }
      if (cond.maxSan > 100 || cond.minSan < 0) {
        addIssue('EVENT-001', 'ERROR', module,
          `事件${event.id} SAN范围超出0-100`,
          event, '调整SAN范围到[0,100]');
      }
    }
    
    // EVENT-002: 效果数值合理性
    const options = event.options || {};
    for (const [optionId, option] of Object.entries(options)) {
      const effects = option.effects || {};
      
      // HP边界
      if (effects.hp != null) {
        if (effects.hp < -100 || effects.hp > 100) {
          addIssue('EVENT-002', 'WARNING', module,
            `事件${event.id}.${optionId} HP变化(${effects.hp})幅度过大`,
            event, '考虑缩小HP变化范围');
        }
        
        if (effects.hp <= -100) {
          addIssue('EVENT-002', 'INFO', module,
            `事件${event.id}.${optionId}会导致立即死亡，确认是否为设计意图`,
            event, '如需保留则无需修改');
        }
      }
      
      // Insight检查
      if (effects.insight != null && Math.abs(effects.insight) > 50) {
        addIssue('EVENT-002', 'WARNING', module,
          `事件${event.id}.${optionId} insight变化(${effects.insight})幅度过大`,
          event, '考虑缩小insight变化范围');
      }
      
      // 构建触发图
      if (effects.spawnEvent) {
        if (!eventGraph[event.id]) eventGraph[event.id] = [];
        eventGraph[event.id].push(effects.spawnEvent);
      }
    }
    
    // EVENT-003: 事件分布统计
    const targetClasses = cond.requiredClass || CLASSES;
    for (const classId of targetClasses) {
      if (distribution[classId]) {
        distribution[classId].count++;
        
        // 计算净效果
        let netEffect = 0;
        for (const option of Object.values(options)) {
          const eff = option.effects || {};
          netEffect += (eff.hp || 0) + (eff.gold || 0) / 100;
        }
        
        if (netEffect > 5) distribution[classId].positive++;
        else if (netEffect < -5) distribution[classId].negative++;
        else distribution[classId].neutral++;
      }
    }
  }
  
  // 输出分布统计
  for (const [classId, stats] of Object.entries(distribution)) {
    if (stats.count < 15) {
      addIssue('EVENT-003', 'ERROR', module,
        `${classId}阶层事件数量过少(${stats.count})`,
        stats, '为此阶层添加更多事件');
    }
    
    const negativeRatio = stats.count > 0 ? stats.negative / stats.count : 0;
    if (negativeRatio > 0.6) {
      addIssue('EVENT-003', 'WARNING', module,
        `${classId}阶层负面事件占比${(negativeRatio*100).toFixed(0)}%过高`,
        stats, '考虑增加正面或中性事件');
    }
    
    if (stats.positive === 0 && stats.count > 0) {
      addIssue('EVENT-003', 'WARNING', module,
        `${classId}阶层无正面事件，体验可能过于压抑`,
        stats, '考虑添加一些正面事件');
    }
  }
  
  report.statistics.eventDistribution = distribution;
  
  // EVENT-004: 断链检查
  for (const [sourceId, targets] of Object.entries(eventGraph)) {
    for (const targetId of targets) {
      if (!allEventIds.has(targetId)) {
        addIssue('EVENT-004', 'ERROR', module,
          `事件${sourceId}引用不存在的事件${targetId}`,
          { sourceId, targetId }, '创建目标事件或修正spawnEvent引用');
      }
    }
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块6: 信仰系统逻辑检查 (FAITH) ====================
function checkFaithSystem(faiths, classes) {
  const module = 'FAITH';
  console.log(`\n📋 执行模块 ${module}: 信仰系统逻辑检查...`);
  
  for (const faith of faiths) {
    if (!faith.id) continue;
    
    // FAITH-001: 加入条件可达性
    if (!REGIONS.includes(faith.baseRegion)) {
      addIssue('FAITH-001', 'ERROR', module,
        `信仰${faith.id}无效的baseRegion: ${faith.baseRegion}`,
        faith, 'baseRegion必须是SLUMS/RUST_BELT/SUBURBS/DOWNTOWN之一');
    }
    
    const joinCost = faith.joinCost || {};
    
    // 金币要求检查
    if (joinCost.gold) {
      const maxInitialGold = Math.max(...classes.map(c => c.initialStats.gold));
      if (joinCost.gold > maxInitialGold * 3) {
        addIssue('FAITH-001', 'WARNING', module,
          `信仰${faith.id}加入费用(${joinCost.gold})过高，需要长期储蓄`,
          faith, '考虑降低joinCost.gold');
      }
    }
    
    // HP要求检查
    if (joinCost.minHp) {
      const maxHp = Math.max(...classes.map(c => c.initialStats.hp));
      if (joinCost.minHp > maxHp + 20) { // 假设最大恢复20HP
        addIssue('FAITH-001', 'ERROR', module,
          `信仰${faith.id} HP要求(${joinCost.minHp})无法达到`,
          faith, '降低minHp或提供足够的HP恢复途径');
      }
    }
    
    // FAITH-002: 仪式收益合理性
    const rite = faith.rite || {};
    
    const hasCost = rite.goldCostPercent || rite.hpCost || rite.minGoldCost;
    const hasBenefit = rite.baseHpReward || rite.baseInsightReward || rite.goldReward;
    
    if (!hasCost) {
      addIssue('FAITH-002', 'WARNING', module,
        `信仰${faith.id}仪式无成本，可能被滥用`,
        faith, '添加goldCostPercent、hpCost或minGoldCost');
    }
    
    if (!hasBenefit) {
      addIssue('FAITH-002', 'ERROR', module,
        `信仰${faith.id}仪式无收益，玩家不会使用`,
        faith, '添加baseHpReward、baseInsightReward或goldReward');
    }
    
    // CULT和REVOLUTION应增加insight（降低SAN）
    if (['CULT', 'REVOLUTION'].includes(faith.id)) {
      if ((rite.baseInsightReward || 0) <= 0) {
        addIssue('FAITH-002', 'WARNING', module,
          `${faith.id}是觉醒类信仰，但仪式不增加insight`,
          faith, '设置正的baseInsightReward');
      }
    }
    
    // CHURCH应降低insight（恢复SAN）
    if (faith.id === 'CHURCH') {
      if ((rite.baseInsightReward || 0) >= 0) {
        addIssue('FAITH-002', 'INFO', module,
          `CHURCH应降低insight（恢复SAN），当前配置为${rite.baseInsightReward}`,
          faith, '确保设计意图正确');
      }
    }
  }
  
  // FAITH-003: 信仰区域可达性
  for (const cls of classes) {
    // 简化检查：假设所有阶层可以到达所有区域
    // 实际应该根据游戏规则检查
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块7: 物品系统逻辑检查 (ITEM) ====================
function checkItemSystem(items) {
  const module = 'ITEM';
  console.log(`\n📋 执行模块 ${module}: 物品系统逻辑检查...`);
  
  // ITEM-001: 性价比与风险收益
  const foodItems = items.filter(item => item.tags?.includes('FOOD') && item.id);
  
  for (const item of foodItems) {
    if (item.type === 'CONSUMABLE') {
      // HP恢复成本
      if (item.effects?.hp && item.price > 0) {
        const costPerHp = item.price / item.effects.hp;
        if (costPerHp > 5) {
          addIssue('ITEM-001', 'INFO', module,
            `${item.name}恢复成本${costPerHp.toFixed(2)}/HP较高`,
            item, '考虑降低价格或增加HP恢复量');
        }
      }
      
      // 免费无副作用恢复HP
      if (item.price === 0 && !item.activeEffect && item.effects?.hp > 0) {
        addIssue('ITEM-001', 'WARNING', module,
          `${item.name}免费无副作用恢复HP，可能被滥用刷血`,
          item, '添加activeEffect风险或提高价格');
      }
    }
  }
  
  // ITEM-002: 区域可用性
  for (const region of REGIONS) {
    const regionItems = items.filter(item => 
      item.id && (item.regions?.includes(region) || !item.regions || item.regions.length === 0)
    );
    
    const foodCount = regionItems.filter(i => i.tags?.includes('FOOD')).length;
    const medicalCount = regionItems.filter(i => i.tags?.includes('MEDICAL')).length;
    
    if (foodCount === 0) {
      addIssue('ITEM-002', 'ERROR', module,
        `${region}区域无食物`,
        { region }, '添加至少一种食物物品');
    }
    
    if (medicalCount === 0) {
      addIssue('ITEM-002', 'WARNING', module,
        `${region}区域无医疗物品`,
        { region }, '考虑添加医疗物品');
    }
    
    const prices = regionItems.map(i => i.price || 0).filter(p => p > 0).sort((a, b) => a - b);
    if (prices.length > 0 && prices[0] > 20) {
      addIssue('ITEM-002', 'WARNING', module,
        `${region}区域最低价格${prices[0]}，无低价选择`,
        { region, prices }, '添加一些低价基础物品');
    }
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块8: 账单系统压力检查 (BILL) ====================
function checkBillSystem(bills, classes) {
  const module = 'BILL';
  console.log(`\n📋 执行模块 ${module}: 账单系统压力检查...`);
  
  for (const bill of bills) {
    if (!bill.id || bill.id.startsWith('_comment')) continue;
    
    // 获取区域收入
    const targetClass = bill.triggerCondition?.requiredClass?.[0] || 'WORKER';
    const cls = classes.find(c => c.id === targetClass);
    const regionIncome = cls ? cls.baseSalary : 3200;
    
    // BILL-001: 账单金额与频率
    const amount = Math.abs(bill.amount || 0);
    
    if (amount > regionIncome * 8) {
      addIssue('BILL-001', 'ERROR', module,
        `账单${bill.id}金额${amount}超过月收入2倍`,
        bill, '降低账单金额');
    } else if (amount > regionIncome * 4) {
      addIssue('BILL-001', 'WARNING', module,
        `账单${bill.id}金额超过月收入，可能导致立即违约`,
        bill, '考虑降低金额或分阶段扣除');
    }
    
    // 权重检查
    if (bill.weight > 10 && amount > 1000) {
      addIssue('BILL-001', 'WARNING', module,
        `高金额账单${bill.id}权重(${bill.weight})过高`,
        bill, '考虑降低weight');
    }
    
    // HP伤害检查
    if (bill.effects?.hp && bill.effects.hp < -20) {
      addIssue('BILL-001', 'INFO', module,
        `账单${bill.id}伴随严重HP伤害(${bill.effects.hp})，双重惩罚`,
        bill, '确认是否为设计意图');
    }
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块9: 结局条件可达性检查 (ENDING) ====================
function checkEndingSystem(endings, events, classes) {
  const module = 'ENDING';
  console.log(`\n📋 执行模块 ${module}: 结局条件可达性检查...`);
  
  for (const ending of endings) {
    if (!ending.id) continue;
    
    const cond = ending.conditions || {};
    
    // 资产条件
    if (cond.maxGold != null && cond.maxGold < -10000) {
      addIssue('ENDING-001', 'WARNING', module,
        `结局${ending.id}需要负债超过10000，检查是否有事件能造成如此大额负债`,
        ending, '确认是否有足够多的事件可能导致如此负债');
    }
    
    if (cond.minGold != null && cond.minGold > 500000) {
      addIssue('ENDING-001', 'INFO', module,
        `结局${ending.id}需要资产${cond.minGold}，可能是隐藏/困难结局`,
        ending, '如需保留则无需修改');
    }
    
    // Insight条件
    if (cond.minInsight != null && cond.minInsight > 90) {
      addIssue('ENDING-001', 'WARNING', module,
        `结局${ending.id}需要极高insight(${cond.minInsight})`,
        ending, '确认游戏中有足够的insightGain来源');
    }
    
    if (cond.maxInsight != null && cond.maxInsight < 20) {
      addIssue('ENDING-001', 'WARNING', module,
        `结局${ending.id}需要极低insight(${cond.maxInsight})`,
        ending, '确认游戏中有足够的insightClear来源');
    }
    
    // 阶层条件
    if (cond.requiredClass && !classes.some(c => c.id === cond.requiredClass)) {
      addIssue('ENDING-001', 'ERROR', module,
        `结局${ending.id}引用了无效的阶层${cond.requiredClass}`,
        ending, '修正requiredClass为有效阶层ID');
    }
    
    // 回合条件
    if (cond.minTurn != null && cond.minTurn > TOTAL_TURNS) {
      addIssue('ENDING-001', 'ERROR', module,
        `结局${ending.id} minTurn(${cond.minTurn})超过游戏总回合`,
        ending, '降低minTurn <= 52');
    }
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块10: Buff系统完整性检查 (BUFF) ====================
function checkBuffSystem(items, hospitalServices, diseases) {
  const module = 'BUFF';
  console.log(`\n📋 执行模块 ${module}: Buff系统完整性检查...`);
  
  // 收集所有buff引用
  const buffRefs = new Set();
  
  // 从物品收集
  for (const item of items) {
    if (!item.id) continue;
    if (item.activeEffect?.params?.buffId) {
      buffRefs.add(item.activeEffect.params.buffId);
    }
  }
  
  // 从医疗服务收集
  for (const service of hospitalServices) {
    if (service.effects?.addBuff) {
      buffRefs.add(service.effects.addBuff);
    }
    if (service.effects?.removeBuff) {
      buffRefs.add(service.effects.removeBuff);
    }
  }
  
  // 注意：由于没有buffs.json文件，只报告引用情况
  if (buffRefs.size > 0) {
    addIssue('BUFF-001', 'INFO', module,
      `发现${buffRefs.size}个buff引用: ${Array.from(buffRefs).join(', ')}`,
      { buffs: Array.from(buffRefs) },
      '确保这些buff在buffs.json中有定义');
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 模块11: 工作系统逻辑检查 (WORK) ====================
function checkWorkSystem(jobs, classes) {
  const module = 'WORK';
  console.log(`\n📋 执行模块 ${module}: 工作系统逻辑检查...`);
  
  for (const job of jobs) {
    if (!job.id) continue;
    
    const jobClass = classes.find(c => c.id === job.requiredClass);
    if (!jobClass) {
      addIssue('WORK-001', 'ERROR', module,
        `工作${job.id}引用了无效的阶层${job.requiredClass}`,
        job, '修正requiredClass为有效阶层ID');
      continue;
    }
    
    // 收入检查
    const weeklyIncome = job.baseSalary / 4;
    const classAvgIncome = jobClass.baseSalary / 4;
    
    if (weeklyIncome < classAvgIncome * 0.3) {
      addIssue('WORK-001', 'WARNING', module,
        `工作${job.id}收入(${weeklyIncome})远低于阶层平均水平`,
        job, '考虑增加baseSalary');
    }
    
    // HP消耗检查
    if (job.hpCost > 60) {
      addIssue('WORK-001', 'WARNING', module,
        `工作${job.id} HP消耗(${job.hpCost})过高，可能无法持续`,
        job, '考虑降低hpCost');
    }
  }
  
  console.log(`   ✅ 模块 ${module} 检查完成`);
}

// ==================== 主函数 ====================
function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('          游戏逻辑一致性检查报告 v3.0');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`执行时间: ${new Date().toLocaleString()}`);
  console.log(`游戏总回合: ${TOTAL_TURNS}周 (1年)`);
  
  // 加载数据
  console.log('\n📦 加载数据文件...');
  const classes = loadJson('classes.json') || [];
  const jobs = loadJson('jobs.json') || [];
  const housing = loadJson('housing.json') || [];
  const items = loadJson('items.json') || [];
  const vehicles = loadJson('vehicles.json') || [];
  const loans = loadJson('loans.json') || [];
  const hospitalServices = loadJson('hospital_services.json') || [];
  const diseases = loadJson('diseases.json') || [];
  const faiths = loadJson('faiths.json') || [];
  const endings = loadJson('endings.json') || [];
  const bills = loadJson('bills.json') || [];
  const insurance = loadJson('insurance.json') || [];
  const events = loadAllEvents();
  
  console.log(`   - classes: ${classes.length} 条`);
  console.log(`   - jobs: ${jobs.length} 条`);
  console.log(`   - housing: ${housing.length} 条`);
  console.log(`   - items: ${items.length} 条`);
  console.log(`   - vehicles: ${vehicles.length} 条`);
  console.log(`   - loans: ${loans.length} 条`);
  console.log(`   - hospital_services: ${hospitalServices.length} 条`);
  console.log(`   - diseases: ${diseases.length} 条`);
  console.log(`   - faiths: ${faiths.length} 条`);
  console.log(`   - endings: ${endings.length} 条`);
  console.log(`   - bills: ${bills.length} 条`);
  console.log(`   - insurance: ${insurance.length} 条`);
  console.log(`   - events: ${events.length} 个文件`);
  
  // 执行所有检查
  checkBaseLogic(classes, housing, jobs);
  checkTimeSystem(loans, hospitalServices, diseases, events, housing);
  checkEconomicSustainability(classes, jobs, housing, items, loans);
  checkMedicalSystem(hospitalServices, diseases, classes);
  checkEventSystem(events, classes);
  checkFaithSystem(faiths, classes);
  checkItemSystem(items);
  checkBillSystem(bills, classes);
  checkEndingSystem(endings, events, classes);
  checkBuffSystem(items, hospitalServices, diseases);
  checkWorkSystem(jobs, classes);
  
  // 输出报告
  printReport();
}

function printReport() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    检查报告汇总');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // 统计摘要
  console.log('\n📊 统计摘要:');
  console.log(`   总检查项: ${report.summary.totalChecks}`);
  console.log(`   ✅ 通过: ${report.summary.passed}`);
  console.log(`   ❌ 错误: ${report.summary.errors}`);
  console.log(`   ⚠️  警告: ${report.summary.warnings}`);
  console.log(`   ℹ️  信息: ${report.summary.info}`);
  
  // 按模块统计
  console.log('\n📁 按模块统计:');
  for (const [module, stats] of Object.entries(report.byModule)) {
    const issueCount = stats.issues.length;
    const status = issueCount === 0 ? '✅' : issueCount > 5 ? '❌' : '⚠️';
    console.log(`   ${status} ${module}: ${stats.passed} 通过, ${issueCount} 问题`);
  }
  
  // 严重问题
  if (report.critical.length > 0) {
    console.log('\n🚨 严重问题 (必须修复):');
    report.critical.forEach((issue, i) => {
      console.log(`\n   ${i + 1}. [${issue.code}] ${issue.message}`);
      console.log(`      💡 建议: ${issue.suggestion}`);
    });
  }
  
  // 错误
  if (report.errors.length > 0) {
    console.log('\n❌ 错误 (应该修复):');
    report.errors.slice(0, 20).forEach((issue, i) => {
      console.log(`\n   ${i + 1}. [${issue.code}] ${issue.message}`);
      console.log(`      💡 建议: ${issue.suggestion}`);
    });
    if (report.errors.length > 20) {
      console.log(`   ... 还有 ${report.errors.length - 20} 个错误`);
    }
  }
  
  // 警告
  if (report.warnings.length > 0) {
    console.log('\n⚠️  警告 (建议修复):');
    report.warnings.slice(0, 15).forEach((issue, i) => {
      console.log(`\n   ${i + 1}. [${issue.code}] ${issue.message}`);
      console.log(`      💡 建议: ${issue.suggestion}`);
    });
    if (report.warnings.length > 15) {
      console.log(`   ... 还有 ${report.warnings.length - 15} 个警告`);
    }
  }
  
  // 统计数据
  console.log('\n📈 关键统计数据:');
  
  if (report.statistics.survivalEstimate) {
    console.log('\n   生存预估 (按阶层):');
    for (const [classId, stats] of Object.entries(report.statistics.survivalEstimate)) {
      const status = stats.netFlow >= 0 ? '✅ 可持续' : 
                    stats.bankruptcyTurns > 26 ? '⚠️ 半年内破产' : 
                    stats.bankruptcyTurns > 10 ? '❌ 10-26周破产' : '🚨 10周内破产';
      console.log(`      ${classId}: 周净现金流 ${stats.netFlow.toFixed(0)} | ${status}`);
    }
  }
  
  if (report.statistics.eventDistribution) {
    console.log('\n   事件分布 (按阶层):');
    for (const [classId, stats] of Object.entries(report.statistics.eventDistribution)) {
      console.log(`      ${classId}: 共${stats.count}个 | 正面${stats.positive} | 负面${stats.negative} | 中性${stats.neutral}`);
    }
  }
  
  if (report.statistics.loanFeasibility) {
    console.log('\n   贷款可行性:');
    for (const [loanId, stats] of Object.entries(report.statistics.loanFeasibility)) {
      const status = stats.paymentRatio > 1 ? '❌ 无法偿还' : 
                    stats.paymentRatio > 0.5 ? '⚠️ 压力极大' : '✅ 可行';
      console.log(`      ${loanId}: 还款占比 ${(stats.paymentRatio*100).toFixed(0)}% | ${status}`);
    }
  }
  
  // 总结
  console.log('\n═══════════════════════════════════════════════════════════════');
  const totalIssues = report.critical.length + report.errors.length + report.warnings.length;
  if (totalIssues === 0) {
    console.log('🎉 所有检查通过！未发现逻辑问题。');
  } else {
    console.log(`📋 检查完成: 发现 ${report.critical.length} 个严重问题, ${report.errors.length} 个错误, ${report.warnings.length} 个警告`);
    console.log('💡 建议优先修复严重问题和错误，再根据时间处理警告。');
  }
  console.log('═══════════════════════════════════════════════════════════════');
}

// 执行主函数
main();
