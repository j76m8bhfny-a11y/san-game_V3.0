/**
 * 数值安全包装 - 建议实现
 * 用于强化所有数值修改的边界处理
 */

/**
 * 数值边界配置
 */
export const VALUE_BOUNDS = {
  gold: { min: 0, max: 999999999 },
  hp: { min: 0, max: 100 },
  insight: { min: 0, max: 100 },
  hunger: { min: 0, max: 100 },
  addiction: { min: 0, max: 100 },
  resistance: { min: 0, max: 100 },
  creditScore: { min: 300, max: 850 },
  maxHp: { min: 10, max: 200 },     // 最大HP可提升到200
  maxInsight: { min: 100, max: 100 } // 固定100
};

/**
 * 数组长度限制
 */
export const ARRAY_LIMITS = {
  inventory: 50,
  activeDiseases: 10,
  activeBuffs: 50,
  activeLoans: 5,
  ledgerHistory: 100,
  history: 100,
  pendingMedicalBills: 20,
  medicalAppointments: 5
};

/**
 * 安全数值修改工具
 */
export const safeMutations = {
  /**
   * 钳制数值到安全范围
   */
  clamp: (field: keyof typeof VALUE_BOUNDS, value: number): number => {
    const bounds = VALUE_BOUNDS[field];
    if (!bounds) {
      console.warn(`[safeMutations] 未找到字段 ${field} 的边界配置`);
      return value;
    }
    
    // 处理特殊值
    if (!isFinite(value) || isNaN(value)) {
      console.warn(`[safeMutations] ${field} 收到无效值:`, value, '使用默认值');
      return bounds.min;
    }
    
    // 钳制到边界
    return Math.max(bounds.min, Math.min(bounds.max, Math.floor(value)));
  },

  /**
   * 验证并修正 metrics 修改
   * 建议替换 modifyStats 中的直接赋值
   */
  clampMetrics: (changes: Record<string, number>): Record<string, number> => {
    const result: Record<string, number> = {};
    
    for (const [field, value] of Object.entries(changes)) {
      if (field in VALUE_BOUNDS) {
        result[field] = safeMutations.clamp(field as keyof typeof VALUE_BOUNDS, value);
      } else {
        // 无边界配置的字段直接通过
        result[field] = value;
      }
    }
    
    return result;
  },

  /**
   * 数组安全操作 - 添加元素
   */
  safePush: <T>(arr: T[], item: T, maxLength: number, strategy: 'reject' | 'fifo' = 'reject'): T[] => {
    if (arr.length < maxLength) {
      return [...arr, item];
    }
    
    if (strategy === 'fifo') {
      // FIFO: 移除最旧的，添加新的
      return [...arr.slice(1), item];
    }
    
    // reject: 拒绝添加
    console.warn(`[safeMutations] 数组已达到上限 ${maxLength}，拒绝添加`);
    return arr;
  },

  /**
   * 检查数组是否已满
   */
  isArrayFull: (field: keyof typeof ARRAY_LIMITS, arr: unknown[]): boolean => {
    const limit = ARRAY_LIMITS[field];
    if (!limit) return false;
    return arr.length >= limit;
  },

  /**
   * 安全添加物品到背包
   * 使用示例：
   * const newInventory = safeMutations.addToInventory(inventory, newItem);
   */
  addToInventory: (inventory: string[], itemId: string): { success: boolean; newInventory: string[] } => {
    if (inventory.length >= ARRAY_LIMITS.inventory) {
      return { 
        success: false, 
        newInventory: inventory 
      };
    }
    return { 
      success: true, 
      newInventory: [...inventory, itemId] 
    };
  },

  /**
   * 安全添加疾病
   */
  addDisease: (diseases: string[], diseaseId: string): { success: boolean; newDiseases: string[] } => {
    if (diseases.length >= ARRAY_LIMITS.activeDiseases) {
      console.warn(`[safeMutations] 疾病数量已达上限 ${ARRAY_LIMITS.activeDiseases}`);
      return { 
        success: false, 
        newDiseases: diseases 
      };
    }
    if (diseases.includes(diseaseId)) {
      return { 
        success: false, 
        newDiseases: diseases 
      };
    }
    return { 
      success: true, 
      newDiseases: [...diseases, diseaseId] 
    };
  },

  /**
   * 安全添加贷款
   */
  addLoan: <T>(loans: T[], loan: T): { success: boolean; newLoans: T[] } => {
    if (loans.length >= ARRAY_LIMITS.activeLoans) {
      console.warn(`[safeMutations] 贷款数量已达上限 ${ARRAY_LIMITS.activeLoans}`);
      return { 
        success: false, 
        newLoans: loans 
      };
    }
    return { 
      success: true, 
      newLoans: [...loans, loan] 
    };
  },

  /**
   * 安全修改HP（考虑maxHp限制）
   */
  modifyHp: (currentHp: number, change: number, maxHp: number): number => {
    const newHp = currentHp + change;
    return Math.max(0, Math.min(maxHp, newHp));
  },

  /**
   * 安全修改Gold（处理正负数）
   */
  modifyGold: (currentGold: number, change: number): { success: boolean; newGold: number } => {
    const newGold = currentGold + change;
    
    // 检查下限
    if (newGold < VALUE_BOUNDS.gold.min) {
      return { 
        success: false, 
        newGold: currentGold 
      };
    }
    
    // 检查上限
    if (newGold > VALUE_BOUNDS.gold.max) {
      return { 
        success: true,  // 允许达到上限
        newGold: VALUE_BOUNDS.gold.max 
      };
    }
    
    return { success: true, newGold };
  },

  /**
   * 验证 Gold 是否足够
   */
  hasEnoughGold: (currentGold: number, cost: number): boolean => {
    return currentGold >= cost;
  },

  /**
   * 计算带边界的效果值
   * 用于事件效果计算
   */
  calculateEffect: (baseValue: number, multiplier: number, field: keyof typeof VALUE_BOUNDS): number => {
    const rawResult = baseValue * multiplier;
    return safeMutations.clamp(field, rawResult);
  }
};

/**
 * 使用示例：
 * 
 * 1. 在 modifyStats 中使用 clampMetrics：
 * 
 * modifyStats: (changes) => set((state) => {
 *   const safeChanges = safeMutations.clampMetrics(changes);
 *   return {
 *     vitality: {
 *       ...state.vitality,
 *       metrics: { ...state.vitality.metrics, ...safeChanges }
 *     }
 *   };
 * })
 * 
 * 2. 在添加物品时使用：
 * 
 * addItem: (itemId) => set((state) => {
 *   const result = safeMutations.addToInventory(state.inventory, itemId);
 *   if (!result.success) {
 *     state.addNotification?.('背包已满', 'warning');
 *   }
 *   return { inventory: result.newInventory };
 * })
 * 
 * 3. 在 contractDisease 中使用：
 * 
 * contractDisease: (diseaseId) => set((state) => {
 *   const result = safeMutations.addDisease(
 *     state.vitality.activeDiseases, 
 *     diseaseId
 *   );
 *   return {
 *     vitality: {
 *       ...state.vitality,
 *       activeDiseases: result.newDiseases
 *     }
 *   };
 * })
 */

export default safeMutations;
