import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { motion } from 'framer-motion';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { volume, setVolume, muted, toggleMute } = useAudioStore();
  const [resolution, setResolution] = useState('REALITY');

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      {/* iOS 风格面板 */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-sm bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden font-sans text-slate-900 dark:text-white"
      >
        
        {/* 标题栏 */}
        <div className="px-6 py-5 border-b border-gray-200/50 dark:border-white/10 flex justify-between items-center">
          <span className="font-bold text-lg tracking-tight">Settings</span>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-8">
          
          {/* 1. 音频设置 (iOS Slider 风格) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Audio</label>
              <span className="text-xs font-mono bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                {muted ? 'MUTED' : `${volume}%`}
              </span>
            </div>

            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 space-y-4">
              {/* 音量滑块 */}
              <div className="relative w-full h-6 flex items-center">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume} 
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              
              {/* 静音开关 (iOS Toggle) */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Background Noise</span>
                <button 
                  onClick={toggleMute}
                  className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${muted ? 'bg-gray-300' : 'bg-green-500'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${muted ? 'left-1' : 'translate-x-6 left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 2. 现实渲染模式 (分组列表风格) */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Reality Rendering</label>
            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden">
              {['REALITY (1080p)', 'DELUSION (4K)', 'SIMULATION (8-bit)'].map((opt, idx) => (
                <button
                  key={opt}
                  onClick={() => setResolution(opt.split(' ')[0])}
                  className={`w-full text-left px-4 py-3 text-sm font-medium flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors
                    ${idx !== 2 ? 'border-b border-gray-200/50 dark:border-white/5' : ''}
                  `}
                >
                  {opt}
                  {resolution === opt.split(' ')[0] && <span className="text-blue-500 font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-[10px] text-gray-400 text-center leading-relaxed px-4">
            Changes to reality perception may result in permanent cognitive dissonance. Proceed with caution.
          </div>

        </div>

      </motion.div>
    </div>
  );
};