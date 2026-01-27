import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export const MarketChart: React.FC = () => {
  const { crypto } = useGameStore();
  const { priceHistory, btcPrice } = crypto;

  // 计算图表极值
  const min = Math.min(...priceHistory) * 0.95;
  const max = Math.max(...priceHistory) * 1.05;
  const range = max - min;
  
  // 生成 SVG 路径点
  const points = priceHistory.map((price, index) => {
    const x = (index / (priceHistory.length - 1)) * 100;
    const y = 100 - ((price - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const isUp = priceHistory[priceHistory.length - 1] >= priceHistory[0];
  const color = isUp ? '#4ade80' : '#ef4444'; // green-400 : red-500

  return (
    <div className="w-full h-32 bg-black/50 border border-gray-800 rounded p-2 relative overflow-hidden">
      {/* 标题 */}
      <div className="absolute top-2 left-2 z-10">
        <div className="text-[10px] text-gray-500 font-bold">BTC/USD (7D)</div>
        <div className={`text-xl font-mono font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          ${btcPrice.toLocaleString()}
        </div>
      </div>

      {/* SVG Chart */}
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {/* 填充区域 */}
        <path 
          d={`M 0,100 ${points} L 100,100 Z`} 
          fill={color} 
          fillOpacity="0.1" 
        />
        {/* 线条 */}
        <polyline 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          points={points} 
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      {/* 网格线装饰 */}
      <div className="absolute inset-0 border-t border-dashed border-white/5 top-1/2 pointer-events-none"></div>
    </div>
  );
};