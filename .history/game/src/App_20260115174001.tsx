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

// FX
import { FeedbackLayer } from '@/components/ui/FeedbackLayer';
import { GlobalAtmosphere } from '@/components/ui/GlobalAtmosphere';
import { TooltipLayer } from '@/components/ui/TooltipLayer';

export default function App() {
  const {
    // 状态
    day, san, _hasHydrated,
    currentEvent, activeBill, ending, dailySummary,
    
    // UI 开关
    isShopOpen, isMenuOpen, isArchiveOpen,
    
    // Actions
    nextDay, setMenuOpen, setArchiveOpen, resetGame
  } = useGameStore();
  
  const { style, className, fontClass } = useVisualFilter();
  const [viewState, setViewState] = useState<'TITLE'|'GAME'>('GAME');

  // 防水闸
  if (!_hasHydrated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[99999]">
        <div className="text-white font-mono animate-pulse tracking-widest">LOADING...</div>
      </div>
    );
  }
  
  // 1. 结局拦截
  if (ending) {
    return (
      <>
        <GlobalAtmosphere />
        <GameEnding endingId={ending} onRestart={resetGame} />
        <FeedbackLayer />
      </>
    );
  }

  // 2. 标题画面
  if (viewState === 'TITLE') {
    return <TitleScreen onStart={() => setViewState('GAME')} />;
  }

  // 3. 游戏主舞台
  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-black font-sans select-none ${className} ${fontClass}`} style={style}>
      
      <TooltipLayer />
      <GlobalAtmosphere />
      <FeedbackLayer />

      {/* --- L3: 账单覆盖层 (优先级高) --- */}
      {activeBill && (
        <BillOverlay bill={activeBill} /> // 内部直接调用 Store resolveBill
      )}

      {/* --- L2: 弹窗层 --- */}
      {/* 每日结算 (修复: 点击只关闭弹窗，不重复触发下一天) */}
      {dailySummary && (
        <DailySettlement 
          data={dailySummary} 
          onNextDay={() => useGameStore.setState({ dailySummary: null })} 
        />
      )}
      
      {/* 商店 */}
      {isShopOpen && <ShopModal />}
      
      {/* 档案机 */}
      {isArchiveOpen && (
        <BlackBox onClose={() => setArchiveOpen(false)} />
      )}
      
      {/* 系统菜单 */}
      <PauseMenu 
        isOpen={isMenuOpen} 
        onResume={() => setMenuOpen(false)} 
        onRestart={resetGame} 
      />

      {/* --- L1: HUD & 控制台 --- */}
      <div className={`relative z-10 transition-all duration-500 ${isShopOpen || isArchiveOpen || isMenuOpen ? 'blur-sm scale-[0.98] opacity-60' : ''}`}>
        <MiniHUD />
        
        {/* 情况 A: 有事件，显示终端 */}
        {!activeBill && currentEvent && <MessageWindow event={currentEvent} />}

        {/* 情况 B: 待机状态 (无事件且无账单)，显示推进按钮 (✅ New) */}
        {!activeBill && !currentEvent && (
           <div className="absolute bottom-10 left-0 right-0 flex justify-center pb-8 animate-pulse">
             <button 
               onClick={nextDay}
               className="bg-cyan-900/80 border-2 border-cyan-500 text-cyan-100 px-12 py-4 font-pixel text-xl hover:bg-cyan-700 hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)]"
             >
               [ ENTER_SLEEP_MODE ]
             </button>
           </div>
        )}
      </div>

      {/* --- L0: 背景 --- */}
      <div className="absolute inset-0 z-0">
        <LayeredScene 
          bgImage="/assets/scenes/bg_street.png"
          eventImage="/assets/scenes/event_placeholder.png"
          playerImage="/assets/scenes/player_back.png"
          isGlitch={san > 70 || san < 20} 
        />
      </div>

    </div>
  );
}