/**
 * EventGuardianHint - 事件窗口内嵌守护灵提示
 * 
 * 在第一次事件时，直接在事件窗口内显示提示，而不是通过队列弹出
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ghost, X } from 'lucide-react';

interface EventGuardianHintProps {
  isFirstEvent: boolean;
  stage: 'INIT' | 'TYPING_TITLE' | 'TYPING_BODY' | 'INTERACTIVE';
  onDismiss?: () => void;
}

// 检查是否是新游戏（用于显示欢迎提示）
const isNewGame = () => {
  try {
    const shown = sessionStorage.getItem('guardian_settings');
    if (shown) {
      const parsed = JSON.parse(shown);
      return parsed.isFirstPlay !== false;
    }
  } catch (e) {}
  return true;
};

const FIRST_EVENT_MESSAGE = {
  message: '这是你面临的第一个选择...',
  subMessage: 'A通常是安全的，B更保守。D有代价，但可能带来真相。小心选择。',
};

export const EventGuardianHint: React.FC<EventGuardianHintProps> = ({ 
  isFirstEvent, 
  stage,
  onDismiss 
}) => {
  const [show, setShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    console.log('[EventGuardianHint] 检查显示:', { isFirstEvent, hasShown, stage, isNewGame: isNewGame() });
    // [MODIFIED] 在手机选项显示后（INTERACTIVE阶段）才显示守护灵提示
    // 这样顺序是：事件背景 -> 手机选项弹出 -> 守护灵提示
    if (isFirstEvent && !hasShown && stage === 'INTERACTIVE' && isNewGame()) {
      console.log('[EventGuardianHint] 显示守护灵提示（选项已显示后）');
      const timer = setTimeout(() => {
        setShow(true);
        setHasShown(true);
      }, 2000); // 选项显示后延迟2秒显示守护灵提示，给用户时间先看选项
      return () => clearTimeout(timer);
    }
  }, [isFirstEvent, hasShown, stage]);

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] pointer-events-auto"
    >
      <div className="relative p-4 rounded-sm border backdrop-blur-md bg-indigo-950/90 border-indigo-500/50 shadow-lg">
        {/* 头部 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-indigo-500/30">
            <Ghost className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-sm flex items-center gap-2">
              某个声音
              <span className="text-xs opacity-50 font-normal">(守护灵)</span>
            </div>
          </div>
          <button 
            onClick={handleDismiss} 
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 消息内容 */}
        <div className="space-y-1">
          <p className="text-indigo-200 text-sm leading-relaxed">
            {FIRST_EVENT_MESSAGE.message}
          </p>
          <p className="text-indigo-300/80 text-xs">
            {FIRST_EVENT_MESSAGE.subMessage}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default EventGuardianHint;
