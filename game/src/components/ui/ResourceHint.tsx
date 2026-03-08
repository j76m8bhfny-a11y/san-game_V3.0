/**
 * ResourceHint - 动态暗示系统
 * 
 * 当玩家悬停选项时，顶部资源图标产生量级化反应：
 * - 小代价：图标微微闪烁
 * - 大代价：图标剧烈抖动 + 粒子特效
 * 
 * 不显示具体数字，只传递"感觉"
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// 影响类型
export interface OptionImpact {
  hp?: number;      // 负值=伤害
  san?: number;
  gold?: number;
  hunger?: number;
  insight?: number;
}

// 量级等级（不使用具体数字）
type ImpactLevel = 'none' | 'small' | 'medium' | 'large' | 'critical';

interface ResourceHintProps {
  // 当前悬停的影响
  hoveredImpact: OptionImpact | null;
  // 当前资源值（用于计算影响程度）
  currentValues: {
    hp: number;
    maxHp: number;
    san: number;
    maxSan: number;
    gold: number;
  };
}

/**
 * 计算影响量级
 * 基于相对值而非绝对值
 */
const getImpactLevel = (
  impactValue: number | undefined,
  _currentValue: number,
  maxValue: number,
  isReversed: boolean = false
): ImpactLevel => {
  if (!impactValue || impactValue === 0) return 'none';
  
  // 计算相对影响（占最大值的百分比）
  const relativeImpact = Math.abs(impactValue) / maxValue;
  
  // 如果是反向属性（如饥饿），调整判断
  const effectiveImpact = isReversed ? -relativeImpact : relativeImpact;
  
  if (effectiveImpact <= 0.05) return 'small';
  if (effectiveImpact <= 0.12) return 'medium';
  if (effectiveImpact <= 0.20) return 'large';
  return 'critical';
};

/**
 * 图标动画配置
 */
const ICON_ANIMATIONS: Record<ImpactLevel, {
  scale?: number[];
  rotate?: number[];
  opacity?: number[];
  x?: number[];
  transition: { duration: number; repeat: number };
}> = {
  none: {
    scale: [1, 1],
    transition: { duration: 0.1, repeat: 0 },
  },
  small: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 0.8, repeat: Infinity },
  },
  medium: {
    scale: [1, 1.15, 0.95, 1],
    rotate: [-2, 2, -2],
    transition: { duration: 0.5, repeat: Infinity },
  },
  large: {
    scale: [1, 1.2, 0.9, 1.1, 1],
    rotate: [-5, 5, -5, 5, 0],
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4, repeat: Infinity },
  },
  critical: {
    scale: [1, 1.25, 0.85, 1.15, 0.95, 1],
    rotate: [-8, 8, -8, 8, -4, 0],
    x: [-3, 3, -3, 3, -2, 0],
    transition: { duration: 0.3, repeat: Infinity },
  },
};

/**
 * 颜色配置
 */
const IMPACT_COLORS: Record<ImpactLevel, { bg: string; border: string; glow: string }> = {
  none: { bg: 'bg-transparent', border: 'border-transparent', glow: '' },
  small: { 
    bg: 'bg-yellow-500/10', 
    border: 'border-yellow-500/30',
    glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
  },
  medium: { 
    bg: 'bg-orange-500/15', 
    border: 'border-orange-500/40',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]',
  },
  large: { 
    bg: 'bg-red-500/20', 
    border: 'border-red-500/50',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]',
  },
  critical: { 
    bg: 'bg-red-600/30', 
    border: 'border-red-600/70',
    glow: 'shadow-[0_0_30px_rgba(220,38,38,0.6)]',
  },
};

/**
 * 单个资源图标组件
 */
const ResourceIcon: React.FC<{
  icon: string;
  label: string;
  level: ImpactLevel;
  value: number;
  maxValue: number;
  isCost: boolean; // 是否为消耗
}> = ({ icon, label, level, value, maxValue, isCost }) => {
  const animation = ICON_ANIMATIONS[level];
  const colors = IMPACT_COLORS[level];
  const percent = Math.round((value / maxValue) * 100);
  
  // 只有当有实际影响时才显示
  const isActive = level !== 'none';
  
  return (
    <motion.div
      className={`relative flex items-center gap-2 px-3 py-2 rounded-sm border ${colors.border} ${colors.bg} ${colors.glow} transition-all duration-300`}
      animate={isActive ? {
        scale: animation.scale,
        rotate: animation.rotate,
        x: animation.x,
        opacity: animation.opacity,
      } : {}}
      transition={animation.transition}
    >
      {/* 图标 */}
      <span className={`text-xl ${isCost && isActive ? 'grayscale-[0.3]' : ''}`}>
        {icon}
      </span>
      
      {/* 数值条（简洁版） */}
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 uppercase">{label}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-gray-800 rounded-sm overflow-hidden">
            <motion.div
              className={`h-full rounded-sm ${
                percent < 25 ? 'bg-red-500' : 
                percent < 50 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className={`text-xs font-mono ${
            percent < 25 ? 'text-red-400' : 
            percent < 50 ? 'text-yellow-400' : 
            'text-gray-300'
          }`}>
            {percent}%
          </span>
        </div>
      </div>
      
      {/* 粒子特效（仅critical等级） */}
      {level === 'critical' && isCost && (
        <motion.div
          className="absolute -right-1 -top-1"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.8],
            y: [0, -10, -5],
          }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <span className="text-red-500">✦</span>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * 资源暗示条 - 放在屏幕顶部
 */
export const ResourceHintBar: React.FC<ResourceHintProps> = ({
  hoveredImpact,
  currentValues,
}) => {
  // 计算各个资源的影响等级
  const levels = useMemo(() => ({
    hp: getImpactLevel(hoveredImpact?.hp, currentValues.hp, currentValues.maxHp),
    san: getImpactLevel(hoveredImpact?.san, currentValues.san, currentValues.maxSan),
    gold: hoveredImpact?.gold && hoveredImpact.gold < 0 
      ? getImpactLevel(Math.abs(hoveredImpact.gold), currentValues.gold, Math.max(currentValues.gold * 2, 1000))
      : 'none',
    hunger: hoveredImpact?.hunger && hoveredImpact.hunger > 0
      ? getImpactLevel(hoveredImpact.hunger, 0, 100)
      : 'none',
  }), [hoveredImpact, currentValues]);
  
  const hasAnyHint = Object.values(levels).some(l => l !== 'none');
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none"
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: hasAnyHint ? 0 : -100, 
        opacity: hasAnyHint ? 1 : 0 
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 px-4 py-3 backdrop-solid-dark rounded-sm border border-white/10">
        {/* HP */}
        {(levels.hp !== 'none' || !hasAnyHint) && (
          <ResourceIcon
            icon="❤️"
            label="生命"
            level={levels.hp}
            value={currentValues.hp}
            maxValue={currentValues.maxHp}
            isCost={!!hoveredImpact?.hp && hoveredImpact.hp < 0}
          />
        )}
        
        {/* SAN */}
        {(levels.san !== 'none' || !hasAnyHint) && (
          <ResourceIcon
            icon="🧠"
            label="理智"
            level={levels.san}
            value={currentValues.san}
            maxValue={currentValues.maxSan}
            isCost={!!hoveredImpact?.san && hoveredImpact.san < 0}
          />
        )}
        
        {/* Gold */}
        {levels.gold !== 'none' && (
          <ResourceIcon
            icon="💰"
            label="金钱"
            level={levels.gold}
            value={currentValues.gold}
            maxValue={Math.max(currentValues.gold * 2, 1000)}
            isCost={true}
          />
        )}
        
        {/* Hunger */}
        {levels.hunger !== 'none' && (
          <ResourceIcon
            icon="🍖"
            label="饥饿"
            level={levels.hunger}
            value={0}
            maxValue={100}
            isCost={true}
          />
        )}
        
        {/* 提示文字 */}
        {hasAnyHint && (
          <div className="ml-2 pl-3 border-l border-white/20">
            <span className="text-xs text-gray-500">
              预计影响
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 用于事件选项的悬停处理器
 */
export const useResourceHint = () => {
  const [hoveredImpact, setHoveredImpact] = React.useState<OptionImpact | null>(null);
  
  const onOptionHover = (impact: OptionImpact | null) => {
    setHoveredImpact(impact);
  };
  
  return { hoveredImpact, onOptionHover };
};

export default ResourceHintBar;
