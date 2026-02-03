// src/logic/medical.ts
import { MedicalService, PlayerClass, RegionID, ActiveInsuranceState } from '@/types/schema';

interface CostResult {
  originalCost: number;
  finalCost: number;
  coveredAmount: number;
  copayRate: number;
  reason: string;
}

/**
 * 计算医疗服务最终费用
 */
export const calculateMedicalCost = (
  service: MedicalService,
  insurance: ActiveInsuranceState | null,
  playerClass: PlayerClass
): CostResult => {
  const cost = service.baseCost;
  
  if (cost <= 0) {
    return { originalCost: cost, finalCost: cost, coveredAmount: 0, copayRate: 0, reason: "现金交易" };
  }

  if (!insurance) {
    return { originalCost: cost, finalCost: cost, coveredAmount: 0, copayRate: 1.0, reason: "无保险覆盖" };
  }

  let copayRate = 1.0;
  let reason = "保险未覆盖此服务";

  if (service.insurance.isCovered) {
    let isPlanCovering = true;
    
    if (service.type === 'EMERGENCY' && !insurance.coverage.emergencyCovered) isPlanCovering = false;
    if (service.type === 'THERAPY' && !insurance.coverage.mentalCovered) isPlanCovering = false;
    if (service.type === 'DRUG' && !insurance.coverage.addictionCovered) isPlanCovering = false;

    if (isPlanCovering) {
      copayRate = Math.max(service.insurance.baseCopayRate, insurance.coverage.copayModifier);
      reason = `保险报销 ${((1 - copayRate) * 100).toFixed(0)}%`;
    } else {
      reason = "您的保险计划不包含此类服务";
    }
  } else {
    reason = "此服务不在医保目录内";
  }

  if (playerClass === PlayerClass.Homeless && service.type === 'EMERGENCY') {
    copayRate = 0;
    reason = "紧急医疗救助法案 (白卡)";
  }

  const finalCost = Math.floor(cost * copayRate);
  const coveredAmount = cost - finalCost;

  return { originalCost: cost, finalCost, coveredAmount, copayRate, reason };
}; // ✅ 此处之前漏了括号

/**
 * 获取区域特定的医院主题配置 (去硬编码版)
 * 逻辑：如果 gameDataCache 里有 regions 配置则读取，否则根据 ID 返回默认视觉主题
 */
export const getHospitalTheme = (region: RegionID, gameDataCache?: any) => {
  // 1. 尝试从 JSON 数据中读取该区域的元数据 (包含视觉配置)
  const regionData = gameDataCache?.regions?.find((r: any) => r.id === region);
  if (regionData?.hospitalTheme) {
    return regionData.hospitalTheme;
  }

  // 2. 兜底逻辑：根据 RegionID 映射基础视觉样式 (仅保留样式名，文字依然建议放入 JSON)
  const themes: Record<string, any> = {
    [RegionID.Slums]: {
      name: "地下诊所",
      desc: "只收现金和器官。",
      bg: "bg-stone-950",
      accent: "text-red-600",
      border: "border-red-900/30",
      icon: "🩸"
    },
    [RegionID.RustBelt]: {
      name: "工业医院",
      desc: "排队、冷漠、高效。",
      bg: "bg-slate-900",
      accent: "text-orange-500",
      border: "border-orange-500/30",
      icon: "🏥"
    },
    [RegionID.Downtown]: {
      name: "医疗中心",
      desc: "格式化你的破碎灵魂。",
      bg: "bg-indigo-950",
      accent: "text-cyan-400",
      border: "border-cyan-500/30",
      icon: "🧬"
    }
  };

  return themes[region] || {
    name: "社区诊所",
    desc: "基础医疗服务。",
    bg: "bg-gray-900",
    accent: "text-white",
    border: "border-white/10",
    icon: "✚"
  };
};