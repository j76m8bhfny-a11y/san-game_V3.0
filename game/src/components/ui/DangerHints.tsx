/**
 * DangerHints - HUD危险文字提示系统
 * 
 * 当玩家处于危险状态时，显示明确的文字提示
 * 已优化：与AtmosphereOverlay配合，避免重复提示
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface DangerHintsProps {
  hpPercent: number;
  insightPercent: number;
  hungerPercent: number;
  hasHousing: boolean;
  hasInsurance: boolean;
  activeDiseases: string[];
  isNewPlayer?: boolean;
}

interface Hint {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export const DangerHints: React.FC<DangerHintsProps> = ({
  hpPercent,
  insightPercent,
  hungerPercent,
  hasHousing,
  hasInsurance,
  activeDiseases,
  isNewPlayer = false,
}) => {
  // 生成当前应该显示的提示（只显示最关键的）
  const criticalHint = useMemo((): Hint | null => {
    // 按优先级顺序只返回最重要的一个提示
    
    // 1. HP危急
    if (hpPercent <= 0.25) {
      return {
        id: 'hp_critical',
        title: '生命值危急',
        message: hpPercent <= 0.15 
          ? '你濒临死亡，立刻寻找治疗！' 
          : '生命值极低，任何伤害都可能导致死亡',
        severity: 'critical',
      };
    }
    
    // 2. 饥饿危险
    if (hungerPercent >= 0.75) {
      return {
        id: 'hunger_critical',
        title: '极度饥饿',
        message: '饥饿正在消耗你的生命，立即进食！',
        severity: 'critical',
      };
    }
    
    // 3. 疾病未治疗
    if (activeDiseases.length > 0) {
      return {
        id: 'disease_active',
        title: '疾病未治愈',
        message: `你携带 ${activeDiseases.length} 种疾病，健康持续恶化`,
        severity: 'warning',
      };
    }
    
    // 新手专属提示（前3周）
    if (isNewPlayer) {
      // 4. 没有住所
      if (!hasHousing && hpPercent < 0.5) {
        return {
          id: 'no_housing',
          title: '无处安身',
          message: '没有住所无法恢复HP，尽快找一个落脚处',
          severity: 'warning',
        };
      }
      
      // 5. 有疾病没保险
      if (activeDiseases.length > 0 && !hasInsurance) {
        return {
          id: 'no_insurance',
          title: '建议购买医保',
          message: '疾病治疗很昂贵，医保可以帮你省钱',
          severity: 'info',
        };
      }
      
      // 6. 灵视低
      if (insightPercent <= 0.2) {
        return {
          id: 'insight_low',
          title: '视野受限',
          message: '灵视太低，可能错过重要信息',
          severity: 'info',
        };
      }
    }
    
    return null;
  }, [hpPercent, hungerPercent, activeDiseases, hasHousing, hasInsurance, insightPercent, isNewPlayer]);

  if (!criticalHint) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-950/90 border-red-500/50 text-red-400';
      case 'warning':
        return 'bg-orange-950/90 border-orange-500/50 text-orange-400';
      default:
        return 'bg-blue-950/90 border-blue-500/50 text-blue-400';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={criticalHint.id}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`
          fixed top-20 left-1/2 -translate-x-1/2 z-50
          px-4 py-2 rounded-sm border backdrop-solid
          flex items-center gap-2
          ${getSeverityStyles(criticalHint.severity)}
        `}
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{criticalHint.title}</span>
          <span className="text-sm opacity-80">{criticalHint.message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DangerHints;
