import React, { useState } from 'react';
import { Housing } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  house: Housing;
  gold: number;
  onBuy: () => void;
  onClose: () => void;
}

export const DowntownExterior: React.FC<Props> = ({ house, gold, onBuy, onClose }) => {
  const { t } = useI18n();
  const [isScanning, setIsScanning] = useState(false);

  // 核心区只支持购买
  const downPayment = Math.ceil(house.buyConfig!.price * house.buyConfig!.downPaymentRate);
  const canAfford = gold >= downPayment;

  const handleInteract = () => {
    if (!canAfford) return;
    setIsScanning(true);
    setTimeout(() => {
      onBuy();
      setIsScanning(false); // 如果失败会重置，成功则组件卸载
    }, 1500);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 overflow-hidden select-none font-pixel">
      
      {/* 1. 场景：私人电梯大堂 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/housing/downtown_exterior_bg.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* 2. 装饰：品牌Logo */}
      <div className="relative z-10 text-center mt-10 opacity-80">
        <h1 className="text-4xl font-pixel text-[#d4af37] tracking-[0.5em] uppercase">
          The Pinnacle
        </h1>
        <div className="w-16 h-0.5 bg-[#d4af37] mx-auto mt-4" />
        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">
          Residences above the clouds
        </p>
      </div>

      {/* 3. 交互区：生物识别面板 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full mb-10">
        
        <div className="relative w-80 backdrop-solid-dark border border-[#333] shadow-pixel p-8 flex flex-col items-center">
          {/* 面板顶部的摄像头/扫描仪 */}
          <div className="w-full h-1 bg-blue-500/50 opacity-50 mb-8" />
          
          <div className="text-gray-400 text-xs font-mono uppercase mb-4 tracking-widest">
            Identity Verification
          </div>

          {/* 指纹/手掌扫描区 (按钮) */}
          <button
            onClick={handleInteract}
            disabled={!canAfford || isScanning}
            className={`
              relative w-32 h-32 rounded-sm border-2 flex items-center justify-center transition-all duration-500
              ${isScanning 
                ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)]' 
                : canAfford 
                  ? 'border-[#d4af37] hover:bg-[#d4af37]/10 cursor-pointer' 
                  : 'border-red-900 opacity-50 cursor-not-allowed'}
            `}
          >
            {isScanning ? (
              <div className="absolute inset-0 border-t-2 border-blue-400 rounded-sm animate-spin" />
            ) : (
              <img 
                src="/assets/housing/ui_fingerprint.png" 
                className={`w-16 h-16 transition-opacity ${canAfford ? 'opacity-80' : 'opacity-20'}`} 
              />
            )}
          </button>

          {/* 状态显示 */}
          <div className="mt-8 text-center min-h-[4rem]">
            {isScanning ? (
              <div className="text-blue-400 font-mono text-xs animate-pulse">
                &gt; ANALYZING ASSETS...<br/>
                &gt; VERIFYING NET WORTH...
              </div>
            ) : !canAfford ? (
              <div className="text-red-500 font-mono text-xs">
                ACCESS DENIED<br/>
                <span className="opacity-50">{t('housing.buy')}</span>
              </div>
            ) : (
              <div className="text-[#d4af37] font-mono text-xs">
                READY TO SCAN<br/>
                <span className="opacity-70">
                  {t('common.price')}: ${downPayment.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-12 text-gray-600 hover:text-white text-[10px] uppercase tracking-[0.2em] transition-colors"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};