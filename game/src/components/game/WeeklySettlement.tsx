import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, Bitcoin
} from 'lucide-react';
import { Disease, WeeklyReport } from '@/types/schema';
import { useI18n } from '@/i18n';

// ✅ 1. 引入统一配置加载器
import { Config } from '@/config';

interface WeeklySettlementProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const WeeklySettlement: React.FC<WeeklySettlementProps> = ({ isOpen }) => {
  const { t } = useI18n();
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
  
  // ✅ 2. 提取配置数值
  const { maxTurns } = Config.ending.constraints;
  const { animationScale, modalZIndex } = Config.bill.settlement;

  // 1. 统一计算汇总 (确保类型符合 WeeklyReport)
  const summary: WeeklyReport = useMemo(() => {
    // A. 优先使用 Store 中的官方报表 (Snapshot)
    if (weeklyReport) return weeklyReport;

    // B. Fallback: 如果没有报表，根据当前账本实时计算 (用于预览或容错)
    let totalIncome = 0;
    let totalExpense = 0;
    
    ledger.history.forEach(record => {
      if (record.amount > 0) {
        totalIncome += record.amount;
      } else {
        totalExpense += Math.abs(record.amount);
      }
    });

    return {
      turn: time.currentTurn,
      totalIncome,
      totalExpense,
      netChange: totalIncome - totalExpense,
      records: ledger.history, 
      summaryByCategory: {}    
    };
  }, [ledger.history, weeklyReport, time.currentTurn]);

  // 2. 检查是否有急性病
  const acuteDiseases = useMemo(() => {
    if (!gameDataCache?.diseases) return [];
    return activeDiseases
      .map(id => gameDataCache.diseases.find((d: Disease) => d.id === id))
      .filter((d: Disease | undefined): d is Disease => !!d && d.type === 'ACUTE');
  }, [activeDiseases, gameDataCache]);

  // 3. 处理"下一周"
  const handleNextWeek = () => {
    closeWeeklyReport();

    // 🚨 急诊拦截逻辑（使用已提取的 activeDiseases，避免重复调用 getState）
    const hasAcute = activeDiseases.some(id => {
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
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        style={{ zIndex: modalZIndex }} // ✅ 使用配置的 Z-Index
      >
        <motion.div 
          // ✅ 使用配置的动画缩放比例
          initial={{ y: 50, opacity: 0, scale: animationScale }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: animationScale }}
          className="w-full max-w-md bg-[#F5F5F7] dark:bg-[#111] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans relative border border-gray-200 dark:border-gray-800"
        >
          {/* Header */}
          <div className="p-6 pb-2 bg-white dark:bg-[#161616]">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">WEEKLY STATEMENT</div>
              <div className="flex items-center gap-1 text-gray-500 font-mono text-xs">
                 <Calendar size={12}/>
                 {/* ✅ 使用配置的最大周数 */}
                 <span>WEEK {summary.turn} / {maxTurns}</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {t('weeklySettlement.title', { turn: summary.turn })}
            </h2>
            
            {/* 财务摘要 */}
            <div className="mt-6 grid grid-cols-2 gap-3">
               <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                 <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                   <TrendingUp size={12} /> {t('weeklySettlement.income')}
                 </div>
                 <div className="text-xl font-bold text-green-500 font-mono">
                   +${summary.totalIncome}
                 </div>
               </div>
               <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                 <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                   <TrendingDown size={12} /> {t('weeklySettlement.expense')}
                 </div>
                 <div className="text-xl font-bold text-red-500 font-mono">
                   -${summary.totalExpense}
                 </div>
               </div>
            </div>

            {/* Crypto 简报 */}
            {crypto.isAccountOpen && (
              <div className="mt-3 py-2 px-3 bg-gray-900 rounded-lg flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <Bitcoin size={14} className="text-amber-500" />
                  <span>BTC/USD</span>
                </div>
                <div className="font-mono text-white">
                  ${crypto.btcPrice.toLocaleString()} 
                </div>
              </div>
            )}
          </div>

          {/* 账单流水列表 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-[200px] max-h-[350px] custom-scrollbar bg-[#F5F5F7] dark:bg-[#0a0a0a]">
             {summary.records.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2 py-10">
                 <DollarSign size={32} />
                 <span className="text-xs">{t('weeklySettlement.noTransaction')}</span>
               </div>
             ) : (
               summary.records.map((record) => (
                 <div key={record.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-800 last:border-0">
                   <div>
                     <div className="font-bold text-sm text-gray-700 dark:text-gray-200">
                       {record.description}
                     </div>
                     <div className="text-[10px] text-gray-400 uppercase px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded w-fit mt-1">
                       {t(`weeklySettlement.categories.${record.category.toLowerCase()}`)}
                     </div>
                   </div>
                   <div className={`font-mono font-bold ${record.amount > 0 ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                     {record.amount > 0 ? '+' : ''}{record.amount}
                   </div>
                 </div>
               ))
             )}
          </div>

          {/* 底部按钮区 */}
          <div className="p-6 bg-white dark:bg-[#161616] border-t border-gray-200 dark:border-gray-800">
             {/* 疾病警告 */}
             {acuteDiseases.length > 0 && (
               <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-500/20">
                 <AlertCircle className="shrink-0 animate-pulse" />
                 <div>
                   <div className="uppercase text-[10px] opacity-70">{t('weeklySettlement.medicalAlert')}</div>
                   {t('weeklySettlement.acuteDisease', { diseases: acuteDiseases.map(d => d.name).join(', ') })}
                 </div>
               </div>
             )}

             <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-400 uppercase">{t('weeklySettlement.net')}</span>
                <span className={`text-2xl font-black font-mono ${summary.netChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {summary.netChange >= 0 ? '+' : ''}{summary.netChange}
                </span>
             </div>

             <button
               onClick={handleNextWeek}
               className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
             >
               {t('weeklySettlement.nextWeek', { week: time.currentTurn + 1 })} <ArrowRight size={20} />
             </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};