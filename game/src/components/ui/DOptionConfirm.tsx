/**
 * DOptionConfirm - D选项轻量级确认系统
 * 
 * 高风险D选项采用"点击 → 预览 → 确认"两步确认流程
 * 增加"重量感"但不增加操作负担
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';

interface OptionImpact {
  hp?: number;
  san?: number;
  gold?: number;
  hunger?: number;
  insight?: number;
  unlocksArchive?: boolean;
  archiveName?: string;
}

interface DOptionConfirmProps {
  isOpen: boolean;
  impact: OptionImpact;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 判断是否为高风险选项（需要确认）
 */
export const isHighRiskOption = (impact: OptionImpact): boolean => {
  const hpCost = impact.hp || 0;
  const sanCost = impact.san || 0;
  return hpCost < -10 || sanCost < -10;
};

/**
 * 获取代价等级（用于视觉区分）
 */
const getRiskLevel = (impact: OptionImpact): 'low' | 'medium' | 'high' | 'extreme' => {
  const hpCost = Math.abs(impact.hp || 0);
  const sanCost = Math.abs(impact.san || 0);
  const maxCost = Math.max(hpCost, sanCost);
  
  if (maxCost <= 5) return 'low';
  if (maxCost <= 10) return 'medium';
  if (maxCost <= 18) return 'high';
  return 'extreme';
};

/**
 * 风险等级配置
 */
const RISK_CONFIG = {
  low: {
    borderColor: 'border-yellow-600',
    bgColor: 'bg-yellow-950/90',
    accentColor: 'text-yellow-500',
    icon: '⚠️',
    title: '谨慎选择',
  },
  medium: {
    borderColor: 'border-orange-600',
    bgColor: 'bg-orange-950/90',
    accentColor: 'text-orange-500',
    icon: '⚠️',
    title: '付出代价',
  },
  high: {
    borderColor: 'border-red-600',
    bgColor: 'bg-red-950/90',
    accentColor: 'text-red-500',
    icon: '☠️',
    title: '真相的代价',
  },
  extreme: {
    borderColor: 'border-red-800',
    bgColor: 'bg-red-950/95',
    accentColor: 'text-red-400',
    icon: '💀',
    title: '命运的抉择',
  },
};

/**
 * 影响项组件
 */
const ImpactItem: React.FC<{
  icon: string;
  label: string;
  value: number;
  isPositive?: boolean;
  colorClass: string;
}> = ({ icon, label, value, isPositive, colorClass }) => (
  <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded">
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <span className="text-gray-300 text-sm">{label}</span>
    </div>
    <span className={`font-bold font-mono ${isPositive ? 'text-green-400' : colorClass}`}>
      {value > 0 ? '+' : ''}{value}
    </span>
  </div>
);

/**
 * D选项确认弹窗
 */
export const DOptionConfirm: React.FC<DOptionConfirmProps> = ({
  isOpen,
  impact,
  onConfirm,
  onCancel,
}) => {
  const { playSfx } = useAudioStore();
  const { unlockedArchives } = useGameStore();
  const [isShaking, setIsShaking] = useState(false);
  
  const riskLevel = getRiskLevel(impact);
  const config = RISK_CONFIG[riskLevel];
  
  // 确认时的震动效果
  const handleConfirm = () => {
    setIsShaking(true);
    playSfx('sfx_click');
    
    // 触发设备震动（如果支持）
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(riskLevel === 'extreme' ? [100, 50, 100] : 100);
    }
    
    setTimeout(() => {
      setIsShaking(false);
      onConfirm();
    }, 300);
  };
  
  // ESC键取消
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center backdrop-solid-dark"
        onClick={onCancel}
      >
        <motion.div
          initial={false}
          animate={{ 
            scale: isShaking ? [1, 1.02, 0.98, 1] : 1, 
            opacity: 1, 
            y: 0 
          }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{
            scale: isShaking ? { duration: 0.1, repeat: 2 } : { duration: 0.2 },
          }}
          className={`relative w-full max-w-md mx-4 ${config.bgColor} border-2 ${config.borderColor} rounded-sm overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 顶部警告条 */}
          <div className={`h-1.5 w-full ${config.accentColor.replace('text', 'bg')}`} />
          
          {/* 标题区 */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <motion.span 
                className="text-3xl"
                animate={riskLevel === 'extreme' ? {
                  scale: [1, 1.2, 1],
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {config.icon}
              </motion.span>
              <h2 className={`text-xl font-bold ${config.accentColor}`}>
                {config.title}
              </h2>
            </div>
            <p className="text-gray-400 text-sm">
              这个选择将带来不可逆转的后果
            </p>
          </div>
          
          {/* 代价预览 */}
          <div className="px-6 py-4 bg-black/20 space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              预计影响
            </div>
            
            {impact.hp !== undefined && impact.hp !== 0 && (
              <ImpactItem
                icon="❤️"
                label="生命值"
                value={impact.hp}
                colorClass="text-red-400"
              />
            )}
            
            {impact.san !== undefined && impact.san !== 0 && (
              <ImpactItem
                icon="🧠"
                label="理智"
                value={impact.san}
                colorClass="text-purple-400"
              />
            )}
            
            {impact.gold !== undefined && impact.gold !== 0 && (
              <ImpactItem
                icon="💰"
                label="金钱"
                value={impact.gold}
                isPositive={impact.gold > 0}
                colorClass="text-yellow-400"
              />
            )}
            
            {impact.hunger !== undefined && impact.hunger !== 0 && (
              <ImpactItem
                icon="🍖"
                label="饥饿"
                value={impact.hunger}
                isPositive={impact.hunger < 0}
                colorClass="text-orange-400"
              />
            )}
            
            {impact.insight !== undefined && impact.insight !== 0 && (
              <ImpactItem
                icon="👁️"
                label="灵视"
                value={impact.insight}
                isPositive={impact.insight > 0}
                colorClass="text-cyan-400"
              />
            )}
          </div>
          
          {/* 档案解锁提示 */}
          {impact.unlocksArchive && (
            <div className="px-6 py-3 border-t border-white/10">
              <div className="flex items-start gap-3 p-3 bg-cyan-950/50 border border-cyan-800/50 rounded">
                <span className="text-xl">📜</span>
                <div>
                  <div className="text-cyan-400 font-bold text-sm">
                    将解锁档案
                  </div>
                  <div className="text-cyan-300/70 text-xs mt-0.5">
                    {impact.archiveName || '未知的记忆碎片'}
                  </div>
                  <div className="text-cyan-500/50 text-[10px] mt-1">
                    已收集 {unlockedArchives?.length || 0} 份档案
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 按钮区 */}
          <div className="p-6 pt-4 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-medium transition-colors"
            >
              再想想
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 ${config.accentColor.replace('text', 'bg')} hover:opacity-90 text-white rounded font-bold transition-all`}
            >
              接受代价
            </button>
          </div>
          
          {/* 底部提示 */}
          <div className="px-6 pb-4 text-center">
            <span className="text-xs text-gray-600">
              按 ESC 取消
            </span>
          </div>
          
          {/* 危险等级装饰 */}
          {riskLevel === 'extreme' && (
            <motion.div
              className="absolute inset-0 border-2 border-red-500/30 rounded-sm pointer-events-none"
              animate={{
                boxShadow: [
                  'inset 0 0 20px rgba(239, 68, 68, 0.1)',
                  'inset 0 0 40px rgba(239, 68, 68, 0.2)',
                  'inset 0 0 20px rgba(239, 68, 68, 0.1)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DOptionConfirm;
