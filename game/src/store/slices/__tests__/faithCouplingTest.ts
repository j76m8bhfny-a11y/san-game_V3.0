/**
 * 宗教系统耦合测试
 * 验证新版本 faiths.json + faith_rules.json + bills.json 的集成
 */

import { FaithID } from '@/types/schema';
import faithsData from '@/assets/data/faiths.json';
import faithRules from '@/assets/data/rules/faith_rules.json';
import billsData from '@/assets/data/bills.json';

// ==========================================
// 测试1: 仪式配置验证
// ==========================================

export const testRiteConfigurations = () => {
  const results: { faith: string; passed: boolean; issues: string[] }[] = [];

  // CHURCH测试
  const church = faithsData.find(f => f.id === 'CHURCH');
  const churchIssues: string[] = [];
  
  if (!church) churchIssues.push('CHURCH配置缺失');
  else {
    if (church.rite.baseInsightReward !== -15) 
      churchIssues.push(`CHURCH灵视奖励应为-15, 实际为${church.rite.baseInsightReward}`);
    if (church.rite.goldCostPercent !== 0.1) 
      churchIssues.push(`CHURCH金币百分比应为0.1, 实际为${church.rite.goldCostPercent}`);
    if (church.rite.minGoldCost !== 50) 
      churchIssues.push(`CHURCH最小金币应为50, 实际为${church.rite.minGoldCost}`);
    if (church.rite.baseHpReward !== 5) 
      churchIssues.push(`CHURCH HP奖励应为5, 实际为${church.rite.baseHpReward}`);
  }
  
  results.push({ 
    faith: 'CHURCH', 
    passed: churchIssues.length === 0, 
    issues: churchIssues 
  });

  // BROTHERHOOD测试
  const brotherhood = faithsData.find(f => f.id === 'BROTHERHOOD');
  const brotherhoodIssues: string[] = [];
  
  if (!brotherhood) brotherhoodIssues.push('BROTHERHOOD配置缺失');
  else {
    if (brotherhood.rite.baseInsightReward !== -5) 
      brotherhoodIssues.push(`BROTHERHOOD灵视奖励应为-5, 实际为${brotherhood.rite.baseInsightReward}`);
    if (brotherhood.rite.baseHpReward !== 10) 
      brotherhoodIssues.push(`BROTHERHOOD HP奖励应为10, 实际为${brotherhood.rite.baseHpReward}`);
    if (brotherhood.rite.goldCostPercent !== undefined) 
      brotherhoodIssues.push(`BROTHERHOOD不应有金币消耗`);
  }
  
  results.push({ 
    faith: 'BROTHERHOOD', 
    passed: brotherhoodIssues.length === 0, 
    issues: brotherhoodIssues 
  });

  // CULT测试
  const cult = faithsData.find(f => f.id === 'CULT');
  const cultIssues: string[] = [];
  
  if (!cult) cultIssues.push('CULT配置缺失');
  else {
    if (cult.rite.baseInsightReward !== 8) 
      cultIssues.push(`CULT灵视奖励应为8, 实际为${cult.rite.baseInsightReward}`);
    if (cult.rite.hpCost !== 10) 
      cultIssues.push(`CULT HP消耗应为10, 实际为${cult.rite.hpCost}`);
    if (cult.rite.goldReward !== 120) 
      cultIssues.push(`CULT金币奖励应为120, 实际为${cult.rite.goldReward}`);
  }
  
  results.push({ 
    faith: 'CULT', 
    passed: cultIssues.length === 0, 
    issues: cultIssues 
  });

  // REVOLUTION测试
  const revolution = faithsData.find(f => f.id === 'REVOLUTION');
  const revolutionIssues: string[] = [];
  
  if (!revolution) revolutionIssues.push('REVOLUTION配置缺失');
  else {
    if (revolution.rite.baseInsightReward !== 15) 
      revolutionIssues.push(`REVOLUTION灵视奖励应为15, 实际为${revolution.rite.baseInsightReward}`);
    if (revolution.rite.hpCost !== 10) 
      revolutionIssues.push(`REVOLUTION HP消耗应为10, 实际为${revolution.rite.hpCost}`);
    if (revolution.rite.redPointReward !== 10) 
      revolutionIssues.push(`REVOLUTION红色倾向应为10, 实际为${revolution.rite.redPointReward}`);
  }
  
  results.push({ 
    faith: 'REVOLUTION', 
    passed: revolutionIssues.length === 0, 
    issues: revolutionIssues 
  });

  return results;
};

// ==========================================
// 测试2: 退出惩罚验证
// ==========================================

export const testLeavePenalties = () => {
  const results: { faith: string; passed: boolean; issues: string[] }[] = [];

  // CHURCH退出惩罚
  const churchPenalty = faithRules.leavePenalties?.CHURCH;
  const churchIssues: string[] = [];
  
  if (!churchPenalty) churchIssues.push('CHURCH退出惩罚缺失');
  else {
    if (churchPenalty.insightChange !== 30) 
      churchIssues.push(`CHURCH灵视变化应为+30, 实际为${churchPenalty.insightChange}`);
    if (churchPenalty.maxHpChange !== -5) 
      churchIssues.push(`CHURCH最大HP变化应为-5, 实际为${churchPenalty.maxHpChange}`);
  }
  
  results.push({ faith: 'CHURCH', passed: churchIssues.length === 0, issues: churchIssues });

  // BROTHERHOOD退出惩罚
  const brotherhoodPenalty = faithRules.leavePenalties?.BROTHERHOOD;
  const brotherhoodIssues: string[] = [];
  
  if (!brotherhoodPenalty?.debuff) brotherhoodIssues.push('BROTHERHOOD Debuff缺失');
  else {
    if (brotherhoodPenalty.debuff.duration !== 21) 
      brotherhoodIssues.push(`BROTHERHOOD持续时间应为21, 实际为${brotherhoodPenalty.debuff.duration}`);
    if (brotherhoodPenalty.debuff.effect?.incomeMultiplier !== 0.75) 
      brotherhoodIssues.push(`BROTHERHOOD收入倍率应为0.75, 实际为${brotherhoodPenalty.debuff.effect?.incomeMultiplier}`);
  }
  
  results.push({ faith: 'BROTHERHOOD', passed: brotherhoodIssues.length === 0, issues: brotherhoodIssues });

  // CULT退出惩罚
  const cultPenalty = faithRules.leavePenalties?.CULT;
  const cultIssues: string[] = [];
  
  if (!cultPenalty?.debuff) cultIssues.push('CULT Debuff缺失');
  else {
    if (cultPenalty.maxHpChange !== -15) 
      cultIssues.push(`CULT最大HP变化应为-15, 实际为${cultPenalty.maxHpChange}`);
    if (cultPenalty.debuff.effect?.hpDrain !== 3) 
      cultIssues.push(`CULT HP流失应为3, 实际为${cultPenalty.debuff.effect?.hpDrain}`);
    if (cultPenalty.debuff.effect?.insightDrain !== -3) 
      cultIssues.push(`CULT灵视流失应为-3(即+3), 实际为${cultPenalty.debuff.effect?.insightDrain}`);
  }
  
  results.push({ faith: 'CULT', passed: cultIssues.length === 0, issues: cultIssues });

  // REVOLUTION退出惩罚
  const revolutionPenalty = faithRules.leavePenalties?.REVOLUTION;
  const revolutionIssues: string[] = [];
  
  if (!revolutionPenalty?.debuff) revolutionIssues.push('REVOLUTION Debuff缺失');
  else {
    if (!revolutionPenalty.permanentBan) 
      revolutionIssues.push('REVOLUTION应设置永久封禁');
    if (revolutionPenalty.debuff.effect?.incomeMultiplier !== 0.5) 
      revolutionIssues.push(`REVOLUTION收入倍率应为0.5, 实际为${revolutionPenalty.debuff.effect?.incomeMultiplier}`);
  }
  
  results.push({ faith: 'REVOLUTION', passed: revolutionIssues.length === 0, issues: revolutionIssues });

  return results;
};

// ==========================================
// 测试3: 高灵视惩罚账单验证
// ==========================================

export const testInsightBills = () => {
  const results: { bill: string; passed: boolean; issues: string[] }[] = [];

  const lightBill = billsData.find(b => b.id === 'B_INSIGHT_ANXIETY_LIGHT');
  const lightIssues: string[] = [];
  
  if (!lightBill) lightIssues.push('轻度焦虑账单缺失');
  else {
    if (lightBill.triggerCondition?.minInsight !== 70) 
      lightIssues.push(`轻度最小灵视应为70, 实际为${lightBill.triggerCondition?.minInsight}`);
    if (lightBill.triggerCondition?.maxInsight !== 79) 
      lightIssues.push(`轻度最大灵视应为79, 实际为${lightBill.triggerCondition?.maxInsight}`);
    if (lightBill.weight !== 60) 
      lightIssues.push(`轻度权重应为60, 实际为${lightBill.weight}`);
  }
  
  results.push({ bill: 'B_INSIGHT_ANXIETY_LIGHT', passed: lightIssues.length === 0, issues: lightIssues });

  const severeBill = billsData.find(b => b.id === 'B_INSIGHT_ANXIETY_SEVERE');
  const severeIssues: string[] = [];
  
  if (!severeBill) severeIssues.push('重度焦虑账单缺失');
  else {
    if (severeBill.triggerCondition?.minInsight !== 80) 
      severeIssues.push(`重度最小灵视应为80, 实际为${severeBill.triggerCondition?.minInsight}`);
    if (severeBill.weight !== 120) 
      severeIssues.push(`重度权重应为120, 实际为${severeBill.weight}`);
  }
  
  results.push({ bill: 'B_INSIGHT_ANXIETY_SEVERE', passed: severeIssues.length === 0, issues: severeIssues });

  const breakdownBill = billsData.find(b => b.id === 'B_INSIGHT_BREAKDOWN');
  const breakdownIssues: string[] = [];
  
  if (!breakdownBill) breakdownIssues.push('精神崩溃账单缺失');
  else {
    if (breakdownBill.triggerCondition?.minInsight !== 90) 
      breakdownIssues.push(`崩溃最小灵视应为90, 实际为${breakdownBill.triggerCondition?.minInsight}`);
    if (breakdownBill.weight !== 300) 
      breakdownIssues.push(`崩溃权重应为300, 实际为${breakdownBill.weight}`);
  }
  
  results.push({ bill: 'B_INSIGHT_BREAKDOWN', passed: breakdownIssues.length === 0, issues: breakdownIssues });

  return results;
};

// ==========================================
// 运行所有测试
// ==========================================

export const runAllFaithTests = () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           宗教系统耦合测试 - 灵视=痛苦版本                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('【测试1】仪式配置验证');
  console.log('────────────────────────────────────────────────────────────');
  testRiteConfigurations().forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.faith}: ${r.passed ? '通过' : '失败'}`);
    r.issues.forEach(i => console.log(`   └─ ${i}`));
  });

  console.log('\n【测试2】退出惩罚验证');
  console.log('────────────────────────────────────────────────────────────');
  testLeavePenalties().forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.faith}: ${r.passed ? '通过' : '失败'}`);
    r.issues.forEach(i => console.log(`   └─ ${i}`));
  });

  console.log('\n【测试3】高灵视惩罚账单验证');
  console.log('────────────────────────────────────────────────────────────');
  testInsightBills().forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.bill}: ${r.passed ? '通过' : '失败'}`);
    r.issues.forEach(i => console.log(`   └─ ${i}`));
  });
};

export default runAllFaithTests;
