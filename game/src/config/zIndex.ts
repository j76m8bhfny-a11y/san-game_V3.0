/**
 * z-index 统一管理配置
 * 
 * 解决弹窗层级冲突问题
 * 所有组件的z-index必须从这里导入
 */

export const Z_INDEX = {
  // 基础层 (0-19)
  base: {
    background: 0,
    scene: 1,
    character: 5,
  },

  // UI层 (20-49)
  ui: {
    hud: 20,
    miniHUD: 25,
    resourceHintBar: 30,
    newsTicker: 35,
    tooltip: 40,
  },

  // 效果层 (50-79)
  effects: {
    feedbackLayer: 50,
    atmosphere: 55,
    glitchUI: 60,
    systemGaze: 65,
    dangerHints: 70,
  },

  // 弹窗层 (80-199)
  modals: {
    // 普通弹窗
    messageWindow: 80,
    shopModal: 85,
    hospitalModal: 86,
    housingModal: 87,
    jobModal: 88,
    bankModal: 89,
    
    // 覆盖层
    billOverlay: 90,
    jailOverlay: 91,
    
    // 结算弹窗
    weeklySettlement: 95,
    
    // 引导提示 (互斥组1)
    insightMilestone: 100,
    progressiveUnlock: 101,
    guardianHint: 102,
    
    // 确认弹窗
    dOptionConfirm: 110,
    systemAlert: 120,
    
    // 特殊
    archiveMilestone: 130,
    settings: 140,
    pauseMenu: 150,
  },

  // 结局层 (200-9999)
  ending: {
    gameEnding: 200,
    deathSummary: 1000,
  },

  // 最高层 (10000+)
  top: {
    introExperience: 10000,
    errorScreen: 99999,
  },
} as const;

// 互斥组定义
export const MODAL_MUTEX_GROUPS = [
  // 组1：新手引导类
  ['insightMilestone', 'progressiveUnlock', 'guardianHint'],
  // 组2：结算类
  ['weeklySettlement', 'billOverlay', 'gameEnding'],
  // 组3：系统惩罚
  ['systemAlert', 'jailOverlay'],
];

// 检查两个弹窗是否互斥
export const isMutex = (type1: string, type2: string): boolean => {
  return MODAL_MUTEX_GROUPS.some(group => 
    group.includes(type1) && group.includes(type2)
  );
};

export default Z_INDEX;
