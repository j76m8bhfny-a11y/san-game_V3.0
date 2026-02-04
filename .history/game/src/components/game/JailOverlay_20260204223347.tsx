import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
// ✅ 修复：移除未使用的 AnimatePresence (警告 6133)
import { motion } from 'framer-motion';
import bankRules from '@/assets/data/rules/bankRules.json';

const JailOverlay: React.FC = () => {
  // ✅ 修复：从正确路径解构 identity.currentClass (警告 2339)
  // 移除未使用的 gold (警告 6133)
  const { prison, vitality, serveTime, payCashBail, signBailBond } = useGameStore();
  const [log, setLog] = useState<string>("");

  if (!prison.inJail) return null;

  const currentClass = vitality.identity.currentClass;
  const bondRate = bankRules.collection.jail.bailBondRate;
  const bailDownPayment = Math.floor(prison.bailAmount * bondRate);

  const handleServe = () => {
    const res = serveTime();
    setLog(res.msg);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center font-mono">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_95%,#000_95%)] bg-[length:40px_100%] opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(50,50,50,0.5)_20%,transparent_20%)] bg-[length:10px_100%] opacity-20 pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-zinc-900 border-2 border-zinc-700 p-8 max-w-2xl w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-red-600 tracking-widest mb-2">DETAINED</h1>
          <p className="text-zinc-500">INMATE: {currentClass.toUpperCase()}</p>
          <div className="mt-4 p-4 bg-black/50 border border-zinc-800 text-zinc-300">
             CRIME: {prison.crime}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
           {/* 刑期状态 */}
           <div className="bg-zinc-800/50 p-4 border border-zinc-700">
              <div className="text-xs text-zinc-500 uppercase">Sentence</div>
              <div className="text-2xl font-bold text-white">
                {/* ✅ 修复：daysServed -> turnsServed, sentenceDays -> sentenceTurns (警告 2339) */}
                {prison.turnsServed} / {prison.sentenceTurns} <span className="text-sm font-normal text-zinc-500">Turns</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 mt-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600" 
                  style={{ width: `${(prison.turnsServed / prison.sentenceTurns) * 100}%` }} 
                />
              </div>
           </div>

           {/* 保释金 */}
           <div className="bg-zinc-800/50 p-4 border border-zinc-700">
              <div className="text-xs text-zinc-500 uppercase">Bail Amount</div>
              <div className="text-2xl font-bold text-green-500">${prison.bailAmount}</div>
              <div className="text-xs text-zinc-600 mt-1">Cash or Bond accepted</div>
           </div>
        </div>
        
        {log && (
          <div className="mb-6 text-center text-yellow-500 text-sm border-t border-b border-zinc-800 py-2">
            &gt; {log}
          </div>
        )}

        <div className="space-y-3">
          <button 
            onClick={handleServe}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white transition-all flex justify-between px-6 items-center group"
          >
             {/* ✅ 统一单位为 TURN */}
             <span className="font-bold">SERVE TIME (1 TURN)</span>
             <span className="text-xs text-zinc-500 group-hover:text-zinc-300">
               {currentClass === 'CAPITALIST' ? 'No Penalty' : 'High HP/SAN Cost'}
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
              CASH BAIL (-${prison.bailAmount})
            </button>

            <button 
              onClick={() => {
                const res = signBailBond();
                setLog(res.msg);
              }}
              className="py-3 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-800 text-purple-400 font-bold transition-all flex flex-col items-center justify-center leading-none"
            >
              <span>BAIL BOND</span>
              <span className="text-[10px] mt-1 opacity-70">PAY ${bailDownPayment} + DEBT</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default JailOverlay;