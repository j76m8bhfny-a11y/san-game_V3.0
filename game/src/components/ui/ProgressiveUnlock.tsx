/**
 * ProgressiveUnlock - 渐进式机制解锁系统
 * 
 * 使用ModalQueueManager避免弹窗堆叠
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Unlock, Home, Shield, Eye, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useQueuedModal } from './ModalQueueManager';

export type UnlockableFeature = 
  | 'housing'
  | 'medical'
  | 'insurance'
  | 'dOption'
  | 'systemGaze';

interface FeatureUnlock {
  id: UnlockableFeature;
  name: string;
  description: string;
  weekRequired: number;
  additionalCondition?: string;
  icon: React.ReactNode;
  color: string;
}

const UNLOCKABLE_FEATURES: FeatureUnlock[] = [
  {
    id: 'housing',
    name: '住所系统',
    description: '现在你可以租房或购房了。住所可以恢复HP，提供保护。',
    weekRequired: 2,
    icon: <Home className="w-6 h-6" />,
    color: 'blue',
  },
  {
    id: 'medical',
    name: '医疗系统',
    description: '医院现在开放了。可以治疗疾病、恢复HP。',
    weekRequired: 3,
    icon: <Shield className="w-6 h-6" />,
    color: 'green',
  },
  {
    id: 'insurance',
    name: '保险系统',
    description: '可以购买医疗保险了。降低医疗成本，提供保障。',
    weekRequired: 3,
    icon: <Shield className="w-6 h-6" />,
    color: 'cyan',
  },
  {
    id: 'dOption',
    name: '真相选项',
    description: '你的灵视足够高，现在可以看到第4个选项了。真相有代价，但也有收获。',
    weekRequired: 4,
    additionalCondition: '灵视≥30',
    icon: <Eye className="w-6 h-6" />,
    color: 'purple',
  },
  {
    id: 'systemGaze',
    name: '系统凝视',
    description: '系统开始注意你的存在了。解锁档案会引来麻烦...',
    weekRequired: 6,
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'red',
  },
];

const UNLOCK_STORAGE_KEY = 'progressive_unlocks';

interface UnlockState {
  unlockedFeatures: UnlockableFeature[];
  shownNotifications: UnlockableFeature[];
}

const defaultUnlockState: UnlockState = {
  unlockedFeatures: [],
  shownNotifications: [],
};

export const ProgressiveUnlock: React.FC = () => {
  const { vitality, unlockedArchives } = useGameStore();
  const { show, close, isOpen } = useQueuedModal('progressiveUnlock');
  const [unlockState, setUnlockState] = useState<UnlockState>(defaultUnlockState);
  
  const currentWeek = vitality.time.currentTurn;
  const currentInsight = vitality.metrics.insight;
  const archiveCount = unlockedArchives?.length || 0;
  
  useEffect(() => {
    const stored = sessionStorage.getItem(UNLOCK_STORAGE_KEY);
    if (stored) {
      setUnlockState({ ...defaultUnlockState, ...JSON.parse(stored) });
    }
  }, []);
  
  const saveUnlockState = useCallback((newState: UnlockState) => {
    setUnlockState(newState);
    sessionStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify(newState));
  }, []);
  
  useEffect(() => {
    if (isOpen) return;
    
    const newlyUnlocked: UnlockableFeature[] = [];
    
    UNLOCKABLE_FEATURES.forEach(feature => {
      if (unlockState.unlockedFeatures.includes(feature.id)) return;
      if (currentWeek < feature.weekRequired) return;
      if (feature.id === 'dOption' && currentInsight < 30) return;
      if (feature.id === 'systemGaze' && archiveCount < 5) return;
      
      newlyUnlocked.push(feature.id);
    });
    
    if (newlyUnlocked.length > 0) {
      const updatedState: UnlockState = {
        unlockedFeatures: [...unlockState.unlockedFeatures, ...newlyUnlocked],
        shownNotifications: unlockState.shownNotifications,
      };
      saveUnlockState(updatedState);
      
      const firstNewFeature = UNLOCKABLE_FEATURES.find(f => f.id === newlyUnlocked[0]);
      if (firstNewFeature && !unlockState.shownNotifications.includes(firstNewFeature.id)) {
        setTimeout(() => {
          show(
            <UnlockContent 
              feature={firstNewFeature} 
              onClose={close}
            />
          );
          
          saveUnlockState({
            ...updatedState,
            shownNotifications: [...updatedState.shownNotifications, firstNewFeature.id],
          });
        }, 1000);
      }
    }
  }, [currentWeek, currentInsight, archiveCount, unlockState, isOpen, show, close, saveUnlockState]);
  
  return null;
};

// 解锁内容组件
const UnlockContent: React.FC<{
  feature: FeatureUnlock;
  onClose: () => void;
}> = ({ feature, onClose }) => {
  const style = getColorClasses(feature.color);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative max-w-md w-full p-6 rounded-2xl border ${style.bg} ${style.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="absolute -top-6 left-1/2 -translate-x-1/2"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30">
            <Unlock className="w-6 h-6 text-black" />
          </div>
        </motion.div>
        
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-400 mb-1">新功能解锁</div>
          <h3 className={`text-2xl font-bold mb-2 ${style.text}`}>
            {feature.name}
          </h3>
        </div>
        
        <div className="flex justify-center my-4">
          <div className={`p-4 rounded-full bg-white/10 ${style.text}`}>
            {feature.icon}
          </div>
        </div>
        
        <p className="text-gray-300 text-center mb-4">
          {feature.description}
        </p>
        
        {feature.additionalCondition && (
          <div className="text-xs text-gray-500 text-center mb-4">
            解锁条件：第{feature.weekRequired}周，{feature.additionalCondition}
          </div>
        )}
        
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-lg text-white font-medium transition-colors ${style.button}`}
        >
          知道了
        </button>
      </motion.div>
    </motion.div>
  );
};

const getColorClasses = (color: string) => {
  const map: Record<string, { bg: string; border: string; text: string; button: string }> = {
    blue: {
      bg: 'bg-blue-950/90',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-500',
    },
    green: {
      bg: 'bg-green-950/90',
      border: 'border-green-500/50',
      text: 'text-green-400',
      button: 'bg-green-600 hover:bg-green-500',
    },
    cyan: {
      bg: 'bg-cyan-950/90',
      border: 'border-cyan-500/50',
      text: 'text-cyan-400',
      button: 'bg-cyan-600 hover:bg-cyan-500',
    },
    purple: {
      bg: 'bg-purple-950/90',
      border: 'border-purple-500/50',
      text: 'text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-500',
    },
    red: {
      bg: 'bg-red-950/90',
      border: 'border-red-500/50',
      text: 'text-red-400',
      button: 'bg-red-600 hover:bg-red-500',
    },
  };
  return map[color] || map.blue;
};

export const useProgressiveUnlock = () => {
  const [unlockState, setUnlockState] = useState<UnlockState>(defaultUnlockState);
  
  useEffect(() => {
    const stored = sessionStorage.getItem(UNLOCK_STORAGE_KEY);
    if (stored) {
      setUnlockState({ ...defaultUnlockState, ...JSON.parse(stored) });
    }
  }, []);
  
  const isUnlocked = useCallback((featureId: UnlockableFeature): boolean => {
    return unlockState.unlockedFeatures.includes(featureId);
  }, [unlockState.unlockedFeatures]);
  
  return { isUnlocked, unlockedFeatures: unlockState.unlockedFeatures };
};

export default ProgressiveUnlock;
