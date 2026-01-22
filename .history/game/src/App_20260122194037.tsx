import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';

// --- Game Components ---
import TitleScreen from './components/game/TitleScreen';
import LayeredScene from './components/game/LayeredScene';
import GameEnding from './components/game/GameEnding';
import BillOverlay from './components/game/BillOverlay';
import ShopModal from './components/game/ShopModal';
import InventorySidebar from './components/game/InventorySidebar';
import PauseMenu from './components/game/PauseMenu';
import DailySettlement from './components/game/DailySettlement';

// --- UI / FX Components ---
import GlobalAtmosphere from './components/ui/GlobalAtmosphere';
import RoastModal from './components/game/RoastModal';
import RoutineToast from './components/ui/RoutineToast';
import FeedbackLayer from './components/ui/FeedbackLayer';
import TooltipLayer from './components/ui/TooltipLayer';

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
  // 控制是否显示标题画面。
  // 注意：如果已经有存档（比如 day > 0），你可能想在 TitleScreen 里点“继续”直接进入。
  // 这里简化处理，默认先看标题。
  const [viewState, setViewState] = useState<'TITLE' | 'GAME'>('TITLE');

  // --- Initialization ---
  // 核心修复：组件挂载时加载所有 JSON 数据
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // --- Render Helpers ---
  // 防止 Hydration 不匹配（白屏或闪烁）
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
        // 结局画面 (最高优先级内容)
        <GameEnding />
      ) : viewState === 'TITLE' ? (
        // 标题画面
        <TitleScreen onStart={() => setViewState('GAME')} />
      ) : (
        // 游戏主循环画面
        <>
          <LayeredScene />
          
          {/* 游戏内覆盖层 (Modals within game loop) */}
          {activeBill && <BillOverlay />}
          {dailySummary && <DailySettlement />}
        </>
      )}

      {/* L2: 全局功能 UI (商店、侧边栏、菜单) */}
      {/* 这些可以在游戏运行时随时呼出 */}
      {viewState === 'GAME' && !ending && (
        <>
          {isShopOpen && <ShopModal />}
          {isMenuOpen && <PauseMenu onQuit={() => setViewState('TITLE')} />}
          <InventorySidebar isOpen={isInventoryOpen} />
        </>
      )}

      {/* L3: 反馈与特效层 (Toast, Tooltip, Roast) */}
      {/* 这一层永远在最上面，遮挡一切 */}
      <RoastModal />
      <RoutineToast />
      <FeedbackLayer />
      <TooltipLayer />

      {/* L4: CRT 扫描线滤镜 (可选) */}
      <div className="pointer-events-none fixed inset-0 bg-scanlines opacity-10 z-[100]"></div>
    </div>
  );
};

export default App;