/**
 * 保险系统 UI 专用配置
 * 负责定义不同阶级/主题下的视觉表现与交互文案
 */

export type InsuranceTheme = 'SLUMS' | 'RUST_BELT' | 'DOWNTOWN' | 'GLOBAL';

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
  DOWNTOWN: {
    containerClass: "bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl",
    titleClass: "font-sans text-2xl font-bold text-slate-800 tracking-tight",
    buttonClass: "font-sans text-sm font-bold bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all",
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
    titleClass: "font-serif text-3xl text-amber-500 font-light tracking-[0.2em]",
    buttonClass: "font-serif italic text-amber-500 border-b border-amber-500/50 hover:text-amber-300 hover:border-amber-300 transition-colors",
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