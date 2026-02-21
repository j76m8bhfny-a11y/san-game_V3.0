// src/logic/medical.ts
import { MedicalService, PlayerClass, RegionID, Insurance, GameDataCache } from '@/types/schema';
// ✅ 引入新设计的医疗规则配置
import medicalRules from '@/assets/data/rules/medical_rules.json';

interface CostResult {
  originalCost: number;
  finalCost: number;
  coveredAmount: number;
  copayRate: number;
  reason: string;
  insuranceCoverage?: number; // 保险覆盖比例（用于延迟账单计算）
  deductibleStatus?: {        // 免赔额状态
    currentSpent: number;
    deductible: number;
    remaining: number;
    isMet: boolean;
  };
}

// 默认配置兜底
const defaultMessages = {
  noInsurance: "无保险覆盖",
  notInCatalog: "此服务不在医保目录内",
  planNotCover: "您的保险计划不包含此类服务",
  cashTransaction: "现金交易",
  invalidService: "无效服务",
  invalidCost: "无效费用"
};

const defaultTheme = {
  name: "社区诊所",
  desc: "基础医疗服务。",
  bg: "bg-gray-900",
  accent: "text-white",
  border: "border-white/10",
  icon: "✚"
};

// 安全获取配置消息
const getMessage = (key: keyof typeof defaultMessages): string => {
  return medicalRules.messages?.[key] ?? defaultMessages[key];
};

/**
 * 计算医疗服务最终费用
 * 逻辑流：基础费用 -> 保险报销计算 -> 特殊政策覆盖(JSON配置)
 * 
 * ✅ 新增：支持HDHP高免赔额健康计划
 * - 免赔额未满足前：基础门诊全额自付，急诊部分自付
 * - 免赔额满足后：正常报销
 */
export const calculateMedicalCost = (
  service: MedicalService,
  insurance: Insurance | null,
  playerClass: PlayerClass,
  deductibleTracker?: { currentSpent: number; deductible: number; isMet: boolean }
): CostResult => {
  // 参数校验
  if (!service || typeof service.baseCost !== 'number') {
    return { originalCost: 0, finalCost: 0, coveredAmount: 0, copayRate: 0, reason: getMessage('invalidService') };
  }
  
  const cost = service.baseCost;
  
  // 边界检查：处理 NaN 和 Infinity
  if (!isFinite(cost)) {
    return { originalCost: 0, finalCost: 0, coveredAmount: 0, copayRate: 0, reason: getMessage('invalidCost') };
  }
  
  // 1. 特殊交易（如卖肾赚钱），直接返回
  if (cost <= 0) {
    return {
      originalCost: cost,
      finalCost: cost,
      coveredAmount: 0,
      copayRate: 0,
      reason: getMessage('cashTransaction')
    };
  }

  // 2. 初始状态：无保险全额自付
  let copayRate = 1.0;
  let reason = getMessage('noInsurance');
  let insuranceCoverage = 0;

  // 3. 计算商业保险报销 (Standard Insurance Logic)
  if (insurance) {
    if (service.insurance?.isCovered) {
      let isPlanCovering = true;
      
      // 检查具体险种条款 (EMERGENCY/MENTAL/ADDICTION)
      if (service.type === 'EMERGENCY' && !insurance.coverage?.emergencyCovered) isPlanCovering = false;
      if (service.type === 'THERAPY' && !insurance.coverage?.mentalCovered) isPlanCovering = false;
      if (service.type === 'DRUG' && !insurance.coverage?.addictionCovered) isPlanCovering = false;

      // ✅ HDHP免赔额机制检查
      const hasDeductible = insurance.coverage?.deductible && (insurance.coverage as any).deductible > 0;
      
      if (isPlanCovering && hasDeductible && deductibleTracker && !deductibleTracker.isMet) {
        // 免赔额未满足
        const isEmergency = service.type === 'EMERGENCY';
        
        if (!isEmergency && (service.type === 'DRUG' || service.type === 'THERAPY')) {
          // 基础门诊在免赔额内：全额自付
          copayRate = 1.0;
          reason = `保险提示：未达免赔额$${(insurance.coverage as any).deductible}，此项全额自付`;
          insuranceCoverage = 0;
        } else if (isEmergency) {
          // 急诊在免赔额内：部分覆盖（模拟网络外急诊）
          copayRate = 0.8; // 80%自付
          reason = `急诊部分覆盖：未达免赔额，需自付80%`;
          insuranceCoverage = 0.2;
        } else {
          // 其他服务正常计算
          const serviceCopay = Math.max(0, Math.min(1, service.insurance.baseCopayRate ?? 1.0));
          const planCopay = Math.max(0, Math.min(1, insurance.coverage.copayModifier ?? 1.0));
          copayRate = Math.max(serviceCopay, planCopay);
          reason = `保险报销 ${((1 - copayRate) * 100).toFixed(0)}% (免赔额进度: $${deductibleTracker.currentSpent}/$${deductibleTracker.deductible})`;
          insuranceCoverage = 1 - copayRate;
        }
      } else if (isPlanCovering) {
        // 免赔额已满足或无免赔额：正常报销
        const serviceCopay = Math.max(0, Math.min(1, service.insurance.baseCopayRate ?? 1.0));
        const planCopay = Math.max(0, Math.min(1, insurance.coverage.copayModifier ?? 1.0));
        copayRate = Math.max(serviceCopay, planCopay);
        reason = deductibleTracker?.isMet 
          ? `保险报销 ${((1 - copayRate) * 100).toFixed(0)}% (免赔额已满足)`
          : `保险报销 ${((1 - copayRate) * 100).toFixed(0)}%`;
        insuranceCoverage = 1 - copayRate;
      } else {
        reason = getMessage('planNotCover');
      }
    } else {
      reason = getMessage('notInCatalog');
    }
  }

  // 4. ✅ 重构：特殊政策覆盖 (Special Policies Override)
  if (medicalRules.policies?.specialAid) {
    for (const policy of medicalRules.policies.specialAid) {
      if (!policy.match || !policy.effect) continue;
      
      const matchClass = policy.match.class === "ANY" || policy.match.class === playerClass;
      const matchType = policy.match.serviceType === "ANY" || policy.match.serviceType === service.type;
      
      if (matchClass && matchType) {
        copayRate = Math.max(0, Math.min(1, policy.effect.copayRate ?? 1.0));
        reason = policy.effect.reason || reason;
        insuranceCoverage = 1 - copayRate;
        break;
      }
    }
  }

  // 5. 计算最终金额
  const finalCost = Math.max(0, Math.floor(cost * copayRate));
  const coveredAmount = cost - finalCost;

  return { 
    originalCost: cost, 
    finalCost, 
    coveredAmount, 
    copayRate, 
    reason,
    insuranceCoverage,
    deductibleStatus: deductibleTracker ? {
      currentSpent: deductibleTracker.currentSpent,
      deductible: deductibleTracker.deductible,
      remaining: Math.max(0, deductibleTracker!.deductible - deductibleTracker!.currentSpent),
      isMet: deductibleTracker.isMet
    } : undefined
  };
};

/**
 * 计算医疗服务风险率
 * 统一的风险率计算逻辑，避免 UI 显示与实际计算不一致
 */
export const calculateRiskRate = (service: MedicalService): number => {
  const baseRisk = service.requirements?.riskRate || 0;
  const multiplier = medicalRules.settings?.baseRiskMultiplier || 1.0;
  // 边界检查：确保风险率在 [0, 1] 范围内
  return Math.min(Math.max(0, baseRisk * multiplier), 1.0);
};

/**
 * 获取区域特定的医院主题配置
 * 优先级：Mod/动态数据 > 静态规则配置 > 默认兜底
 */
export const getHospitalTheme = (region: RegionID, gameDataCache?: GameDataCache) => {
  // 1. 尝试从 Runtime 缓存读取 (支持 Mod 或动态修改)
  const regionData = gameDataCache?.regions?.find((r: any) => r.id === region);
  if (regionData?.hospitalTheme) {
    return regionData.hospitalTheme;
  }

  // 2. ✅ 重构：从 medicalRules.json 读取静态配置
  // 使用类型断言处理 JSON 索引
  const themes = medicalRules.hospitalThemes as Record<string, any>;
  const theme = themes?.[region];

  if (theme) {
    return theme;
  }

  // 3. 兜底逻辑 (Fallback) - 优先使用配置中的 DEFAULT，否则使用硬编码默认值
  return themes?.['DEFAULT'] || defaultTheme;
};