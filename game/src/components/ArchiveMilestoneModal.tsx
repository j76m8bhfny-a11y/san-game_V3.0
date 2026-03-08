/**
 * Archive Milestone Modal - 档案里程碑弹窗 (Zustand版本)
 * 
 * 当玩家解锁特定数量的档案时弹出，展示：
 * - 叙事性奖励（暗网回响）
 * - 机制性奖励（D选项惩罚减少、新职业解锁等）
 * - 系统凝视强度变化
 */

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export const ArchiveMilestoneModal: React.FC = () => {
  const { 
    showMilestoneModal, 
    pendingMilestone, 
    dismissMilestone,
    unlockedArchives,
    getDOptionPenaltyReduction,
    hasUnlockedClass
  } = useGameStore();
  
  const totalArchives = unlockedArchives?.length || 0;
  const penaltyReduction = getDOptionPenaltyReduction?.() || 0;
  
  const hasWorkerUnlocked = hasUnlockedClass?.('WORKER') || totalArchives >= 10;
  const hasMiddleUnlocked = hasUnlockedClass?.('MIDDLE') || totalArchives >= 25;
  const hasCapitalistUnlocked = hasUnlockedClass?.('CAPITALIST') || totalArchives >= 40;
  
  if (!showMilestoneModal || !pendingMilestone) {
    return null;
  }
  
  const isMajorUnlock = pendingMilestone.type === 'unlock';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark">
      <div className="relative max-w-lg w-full mx-4 bg-gray-900 border border-gray-700 rounded-sm overflow-hidden shadow-pixel">
        {/* 顶部发光条 */}
        <div className={`h-1 ${isMajorUnlock ? 'bg-pixel-gradient-purple' : 'bg-pixel-gradient-cyan'}`} />
        
        {/* 内容区 */}
        <div className="p-6">
          {/* 标题 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-gray-800 mb-4">
              {isMajorUnlock ? (
                <svg className="w-8 h-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>
            <h2 className={`text-2xl font-bold ${isMajorUnlock ? 'text-pink-400' : 'text-cyan-400'}`}>
              {isMajorUnlock ? '里程碑解锁！' : '档案收集进度'}
            </h2>
            <p className="text-gray-400 mt-1">{pendingMilestone.description}</p>
          </div>
          
          {/* 奖励列表 */}
          <div className="space-y-3 mb-6">
            {pendingMilestone.rewards.map((reward: any, index: number) => (
              <div 
                key={index}
                className={`p-4 rounded-sm border ${
                  reward.type === 'narrative' 
                    ? 'bg-purple-900/20 border-purple-700/50' 
                    : reward.type === 'mechanic'
                    ? 'bg-cyan-900/20 border-cyan-700/50'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${
                    reward.type === 'narrative' ? 'text-purple-400' : 
                    reward.type === 'mechanic' ? 'text-cyan-400' : 'text-gray-400'
                  }`}>
                    {reward.type === 'narrative' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {reward.type === 'mechanic' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {reward.type === 'hint' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-1">
                      {reward.type === 'narrative' && '暗网回响'}
                      {reward.type === 'mechanic' && '机制更新'}
                      {reward.type === 'hint' && '系统提示'}
                    </div>
                    <div className={`text-sm ${
                      reward.type === 'narrative' ? 'text-purple-200 italic' : 'text-gray-400'
                    }`}>
                      "{reward.content}"
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 当前状态概览 */}
          <div className="bg-gray-800/50 rounded-sm p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">当前状态</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{totalArchives}</div>
                <div className="text-xs text-gray-500">已解锁档案</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">{Math.round(penaltyReduction * 100)}%</div>
                <div className="text-xs text-gray-500">D选项惩罚减免</div>
              </div>
            </div>
            
            {/* 职业解锁状态 */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-500 mb-2">已解锁职业</div>
              <div className="flex gap-2">
                <span className="px-2 py-1 text-xs rounded bg-green-900/50 text-green-400 border border-green-700">流浪者</span>
                {hasWorkerUnlocked && (
                  <span className="px-2 py-1 text-xs rounded bg-blue-900/50 text-blue-400 border border-blue-700">打工人</span>
                )}
                {hasMiddleUnlocked && (
                  <span className="px-2 py-1 text-xs rounded bg-yellow-900/50 text-yellow-400 border border-yellow-700">中产</span>
                )}
                {hasCapitalistUnlocked && (
                  <span className="px-2 py-1 text-xs rounded bg-red-900/50 text-red-400 border border-red-700">资本家</span>
                )}
              </div>
            </div>
          </div>
          
          {/* 按钮 */}
          <button
            onClick={dismissMilestone}
            className={`w-full py-3 px-4 rounded-sm font-medium transition-all ${
              isMajorUnlock
                ? 'bg-pixel-gradient-purple text-white hover:brightness-110'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            继续游戏
          </button>
        </div>
        
        {/* 装饰性背景 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-sm blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-sm blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default ArchiveMilestoneModal;
