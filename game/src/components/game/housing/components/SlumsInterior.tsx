import React from 'react';
import { ActiveHousingState } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  housing: ActiveHousingState;
  onSleep: () => void;
  onMoveOut: () => void;
  onClose: () => void;
}

export const SlumsInterior: React.FC<Props> = ({ housing, onSleep, onMoveOut, onClose }) => {
  const { t } = useI18n();
  return (
    <div className="relative w-full h-full flex flex-col p-6 overflow-hidden select-none">
      
      {/* 1. 场景：帐篷内部 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/housing/slums_interior_bg.jpg')",
        }}
      >
        {/* 动态光影：模拟外面路灯透过防水布的晃动 */}
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply animate-pulse-slow" />
        <div className="absolute inset-0 bg-black/50 radial-vignette" /> 
      </div>

      {/* 2. 左上角：状态栏 (用胶带贴在帐篷布上) */}
      <div className="relative z-10 self-start transform rotate-1">
        <div className="bg-yellow-100/90 text-black px-4 py-3 shadow-pixel-sm border-2 border-white/50 clip-tape">
          <h2 className="text-xl font-marker font-bold uppercase border-b border-black/20 pb-1 mb-1">
            {t('housing.title')}
          </h2>
          <div className="text-xs font-mono space-y-1">
            <div className="flex items-center gap-2">
              <span>💤 REST:</span>
              <span className="font-bold text-green-700">HP +{housing.regenHp}/night</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🛡️ SAFE:</span>
              <span className="font-bold text-orange-700">{t('housing.low')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 底部交互区 */}
      <div className="relative z-10 mt-auto flex justify-between items-end w-full px-8 pb-4">
        
        {/* 拆除按钮：像是一个垃圾桶图标 */}
        <button 
          onClick={onMoveOut}
          className="flex flex-col items-center group opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 bg-black/50 rounded-sm flex items-center justify-center border border-white/20 group-hover:bg-red-900/50 group-hover:border-red-500 transition-colors">
            🗑️
          </div>
          <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase bg-black/80 px-1">{t('housing.moveOut')}</span>
        </button>

        {/* 睡觉按钮：像是一个破旧的睡袋 */}
        <button 
          onClick={onSleep}
          className="flex flex-col items-center group transform transition-transform hover:scale-105"
        >
          <div className="relative w-24 h-24">
            {/* 睡袋图标/图片 */}
            <div className="absolute inset-0 bg-orange-600/20 rounded-sm blur-xl group-hover:bg-orange-500/40 transition-colors" />
            <img src="/assets/housing/ui_sleeping_bag.png" className="relative z-10 w-full h-full object-contain drop-shadow-pixel-sm render-pixelated" />
          </div>
          <span className="text-lg text-orange-200 font-marker mt-[-10px] relative z-20 text-shadow">
            {t('housing.regen')}
          </span>
        </button>

        {/* 离开按钮 */}
        <button 
          onClick={onClose}
          className="flex flex-col items-center group opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 bg-black/50 rounded-sm flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
            🚪
          </div>
          <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase bg-black/80 px-1">{t('common.close')}</span>
        </button>
      </div>

    </div>
  );
};