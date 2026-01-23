import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { loadAllGameData } from './utils/dataLoader';

// Components
import { TitleScreen } from './components/game/TitleScreen';
import { MiniHUD } from './components/game/MiniHUD';
import { MessageWindow } from './components/game/MessageWindow';
import { BillOverlay } from './components/game/BillOverlay';
import { GameEnding } from './components/game/GameEnding';
import { InventorySidebar } from './components/game/InventorySidebar';
import { ShopModal } from './components/game/ShopModal';
import { GlobalAtmosphere } from './components/ui/GlobalAtmosphere';
import { RoutineToast } from './components/ui/RoutineToast';
import { DailySettlement } from './components/game/DailySettlement';
import { FeedbackLayer } from './components/ui/FeedbackLayer';
import { TooltipLayer } from './components/ui/TooltipLayer';
import { PauseMenu } from './components/game/PauseMenu';
import { BlackBox } from './components/game/BlackBox';
import { RoastModal } from './components/game/RoastModal';
import { ClassSelectorModal } from './components/game/ClassSelectorModal';

// ✨ 新增组件引入
import { MapDashboard } from './components/game/MapDashboard';
import { RegionView } from './components/game/RegionView';

const App: React.FC = () => {
  const { 
    currentEvent, 
    activeBill, 
    ending, 
    dailySummary,
    _hasHydrated,
    isShopOpen,
    isInventoryOpen,
    isArchiveOpen,
    isMenuOpen,
    currentRoast,
    initializeData,
    closeDailySummary,
    
    // ✨ 新增 UI 状态
    viewMode // 'MAP' | 'REGION'
  } = useGameStore();

  const [viewState, setViewState] = useState<'TITLE' | 'SELECT_CLASS' | 'GAME'>('TITLE');
  const [loading, setLoading] = useState(false);

  // 初始化数据
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const data = await loadAllGameData();
        initializeData(data);
        console.log("Game Data Loaded:", data);
      } catch (e) {
        console.error("Failed to load game data", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRestart = () => {
    setViewState('TITLE');
    useGameStore.getState().resetGame();
  };

  if (loading || !_hasHydrated) return <div className="bg-black text-green-500 p-10 font-mono">LOADING SYSTEM...</div>;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-green-500 font-mono select-none">
      <GlobalAtmosphere />

      {/* Layer 1: Main Content */}
      {ending ? (
        <GameEnding endingId={ending} onRestart={handleRestart} />
      ) : viewState === 'TITLE' ? (
        <TitleScreen onStart={() => setViewState('SELECT_CLASS')} />
      ) : viewState === 'SELECT_CLASS' ? (
        <ClassSelectorModal onConfirm={() => setViewState('GAME')} />
      ) : (
        // --- 🎮 GAME LOOP 🎮 ---
        <>
          {/* 视图逻辑：
             1. 如果在 MAP 模式，且没有强制事件 -> 显示地图
             2. 否则 -> 显示 RegionView (它包含了场景和事件弹窗)
             
             注意：如果 currentEvent 存在，我们强制显示 RegionView (因为事件发生在场景里)，
             除非设计上允许在地图上触发事件。这里暂定事件都在场景中。
           */}
           
          {viewMode === 'MAP' && !currentEvent ? (
            <MapDashboard />
          ) : (
            <RegionView />
          )}

          {/* 核心 HUD (始终显示，除非在地图?) 也可以选择在地图隐藏 */}
          <MiniHUD />

          {/* 事件弹窗 (挂载在 RegionView 上方，或者这里全局挂载) */}
          {currentEvent && <MessageWindow event={currentEvent} />}

          {/* 模态覆盖层 */}
          {activeBill && <BillOverlay bill={activeBill} />}
          
          {dailySummary && (
            <DailySettlement isOpen={!!dailySummary} onClose={closeDailySummary} />
          )}
        </>
      )}

      {/* Layer 2: Modals & Sidebars */}
      <InventorySidebar />
      {isShopOpen && <ShopModal />}
      {isArchiveOpen && <BlackBox />}
      {isMenuOpen && <PauseMenu />}
      {/* 预留: HousingModal, JobBoardModal */}

      {/* Layer 3: FX & Feedback */}
      {currentRoast && <RoastModal text={currentRoast} />}
      <RoutineToast />
      <FeedbackLayer />
      <TooltipLayer />
      
    </div>
  );
};

export default App;