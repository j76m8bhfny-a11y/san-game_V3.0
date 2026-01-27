import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MarketChart } from './MarketChart';
import { useAudioStore } from '@/store/useAudioStore';

export const CryptoSidebar: React.FC = () => {
  const { 
    isCryptoOpen, 
    setCryptoOpen, 
    gold, 
    crypto, 
    openCryptoAccount, 
    openPosition, 
    closePosition 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 本地交易状态
  const [leverage, setLeverage] = useState(10);
  const [amount, setAmount] = useState(100);

  // 如果未开启，只渲染一个透明层用于点击关闭 (在 App.tsx 中处理)
  // 这里我们只渲染 Sidebar 本身的内容
  
  const handleOpenAccount = () => {
    playSfx('sfx_cash');
    openCryptoAccount();
  };

  const handleTrade = (type: 'LONG' | 'SHORT') => {
    if (amount <= 0 || amount > gold) {
      playSfx('sfx_deny');
      return;
    }
    playSfx('sfx_click');
    openPosition(type, amount, leverage);
  };

  const panelClass = `
    fixed top-0 left-0 bottom-0 z-50 w-80 bg-[#0a0a0a] border-r border-gray-800 
    transform transition-transform duration-300 ease-out flex flex-col font-mono
    ${isCryptoOpen ? 'translate-x-0 shadow-[10px_0_50px_rgba(0,0,0,0.8)]' : '-translate-x-full'}
  `;

  return (
    <div className={panelClass} onClick={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-[#111] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">₿</span>
          <h2 className="font-bold text-gray-200">CRYPTO.NET</h2>
        </div>
        <button onClick={() => setCryptoOpen(false)} className="text-gray-500 hover:text-white">✕</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* 1. 账户状态检查 */}
        {!crypto.isAccountOpen ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-80">
            <div className="text-4xl">🔒</div>
            <p className="text-sm text-gray-400">ACCESS RESTRICTED</p>
            <p className="text-xs text-gray-500 px-4">你需要接入去中心化网络才能开始交易。</p>
            <button 
              onClick={handleOpenAccount}
              className="px-6 py-2 bg-green-700 text-white font-bold text-xs tracking-widest hover:bg-green-600 border border-green-500"
            >
              CONNECT ($300)
            </button>
          </div>
        ) : (
          <>
            {/* Chart */}
            <MarketChart />

            {/* Asset Info */}
            <div className="flex justify-between text-xs border-b border-gray-800 pb-2">
              <span className="text-gray-500">AVAILABLE</span>
              <span className={gold < 0 ? 'text-red-500' : 'text-green-400'}>${gold.toLocaleString()}</span>
            </div>

            {/* Trade Controls */}
            <div className="space-y-4 bg-gray-900/50 p-3 rounded border border-gray-800">
              {/* Leverage Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">LEVERAGE</span>
                  <span className="text-amber-500 font-bold">{leverage}x</span>
                </div>
                <input 
                  type="range" min="1" max="100" step="1" 
                  value={leverage} onChange={(e) => setLeverage(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">AMOUNT</span>
                  <span className="text-gray-400">MAX: {gold > 0 ? gold : 0}</span>
                </div>
                <div className="flex items-center border border-gray-700 bg-black rounded">
                  <span className="pl-2 text-gray-500">$</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-transparent text-white p-2 text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => handleTrade('LONG')}
                  className="py-3 bg-green-900/30 text-green-500 border border-green-800 hover:bg-green-800/40 font-bold text-xs"
                >
                  LONG (做多)
                </button>
                <button 
                  onClick={() => handleTrade('SHORT')}
                  className="py-3 bg-red-900/30 text-red-500 border border-red-800 hover:bg-red-800/40 font-bold text-xs"
                >
                  SHORT (做空)
                </button>
              </div>
            </div>

            {/* Positions List */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">Open Positions</h3>
              <div className="space-y-2">
                {crypto.positions.length === 0 ? (
                  <div className="text-xs text-gray-600 text-center py-4">NO ACTIVE POSITIONS</div>
                ) : (
                  crypto.positions.map(pos => {
                    const priceRatio = crypto.btcPrice / pos.entryPrice;
                    const roi = (pos.type === 'LONG' ? (priceRatio - 1) : (1 - priceRatio)) * pos.leverage;
                    const pnl = Math.floor(pos.principal * roi);
                    const isProfitable = pnl >= 0;

                    return (
                      <div key={pos.id} className="bg-[#111] p-2 border-l-2 border-gray-700 text-xs relative group">
                        <div className="flex justify-between mb-1">
                          <span className={`font-bold ${pos.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                            {pos.type} {pos.leverage}x
                          </span>
                          <span className={isProfitable ? 'text-green-400' : 'text-red-400'}>
                            {isProfitable ? '+' : ''}{pnl} ({Math.round(roi * 100)}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>${pos.principal}</span>
                          <span>@ ${pos.entryPrice}</span>
                        </div>
                        
                        {/* Close Button Overlay */}
                        <div className="absolute inset-0 bg-black/80 hidden group-hover:flex items-center justify-center backdrop-blur-sm">
                          <button 
                            onClick={() => { playSfx('sfx_cash'); closePosition(pos.id); }}
                            className="px-4 py-1 border border-white/20 text-white hover:bg-white/10 text-xs"
                          >
                            CLOSE POSITION
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};