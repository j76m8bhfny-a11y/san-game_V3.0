/**
 * InsightMilestones - D选项前置暗示系统
 * 
 * 在玩家灵视达到特定阈值时给予渐进式提示
 * 使用ModalQueueManager避免弹窗堆叠
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Sparkles, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useQueuedModal } from './ModalQueueManager';

interface Milestone {
  threshold: number;
  title: string;
  message: string;
  subMessage?: string;
  type: 'whisper' | 'vision' | 'revelation';
}

const INSIGHT_MILESTONES: Milestone[] = [
  {
    threshold: 30,
    title: '模糊的感知',
    message: '你开始注意到一些事情不对劲...',
    subMessage: '空气中似乎有某种你看不见的东西在流动。',
    type: 'whisper',
  },
  {
    threshold: 50,
    title: '觉醒的开端',
    message: '世界在你眼中变得更加清晰了。',
    subMessage: '某些选择中，你可能会看到以前看不到的选项...',
    type: 'vision',
  },
  {
    threshold: 65,
    title: '真相逼近',
    message: '你即将看到被隐藏的真相。',
    subMessage: '但要小心——真相往往伴随着代价。做好准备。',
    type: 'revelation',
  },
];

const MILESTONE_STORAGE_KEY = 'insight_milestones_shown';

export const InsightMilestones: React.FC = () => {
  const { vitality, currentEvent } = useGameStore();
  const { show, close, isOpen } = useQueuedModal('insightMilestone');
  const [shownMilestones, setShownMilestones] = useState<number[]>([]);
  
  const currentInsight = vitality.metrics.insight;
  const currentTurn = vitality.time.currentTurn;
  
  useEffect(() => {
    const stored = sessionStorage.getItem(MILESTONE_STORAGE_KEY);
    if (stored) {
      setShownMilestones(JSON.parse(stored));
    }
  }, []);
  
  useEffect(() => {
    if (isOpen) return; // 如果已经有弹窗打开，不触发新的
    
    // [NEW] 第一次事件之前不显示里程碑提示，避免与守护灵提示冲突
    if (currentTurn <= 2 && !currentEvent) return;
    
    const reachedMilestone = INSIGHT_MILESTONES.find(
      m => currentInsight >= m.threshold && !shownMilestones.includes(m.threshold)
    );
    
    if (reachedMilestone) {
      const timer = setTimeout(() => {
        const updated = [...shownMilestones, reachedMilestone.threshold];
        setShownMilestones(updated);
        sessionStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(updated));
        
        show(
          <MilestoneContent 
            milestone={reachedMilestone} 
            onClose={close}
          />
        );
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [currentInsight, shownMilestones, isOpen, show, close, currentTurn, currentEvent]);
  
  return null;
};

// 里程碑内容组件
const MilestoneContent: React.FC<{
  milestone: Milestone;
  onClose: () => void;
}> = ({ milestone, onClose }) => {
  const style = getMilestoneStyle(milestone.type);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        className={`relative max-w-md w-full p-6 rounded-sm border ${style.bgColor} ${style.borderColor}`}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`w-16 h-16 rounded-sm flex items-center justify-center mx-auto mb-4 ${style.iconBg} text-white`}
        >
          {style.icon}
        </motion.div>
        
        <h3 className={`text-xl font-bold text-center mb-2 ${style.titleColor}`}>
          {milestone.title}
        </h3>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xs text-gray-400">灵视</span>
          <span className={`text-lg font-bold ${style.textColor}`}>{milestone.threshold}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
        
        <p className={`text-lg text-center mb-2 ${style.textColor}`}>
          {milestone.message}
        </p>
        {milestone.subMessage && (
          <p className="text-sm text-gray-400 text-center">
            {milestone.subMessage}
          </p>
        )}
        
        {milestone.threshold === 65 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 bg-red-950/50 border border-red-500/30 rounded-sm"
          >
            <p className="text-xs text-red-400 text-center">
              ⚠️ 当灵视达到70时，你将看到第四个选项。准备好付出代价了吗？
            </p>
          </motion.div>
        )}
        
        <button
          onClick={onClose}
          className={`w-full mt-6 py-3 rounded-sm font-medium text-white transition-colors ${style.button}`}
        >
          继续
        </button>
      </motion.div>
    </motion.div>
  );
};

const getMilestoneStyle = (type: string) => {
  const map: Record<string, { 
    icon: React.ReactNode; 
    bgColor: string; 
    borderColor: string; 
    iconBg: string;
    textColor: string;
    titleColor: string;
    button: string;
  }> = {
    whisper: {
      icon: <Eye className="w-6 h-6" />,
      bgColor: 'bg-blue-950/90',
      borderColor: 'border-blue-500/50',
      iconBg: 'bg-blue-500/30',
      textColor: 'text-blue-300',
      titleColor: 'text-blue-200',
      button: 'bg-blue-600 hover:bg-blue-500',
    },
    vision: {
      icon: <Sparkles className="w-6 h-6" />,
      bgColor: 'bg-purple-950/90',
      borderColor: 'border-purple-500/50',
      iconBg: 'bg-purple-500/30',
      textColor: 'text-purple-300',
      titleColor: 'text-purple-200',
      button: 'bg-purple-600 hover:bg-purple-500',
    },
    revelation: {
      icon: <AlertTriangle className="w-6 h-6" />,
      bgColor: 'bg-amber-950/90',
      borderColor: 'border-amber-500/50',
      iconBg: 'bg-amber-500/30',
      textColor: 'text-amber-300',
      titleColor: 'text-amber-200',
      button: 'bg-amber-600 hover:bg-amber-500',
    },
  };
  return map[type] || map.whisper;
};

export default InsightMilestones;
