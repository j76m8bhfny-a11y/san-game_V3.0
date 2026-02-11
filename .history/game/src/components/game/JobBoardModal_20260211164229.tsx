// src/components/game/jobs/JobThemeConfig.ts (新建或放在组件内)

export const JOB_THEMES = {
  SLUMS: {
    container: "bg-[#5c4033] bg-[url('/assets/textures/wood_pole.png')] border-4 border-[#3e2b22] shadow-[10px_10px_0_rgba(0,0,0,0.5)]",
    title: "text-amber-100 font-marker text-4xl rotate-[-2deg] drop-shadow-md",
    closeBtn: "bg-red-700 text-white font-marker border-2 border-white/50 rotate-3 hover:rotate-0",
    layout: "grid grid-cols-1 gap-4 p-6", // 乱贴的小广告布局
  },
  RUST_BELT: {
    container: "bg-[#2a2a2a] bg-[url('/assets/textures/metal_grid.png')] border-4 border-stone-600 shadow-2xl",
    title: "text-stone-300 font-mono text-3xl tracking-widest uppercase border-b-2 border-dashed border-stone-500 pb-2",
    closeBtn: "bg-stone-700 text-stone-300 border border-stone-500 font-mono rounded-sm hover:bg-stone-600",
    layout: "flex flex-col gap-2 p-8", // 排班表布局
  },
  DOWNTOWN: {
    container: "bg-white/90 backdrop-blur-xl border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl",
    title: "text-blue-900 font-sans text-2xl font-bold tracking-tight",
    closeBtn: "text-gray-400 hover:text-gray-800",
    layout: "grid grid-cols-2 gap-6 p-8", // 招聘网站卡片布局
  },
  // ... 其他区域
};