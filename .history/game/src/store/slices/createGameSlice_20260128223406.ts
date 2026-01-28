import { StateCreator } from 'zustand';
import { GameEvent, Bill, RegionID } from '@/types/schema';
import { checkMovePermission, checkClassUpdate, clamp } from '@/logic/core';
import { runDailySystems } from '@/systems/SystemRegistry';
import { resolveOption } from '@/logic/eventResolver'; // 引入刚才写的逻辑
import { resolveEnding } from '@/logic/endings';

// 假设我们已经有了 SystemRegistry，且包含了 Housing, Job, Bill, Event 等系统
// 那么 createGameSlice 就会变得非常短

export interface GameSlice {
  currentEvent: GameEvent | null;
  activeBill: Bill | null;
  dailySummary: {
    revenue: number;
    expenses: number;
    notes: string[];
  } | null;
  
  nextDay: () => void;
  chooseOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  buyItem: (itemId: string) => void;
  attemptMove: (targetRegion: RegionID) => void;
  
  resolveBill: () => void;
  closeDailySummary: () => void;
  resetGame: () => void;
}

export const createGameSlice: StateCreator<any, [], [], GameSlice> = (set, get) => ({
  currentEvent: null,
  activeBill: null,
  dailySummary: null,

  resolveBill: () => set({ activeBill: null }),
  closeDailySummary: () => set({ dailySummary: null }),

  resetGame: () => {
    get().resetPlayerState();
    set({
      currentEvent: null,
      activeBill: null,
      dailySummary: null,
      // ... Reset UI states
    });
  },

  attemptMove: (targetRegion) => {
    const state = get();
    if (state.currentRegion === targetRegion) return;
    const { gameDataCache } = state;
    if (!gameDataCache) return;

    const check = checkMovePermission(
      targetRegion, 
      state.currentClass, 
      state.inventory, 
      gameDataCache.itemMap
    );

    if (check.allowed) {
      state.setRegion(targetRegion);
      state.addNotification(`进入区域: ${targetRegion}`, 'success');
    } else {
      state.addNotification(check.reason || '无法进入该区域', 'error');
    }
  },

  // 🟢 极其精简的 nextDay
  nextDay: () => {
    const state = get();
    const { gameDataCache } = state;
    if (!gameDataCache) return;

    // 1. 执行系统管线 (Job, Housing, Bill, Event, Stats 都在这里面)
    const sysResult = runDailySystems({ state });
    
    // 2. 合并状态 (此时 currentEvent, activeBill 都已经被 System 算好放在 updates 里了)
    let newState = { ...state, ...sysResult.updates };
    
    // 3. 阶级检查 (由于涉及全局配置，保留在这里或移入专门的 ClassSystem)
    const newClass = checkClassUpdate(newState.gold, gameDataCache.classes);
    if (newClass !== newState.currentClass) {
        newState.currentClass = newClass;
        sysResult.logs.push(`阶级变更: ${newClass}`);
        sysResult.notes.push(`阶级变更: ${newClass}`);
    }

    // 4. 死亡/结局检查
    if (newState.hp <= 0) {
       const deathEnding = resolveEnding(newState, gameDataCache.endings, gameDataCache.global.gameRules.maxDays, 'HP');
       state.triggerEnding(deathEnding || 'ED-01');
       return;
    }
    if (state.day >= gameDataCache.global.gameRules.maxDays) {
       state.triggerEnding('ED-06'); // 举例：时间到
       return;
    }

    // 5. 提交更新
    set({
      ...sysResult.updates, // 所有的数值更新
      currentClass: newState.currentClass,
      day: state.day + 1,
      
      // 每日弹窗内容
      dailySummary: state.day === 0 ? null : {
        revenue: 0, // 可优化: 让 JobSystem 返回 revenue
        expenses: 0, // 可优化: 让 Housing/BillSystem 返回 expense
        notes: sysResult.notes
      },
      
      history: [...state.history, ...sysResult.logs.map(l => `Day ${state.day + 1}: ${l}`)]
    });
    
    // 确保 PlayerSlice 里的数据也同步
    state.updatePlayerStats({
       day: state.day + 1,
       gold: newState.gold,
       hp: clamp(newState.hp, 0, newState.maxHp),
       san: clamp(newState.san, 0, 100),
       currentClass: newState.currentClass
    });
  },

  // 🟢 极其精简的 chooseOption
  chooseOption: (optionId) => {
    const state = get();
    if (!state.currentEvent) return;

    // 1. 调用 Logic Helper 进行纯计算
    const result = resolveOption(state, optionId, state.currentEvent.options[optionId]);

    // 2. 如果导致结局，直接触发
    if (result.endingId) {
      state.triggerEnding(result.endingId);
      return;
    }

    // 3. 否则应用更新
    set(result.updates);
    state.updatePlayerStats({
      ...state,
      ...result.updates,
      history: [...state.history, ...result.logs]
    });
  },

  buyItem: (itemId) => {
     // buyItem 建议使用 ActionExecutor 重构，
     // 类似于: executeActions(item.onBuyActions)
     // 这样这里也能变成 3 行代码。
     // 目前保持原样或按 ActionExecutor 方式重写均可。
  }
});