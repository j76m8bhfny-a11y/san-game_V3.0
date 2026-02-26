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
import { InsuranceModal } from './components/game/InsuranceModal';
import { SystemGazeOverlay } from './components/SystemGazeOverlay';
import { ArchiveMilestoneModal } from './components/ArchiveMilestoneModal';
import { DeathSummary } from './components/game/DeathSummary';

// UI/交互增强组件
import { AtmosphereOverlay } from './components/ui/AtmosphereOverlay';
import { ResourceHintBar, useResourceHint } from './components/ui/ResourceHint';
import { GlitchUI } from './components/fx/GlitchUI';
import { SystemAlertModal } from './components/ui/SystemAlertModal';
import { useHeartbeat } from './hooks/useHeartbeat';
import { calculateGazeIntensity } from './logic/systemGaze';

// 新手引导系统
import { IntroExperience } from './components/game/IntroExperience';
import { IntroComic } from './components/intro/IntroComic';
import { GuardianHints } from './components/ui/GuardianHints';
import { InsightMilestones } from './components/ui/InsightMilestones';
import { ProgressiveUnlock } from './components/ui/ProgressiveUnlock';
import { ClassChangeModal } from './components/ui/ClassChangeModal';
import { DangerHints } from './components/ui/DangerHints';
import { ModalQueueProvider } from './components/ui/ModalQueueManager';
import { DeathEffectProvider } from './components/ui/DeathEffectPause';

// [NEW] Steam 集成
import { 
  SteamInitializer, 
  AchievementNotification,
  SteamStatusIndicator 
} from './components/steam';
import { useSteamStore } from './store/steam/useSteamStore';
import { useRichPresence } from './hooks/steam';

const App: React.FC = () => {
  // 初始化心跳系统
  useHeartbeat();
  
  // 资源暗示系统
  const { hoveredImpact } = useResourceHint();
  
  // System Alert弹窗状态
  const [systemAlert, setSystemAlert] = useState<{
    isOpen: boolean;
    type: 'irsAudit' | 'creditFreeze' | 'algorithmBan' | 'mediaSmear' | 'generic';
  }>({ isOpen: false, type: 'generic' });
  
  // 开场引导状态
  const [showIntro, setShowIntro] = useState(true);
  const [introCompleted, setIntroCompleted] = useState(false);
  
  // 开场漫画状态
  const [comicCompleted, setComicCompleted] = useState(false);
  const { 
    currentEvent, 
    activeBill, 
    ending, 
    weeklyReport,
    currentCryptoNews,
    hideCryptoNews,
    _hasHydrated,
    unlockedArchives,
    vitality,
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
    isInsuranceOpen,
    setInsuranceOpen,
    
    viewMode,
    isCryptoOpen,
    setCryptoOpen,
    crypto, 
    setShopOpen,
    setArchiveOpen,
    setMenuOpen,
    restartGame,
    showDeathSummary,
    showDeathSummaryView,
    activeHousing,
    pendingClassChanges,
    clearPendingClassChange
  } = useGameStore();

  const [viewState, setViewState] = useState<'TITLE' | 'SELECT_CLASS' | 'GAME'>('TITLE');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // 计算当前Gaze强度
  const gazeIntensity = useMemo(() => 
    calculateGazeIntensity(unlockedArchives?.length || 0),
    [unlockedArchives]
  );

  // [NEW] Steam Rich Presence 自动更新
  const { updateGameState, setMainMenu, setGameOver } = useRichPresence({
    enabled: true,
  });

  // [NEW] 游戏状态变化时更新 Rich Presence
  useEffect(() => {
    if (!ending) {
      const isInEvent = !!currentEvent;
      updateGameState(
        vitality.time.currentTurn,
        (vitality.identity.currentClass as string) || 'homeless',
        isInEvent,
        currentEvent?.title,
        vitality.metrics.gold
      );
    } else {
      setGameOver(vitality.time.currentTurn, (vitality.identity as any).socialClass || 'homeless');
    }
  }, [vitality.time.currentTurn, vitality.identity.currentClass, currentEvent, ending, vitality.metrics.gold]);

  // [NEW] 检查并解锁成就
  const checkAndUnlockAchievements = useSteamStore((state) => state.checkAndUnlockAchievements);
  
  useEffect(() => {
    if (viewState === 'GAME' && !ending) {
      checkAndUnlockAchievements({
        gameDay: vitality.time.currentTurn,
        socialClass: (vitality.identity.currentClass as string) || 'homeless',
        hasDied: false, // TODO: 从游戏状态中获取
        triggeredEvents: [], // TODO: 从游戏状态中获取
        money: vitality.metrics.gold,
        isInEvent: !!currentEvent,
        eventId: currentEvent?.id,
      });
    }
  }, [vitality.time.currentTurn, vitality.identity.currentClass, vitality.metrics.gold, currentEvent, ending]);

  // 视图状态变化时更新 Rich Presence
  useEffect(() => {
    if (viewState === 'TITLE') {
      setMainMenu();
    }
  }, [viewState]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setInitError(null);
      try {
        const [data, _] = await Promise.all([
          loadAllGameData(),
          preloadAllEvents()
        ]);
        
        if (!data) throw new Error("LoadData returned empty result");
        
        initializeData(data);
        console.log("Game Data Loaded Successfully:", data);
      } catch (e: any) {
        console.error("Critical System Failure:", e);
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

  // 错误处理层
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

  // 加载层
  if (loading || !_hasHydrated) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono text-xl animate-pulse">
          INITIALIZING WORLD...
        </div>
      </div>
    );
  }

  // 完成开场引导后的回调
  const handleIntroComplete = () => {
    setIntroCompleted(true);
    setShowIntro(false);
  };
  
  // 开场漫画完成回调
  const handleComicComplete = () => {
    setComicCompleted(true);
    setShowIntro(true);
  };

  return (
    <SteamInitializer
      showLoadingScreen={true}
      onInitialized={(result) => console.log('Steam 初始化成功:', result)}
      onFailed={(error) => console.error('Steam 初始化失败:', error)}
    >
      <DeathEffectProvider>
        <ModalQueueProvider>
          {/* 开场美漫漫画 */}
          {!comicCompleted && (
            <IntroComic onComplete={handleComicComplete} />
          )}
          
          {/* 开场引导体验 */}
          {showIntro && !introCompleted && comicCompleted && (
            <IntroExperience onComplete={handleIntroComplete} />
          )}
          
          <GlitchUI intensity={gazeIntensity}>
            <SystemGazeOverlay>
              <AtmosphereOverlay>
                <div className="relative w-screen h-screen overflow-hidden bg-black text-green-500 font-mono select-none">
                  {/* [NEW] Steam 状态指示器 */}
                  <SteamStatusIndicator
                    currentGameState={{
                      gameDay: vitality.time.currentTurn,
                      socialClass: (vitality.identity.currentClass as string) || 'homeless',
                      money: vitality.metrics.gold,
                      health: vitality.metrics.hp,
                      sanity: vitality.metrics.insight,
                      triggeredEvents: [], // TODO: 从游戏状态中获取
                    }}
                    onLoadSave={(slot) => {
                      // TODO: 实现从云存档加载游戏状态
                      console.log('从云存档加载:', slot);
                    }}
                  />

                  {/* 资源暗示条 */}
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
                  
                  {/* 危险状态文字提示 */}
                  <DangerHints
                    hpPercent={vitality.metrics.hp / vitality.metrics.maxHp}
                    insightPercent={vitality.metrics.insight / vitality.metrics.maxInsight}
                    hungerPercent={vitality.metrics.hunger / vitality.metrics.maxHunger}
                    hasHousing={!!activeHousing}
                    hasInsurance={vitality.activeInsurances.length > 0}
                    activeDiseases={vitality.activeDiseases}
                    isNewPlayer={vitality.time.currentTurn <= 3}
                  />
                  
                  {/* 守护灵新手提示 */}
                  <GuardianHints />
                  
                  {/* 灵视里程碑提示 */}
                  <InsightMilestones />
                  
                  {/* 渐进式机制解锁 */}
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
                          setViewState('GAME');
                        } else {
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

                  {/* Layer 2: UI & Overlays */}

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
      
      {/* 里程碑弹窗 */}
      <ArchiveMilestoneModal />
      
      {/* 死亡结算 */}
      {showDeathSummary && (
        <DeathSummary onRestart={handleRestart} />
      )}
      
      {/* 阶级变化提示 */}
      {pendingClassChanges.length > 0 && (
        <ClassChangeModal
          changes={pendingClassChanges}
          onClose={clearPendingClassChange}
        />
      )}
      
      {/* System Alert弹窗 */}
      <SystemAlertModal
        isOpen={systemAlert.isOpen}
        type={systemAlert.type}
        playerId={(vitality.identity as any).name || 'UNKNOWN'}
        onConfirm={() => setSystemAlert({ ...systemAlert, isOpen: false })}
      />

      {/* [NEW] 成就解锁通知 */}
      <AchievementNotification />
    </SteamInitializer>
  );
};

export default App;
