import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useVisualFilter } from '@/hooks/useVisualFilter';

// Components
import { LayeredScene } from '@/components/game/LayeredScene';
import { MiniHUD } from '@/components/game/MiniHUD';
import { MessageWindow } from '@/components/game/MessageWindow';
import { ShopModal } from '@/components/game/ShopModal';
import { BlackBox } from '@/components/game/BlackBox';
import { PauseMenu } from '@/components/game/PauseMenu';
import { DailySettlement } from '@/components/game/DailySettlement';
import { BillOverlay } from '@/components/game/BillOverlay';
import { GameEnding } from '@/components/game/GameEnding';
import { TitleScreen } from '@/components/game/TitleScreen';
import { InventorySidebar } from '@/components/game/InventorySidebar';
import { RoutineToast } from '@/components/ui/RoutineToast';
import { RoastModal } from '@/components/game/RoastModal';

// FX
import { FeedbackLayer } from '@/components/ui/FeedbackLayer';
import { GlobalAtmosphere } from '@/components/ui/GlobalAtmosphere';
import { TooltipLayer } from '@/components/ui/TooltipLayer';

export default function App() {
  const {
    // 状态
    san, _hasHydrated,
    currentEvent, activeBill, ending, dailySummary,
    
    // UI 开关
    isShopOpen, isMenuOpen, isArchiveOpen,
    
    // Actions
    nextDay, setMenuOpen, setArchiveOpen, resetGame,
    closeDailySummary,
    initializeData // 必须解构出初始化方法
  } = useGameStore();
  
  const { style, className, fontClass } = useVisualFilter();
  const [viewState, setViewState] = useState<'TITLE'|'GAME'>('TITLE');
  
  // 背景图始终需要获取
  const currentBg = currentEvent?.bgImage || "/assets/scenes/bg_street.png";
  
  // 🚨 [关键修改 1] 判断是否需要由 LayeredScene 显示叠加层
  // 逻辑：如果当前有事件 (currentEvent)，则 UI 层(MessageWindow) 会接管插图和主角的渲染。
  // 所以这里设为 false，防止 LayeredScene 画出重复的内容。
  const showOverlayInScene = !currentEvent; 

  // 组件挂载时加载数据 (保留之前的修复)
  useEffect(() => {
    initializeData();
    console.log("App mounted: Initializing game data...");
  }, [initializeData]);
  
  // 0. Loading 状态
  if (!_hasHydrated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[99999]">
        <div className="text-white font-mono animate-pulse tracking-widest">LOADING REALITY...</div>
      </div>
    );
  }
  
  // 1. 结局拦截
  if (ending) {
    return (
      <div className={`${className} ${fontClass}`} style={style}>
        <GlobalAtmosphere />
        <GameEnding endingId={ending} onRestart={resetGame} />
        <FeedbackLayer />
      </div>
    );
  }

  // 2. 标题画面
  if (viewState === 'TITLE') {
    return <TitleScreen onStart={() => setViewState('GAME')} />;
  }

  const isModalOpen = isShopOpen || isArchiveOpen || isMenuOpen || activeBill || dailySummary;

  // 3. 游戏主舞台
  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden bg-black font-sans select-none overscroll-none touch-manipulation ${className} ${fontClass}`} 
      style={style}
    >
      
      {/* --- L6: 全局反馈 --- */}
      <TooltipLayer />
      <RoutineToast />
      <RoastModal />
      <FeedbackLayer />

      {/* --- L5: 强阻断层 (Modals) --- */}
      
      {dailySummary && (
        <DailySettlement 
          isOpen={!!dailySummary} 
          onClose={closeDailySummary} 
        />
      )}

      {/* 突发账单 */}
      {activeBill && (
        <div className="relative z-[45]">
           <BillOverlay bill={activeBill} />
        </div>
      )}

      {/* 侧边栏/商店/档案机 */}
      <InventorySidebar />
      {isShopOpen && <ShopModal isOpen={isShopOpen} onClose={() => useGameStore.getState().setShopOpen(false)} />}
      {isArchiveOpen && <BlackBox onClose={() => setArchiveOpen(false)} />}
      <PauseMenu isOpen={isMenuOpen} onResume={() => setMenuOpen(false)} onRestart={resetGame} />

      {/* 🚨 [关键修改 2] MessageWindow 的位置调整 */}
      {/* 现在 MessageWindow 是全屏 fixed 的，放在这里更清晰。只要有事件且无账单，它就会接管屏幕 */}
      {!activeBill && currentEvent && (
        <MessageWindow event={currentEvent} />
      )}

      {/* --- L4: HUD & 交互层 --- */}
      <div className={`absolute inset-0 z-40 pointer-events-none flex flex-col justify-between transition-all duration-500 ${isModalOpen ? 'blur-sm opacity-50' : ''}`}>
        
        <div className="pointer-events-auto">
           <MiniHUD />
        </div>
        
        <div className="flex-1" />

        <div className="pointer-events-auto pb-6 md:pb-8 flex flex-col items-center">
          
          {/* 原来的 MessageWindow 调用位置已移除，移到了上方 L5 层级附近 */}

          {/* 睡觉按钮：仅在无事发生时显示 */}
          {!activeBill && !currentEvent && !dailySummary && (
             <div className="w-full flex justify-center animate-pulse">
               <button 
                 onClick={nextDay}
                 className="
                   bg-cyan-900/80 border-2 border-cyan-500 text-cyan-100 
                   px-12 py-4 font-pixel text-xl rounded-sm
                   hover:bg-cyan-700 hover:scale-105 active:scale-95 transition-all 
                   shadow-[0_0_20px_rgba(0,255,255,0.3)]
                 "
               >
                 [ ENTER_SLEEP_MODE ]
               </button>
             </div>
          )}
        </div>
      </div>

      {/* --- L1: 氛围滤镜 --- */}
      <div className="relative z-[5] pointer-events-none">
        <GlobalAtmosphere />
      </div>

      {/* --- L0: 视差背景 --- */}
      <div className="absolute inset-0 z-0">
        <LayeredScene 
          bgImage={currentBg}
          
          // 🚨 [修复] 直接传 undefined，因为现在的逻辑是：
          // 1. 如果有事件，MessageWindow 负责显示插图（LayeredScene 不需要显示）。
          // 2. 如果没事件，本来也就没插图。
          // 所以 LayeredScene 只需要负责背景，不再负责前景插图。
          eventImage={undefined} 
          
          // 这里的 playerImage 同理，MessageWindow 负责显示主角
          playerImage={undefined}
          
          isGlitch={san > 70 || san < 20} 
        />
      </div>

    </div>
  );
}