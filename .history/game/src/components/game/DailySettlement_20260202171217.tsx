import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Activity, 
  AlertCircle 
} from 'lucide-react';
import { Disease } from '@/types/schema';

interface DailySettlementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailySettlement: React.FC<DailySettlementProps> = ({ isOpen, onClose }) => {
  const { 
    vitality, 
    gameDataCache, 
    advanceTurn, 
    clearWeeklyLedger, 
    setHospitalOpen, 
    addNotification,
    playSfx // 假设你有音频Store，如果没有可忽略
  } = useGameStore();

  const { ledger, time, metrics, activeDiseases } = vitality;

  // 1. 计算本周财务汇总
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    ledger.history.forEach(record => {
      if (record.amount > 0) {
        income += record.amount;
      } else {
        expense += Math.abs(record.amount);
      }
    });

    return {
      income,
      expense,
      net: income - expense
    };
  }, [ledger.history]);

  // 2. 检查是否有急性病 (用于 UI 警示)
  const acuteDiseases = useMemo(() => {
    if (!gameDataCache?.diseases) return [];
    return activeDiseases
      .map(id => gameDataCache.diseases.find((d: Disease) => d.id === id))
      .filter((d: Disease | undefined): d is Disease => !!d && d.type === 'ACUTE');
  }, [activeDiseases, gameDataCache]);

  // 3. 核心：处理“下一天”逻辑
  const handleNextDay = () => {
    // A. 播放音效
    if (playSfx) playSfx('sfx_stamp');

    // B. 推进回合 (这会触发 VitalitySlice 中的 checkDailyDisease)
    advanceTurn();
    
    // C. 清空本周账本 (准备记录下一周)
    clearWeeklyLedger();

    // D. 🚨 急诊拦截逻辑 🚨
    // 注意：由于 advanceTurn 刚刚运行，可能刚刚触发了新病。
    // 我们需要再次从 store 获取最新的 activeDiseases (这里简化为检查当前已有+假设 advanceTurn 同步更新)
    // 更好的做法是让 advanceTurn 返回新病，但为了解耦，我们再次检查 store 状态。
    // *React 状态更新可能是异步的，但在 Zustand 中 getState() 是实时的*
    
    // 重新获取最新状态检查是否暴毙
    const currentDiseases = useGameStore.getState().vitality.activeDiseases;
    const hasAcute = currentDiseases.some(id => {
       const d = gameDataCache?.diseases?.find((x: Disease) => x.id === id);
       return d?.type === 'ACUTE';
    });

    if (hasAcute) {
      // 强制打开医院
      setHospitalOpen(true);
      addNotification("警告：检测到致命病症，系统已强制启动急救程序。", "error");
      // 这里我们依然调用 onClose 关闭结算单，因为结算单和医院Modal重叠体验不好
      // 玩家会被直接带到医院界面，且那个界面会有红色警报条
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="w-full max-w-md bg-[#F5F5F7] dark:bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans relative"
        >
          {/* 顶部装饰条: 类似打印的小票锯齿效果 */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[url('/assets/pattern-sawtooth.png')] opacity-20"></div>

          {/* Header */}
          <div className="p-6 pb-2">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">WEEKLY REPORT</div>
              <div className="flex items-center gap-1 text-gray-500 font-mono text-xs">
                 <Calendar size={12}/>
                 <span>TURN {time.currentTurn}</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              结算清单
            </h2>
            
            {/* 财务摘要卡片 */}
            <div className="mt-6 grid grid-cols-2 gap-3">
               <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                 <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                   <TrendingUp size={12} /> 收入
                 </div>
                 <div className="text-xl font-bold text-green-500 font-mono">
                   +${summary.income}
                 </div>
               </div>
               <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                 <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                   <TrendingDown size={12} /> 支出
                 </div>
                 <div className="text-xl font-bold text-red-500 font-mono">
                   -${summary.expense}
                 </div>
               </div>
            </div>

            {/* 净利润大数字 */}
            <div className={`mt-4 text-center p-4 rounded-2xl border-2 border-dashed ${summary.net >= 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
               <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">NET PROFIT</div>
               <div className={`text-4xl font-black font-mono ${summary.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                 {summary.net >= 0 ? '+' : ''}{summary.net}
               </div>
            </div>
          </div>

          {/* 账单流水列表 (中间滚动区) */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 min-h-[200px] max-h-[300px] custom-scrollbar">
             {ledger.history.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-2">
                 <DollarSign size={32} />
                 <span className="text-xs">本周无交易记录</span>
               </div>
             ) : (
               ledger.history.map((record) => (
                 <div key={record.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/5 last:border-0">
                   <div>
                     <div className="font-bold text-sm text-gray-700 dark:text-gray-200">
                       {record.description}
                     </div>
                     <div className="text-[10px] text-gray-400 uppercase px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded w-fit mt-1">
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

          {/* 底部：警告与按钮 */}
          <div className="p-6 bg-white dark:bg-white/5 border-t border-gray-200 dark:border-white/10">
             
             {/* 疾病警告 (如果当前已经带病) */}
             {acuteDiseases.length > 0 && (
               <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-500/20">
                 <AlertCircle className="shrink-0 animate-pulse" />
                 <div>
                   检测到急性病症: {acuteDiseases.map(d => d.name).join(', ')}
                   <div className="text-xs font-normal opacity-80 mt-0.5">如果不立即治疗，可能无法度过今晚。</div>
                 </div>
               </div>
             )}

             <button
               onClick={handleNextDay}
               className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
             >
               开始新的一周 <ArrowRight size={20} />
             </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};