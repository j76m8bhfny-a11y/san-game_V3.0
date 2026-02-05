/**
 * fileName: src/components/game/DebugPanel.tsx
 * 说明: 开发者专用调试面板，用于快速调整数值进行测试
 */
import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion } from 'framer-motion';

interface DebugPanelProps {
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  // 1. 从 Store 中提取我们需要的数据和方法
  const { 
    vitality, 
    modifyStats, 
    addTransaction, 
    nextTurn,
    triggerEnding 
  } = useGameStore((state: any) => ({
    vitality: state.vitality,
    modifyStats: state.modifyStats,
    addTransaction: state.addTransaction,
    nextTurn: state.nextTurn,
    triggerEnding: state.triggerEnding
  }));

  const { gold, hp, san, maxHp, maxSan } = vitality.metrics;

  // --- 预设的测试指令 (SOP Macros) ---

  // 测试用例：瞬间致富 (测试溢出和购买力)
  const handleCheatMoney = () => {
    modifyStats({ gold: gold + 100000 });
  };

  // 测试用例：瞬间破产 (测试贫穷逻辑)
  const handleBankrupt = () => {
    modifyStats({ gold: 0 });
  };

  // 测试用例：濒死状态 (测试死亡判定)
  const handleNearDeath = () => {
    modifyStats({ hp: 1, san: 1 });
  };

  // 测试用例：状态回满 (测试恢复逻辑)
  const handleFullHeal = () => {
    modifyStats({ hp: maxHp, san: maxSan });
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-slate-900 border-2 border-green-500 rounded-lg shadow-2xl overflow-hidden font-mono text-green-400"
      >
        {/* Header */}
        <div className="bg-green-500/10 px-6 py-4 border-b border-green-500/30 flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-widest flex items-center gap-2">
            <span className="text-2xl">⚡</span> GOD_MODE_CONSOLE
          </h2>
          <button onClick={onClose} className="hover:text-white transition-colors text-2xl">✕</button>
        </div>

        {/* Real-time Monitor */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-black/20 text-center text-sm">
          <div className="border border-green-500/20 p-2 rounded">
            <div className="text-gray-500">GOLD</div>
            <div className="text-xl font-bold text-yellow-400">${gold.toLocaleString()}</div>
          </div>
          <div className="border border-green-500/20 p-2 rounded">
            <div className="text-gray-500">HP</div>
            <div className="text-xl font-bold text-red-400">{hp} / {maxHp}</div>
          </div>
          <div className="border border-green-500/20 p-2 rounded">
            <div className="text-gray-500">SAN</div>
            <div className="text-xl font-bold text-blue-400">{san} / {maxSan}</div>
          </div>
          <div className="border border-green-500/20 p-2 rounded">
            <div className="text-gray-500">TURN</div>
            <div className="text-xl font-bold text-white">{vitality.time.currentTurn}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          
          {/* Section 1: Economy Testing */}
          <div>
            <h3 className="text-xs uppercase text-gray-500 mb-3 border-b border-gray-700 pb-1">Economy (银行/资金系统测试)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={handleCheatMoney} className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 py-2 px-4 rounded border border-yellow-500/30 transition-all">
                + $100k (暴富)
              </button>
              <button onClick={handleBankrupt} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 py-2 px-4 rounded border border-red-500/30 transition-all">
                SET $0 (破产)
              </button>
              <button onClick={() => modifyStats({ gold: gold + 1000 })} className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded transition-all">
                + $1,000
              </button>
              <button onClick={() => modifyStats({ gold: Math.max(0, gold - 1000) })} className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded transition-all">
                - $1,000
              </button>
            </div>
          </div>

          {/* Section 2: Survival Testing */}
          <div>
            <h3 className="text-xs uppercase text-gray-500 mb-3 border-b border-gray-700 pb-1">Survival (维生系统测试)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={handleFullHeal} className="bg-green-500/20 hover:bg-green-500/40 text-green-300 py-2 px-4 rounded border border-green-500/30 transition-all">
                FULL HEAL (满状态)
              </button>
              <button onClick={handleNearDeath} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 py-2 px-4 rounded border border-red-500/30 transition-all">
                NEAR DEATH (濒死)
              </button>
              <button onClick={() => modifyStats({ hp: Math.max(0, hp - 10) })} className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded transition-all">
                HP -10
              </button>
              <button onClick={() => modifyStats({ san: Math.max(0, san - 10) })} className="bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded transition-all">
                SAN -10
              </button>
            </div>
          </div>

          {/* Section 3: Game Flow */}
          <div>
            <h3 className="text-xs uppercase text-gray-500 mb-3 border-b border-gray-700 pb-1">Game Flow (流程测试)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => nextTurn()} className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 py-2 px-4 rounded border border-blue-500/30 transition-all">
                Force Next Turn (强制下一周)
              </button>
              <button onClick={() => triggerEnding('ENDING_DEBUG_WIN')} className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 py-2 px-4 rounded border border-purple-500/30 transition-all">
                Trigger Ending (强制结局)
              </button>
            </div>
          </div>

        </div>

        <div className="px-6 py-3 bg-black/40 text-xs text-gray-500 flex justify-between">
          <span>PIXEL_LIFE_DEBUG_TOOL_V1.0</span>
          <span>SYSTEM_STATUS: ACTIVE</span>
        </div>
      </motion.div>
    </div>
  );
};