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
import { WeeklySettlement } from './components/game/WeeklySettlement'; 
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
import { CryptoNewsPopup } from './components/game/Crypto/CryptoNewsPopup';
import JailOverlay from './components/game/JailOverlay';
import { InsuranceModal } from './components/game/InsuranceModal'; // [NEW] 引入组件
import { SystemGazeOverlay } from './components/SystemGazeOverlay'; // [NEW] 系统凝视
import { ArchiveMilestoneModal } from './components/ArchiveMilestoneModal'; // [NEW] 里程碑弹窗


const App: React.FC = () => {
  const { 
    currentEvent, 
    activeBill, 
    ending, 
    weeklyReport,
    currentCryptoNews,  // 🔴 新增
    hideCryptoNews,     // 🔴 新增
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
    isInsuranceOpen,   // [NEW]
    setInsuranceOpen,  // [NEW]
    
    viewMode,
    isCryptoOpen,
    setCryptoOpen,
    crypto, 
    setShopOpen,
    setArchiveOpen,
    setMenuOpen,
    restartGame 
  } = useGameStore();

  const [viewState, setViewState] = useState<'TITLE' | 'SELECT_CLASS' | 'GAME'>('TITLE');
  const [loading, setLoading] = useState(false);
  // ✨ 新增：错误状态，用于捕获 JSON 加载失败
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setInitError(null); // 重置错误
      try {
        const data = await loadAllGameData();
        // 🛡️ 防御性检查：确保数据不是 undefined
        if (!data) throw new Error("LoadData returned empty result");
        
        initializeData(data);
        console.log("Game Data Loaded Successfully:", data);
      } catch (e: any) {
        console.error("Critical System Failure:", e);
        // ✨ 捕获错误信息并显示在屏幕上
        setInitError(e.message || "Unknown Initialization Error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRestart = () => {
    restartGame();       
    setMenuOpen(false);  
    setViewState('TITLE'); 
  };

  // 🚨 1. 错误处理层 (优先级最高)
  // 如果加载失败，显示红色报错屏幕，而不是白屏
  if (initError) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center p-8 z-50 select-text">
        <h1 className="text-red-600 font-bold text-4xl mb-4 tracking-widest">SYSTEM FAILURE</h1>
        <div className="border border-red-800 bg-red-900/20 p-6 rounded max-w-2xl w-full">
          <p className="text-red-400 font-mono text-lg mb-2">CRITICAL_PROCESS_DIED</p>
          <p className="text-red-500 font-mono break-all">{initError}</p>
        </div>
        <p className="text-gray-500 mt-4 font-mono text-sm">Check console (F12) for detailed stack trace.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-8 py-3 border border-red-600 text-red-600 hover:bg-red-600 hover:text-black font-mono transition-colors uppercase"
        >
          Reboot System / 刷新页面
        </button>
      </div>
    );
  }

  // ⏳ 2. 加载层
  if (loading || !_hasHydrated) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono text-xl animate-pulse">
          INITIALIZING WORLD...
        </div>
      </div>
    );
  }

  return (
    <>
    <SystemGazeOverlay>
    <div className="relative w-screen h-screen overflow-hidden bg-black text-green-500 font-mono select-none">
      <GlobalAtmosphere />

      {ending ? (
        <GameEnding endingId={ending} onRestart={handleRestart} />
      ) : viewState === 'TITLE' ? (
        <TitleScreen 
          onStart={(type: 'NEW' | 'CONTINUE') => {
            if (type === 'CONTINUE') {
              // 继续游戏：直接进入游戏界面
              setViewState('GAME');
            } else {
              // 新游戏：进入选人界面
              setViewState('SELECT_CLASS');
            }
          }} 
        />
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

      {viewState === 'GAME' && !ending && <NewsTicker />}

      {viewState === 'GAME' && !ending && (
        <>
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
      {isInsuranceOpen && (
        <InsuranceModal 
          isOpen={isInsuranceOpen} 
          onClose={() => setInsuranceOpen(false)} 
        />
      )}
      {isHousingOpen && <HousingModal isOpen={isHousingOpen} onClose={() => setHousingOpen(false)} />}
      {isHospitalOpen && <HospitalModal isOpen={isHospitalOpen} onClose={() => setHospitalOpen(false)} />}
      
      {isArchiveOpen && <BlackBox onClose={() => setArchiveOpen(false)} />}
      {isMenuOpen && <PauseMenu isOpen={isMenuOpen} onResume={() => setMenuOpen(false)} onRestart={handleRestart} />}

      {currentRoast && <RoastModal />}
      
      {/* 🔴 调整点3: 加密新闻弹窗 */}
      {currentCryptoNews && (
        <CryptoNewsPopup 
          news={currentCryptoNews} 
          onClose={hideCryptoNews} 
        />
      )}
      
      <RoutineToast />
      <FeedbackLayer />
      <TooltipLayer />
      
    </div>
    </SystemGazeOverlay>
    
    {/* 里程碑弹窗 - 在SystemGazeOverlay之外 */}
    <ArchiveMilestoneModal />
    </>
  );
};

export default App;