/**
 * SystemAlertModal - 打破第四面墙的系统弹窗
 * 
 * 当System Gaze触发惩罚事件时，不使用普通事件卡片
 * 而是使用与游戏UI完全违和的系统警告弹窗
 * 
 * 特点：
 * - 黑底红字（中文）/ 黑底绿字（英文）
 * - 系统默认字体，直角边框
 * - 打字机效果
 * - 无法关闭，必须点击确认
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';

export type AlertType = 'irsAudit' | 'creditFreeze' | 'algorithmBan' | 'mediaSmear' | 'generic';

interface SystemAlertModalProps {
  isOpen: boolean;
  type: AlertType;
  playerId?: string;
  onConfirm: () => void;
  // 最小阅读时间（毫秒），防止秒点
  minReadTime?: number;
}

/**
 * 打字机效果Hook
 */
const useTypewriter = (text: string, isActive: boolean, speed: number = 30) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (!isActive) {
      setDisplayText('');
      setIsComplete(false);
      return;
    }
    
    let index = 0;
    setDisplayText('');
    setIsComplete(false);
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.substring(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, isActive, speed]);
  
  return { displayText, isComplete };
};

/**
 * 系统警告弹窗
 */
export const SystemAlertModal: React.FC<SystemAlertModalProps> = ({
  isOpen,
  type,
  playerId,
  onConfirm,
  minReadTime = 2000,
}) => {
  const { t, locale } = useI18n();
  const isZh = locale === 'zh-CN';
  
  const [canConfirm, setCanConfirm] = useState(false);
  const [confirmPressed, setConfirmPressed] = useState(false);
  
  // 获取本地化内容
  const title = t(`systemAlert.${type}.title`);
  const message = t(`systemAlert.${type}.message`, { id: playerId || 'UNKNOWN' });
  const consequence = t(`systemAlert.${type}.consequence`);
  const confirmText = t(`systemAlert.${type}.confirm`);
  const footer = t(`systemAlert.${type}.footer`);
  
  // 打字机效果
  const { displayText: typedMessage, isComplete: messageComplete } = useTypewriter(
    message, 
    isOpen, 
    40
  );
  
  // 最小阅读时间控制
  useEffect(() => {
    if (!isOpen) {
      setCanConfirm(false);
      setConfirmPressed(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setCanConfirm(true);
    }, minReadTime);
    
    return () => clearTimeout(timer);
  }, [isOpen, minReadTime]);
  
  // 处理确认
  const handleConfirm = () => {
    if (!canConfirm) return;
    
    setConfirmPressed(true);
    
    // 播放确认音效
    setTimeout(() => {
      onConfirm();
    }, 200);
  };
  
  // 样式配置（根据语言区分）
  const styles = isZh
    ? {
        // 中文：黑底红字，硬朗边框
        container: 'bg-black border-2 border-red-600',
        title: 'text-red-500',
        text: 'text-red-400',
        accent: 'text-red-300',
        button: 'bg-red-700 hover:bg-red-600 text-white',
        buttonDisabled: 'bg-gray-800 text-gray-600 cursor-not-allowed',
        footer: 'text-red-600/60',
        glow: 'shadow-[0_0_30px_rgba(220,38,38,0.4)]',
      }
    : {
        // 英文：黑底绿字，CRT风格
        container: 'bg-black border-2 border-green-600',
        title: 'text-green-500',
        text: 'text-green-400',
        accent: 'text-green-300',
        button: 'bg-green-700 hover:bg-green-600 text-black',
        buttonDisabled: 'bg-gray-800 text-gray-600 cursor-not-allowed',
        footer: 'text-green-600/60',
        glow: 'shadow-[0_0_30px_rgba(34,197,94,0.4)]',
      };
  
  // 字体配置
  const fontFamily = isZh
    ? 'font-["SimHei","Microsoft_YaHei","Noto_Sans_SC",monospace]'
    : 'font-["Courier_New","Consolas",monospace]';
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 扫描线效果 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className={`absolute left-0 right-0 h-px ${isZh ? 'bg-red-500/20' : 'bg-green-500/20'}`}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        {/* 主弹窗 */}
        <motion.div
          initial={false}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`
            relative w-full max-w-lg mx-4 p-6 ${styles.container} ${styles.glow}
            ${fontFamily}
          `}
          style={{ borderRadius: 0 }}
        >
          {/* 标题栏 */}
          <div className="border-b border-current border-opacity-30 pb-3 mb-4">
            <h2 className={`text-xl font-bold tracking-wider ${styles.title}`}>
              {title}
            </h2>
          </div>
          
          {/* 内容区 */}
          <div className="space-y-4 mb-6">
            {/* 消息（打字机效果） */}
            <div className={`text-base leading-relaxed ${styles.text}`}>
              {typedMessage}
              {!messageComplete && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-2 h-4 ml-1 bg-current"
                />
              )}
            </div>
            
            {/* 后果警告 */}
            <AnimatePresence mode="wait">
              {messageComplete && (
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  className={`pl-4 border-l-2 ${isZh ? 'border-red-600' : 'border-green-600'}`}
                >
                  <p className={`text-sm ${styles.accent}`}>
                    {consequence}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* 按钮区 */}
          <div className="flex justify-end">
            <motion.button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`
                px-6 py-2 text-sm font-bold tracking-wider
                transition-all duration-200
                ${canConfirm ? styles.button : styles.buttonDisabled}
              `}
              style={{ borderRadius: 0 }}
              whileTap={canConfirm ? { scale: 0.95 } : {}}
              animate={confirmPressed ? { scale: [1, 0.9, 1] } : {}}
            >
              {canConfirm ? (
                confirmText
              ) : (
                <span className="animate-pulse">...</span>
              )}
            </motion.button>
          </div>
          
          {/* 底部系统信息 */}
          <div className={`mt-4 pt-3 border-t border-current border-opacity-20 text-[10px] ${styles.footer}`}>
            <div className="flex justify-between">
              <span>{footer}</span>
              <span>{new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
          
          {/* 装饰性角落标记 */}
          <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${isZh ? 'border-red-600' : 'border-green-600'}`} />
          <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${isZh ? 'border-red-600' : 'border-green-600'}`} />
          <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${isZh ? 'border-red-600' : 'border-green-600'}`} />
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${isZh ? 'border-red-600' : 'border-green-600'}`} />
        </motion.div>
        
        {/* 背景噪点 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default SystemAlertModal;
