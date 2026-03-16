/**
 * Vitality Slice - 类型定义
 * 
 * 从 createVitalitySlice.ts 提取的类型定义
 */

import {
  VitalityState,
  PlayerClass,
  LedgerCategory,
  SurvivalBuff
} from '@/types/schema';

export interface ClassChangeInfo {
  oldClass: PlayerClass;
  newClass: PlayerClass;
  netWorth: number;
  reason: string;
  timestamp: number;
}

export interface VitalitySlice {
  vitality: VitalityState;
  pendingClassChanges: ClassChangeInfo[];
  
  // 游戏初始化
  initGame: (selectedClass: PlayerClass) => void;
  
  // 交易/账本
  addTransaction: (category: LedgerCategory, amount: number, description: string) => { 
    success: boolean; 
    actualAmount: number 
  };
  clearWeeklyLedger: () => void;
  
  // 状态修改
  modifyStats: (changes: Partial<VitalityState['metrics']>) => void;
  updateIdentityPoints: (points: { red?: number; wolf?: number; old?: number }) => void;
  updateFlags: (changes: Partial<VitalityState['flags']>) => void;
  
  // 医疗系统
  contractDisease: (diseaseId: string) => void;
  cureDisease: (diseaseId: string) => void;
  performTreatment: (serviceId: string) => { success: boolean; msg: string };
  scheduleAppointment: (serviceId: string, deposit: number) => { success: boolean; msg: string };
  cancelAppointment: (appointmentId: string) => { success: boolean; msg: string; refund: number };
  
  // 回合推进
  advanceTurn: () => void;
  
  // 阶级系统
  recalculateClass: () => { 
    changed: boolean; 
    oldClass?: PlayerClass; 
    newClass?: PlayerClass; 
    netWorth?: number; 
    reason?: string;
  };
  clearPendingClassChange: () => void;
  
  // Buff管理
  addSurvivalBuff: (buff: SurvivalBuff) => void;
  removeSurvivalBuff: (buffId: string) => void;
  processBuffs: () => { hpChange: number; insightChange: number; expiredBuffs: string[] };
  applyEventBuff: (eventId: string) => void;
  applyItemBuff: (buffId: string, customDuration?: number) => void;
}
