import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { checkMovePermission } from '@/logic/core';

// 区域配置 (仅用于 UI 显示)
const REGION_CONFIG = {
  [RegionID.Slums]: { name: '贫民窟', desc: '混乱与机遇的法外之地', color: 'text-gray-400', border: 'border-gray-600', bg: 'bg-stone-900' },
  [RegionID.RustBelt]: { name: '铁锈区', desc: '被遗忘的工业废墟', color: 'text-orange-700', border: 'border-orange-800', bg: 'bg-orange-950' },
  [RegionID.Suburbs]: { name: '宁静郊区', desc: '中产阶级的虚假乐园', color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-slate-900' },
  [RegionID.Downtown]: { name: '金融核心', desc: '金钱与权力的顶峰', color: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-950' },
};

export const MapDashboard: React.FC = () => {
  const { currentRegion, currentClass, inventory, gameDataCache, attemptMove, setViewMode } = useGameStore();

  // 辅助：检查是否解锁
  const checkUnlock = (region: RegionID) => {
    if (!gameDataCache) return { allowed: false };
    return checkMovePermission(region, currentClass, inventory, gameDataCache.itemMap);
  };

  return (
    <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center p-6">
      <h2 className="text-4xl font-pixel text-green-500 mb-2 tracking-widest glitch-text">WORLD MAP</h2>
      <p className="text-gray-500 font-mono mb-8 text-sm">SELECT DESTINATION</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl h-3/4">
        {Object.values(RegionID).map((regionId) => {
          const config = REGION_CONFIG[regionId];
          const isCurrent = currentRegion === regionId;
          const { allowed, reason } = checkUnlock(regionId);
          
          return (
            <button
              key={regionId}
              onClick={() => {
                if (isCurrent) {
                  setViewMode('REGION'); // 如果点击当前区域，直接返回
                } else {
                  attemptMove(regionId);
                }
              }}
              disabled={!allowed && !isCurrent}
              className={`
                relative p-6 flex flex-col justify-between text-left group transition-all duration-300
                border-2 overflow-hidden
                ${config.bg}
                ${isCurrent ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-[1.02]' : 
                  !allowed ? 'border-gray-800 opacity-60 grayscale cursor-not-allowed' : 
                  `${config.border} hover:scale-[1.02] hover:brightness-110`}
              `}
            >
              {/* 背景纹理 */}
              <div className="absolute inset-0 opacity-20 bg-[url('/assets/noise.png')] pointer-events-none" />

              {/* 头部信息 */}
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                   <h3 className={`text-3xl font-black font-pixel mb-2 ${isCurrent ? 'text-green-400' : config.color}`}>
                     {config.name}
                   </h3>
                   {isCurrent && <span className="bg-green-600 text-black text-xs font-bold px-2 py-1 rounded">CURRENT</span>}
                   {!allowed && !isCurrent && <span className="text-2xl">🔒</span>}
                </div>
                <p className="text-gray-400 font-mono text-sm max-w-[80%]">{config.desc}</p>
              </div>

              {/* 底部状态 */}
              <div className="relative z-10 mt-4">
                 {!allowed && !isCurrent ? (
                   <div className="text-red-500 text-xs font-bold font-mono border border-red-900/50 bg-black/50 p-2 rounded">
                     ⛔ {reason}
                   </div>
                 ) : (
                   <div className={`text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity ${isCurrent ? 'text-green-500' : 'text-white'}`}>
                     {isCurrent ? '▶ CLICK TO ENTER' : '▶ CLICK TO TRAVEL'}
                   </div>
                 )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};