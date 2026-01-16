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
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Win95 风格窗口 */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#c0c0c0] border-2 border-white border-r-black border-b-black shadow-[10px_10px_0_rgba(0,0,0,0.5)] flex flex-col font-sans"
      >
        
        {/* 标题栏 */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center select-none bg-gradient-to-r from-[#000080] to-[#1084d0]">
          <span className="font-bold text-sm tracking-wide">Control Panel - System Properties</span>
          <button 
            onClick={onClose}
            className="w-5 h-5 bg-[#c0c0c0] text-black text-xs font-bold border border-white border-r-black border-b-black active:border-l-black active:border-t-black active:border-r-white active:border-b-white flex items-center justify-center leading-none"
          >
            ×
          </button>
        </div>

        {/* 菜单栏 */}
        <div className="flex gap-4 px-3 py-1 text-sm text-black border-b border-gray-400">
          <span className="underline cursor-pointer">F</span>ile
          <span className="underline cursor-pointer">V</span>iew
          <span className="underline cursor-pointer">H</span>elp
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6 text-black">
          
          {/* 1. 音频设置 */}
          <fieldset className="border border-white border-l-gray-500 border-t-gray-500 p-4 relative">
            <legend className="px-1 text-sm">Audio_Stream</legend>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm">Broadcast Volume:</label>
                <div className="font-mono bg-white border border-gray-600 px-2 w-12 text-center">{volume}%</div>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#000080] h-4 cursor-pointer"
              />
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="mute" 
                  checked={muted} 
                  onChange={toggleMute}
                  className="w-4 h-4 border-2 border-gray-600" 
                />
                <label htmlFor="mute" className="text-sm cursor-pointer select-none">Mute Background Noise</label>
              </div>
            </div>
          </fieldset>

          {/* 2. 画质/分辨率 (彩蛋) */}
          <fieldset className="border border-white border-l-gray-500 border-t-gray-500 p-4 relative">
            <legend className="px-1 text-sm">Render_Mode</legend>
            
            <div className="flex flex-col gap-2">
              {['REALITY (1080p)', 'DELUSION (4K)', 'SIMULATION (8-bit)'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="res" 
                    checked={resolution === opt.split(' ')[0]} 
                    onChange={() => setResolution(opt.split(' ')[0])}
                    className="accent-[#000080]" 
                  />
                  <span className="text-sm group-hover:underline">{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
          
          <div className="bg-yellow-100 border border-yellow-600 p-2 text-[10px] flex gap-2 items-start">
            <span>⚠️</span>
            <span>WARNING: Changing reality settings may cause cognitive dissonance. Management is watching.</span>
          </div>

        </div>

        {/* 底部按钮 */}
        <div className="p-4 flex justify-end gap-3 border-t border-gray-400">
          <button 
            onClick={onClose}
            className="px-6 py-1 border-2 border-white border-r-black border-b-black active:border-l-black active:border-t-black text-sm active:bg-gray-300"
          >
            Apply
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-1 border-2 border-white border-r-black border-b-black active:border-l-black active:border-t-black text-sm font-bold active:bg-gray-300 ring-1 ring-black ring-offset-1"
          >
            OK
          </button>
        </div>

      </motion.div>
    </div>
  );
};