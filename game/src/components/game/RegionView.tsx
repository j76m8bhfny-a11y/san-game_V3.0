import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { LayeredScene } from './LayeredScene'; 
import { RegionID } from '@/types/schema';

// 区域背景图映射
const REGION_BG: Record<RegionID, string> = {
  [RegionID.Slums]: '/assets/scenes/slums.png',
  [RegionID.RustBelt]: '/assets/scenes/rust_belt.png',
  [RegionID.Suburbs]: '/assets/scenes/suburbs.png',
  [RegionID.Downtown]: '/assets/scenes/downtown.png',
};

export const RegionView: React.FC = () => {
  // ✅ 1. 修复：将 nextDay 替换为 nextTurn (对应 GameSlice 定义)
  const { 
    currentRegion, 
    currentEvent, 
    setViewMode, 
    setShopOpen, 
    setJobBoardOpen, 
    setHousingOpen, 
    setHospitalOpen, 
    nextTurn 
  } = useGameStore();

  const bgImage = currentEvent?.bgImage || REGION_BG[currentRegion] || '/assets/scenes/city_morning.png';

  return (
    <div className="relative w-full h-full">
      <LayeredScene 
        bgImage={bgImage}
        eventImage={currentEvent?.eventImage}
        isGlitch={currentEvent?.options?.D?.isGlitched ?? false}
      />

      {!currentEvent && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* 顶部: 返回地图 */}
          <div className="absolute top-24 left-4 pointer-events-auto">
             <button 
               onClick={() => setViewMode('MAP')}
               className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full border border-white/20 transition-all backdrop-blur-sm"
             >
               <span>🗺️</span>
               <span className="font-pixel text-sm">WORLD MAP</span>
             </button>
          </div>

          {/* 底部: 设施按钮组 */}
          <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-4 md:gap-8 pointer-events-auto px-4">
             <FacilityButton icon="🛒" label="SHOP" onClick={() => setShopOpen(true)} color="bg-blue-600" />
             <FacilityButton icon="🏠" label="HOUSING" onClick={() => setHousingOpen(true)} color="bg-green-600" />
             <FacilityButton icon="💼" label="JOBS" onClick={() => setJobBoardOpen(true)} color="bg-amber-600" />
             <FacilityButton icon="🏥" label="CLINIC" onClick={() => setHospitalOpen(true)} color="bg-red-600" />
          </div>

          {/* 中央: 下一回合 (推进回合) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                // ✅ 2. 修复：调用 nextTurn()
                onClick={() => nextTurn()}
                className="
                  pointer-events-auto mt-32
                  group relative px-8 py-3 
                  bg-black/60 backdrop-blur-sm 
                  border border-green-500/50 hover:border-green-400
                  text-green-500 hover:text-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.4)]
                  transition-all duration-300
                "
              >
                <span className="font-pixel text-lg tracking-widest flex items-center gap-2">
                  <span className="animate-pulse">▶</span> NEXT TURN
                </span>
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FacilityButton: React.FC<{ icon: string; label: string; onClick: () => void; color: string }> = ({ icon, label, onClick, color }) => (
  <button
    onClick={() => {
      console.log(`🏠 [DEBUG] FacilityButton clicked: ${label}`);
      onClick();
    }}
    className={`
      flex flex-col items-center gap-2 group
      transform hover:-translate-y-2 transition-transform duration-300
    `}
  >
    <div className={`
      w-14 h-14 md:w-16 md:h-16 rounded-2xl ${color} shadow-lg border-2 border-white/20
      flex items-center justify-center text-2xl md:text-3xl
      group-hover:brightness-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]
      transition-all
    `}>
      {icon}
    </div>
    <span className="font-mono text-xs md:text-sm font-bold text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
      {label}
    </span>
  </button>
);