import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import { VehicleShopUIText } from '../config/vehicleShopConfig';
import { RegionID } from '@/types/schema';
import { Clock, Ticket, CheckCircle } from 'lucide-react';

interface DMVQueueSectionProps {
  uiText: VehicleShopUIText;
}

export const DMVQueueSection: React.FC<DMVQueueSectionProps> = ({
  uiText
}) => {
  const { t } = useI18n();
  const { 
    dmvQueue, 
    startDMVQueue, 
    cancelDMVQueue, 
    inventory
  } = useGameStore();
  
  const [isStarting, setIsStarting] = useState(false);
  
  // 检查是否已有驾照
  const hasValidLicense = inventory.includes('LICENSE_VALID') || inventory.includes('LICENSE_ELITE');
  const currentRegion = RegionID.RustBelt; // DMV只在铁锈区
  
  // 开始排队
  const handleStartQueue = () => {
    setIsStarting(true);
    const result = startDMVQueue(currentRegion, 'VALID');
    if (!result.success) {
      setIsStarting(false);
    }
  };
  
  // 取消排队
  const handleCancelQueue = () => {
    cancelDMVQueue();
    setIsStarting(false);
  };
  
  // 如果已经有驾照，显示完成状态
  if (hasValidLicense) {
    return (
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h4 className="text-white font-semibold mb-2">
          {t(uiText.dmvTitleKey || 'vehicleShop.rustbelt.dmvTitle')}
        </h4>
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle size={18} />
          <span className="text-sm">您已持有有效驾照</span>
        </div>
      </div>
    );
  }
  
  // 如果正在排队中
  if (dmvQueue) {
    const progress = ((dmvQueue.ticketNumber - dmvQueue.currentNumber) / dmvQueue.ticketNumber) * 100;
    const isComplete = dmvQueue.currentNumber >= dmvQueue.ticketNumber && dmvQueue.waitTurnsRemaining <= 0;
    
    return (
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h4 className="text-white font-semibold mb-2">
          {t(uiText.dmvTitleKey || 'vehicleShop.rustbelt.dmvTitle')}
        </h4>
        
        {/* 叫号显示 */}
        <div className="flex items-center justify-center gap-8 py-4 mb-4">
          <div className="text-center">
            <p className="text-white/50 text-xs mb-1">{t('vehicleShop.rustbelt.dmvNowServing')}</p>
            <div className="text-3xl font-mono font-bold text-white">
              #{dmvQueue.currentNumber}
            </div>
          </div>
          <div className="text-white/20">
            <Ticket size={24} />
          </div>
          <div className="text-center">
            <p className="text-white/50 text-xs mb-1">{t('vehicleShop.rustbelt.dmvYourNumber')}</p>
            <div className={`text-3xl font-mono font-bold ${
              isComplete ? 'text-green-400' : 'text-amber-400'
            }`}>
              #{dmvQueue.ticketNumber}
            </div>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-4">
          <div 
            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, 100 - progress)}%` }}
          />
        </div>
        
        {/* 状态信息 */}
        <div className="text-center mb-4">
          {isComplete ? (
            <p className="text-green-400 text-sm">
              轮到您了！请到窗口办理 (消耗1回合)
            </p>
          ) : (
            <p className="text-amber-400 text-sm">
              还需等待 {dmvQueue.waitTurnsRemaining} 回合
            </p>
          )}
        </div>
        
        {/* 取消按钮 */}
        <button
          onClick={handleCancelQueue}
          className="w-full py-2 px-4 rounded text-sm font-medium bg-white/10 hover:bg-white/20 text-white/70 transition-all"
        >
          取消排队
        </button>
        
        {/* 提示 */}
        <p className="text-white/30 text-xs mt-3 text-center italic">
          每回合自动前进，请耐心等待叫号
        </p>
      </div>
    );
  }
  
  // 初始状态 - 开始排队
  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5">
      <h4 className="text-white font-semibold mb-2">
        {t(uiText.dmvTitleKey || 'vehicleShop.rustbelt.dmvTitle')}
      </h4>
      
      {uiText.dmvSubtitleKey && (
        <p className="text-white/50 text-sm mb-3">
          {t(uiText.dmvSubtitleKey, { current: 127, ticket: 402 })}
        </p>
      )}
      
      {/* 说明 */}
      <div className="bg-white/5 rounded p-3 mb-4">
        <p className="text-white/60 text-xs mb-2">办理流程：</p>
        <ol className="text-white/50 text-xs space-y-1 list-decimal list-inside">
          <li>取号排队（消耗1回合）</li>
          <li>等待叫号（每回合自动前进）</li>
          <li>轮到后支付$50获得正式驾照</li>
        </ol>
      </div>
      
      {/* 开始排队按钮 */}
      <motion.button
        onClick={handleStartQueue}
        disabled={isStarting}
        className="w-full py-3 px-4 rounded text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white transition-all flex items-center justify-center gap-2"
        whileTap={{ scale: 0.98 }}
      >
        <Clock size={16} />
        {isStarting ? '取号中...' : '取号排队 (1回合)'}
      </motion.button>
      
      {/* 讽刺文本 */}
      <p className="text-white/30 text-xs mt-3 text-center italic">
        {t('vehicleShop.rustbelt.dmvNoAppointment')}
      </p>
    </div>
  );
};
