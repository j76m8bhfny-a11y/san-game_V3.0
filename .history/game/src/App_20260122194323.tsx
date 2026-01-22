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

// --- UI / FX Components ---
import { GlobalAtmosphere } from './components/ui/GlobalAtmosphere';
import { RoastModal } from './components/game/RoastModal';
import { RoutineToast } from './components/ui/RoutineToast';
import { FeedbackLayer } from './components/ui/FeedbackLayer';
import { TooltipLayer } from './components/ui/TooltipLayer';

const App: React.FC = () => {
  // --- Store Selectors ---
  // 1. 数据与状态
  const initializeData = useGameStore((state) => state.initializeData);
  const _hasHydrated = useGameStore((state) => state._hasHydrated);
  
  const ending = useGameStore((state) => state.ending);
  const activeBill = useGameStore((state) => state.activeBill);
  const dailySummary = useGameStore((state) => state.dailySummary);
  const currentEvent = useGameStore((state) => state.currentEvent); // 获取当前事件以渲染背景
  
  // 2. UI 开关状态
  const isShopOpen = useGameStore((state) => state.isShopOpen);
  const isMenuOpen = useGameStore((state) => state.isMenuOpen);
  
  // 3. Actions (用于传递给组件的回调)
  const setShopOpen = useGameStore((state) => state.setShopOpen);
  const setMenuOpen = useGameStore((state) => state.setMenuOpen);
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
    setViewState('TITLE'); // 重置后返回标题画面
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
        // 修复: 传递 endingId 和 onRestart
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
          {/* 修复: 传递必要的 bgImage, eventImage */}
          {/* 如果没有当前事件，使用默认城市背景 */}
          <LayeredScene 
            bgImage={currentEvent?.bgImage || '/assets/scenes/city_morning.png'} 
            eventImage={currentEvent?.eventImage}
            isGlitch={currentEvent?.options?.D?.isGlitched} 
          />
          
          {/* 游戏内覆盖层 */}
          {/* 修复: 传递 bill 对象 */}
          {activeBill && <BillOverlay bill={activeBill} />}
          
          {/* 修复: 传递 isOpen 和 onClose */}
          {dailySummary && (
            <DailySettlement 
              isOpen={!!dailySummary} 
              onClose={closeDailySummary} 
            />
          )}
        </>
      )}

      {/* L2: 全局功能 UI */}
      {viewState === 'GAME' && !ending && (
        <>
          {/* 修复: 传递 isOpen 和 onClose */}
          {isShopOpen && (
            <ShopModal 
              isOpen={isShopOpen} 
              onClose={() => setShopOpen(false)} 
            />
          )}
          
          {/* 修复: 传递 isOpen, onResume, onRestart (移除了 onQuit) */}
          {isMenuOpen && (
            <PauseMenu 
              isOpen={isMenuOpen} 
              onResume={() => setMenuOpen(false)} 
              onRestart={handleRestart}
            />
          )}
          
          {/* 修复: InventorySidebar 不需要 props，它内部自己连接 Store */}
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