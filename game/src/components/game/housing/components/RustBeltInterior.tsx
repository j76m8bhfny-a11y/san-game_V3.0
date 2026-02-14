import React, { useState } from 'react';
import { ActiveHousingState } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  housing: ActiveHousingState;
  onSleep: () => void;
  onMoveOut: () => void;
  onClose: () => void;
}

export const RustBeltInterior: React.FC<Props> = ({ housing, onSleep, onMoveOut, onClose }) => {
  const { t } = useI18n();
  const [isTvOn, setIsTvOn] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col p-6 overflow-hidden select-none">
      
      {/* 1. 场景：Motel 内部 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/housing/rust_interior_bg.jpg')",
        }}
      >
        {/* 窗外霓虹灯投射 (百叶窗条纹) */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_50%,rgba(255,0,0,0.1)_50%)] bg-[length:4px_4px] opacity-20 pointer-events-none" />
        
        {/* TV 光效 (开机时) */}
        {isTvOn && (
          <div className="absolute inset-0 bg-blue-500/10 mix-blend-screen animate-flicker pointer-events-none" />
        )}
      </div>

      {/* 2. 右上角：房间状态 (钥匙牌) */}
      <div className="absolute top-6 right-8 rotate-3 z-10">
        <div className="bg-green-800 text-yellow-400 w-24 h-36 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-yellow-500/50">
          <div className="w-2 h-2 bg-black rounded-full mb-2" />
          <span className="text-3xl font-black font-mono">204</span>
          <span className="text-[10px] mt-1 opacity-80 uppercase">Motel 6</span>
        </div>
      </div>

      {/* 3. 左侧：交互区 - 电视机 */}
      <div className="absolute top-1/3 left-10 z-10">
        <button 
          onClick={() => setIsTvOn(!isTvOn)}
          className="group relative w-48 h-40"
        >
          {/* TV 图片 */}
          <img src="/assets/housing/ui_tv_set.png" className="w-full h-full object-contain drop-shadow-2xl" />
          
          {/* 屏幕内容 */}
          <div className="absolute top-[20%] left-[15%] w-[60%] h-[50%] bg-[#111] overflow-hidden rounded-sm">
            {isTvOn ? (
              <div className="w-full h-full bg-[url('/assets/fx/static_noise.gif')] opacity-50 bg-cover mix-blend-screen" />
            ) : (
              <div className="w-full h-full bg-black" />
            )}
            {/* 屏幕反光 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 pointer-events-none" />
          </div>

          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-blue-300 px-2 py-1 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {isTvOn ? '[ TURN OFF ]' : '[ WATCH TV ]'}
          </span>
        </button>
      </div>

      {/* 4. 底部交互栏 */}
      <div className="relative z-10 mt-auto flex justify-center items-end gap-12 pb-4">
        
        {/* 退房按钮 */}
        <button 
          onClick={onMoveOut}
          className="group flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-14 h-14 bg-[#2a2a2a] rounded-lg border-2 border-gray-600 flex items-center justify-center shadow-lg group-hover:border-red-500">
            🔑
          </div>
          <span className="mt-2 bg-black/80 text-red-400 text-xs px-2 py-1 font-mono uppercase">{t('housing.moveOut')}</span>
        </button>

        {/* 睡觉按钮：乱糟糟的床 */}
        <button 
          onClick={onSleep}
          className="group relative w-64 transition-transform hover:scale-105"
        >
          <img src="/assets/housing/ui_messy_bed.png" className="w-full object-contain drop-shadow-2xl" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="font-black text-3xl text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)] uppercase tracking-widest">
               {t('housing.regen')}
             </span>
          </div>
        </button>

        {/* 离开房间按钮 */}
        <button 
          onClick={onClose}
          className="group flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-14 h-14 bg-[#2a2a2a] rounded-lg border-2 border-gray-600 flex items-center justify-center shadow-lg group-hover:border-white">
            🚶
          </div>
          <span className="mt-2 bg-black/80 text-gray-300 text-xs px-2 py-1 font-mono uppercase">{t('common.close')}</span>
        </button>

      </div>
    </div>
  );
};