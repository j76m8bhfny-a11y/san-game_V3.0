import React from 'react';
import { MapRegionConfig } from '@/config/mapConfig';

interface MapPinProps {
  config: MapRegionConfig;
  isUnlocked: boolean;
  isCurrent: boolean;
  onClick: () => void;
  lockReason?: string;
}

export const MapPin: React.FC<MapPinProps> = ({ 
  config, 
  isUnlocked, 
  isCurrent, 
  onClick,
  lockReason 
}) => {
  return (
    <div
      onClick={isUnlocked || isCurrent ? onClick : undefined}
      className={`absolute group transition-all duration-300 ${!isUnlocked && !isCurrent ? 'cursor-not-allowed grayscale opacity-80' : 'cursor-pointer'}`}
      style={{
        left: `${config.x}%`,
        top: `${config.y}%`,
        width: `${config.width}%`,
        height: `${config.height}%`,
      }}
    >
      {/* 1. 手绘圈注效果 (Current Location) */}
      {isCurrent && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
          <path
            d="M10,10 Q50,-10 90,10 T90,90 T10,90 T10,10"
            fill="none"
            stroke={config.color}
            strokeWidth="4"
            strokeLinecap="round"
            className="animate-draw-circle opacity-80"
            style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }}
          />
        </svg>
      )}

      {/* 2. 悬停高亮区域 (用半透明马克笔涂抹效果) */}
      <div 
        className={`
          absolute inset-0 bg-blend-multiply transition-opacity duration-300 rounded-lg
          ${isCurrent ? 'bg-black/5' : 'group-hover:bg-yellow-100/20'}
        `}
      />

      {/* 3. 区域标签 (像印在地图上的字) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10"
        style={{ transform: `translate(-50%, -50%) rotate(${config.rotation}deg)` }}
      >
        <h2 className={`
          text-3xl font-black font-serif tracking-widest uppercase mb-2
          drop-shadow-sm
          ${isCurrent ? 'text-black scale-110' : 'text-gray-800/60 group-hover:text-black group-hover:scale-105'}
          transition-all duration-300
        `}>
          {config.name}
        </h2>
        
        {/* 锁住状态的印章 */}
        {!isUnlocked && !isCurrent && (
           <div className="border-4 border-red-800 text-red-800 font-bold text-xl px-4 py-2 rotate-12 bg-red-900/10 inline-block mask-stamp">
             RESTRICTED
             <div className="text-xs text-red-900 mt-1 uppercase">{lockReason}</div>
           </div>
        )}

        {/* 当前位置标记 */}
        {isCurrent && (
          <div className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 -rotate-6 shadow-lg">
            YOU ARE HERE
          </div>
        )}
      </div>
    </div>
  );
};