import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

// --- L0-L1: 新核心组件 (AI 将在 Phase 3 创建这些文件) ---
import { LayeredScene } from '@/components/game/LayeredScene';
import { MiniHUD } from '@/components/game/MiniHUD';
import { MessageWindow } from '@/components/game/MessageWindow';

// --- L2-L3: 模态与覆盖层 ---
import { ShopModal } from '@/components/game/ShopModal';
import { BlackBox } from '@/components/game/BlackBox'; // 档案
import { PauseMenu } from '@/components/game/PauseMenu';
import { DailySettlement } from '@/components/game/DailySettlement';
import { BillOverlay } from '@/components/game/BillOverlay';
import { GameEnding } from '@/components/game/GameEnding';
import { TitleScreen } from '@/components/game/TitleScreen';

// --- L4-L5: 全局效果 ---
import { FeedbackLayer } from '@/components/ui/FeedbackLayer';
import { GlobalAtmosphere } from '@/components/ui/GlobalAtmosphere'; 
import { TooltipLayer } from '@/components/ui/TooltipLayer';

export default function App() {
  const {
    // 基础状态
    day, hp, san, gold,
    _hasHydrated, // 💧 防水闸核心
    
    // 动态状态
    currentEvent, activeBill, ending,
    shopItems, dailySummary,
    isShopOpen,
    
    // Actions
    buyItem, nextDay, chooseOption
  } = useGameStore();
  
  //验证 const [viewState, setViewState] = useState<'TITLE'|'GAME'>('TITLE');
  
  const [viewState, setViewState] = useState<'TITLE'|'GAME'>('GAME');
  
  // UI 显隐状态
  const [showArchive, setShowArchive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDaily, setShowDaily] = useState(false);

  // 🚨 [Strict Hydration Gate]
  // 必须阻断渲染直到 Zustand 从磁盘恢复数据，防止 SAN 值滤镜闪烁
  if (!_hasHydrated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[99999]">
        <div className="text-white font-mono animate-pulse tracking-widest">
          LOADING REALITY...
        </div>
      </div>
    );
  }
  
  // 1. 结局拦截 (优先级最高)
  if (ending) {
    return (
      <>
        <GlobalAtmosphere />
        <GameEnding endingId={ending} onRestart={() => window.location.reload()} />
        <FeedbackLayer />
      </>
    );
  }

  // 2. 标题画面
  if (viewState === 'TITLE') {
    return <TitleScreen onStart={() => setViewState('GAME')} />;
  }

  // 3. 游戏主舞台 (UI Ver 7.0 - Digital Archaeology)
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      
      {/* ==============================
          L5: 全局滤镜与提示 (最顶层) 
         ============================== */}
      <TooltipLayer />
      <GlobalAtmosphere /> {/* 包含 CRT, 噪点, SAN值滤镜 */}

      {/* ==============================
          L4: 数值反馈飘字
         ============================== */}
      <FeedbackLayer />

      {/* ==============================
          L3: 强制覆盖层 (Bill)
         ============================== */}
      {activeBill && (
        <BillOverlay 
          bill={activeBill} 
          onPay={() => {/* 触发支付逻辑，通常在 Store 中处理 */}} 
        />
      )}

      {/* ==============================
          L2: 功能介质窗口 (Modals)
         ============================== */}
      {/* 每日结算 (夜间模式) */}
      {showDaily && dailySummary && (
        <DailySettlement 
          data={dailySummary}
          onNextDay={() => { nextDay(); setShowDaily(false); }} 
        />
      )}
      
      {/* Web 1.0 风格商店 */}
      {isShopOpen && (
        <ShopModal />
      )}
      
      {/* 微缩胶片档案机 */}
      {showArchive && <BlackBox onClose={() => setShowArchive(false)} />}
      
      {/* DOS 风格系统菜单 */}
      <PauseMenu 
        isOpen={showSettings} 
        onResume={() => setShowSettings(false)} 
        onRestart={() => window.location.reload()} 
      />

      {/* ==============================
          L1: 主控台 (HUD & Terminal)
         ============================== */}
      <div className={`relative z-10 transition-all duration-500 ${isShopOpen || showArchive ? 'blur-md scale-95 opacity-50' : ''}`}>
        
        {/* 顶部液晶屏: 显示数值 */}
        <MiniHUD />

        {/* 底部终端: 事件文本与交互 */}
        {/* 仅当没有账单突脸时显示，避免视觉冲突 */}
        {!activeBill && currentEvent && (
          <MessageWindow event={currentEvent} />
        )}
      </div>

      {/* ==============================
          L0: 底层视差画布 (Background)
         ============================== */}
      <div className="absolute inset-0 z-0">
        <LayeredScene 
          // 暂时使用占位图，后续 Task 3.1 会实现动态图片加载逻辑
          bgImage="/assets/scenes/bg_street.png"
          eventImage="/assets/scenes/event_placeholder.png"
          playerImage="/assets/scenes/player_back.png"
          isGlitch={san > 70 || san < 20} // 疯癫或幻觉时触发视觉故障
        />
      </div>

    </div>
  );
}