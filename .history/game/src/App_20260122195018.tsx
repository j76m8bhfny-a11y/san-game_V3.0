import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';

// --- Game Components ---
import { TitleScreen } from './components/game/TitleScreen';
import { LayeredScene } from './components/game/LayeredScene';
import { GameEnding } from './components/game/GameEnding';
import { BillOverlay } from './components/game/BillOverlay';
import { ShopModal } from './components/game/ShopModal';
import { InventorySidebar } from './components/game/InventorySidebar';
import { PauseMenu } from './components/game/PauseMenu';
import { DailySettlement } from './components/game/DailySettlement';
// 👇 新增引入：缺失的核心组件
import { MessageWindow } from './components/game/MessageWindow';
import { MiniHUD } from './components/game/MiniHUD';
import { BlackBox } from './components/game/BlackBox';

// --- UI / FX Components ---
import { GlobalAtmosphere } from './components/ui/GlobalAtmosphere';
import { RoastModal } from './components/game/RoastModal';
import { RoutineToast } from './components/ui/RoutineToast';
import { FeedbackLayer } from './components/ui/FeedbackLayer';
import { TooltipLayer } from './components/ui/TooltipLayer';

const App: React.FC = () => {
  // --- Store Selectors ---
  const initializeData = useGameStore((state) => state.initializeData);
  const _hasHydrated = useGameStore((state) => state._hasHydrated);
  
  const ending = useGameStore((state) => state.ending);
  const activeBill = useGameStore((state) => state.activeBill);
  const dailySummary = useGameStore((state) => state.dailySummary);
  const currentEvent = useGameStore((state) => state.currentEvent);
  
  // UI 开关状态
  const isShopOpen = useGameStore((state) => state.isShopOpen);
  const isMenuOpen = useGameStore((state) => state.isMenuOpen);
  const isArchiveOpen = useGameStore((state) => state.isArchiveOpen); // 👈 新增
  
  // Actions
  const setShopOpen = useGameStore((state) => state.setShopOpen);
  const setMenuOpen = useGameStore((state) => state.setMenuOpen);
  const setArchiveOpen = useGameStore((state) => state.setArchiveOpen); // 👈 新增
  const closeDailySummary = useGameStore((state) => state.closeDailySummary);
  const resetGame = useGameStore((state) => state.resetGame);

  // --- Local State ---
  const [viewState, setViewState] = useState<'TITLE' | 'GAME'>('TITLE');

  // --- Initialization ---
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // --- Handlers ---
  const handleRestart = () => {
    resetGame();
    setViewState('TITLE');
  };

  // --- Render Helpers ---
  if (!_hasHydrated) {
    return (
      <div className="w-screen h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="animate-pulse">SYSTEM INITIALIZING...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-green-500 font-mono select-none">
      
      {/* L0: 全局氛围/背景特效 */}
      <GlobalAtmosphere />

      {/* L1: 主内容层 */}
      {ending ? (
        // 结局画面
        <GameEnding 
          endingId={ending} 
          onRestart={handleRestart} 
        />
      ) : viewState === 'TITLE' ? (
        // 标题画面
        <TitleScreen onStart={() => setViewState('GAME')} />
      ) : (
        // 游戏主循环画面
        <>
          {/* 1. 背景层 */}
          <LayeredScene 
            bgImage={currentEvent?.bgImage || '/assets/scenes/city_morning.png'} 
            eventImage={currentEvent?.eventImage}
            isGlitch={currentEvent?.options?.D?.isGlitched} 
          />
          
          {/* 2. 核心 UI 层 (之前漏掉的！) */}
          <MiniHUD /> 
          {currentEvent && <MessageWindow event={currentEvent} />}
          
          {/* 3. 模态覆盖层 */}
          {activeBill && <BillOverlay bill={activeBill} />}
          
          {dailySummary && (
            <DailySettlement 
              isOpen={!!dailySummary} 
              onClose={closeDailySummary} 
            />
          )}
        </>
      )}

      {/* L2: 全局功能 UI (商店、菜单、背包、档案) */}
      {viewState === 'GAME' && !ending && (
        <>
          {isShopOpen && (
            <ShopModal 
              isOpen={isShopOpen} 
              onClose={() => setShopOpen(false)} 
            />
          )}
          
          {isMenuOpen && (
            <PauseMenu 
              isOpen={isMenuOpen} 
              onResume={() => setMenuOpen(false)} 
              onRestart={handleRestart}
            />
          )}
          
          {isArchiveOpen && ( // 👈 新增档案查看器
             <BlackBox onClose={() => setArchiveOpen(false)} />
          )}
          
          <InventorySidebar />
        </>
      )}

      {/* L3: 反馈与特效层 */}
      <RoastModal />
      <RoutineToast />
      <FeedbackLayer />
      <TooltipLayer />

      {/* L4: CRT 扫描线滤镜 */}
      <div className="pointer-events-none fixed inset-0 bg-scanlines opacity-10 z-[100]"></div>
    </div>
  );
};

export default App;