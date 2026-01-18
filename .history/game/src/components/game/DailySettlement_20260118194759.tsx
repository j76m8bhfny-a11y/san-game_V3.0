import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

// 🚨 修正 Props 接口，使其匹配 App.tsx 的调用
interface DailySettlementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailySettlement: React.FC<DailySettlementProps> = ({ isOpen, onClose }) => {
  // 直接从 Store 获取数据
  const { day, gold, hp, san, dailySummary } = useGameStore();

  const summary = dailySummary || { revenue: 0, expenses: 0, notes: [] };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#1a1a1a] border border-gray-700 p-8 w-[90%] max-w-md shadow-2xl relative overflow-hidden"
          >
            {/* 装饰线条 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

            <h2 className="font-mono text-2xl text-cyan-500 mb-6 text-center tracking-widest">
              MONTH {day} REPORT
            </h2>

            <div className="space-y-4 mb-8 font-mono text-sm text-gray-300">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span>SALARY REVENUE</span>
                  <span className="text-green-500">+${summary.revenue}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span>LIVING EXPENSES</span>
                  <span className="text-red-500">-${summary.expenses}</span>
                </div>
                
                {summary.notes.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs text-gray-500 mb-1">NOTIFICATIONS:</div>
                    {summary.notes.map((note, idx) => (
                      <div key={idx} className="text-xs text-yellow-600 mb-1">> {note}</div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between text-lg font-bold">
                   <span>NET WORTH</span>
                   <span className={gold < 0 ? 'text-red-500' : 'text-white'}>${gold}</span>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                   <span>HP: {hp}</span>
                   <span>SAN: {san}</span>
                </div>
            </div>

            <button
              onClick={onClose}
              className="w-full p-4 bg-cyan-900/20 border border-cyan-800 text-cyan-500 hover:bg-cyan-900/40 hover:text-cyan-300 transition-all font-bold tracking-widest uppercase"
            >
              [ PROCEED TO NEXT MONTH ]
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};