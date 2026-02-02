import { StateCreator } from 'zustand';
import { VitalityState, PlayerClass, GameState, LedgerCategory, LedgerRecord, Disease } from '@/types/schema';
import { checkDailyDisease } from '@/logic/health';

// 初始配置常量 (新增了 addiction 和 resistance 默认值)
const CLASS_CONFIG = {
  [PlayerClass.Homeless]: { gold: 50, hp: 60, san: 40, resistance: 0 },
  [PlayerClass.Worker]: { gold: 200, hp: 100, san: 60, resistance: 10 },
  [PlayerClass.Middle]: { gold: 2000, hp: 90, san: 70, resistance: 20 },
  [PlayerClass.Capitalist]: { gold: 10000, hp: 80, san: 50, resistance: 30 }
};

export interface VitalitySlice {
  vitality: VitalityState;

  // --- Actions ---
  initGame: (selectedClass: PlayerClass) => void;
  addTransaction: (category: LedgerCategory, amount: number, description: string) => void;
  
  // ✅ 增强版数值修改 (支持成瘾性)
  modifyStats: (changes: { 
    hp?: number; san?: number; 
    maxHp?: number; maxSan?: number;
    addiction?: number; resistance?: number;
  }) => void;
  
  // ✅ 疾病管理
  contractDisease: (diseaseId: string) => void;
  cureDisease: (diseaseId: string) => void;
  
  advanceTurn: () => void;
  clearWeeklyLedger: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const createVitalitySlice: StateCreator<any, [], [], VitalitySlice> = (set, get) => ({
  vitality: {
    metrics: { 
      hp: 100, maxHp: 100, 
      san: 50, maxSan: 100, 
      gold: 0,
      creditScore: 580,
      addiction: 0,   // ✅ 新增: 成瘾性
      resistance: 0   // ✅ 新增: 耐药性
    },
    identity: {
      currentClass: PlayerClass.Homeless,
      points: { red: 0, wolf: 0, old: 0 }
    },
    time: {
      currentTurn: 1,
      totalTurns: 52,
      dayOfWeek: 1
    },
    activeDiseases: [], // ✅ 新增: 当前患病列表
    ledger: { history: [] },
    flags: { isHomeless: false, debtTurns: 0, hiddenTags: [] },
    activeJobs: []
  },

  initGame: (selectedClass) => {
    const config = CLASS_CONFIG[selectedClass];
    set({
      vitality: {
        metrics: { 
          hp: config.hp, maxHp: config.hp, 
          san: config.san, maxSan: 100, 
          gold: config.gold, 
          creditScore: 580,
          addiction: 0,
          resistance: config.resistance
        },
        identity: { currentClass: selectedClass, points: { red: 0, wolf: 0, old: 0 } },
        time: { currentTurn: 1, totalTurns: 52, dayOfWeek: 1 },
        ledger: { history: [] },
        activeDiseases: [], // Reset diseases
        flags: { isHomeless: selectedClass === PlayerClass.Homeless, debtTurns: 0, hiddenTags: [] },
        activeJobs: []
      }
    });
  },

  addTransaction: (category, amount, description) => {
    set((state: GameState) => {
      const { metrics, time, ledger } = state.vitality;
      const newRecord: LedgerRecord = {
        id: generateId(),
        turn: time.currentTurn,
        category,
        amount,
        description,
        timestamp: Date.now()
      };
      return {
        vitality: {
          ...state.vitality,
          metrics: { ...metrics, gold: metrics.gold + amount },
          ledger: { ...ledger, history: [...ledger.history, newRecord] }
        }
      };
    });
  },

  modifyStats: (changes) => {
    set((state: GameState) => {
      const m = state.vitality.metrics;
      const newMetrics = { ...m };
      
      if (changes.maxHp) newMetrics.maxHp += changes.maxHp;
      if (changes.maxSan) newMetrics.maxSan += changes.maxSan;
      
      // HP & SAN 逻辑
      if (changes.hp) newMetrics.hp = Math.min(newMetrics.maxHp, Math.max(0, m.hp + changes.hp));
      if (changes.san) newMetrics.san = Math.min(newMetrics.maxSan, Math.max(0, m.san + changes.san));

      // ✅ 成瘾性逻辑 (0-100)
      if (changes.addiction) {
        newMetrics.addiction = Math.min(100, Math.max(0, m.addiction + changes.addiction));
      }
      
      // ✅ 耐药性逻辑 (0-100)
      if (changes.resistance) {
        newMetrics.resistance = Math.min(100, Math.max(0, m.resistance + changes.resistance));
      }

      return { vitality: { ...state.vitality, metrics: newMetrics } };
    });
  },

  contractDisease: (diseaseId) => {
    const state = get();
    // 查重：避免重复得同一种病
    if (state.vitality.activeDiseases.includes(diseaseId)) return;

    // 获取疾病信息用于通知
    const diseaseData = state.gameDataCache?.diseases?.find((d: Disease) => d.id === diseaseId);
    if (diseaseData) {
      state.addNotification(`确诊: ${diseaseData.name}`, 'warning');
    }

    set((s: GameState) => ({
      vitality: {
        ...s.vitality,
        activeDiseases: [...s.vitality.activeDiseases, diseaseId]
      }
    }));
  },

  cureDisease: (diseaseId) => {
    set((s: GameState) => ({
      vitality: {
        ...s.vitality,
        activeDiseases: s.vitality.activeDiseases.filter(id => id !== diseaseId)
      }
    }));
    get().addNotification(`疾病已治愈`, 'success');
  },

  advanceTurn: () => {
    const state = get();
    const { metrics, activeDiseases } = state.vitality;
    const diseaseDB = state.gameDataCache?.diseases || [];
    
    // === 新增：每日致病检查 ===
  // 只有在非监狱状态下才检查 (监狱有单独逻辑)
  if (!state.prison?.inJail) {
    const newDiseaseId = checkDailyDisease(state);
    if (newDiseaseId) {
      // 调用 contractDisease (复用已有 Action)
      get().contractDisease(newDiseaseId);
      
      // 如果是急性病，可以额外加个强提示
      const dInfo = diseaseDB.find((d: any) => d.id === newDiseaseId);
      if (dInfo?.type === 'ACUTE') {
        state.addNotification("紧急医疗警报：检测到急性病症！", "error");
      }
    }
  }

    // ---  生理结算 (Addiction Decay) ---
    // 每周自然衰退 5 点成瘾度，如果成瘾度 > 50 且本周未摄入(这里简化为自然衰退)，会产生戒断反应
    // 复杂逻辑：如果本周使用了毒品，应该有一个 flag 阻止衰退。这里先做基础版。
    let newAddiction = metrics.addiction;
    if (newAddiction > 0) {
      newAddiction = Math.max(0, newAddiction - 5);
      // 戒断惩罚: 瘾很大时没续上，掉 SAN
      if (metrics.addiction > 60) {
        state.modifyStats({ san: -5 });
        state.addNotification("严重的药物戒断反应 (SAN -5)", 'warning');
      }
    }

    // --- 2. 疾病结算 (Disease Tick) ---
    let totalHpLoss = 0;
    let totalSanLoss = 0;
    
    activeDiseases.forEach((dId: string) => {
      const disease = diseaseDB.find((d: Disease) => d.id === dId);
      if (!disease) return;

      // 只有 CHRONIC (慢性) 和 MENTAL (精神) 会在回合结束持续扣血
      if (disease.type === 'CHRONIC' && disease.effects.hpDrain) {
        totalHpLoss += disease.effects.hpDrain;
      }
      if (disease.type === 'MENTAL' && disease.effects.sanDrain) {
        totalSanLoss += disease.effects.sanDrain;
      }
    });

    // --- 3. 应用结算 ---
    if (totalHpLoss > 0 || totalSanLoss > 0) {
       state.modifyStats({ 
         hp: -totalHpLoss, 
         san: -totalSanLoss,
         addiction: (newAddiction - metrics.addiction) // 应用成瘾度衰退
       });
       
       // 汇总通知
       if (totalHpLoss > 0) state.addNotification(`疾病折磨: HP -${totalHpLoss}`, 'HP');
       if (totalSanLoss > 0) state.addNotification(`精神侵蚀: SAN -${totalSanLoss}`, 'SAN');
    } else {
       // 仅更新成瘾度
       state.modifyStats({ addiction: (newAddiction - metrics.addiction) });
    }

    // --- 4. 推进时间 ---
    set((s: GameState) => ({
      vitality: {
        ...s.vitality,
        time: {
          ...s.vitality.time,
          currentTurn: s.vitality.time.currentTurn + 1
        }
      }
    }));
  },
  
  clearWeeklyLedger: () => {
    set((state: GameState) => ({
      vitality: {
        ...state.vitality,
        ledger: { history: [] }
      }
    }));
  }
});