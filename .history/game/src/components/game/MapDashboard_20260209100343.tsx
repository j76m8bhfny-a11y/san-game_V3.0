import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { checkMovePermission } from '@/logic/core';
import { MAP_CONFIG } from '@/config/mapConfig';
import { MapPin } from './MapPin'; // 注意引用路径，如果还没创建文件夹可以直接放在同级

export const MapDashboard: React.FC = () => {
  const { 
    currentRegion, 
    vitality, 
    inventory, 
    prison, 
    gameDataCache, 
    setRegion, 
    setViewMode 
  } = useGameStore();

  const currentClass = vitality.identity.currentClass;

  // 权限检查逻辑
  const checkUnlock = (region: RegionID) => {
    if (!gameDataCache || !gameDataCache.itemMap) {
      return { allowed: false, reason: 'LOADING...' };
    }
    return checkMovePermission(
      region, 
      currentClass, 
      inventory, 
      gameDataCache.itemMap, 
      prison.inJail
    );
  };

  return (
    <div className="absolute inset-0 z-10 bg-[#1a1a1a] flex items-center justify-center p-4 sm:p-8 overflow-hidden">
      
      {/* --- 桌面背景 --- */}
      <div className="absolute inset-0 bg-[#0f0f0f]">
        {/* 桌面木纹或暗色背景 */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
      </div>

      {/* --- 地图容器 (固定 16:9 比例) --- */}
      <div className="relative w-full max-w-7xl aspect-video bg-[#e3dac9] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-sm transform rotate-[0.5deg]">
        
        {/* 1. 地图底图 (请替换为你生成的图片 URL) */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-700 hover:scale-[1.02]"
          style={{ 
            backgroundImage: "url('/assets/map_base_v1.jpg')", // TODO: 替换你的图片
            filter: 'sepia(0.3) contrast(1.1) brightness(0.9)' // 复古滤镜
          }} 
        />

        {/* 2. 纸张纹理叠加层 (Multiplying Texture) */}
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-multiply opacity-60 pointer-events-none select-none"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/crinkled-paper.png')" }} // 临时纹理，可用你生成的替换
        />
        
        {/* 3. 光照层 (Vignette) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

        {/* 4. 交互层 */}
        <div className="absolute inset-0 z-10">
          {Object.values(RegionID).map((regionId) => {
            const config = MAP_CONFIG[regionId];
            const isCurrent = currentRegion === regionId;
            const { allowed, reason } = checkUnlock(regionId);

            return (
              <MapPin
                key={regionId}
                config={config}
                isUnlocked={allowed}
                isCurrent={isCurrent}
                lockReason={reason}
                onClick={() => {
                  if (isCurrent) {
                    setViewMode('REGION');
                  } else {
                    setRegion(regionId);
                    setViewMode('REGION');
                  }
                }}
              />
            );
          })}
        </div>

        {/* 装饰：咖啡渍 */}
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-[#4a3b2a] rounded-full mix-blend-multiply opacity-20 blur-sm pointer-events-none" 
             style={{ maskImage: 'radial-gradient(transparent 40%, black 100%)' }} />
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-6 text-white/30 font-mono text-sm tracking-widest">
        USE MOUSE TO SELECT DESTINATION
      </div>
    </div>
  );
};