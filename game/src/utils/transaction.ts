/**
 * 统一事务管理器
 * 用于保证多步骤操作的原子性（要么全部成功，要么全部回滚）
 */

export interface TransactionStep {
  id: string;
  execute: () => boolean;
  rollback: () => void;
}

export interface AsyncTransactionStep {
  id: string;
  execute: () => boolean | Promise<boolean>;
  rollback: () => void | Promise<void>;
}

export interface TransactionResult {
  success: boolean;
  completedSteps: string[];
  failedStep?: string;
  error?: string;
}

/**
 * 执行事务
 * @param steps 事务步骤数组
 * @param context 上下文信息（用于日志）
 * @returns 事务执行结果
 */
export async function executeTransaction(
  steps: AsyncTransactionStep[],
  context: string = 'unknown'
): Promise<TransactionResult> {
  const completedSteps: string[] = [];
  
  try {
    // 执行每个步骤
    for (const step of steps) {
      const success = await step.execute();
      
      if (!success) {
        // 执行失败，回滚已完成的步骤
        console.warn(`[Transaction] 步骤 "${step.id}" 执行失败，开始回滚...`, context);
        await rollbackSteps(steps, completedSteps);
        
        return {
          success: false,
          completedSteps: [...completedSteps],
          failedStep: step.id,
          error: `步骤 "${step.id}" 执行失败`
        };
      }
      
      completedSteps.push(step.id);
    }
    
    // 所有步骤执行成功
    console.log(`[Transaction] 事务执行成功: ${context}`);
    return {
      success: true,
      completedSteps
    };
  } catch (error) {
    // 发生异常，回滚已完成的步骤
    console.error(`[Transaction] 事务执行异常: ${context}`, error);
    await rollbackSteps(steps, completedSteps);
    
    return {
      success: false,
      completedSteps: [...completedSteps],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 回滚已完成的步骤（逆序执行）
 */
async function rollbackSteps(steps: AsyncTransactionStep[], completedStepIds: string[]): Promise<void> {
  // 逆序回滚
  for (let i = completedStepIds.length - 1; i >= 0; i--) {
    const stepId = completedStepIds[i];
    const step = steps.find(s => s.id === stepId);
    
    if (step) {
      try {
        await step.rollback();
        console.log(`[Transaction] 步骤 "${stepId}" 已回滚`);
      } catch (error) {
        console.error(`[Transaction] 步骤 "${stepId}" 回滚失败:`, error);
        // 继续回滚其他步骤，即使某个步骤回滚失败
      }
    }
  }
}

/**
 * 创建事务步骤的辅助函数
 */
export function createStep(
  id: string,
  execute: () => boolean,
  rollback: () => void = () => {}
): TransactionStep {
  return { id, execute, rollback };
}

export function createAsyncStep(
  id: string,
  execute: () => boolean | Promise<boolean>,
  rollback: () => void | Promise<void> = () => {}
): AsyncTransactionStep {
  return { id, execute, rollback };
}

/**
 * 同步版本的事务执行（用于不能异步的场景）
 */
export function executeTransactionSync(
  steps: TransactionStep[],
  _context: string = 'unknown'
): TransactionResult {
  const completedSteps: string[] = [];
  
  try {
    for (const step of steps) {
      const success = step.execute();
      
      if (!success) {
        // 回滚
        for (let i = completedSteps.length - 1; i >= 0; i--) {
          const completedStep = steps.find(s => s.id === completedSteps[i]);
          if (completedStep) {
            try {
              completedStep.rollback();
            } catch (e) {
              console.error(`[Transaction] 回滚失败:`, e);
            }
          }
        }
        
        return {
          success: false,
          completedSteps: [...completedSteps],
          failedStep: step.id,
          error: `步骤 "${step.id}" 执行失败`
        };
      }
      
      completedSteps.push(step.id);
    }
    
    return {
      success: true,
      completedSteps
    };
  } catch (error) {
    // 回滚
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const completedStep = steps.find(s => s.id === completedSteps[i]);
      if (completedStep) {
        try {
          completedStep.rollback();
        } catch (e) {
          console.error(`[Transaction] 回滚失败:`, e);
        }
      }
    }
    
    return {
      success: false,
      completedSteps: [...completedSteps],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
