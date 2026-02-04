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
import { WeeklySettlement } from './components/game/WeeklySettlement'; // ✅ 修正引用
import { FeedbackLayer } from './components/ui/FeedbackLayer';
import { TooltipLayer } from './components/ui/TooltipLayer';
import { PauseMenu } from './components/game/PauseMenu';
import { BlackBox } from './components/game/BlackBox';
import { RoastModal } from './components/game/RoastModal';
import { ClassSelectorModal } from './components/game/ClassSelectorModal';
import { HospitalModal } from './components/game/HospitalModal';

import { MapDashboard } from './components/game/MapDashboard';
import { RegionView } from './components/game/RegionView';
import { HousingModal } from './components/game/HousingModal';
import { CryptoSidebar } from './components/game/Crypto/CryptoSidebar';
import { NewsTicker } from './components/game/Crypto/NewsTicker';
import JailOverlay from './components/game/JailOverlay';

const App: React.FC = () => {
  const { 
    currentEvent, 
    activeBill, 
    ending, 
    weeklyReport,
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
    
    viewMode,
    isCryptoOpen,
    setCryptoOpen,
    crypto, 
    setShopOpen,
    setArchiveOpen,
    setMenuOpen,
    restartGame // ✅ 使用正确的重置方法名
  } = useGameStore();

  const [viewState, setViewState] = useState<'TITLE' | 'SELECT_CLASS' | 'GAME'>('TITLE');
  const [loading, setLoading] = useState(false);

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
    restartGame();
    setViewState('TITLE'); 
  };

  if (loading || !_hasHydrated) return <div className="bg-black text-green-500 p-10 font-mono">LOADING SYSTEM...</div>;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-green-500 font-mono select-none">
      <GlobalAtmosphere />

      {ending ? (
        <GameEnding endingId={ending} onRestart={handleRestart} />
      ) : viewState === 'TITLE' ? (
        <TitleScreen onStart={() => setViewState('SELECT_CLASS')} />
      ) : viewState === 'SELECT_CLASS' ? (
        <ClassSelectorModal onConfirm={() => setViewState('GAME')} />
      ) : (
        <>
           {viewMode === 'MAP' && !currentEvent ? (
            <MapDashboard />
          ) : (
            <RegionView />
          )}

          <MiniHUD />
          {currentEvent && <MessageWindow event={currentEvent} />}
          {activeBill && <BillOverlay bill={activeBill} />}
          <JailOverlay />
          <WeeklySettlement isOpen={!!weeklyReport} />
        </>
      )}

      {/* --- Layer 2: UI & Overlays --- */}

      {/* ✨ 1. 新闻跑马灯 (仅在游戏进行中显示) */}
      {viewState === 'GAME' && !ending && <NewsTicker />}

      {/* ✨ 2. 加密货币侧边栏与悬浮按钮 */}
      {viewState === 'GAME' && !ending && (
        <>
          {/* 左侧悬浮按钮 - 样式增强：灰色背景 + 亮边框 */}
          <button
            onClick={() => setCryptoOpen(true)}
            className={`
              fixed left-0 top-1/2 -translate-y-1/2 z-50
              w-10 h-14 
              bg-gray-900 border-y-2 border-r-2 border-gray-600 rounded-r-xl
              flex items-center justify-center
              hover:w-12 hover:bg-gray-800 hover:border-gray-400
              transition-all duration-200 shadow-[0_0_15px_rgba(0,0,0,0.5)]
              ${crypto.isAccountOpen ? 'text-amber-500 border-amber-800' : 'text-gray-400'}
            `}
          >
            <span className="text-xl font-bold">{crypto.isAccountOpen ? '₿' : '🔒'}</span>
          </button>

          <CryptoSidebar />
          
          {isCryptoOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setCryptoOpen(false)}
            />
          )}
        </>
      )}

      <InventorySidebar />
      
      {isShopOpen && <ShopModal isOpen={isShopOpen} onClose={() => setShopOpen(false)} />}
      {isJobBoardOpen && <JobBoardModal isOpen={isJobBoardOpen} onClose={() => setJobBoardOpen(false)} />}
      {isHousingOpen && <HousingModal isOpen={isHousingOpen} onClose={() => setHousingOpen(false)} />}
      {isHospitalOpen && <HospitalModal isOpen={isHospitalOpen} onClose={() => setHospitalOpen(false)} />}
      
      {isArchiveOpen && <BlackBox onClose={() => setArchiveOpen(false)} />}
      {isMenuOpen && <PauseMenu isOpen={isMenuOpen} onResume={() => setMenuOpen(false)} onRestart={handleRestart} />}

      {/* Layer 3: FX & Feedback */}
      {currentRoast && <RoastModal />}
      <RoutineToast />
      <FeedbackLayer />
      <TooltipLayer />
      
    </div>
  );
};

export default App;