/**
 * ClassChangeModal - 阶级变化提示弹窗
 * 
 * 在玩家阶级发生变化时显示，支持队列显示多次变化
 * 升级 = 金色光芒上升，降级 = 灰色碎片下落
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import { PlayerClass } from '@/types/schema';
import type { ClassChangeInfo } from '@/store/slices/createVitalitySlice';
import type { ClassChangeConfig } from '@/types/narrative';

interface ClassChangeModalProps {
  changes: ClassChangeInfo[];
  onClose: () => void;
}

type ChangeType = 'upgrade' | 'downgrade';
type AnimationPhase = 'enter' | 'transition' | 'reveal' | 'exit';

// 从配置读取（带类型）
const CLASS_CONFIG = (NARRATIVE_RULES as unknown as { classChange?: ClassChangeConfig }).classChange;

// 阶级显示名称
const CLASS_NAMES: Record<PlayerClass, string> = {
  'HOMELESS': '流浪汉',
  'WORKER': '工人',
  'MIDDLE': '中产',
  'CAPITALIST': '资本家'
};

// 阶级图标
const CLASS_ICONS: Record<PlayerClass, string> = {
  'HOMELESS': '🏚️',
  'WORKER': '👷',
  'MIDDLE': '👔',
  'CAPITALIST': '💼'
};

// 判断升级/降级
const getChangeType = (oldClass: PlayerClass, newClass: PlayerClass): ChangeType => {
  const classOrder = ['HOMELESS', 'WORKER', 'MIDDLE', 'CAPITALIST'];
  const oldIndex = classOrder.indexOf(oldClass);
  const newIndex = classOrder.indexOf(newClass);
  return newIndex > oldIndex ? 'upgrade' : 'downgrade';
};

export const ClassChangeModal: React.FC<ClassChangeModalProps> = React.memo(({
  changes,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('enter');
  const [displayNetWorth, setDisplayNetWorth] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  
  const currentChange = changes[currentIndex];
  const isLastChange = currentIndex >= changes.length - 1;
  
  const { oldClass, newClass, netWorth } = currentChange;
  
  // 判断是升级还是降级
  const changeType: ChangeType = useMemo(
    () => getChangeType(oldClass, newClass),
    [oldClass, newClass]
  );
  
  // 获取配置
  const visualConfig = useMemo(
    () => CLASS_CONFIG?.visual?.[changeType],
    [changeType]
  );
  const titleConfig = useMemo(
    () => CLASS_CONFIG?.titles?.[changeType],
    [changeType]
  );
  const descKey = useMemo(
    () => `${oldClass}->${newClass}`,
    [oldClass, newClass]
  );
  const descConfig = useMemo(
    () => CLASS_CONFIG?.descriptions?.[descKey],
    [descKey]
  );
  const mechanicsHint = useMemo(
    () => CLASS_CONFIG?.mechanicsHint?.[newClass],
    [newClass]
  );
  
  // 重置动画状态当变化切换时
  useEffect(() => {
    setAnimationPhase('enter');
    setDisplayNetWorth(0);
    setIsExiting(false);
  }, [currentIndex]);
  
  // 动画时序控制
  useEffect(() => {
    // Phase 1: 进入（0-0.5s）
    const enterTimer = setTimeout(() => {
      setAnimationPhase('transition');
    }, 500);
    
    // Phase 2: 过渡（0.5-1.5s）
    const transitionTimer = setTimeout(() => {
      setAnimationPhase('reveal');
    }, 1500);
    
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(transitionTimer);
    };
  }, [currentIndex]);
  
  // 净资产数字滚动动画
  useEffect(() => {
    if (animationPhase !== 'reveal') return;
    
    const duration = 1000;
    const steps = 30;
    const increment = netWorth / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= netWorth) {
        setDisplayNetWorth(netWorth);
        clearInterval(timer);
      } else {
        setDisplayNetWorth(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [animationPhase, netWorth]);
  
  // 处理关闭/下一个
  const handleClose = useCallback(() => {
    if (isLastChange) {
      // 最后一个，执行退出动画后关闭
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      // 还有下一个，切换到下一个变化
      setCurrentIndex(prev => prev + 1);
    }
  }, [isLastChange, onClose]);
  
  // 获取按钮文字
  const buttonText = isLastChange ? '接受现实' : `下一个 (${currentIndex + 1}/${changes.length})`;
  
  if (!currentChange || isExiting) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(to bottom, ${visualConfig?.bgGradient?.replace(/from-|via-|to-/g, '').replace(/\/\d+/g, '') || 'black'})`
      }}
    >
      {/* 动态背景 */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${changeType === 'upgrade' ? 'to top' : 'to bottom'}, ${
            changeType === 'upgrade' 
              ? 'rgba(251, 191, 36, 0.1), transparent'
              : 'rgba(107, 114, 128, 0.1), transparent'
          })`
        }}
      />
      
      {/* 粒子效果 */}
      <ParticleEffect type={changeType} isActive={animationPhase === 'transition'} />
      
      <div className="relative w-full max-w-lg">
        {/* 队列指示器 */}
        {changes.length > 1 && (
          <div className="absolute -top-8 left-0 right-0 flex justify-center gap-1">
            {changes.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-sm transition-colors ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* 主卡片 */}
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="backdrop-solid-dark border-2 rounded-sm p-8 text-center overflow-hidden"
          style={{ borderColor: visualConfig?.accentColor || '#666' }}
        >
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <span className="text-4xl mr-2">{visualConfig?.icon}</span>
            <span 
              className="text-2xl font-black uppercase tracking-widest"
              style={{ color: visualConfig?.accentColor }}
            >
              {titleConfig}
            </span>
          </motion.div>
          
          {/* 阶级过渡动画 */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* 旧阶级 */}
            <motion.div
              animate={{ 
                opacity: animationPhase === 'enter' ? 1 : 0.3,
                scale: animationPhase === 'enter' ? 1 : 0.8,
                x: animationPhase === 'transition' ? (changeType === 'upgrade' ? -30 : 30) : 0
              }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-6xl mb-2 opacity-50">{CLASS_ICONS[oldClass]}</div>
              <div className="text-gray-500 text-sm">{CLASS_NAMES[oldClass]}</div>
            </motion.div>
            
            {/* 箭头 */}
            <motion.div
              animate={{ 
                opacity: animationPhase === 'transition' ? 1 : 0,
                x: animationPhase === 'transition' ? 0 : (changeType === 'upgrade' ? -20 : 20)
              }}
              transition={{ duration: 0.3 }}
              className="text-4xl"
              style={{ color: visualConfig?.accentColor }}
            >
              {changeType === 'upgrade' ? '→' : '←'}
            </motion.div>
            
            {/* 新阶级 */}
            <motion.div
              animate={{ 
                opacity: animationPhase === 'reveal' ? 1 : 0,
                scale: animationPhase === 'reveal' ? 1 : 0.5,
                x: animationPhase === 'transition' ? (changeType === 'upgrade' ? 30 : -30) : 0
              }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div 
                className="text-6xl mb-2"
                style={{ 
                  filter: animationPhase === 'reveal' 
                    ? `drop-shadow(0 0 20px ${visualConfig?.accentColor})` 
                    : 'none'
                }}
              >
                {CLASS_ICONS[newClass]}
              </div>
              <div 
                className="text-lg font-bold"
                style={{ color: visualConfig?.accentColor }}
              >
                {CLASS_NAMES[newClass]}
              </div>
            </motion.div>
          </div>
          
          {/* 文案区域 */}
          <AnimatePresence mode="wait">
            {animationPhase === 'reveal' && descConfig && typeof descConfig === 'object' && (
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 mb-6"
              >
                <h3 className="text-xl font-bold text-white">
                  {(descConfig as { title: string }).title}
                </h3>
                <p className="text-gray-300">
                  {(descConfig as { desc: string }).desc}
                </p>
                <p className="text-gray-500 text-sm italic">
                  "{(descConfig as { flavor: string }).flavor}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 净资产显示 */}
          {animationPhase === 'reveal' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="text-sm text-gray-500 mb-1">当前净资产</div>
              <div 
                className="text-3xl font-mono font-bold"
                style={{ color: visualConfig?.accentColor }}
              >
                ${displayNetWorth.toLocaleString()}
              </div>
            </motion.div>
          )}
          
          {/* 机制提示 */}
          {animationPhase === 'reveal' && mechanicsHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-sm p-3 mb-6"
            >
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>💡</span>
                <span>{mechanicsHint}</span>
              </div>
            </motion.div>
          )}
          
          {/* 确认按钮 */}
          {animationPhase === 'reveal' && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleClose}
              className="w-full py-4 font-black uppercase tracking-widest rounded-sm transition-all hover:scale-[1.02] active:scale-95"
              style={{ 
                backgroundColor: visualConfig?.accentColor,
                color: 'black'
              }}
            >
              {buttonText}
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
});

ClassChangeModal.displayName = 'ClassChangeModal';

// 粒子效果组件
interface ParticleEffectProps {
  type: ChangeType;
  isActive: boolean;
}

const ParticleEffect: React.FC<ParticleEffectProps> = React.memo(({ type, isActive }) => {
  if (!isActive) return null;
  
  const particleCount = 20;
  const particles = useMemo(() => 
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 0.5 + Math.random() * 0.5
    })),
    []
  );
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            opacity: 0,
            x: `${p.x}%`,
            y: type === 'upgrade' ? '100%' : '0%',
            scale: 0
          }}
          animate={{ 
            opacity: [0, 1, 0],
            y: type === 'upgrade' ? '-20%' : '120%',
            scale: [0, 1, 0.5]
          }}
          transition={{ 
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut"
          }}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: type === 'upgrade' ? '#fbbf24' : '#6b7280',
            boxShadow: `0 0 10px ${type === 'upgrade' ? '#fbbf24' : '#6b7280'}`
          }}
        />
      ))}
    </div>
  );
});

ParticleEffect.displayName = 'ParticleEffect';

export default ClassChangeModal;
