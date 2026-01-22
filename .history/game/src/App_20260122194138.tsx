import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';

// --- Game Components (改为命名导入) ---
import { TitleScreen } from './components/game/TitleScreen';
import { LayeredScene } from './components/game/LayeredScene';
import { GameEnding } from './components/game/GameEnding';
import { BillOverlay } from './components/game/BillOverlay';
import { ShopModal } from './components/game/ShopModal';
import { InventorySidebar } from './components/game/InventorySidebar';
import { PauseMenu } from './components/game/PauseMenu';
import { DailySettlement } from './components/game/DailySettlement';

// --- UI / FX Components (改为命名导入) ---
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
  
  const isShopOpen = useGameStore((state) => state.isShopOpen);
  const isMenuOpen = useGameStore((state) => state.isMenuOpen);
  const isInventoryOpen = useGameStore((state) => state.isInventoryOpen);

  // --- Local State ---
  const [viewState, setViewState] = useState<'TITLE' | 'GAME'>('TITLE');

  // --- Initialization ---
  useEffect(() => {
    initializeData();
  }, [initializeData]);

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
        <GameEnding />
      ) : viewState === 'TITLE' ? (
        // 标题画面
        <TitleScreen onStart={() => setViewState('GAME')} />
      ) : (
        // 游戏主循环画面
        <>
          <LayeredScene />
          
          {/* 游戏内覆盖层 */}
          {activeBill && <BillOverlay />}
          {dailySummary && <DailySettlement />}
        </>
      )}

      {/* L2: 全局功能 UI */}
      {viewState === 'GAME' && !ending && (
        <>
          {isShopOpen && <ShopModal />}
          {isMenuOpen && <PauseMenu onQuit={() => setViewState('TITLE')} />}
          <InventorySidebar isOpen={isInventoryOpen} />
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