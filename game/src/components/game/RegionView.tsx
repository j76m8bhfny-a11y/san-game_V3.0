import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { SceneManager } from './scenes/SceneManager';
import { useI18n } from '@/i18n';

export const RegionView: React.FC = () => {
  const { t } = useI18n();
  const { 
    currentEvent, 
    setViewMode, 
    // 注意：setShopOpen 等方法现在不需要在这里解构了，
    // 它们已经通过 useGameStore 在 SceneManager 内部的各个 Scene 组件中被调用了。
  } = useGameStore();

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      
      {/* 1. 核心层：沉浸式街景管理器 */}
      {/* SceneManager 会根据 currentRegion 自动渲染 SlumsScene, RustBeltScene 等 */}
      <SceneManager />

      {/* 2. UI 覆盖层：功能按钮 */}
      {/* 仅保留全局导航按钮，其他交互都已"实体化"进场景中 */}
      {!currentEvent && (
        <div className="absolute top-8 right-8 z-50 pointer-events-auto">
           <button 
             onClick={() => setViewMode('MAP')}
             className="
               group flex items-center gap-3 px-5 py-2 
               backdrop-solid-dark 
               border border-white/10 rounded-sm 
               hover:bg-white/10 hover:border-white/40 
               transition-all duration-300 shadow-pixel-sm
             "
           >
             <span className="text-xl group-hover:scale-110 transition-transform">🗺️</span>
             <span className="font-pixel text-xs text-white/80 tracking-widest group-hover:text-white">
               {t('map.title')}
             </span>
           </button>
        </div>
      )}

      {/* 3. 事件遮罩层 */}
      {/* 当触发剧情事件时，让街景变暗模糊，突显 App.tsx 里的 MessageWindow */}
      {currentEvent && (
        <div className="absolute inset-0 z-40 backdrop-solid-dark transition-opacity duration-500" />
      )}

      {/* 4. 氛围层：全局暗角 (Vignette) */}
      {/* 给整个屏幕加一个电影感的暗角，增强沉浸感 */}
      <div className="absolute inset-0 z-30 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />

    </div>
  );
};