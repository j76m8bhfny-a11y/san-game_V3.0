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
    
    // UI 开关 (✅ 现在的控制源)
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

      {/* --- L3: 账单覆盖层 --- */}
      {activeBill && (
        <BillOverlay bill={activeBill} onPay={() => {/* 待实装支付逻辑 */}} />
      )}

      {/* --- L2: 弹窗层 --- */}
      {/* 每日结算 */}
      {dailySummary && (
        <DailySettlement 
          data={dailySummary} 
          onNextDay={nextDay} // 点击后才会真正进入下一天
        />
      )}
      
      {/* 商店 */}
      {isShopOpen && <ShopModal />}
      
      {/* ✅ 档案机 (BlackBox) */}
      {isArchiveOpen && (
        <BlackBox onClose={() => setArchiveOpen(false)} />
      )}
      
      {/* ✅ 系统菜单 */}
      <PauseMenu 
        isOpen={isMenuOpen} 
        onResume={() => setMenuOpen(false)} 
        onRestart={resetGame} 
      />

      {/* --- L1: HUD & 控制台 --- */}
      <div className={`relative z-10 transition-all duration-500 ${isShopOpen || isArchiveOpen || isMenuOpen ? 'blur-sm scale-[0.98] opacity-60' : ''}`}>
        <MiniHUD />
        {!activeBill && currentEvent && <MessageWindow event={currentEvent} />}
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