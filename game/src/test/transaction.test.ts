import { describe, it, expect, vi } from 'vitest';
import { executeTransactionSync, createStep } from '@/utils/transaction';

describe('事务管理器', () => {
  it('所有步骤成功时返回成功', () => {
    const result = executeTransactionSync([
      createStep('步骤1', () => true, () => {}),
      createStep('步骤2', () => true, () => {}),
      createStep('步骤3', () => true, () => {}),
    ], 'test');

    expect(result.success).toBe(true);
    expect(result.completedSteps).toEqual(['步骤1', '步骤2', '步骤3']);
  });

  it('某步骤失败时回滚已完成步骤', () => {
    const rollback1 = vi.fn();
    const rollback2 = vi.fn();

    const result = executeTransactionSync([
      createStep('步骤1', () => true, rollback1),
      createStep('步骤2', () => true, rollback2),
      createStep('步骤3', () => false, () => {}),
    ], 'test');

    expect(result.success).toBe(false);
    expect(result.failedStep).toBe('步骤3');
    expect(rollback1).toHaveBeenCalled();
    expect(rollback2).toHaveBeenCalled();
  });

  it('执行异常时回滚并返回错误信息', () => {
    const rollback = vi.fn();

    const result = executeTransactionSync([
      createStep('步骤1', () => true, () => {}),
      createStep('步骤2', () => {
        throw new Error('执行错误');
      }, rollback),
    ], 'test');

    expect(result.success).toBe(false);
    expect(result.error).toBe('执行错误');
  });
});
