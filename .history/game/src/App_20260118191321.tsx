import React, { useState } from 'react';
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
    nextDay, setMenuOpen, setArchiveOpen, resetGame
  } = useGameStore();
  
  const { style, className, fontClass } = useVisualFilter();
  const [viewState, setViewState] = useState<'TITLE'|'GAME'>('TITLE');
  
  // 0. Loading 状态
  if (!_hasHydrated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[99999]">
        <div className="text-white font-mono animate-pulse tracking-widest">LOADING REALITY...</div>
      </div>
    );
  }
  
  // 1. 结局拦截 (最高优先级，覆盖一切)
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

  // 计算是否有阻断层 (Modal Open)
  const isModalOpen = isShopOpen || isArchiveOpen || isMenuOpen || activeBill || dailySummary;

  // 3. 游戏主舞台
  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden bg-black font-sans select-none overscroll-none touch-manipulation ${className} ${fontClass}`} 
      style={style}
    >
      
      {/* --- L6: 全局反馈与提示 (Z-60+) --- */}
      <TooltipLayer /> {/* Z-60 */}
      <RoutineToast /> {/* Z-50 (Toast) */}
      <RoastModal />   {/* Z-40 (Dynamic Island) */}
      <FeedbackLayer /> {/* Z-30 (全屏闪烁) */}

      {/* --- L5: 强阻断层 (Modals) --- */}
      {/* 每日结算报表 */}
      {dailySummary && (
        <DailySettlement 
          isOpen={showDaily} 
          onClose={() => setShowDaily(false)} 
        />
      )}

      {/* 突发账单 (Bill) - 必须处理 */}
      {activeBill && (
        <div className="relative z-[45]">
           <BillOverlay bill={activeBill} />
        </div>
      )}

      {/* 侧边栏/商店/档案机 */}
      <InventorySidebar />
      {isShopOpen && <ShopModal />}
      {isArchiveOpen && <BlackBox onClose={() => setArchiveOpen(false)} />}
      <PauseMenu isOpen={isMenuOpen} onResume={() => setMenuOpen(false)} onRestart={resetGame} />

      {/* --- L4: HUD & 交互层 (Z-10) --- */}
      {/* 注意：如果 Modal 打开，底层 HUD 应该变模糊且不可点 
         我们使用 pointer-events-none 来穿透点击，但在 Modal 开启时给容器加 blur
      */}
      <div className={`absolute inset-0 z-10 flex flex-col justify-between transition-all duration-500 ${isModalOpen ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
        
        {/* 顶部：MiniHUD */}
        <div className="pointer-events-auto">
           <MiniHUD />
        </div>
        
        {/* 中间：留白 (透视背景) */}
        <div className="flex-1" />

        {/* 底部：交互区 (手机/推进按钮) */}
        <div className="pointer-events-auto pb-6 md:pb-8 flex flex-col items-center">
          
          {/* A. 事件终端 (MessageWindow) */}
          {/* 只有在没有账单且有事件时显示，防止重叠 */}
          {!activeBill && currentEvent && (
            <MessageWindow event={currentEvent} />
          )}

          {/* B. 推进按钮 (Sleep) */}
          {/* 无事件、无账单、无结算时显示 */}
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

      {/* --- L1: 氛围滤镜 (Z-5) --- */}
      {/* 关键：pointer-events-none 确保不遮挡点击 */}
      <div className="relative z-[5] pointer-events-none">
        <GlobalAtmosphere />
      </div>

      {/* --- L0: 视差背景 (Z-0) --- */}
      <div className="absolute inset-0 z-0">
        <LayeredScene 
          bgImage="/assets/scenes/bg_street.png"
          eventImage={currentEvent ? "/assets/scenes/event_placeholder.png" : undefined}
          playerImage="/assets/scenes/player_back.png"
          isGlitch={san > 70 || san < 20} 
        />
      </div>

    </div>
  );
}