import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import { motion } from 'framer-motion';
// ✅ Refactor: 引入新设计的监狱规则配置
import prisonRules from '@/assets/data/rules/prison_rules.json';

const JailOverlay: React.FC = () => {
  const { t } = useI18n();
  const { prison, vitality, serveTime, payCashBail, signBailBond } = useGameStore();
  const [log, setLog] = useState<string>("");

  // 没坐牢就不渲染
  if (!prison.inJail) return null;

  const currentClass = vitality.identity.currentClass;
  
  // ✅ Refactor: 从 JSON 配置读取保释金比率（带防御性默认值）
  const bondRate = prisonRules?.bail?.bondDownPaymentRate ?? 0.1;
  const bailDownPayment = Math.floor(prison.bailAmount * bondRate);

  // ✅ Refactor: 动态判断是否是特权阶级 (不再硬编码 'CAPITALIST')
  // 逻辑：如果该职业在配置中有 override 且 hpChange > 0，则视为 VIP
  // ✅ 防御性编程：使用可选链防止配置缺失
  const classConfig = (prisonRules?.dailyRoutine?.classOverrides as any)?.[currentClass];
  const isVipTreatment = classConfig && classConfig.hpChange > 0;

  const handleServe = () => {
    const res = serveTime();
    setLog(res.msg);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center font-mono">
      {/* 背景氛围层 */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_95%,#000_95%)] bg-[length:40px_100%] opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(50,50,50,0.5)_20%,transparent_20%)] bg-[length:10px_100%] opacity-20 pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-zinc-900 border-2 border-zinc-700 p-8 max-w-2xl w-full shadow-2xl"
      >
        {/* 头部信息 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-red-600 tracking-widest mb-2">{t('jail.title')}</h1>
          <p className="text-zinc-500">INMATE: {currentClass.toUpperCase()}</p>
          <div className="mt-4 p-4 bg-black/50 border border-zinc-800 text-zinc-300">
             {t('jail.crime')}: {prison.crime}
          </div>
        </div>

        {/* 状态面板 */}
        <div className="grid grid-cols-2 gap-8 mb-8">
           {/* 刑期状态 */}
           <div className="bg-zinc-800/50 p-4 border border-zinc-700">
              <div className="text-xs text-zinc-500 uppercase">{t('jail.sentence')}</div>
              <div className="text-2xl font-bold text-white">
                {/* 字段已确认为 turnsServed / sentenceTurns */}
                {prison.turnsServed} / {prison.sentenceTurns} <span className="text-sm font-normal text-zinc-500">Turns</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 mt-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600"
                  style={{ width: `${prison.sentenceTurns > 0 ? (prison.turnsServed / prison.sentenceTurns) * 100 : 0}%` }}
                />
              </div>
           </div>

           {/* 保释金显示 */}
           <div className="bg-zinc-800/50 p-4 border border-zinc-700">
              <div className="text-xs text-zinc-500 uppercase">{t('jail.bail')}</div>
              <div className="text-2xl font-bold text-green-500">${prison.bailAmount}</div>
              <div className="text-xs text-zinc-600 mt-1">Cash or Bond accepted</div>
           </div>
        </div>
        
        {/* 日志反馈区域 */}
        {log && (
          <div className="mb-6 text-center text-yellow-500 text-sm border-t border-b border-zinc-800 py-2">
            &gt; {log}
          </div>
        )}

        {/* 操作按钮区 */}
        <div className="space-y-3">
          <button 
            onClick={handleServe}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white transition-all flex justify-between px-6 items-center group"
          >
             <span className="font-bold">{t('jail.serve')}</span>
             <span className="text-xs text-zinc-500 group-hover:text-zinc-300">
               {/* 动态显示的提示文案 */}
               {isVipTreatment ? 'VIP Routine (No Penalty)' : 'High HP/Insight Cost'}
             </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                const res = payCashBail();
                setLog(res.msg);
              }}
              className="py-3 bg-green-900/20 hover:bg-green-900/40 border border-green-800 text-green-500 font-bold transition-all"
            >
              {t('jail.bail').toUpperCase()} (-${prison.bailAmount})
            </button>

            <button 
              onClick={() => {
                const res = signBailBond();
                setLog(res.msg);
              }}
              className="py-3 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-800 text-purple-400 font-bold transition-all flex flex-col items-center justify-center leading-none"
            >
              <span>{t('jail.bail').toUpperCase()} BOND</span>
              {/* 这里显示的百分比也可以做成动态的，目前使用 rate * 100 即可 */}
              <span className="text-[10px] mt-1 opacity-70">
                PAY ${bailDownPayment} ({(bondRate * 100).toFixed(0)}%) + DEBT
              </span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default JailOverlay;