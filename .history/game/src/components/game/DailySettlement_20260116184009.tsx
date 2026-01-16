// src/components/game/DailySettlement.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface DailySettlementProps {
  data: { income: number; expense: number; class: string; };
  onNextDay: () => void;
}

export const DailySettlement: React.FC<DailySettlementProps> = ({ data, onNextDay }) => {
  const net = data.income - data.expense;

  return (
    <div className="fixed inset-0 z-[8000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      {/*  iOS 报告卡片 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[2rem] shadow-2xl overflow-hidden font-sans text-slate-900 dark:text-white"
      >
        {/* 顶部日期 */}
        <div className="pt-8 pb-4 text-center border-b border-gray-100 dark:border-white/5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Daily Summary</div>
          <div className="text-3xl font-bold mt-2 tracking-tight">Today</div>
        </div>

        {/* 数据环 */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 text-xl">
                💰
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Income</span>
                <span className="font-bold">{data.class} Wage</span>
              </div>
            </div>
            <span className="text-green-500 font-bold font-mono">+{data.income}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 text-xl">
                📉
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Living Cost</span>
                <span className="font-bold">Survival Fee</span>
              </div>
            </div>
            <span className="text-red-500 font-bold font-mono">-{data.expense}</span>
          </div>

          {/* 净值大数字 */}
          <div className="text-center pt-2">
            <div className="text-sm text-gray-400 mb-1">Net Change</div>
            <div className={`text-4xl font-black tracking-tighter ${net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {net >= 0 ? '+' : ''}{net}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 bg-gray-50 dark:bg-black/20">
          <button
            onClick={onNextDay}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            Confirm & Sleep
          </button>
        </div>
      </motion.div>
    </div>
  );
};