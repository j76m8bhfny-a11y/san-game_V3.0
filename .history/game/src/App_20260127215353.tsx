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
import { JobBoardModal } from './components/game/JobBoardModal';
import { GlobalAtmosphere } from './components/ui/GlobalAtmosphere';
import { RoutineToast } from './components/ui/RoutineToast';
import { DailySettlement } from './components/game/DailySettlement';
import { FeedbackLayer } from './components/ui/FeedbackLayer';
import { TooltipLayer } from './components/ui/TooltipLayer';
import { PauseMenu } from './components/game/PauseMenu';
import { BlackBox } from './components/game/BlackBox';
import { RoastModal } from './components/game/RoastModal';
import { ClassSelectorModal } from './components/game/ClassSelectorModal';
import { HospitalModal } from './components/game/HospitalModal';

// ✨ 新增组件引入
import { MapDashboard } from './components/game/MapDashboard';
import { RegionView } from './components/game/RegionView';
import { HousingModal } from './components/game/HousingModal';
import { CryptoSidebar } from './components/game/Crypto/CryptoSidebar';
import { NewsTicker } from './components/game/Crypto/NewsTicker';

const App: React.FC = () => {
  const { 
    currentEvent, 
    activeBill, 
    ending, 
    dailySummary,
    _hasHydrated,
    isShopOpen,
    isJobBoardOpen,
    isHousingOpen,
    isHospitalOpen,
    setHospitalOpen,
    setHousingOpen,
    setJobBoardOpen,
    isArchiveOpen,
    isMenuOpen,
    currentRoast,
    initializeData,
    closeDailySummary,
    
    // ✨ 新增 UI 状态
    viewMode, // 'MAP' | 'REGION'
    isCryptoOpen,
    setCryptoOpen,
    crypto, // 获取 crypto 状态以判断是否开户 (显示不同图标)
    setShopOpen,
    setArchiveOpen,
    setMenuOpen
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
      {/* ✨ 挂载 CryptoSidebar */}
      {viewState === 'GAME' && !ending && (
        <>
          {/* 左侧悬浮触发按钮 */}
          <button
            onClick={() => setCryptoOpen(true)}
            className={`
              fixed left-0 top-1/2 -translate-y-1/2 z-40
              w-8 h-12 bg-black border-y border-r border-gray-700 rounded-r-lg
              flex items-center justify-center
              hover:w-10 transition-all duration-200
              ${crypto.isAccountOpen ? 'text-amber-500 border-amber-900' : 'text-gray-600'}
            `}
          >
            <span className="text-lg">{crypto.isAccountOpen ? '₿' : '🔒'}</span>
          </button>

          <CryptoSidebar />
          
          {/* 点击遮罩关闭 Sidebar */}
          {isCryptoOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setCryptoOpen(false)}
            />
          )}
        </>
      )}
      <InventorySidebar />
      {isShopOpen && (
        <ShopModal 
          isOpen={isShopOpen} 
          onClose={() => setShopOpen(false)} 
        />
      )}
      {/* ✨ 挂载 JobBoardModal */}
      {isJobBoardOpen && (
        <JobBoardModal 
          isOpen={isJobBoardOpen} 
          onClose={() => setJobBoardOpen(false)} 
        />
      )}

      {isHousingOpen && (
        <HousingModal 
          isOpen={isHousingOpen} 
          onClose={() => setHousingOpen(false)} 
        />
      )}

      {isArchiveOpen && (
        <BlackBox 
          onClose={() => setArchiveOpen(false)} 
        />
      )}
      {isMenuOpen && (
        <PauseMenu 
          isOpen={isMenuOpen} 
          onResume={() => setMenuOpen(false)} 
          onRestart={handleRestart} 
        />
      )}
      {/* ✨ 挂载 HospitalModal */}
      {isHospitalOpen && (
        <HospitalModal 
          isOpen={isHospitalOpen} 
          onClose={() => setHospitalOpen(false)} 
        />
      )}

      {/* Layer 3: FX & Feedback */}
      {currentRoast && <RoastModal />}
      <RoutineToast />
      <FeedbackLayer />
      <TooltipLayer />
      
    </div>
  );
};

export default App;