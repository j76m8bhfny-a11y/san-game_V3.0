/**
 * 保险系统 UI 专用配置
 * 负责定义不同阶级/主题下的视觉表现与交互文案
 */

export type InsuranceTheme = 'SLUMS' | 'RUST_BELT' | 'SUBURBS' | 'DOWNTOWN' | 'GLOBAL';

import { RegionID } from '@/types/schema';

// 地区到保险主题的映射
export const REGION_THEME_MAP: Record<RegionID, InsuranceTheme> = {
  [RegionID.Slums]: 'SLUMS',
  [RegionID.RustBelt]: 'RUST_BELT',
  [RegionID.Suburbs]: 'SUBURBS',
  [RegionID.Downtown]: 'DOWNTOWN',
};

// 各主题的入场动画
export const THEME_ANIMATIONS: Record<InsuranceTheme, string> = {
  SLUMS: 'animate-[swing_0.5s_ease-out]',
  RUST_BELT: 'animate-[stamp_0.3s_ease-out]',
  SUBURBS: 'animate-[pop_0.3s_ease-out]',
  DOWNTOWN: 'animate-[float_0.5s_ease-out]',
  GLOBAL: 'animate-[pulse-slow_0.5s_ease-out]',
};

export interface ThemeConfig {
  containerClass: string;   // 模态框外壳样式
  titleClass: string;       // 标题样式
  buttonClass: string;      // 按钮基础样式
  labels: {
    sign: string;           // 签约按钮文案
    cancel: string;         // 退保按钮文案
    weekly: string;         // "每周"的叫法
    coverage: string;       // "报销范围"的叫法
  };
  assets: {
    bgTexture?: string;     // 背景纹理类名 (在 index.css 中定义)
    stampIcon?: string;     // 印章/图标类型
  };
}

export const INSURANCE_THEMES: Record<InsuranceTheme, ThemeConfig> = {
  SLUMS: {
    containerClass: "bg-[#3e2723] rotate-1 border-4 border-[#5d4037] shadow-2xl",
    titleClass: "font-marker text-4xl text-red-500 -rotate-2 tracking-widest drop-shadow-md",
    buttonClass: "font-marker text-xl border-2 border-dashed border-red-800 text-red-800 hover:bg-red-900/20 rotate-1",
    labels: {
      sign: "按手印 (BLOOD)",
      cancel: "撕毁合同 (RIP)",
      weekly: "CASH / WK",
      coverage: "WE PAY:",
    },
    assets: {
      bgTexture: "bg-paper-dirty", // 需在 CSS 中实现
    }
  },
  RUST_BELT: {
    containerClass: "bg-[#262626] border-t-8 border-yellow-700 shadow-[0_10px_20px_rgba(0,0,0,0.8)]",
    titleClass: "font-mono text-3xl text-stone-300 uppercase tracking-tighter border-b-2 border-stone-600 pb-2",
    buttonClass: "font-mono text-sm bg-stone-700 text-stone-200 border border-stone-500 hover:bg-stone-600",
    labels: {
      sign: "[ STAMP AGREEMENT ]",
      cancel: "[ TERMINATE ]",
      weekly: "DEDUCTION/WK",
      coverage: "COVERAGE MATRIX:",
    },
    assets: {
      bgTexture: "bg-metal-grid",
    }
  },
  SUBURBS: {
    containerClass: "bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg shadow-lg",
    titleClass: "font-pixel text-2xl font-bold text-blue-900 tracking-wide",
    buttonClass: "font-pixel text-sm font-bold bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition-all px-6 py-2",
    labels: {
      sign: "Enroll Now",
      cancel: "Cancel Policy",
      weekly: "Weekly Premium",
      coverage: "Coverage Details",
    },
    assets: {
      bgTexture: "bg-suburban-clean",
    }
  },
  DOWNTOWN: {
    containerClass: "bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl",
    titleClass: "font-pixel text-2xl font-bold text-slate-800 tracking-tight",
    buttonClass: "font-pixel text-sm font-bold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all",
    labels: {
      sign: "Subscribe Now",
      cancel: "Unsubscribe",
      weekly: "Premium / week",
      coverage: "Plan Benefits",
    },
    assets: {
      bgTexture: "bg-glass-gradient",
    }
  },
  GLOBAL: {
    containerClass: "bg-[#0a0a0a] border border-[#333] shadow-[0_0_50px_rgba(212,175,55,0.1)]",
    titleClass: "font-pixel text-3xl text-amber-500 font-light tracking-[0.2em]",
    buttonClass: "font-pixel italic text-amber-500 border-b border-amber-500/50 hover:text-amber-300 hover:border-amber-300 transition-colors",
    labels: {
      sign: "Signatory",
      cancel: "Revoke",
      weekly: "Membership Dues",
      coverage: "Privileges",
    },
    assets: {
      bgTexture: "bg-leather-dark",
    }
  }
};