// src/logic/medical.ts
import { MedicalService, PlayerClass, RegionID, ActiveInsuranceState } from '@/types/schema';
// ✅ 引入新设计的医疗规则配置
import medicalRules from '@/assets/data/rules/medicalRules.json';

interface CostResult {
  originalCost: number;
  finalCost: number;
  coveredAmount: number;
  copayRate: number;
  reason: string;
}

/**
 * 计算医疗服务最终费用
 * 逻辑流：基础费用 -> 保险报销计算 -> 特殊政策覆盖(JSON配置)
 */
export const calculateMedicalCost = (
  service: MedicalService,
  insurance: ActiveInsuranceState | null,
  playerClass: PlayerClass
): CostResult => {
  // 参数校验
  if (!service || typeof service.baseCost !== 'number') {
    return { originalCost: 0, finalCost: 0, coveredAmount: 0, copayRate: 0, reason: "无效服务" };
  }
  
  const cost = service.baseCost;
  
  // 边界检查：处理 NaN 和 Infinity
  if (!isFinite(cost)) {
    return { originalCost: 0, finalCost: 0, coveredAmount: 0, copayRate: 0, reason: "无效费用" };
  }
  
  // 1. 特殊交易（如卖肾赚钱），直接返回
  if (cost <= 0) {
    return { 
      originalCost: cost, 
      finalCost: cost, 
      coveredAmount: 0, 
      copayRate: 0, 
      reason: "现金交易" 
    };
  }

  // 2. 初始状态：无保险全额自付
  let copayRate = 1.0;
  let reason = "无保险覆盖";

  // 3. 计算商业保险报销 (Standard Insurance Logic)
  if (insurance) {
    if (service.insurance?.isCovered) {
      let isPlanCovering = true;
      
      // 检查具体险种条款 (EMERGENCY/MENTAL/ADDICTION)
      // 这些逻辑属于保险产品的核心机制，保留在代码逻辑中较为稳妥，
      // 具体的 true/false 状态由 insurance.json 数据控制。
      if (service.type === 'EMERGENCY' && !insurance.coverage?.emergencyCovered) isPlanCovering = false;
      if (service.type === 'THERAPY' && !insurance.coverage?.mentalCovered) isPlanCovering = false;
      if (service.type === 'DRUG' && !insurance.coverage?.addictionCovered) isPlanCovering = false;

      if (isPlanCovering) {
        // 取最大值：服务本身的基础自付 vs 保险计划的自付修正
        // 边界检查：确保 copayRate 在 [0, 1] 范围内
        const serviceCopay = Math.max(0, Math.min(1, service.insurance.baseCopayRate ?? 1.0));
        const planCopay = Math.max(0, Math.min(1, insurance.coverage.copayModifier ?? 1.0));
        copayRate = Math.max(serviceCopay, planCopay);
        reason = `保险报销 ${((1 - copayRate) * 100).toFixed(0)}%`;
      } else {
        reason = "您的保险计划不包含此类服务";
      }
    } else {
      reason = "此服务不在医保目录内";
    }
  }

  // 4. ✅ 重构：特殊政策覆盖 (Special Policies Override)
  // 不再硬编码 if (Homeless && Emergency)...
  // 而是遍历 rules.json 中的 policies.specialAid 数组
  if (medicalRules.policies?.specialAid) {
    for (const policy of medicalRules.policies.specialAid) {
      // 防御性检查：确保 policy 结构完整
      if (!policy.match || !policy.effect) continue;
      
      // 检查阶级匹配 (支持 "ANY" 通配符)
      const matchClass = policy.match.class === "ANY" || policy.match.class === playerClass;
      // 检查服务类型匹配 (支持 "ANY" 通配符)
      const matchType = policy.match.serviceType === "ANY" || policy.match.serviceType === service.type;
      
      if (matchClass && matchType) {
        // 命中策略，强制覆盖自付比例和文案
        copayRate = Math.max(0, Math.min(1, policy.effect.copayRate ?? 1.0));
        reason = policy.effect.reason || reason;
        break; // 找到最高优先级的策略即停止（假设配置顺序即优先级）
      }
    }
  }

  // 5. 计算最终金额
  // 边界检查：确保最终费用不为负数
  const finalCost = Math.max(0, Math.floor(cost * copayRate));
  const coveredAmount = cost - finalCost;

  return { originalCost: cost, finalCost, coveredAmount, copayRate, reason };
};

/**
 * 获取区域特定的医院主题配置
 * 优先级：Mod/动态数据 > 静态规则配置 > 默认兜底
 */
export const getHospitalTheme = (region: RegionID, gameDataCache?: any) => {
  // 1. 尝试从 Runtime 缓存读取 (支持 Mod 或动态修改)
  const regionData = gameDataCache?.regions?.find((r: any) => r.id === region);
  if (regionData?.hospitalTheme) {
    return regionData.hospitalTheme;
  }

  // 2. ✅ 重构：从 medicalRules.json 读取静态配置
  // 防御性检查：确保 hospitalThemes 存在
  if (!medicalRules.hospitalThemes) {
    return {
      name: "社区诊所",
      desc: "基础医疗服务。",
      bg: "bg-gray-900",
      accent: "text-white",
      border: "border-white/10",
      icon: "✚"
    };
  }
  
  // 使用类型断言处理 JSON 索引
  const themes = medicalRules.hospitalThemes as Record<string, any>;
  const theme = themes[region];

  if (theme) {
    return theme;
  }

  // 3. 兜底逻辑 (Fallback)
  return themes['DEFAULT'] || {
    name: "社区诊所",
    desc: "基础医疗服务。",
    bg: "bg-gray-900",
    accent: "text-white",
    border: "border-white/10",
    icon: "✚"
  };
};