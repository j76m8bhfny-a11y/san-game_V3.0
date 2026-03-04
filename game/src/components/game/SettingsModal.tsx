import React, { useState } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { motion } from 'framer-motion';
import { DebugPanel } from './DebugPanel';


interface SettingsModalProps {
  onClose: () => void;
}

// 档案袋组件
const ManilaEnvelope: React.FC<{
  isOpen: boolean;
  children: React.ReactNode;
  onOpen: () => void;
}> = ({ isOpen, children, onOpen }) => {
  const { t } = useI18n();
  const [showContent, setShowContent] = useState(isOpen);

  React.useEffect(() => {
    if (isOpen) {
      setShowContent(true);
    }
  }, [isOpen]);

  const handleOpen = () => {
    onOpen();
    setTimeout(() => setShowContent(true), 800);
  };

  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      {/* 档案袋背面 */}
      <motion.div
        className="relative w-[360px] md:w-[480px] bg-[#c9a961] shadow-2xl"
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
          `,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 0 100px rgba(0,0,0,0.1)'
        }}
        animate={isOpen ? { rotateY: -5, x: -20 } : { rotateY: 0, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        {/* 档案袋纹理 */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* 档案袋内容区 */}
        <div className="relative p-8 min-h-[480px]">
          {showContent && isOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {children}
            </motion.div>
          ) : (
            /* 档案袋封面 */
            <div className="h-full flex flex-col justify-between py-8">
              {/* 顶部：机密标记 */}
              <div className="flex justify-between items-start">
                {/* 国土安全部徽章 */}
                <div className="w-20 h-20 bg-[#1a365d] rounded-full flex items-center justify-center border-4 border-[#c9a961] shadow-lg">
                  <div className="text-center text-white text-[8px] leading-tight">
                    <div className="font-bold">DHS</div>
                    <div className="scale-75">🇺🇸</div>
                  </div>
                </div>

                {/* 机密印章 */}
                <div className="transform rotate-12">
                  <div className="w-24 h-24 border-4 border-red-700 rounded-full flex items-center justify-center opacity-80"
                    style={{ borderStyle: 'double', borderWidth: '6px' }}
                  >
                    <div className="text-red-700 font-black text-xs text-center leading-tight">
                      {t('settings.confidential')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 中央：点击打开提示 */}
              {!isOpen && (
                <motion.button
                  onClick={handleOpen}
                  className="self-center px-8 py-4 bg-[#8b7355] hover:bg-[#7a6548] text-[#f5f5dc] font-mono text-sm tracking-widest border-2 border-[#5a4a35] shadow-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('settings.openEnvelope')}
                </motion.button>
              )}

              {/* 底部：条形码和编号 */}
              <div className="space-y-2">
                {/* 条形码 */}
                <div className="flex items-end gap-1 h-12 opacity-60">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-black"
                      style={{ width: Math.random() > 0.5 ? '3px' : '6px', height: '100%' }}
                    />
                  ))}
                </div>
                <div className="font-mono text-xs text-black/60 tracking-wider">
                  SAVE-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 档案袋盖子（打开动画） */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-32 bg-[#d4b878] origin-top"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
          }}
          animate={isOpen ? { rotateX: 180, zIndex: -1 } : { rotateX: 0, zIndex: 10 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />

        {/* 红色绕线扣 */}
        {!isOpen && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
            {/* 绕线动画 */}
            <motion.div
              className="relative"
              animate={isOpen ? { opacity: 0, y: -50 } : { opacity: 1, y: 0 }}
              transition={{ delay: isOpen ? 0 : 0.5, duration: 0.5 }}
            >
              {/* 按钮底座 */}
              <div className="w-4 h-4 bg-[#8b4513] rounded-full shadow-lg" />
              {/* 红线 */}
              <svg className="absolute top-2 left-2 w-32 h-20 pointer-events-none" style={{ overflow: 'visible' }}>
                <motion.path
                  d="M 0,0 C 30,-10 60,20 100,0"
                  stroke="#dc2626"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 1 }}
                  animate={isOpen ? { pathLength: 0 } : { pathLength: 1 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
              </svg>
              {/* 另一端按钮 */}
              <div className="absolute top-8 left-28 w-4 h-4 bg-[#8b4513] rounded-full shadow-lg" />
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// 移民表格组件
const ImmigrationForm: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { t, locale, setLocale } = useI18n();
  const { volume, setVolume, muted, toggleMute } = useAudioStore();
  const [activeSection, setActiveSection] = useState<'audio' | 'display' | 'language'>('audio');

  const formSections = [
    { id: 'audio', label: t('settings.form.audio'), number: '1' },
    { id: 'display', label: t('settings.form.display'), number: '2' },
    { id: 'language', label: t('settings.form.language'), number: '3' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* 表头 */}
      <div className="border-b-2 border-black pb-2 mb-4">
        <h2 className="font-pixel text-lg font-bold text-black">
          {t('settings.form.title')}
        </h2>
        <p className="font-mono text-[10px] text-gray-600 mt-1">
          {t('settings.form.omb')} • {t('settings.form.expires')}
        </p>
      </div>

      {/* 申请人信息栏 */}
      <div className="grid grid-cols-2 gap-2 text-xs border border-gray-400 p-2 bg-gray-50">
        <div>
          <span className="font-bold text-gray-600">{t('settings.form.applicant')}</span>
          <span className="ml-2 font-mono">{t('hud.class.homeless.label')}</span>
        </div>
        <div>
          <span className="font-bold text-gray-600">{t('settings.form.date')}</span>
          <span className="ml-2 font-mono">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* 表格分区 */}
      <div className="space-y-3">
        {formSections.map((section) => (
          <div key={section.id} className="border border-gray-800">
            {/* 分区标题 */}
            <button
              onClick={() => setActiveSection(section.id)}
              className="w-full flex items-center justify-between p-2 bg-[#f0ece0] border-b border-gray-400"
            >
              <span className="font-bold text-xs text-gray-800">{section.label}</span>
              <span className="font-mono text-xs bg-gray-800 text-white px-2 py-0.5">
                {activeSection === section.id ? '[-]' : '[+]'}
              </span>
            </button>

            {/* 分区内容 */}
            {activeSection === section.id && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className="p-3 space-y-3 bg-white"
              >
                {/* AUDIO 部分 */}
                {section.id === 'audio' && (
                  <>
                    {/* 音量 */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 block">
                        {t('settings.audio.volume')} ({volume}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-2 bg-gray-300 appearance-none"
                        style={{ accentColor: '#1a365d' }}
                      />
                    </div>

                    {/* 静音开关 */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={muted}
                        onChange={toggleMute}
                        className="w-4 h-4 border-2 border-gray-800"
                      />
                      <span className="text-xs">{t('settings.audio.bgm')}</span>
                    </div>
                  </>
                )}

                {/* DISPLAY 部分 */}
                {section.id === 'display' && (
                  <div className="space-y-2">
                    {['reality', 'delusion', 'simulation'].map((mode) => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="display" className="w-4 h-4" defaultChecked={mode === 'reality'} />
                        <span className="text-xs">{t(`settings.display.${mode}`)}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* LANGUAGE 部分 */}
                {section.id === 'language' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(['zh-CN', 'en-US'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLocale(lang)}
                        className={`p-2 border text-left text-xs transition-all
                          ${locale === lang
                            ? 'border-[#1a365d] bg-[#1a365d] text-white'
                            : 'border-gray-400 hover:border-gray-600'
                          }
                        `}
                      >
                        {t(`settings.languageOptions.${lang}`)}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* 底部警告 */}
      <div className="bg-[#fef3a8] border border-yellow-600 p-2 text-[10px] text-yellow-800">
        <span className="font-bold">{t('settings.form.warning')}</span>
        {' '}
        {t('settings.form.warningText')}
      </div>

      {/* 签名栏 */}
      <div className="border-t-2 border-black pt-4">
        <div className="flex items-end justify-between">
          <div className="flex-1 border-b border-gray-400 pb-1 mr-4">
            <span className="text-xs text-gray-500">{t('settings.form.signature')}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1a365d] text-white font-bold text-xs hover:bg-[#0f1f3a] transition-colors"
          >
            {t('common.submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/70 p-4">
      {showDebug && <DebugPanel onClose={() => setShowDebug(false)} />}

      <ManilaEnvelope isOpen={isOpen} onOpen={() => setIsOpen(true)}>
        <ImmigrationForm onClose={onClose} />
      </ManilaEnvelope>

      {/* 开发者入口 - 隐藏角落 */}
      <button
        onClick={() => setShowDebug(true)}
        className="absolute bottom-4 right-4 w-8 h-8 opacity-0 hover:opacity-30 transition-opacity"
      />
    </div>
  );
};
