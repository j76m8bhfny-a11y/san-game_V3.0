/**
 * GuardianHints - 守护灵新手提示系统
 * 
 * 使用ModalQueueManager避免弹窗堆叠
 * 优化触发逻辑，避免误触发
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Ghost, X } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useQueuedModal } from './ModalQueueManager';

export type GuardianTrigger = 
  | 'firstEvent'
  | 'firstShop'
  | 'firstWork'
  | 'firstHousing'
  | 'firstDamage'
  | 'lowHp'
  | 'highHunger'
  | 'deathRisk'
  | 'firstDOptionSeen'
  | 'firstGazeEvent';

interface GuardianMessage {
  id: string;
  trigger: GuardianTrigger;
  message: string;
  subMessage?: string;
  priority: 'urgent' | 'normal' | 'subtle';
}

const GUARDIAN_MESSAGES: GuardianMessage[] = [
  {
    id: 'welcome_first_event',
    trigger: 'firstEvent',
    message: '这是你面临的第一个选择...',
    subMessage: 'A通常是安全的，B更保守。D有代价，但可能带来真相。小心选择。',
    priority: 'normal',
  },
  {
    id: 'first_shop',
    trigger: 'firstShop',
    message: '这里可以买到生存必需品...',
    subMessage: '食物解决饥饿，药品治疗疾病。没有钱？去找工作。',
    priority: 'normal',
  },
  {
    id: 'first_work',
    trigger: 'firstWork',
    message: '工作会带来收入，但也消耗你的身心...',
    subMessage: '注意工作和休息的平衡。过度劳累会让你更容易死亡。',
    priority: 'normal',
  },
  {
    id: 'first_housing',
    trigger: 'firstHousing',
    message: '一个住所不仅仅是睡觉的地方...',
    subMessage: '有住处可以恢复HP，还能避免街头危险。优先考虑。',
    priority: 'normal',
  },
  {
    id: 'first_damage',
    trigger: 'firstDamage',
    message: '你受伤了。疼痛是真实的...',
    subMessage: 'HP归零就会死亡。注意恢复，不要再冒险。',
    priority: 'urgent',
  },
  {
    id: 'hp_critical',
    trigger: 'lowHp',
    message: '你的生命力在流逝...我能感觉到。',
    subMessage: '屏幕变红是因为你快死了。找一个安全的地方，立刻。',
    priority: 'urgent',
  },
  {
    id: 'hunger_warning',
    trigger: 'highHunger',
    message: '你的胃在尖叫，但没人听得见...',
    subMessage: '饥饿会拖垮你。去吃点东西，什么都行。',
    priority: 'urgent',
  },
  {
    id: 'death_risk',
    trigger: 'deathRisk',
    message: '死亡的气息很近...',
    subMessage: '你的生存率很低。选择最安全的选项，活下去比什么都重要。',
    priority: 'urgent',
  },
  {
    id: 'first_d_option',
    trigger: 'firstDOptionSeen',
    message: '你能看到那个选项了...',
    subMessage: '你的灵视足够高，看到了真相。但真相有代价，准备好了吗？',
    priority: 'normal',
  },
  {
    id: 'first_gaze',
    trigger: 'firstGazeEvent',
    message: '它在看着你了...',
    subMessage: '系统开始注意你的存在。解锁太多档案会带来麻烦。小心。',
    priority: 'urgent',
  },
];

const STORAGE_KEY = 'guardian_settings';

interface GuardianSettings {
  enabled: boolean;
  shownHints: string[];
  isFirstPlay: boolean;
  deathCount: number;
}

const defaultSettings: GuardianSettings = {
  enabled: true,
  shownHints: [],
  isFirstPlay: true,
  deathCount: 0,
};

export const GuardianHints: React.FC = () => {
  const [settings, setSettings] = useState<GuardianSettings>(defaultSettings);
  const { show, close, isOpen } = useQueuedModal('guardianHint');
  const gameState = useGameStore();
  const { vitality, currentEvent, unlockedArchives, totalDeaths } = gameState;
  
  const hpPercent = vitality.metrics.hp / vitality.metrics.maxHp;
  const hungerPercent = vitality.metrics.hunger / vitality.metrics.maxHunger;
  const currentInsight = vitality.metrics.insight;
  const archiveCount = unlockedArchives?.length || 0;
  const currentTurn = vitality.time.currentTurn;
  
  // 加载设置
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSettings({ ...defaultSettings, ...parsed });
    }
  }, []);
  
  // 保存设置
  const saveSettings = useCallback((newSettings: GuardianSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }, []);
  
  // 禁用守护灵
  const disableGuardian = useCallback(() => {
    saveSettings({ ...settings, enabled: false });
    close();
  }, [settings, saveSettings, close]);
  
  // 检测触发条件
  useEffect(() => {
    if (!settings.enabled || !settings.isFirstPlay || isOpen) return;
    
    let triggeredHint: GuardianMessage | null = null;
    
    // 按优先级顺序检测
    
    // 1. 死亡风险 (最高优先级)
    if (hpPercent < 0.2 && hungerPercent > 0.7) {
      triggeredHint = GUARDIAN_MESSAGES.find(h => h.trigger === 'deathRisk') || null;
    }
    // 2. HP危急
    else if (hpPercent < 0.25 && currentTurn > 1) {
      triggeredHint = GUARDIAN_MESSAGES.find(h => h.trigger === 'lowHp') || null;
    }
    // 3. 饥饿警告
    else if (hungerPercent > 0.75 && currentTurn > 1) {
      triggeredHint = GUARDIAN_MESSAGES.find(h => h.trigger === 'highHunger') || null;
    }
    // 4. 第一次事件 (仅在第1-2周触发)
    else if (currentEvent && currentTurn <= 2 && !settings.shownHints.includes('welcome_first_event')) {
      triggeredHint = GUARDIAN_MESSAGES.find(h => h.trigger === 'firstEvent') || null;
    }
    // 5. 第一次看到D选项
    else if (currentInsight >= 70 && !settings.shownHints.includes('first_d_option')) {
      triggeredHint = GUARDIAN_MESSAGES.find(h => h.trigger === 'firstDOptionSeen') || null;
    }
    // 6. 第一次遭遇系统惩罚
    else if (archiveCount > 20 && !settings.shownHints.includes('first_gaze')) {
      triggeredHint = GUARDIAN_MESSAGES.find(h => h.trigger === 'firstGazeEvent') || null;
    }
    
    if (triggeredHint && !settings.shownHints.includes(triggeredHint.id)) {
      const timer = setTimeout(() => {
        show(
          <GuardianContent 
            hint={triggeredHint!} 
            onClose={close}
            onDisable={disableGuardian}
          />
        );
        
        saveSettings({
          ...settings,
          shownHints: [...settings.shownHints, triggeredHint!.id],
        });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [hpPercent, hungerPercent, currentInsight, archiveCount, currentTurn, currentEvent, settings, isOpen, show, close, saveSettings, disableGuardian]);
  
  // 更新死亡次数（用于判断是否是首次游玩）
  useEffect(() => {
    if (totalDeaths > 0 && settings.isFirstPlay) {
      saveSettings({ ...settings, isFirstPlay: false });
    }
  }, [totalDeaths, settings, saveSettings]);
  
  return null;
};

// 守护灵内容组件
const GuardianContent: React.FC<{
  hint: GuardianMessage;
  onClose: () => void;
  onDisable: () => void;
}> = ({ hint, onClose, onDisable }) => {
  const getColors = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-purple-950/95',
          border: 'border-purple-500/50',
          text: 'text-purple-200',
          subText: 'text-purple-300',
          badge: 'bg-red-500',
          button: 'bg-purple-600 hover:bg-purple-500',
        };
      case 'normal':
        return {
          bg: 'bg-indigo-950/95',
          border: 'border-indigo-500/50',
          text: 'text-indigo-200',
          subText: 'text-indigo-300',
          badge: 'bg-indigo-500',
          button: 'bg-indigo-600 hover:bg-indigo-500',
        };
      default:
        return {
          bg: 'bg-blue-950/95',
          border: 'border-blue-500/50',
          text: 'text-blue-200',
          subText: 'text-blue-300',
          badge: 'bg-blue-500',
          button: 'bg-blue-600 hover:bg-blue-500',
        };
    }
  };
  
  const colors = getColors(hint.priority);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%]"
    >
      <div className={`relative p-5 rounded-sm border backdrop-solid shadow-pixel-sm ${colors.bg} ${colors.border}`}>
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${hint.priority === 'urgent' ? 'bg-red-500/30' : 'bg-indigo-500/30'}`}>
            <Ghost className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-bold flex items-center gap-2">
              某个声音
              <span className="text-xs opacity-50 font-normal">(守护灵)</span>
            </div>
            <div className={`text-xs ${colors.subText}`}>
              {hint.priority === 'urgent' ? '紧急' : hint.priority === 'normal' ? '提示' : '低语'}
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 消息内容 */}
        <div className="space-y-2">
          <p className={`text-lg leading-relaxed italic ${colors.text}`}>
            "{hint.message}"
          </p>
          {hint.subMessage && (
            <p className="text-gray-400 text-sm leading-relaxed pl-4 border-l-2 border-white/20">
              {hint.subMessage}
            </p>
          )}
        </div>
        
        {/* 底部按钮 */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onDisable}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            不再显示守护灵
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-sm text-sm font-medium text-white transition-all ${colors.button}`}
          >
            明白了
          </button>
        </div>
        
        {/* 紧急效果 */}
        {hint.priority === 'urgent' && (
          <motion.div
            className="absolute inset-0 rounded-sm bg-purple-500/10 pointer-events-none"
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default GuardianHints;
