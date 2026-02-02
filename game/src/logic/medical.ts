// src/logic/medical.ts
import { MedicalService, Insurance, PlayerClass, RegionID } from '@/types/schema';

interface CostResult {
  originalCost: number;
  finalCost: number;
  coveredAmount: number;
  copayRate: number;
  reason: string; // 报销或拒赔理由
}

/**
 * 计算医疗服务最终费用
 */
export const calculateMedicalCost = (
  service: MedicalService,
  insurance: Insurance | null,
  playerClass: PlayerClass
): CostResult => {
  const cost = service.baseCost;
  
  // 1. 赚钱项目 (卖肾/试药) - 直接返回，不走保险
  if (cost <= 0) {
    return {
      originalCost: cost,
      finalCost: cost,
      coveredAmount: 0,
      copayRate: 0,
      reason: "现金交易"
    };
  }

  // 2. 无保险处理
  if (!insurance) {
    // 特例：流浪汉在任何地方的急诊 (EMERGENCY) 都是免费的 (白卡逻辑由系统自动发放，这里假设没发白卡时的兜底)
    // 但通常保险应该在 Store 里即使是 None 也有个对象。这里做个防御。
    return {
      originalCost: cost,
      finalCost: cost,
      coveredAmount: 0,
      copayRate: 1.0,
      reason: "无保险覆盖"
    };
  }

  // 3. 保险逻辑判定
  let copayRate = 1.0; // 默认全额自付
  let reason = "保险未覆盖此服务";

  // A. 检查服务本身是否支持医保
  if (service.insurance.isCovered) {
    // B. 检查用户的保险是否覆盖此类服务 (基于 coverage 字段)
    let isPlanCovering = true;
    
    if (service.type === 'EMERGENCY' && !insurance.coverage.emergencyCovered) isPlanCovering = false;
    if (service.type === 'THERAPY' && !insurance.coverage.mentalCovered) isPlanCovering = false;
    // 毒品类通常不报销，除非保险里特地写了
    if (service.type === 'DRUG' && !insurance.coverage.addictionCovered) isPlanCovering = false;

    if (isPlanCovering) {
      // C. 计算自付比例：取 (服务规定的自付率) 和 (保险规定的自付率) 的较大值
      // 例如：服务说最低自付 20%，你的保险是金卡免赔(0%) -> 最终付 20%
      // 或者：服务说全额报销(0%)，但你的保险是垃圾险(40%自付) -> 最终付 40%
      // 这里的逻辑是：保险公司和服务方互相“推诿”，最后取对玩家最不利的那个（这就是赛博朋克）
      copayRate = Math.max(service.insurance.baseCopayRate, insurance.coverage.copayModifier);
      reason = `保险报销 ${(1 - copayRate) * 100}%`;
    } else {
      reason = "您的保险计划不包含此类服务";
    }
  } else {
    reason = "此服务不在医保目录内";
  }

  // D. 阶级/白卡特权修正
  if (playerClass === PlayerClass.Homeless && service.type === 'EMERGENCY') {
    copayRate = 0;
    reason = "紧急医疗救助法案 (白卡)";
  }

  const finalCost = Math.floor(cost * copayRate);
  const coveredAmount = cost - finalCost;

  return {
    originalCost: cost,
    finalCost,
    coveredAmount,
    copayRate,
    reason
  };
};

/**
 * 获取区域特定的医院主题配置
 */
export const getHospitalTheme = (region: RegionID) => {
  switch (region) {
    case RegionID.Slums:
      return {
        name: "第4区地下诊所",
        desc: "这里只认两样东西：现金，和更值钱的器官。",
        bg: "bg-stone-950",
        accent: "text-red-600",
        border: "border-red-900/30",
        icon: "🩸"
      };
    case RegionID.RustBelt:
      return {
        name: "联合工业医院",
        desc: "高效、冰冷、且总是排着长队。",
        bg: "bg-slate-900",
        accent: "text-orange-500",
        border: "border-orange-500/30",
        icon: "🏥"
      };
    case RegionID.Downtown:
      return {
        name: "圣伊丽莎白医疗中心",
        desc: "只要额度足够，我们可以修复破碎的灵魂。",
        bg: "bg-indigo-950",
        accent: "text-cyan-400",
        border: "border-cyan-500/30",
        icon: "🧬"
      };
    default:
      return {
        name: "社区诊所",
        desc: "基础医疗服务。",
        bg: "bg-gray-900",
        accent: "text-white",
        border: "border-white/10",
        icon: "✚"
      };
  }
};