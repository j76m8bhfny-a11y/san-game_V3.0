/**
 * DeathSummary - 死亡结算界面
 * 
 * 玩家死亡后显示：
 * 1. 本次存活时间
 * 2. 本次解锁的档案
 * 3. D选项减免提升
 * 4. 开始新轮回按钮
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { calculateDOptionReduction } from '@/logic/archiveModifier';

interface DeathSummaryProps {
  onRestart: () => void;
}

export const DeathSummary: React.FC<DeathSummaryProps> = ({ onRestart }) => {
  const { 
    currentRun, 
    unlockedArchives, 
    totalDeaths,
    dismissDeathSummary 
  } = useGameStore();

  const totalArchives = unlockedArchives?.length || 0;
  const runArchives = currentRun?.unlockedArchives || [];
  const currentReduction = calculateDOptionReduction(totalArchives);
  const previousReduction = calculateDOptionReduction(totalArchives - runArchives.length);
  
  // 从store获取存活周数
  const vitality = (useGameStore.getState() as any).vitality;
  const survivedWeeks = vitality?.time?.currentTurn || 0;

  const handleRestart = () => {
    dismissDeathSummary();
    onRestart();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] bg-black flex items-center justify-center p-6"
    >
      {/* 背景效果 */}
      <div className="absolute inset-0 opacity-20 bg-[url('/assets/textures/noise.svg')]" />
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-black" />

      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative max-w-2xl w-full bg-gray-900/90 border border-gray-700 rounded-2xl p-8 shadow-2xl"
      >
        {/* 标题 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-6xl mb-4"
          >
            💀
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black text-red-500 font-pixel mb-2">
            你死了
          </h1>
          <p className="text-gray-500 text-sm">
            但这只是轮回的一部分
          </p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-black/40 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{survivedWeeks}</div>
            <div className="text-gray-500 text-xs">存活周数</div>
          </div>
          <div className="bg-black/40 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{totalDeaths}</div>
            <div className="text-gray-500 text-xs">总死亡次数</div>
          </div>
        </div>

        {/* 档案解锁信息 */}
        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📜</span>
            <h2 className="text-lg font-bold text-cyan-400">本次解锁档案</h2>
          </div>

          {runArchives.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">本次新解锁</span>
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
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-cyan-500">✓</span>
                    <span className="text-gray-300">{archiveId}</span>
                  </motion.div>
                ))}
              </div>

              {/* D选项减免提升 */}
              <div className="border-t border-cyan-500/20 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">D选项减免提升</span>
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
            </>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <p>本次没有解锁新档案</p>
              <p className="text-xs mt-2 text-gray-600">
                选择 ⚠️ 选项（真相）可以解锁档案，降低未来代价
              </p>
            </div>
          )}
        </div>

        {/* 总进度 */}
        <div className="bg-black/40 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">档案收集进度</span>
            <span className="text-white font-bold">{totalArchives} / 240</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(totalArchives / 240) * 100}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            />
          </div>
        </div>

        {/* 按钮 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRestart}
          className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 
                     hover:from-cyan-500 hover:to-purple-500
                     text-white font-bold text-lg rounded-xl
                     shadow-lg shadow-cyan-500/25
                     transition-all"
        >
          开始新的轮回
        </motion.button>

        <p className="text-center text-gray-600 text-xs mt-4">
          所有已解锁的档案将保留到下一次人生
        </p>
      </motion.div>
    </motion.div>
  );
};

export default DeathSummary;
