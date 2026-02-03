import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, Bitcoin
} from 'lucide-react';
import { Disease } from '@/types/schema';

interface WeeklySettlementProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const WeeklySettlement: React.FC<WeeklySettlementProps> = ({ isOpen }) => {
  const { 
    vitality, 
    crypto, 
    gameDataCache, 
    closeWeeklyReport, 
    setHospitalOpen, 
    addNotification,
    weeklyReport 
  } = useGameStore();

  const { ledger, time, activeDiseases } = vitality;
  
  // ✨ 修复点：只保留这一个 summary 计算逻辑
  // 逻辑：优先显示系统生成的周报(weeklyReport)，如果没生成则根据当前账本实时计算(Fallback)
  const summary = useMemo(() => {
    if (weeklyReport) return weeklyReport;

    let income = 0;
    let expense = 0;
    ledger.history.forEach(record => {
      if (record.amount > 0) income += record.amount;
      else expense += Math.abs(record.amount);
    });
    return { 
      income, 
      expense, 
      net: income - expense,
      summaryByCategory: {} // Fallback 空对象
    };
  }, [ledger.history, weeklyReport]);

  const acuteDiseases = useMemo(() => {
    if (!gameDataCache?.diseases) return [];
    return activeDiseases
      .map(id => gameDataCache.diseases.find((d: Disease) => d.id === id))
      .filter((d: Disease | undefined): d is Disease => !!d && d.type === 'ACUTE');
  }, [activeDiseases, gameDataCache]);

  const handleNextWeek = () => {
    closeWeeklyReport();
    
    // 检查是否有急性病，强制打开医院
    const currentDiseases = useGameStore.getState().vitality.activeDiseases;
    const hasAcute = currentDiseases.some(id => {
       const d = gameDataCache?.diseases?.find((x: Disease) => x.id === id);
       return d?.type === 'ACUTE';
    });

    if (hasAcute) {
      setHospitalOpen(true);
      addNotification("警告：检测到致命病症，系统已强制启动急救程序。", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <motion.div 
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-[#F5F5F7] dark:bg-[#111] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans relative border border-gray-200 dark:border-gray-800"
        >
          {/* Header */}
          <div className="p-6 pb-2 bg-white dark:bg-[#161616]">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">WEEKLY STATEMENT</div>
              <div className="flex items-center gap-1 text-gray-500 font-mono text-xs">
                 <Calendar size={12}/>
                 <span>WEEK {time.currentTurn} / 52</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              周结账单
            </h2>
            
            {/* 财务摘要 */}
            <div className="mt-6 grid grid-cols-2 gap-3">
               <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                 <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                   <TrendingUp size={12} /> 总收入
                 </div>
                 <div className="text-xl font-bold text-green-500 font-mono">
                   +${summary.income}
                 </div>
               </div>
               <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                 <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                   <TrendingDown size={12} /> 总支出
                 </div>
                 <div className="text-xl font-bold text-red-500 font-mono">
                   -${summary.expense}
                 </div>
               </div>
            </div>

            {/* Crypto 简报 */}
            {crypto.isAccountOpen && (
              <div className="mt-3 py-2 px-3 bg-gray-900 rounded-lg flex justify-between items-center text-xs border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400">
                  <Bitcoin size={14} className="text-amber-500" />
                  <span>BTC/USD</span>
                </div>
                <div className="font-mono text-white flex items-center gap-2">
                   <span>${crypto.btcPrice.toLocaleString()}</span>
                   {/* 简单的趋势指示器 */}
                   {crypto.priceHistory.length > 1 && crypto.btcPrice > crypto.priceHistory[crypto.priceHistory.length - 2] 
                      ? <span className="text-green-500">↑</span> 
                      : <span className="text-red-500">↓</span>
                   }
                </div>
              </div>
            )}
          </div>

          {/* 账单流水列表 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-[200px] max-h-[350px] custom-scrollbar bg-[#F5F5F7] dark:bg-[#0a0a0a]">
             {(!summary.records || summary.records.length === 0) && ledger.history.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2 py-10">
                 <DollarSign size={32} />
                 <span className="text-xs">本周无资金变动</span>
               </div>
             ) : (
               // 优先显示 summary.records (快照)，否则显示 ledger.history
               (summary.records || ledger.history).map((record: any) => (
                 <div key={record.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-800 last:border-0">
                   <div>
                     <div className="font-bold text-sm text-gray-700 dark:text-gray-200">
                       {record.description}
                     </div>
                     <div className="text-[10px] text-gray-400 uppercase px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded w-fit mt-1">
                       {record.category}
                     </div>
                   </div>
                   <div className={`font-mono font-bold ${record.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                     {record.amount > 0 ? '+' : ''}{record.amount}
                   </div>
                 </div>
               ))
             )}
          </div>

          {/* 底部按钮 */}
          <div className="p-6 bg-white dark:bg-[#161616] border-t border-gray-200 dark:border-gray-800">
             {acuteDiseases.length > 0 && (
               <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-500/20">
                 <AlertCircle className="shrink-0 animate-pulse" />
                 <div>
                   <div className="uppercase text-[10px] opacity-70">Medical Alert</div>
                   检测到急性病症: {acuteDiseases.map(d => d.name).join(', ')}
                 </div>
               </div>
             )}

             <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-400 uppercase">Net Profit</span>
                <span className={`text-2xl font-black font-mono ${summary.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {summary.net >= 0 ? '+' : ''}{summary.net}
                </span>
             </div>

             <button
               onClick={handleNextWeek}
               className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
             >
               Start Week {time.currentTurn + 1} <ArrowRight size={20} />
             </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};