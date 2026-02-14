import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsModal } from './SettingsModal';
import { useI18n } from '@/i18n';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onRestart,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [animationStage, setAnimationStage] = useState<'closed' | 'opening' | 'open'>('closed');
  const { t } = useI18n();

  // 当菜单打开时，自动播放打开动画
  useEffect(() => {
    if (isOpen) {
      setAnimationStage('opening');
      // 延迟后显示内容
      const timer = setTimeout(() => {
        setAnimationStage('open');
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setAnimationStage('closed');
    }
  }, [isOpen]);

  const handleClose = () => {
    setAnimationStage('closed');
    onResume();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/60 p-4">
          
          {/* 档案袋容器 */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative"
            style={{ perspective: '1000px' }}
          >
            {/* 胶带装饰 */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-[rgba(255,255,255,0.3)] transform -rotate-1 pointer-events-none z-30" />

            {/* 档案袋主体 */}
            <motion.div
              className="relative w-[340px] md:w-[440px] bg-[#c9a961] shadow-2xl"
              animate={animationStage !== 'closed' ? { rotateY: -3, x: -10 } : { rotateY: 0, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{
                backgroundImage: `
                  repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px),
                  repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
                `,
                boxShadow: '0 25px 80px rgba(0,0,0,0.5), inset 0 0 120px rgba(0,0,0,0.1)'
              }}
            >
              {/* 纸张纹理 */}
              <div className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
              />

              {/* 档案袋盖子（自动打开动画） */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-40 bg-[#d4b878] origin-top z-20"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
                  backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                initial={{ rotateX: 0 }}
                animate={animationStage !== 'closed' ? { rotateX: 180, zIndex: -1 } : { rotateX: 0, zIndex: 20 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />

              {/* 内容区域 */}
              <div className="relative p-6 min-h-[480px]">
                {animationStage === 'closed' ? (
                  /* 封面 - 显示正在打开中 */
                  <div className="h-full flex flex-col items-center justify-center py-20 relative z-10">
                    <div className="text-[#8b7355] font-mono text-sm tracking-widest">
                      {t('common.loading')}
                    </div>
                  </div>
                ) : animationStage === 'opening' ? (
                  /* 打开中 - 显示红色绕线解开动画 */
                  <div className="h-full flex flex-col items-center justify-center py-20 relative z-10">
                    {/* 红色绕线扣解开的动画 */}
                    <div className="absolute top-20 left-1/2 -translate-x-1/2">
                      <motion.div
                        className="relative"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0, y: -30 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                      >
                        <div className="w-3 h-3 bg-[#8b4513] rounded-full shadow-md" />
                        <svg className="absolute top-2 left-2 w-28 h-16" style={{ overflow: 'visible' }} viewBox="0 0 100 40">
                          <motion.path
                            d="M 5,20 C 30,5 50,35 95,20"
                            stroke="#dc2626"
                            strokeWidth="2.5"
                            fill="none"
                            initial={{ pathLength: 1 }}
                            animate={{ pathLength: 0 }}
                            transition={{ duration: 0.6, ease: 'easeInOut' }}
                          />
                        </svg>
                        <div className="absolute top-8 left-28 w-3 h-3 bg-[#8b4513] rounded-full shadow-md" />
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  /* 完全打开 - 显示内部表单 */
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="pt-4"
                  >
                    <PauseMenuForm 
                      onResume={handleClose}
                      onSettings={() => setShowSettings(true)}
                      onRestart={onRestart}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* 设置弹窗 */}
          <AnimatePresence>
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

// 员工休息申请表组件
const PauseMenuForm: React.FC<{
  onResume: () => void;
  onSettings: () => void;
  onRestart: () => void;
}> = ({ onResume, onSettings, onRestart }) => {
  const { t } = useI18n();

  const menuItems = [
    { 
      id: 'resume', 
      label: t('pauseMenu.resume'), 
      desc: t('pauseMenu.form.resumeDesc'),
      icon: '✓',
      variant: 'default' as const,
      onClick: onResume
    },
    { 
      id: 'settings', 
      label: t('pauseMenu.settings'), 
      desc: t('pauseMenu.form.settingsDesc'),
      icon: '⚙',
      variant: 'default' as const,
      onClick: onSettings
    },
    { 
      id: 'restart', 
      label: t('pauseMenu.restart'), 
      desc: t('pauseMenu.form.restartDesc'),
      icon: '!',
      variant: 'danger' as const,
      onClick: onRestart
    },
  ];

  return (
    <div className="bg-[#f5f5dc] border border-gray-400 p-5 shadow-inner min-h-[420px]">
      {/* 表头 */}
      <div className="border-b-2 border-gray-800 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-gray-900 uppercase tracking-wide">
            {t('pauseMenu.form.title')}
          </h2>
          {/* 机密印章小图标 */}
          <div className="w-12 h-12 border-2 border-red-700 rounded-full flex items-center justify-center opacity-60 transform rotate-12">
            <span className="text-red-700 font-black text-[8px] text-center leading-tight">
              {t('settings.confidential')}
            </span>
          </div>
        </div>
        <p className="font-mono text-[9px] text-gray-600 mt-1">
          {t('pauseMenu.form.omb')} • {t('pauseMenu.form.dept')}
        </p>
      </div>

      {/* 申请人信息 */}
      <div className="grid grid-cols-2 gap-2 text-[10px] border border-gray-400 p-2 bg-gray-50 mb-4">
        <div>
          <span className="font-bold text-gray-600">{t('pauseMenu.form.applicant')}</span>
          <span className="ml-1 font-mono text-gray-800">{t('hud.class.homeless.label')}</span>
        </div>
        <div>
          <span className="font-bold text-gray-600">{t('pauseMenu.form.date')}</span>
          <span className="ml-1 font-mono text-gray-800">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* 菜单选项 - 表格风格 */}
      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            onClick={item.onClick}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`w-full flex items-center gap-3 p-3 border transition-all group
              ${item.variant === 'danger' 
                ? 'bg-[#fff5f5] border-red-200 hover:border-red-500' 
                : 'bg-white border-gray-300 hover:border-[#1a365d] hover:bg-[#f0f7ff]'
              }
            `}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`w-7 h-7 border-2 flex items-center justify-center font-bold text-sm
              ${item.variant === 'danger' 
                ? 'border-red-400 text-red-600' 
                : 'border-gray-400 group-hover:border-[#1a365d]'
              }
            `}>
              {item.icon}
            </div>
            <div className="text-left flex-1">
              <div className={`font-bold text-xs uppercase
                ${item.variant === 'danger' ? 'text-red-700' : 'text-gray-900'}
              `}>
                {item.label}
              </div>
              <div className={`text-[8px]
                ${item.variant === 'danger' ? 'text-red-500' : 'text-gray-500'}
              `}>
                {item.desc}
              </div>
            </div>
            <div className="text-gray-400 text-xs">→</div>
          </motion.button>
        ))}
      </div>

      {/* 底部警告 */}
      <div className="mt-4 pt-3 border-t border-gray-300">
        <p className="text-[9px] text-gray-500 leading-tight">
          <span className="font-bold">{t('pauseMenu.form.note')}</span>
          {' '}{t('pauseMenu.footer')}
        </p>
      </div>

      {/* 条形码 */}
      <div className="mt-4 flex items-end gap-1 h-8 opacity-40">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="bg-black"
            style={{ 
              width: Math.random() > 0.5 ? '2px' : '4px', 
              height: Math.random() > 0.3 ? '100%' : '60%'
            }}
          />
        ))}
      </div>
    </div>
  );
};
