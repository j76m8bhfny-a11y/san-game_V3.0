/**
 * DeathSummary - 死亡结算界面（增强版）
 * 
 * 玩家死亡后显示：
 * 1. 本次存活时间
 * 2. 死亡原因分析
 * 3. 犯过的错误
 * 4. 具体改进建议
 * 5. 本次解锁的档案
 * 6. D选项减免提升
 * 7. 开始新轮回按钮
 */

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { calculateDOptionReduction } from '@/logic/archiveModifier';
import { analyzeDeath, DeathCause } from '@/logic/deathAnalysis';
import { Skull, AlertTriangle, Lightbulb, Archive, Clock, RotateCcw } from 'lucide-react';
import { useDeathEffectPause } from '@/components/ui/DeathEffectPause';

interface DeathSummaryProps {
  onRestart: () => void;
}

// 死因图标映射
const CAUSE_ICONS: Record<DeathCause, { icon: string; color: string; title: string }> = {
  starvation: { icon: '🍖', color: 'text-orange-500', title: '饥饿致死' },
  violence: { icon: '⚔️', color: 'text-red-500', title: '暴力伤害' },
  disease: { icon: '🦠', color: 'text-green-500', title: '疾病恶化' },
  accident: { icon: '⚡', color: 'text-yellow-500', title: '意外事故' },
  system: { icon: '🤖', color: 'text-cyan-500', title: '系统惩罚' },
  unknown: { icon: '❓', color: 'text-gray-500', title: '死因不明' },
};

// 错误严重程度颜色
const SEVERITY_COLORS = {
  critical: 'bg-red-500/20 border-red-500/50 text-red-400',
  major: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  minor: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
};

// 建议优先级颜色
const PRIORITY_COLORS = {
  urgent: 'bg-red-500/20 border-red-500/50',
  high: 'bg-orange-500/20 border-orange-500/50',
  medium: 'bg-blue-500/20 border-blue-500/50',
};

// 死亡原因分析组件
const CauseAnalysis: React.FC<{ cause: DeathCause; description: string }> = ({ 
  cause, 
  description 
}) => {
  const causeInfo = CAUSE_ICONS[cause];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-black/40 rounded-sm p-5 border border-white/10"
    >
      <div className="flex items-start gap-4">
        <div className={`text-4xl ${causeInfo.color}`}>{causeInfo.icon}</div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${causeInfo.color} mb-1`}>
            {causeInfo.title}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

// 错误列表组件
const MistakesList: React.FC<{ mistakes: any[] }> = ({ mistakes }) => {
  if (mistakes.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 text-orange-400 mb-3">
        <AlertTriangle className="w-5 h-5" />
        <h3 className="font-bold">本局失误</h3>
      </div>
      
      {mistakes.map((mistake, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          className={`p-3 rounded-sm border text-sm ${SEVERITY_COLORS[mistake.severity as keyof typeof SEVERITY_COLORS]}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-60">第{mistake.turn}周</span>
            <span>{mistake.description}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// 改进建议组件
const SuggestionsList: React.FC<{ suggestions: any[] }> = ({ suggestions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 text-cyan-400 mb-3">
        <Lightbulb className="w-5 h-5" />
        <h3 className="font-bold">改进建议</h3>
      </div>
      
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 + index * 0.1 }}
          className={`p-4 rounded-sm border ${PRIORITY_COLORS[suggestion.priority as keyof typeof PRIORITY_COLORS]}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              suggestion.priority === 'urgent' ? 'bg-red-500 text-white' :
              suggestion.priority === 'high' ? 'bg-orange-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              {suggestion.priority === 'urgent' ? '紧急' :
               suggestion.priority === 'high' ? '重要' : '建议'}
            </span>
            <span className="font-bold text-white">{suggestion.title}</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">{suggestion.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};

// 档案进度组件
const ArchiveProgress: React.FC<{ 
  runArchives: string[]; 
  totalArchives: number;
  currentReduction: number;
  previousReduction: number;
}> = ({ runArchives, totalArchives, currentReduction, previousReduction }) => {
  if (runArchives.length === 0) {
    return (
      <div className="bg-black/40 rounded-sm p-5 border border-white/10 text-center">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-gray-400 text-sm">本次没有解锁新档案</p>
        <p className="text-xs text-gray-600 mt-2">
          选择 ⚠️ 选项（真相）可以解锁档案，降低未来代价
        </p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 }}
      className="bg-cyan-900/20 border border-cyan-500/30 rounded-sm p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Archive className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-cyan-400">本次解锁档案</h3>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">新解锁</span>
        <span className="text-2xl font-bold text-cyan-400">
          {runArchives.length} <span className="text-sm text-gray-500">份</span>
        </span>
      </div>
      
      {/* 档案列表 */}
      <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
        {runArchives.map((archiveId, index) => (
          <motion.div
            key={archiveId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + index * 0.05 }}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-cyan-500">✓</span>
            <span className="text-gray-300">{archiveId}</span>
          </motion.div>
        ))}
      </div>
      
      {/* D选项减免 */}
      <div className="border-t border-cyan-500/20 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">D选项减免</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 line-through text-sm">
              {Math.round(previousReduction * 100)}%
            </span>
            <span className="text-xl font-bold text-green-400">
              → {Math.round(currentReduction * 100)}%
            </span>
          </div>
        </div>
        <div className="text-xs text-cyan-400/70 mt-2">
          下次轮回中，D选项的伤害将降低 {Math.round(currentReduction * 100)}%
        </div>
      </div>
      
      {/* 总进度 */}
      <div className="mt-4 pt-4 border-t border-cyan-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">档案收集进度</span>
          <span className="text-white font-bold">{totalArchives} / 240</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalArchives / 240) * 100}%` }}
            transition={{ delay: 1, duration: 0.8 }}
            className="h-full bg-pixel-gradient-cyan"
          />
        </div>
      </div>
    </motion.div>
  );
};

export const DeathSummary: React.FC<DeathSummaryProps> = ({ onRestart }) => {
  const { 
    currentRun, 
    unlockedArchives, 
    totalDeaths,
    dismissDeathSummary 
  } = useGameStore();
  const { pauseEffects, resumeEffects } = useDeathEffectPause();
  
  const totalArchives = unlockedArchives?.length || 0;
  const runArchives = currentRun?.unlockedArchives || [];
  const currentReduction = calculateDOptionReduction(totalArchives);
  const previousReduction = calculateDOptionReduction(totalArchives - runArchives.length);
  
  // 从store获取存活周数
  const vitality = (useGameStore.getState() as any).vitality;
  const survivedWeeks = vitality?.time?.currentTurn || 0;
  
  // 死亡复盘分析
  const analysis = useMemo(() => {
    const gameState = useGameStore.getState();
    return analyzeDeath(gameState);
  }, []);

  // 组件挂载时暂停效果
  useEffect(() => {
    pauseEffects();
    return () => {
      resumeEffects();
    };
  }, [pauseEffects, resumeEffects]);

  const handleRestart = () => {
    resumeEffects();
    dismissDeathSummary();
    onRestart();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] bg-black flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* 背景效果 */}
      <div className="absolute inset-0 opacity-20 bg-[url('/assets/textures/noise.svg')]">
        <div className="absolute inset-0 bg-red-900/10" />
      </div>

      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative max-w-3xl w-full bg-gray-900/95 border border-gray-700 rounded-sm p-6 md:p-8 shadow-pixel my-8"
      >
        {/* 标题 */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-sm mb-4"
          >
            <Skull className="w-10 h-10 text-red-500" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black text-red-500 font-pixel mb-2">
            你死了
          </h1>
          <p className="text-gray-500">
            但这只是轮回的一部分
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/40 rounded-sm p-4 text-center"
          >
            <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{survivedWeeks}</div>
            <div className="text-gray-500 text-xs">存活周数</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-black/40 rounded-sm p-4 text-center"
          >
            <RotateCcw className="w-5 h-5 text-gray-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{totalDeaths}</div>
            <div className="text-gray-500 text-xs">总死亡次数</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/40 rounded-sm p-4 text-center"
          >
            <Archive className="w-5 h-5 text-gray-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-cyan-400">{runArchives.length}</div>
            <div className="text-gray-500 text-xs">本次档案</div>
          </motion.div>
        </div>

        {/* 死亡原因分析 */}
        <div className="mb-6">
          <CauseAnalysis cause={analysis.cause} description={analysis.causeDescription} />
        </div>

        {/* 两栏布局：错误和建议 */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <MistakesList mistakes={analysis.mistakes} />
          <SuggestionsList suggestions={analysis.suggestions} />
        </div>

        {/* 档案进度 */}
        <div className="mb-6">
          <ArchiveProgress 
            runArchives={runArchives}
            totalArchives={totalArchives}
            currentReduction={currentReduction}
            previousReduction={previousReduction}
          />
        </div>

        {/* 再玩激励 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-purple-900/30 rounded-sm p-4 mb-6 border border-purple-500/20"
        >
          <p className="text-center text-gray-300 text-sm">
            {analysis.replayIncentive}
          </p>
        </motion.div>

        {/* 按钮 */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRestart}
          className="w-full py-4 bg-pixel-gradient-cyan text-white font-bold text-lg rounded-sm
                     shadow-pixel-sm shadow-cyan-500/25
                     hover:brightness-110 transition-all"
        >
          开始新的轮回
        </motion.button>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center text-gray-600 text-xs mt-4"
        >
          所有已解锁的档案将保留到下一次人生
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default DeathSummary;
