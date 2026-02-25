import React, { useEffect, useState, useMemo } from 'react';
import { useGameStore } from './store/useGameStore';
import { loadAllGameData } from './utils/dataLoader';
import { preloadAllEvents } from './systems/core/EventSystem';

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
import { DeathSummary } from './components/game/DeathSummary'; // [NEW] 死亡结算

// [NEW] UI/交互增强组件
import { AtmosphereOverlay } from './components/ui/AtmosphereOverlay';
import { ResourceHintBar, useResourceHint } from './components/ui/ResourceHint';
import { GlitchUI } from './components/fx/GlitchUI';
import { SystemAlertModal } from './components/ui/SystemAlertModal';
import { useHeartbeat } from './hooks/useHeartbeat';
import { calculateGazeIntensity } from './logic/systemGaze';

// [NEW] 新手引导系统
import { IntroExperience } from './components/game/IntroExperience';
import { IntroComic } from './components/intro/IntroComic';
import { GuardianHints } from './components/ui/GuardianHints';
import { InsightMilestones } from './components/ui/InsightMilestones';
import { ProgressiveUnlock } from './components/ui/ProgressiveUnlock';
import { ClassChangeModal } from './components/ui/ClassChangeModal';
import { DangerHints } from './components/ui/DangerHints';
import { ModalQueueProvider } from './components/ui/ModalQueueManager';
import { DeathEffectProvider } from './components/ui/DeathEffectPause';


const App: React.FC = () => {
  // [NEW] 初始化心跳系统（危险时播放心跳声）
  useHeartbeat();
  
  // [NEW] 资源暗示系统
  const { hoveredImpact } = useResourceHint();
  
  // [NEW] System Alert弹窗状态
  const [systemAlert, setSystemAlert] = useState<{
    isOpen: boolean;
    type: 'irsAudit' | 'creditFreeze' | 'algorithmBan' | 'mediaSmear' | 'generic';
  }>({ isOpen: false, type: 'generic' });
  
  // [NEW] 开场引导状态
  const [showIntro, setShowIntro] = useState(true);
  const [introCompleted, setIntroCompleted] = useState(false);
  
  // [NEW] 开场漫画状态
  const [comicCompleted, setComicCompleted] = useState(false);
  const { 
    currentEvent, 
    activeBill, 
    ending, 
    weeklyReport,
    currentCryptoNews,
    hideCryptoNews,
    _hasHydrated,
    unlockedArchives, // [NEW] 用于计算Gaze强度
    vitality, // [NEW] 用于ResourceHint
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
    restartGame,
    showDeathSummary,  // [NEW] 死亡结算显示状态
    showDeathSummaryView, // [NEW] 手动显示死亡结算
    activeHousing, // [NEW] 用于DangerHints
    pendingClassChanges, // [NEW] 待处理的阶级变化队列
    clearPendingClassChange // [NEW] 清除阶级变化
  } = useGameStore();

  const [viewState, setViewState] = useState<'TITLE' | 'SELECT_CLASS' | 'GAME'>('TITLE');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // [NEW] 计算当前Gaze强度
  const gazeIntensity = useMemo(() => 
    calculateGazeIntensity(unlockedArchives?.length || 0),
    [unlockedArchives]
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setInitError(null); // 重置错误
      try {
        // ✅ 并行加载游戏数据和事件
        const [data, _] = await Promise.all([
          loadAllGameData(),
          preloadAllEvents() // 预加载所有事件到缓存
        ]);
        
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

  // [NEW] 完成开场引导后的回调
  const handleIntroComplete = () => {
    setIntroCompleted(true);
    setShowIntro(false);
  };
  
  // [NEW] 开场漫画完成回调
  const handleComicComplete = () => {
    setComicCompleted(true);
    // 漫画完成后显示教学引导
    setShowIntro(true);
  };

  return (
    <>
    <DeathEffectProvider>
    <ModalQueueProvider>
    {/* [NEW] 开场美漫漫画 */}
    {!comicCompleted && (
      <IntroComic onComplete={handleComicComplete} />
    )}
    
    {/* [NEW] 开场引导体验 */}
    {showIntro && !introCompleted && comicCompleted && (
      <IntroExperience onComplete={handleIntroComplete} />
    )}
    
    <GlitchUI intensity={gazeIntensity}>
    <SystemGazeOverlay>
    <AtmosphereOverlay>
    <div className="relative w-screen h-screen overflow-hidden bg-black text-green-500 font-mono select-none">
      {/* [NEW] 资源暗示条 */}
      <ResourceHintBar
        hoveredImpact={hoveredImpact}
        currentValues={{
          hp: vitality.metrics.hp,
          maxHp: vitality.metrics.maxHp,
          san: vitality.metrics.insight,
          maxSan: vitality.metrics.maxInsight,
          gold: vitality.metrics.gold,
        }}
      />
      
      {/* [NEW] 危险状态文字提示 */}
      <DangerHints
        hpPercent={vitality.metrics.hp / vitality.metrics.maxHp}
        insightPercent={vitality.metrics.insight / vitality.metrics.maxInsight}
        hungerPercent={vitality.metrics.hunger / vitality.metrics.maxHunger}
        hasHousing={!!activeHousing}
        hasInsurance={vitality.activeInsurances.length > 0}
        activeDiseases={vitality.activeDiseases}
        isNewPlayer={vitality.time.currentTurn <= 3}
      />
      
      {/* [NEW] 守护灵新手提示 */}
      <GuardianHints />
      
      {/* [NEW] 灵视里程碑提示 */}
      <InsightMilestones />
      
      {/* [NEW] 渐进式机制解锁 */}
      <ProgressiveUnlock />
      
      <GlobalAtmosphere />

      {ending ? (
        <GameEnding 
          endingId={ending} 
          onRestart={handleRestart} 
          onViewDeathSummary={showDeathSummaryView}
        />
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
    </AtmosphereOverlay>
    </SystemGazeOverlay>
    </GlitchUI>
    </ModalQueueProvider>
    </DeathEffectProvider>
    
    {/* 里程碑弹窗 - 在SystemGazeOverlay之外 */}
    <ArchiveMilestoneModal />
    
    {/* 死亡结算 - 在SystemGazeOverlay之外 */}
    {showDeathSummary && (
      <DeathSummary onRestart={handleRestart} />
    )}
    
    {/* [NEW] 阶级变化提示 - 队列显示 */}
    {pendingClassChanges.length > 0 && (
      <ClassChangeModal
        changes={pendingClassChanges}
        onClose={clearPendingClassChange}
      />
    )}
    
    {/* [NEW] System Alert弹窗 - 用于Gaze惩罚事件 */}
    <SystemAlertModal
      isOpen={systemAlert.isOpen}
      type={systemAlert.type}
      playerId={(vitality.identity as any).name || 'UNKNOWN'}
      onConfirm={() => setSystemAlert({ ...systemAlert, isOpen: false })}
    />
    </>
  );
};

export default App;