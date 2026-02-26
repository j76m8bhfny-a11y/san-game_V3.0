/**
 * TurnTransition - 回合结束过渡组件
 * 
 * 流程：闭眼(0.6s) → 黑屏吐槽(1.5s) → 翻日历(0.3s) → 睁眼(0.6s) = 3s
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import { PlayerClass } from '@/types/schema';
import type { TurnTransitionConfig, DarkHumorLinesConfig } from '@/types/narrative';

interface TurnTransitionProps {
  isActive: boolean;
  currentTurn: number;
  playerState: {
    hp: number;
    maxHp: number;
    gold: number;
    insight: number;
    maxInsight: number;
    hunger: number;
    maxHunger: number;
    currentClass: PlayerClass;
    diseases: string[];
    hasDebt: boolean;
  };
  onComplete: () => void;
}

type TransitionPhase = 'closing' | 'dark' | 'calendar' | 'opening' | 'complete';

// 从配置读取（带类型）
const CONFIG = (NARRATIVE_RULES as unknown as { turnTransition?: TurnTransitionConfig }).turnTransition;
const HUMOR_CONFIG = (NARRATIVE_RULES as unknown as { darkHumorLines?: DarkHumorLinesConfig }).darkHumorLines!;

/**
 * 选择吐槽文案 - 基于多维度属性匹配
 */
function selectHumorLine(state: TurnTransitionProps['playerState'], turn: number): string {
  const { hp, maxHp, gold, insight, maxInsight, hunger, maxHunger, currentClass, diseases, hasDebt } = state;
  
  // 计算百分比
  const hpPercent = (hp / maxHp) * 100;
  const insightPercent = (insight / maxInsight) * 100;
  const hungerPercent = (hunger / maxHunger) * 100;
  
  // 1. Critical 检查
  const critical = HUMOR_CONFIG.critical?.find((c: any) => {
    const cond = c.conditions;
    if (cond.hp?.max !== undefined && hp > cond.hp.max) return false;
    if (cond.hp?.min !== undefined && hp < cond.hp.min) return false;
    if (cond.gold?.max !== undefined && gold > cond.gold.max) return false;
    return true;
  });
  if (critical) return randomPick(critical.lines);
  
  // 2. 阶级专属 (40%概率)
  if (Math.random() < 0.4) {
    const classLines = HUMOR_CONFIG.classSpecific?.[currentClass];
    if (classLines?.length) return randomPick(classLines);
  }
  
  // 3. HP 区间
  const hpLines = getLinesForRange(HUMOR_CONFIG.hp, hpPercent);
  if (hpLines && Math.random() < 0.3) return randomPick(hpLines);
  
  // 4. Insight 区间
  const insightLines = getLinesForRange(HUMOR_CONFIG.insight, insightPercent);
  if (insightLines && Math.random() < 0.3) return randomPick(insightLines);
  
  // 5. Gold 区间
  const goldLines = getGoldLines(HUMOR_CONFIG.gold, gold, hasDebt);
  if (goldLines && Math.random() < 0.25) return randomPick(goldLines);
  
  // 6. Hunger
  if (hungerPercent >= 70) {
    const hungerLines = HUMOR_CONFIG.hunger?.high;
    if (hungerLines) return randomPick(hungerLines);
  } else if (hungerPercent <= 30) {
    const hungerLines = HUMOR_CONFIG.hunger?.low;
    if (hungerLines) return randomPick(hungerLines);
  } else {
    const hungerLines = HUMOR_CONFIG.hunger?.medium;
    if (hungerLines && Math.random() < 0.2) return randomPick(hungerLines);
  }
  
  // 7. Disease
  const diseaseLines = diseases.length > 0 
    ? HUMOR_CONFIG.disease?.has 
    : HUMOR_CONFIG.disease?.none;
  if (diseaseLines && Math.random() < 0.2) return randomPick(diseaseLines);
  
  // 8. Debt
  const debtLines = hasDebt 
    ? HUMOR_CONFIG.debt?.has 
    : HUMOR_CONFIG.debt?.none;
  if (debtLines && Math.random() < 0.2) return randomPick(debtLines);
  
  // 9. Survival (保底)
  const survivalLines: string[] = HUMOR_CONFIG.survival || [];
  return randomPick(survivalLines).replace('{turn}', String(turn));
}

function getLinesForRange(config: any, percent: number): string[] | null {
  if (!config) return null;
  for (const [range, lines] of Object.entries(config)) {
    const [min, max] = range.split('-').map(Number);
    if (percent >= min && percent <= max) return lines as string[];
  }
  return null;
}

function getGoldLines(config: any, gold: number, hasDebt: boolean): string[] | null {
  if (!config) return null;
  if (hasDebt || gold < 0) return config.negative;
  if (gold <= 100) return config['0-100'];
  if (gold <= 500) return config['101-500'];
  if (gold <= 2000) return config['501-2000'];
  return config['2001+'];
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const TurnTransition: React.FC<TurnTransitionProps> = React.memo(({
  isActive,
  currentTurn,
  playerState,
  onComplete
}) => {
  const [phase, setPhase] = useState<TransitionPhase>('closing');
  const [displayText, setDisplayText] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const { playSfx } = useAudioStore();
  
  const timings = CONFIG?.timings || {
    eyeCloseDuration: 0.6,
    darkScreenDuration: 1500,
    calendarFlipDuration: 0.3,
    eyeOpenDuration: 0.6
  };
  
  const visual = CONFIG?.visual || {
    textColor: '#E0E0E0',
    typewriterSpeed: 40
  };
  
  // 选择吐槽文案
  const humorLine = useMemo(() => {
    if (!isActive) return '';
    return selectHumorLine(playerState, currentTurn);
  }, [isActive, playerState, currentTurn]);
  
  // 使用 ref 保存当前文案，避免 useEffect 因 humorLine 变化而重置
  const humorLineRef = useRef(humorLine);
  useEffect(() => {
    humorLineRef.current = humorLine;
  }, [humorLine]);
  
  useEffect(() => {
    if (!isActive) {
      setPhase('closing');
      setDisplayText('');
      setShowCalendar(false);
      return;
    }
    
    let typeInterval: NodeJS.Timeout | null = null;
    
    // Phase 1: 闭眼
    const closeTimer = setTimeout(() => {
      playSfx('sfx_paper');
      setPhase('dark');
    }, timings.eyeCloseDuration * 1000);
    
    // Phase 2: 黑屏吐槽
    const darkTimer = setTimeout(() => {
      // 打字机效果显示吐槽
      let charIndex = 0;
      const currentLine = humorLineRef.current;
      typeInterval = setInterval(() => {
        if (charIndex <= currentLine.length) {
          setDisplayText(currentLine.slice(0, charIndex));
          if (charIndex > 0 && charIndex % 3 === 0) {
            playSfx('sfx_typing');
          }
          charIndex++;
        } else {
          if (typeInterval) clearInterval(typeInterval);
        }
      }, visual.typewriterSpeed);
    }, timings.eyeCloseDuration * 1000 + 200);
    
    // Phase 3: 翻日历
    const calendarTimer = setTimeout(() => {
      setPhase('calendar');
      setShowCalendar(true);
      playSfx('sfx_paper');
    }, timings.eyeCloseDuration * 1000 + timings.darkScreenDuration);
    
    // Phase 4: 睁眼
    const openTimer = setTimeout(() => {
      setPhase('opening');
      setShowCalendar(false);
      playSfx('sfx_click');
    }, timings.eyeCloseDuration * 1000 + timings.darkScreenDuration + timings.calendarFlipDuration * 1000);
    
    // Phase 5: 完成
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, timings.eyeCloseDuration * 1000 + timings.darkScreenDuration + timings.calendarFlipDuration * 1000 + timings.eyeOpenDuration * 1000);
    
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(darkTimer);
      if (typeInterval) clearInterval(typeInterval);
      clearTimeout(calendarTimer);
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, currentTurn]);
  
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Phase 1 & 2: 闭眼 + 黑屏 */}
        {(phase === 'closing' || phase === 'dark') && (
          <motion.div
            key="dark-screen"
            initial={{ clipPath: 'ellipse(150% 150% at 50% 50%)' }}
            animate={{ clipPath: 'ellipse(100% 0% at 50% 50%)' }}
            exit={{ clipPath: 'ellipse(150% 150% at 50% 50%)' }}
            transition={{ 
              duration: phase === 'closing' ? timings.eyeCloseDuration : timings.eyeOpenDuration,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-black flex items-center justify-center"
          >
            {/* 吐槽文字 */}
            {phase === 'dark' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-md px-8 text-center"
              >
                <motion.p 
                  className="text-xl md:text-2xl font-medium leading-relaxed tracking-wide"
                  style={{ 
                    color: visual.textColor,
                    fontFamily: 'monospace',
                    textShadow: '0 0 20px rgba(224, 224, 224, 0.3)'
                  }}
                >
                  {displayText}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-6 bg-gray-400 ml-1 align-middle"
                  />
                </motion.p>
                
                {/* 故障效果覆盖层 */}
                <motion.div
                  animate={{ 
                    opacity: [0, 0.03, 0, 0.05, 0],
                    x: [0, -2, 0, 2, 0]
                  }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute inset-0 bg-red-500/10 pointer-events-none"
                />
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Phase 3: 翻日历 */}
        {phase === 'calendar' && showCalendar && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center"
          >
            <div className="relative perspective-1000">
              {/* 当前周卡片（背面） */}
              <motion.div
                initial={{ rotateX: 0 }}
                animate={{ rotateX: -180 }}
                transition={{ duration: timings.calendarFlipDuration, ease: "easeInOut" }}
                className="absolute inset-0 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center backface-hidden"
                style={{ 
                  width: 200, 
                  height: 120,
                  backfaceVisibility: 'hidden'
                }}
              >
                <div className="text-center">
                  <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">{t('weeklySettlement.week')}</div>
                  <div className="text-4xl font-black text-gray-400">{currentTurn}</div>
                </div>
              </motion.div>
              
              {/* 下一周卡片（正面） */}
              <motion.div
                initial={{ rotateX: 180 }}
                animate={{ rotateX: 0 }}
                transition={{ duration: timings.calendarFlipDuration, ease: "easeInOut" }}
                className="bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center shadow-2xl"
                style={{ 
                  width: 200, 
                  height: 120,
                  backfaceVisibility: 'hidden'
                }}
              >
                <div className="text-center">
                  <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">{t('weeklySettlement.week')}</div>
                  <div className="text-5xl font-black text-black">{currentTurn + 1}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
        
        {/* Phase 4: 睁眼 */}
        {phase === 'opening' && (
          <motion.div
            key="opening"
            initial={{ clipPath: 'ellipse(100% 0% at 50% 50%)' }}
            animate={{ clipPath: 'ellipse(150% 150% at 50% 50%)' }}
            transition={{ duration: timings.eyeOpenDuration, ease: "easeInOut" }}
            className="absolute inset-0 bg-black"
          />
        )}
      </AnimatePresence>
    </div>
  );
});

TurnTransition.displayName = 'TurnTransition';

export default TurnTransition;
