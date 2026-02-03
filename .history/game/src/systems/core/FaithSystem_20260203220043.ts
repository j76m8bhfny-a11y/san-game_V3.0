import { GameSystem, SystemResult } from '../types';

export const FaithSystem: GameSystem = {
  id: 'FAITH_SYSTEM',
  priority: 50, // 优先级较低

  processTurn: ({ state }) => {
    // 逻辑断裂 3 修复: 每周重置仪式状态，允许玩家再次进行仪式
    const updates: any = {};
    
    if (state.faith && state.faith.hasPerformedRite) {
        updates.faith = {
            ...state.faith,
            hasPerformedRite: false
        };
    }

    return {
      updates,
      newTransactions: [],
      logs: [], // 不需要每周都弹日志说“信仰已重置”
      notes: []
    };
  }
};