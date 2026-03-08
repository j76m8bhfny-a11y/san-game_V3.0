// src/components/game/Crypto/CryptoSidebar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MarketChart } from './MarketChart';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
// ✅ 1. 引入数值配置文件
import marketRules from '@/assets/data/rules/market_rules.json';

export const CryptoSidebar: React.FC = () => {
  const { t } = useI18n();
  const { 
    isCryptoOpen, 
    setCryptoOpen, 
    vitality,
    inventory,
    crypto, 
    openCryptoAccount, 
    openPosition, 
    closePosition,
    canTradeThisTurn,
    maybeTriggerCryptoNews  // 🔴 新增：新闻触发函数
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // ✅ 2. 映射金钱路径
  const gold = vitality.metrics.gold;

  // ✅ 3. 提取配置项 (Single Source of Truth)
  const FEE = marketRules.crypto.accountFee;
  const NETWORK_FEE = marketRules.trading.networkFee;
  const LEVERAGE_PRESETS = marketRules.trading.leverage.presets;
  const DANGER_THRESHOLD = marketRules.trading.leverage.dangerThreshold;
  const QUICK_AMOUNTS = marketRules.trading.quickAmounts;

  // 本地交易状态，使用配置初始化
  const [leverage, setLeverage] = useState(marketRules.trading.leverage.default);
  const [amount, setAmount] = useState(marketRules.trading.defaultAmount);
  const [gasFee, setGasFee] = useState(marketRules.ui.marquee.gasFeeBase);
  
  // 🔴 Gas费动态波动动画
  useEffect(() => {
    if (!crypto.isAccountOpen) return;
    const interval = setInterval(() => {
      const variance = marketRules.ui.marquee.gasFeeVariance;
      const newFee = marketRules.ui.marquee.gasFeeBase + 
        Math.floor(Math.random() * variance * 2) - variance;
      setGasFee(newFee);
    }, 3000);
    return () => clearInterval(interval);
  }, [crypto.isAccountOpen]);

  // 🔴 调整点3: 打开面板时触发新闻弹窗（30%概率）
  useEffect(() => {
    if (isCryptoOpen && crypto.isAccountOpen) {
      // 延迟一点弹出，让用户先看到面板
      const timer = setTimeout(() => {
        maybeTriggerCryptoNews();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isCryptoOpen, crypto.isAccountOpen, maybeTriggerCryptoNews]);

  // 🔴 检查是否有驾照 (KYC)
  const hasLicense = inventory.some((id: string) => 
    marketRules.crypto.kyc.acceptedLicenses.includes(id)
  );

  // 🔴 检查能否交易
  const canTrade = canTradeThisTurn ? canTradeThisTurn() : true;

  // 🔴 计算购买力 (扣除网络费预留)
  const buyingPower = Math.max(0, gold - NETWORK_FEE);
  const isLowFunds = buyingPower < 100;

  const handleOpenAccount = () => {
    if (!hasLicense) {
      playSfx('sfx_deny');
      return;
    }
    if (gold < FEE) {
      playSfx('sfx_deny');
      return;
    }
    playSfx('sfx_cash');
    openCryptoAccount();
  };

  const handleTrade = (type: 'LONG' | 'SHORT') => {
    if (!canTrade) {
      playSfx('sfx_deny');
      return;
    }
    if (amount <= 0 || amount > buyingPower) {
      playSfx('sfx_deny');
      return;
    }
    playSfx('sfx_click');
    openPosition(type, amount, leverage);
  };

  // 🔴 梭哈按钮处理
  const handleAllIn = useCallback((ratio: number) => {
    // 🔴 使用预留的梭哈音效（音频文件待制作）
    // 如果没有音频文件，控制台会报 404，但不会影响功能
    playSfx('sfx_all_in');
    setAmount(Math.floor(buyingPower * ratio));
  }, [buyingPower, playSfx]);

  const panelClass = `
    fixed top-0 left-0 bottom-0 z-50 w-80 bg-[#0a0a0a] border-r border-gray-800 
    transform transition-transform duration-300 ease-out flex flex-col font-mono
    ${isCryptoOpen ? 'translate-x-0 shadow-[10px_0_50px_rgba(0,0,0,0.8)]' : '-translate-x-full'}
  `;

  return (
    <div className={panelClass} onClick={e => e.stopPropagation()}>
      
      {/* 🔴 调整点5: Header - 闪烁绿点 + NET: UNSTABLE + Marquee */}
      <div className="p-3 border-b border-gray-800 bg-[#0d0d0d]">
        <div className="flex justify-between items-center">
          {/* 左侧：闪烁绿点 + 网络状态 */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-sm h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] text-red-500 font-mono tracking-wider animate-pulse">
              {marketRules.ui.header.networkStatus}
            </span>
          </div>
          
          {/* 右侧：[ X ] 关闭按钮 */}
          <button 
            onClick={() => setCryptoOpen(false)} 
            className="text-gray-500 hover:text-white font-mono text-xs transition-colors"
          >
            [ X ]
          </button>
        </div>
        
        {/* Marquee: Gas Fee 滚动 */}
        <div className="mt-2 overflow-hidden relative">
          <div className="whitespace-nowrap text-[9px] text-gray-600 font-mono animate-marquee">
            GAS FEE: ${gasFee} | BLOCK #{Math.floor(Date.now()/1000)%1000000} | 
            MEMPOOL CONGESTED | USE FLASHBOTS | SLIPPAGE 12% | 
            GAS FEE: ${gasFee} | BLOCK #{Math.floor(Date.now()/1000)%1000000} | 
            MEMPOOL CONGESTED | USE FLASHBOTS | SLIPPAGE 12%
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {!crypto.isAccountOpen ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-80">
            <div className="text-4xl">🔒</div>
            <p className="text-sm text-red-500 font-mono">{t('crypto.accessRestricted')}</p>
            <p className="text-xs text-gray-500 px-4">
              {hasLicense 
                ? "KYC验证通过。支付网络接入费以继续。" 
                : "需要有效驾照进行KYC验证。"}
            </p>
            
            {/* 🔴 调整点1: KYC验证状态 */}
            <button 
              onClick={handleOpenAccount}
              disabled={!hasLicense || gold < FEE}
              className={`
                px-6 py-2 font-bold text-xs tracking-widest border transition-colors font-mono
                ${hasLicense && gold >= FEE
                  ? 'bg-green-900/30 text-green-500 border-green-700 hover:bg-green-800/40 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                  : 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'}
              `}
            >
              {hasLicense ? `CONNECT ($${FEE})` : 'KYC LOCKED'}
            </button>
            
            {!hasLicense && (
              <p className="text-[10px] text-red-600 font-mono">
                ⚠️ 需要驾照：假驾照/正式驾照/豁免驾照
              </p>
            )}
          </div>
        ) : (
          <>
            <MarketChart />

            {/* 🔴 调整点7A: BUYING POWER 显示 */}
            <div className="border border-gray-800 bg-black/40 p-3 rounded">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 font-mono tracking-wider">
                  {t('crypto.buyingPower')}
                </span>
                <span className={`text-lg font-mono font-bold ${isLowFunds ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                  ${buyingPower.toLocaleString()}
                </span>
              </div>
              {isLowFunds && (
                <div className="text-[10px] text-red-500 font-mono mt-1 animate-pulse font-bold">
                  ⚠️ {t('crypto.lowFunds')}
                </div>
              )}
              <div className="flex justify-between text-[9px] text-gray-600 font-mono mt-2 pt-2 border-t border-gray-800/50">
                <span>NET FEE: ${NETWORK_FEE}</span>
                <span>GAS: ${gasFee}</span>
              </div>
            </div>

            {/* 🔴 调整点6: 本周交易次数警告 */}
            {!canTrade && (
              <div className="bg-red-900/20 border border-red-800 p-3 text-center rounded">
                <span className="text-[10px] text-red-400 font-mono font-bold">
                  ⛔ {t('crypto.tradeLimit.weekly')} - {t('crypto.tradeLimit.wait')}
                </span>
              </div>
            )}

            {/* 🔴 调整点7B: 杠杆档位按钮 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-500 font-mono">{t('crypto.leverage.label')}</span>
                <span className="text-xs text-amber-500 font-mono font-bold">{leverage}x</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {LEVERAGE_PRESETS.map((lev) => {
                  const isDanger = lev >= DANGER_THRESHOLD;
                  const isSelected = leverage === lev;
                  
                  return (
                    <button
                      key={lev}
                      onClick={() => setLeverage(lev)}
                      disabled={!canTrade}
                      className={`
                        py-2 text-xs font-bold font-mono border transition-all duration-200
                        ${isSelected 
                          ? isDanger
                            ? 'bg-red-900/50 text-red-400 border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] scale-105'
                            : 'bg-amber-900/30 text-amber-400 border-amber-600'
                          : 'bg-gray-900 text-gray-600 border-gray-800 hover:border-gray-600 hover:text-gray-400'}
                        ${!canTrade && 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      {lev}x
                    </button>
                  );
                })}
              </div>
              
              {/* 骷髅头警告 */}
              {leverage >= DANGER_THRESHOLD && (
                <div className="flex items-center gap-2 text-red-500 animate-pulse mt-2">
                  <span className="text-lg">{marketRules.ui.leverage.dangerIcon}</span>
                  <span className="text-[10px] font-mono font-bold">
                    {marketRules.ui.leverage.dangerLabel}
                  </span>
                </div>
              )}
            </div>

            {/* 🔴 调整点7C: 金额输入 + 梭哈按钮 */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>{t('crypto.amount.label')}</span>
                <span>{t('crypto.amount.max')}: ${buyingPower}</span>
              </div>
              
              <div className="flex items-center border border-gray-700 bg-black rounded">
                <span className="pl-3 text-gray-500 font-mono">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  disabled={!canTrade}
                  className="w-full bg-transparent text-white p-2 text-sm focus:outline-none font-mono disabled:opacity-50"
                  placeholder="0"
                />
              </div>
              
              {/* 快速金额按钮 */}
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((ratio, idx) => {
                  const labels = [t('crypto.amount.quick25'), t('crypto.amount.quick50'), t('crypto.amount.allIn')];
                  const isAllIn = ratio === 1.0;
                  
                  return (
                    <button
                      key={ratio}
                      onClick={() => handleAllIn(ratio)}
                      disabled={!canTrade || buyingPower <= 0}
                      className={`
                        py-2 text-[10px] font-mono border transition-all duration-200
                        ${isAllIn 
                          ? 'bg-red-950/50 text-red-400 border-red-800 hover:bg-red-900/50 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:border-red-600' 
                          : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600 hover:text-gray-300'}
                        ${(!canTrade || buyingPower <= 0) && 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      {isAllIn ? (
                        <span className="flex flex-col items-center leading-tight">
                          <span className="font-bold tracking-widest">{t('crypto.amount.allIn')}</span>
                          <span className="text-[8px] text-red-600">{t('crypto.amount.allInFlavor')}</span>
                        </span>
                      ) : labels[idx]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 🔴 调整点7D: PUMP IT / DUMP IT 按钮 */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => handleTrade('LONG')}
                disabled={!canTrade || amount <= 0 || amount > buyingPower}
                className="py-4 bg-green-950/30 border border-green-800 hover:bg-green-900/40 
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all group
                         active:scale-95"
              >
                <div className="text-green-500 font-bold text-sm tracking-wider group-hover:scale-105 transition-transform">
                  {t('crypto.position.pumpIt')}
                </div>
                <div className="text-[10px] text-green-700 font-mono mt-1">
                  {t('crypto.position.longSub')}
                </div>
              </button>
              
              <button 
                onClick={() => handleTrade('SHORT')}
                disabled={!canTrade || amount <= 0 || amount > buyingPower}
                className="py-4 bg-red-950/30 border border-red-800 hover:bg-red-900/40 
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all group
                         active:scale-95"
              >
                <div className="text-red-500 font-bold text-sm tracking-wider group-hover:scale-105 transition-transform">
                  {t('crypto.position.dumpIt')}
                </div>
                <div className="text-[10px] text-red-700 font-mono mt-1">
                  {t('crypto.position.shortSub')}
                </div>
              </button>
            </div>

            {/* Positions List */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase font-mono tracking-wider">
                Open Positions
              </h3>
              <div className="space-y-2">
                {crypto.positions.length === 0 ? (
                  <div className="text-xs text-gray-600 text-center py-4 font-mono">
                    NO ACTIVE POSITIONS
                  </div>
                ) : (
                  crypto.positions.map(pos => {
                    const priceRatio = crypto.btcPrice / pos.entryPrice;
                    const roi = (pos.type === 'LONG' ? (priceRatio - 1) : (1 - priceRatio)) * pos.leverage;
                    const pnl = Math.floor(pos.principal * roi);
                    const isProfitable = pnl >= 0;

                    return (
                      <div key={pos.id} className="bg-[#111] p-2 border-l-2 border-gray-700 text-xs relative group">
                        <div className="flex justify-between mb-1">
                          <span className={`font-bold font-mono ${pos.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                            {pos.type} {pos.leverage}x
                          </span>
                          <span className={isProfitable ? 'text-green-400' : 'text-red-400'}>
                            {isProfitable ? '+' : ''}{pnl} ({Math.round(roi * 100)}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-500 font-mono text-[10px]">
                          <span>${pos.principal}</span>
                          <span>@ ${pos.entryPrice}</span>
                        </div>
                        
                        <div className="absolute inset-0 bg-black/80 hidden group-hover:flex items-center justify-center backdrop-solid-dark">
                          <button 
                            onClick={() => { playSfx('sfx_cash'); closePosition(pos.id); }}
                            className="px-4 py-1 border border-white/20 text-white hover:bg-white/10 text-xs font-mono transition-colors"
                          >
                            {t('crypto.position.close')}
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
