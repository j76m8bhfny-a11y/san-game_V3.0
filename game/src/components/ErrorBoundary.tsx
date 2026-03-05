/**
 * 全局错误边界组件
 * 捕获 React 组件渲染错误，防止整个应用崩溃
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染显示降级 UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // 可以在这里接入错误上报服务（如 Sentry）
    // reportError(error, errorInfo);
  }

  private handleReset = () => {
    // 尝试恢复
    this.setState({ hasError: false, error: null, errorInfo: null });
    // 刷新页面以确保状态干净
    window.location.reload();
  };

  private handleSaveAndReset = () => {
    // 保存游戏状态（如果有）
    try {
      const gameState = localStorage.getItem('pixel-life-storage');
      if (gameState) {
        const backupKey = `pixel-life-backup-${Date.now()}`;
        localStorage.setItem(backupKey, gameState);
        console.log(`游戏状态已备份到: ${backupKey}`);
      }
    } catch (e) {
      console.error('备份失败:', e);
    }
    
    // 重置
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      // 自定义降级 UI
      return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center p-4">
          <div className="max-w-2xl w-full border border-green-500/30 bg-green-900/10 p-8 rounded-lg">
            {/* 标题 */}
            <div className="flex items-center gap-4 mb-6">
              <div className="text-4xl">⚠️</div>
              <div>
                <h1 className="text-2xl font-bold text-red-500">SYSTEM CRASH</h1>
                <p className="text-sm text-green-500/60">游戏遇到了意外错误</p>
              </div>
            </div>

            {/* 错误信息 */}
            <div className="space-y-4 mb-6">
              <div className="bg-black/50 p-4 rounded border border-green-500/20">
                <p className="text-xs text-green-500/40 mb-2">ERROR MESSAGE</p>
                <p className="text-red-400 font-mono text-sm break-all">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              {this.state.errorInfo && (
                <details className="bg-black/30 rounded border border-green-500/10">
                  <summary className="p-4 cursor-pointer text-xs text-green-500/60 hover:text-green-400">
                    查看详细错误信息（供开发者使用）
                  </summary>
                  <pre className="p-4 text-xs text-green-500/40 overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            {/* 操作建议 */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded mb-6">
              <p className="text-sm text-yellow-400">
                💡 建议操作：尝试刷新页面恢复游戏。如果问题持续存在，可能需要清除存档重新开始。
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-500 text-black font-bold rounded transition-colors"
              >
                刷新页面恢复
              </button>
              <button
                onClick={this.handleSaveAndReset}
                className="flex-1 py-3 px-6 bg-yellow-600/50 hover:bg-yellow-500/50 text-yellow-200 font-bold rounded transition-colors"
              >
                备份存档并刷新
              </button>
            </div>

            {/* 底部提示 */}
            <p className="mt-6 text-xs text-center text-green-500/30">
              American Insight v3.0 | Error Boundary v1.0
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 简化的错误边界 Hook
 * 用于函数组件中捕获异步错误
 */
export function useErrorHandler() {
  return (error: Error, context?: string) => {
    console.error(`[ErrorHandler] ${context || 'Unhandled error'}:`, error);
    // 可以在这里接入错误上报服务
  };
}
