import React from 'react';
import { motion } from 'framer-motion';

interface DailySettlementProps {
  data: {
    income: number;
    expense: number;
    class: string;
  };
  onNextDay: () => void;
}

export const DailySettlement: React.FC<DailySettlementProps> = ({
  data,
  onNextDay,
}) => {
  const net = data.income - data.expense;

  return (
    <div className="fixed inset-0 z-[8000] bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md border-y-2 border-green-900 bg-black p-8 font-mono text-green-500"
      >
        <h2 className="text-2xl font-bold mb-6 border-b border-green-800 pb-2">
          [ NIGHT_REPORT ]
        </h2>

        <div className="space-y-4 mb-8 text-sm md:text-base">
          <div className="flex justify-between">
            <span>CLASS STATUS:</span>
            <span className="text-white">{data.class}</span>
          </div>
          <div className="flex justify-between">
            <span>DAILY INCOME:</span>
            <span>+${data.income}</span>
          </div>
          <div className="flex justify-between">
            <span>LIVING COST:</span>
            <span className="text-red-500">-${data.expense}</span>
          </div>
          <div className="border-t border-dashed border-green-800 my-2 pt-2 flex justify-between text-lg font-bold">
            <span>NET CHANGE:</span>
            <span className={net >= 0 ? 'text-yellow-400' : 'text-red-500'}>
              {net >= 0 ? '+' : ''}{net}
            </span>
          </div>
        </div>

        <button
          onClick={onNextDay}
          className="w-full border border-green-700 py-3 hover:bg-green-900 hover:text-white transition-colors animate-pulse"
        >
          [ SLEEP_CYCLE_INIT ]
        </button>
      </motion.div>
    </div>
  );
};